#!/usr/bin/env python3
"""SEFAA public PDF case references only; no downloaded PDFs, reports or witness details."""
import argparse,collections,json,re,urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote,unquote,urljoin,urlsplit,urlunsplit
ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'data/historical-news-archive.json'
MONTH=re.compile(r'casos?\s+(?:resueltos?\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)',re.I)
NUMBER=re.compile(r'caso[\s_-]*(?:n[°ºo.]*)?[\s_-]*(\d{2,5})(?!\d)',re.I)
class Links(HTMLParser):
 def __init__(self):super().__init__();self.href=None;self.parts=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':self.href=dict(attrs).get('href');self.parts=[]
 def handle_data(self,txt):
  if self.href is not None:self.parts.append(txt)
 def handle_endtag(self,tag):
  if tag=='a' and self.href is not None:self.links.append((' '.join(self.parts).strip(),self.href));self.href=None
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'DisclosureDeskArchiveImport/1.0'})
 with urllib.request.urlopen(req,timeout=22) as response:body=response.read(1_500_001)
 if len(body)>1_500_000:raise ValueError('Oversized source')
 p=Links();p.feed(body.decode('utf-8','replace'));return p.links
def collect():
 pages={};failures=[]
 for year in range(2018,2027):
  try:
   base=f'https://sefaa.dgac.gob.cl/{year}/'
   for title,href in get(base):
    if not MONTH.search(title):continue
    url=urljoin(base,href)
    if urlsplit(url).hostname=='sefaa.dgac.gob.cl':pages[url]=year
  except Exception as exc:failures.append((year,type(exc).__name__))
 cases=collections.defaultdict(set);unknown=0;bad_pages=[]
 for page,year in pages.items():
  try:
   for label,href in get(page):
    url=urljoin(page,href);parts=urlsplit(url)
    if parts.scheme!='https' or parts.hostname!='sefaa.dgac.gob.cl' or not unquote(parts.path).lower().endswith('.pdf'):continue
    match=NUMBER.search(unquote(parts.path.split('/')[-1]))
    if not match:unknown+=1;continue
    clean=urlunsplit((parts.scheme,parts.netloc,quote(unquote(parts.path),safe='/'),parts.query,''))
    cases[match.group(1)].add((clean,year,page))
  except Exception as exc:bad_pages.append((page,type(exc).__name__))
 if bad_pages:raise RuntimeError('Monthly page failures, refusing import: '+str(bad_pages[:5]))
 return pages,cases,unknown,failures
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--apply',action='store_true');args=parser.parse_args()
 pages,cases,unknown,annual_failures=collect()
 existing=json.loads(TARGET.read_text(encoding='utf-8'))
 ids={r['id'] for r in existing}
 records=[]
 for number,links in sorted(cases.items(),key=lambda kv:int(kv[0])):
  # A stable case number may occur in multiple monthly pages.
  source_url,index_year,monthly_page=sorted(links)[0]
  records.append({'id':'sefaa-'+number,'title':'Chile SEFAA published case report '+number,
   'source':'Chile DGAC SEFAA','url':source_url,'year':index_year,
   'category':'UAP','kind':'Individual government case-file reference',
   'description':'Official SEFAA case report PDF linked from its monthly case index. The report\'s findings have not been independently reviewed for this entry.',
   'dateType':'source index publication year (not incident date)',
   'evidenceStatus':'official case-file reference; case conclusion not assessed',
   'caseReference':number,'country':'Chile','metadataSource':monthly_page})
 missing=[r for r in records if r['id'] not in ids]
 print('Monthly indexes:',len(pages),'unique case numbers:',len(cases),'unlabelled PDF links:',unknown)
 print('Repeated case numbers:',sum(len(v)>1 for v in cases.values()))
 print('Annual index access failures:',annual_failures)
 print('Existing archive:',len(existing),'new candidate references:',len(missing))
 print('NOTE: 2019 index inaccessible and PDF contents are not validated individually.')
 if not args.apply:
  print('PREVIEW ONLY: no archive changes');return
 if len(cases)<800 or len(pages)<60:
  raise RuntimeError('Unexpectedly sparse source discovery: refuse bulk import')
 merged=existing+missing
 assert len({r['id'] for r in merged})==len(merged)
 merged.sort(key=lambda r:(-int(r.get('year',0)),r['id']))
 TARGET.write_text(json.dumps(merged,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Imported references:',len(missing),'archive total:',len(merged))
if __name__=='__main__':main()
