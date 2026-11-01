#!/usr/bin/env python3
"""Safely preview GEIPAN official public case-level CSV metadata. No witness text/coordinates."""
import argparse,csv,io,json,datetime,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'data/historical-news-archive.json'
URL='https://www.cnes-geipan.fr/sites/default/files/Base_de_donn%C3%A9es_des_cas.csv'
INDEX='https://www.cnes-geipan.fr/en/search/cas'
def main():
 p=argparse.ArgumentParser()
 p.add_argument('--offset',type=int,default=0)
 p.add_argument('--limit',type=int,default=500)
 p.add_argument('--apply',action='store_true')
 a=p.parse_args()
 if a.offset<0 or not 1<=a.limit<=5000: p.error('Offset >= 0; limit 1-5000')
 req=urllib.request.Request(URL,headers={'User-Agent':'DisclosureDeskArchive/1.0 (public case index)'})
 with urllib.request.urlopen(req,timeout=65) as response: raw=response.read(20_000_001)
 if len(raw)>20_000_000:raise ValueError('Source oversized; no changes')
 content=raw.decode('utf-8-sig',errors='replace')
 dialect=csv.Sniffer().sniff(content[:15000],delimiters=';,\t')
 reader=csv.DictReader(io.StringIO(content),dialect=dialect)
 required={'id_cas','cas_nom_dossier','cas_AAAA','cas_MM','cas_JJ','cas_classification','cas_public'}
 if not required.issubset(reader.fieldnames or []):raise ValueError('Unexpected source fields')
 rows=list(reader)
 if len(rows)<100:raise ValueError('Unexpectedly few records')
 flags={}
 for row in rows:
  k=(row.get('cas_public') or '').strip().lower()
  flags[k]=flags.get(k,0)+1
 print('Source rows:',len(rows),'publication field counts:',flags)
 if not set(flags).issubset({'o','n','1','0','true','false','oui','non','yes','no'}):
  raise ValueError('Unrecognized publication status; review before importing')
 if not any(x in flags for x in ('o','1','true','oui','yes')):
  raise ValueError('No recognized published-case flags; no import performed')
 # Only explicitly published case rows, with a stable ID and valid date.
 # Do not ever copy cas_resume, cas_resume_web, location, witnesses, or coordinates.
 eligible=[]
 for row in rows:
  if (row.get('cas_public') or '').strip().lower() not in ('1','true','oui','yes','o'):continue
  ident=(row.get('id_cas') or '').strip()
  if not ident or len(ident)>90 or not all(c.isalnum() or c in '-_' for c in ident):continue
  try:
   y=int(row['cas_AAAA']);m=int(row['cas_MM']);d=int(row['cas_JJ'])
   event=datetime.date(y,m,d)
   if not 1900<=y<=2026:continue
  except (ValueError,TypeError,KeyError):continue
  cl=(row.get('cas_classification') or '').strip().upper()
  if not cl or cl[0] not in 'ABCD':continue
  category=cl[0]
  record={'id':'geipan-'+ident,'title':'GEIPAN case '+ident+' — '+event.isoformat(),
   'source':'CNES GEIPAN (official French case dataset)','url':INDEX,
   'year':y,'category':'UAP','kind':'Individual government case-file index',
   'description':'Official GEIPAN public case index. Classification '+category+'; consult GEIPAN for case details. Inclusion is not evidence of an extraordinary object.',
   'dateType':'reported observation date','evidenceStatus':'official public index; classification '+category,
   'caseReference':ident,'classification':category,
   'metadataSource':URL,'country':'France'}
  eligible.append(record)
 ids=[r['id'] for r in eligible]
 if len(ids)!=len(set(ids)):raise ValueError('Duplicate source case IDs')
 current=json.loads(TARGET.read_text(encoding='utf-8'))
 if not isinstance(current,list):raise ValueError('Archive is not a list')
 existing={r['id'] for r in current}
 selected=sorted(eligible,key=lambda r:r['id'])[a.offset:a.offset+a.limit]
 new=[r for r in selected if r['id'] not in existing]
 print('Eligible published and dated rows:',len(eligible),'selected:',len(selected),'new:',len(new),'existing archive:',len(current))
 print('Classification counts:',{k:sum(r['classification']==k for r in eligible) for k in 'ABCD'})
 if not a.apply:print('PREVIEW only; nothing saved.');return
 if not selected:raise ValueError('Empty selected batch; no import')
 result=current+new
 if len({r['id'] for r in result})!=len(result):raise ValueError('Duplicate archive IDs')
 result.sort(key=lambda r:(-int(r.get('year',0)),r['id']))
 TARGET.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Applied new:',len(new),'archive total:',len(result))
if __name__=='__main__':main()
