#!/usr/bin/env python3
"""Curate approximate town-centre pins for MoD UFO report rows.
Only exact town names in a reviewed allowlist, and only where PDF table
columns are confirmed by their header. No external geocoding or addresses.
"""
import datetime as dt
import io,json,re
from pathlib import Path
import pdfplumber
from import_uk_mod_ufo import source_pdfs,read,DATE,ROOT

OUT=ROOT/'data/disclosure-map.json'
# Approximate town centres, never coordinates from witness statements.
TOWNS={
'belfast':(54.60,-5.93,'Belfast, Northern Ireland'),
'lisburn':(54.51,-6.04,'Lisburn, Northern Ireland'),
'newry':(54.18,-6.34,'Newry, Northern Ireland'),
'derry':(55.00,-7.32,'Derry, Northern Ireland'),
'londonderry':(55.00,-7.32,'Derry, Northern Ireland'),
'armagh':(54.35,-6.65,'Armagh, Northern Ireland'),
'newtownards':(54.59,-5.70,'Newtownards, Northern Ireland'),
'bangor':(54.66,-5.67,'Bangor, Northern Ireland'),
'edinburgh':(55.95,-3.19,'Edinburgh, Scotland'),
'glasgow':(55.86,-4.25,'Glasgow, Scotland'),
'dundee':(56.46,-2.97,'Dundee, Scotland'),
'aberdeen':(57.15,-2.09,'Aberdeen, Scotland'),
'inverness':(57.48,-4.22,'Inverness, Scotland'),
'perth':(56.40,-3.43,'Perth, Scotland'),
'cardiff':(51.48,-3.18,'Cardiff, Wales'),
'swansea':(51.62,-3.94,'Swansea, Wales'),
'newport':(51.59,-2.998,'Newport, Wales'),
'newcastle upon tyne':(54.98,-1.61,'Newcastle upon Tyne, England'),
'leeds':(53.80,-1.55,'Leeds, England'),
'bradford':(53.80,-1.76,'Bradford, England'),
'sheffield':(53.38,-1.47,'Sheffield, England'),
'manchester':(53.48,-2.24,'Manchester, England'),
'liverpool':(53.41,-2.98,'Liverpool, England'),
'birmingham':(52.49,-1.89,'Birmingham, England'),
'coventry':(52.41,-1.51,'Coventry, England'),
'nottingham':(52.95,-1.15,'Nottingham, England'),
'derby':(52.92,-1.47,'Derby, England'),
'leicester':(52.64,-1.13,'Leicester, England'),
'bristol':(51.45,-2.59,'Bristol, England'),
'bath':(51.38,-2.36,'Bath, England'),
'oxford':(51.75,-1.25,'Oxford, England'),
'cambridge':(52.20,0.12,'Cambridge, England'),
'london':(51.51,-0.13,'London, England'),
'brighton':(50.82,-0.14,'Brighton, England'),
'portsmouth':(50.80,-1.09,'Portsmouth, England'),
'southampton':(50.91,-1.40,'Southampton, England'),
'plymouth':(50.38,-4.14,'Plymouth, England'),
'exeter':(50.72,-3.53,'Exeter, England'),
'york':(53.96,-1.08,'York, England'),
'warwick':(52.28,-1.59,'Warwick, England'),
'carterton':(51.76,-1.59,'Carterton, England'),
'porthcawl':(51.48,-3.70,'Porthcawl, Wales'),
'halifax':(53.72,-1.86,'Halifax, England'),
'llandudno':(53.33,-3.83,'Llandudno, Wales'),
'chippenham':(51.46,-2.12,'Chippenham, England'),
'blairgowrie':(56.59,-3.34,'Blairgowrie, Scotland'),
'nuneaton':(52.52,-1.47,'Nuneaton, England'),
'sandbach':(53.14,-2.36,'Sandbach, England'),
'malvern':(52.11,-2.33,'Malvern, England'),
'cardigan':(52.08,-4.66,'Cardigan, Wales'),
'sawtry':(52.43,-0.28,'Sawtry, England'),
'st albans':(51.75,-0.34,'St Albans, England'),
'high wycombe':(51.63,-0.75,'High Wycombe, England')
}
def clean(x):
    return re.sub(r'\s+',' ',str(x or '').replace('\n',' ')).strip()
def date_of(cell,year):
    m=DATE.search(clean(cell))
    if not m:return None
    d=int(m.group(1));month=dt.datetime.strptime(m.group(2)[:3].title(),'%b').month
    y=int(m.group(3));y=y+2000 if y<30 else (y+1900 if y<100 else y)
    try:date=dt.date(y,month,d)
    except ValueError:return None
    return date if date.year==year else None
def run():
    sources=source_pdfs()
    pins=[]
    audit={}
    for year,url in sorted(sources.items()):
        good=0;checked=0
        confirmed_columns=None
        with pdfplumber.open(io.BytesIO(read(url))) as pdf:
            for page_no,page in enumerate(pdf.pages,1):
                for table_no,table in enumerate(page.extract_tables() or []):
                    # A verified header also applies to following pages with the same table shape.
                    head=' '.join(clean(c).lower() for row in table[:3] for c in (row or []))
                    width=max((len(row) for row in table if row),default=0)
                    if 'town' in head and ('area' in head or 'county' in head) and 'date' in head and width>=6:confirmed_columns=width
                    if confirmed_columns is None or width!=confirmed_columns:continue
                    for row_no,row in enumerate(table):
                        if not row or len(row)<5:continue
                        date=date_of(row[0],year)
                        if not date:continue
                        checked+=1
                        town=clean(row[2]).lower()
                        if town not in TOWNS:continue
                        lat,lon,city=TOWNS[town]
                        record_id=f'uk-mod-ufo-{year}-p{page_no}-t{table_no}-r{row_no}'
                        pins.append({
                            'id':'dd-'+record_id,'title':f'MoD UFO report · {city.split(",")[0]} · {date.strftime("%d %b %Y")}',
                            'category':'UAP','city':city,'lat':lat,'lon':lon,
                            'eventDate':date.isoformat(),
                            'desc':'A dated report appears in the UK Ministry of Defence annual sighting log. The pin shows an approximate town centre, not the reported observation position. The report is not proof of an extraordinary explanation.',
                            'source':url+'#page='+str(page_no),
                            'documents':[{'title':'Original MoD sighting log, page '+str(page_no),'publisher':'UK Ministry of Defence / GOV.UK','url':url+'#page='+str(page_no),'kind':'Official report'}],
                            'archiveRecordId':record_id,
                            'locationPrecision':'approximate town centre'
                        })
                        good+=1
        audit[year]={'datedRowsChecked':checked,'locationMatched':good}
        print(year,audit[year],flush=True)
    if not pins:raise RuntimeError('No location-verified source rows; refusing to overwrite map')
    pins={p['id']:p for p in pins}
    previous=json.loads(OUT.read_text('utf-8')) if OUT.exists() else []
    if not isinstance(previous,list):raise ValueError('Invalid existing map data')
    existing={p['id']:p for p in previous if not str(p.get('id','')).startswith('dd-uk-mod-ufo-')}
    existing.update(pins)
    result=list(existing.values())
    tmp=OUT.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n','utf-8')
    tmp.replace(OUT)
    print('Added UK town-level source-linked pins:',len(pins),'Total map feed entries:',len(result))
if __name__=='__main__':run()
