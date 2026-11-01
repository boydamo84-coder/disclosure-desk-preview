#!/usr/bin/env python3
"""Review and merge official international collection references, not individual map cases."""
import argparse,json,pathlib,urllib.parse
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE=ROOT/'data/imports/reviewed-international-collections-2026-11.json'
TARGET=ROOT/'data/historical-news-archive.json'
def main():
 p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');a=p.parse_args()
 candidates=json.loads(SOURCE.read_text(encoding='utf-8'))
 rows=json.loads(TARGET.read_text(encoding='utf-8'))
 assert isinstance(candidates,list) and isinstance(rows,list)
 known_ids={x.get('id') for x in rows}
 known_urls={x.get('url','').rstrip('/') for x in rows}
 pending=[]
 for row in candidates:
  if not isinstance(row,dict) or any(not row.get(key) for key in ('id','title','source','url','year','kind','description','country','dateType','evidenceStatus')):
   raise ValueError('Incomplete collection metadata')
  if not row['id'].startswith('intl-') or row['kind'] not in ('Government case catalogue','Government records collection'):
   raise ValueError('Not a vetted official collection record')
  u=urllib.parse.urlsplit(row['url'])
  if u.scheme!='https' or u.hostname not in ('www.cnes-geipan.fr','www.gov.br','sefaa.dgac.gob.cl','www.nzdf.mil.nz'):
   raise ValueError('Source domain not approved')
  if row['id'] in known_ids or row['url'].rstrip('/') in known_urls:
   print('Already represented:',row['id']);continue
  known_ids.add(row['id']);known_urls.add(row['url'].rstrip('/'));pending.append(row)
 print('Official archive collections:',len(candidates),'new:',len(pending),'existing records:',len(rows))
 if a.apply and pending:
  merged=rows+pending
  merged.sort(key=lambda x:(-int(x.get('year',0)),x['id']))
  assert len({x['id'] for x in merged})==len(merged)
  TARGET.write_text(json.dumps(merged,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  print('Updated development archive:',len(merged))
 else:print('Preview only; no archive changed.')
if __name__=='__main__':main()
