#!/usr/bin/env python3
"""One-off rolling-year news backfill from attributed publisher RSS results.
Not a complete retrospective archive: Google News search availability varies.
Never fabricates stories, dates, source claims, or historical completeness.
"""
import calendar
import datetime as dt
import json
from pathlib import Path
from update_news_alerts import collect, consolidate, OUT, QUERIES

UTC=dt.timezone.utc
def month_start(year, month):
    return dt.datetime(year,month,1,tzinfo=UTC)
def previous_month(d):
    return month_start(d.year-1,12) if d.month==1 else month_start(d.year,d.month-1)
def main():
    now=dt.datetime.now(UTC)
    cutoff=now-dt.timedelta(days=365)
    start=month_start(cutoff.year,cutoff.month)
    months=[]
    while start<=now:
        nxt=month_start(start.year+1,1) if start.month==12 else month_start(start.year,start.month+1)
        months.append((start,nxt))
        start=nxt
    before=json.loads(OUT.read_text(encoding='utf-8'))
    if not isinstance(before,list):raise ValueError('Current news catalogue is not a list')
    unique={r['id']:r for r in before if isinstance(r,dict) and r.get('id') and r.get('date')}
    errors=0
    received=0
    # Historical Google News RSS supports date-restricted indexed results, but
    # coverage differs by month and publisher: zero results is a valid outcome.
    for start,end in months:
        monthly=0
        qset=[
            '("UFO" OR "UAP" OR "unidentified anomalous phenomena") (government OR Pentagon OR NASA OR military OR hearing)',
            '("UFO" OR "UAP" OR "alien" OR "extraterrestrial") (investigation OR scientist OR evidence OR sighting)',
            '("Skinwalker Ranch" OR "alien abduction" OR "unexplained phenomena" OR "close encounter")',
        ]
        for q in qset:
            query=q+' after:'+start.date().isoformat()+' before:'+end.date().isoformat()
            try:
                found=collect(query)
                for entry in found:
                    published=dt.datetime.fromisoformat(entry['date'].replace('Z','+00:00'))
                    if cutoff<=published<=now and start<=published<end:
                        unique[entry['id']]=entry
                        monthly+=1
                        received+=1
            except Exception as exc:
                errors+=1
                print('Source request failed:',start.strftime('%Y-%m'),str(exc)[:130])
        print(start.strftime('%Y-%m'),':',monthly,'verified matching publisher articles')
    recent=[]
    for r in unique.values():
        try:date=dt.datetime.fromisoformat(r['date'].replace('Z','+00:00'))
        except (ValueError,TypeError,KeyError):continue
        if cutoff<=date<=now and str(r.get('url','')).startswith('https://') and r.get('source') and r.get('headline'):
            recent.append(r)
    result=consolidate(recent)[:1200]
    if len(result)<len(before)//3:
        raise RuntimeError('Unexpectedly lost most catalogue entries: refusing to overwrite')
    tmp=OUT.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    tmp.replace(OUT)
    print('Backfill complete; publisher-matched retrieved:',received,'RSS failures:',errors,'catalogue:',len(result),'previous:',len(before))
    print('Source coverage is NOT guaranteed to include every report from every month.')
if __name__=='__main__':main()
