#!/usr/bin/env python3
"""Import UK MoD individual UFO-log rows from official GOV.UK annual PDFs.
First pass indexes dated PDF table rows; no raw witness narratives or coordinates.
"""
import datetime as dt
import hashlib
import io
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin,urlparse
import pdfplumber

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data/historical-news-archive.json'
INDEX='https://www.gov.uk/government/publications/ufo-reports-in-the-uk'
DATE=re.compile(r'\b(\d{1,2})[-/ ](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/ ,]*(\d{2,4})\b',re.I)
MAX_BYTES=6_000_000

class Links(HTMLParser):
    def __init__(self):
        super().__init__();self.href=None;self.links=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.href=dict(attrs).get('href')
    def handle_data(self,data):
        if self.href and data.strip():self.links.append((data.strip(),self.href))
    def handle_endtag(self,tag):
        if tag=='a':self.href=None

def read(url):
    request=urllib.request.Request(url,headers={'User-Agent':'DisclosureDeskArchive/1.0 (public government document indexing)'})
    with urllib.request.urlopen(request,timeout=40) as response:
        data=response.read(MAX_BYTES+1)
    if len(data)>MAX_BYTES:raise ValueError('PDF exceeds safe import size')
    return data

def source_pdfs():
    parser=Links();parser.feed(read(INDEX).decode('utf-8','replace'))
    found={}
    for title,href in parser.links:
        m=re.fullmatch(r'UFO report (199[7-9]|200\d)',title,re.I)
        if not m:continue
        year=int(m.group(1));url=urljoin(INDEX,href);p=urlparse(url)
        if p.scheme!='https' or p.hostname!='assets.publishing.service.gov.uk' or not p.path.lower().endswith('.pdf'):continue
        found[year]=url
    if len(found)!=13:raise RuntimeError('Expected 13 official annual PDF links, got '+str(sorted(found)))
    return found

def parse_pdf(year,url):
    body=read(url)
    if not body.startswith(b'%PDF'):raise ValueError('Not a PDF')
    records=[]
    with pdfplumber.open(io.BytesIO(body)) as pdf:
        for page_i,page in enumerate(pdf.pages,1):
            # Table extraction respects row boundaries better than whole-page text.
            tables=page.extract_tables() or []
            for table_i,table in enumerate(tables):
                for row_i,row in enumerate(table):
                    if not row:continue
                    first=str(row[0] or '').replace('\n',' ').strip()
                    m=DATE.search(first)
                    if not m:continue
                    day=int(m.group(1));month=dt.datetime.strptime(m.group(2)[:3].title(),'%b').month
                    yr=int(m.group(3));yr=yr+2000 if yr<30 else (yr+1900 if yr<100 else yr)
                    try:event=dt.date(yr,month,day)
                    except ValueError:continue
                    if yr!=year:continue
                    # No freeform location, description, occupation, witness names,
                    # times, streets or precise coordinates are copied into metadata.
                    key=f'{year}-p{page_i}-t{table_i}-r{row_i}'
                    records.append({
                        'id':'uk-mod-ufo-'+key,
                        'title':f'UK Ministry of Defence UFO sighting log — {event.strftime("%d %b %Y")} (entry {row_i+1}, page {page_i})',
                        'source':'UK Ministry of Defence · GOV.UK annual UFO report',
                        'url':url+'#page='+str(page_i),
                        'year':year,
                        'category':'UAP',
                        'kind':'Individual government sighting log entry',
                        'description':'Dated sighting report listed by the UK Ministry of Defence. See the original PDF page for its location and description. A report is not a determination that an unusual object was present.',
                        'dateType':'reported sighting date',
                        'evidenceStatus':'official log of submitted report; explanation not independently established',
                        'metadataCredit':'UK Ministry of Defence / Crown copyright, Open Government Licence',
                        'metadataSource':INDEX
                    })
    return records

def main():
    sources=source_pdfs();all_rows=[]
    for year,url in sorted(sources.items()):
        rows=parse_pdf(year,url);print(year,':',len(rows),'dated table rows')
        all_rows.extend(rows)
    if len(all_rows)<100:raise RuntimeError('Too few rows parsed; archive unchanged')
    previous=json.loads(OUT.read_text(encoding='utf-8'))
    if not isinstance(previous,list):raise ValueError('Existing archive invalid')
    by_id={r['id']:r for r in previous}
    added=0
    for entry in all_rows:
        if entry['id'] not in by_id:by_id[entry['id']]=entry;added+=1
    merged=sorted(by_id.values(),key=lambda x:(-int(x.get('year',0)),x['id']))
    assert len(merged)==len({r['id'] for r in merged})
    tmp=OUT.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(merged,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    tmp.replace(OUT)
    print('MoD dated rows:',len(all_rows),'new:',added,'archive total:',len(merged))
if __name__=='__main__':main()
