#!/usr/bin/env python3
"""Refresh the DEV news snapshot from public Google News RSS, retaining validated history."""
import datetime as dt, email.utils, hashlib, html, json, os, pathlib, re, urllib.parse, urllib.request
PATH=pathlib.Path("data/news-alerts.json")
NOW=dt.datetime.now(dt.timezone.utc)
# Worldwide discovery through English-language editions; not restricted to UK/US stories.
# Native-language ingestion and translations need attribution and a separate review pipeline.
TERMS=[
 'UFO UAP when:7d',
 '"unidentified anomalous phenomena" when:7d',
 'UFO disclosure when:7d',
 'AARO Pentagon UFO when:7d',
 'UFO sightings when:7d',
 'UAP congress hearing when:7d',
 'UFO UAP Brazil Peru Mexico Argentina when:7d',
 'UFO UAP France Germany Italy Spain when:7d',
 'UFO UAP Japan South Korea China India when:7d',
 'UFO UAP Australia New Zealand when:7d',
 'UFO UAP Africa Middle East when:7d',
 'UFO UAP Ireland UK Canada when:7d'
]
MAX_AGE=366
def fetch(query):
    q=urllib.parse.urlencode({'q':query,'hl':'en-GB','gl':'GB','ceid':'GB:en'})
    req=urllib.request.Request('https://news.google.com/rss/search?'+q,headers={'User-Agent':'DisclosureDeskNewsMonitor/1.0 (public RSS)'})
    with urllib.request.urlopen(req,timeout=18) as resp:
        return resp.read()
def parse(xml):
    import xml.etree.ElementTree as ET
    root=ET.fromstring(xml)
    for item in root.findall('.//channel/item'):
        title=html.unescape((item.findtext('title') or '').strip())
        url=(item.findtext('link') or '').strip()
        pub=item.findtext('pubDate') or ''
        try: date=email.utils.parsedate_to_datetime(pub).astimezone(dt.timezone.utc)
        except Exception: continue
        if not title or not url.startswith('https://') or not dt.timedelta(0)<=NOW-date<=dt.timedelta(days=MAX_AGE):continue
        # RSS labels frequently end in " - Publisher".
        head,sep,publisher=title.rpartition(' - ')
        if not sep:head,publisher=title,'Google News RSS'
        # Some publishers expose approved image URLs through RSS media elements.
        # Do not invent an image or treat an illustration as a reported-event photograph.
        image_url=''
        for child in item.iter():
            tag=child.tag.lower()
            candidate=(child.attrib.get('url') or '').strip()
            if candidate.startswith('https://') and (
                tag.endswith('}thumbnail') or tag.endswith('}content') and
                (child.attrib.get('medium')=='image' or child.attrib.get('type','').startswith('image/'))
                or tag=='enclosure' and child.attrib.get('type','').startswith('image/')
            ):
                image_url=candidate
                break
        yield {'id':hashlib.sha256(url.encode()).hexdigest()[:20],'headline':head[:240],
               'source':publisher[:100],'url':url,'date':date.isoformat(timespec='seconds'),
               'category':'UAP','priority':'standard','desc':'Read the source article for details.',
               **({'imageUrl':image_url,'imageSource':'Publisher RSS image'} if image_url else {})}
def main():
    old=json.loads(PATH.read_text(encoding='utf-8'))
    if not isinstance(old,list):raise ValueError('Existing catalogue is not a list')
    gathered=[];success=0;errors=[]
    for term in TERMS:
        try:
            result=list(parse(fetch(term)));gathered+=result;success+=1
            print(term,':',len(result),'RSS items; newest:',max((x['date'] for x in result),default='NONE'))
        except Exception as e:errors.append(term+': '+str(e))
    if not success:raise RuntimeError('All RSS sources failed; existing catalogue left unchanged. '+'; '.join(errors))
    print('RSS searches succeeded:',success,'of',len(TERMS),'total items:',len(gathered))
    seen=set();out=[]
    for item in sorted(gathered+old,key=lambda x:x.get('date',''),reverse=True):
        if not isinstance(item,dict):continue
        url=item.get('url','');key=url.split('?')[0] if url.startswith('https://') else None
        if not key or key in seen or not item.get('headline') or not item.get('date'):continue
        try:age=NOW-dt.datetime.fromisoformat(item['date'].replace('Z','+00:00'))
        except Exception:continue
        if not dt.timedelta(0)<=age<=dt.timedelta(days=MAX_AGE):continue
        seen.add(key);out.append(item)
    if not out:raise RuntimeError('Result empty; refusing to overwrite current catalogue')
    # Sanity checks: do not overwrite an existing useful feed with zero fresh articles.
    recent=sum(1 for x in gathered if (NOW-dt.datetime.fromisoformat(x['date']))<dt.timedelta(days=7))
    if recent==0:raise RuntimeError('RSS provided no articles within 7 days; refusing to present stale data as refreshed')
    freshest=max(dt.datetime.fromisoformat(x['date']) for x in gathered)
    if NOW-freshest>dt.timedelta(hours=72):raise RuntimeError('Newest RSS article is over 72 hours old; source discovery needs repair. Catalogue not overwritten.')
    PATH.write_text(json.dumps(out[:500],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Updated',len(out[:500]),'stories; new last 7 days',recent,'old newest',old[0].get('date') if old else 'none')
    for err in errors:print('WARNING:',err)
if __name__=='__main__':main()
