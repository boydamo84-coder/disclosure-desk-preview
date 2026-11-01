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
# Targeted international English-language searches. Retain the original worldwide
# discovery and label geography only for explicitly country-scoped queries.
REGIONAL_TERMS={
 'Ireland':'UFO UAP Ireland when:7d',
 'France':'UFO UAP France GEIPAN when:7d',
 'Germany':'UFO UAP Germany when:7d',
 'Brazil':'UFO UAP Brazil OVNI when:7d',
 'Mexico':'UFO UAP Mexico OVNI when:7d',
 'Japan':'UFO UAP Japan when:7d',
 'Canada':'UFO UAP Canada when:7d',
 'Australia':'UFO UAP Australia when:7d'
}
# First-party RSS sources, with direct publisher links and optional media thumbnails.
DIRECT_FEEDS={
 'The Debrief':'https://thedebrief.org/feed/',
 'NASA':'https://www.nasa.gov/news-release/feed/',
 'BBC Science':'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml'
}
# Optional official sources: failures are recorded and never block other feeds.
# Feed URLs must be checked against the publisher before being considered operational.
OFFICIAL_FEEDS={
 'CNES GEIPAN':{'url':'https://www.cnes-geipan.fr/fr/rss.xml','country':'France','language':'fr'},
 'UK National Archives':{'url':'https://www.nationalarchives.gov.uk/rss/news.xml','country':'United Kingdom','language':'en'}
}
HEALTH_PATH=pathlib.Path('data/news-feed-health.json')
# Avoid importing unrelated science/technology stories from broad editorial feeds.
TOPIC=re.compile(r'\\b(?:UFOs?|UAPs?|unidentified anomalous phenomena|unidentified flying objects?|AARO|extraterrestrial|alien spacecraft|flying saucer|Pentagon UFO|UFO disclosure|mystery drones?)\\b',re.I)
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
def direct_feed(name,url):
    import xml.etree.ElementTree as ET
    req=urllib.request.Request(url,headers={'User-Agent':'DisclosureDeskNewsMonitor/1.0 (RSS discovery)'})
    with urllib.request.urlopen(req,timeout=14) as response:
        root=ET.fromstring(response.read(1200000))
    added=[]
    for item in root.findall('.//channel/item'):
        title=html.unescape((item.findtext('title') or '').strip())
        summary=html.unescape(re.sub(r'<[^>]+>',' ',item.findtext('description') or ''))
        if not TOPIC.search(title):continue
        article=(item.findtext('link') or '').strip()
        if not article.startswith('https://'):continue
        published=item.findtext('pubDate') or ''
        try:date=email.utils.parsedate_to_datetime(published).astimezone(dt.timezone.utc)
        except Exception:continue
        if not dt.timedelta(0)<=NOW-date<=dt.timedelta(days=MAX_AGE):continue
        image_url=''
        for child in item.iter():
            tag=child.tag.lower()
            link=child.attrib.get('url','')
            if link.startswith('https://') and (tag.endswith('}thumbnail') or tag.endswith('}content') and (child.attrib.get('medium')=='image' or child.attrib.get('type','').startswith('image/')) or tag=='enclosure' and child.attrib.get('type','').startswith('image/')):
                image_url=link;break
        row={'id':hashlib.sha256(article.encode()).hexdigest()[:20],'headline':title[:240],'source':name,
             'url':article,'date':date.isoformat(timespec='seconds'),'category':'UAP','priority':'standard',
             'desc':summary[:280] if summary else 'Read the original source'}
        if not image_url:
            # RSS descriptions may carry their own article thumbnail.
            raw=item.findtext('description') or ''
            match=re.search(r'<img\\b[^>]*\\bsrc\\s*=\\s*["\\'](https://[^"\\']+)',html.unescape(raw),re.I)
            if match:image_url=html.unescape(match.group(1))
        if image_url:row.update(imageUrl=image_url,imageSource=name+' RSS image')
        added.append(row)
    return added

def publisher_image(article_url):
    """Best-effort Open Graph image from an actual publisher page, never a search preview."""
    from html.parser import HTMLParser
    class Images(HTMLParser):
        found=''
        def handle_starttag(self,tag,attrs):
            if tag!='meta' or self.found:return
            props=dict(attrs)
            if (props.get('property') or props.get('name') or '').lower() in ('og:image','twitter:image'):
                self.found=props.get('content','')
    try:
        req=urllib.request.Request(article_url,headers={'User-Agent':'Mozilla/5.0 (compatible; DisclosureDesk/1.0)'})
        with urllib.request.urlopen(req,timeout=5) as resp:
            final=resp.geturl()
            if 'news.google.com/' in urllib.parse.urlparse(final).netloc+urllib.parse.urlparse(final).path:
                return ''
            data=resp.read(180000).decode('utf-8',errors='ignore')
        parser=Images();parser.feed(data)
        image=urllib.parse.urljoin(final,html.unescape(parser.found))
        return image if image.startswith('https://') else ''
    except Exception:return ''

def main():
    old=json.loads(PATH.read_text(encoding='utf-8'))
    if not isinstance(old,list):raise ValueError('Existing catalogue is not a list')
    gathered=[];success=0;errors=[];health=[]
    for term in list(TERMS)+list(REGIONAL_TERMS.values()):
        try:
            result=list(parse(fetch(term)))
            region=next((country for country,query in REGIONAL_TERMS.items() if term==query),None)
            if region:
                for record in result: record['country']=region
            gathered+=result;success+=1
            health.append({'source':'Search: '+(region or term),'status':'ok' if result else 'empty','items':len(result),'latestArticleAt':max((x['date'] for x in result),default=None)})
            print(term,':',len(result),'RSS items; newest:',max((x['date'] for x in result),default='NONE'))
        except Exception as e:
            errors.append(term+': '+str(e));health.append({'source':'Search: '+term,'status':'failed','items':0})
    direct_count=0
    for name,url in DIRECT_FEEDS.items():
        try:
            records=direct_feed(name,url)
            gathered.extend(records);direct_count+=len(records)
            health.append({'source':name,'status':'ok' if records else 'empty','items':len(records),'latestArticleAt':max((x['date'] for x in records),default=None)})
            print('DIRECT RSS',name,':',len(records),'relevant stories')
        except Exception as exc:
            print('WARNING: DIRECT RSS',name,'failed:',type(exc).__name__,str(exc)[:160]);health.append({'source':name,'status':'failed','items':0})
    for name,config in OFFICIAL_FEEDS.items():
        try:
            records=direct_feed(name,config['url'])
            for record in records:
                record.update(country=config['country'],sourceType='official',originalLanguage=config['language'])
            gathered.extend(records)
            health.append({'source':name,'status':'ok' if records else 'empty','items':len(records),'latestArticleAt':max((x['date'] for x in records),default=None)})
        except Exception as exc:
            print('WARNING: official feed',name,'unavailable:',type(exc).__name__,str(exc)[:160])
            health.append({'source':name,'status':'failed','items':0})
    print('Direct publisher feeds contributed',direct_count,'matching stories')
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
    # Decode Google News redirect links in one bounded batch before requesting publisher metadata.
    # Keep original Google link when a decode fails; do not replace it with an unverified URL.
    candidates=[entry for entry in out[:80] if not entry.get('imageUrl')][:24]
    google_links=[entry['url'] for entry in candidates if urllib.parse.urlparse(entry['url']).hostname=='news.google.com']
    resolved={}
    if google_links:
        try:
            from gnews_decoder import decode_many
            resolved=decode_many(google_links,timeout=15.0,concurrency=6)
            print('Google News redirects resolved:',sum(bool(v) for v in resolved.values()),'of',len(google_links))
        except Exception as exc:
            print('WARNING: Google News decoding unavailable:',type(exc).__name__,str(exc)[:180])
    enriched=0;attempted=0;unresolved=0
    for entry in candidates:
        original=entry['url']
        target=resolved.get(original) if original in resolved else original
        if not isinstance(target,str) or not target.startswith('https://') or urllib.parse.urlparse(target).hostname=='news.google.com':
            unresolved+=1
            continue
        attempted+=1
        found=publisher_image(target)
        if found:
            entry['imageUrl']=found
            entry['imageSource']='Publisher Open Graph image'
            enriched+=1
    print('Publisher image extraction:',enriched,'of',attempted,'publisher URLs tested;',unresolved,'redirects unresolved')
    PATH.write_text(json.dumps(out[:500],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    HEALTH_PATH.write_text(json.dumps({'checkedAt':NOW.isoformat(),'sources':health,'storiesPublished':len(out[:500])},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Updated',len(out[:500]),'stories; new last 7 days',recent,'old newest',old[0].get('date') if old else 'none')
    for err in errors:print('WARNING:',err)
if __name__=='__main__':main()
