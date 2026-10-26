#!/usr/bin/env python3
"""Curate source-attributed UAP/world-mystery headlines for optional Android alerts.
Only mainstream publishers; no unsourced headlines and no private information.
"""
import datetime as dt, hashlib, json, pathlib, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"data/news-alerts.json"
QUERIES=[
 '("UAP" OR "UFO") (Pentagon OR Congress OR NASA OR government OR hearing)',
 '("unidentified anomalous phenomena" OR "UFO") (investigation OR official OR report)',
 '("alien" OR "extraterrestrial") (scientists OR space agency OR investigation)'
]
PUBLISHERS=("Reuters","Associated Press","AP News","BBC","The Guardian","Sky News","CNN","ABC News","NBC News","CBS News","The New York Times","The Washington Post","AFP","France 24","Al Jazeera","DW","Euronews","CBC","The Independent")
RELEVANCE=re.compile(r'\b(uap|ufo|unidentified anomalous|unidentified aerial|alien|extraterrestrial)\b',re.I)
MAJOR=re.compile(r'\b(nasa|pentagon|congress|hearing|official|government|military|agency|scientist|report|disclosure|investigation|releases?|reveals?)\b',re.I)
def collect(query):
    url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":query,"hl":"en-GB","gl":"GB","ceid":"GB:en"})
    req=urllib.request.Request(url,headers={"User-Agent":"DisclosureDeskResearch/1.0"})
    with urllib.request.urlopen(req,timeout=20) as res:raw=res.read(1400000)
    root=ET.fromstring(raw)
    now=dt.datetime.now(dt.timezone.utc)
    found=[]
    for item in root.findall(".//item"):
        title=(item.findtext("title") or "").strip()
        link=(item.findtext("link") or "").strip()
        publisher=(item.findtext("source") or "").strip()
        if not any(publisher.casefold()==allowed.casefold() for allowed in PUBLISHERS) or not title or not link.startswith("https://"):continue
        if not RELEVANCE.search(title):continue
        # Broadly relevant mainstream reports are useful in the live feed;
        # stronger priority labels can be applied separately for breaking alerts.
        date=item.findtext("pubDate") or ""
        try:published=parsedate_to_datetime(date).astimezone(dt.timezone.utc)
        except:continue
        if not dt.timedelta(0)<=now-published<=dt.timedelta(days=7):continue
        clean=re.sub(r"\s+-\s+"+re.escape(publisher)+r"$","",title).strip()
        uid=hashlib.sha256((clean.lower()+"|"+publisher).encode()).hexdigest()[:20]
        found.append(dict(id=uid,headline=clean,source=publisher,url=link,date=published.isoformat(),category="UAP",priority=("major" if MAJOR.search(clean) else "standard")) )
    return found
def main():
    unique={}
    # Retain previously collected articles for up to seven days, so a quiet
    # news cycle or temporary RSS outage doesn't blank the live news tab.
    now=dt.datetime.now(dt.timezone.utc)
    try:
        prior=json.loads(OUT.read_text(encoding="utf-8"))
        for entry in prior if isinstance(prior,list) else []:
            published=dt.datetime.fromisoformat(entry["date"].replace("Z","+00:00"))
            if dt.timedelta(0)<=now-published<=dt.timedelta(days=7) and entry.get("id") and entry.get("url","").startswith("https://"):
                unique[entry["id"]]=entry
    except (OSError,ValueError,KeyError,TypeError) as exc:
        print("Previous catalogue unavailable:",type(exc).__name__)
    fetched=0
    for q in QUERIES:
        try:
            for entry in collect(q):
                unique[entry["id"]]=entry
                fetched+=1
        except Exception as e:print("News source unavailable:",str(e)[:130])
    recent=sorted(unique.values(),key=lambda x:x["date"],reverse=True)[:60]
    if not recent:
        print("No eligible sourced reports found within seven days; feed remains empty")
    OUT.write_text(json.dumps(recent,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"Prepared {len(recent)} attributed world-media UAP headlines ({fetched} retrieved in this run)")
if __name__=="__main__":main()
