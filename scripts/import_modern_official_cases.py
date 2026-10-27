#!/usr/bin/env python3
"""Import a curated set of modern, official government UAP case references.

Source records are manually verified references to AARO's public pages.
No precise witness coordinates, addresses, or personal information.
Never replace existing archive entries by ID.
"""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/historical-news-archive.json'
SEED = ROOT / 'data/modern-official-uap-seed.json'
def main():
    incoming=json.loads(SEED.read_text(encoding='utf-8'))
    rows=json.loads(OUT.read_text(encoding='utf-8'))
    assert isinstance(rows,list) and isinstance(incoming,list)
    assert len({r['id'] for r in incoming}) == len(incoming)
    assert all(2016 <= r['year'] <= 2026 and r['url'].startswith('https://www.aaro.mil/') for r in incoming)
    assert all(not any(k in r for k in ('lat','lon','latitude','longitude','street','address')) for r in incoming)
    existing={r['id']:r for r in rows}
    added=0
    for rec in incoming:
        if rec['id'] not in existing:
            existing[rec['id']]=rec
            added+=1
    result=sorted(existing.values(),key=lambda x:(-int(x.get('year',0)),x['id']))
    assert len(result)==len({r['id'] for r in result})
    temp=OUT.with_suffix('.json.tmp')
    temp.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    temp.replace(OUT)
    print(f'Modern AARO reference cases selected: {len(incoming)}; newly added: {added}; archive total: {len(result)}')
if __name__=='__main__':main()
