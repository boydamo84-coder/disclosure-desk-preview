#!/usr/bin/env python3
"""Discover explicitly dated official UAP hearings/events from published Event JSON-LD.
No inferred release dates. Unavailable sources leave the previous verified list intact.
"""
import datetime as dt
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/"data/upcoming-disclosure-events.json"
OFFICIAL=[
 ("US House Oversight", "https://oversight.house.gov/"),
 ("US Senate Armed Services", "https://www.armed-services.senate.gov/hearings"),
 ("AARO", "https://www.aaro.mil/"),
]
UAP=re.compile(r"\b(uap|ufo|unidentified anomalous|unidentified aerial|anomalous phenomena|aerial phenomena|disclosure)\b",re.I)
class Extract(HTMLParser):
 def __init__(self):
  super().__init__();self.tag=None;self.chunks=[];self.buffer=[]
 def handle_starttag(self,tag,attrs):
  if tag=="script" and dict(attrs).get("type","").lower()=="application/ld+json":self.tag=tag;self.buffer=[]
 def handle_data(self,text):
  if self.tag:self.buffer.append(text)
 def handle_endtag(self,tag):
  if tag=="script" and self.tag:self.chunks.append("".join(self.buffer));self.tag=None
def walk(node):
 if isinstance(node,list):
  for x in node:yield from walk(x)
 elif isinstance(node,dict):
  yield node
  for k in ("@graph","mainEntity","itemListElement"):
   if k in node:yield from walk(node[k])
def check(url,agency):
 req=urllib.request.Request(url,headers={"User-Agent":"DisclosureDeskEventDiscovery/1.0"})
 with urllib.request.urlopen(req,timeout=16) as response:
  final=response.geturl()
  if urlparse(final).hostname!=urlparse(url).hostname:raise ValueError("Unexpected redirect")
  body=response.read(1_500_000).decode("utf-8","replace")
 p=Extract();p.feed(body)
 events=[]
 for chunk in p.chunks:
  try:data=json.loads(chunk)
  except json.JSONDecodeError:continue
  for event in walk(data):
   typ=event.get("@type",[])
   if isinstance(typ,str):typ=[typ]
   if "Event" not in typ and "PublicationEvent" not in typ:continue
   title=str(event.get("name","")).strip()
   if not UAP.search(title+" "+str(event.get("description",""))):continue
   raw=event.get("startDate")
   if not isinstance(raw,str):continue
   try:
    starts=dt.datetime.fromisoformat(raw.replace("Z","+00:00"))
    if starts.tzinfo is None:continue
   except ValueError:continue
   if starts<=dt.datetime.now(dt.timezone.utc):continue
   source=event.get("url") or url
   if not isinstance(source,str) or urlparse(source).hostname!=urlparse(url).hostname:continue
   key=agency.lower().replace(" ","-")+"-"+starts.strftime("%Y%m%d%H%M")+"-"+re.sub("[^a-z0-9]+","-",title.lower())[:45]
   events.append({"id":key,"title":title[:180],"agency":agency,"startsAt":starts.isoformat(),"sourceUrl":source,"status":"confirmed"})
 return events
def main():
 existing=json.loads(OUTPUT.read_text(encoding="utf-8"))
 verified={x["id"]:x for x in existing if isinstance(x,dict) and x.get("status")=="confirmed"}
 reachable=0
 for agency,url in OFFICIAL:
  try:
   results=check(url,agency);reachable+=1
   for e in results:verified[e["id"]]=e
   print(agency+": "+str(len(results))+" dated UAP events")
  except Exception as exc:print(agency+": unavailable ("+str(exc)[:130]+")")
 if not reachable:raise SystemExit("No official feeds reachable; retaining previous event catalogue")
 now=dt.datetime.now(dt.timezone.utc)
 future=[x for x in verified.values() if dt.datetime.fromisoformat(x["startsAt"])>now-dt.timedelta(hours=1)]
 future.sort(key=lambda x:x["startsAt"])
 content=json.dumps(future[:100],indent=2,ensure_ascii=False)+"\n"
 if content!=OUTPUT.read_text(encoding="utf-8"):OUTPUT.write_text(content,encoding="utf-8")
 print("Confirmed future events: "+str(len(future)))
if __name__=="__main__":main()
