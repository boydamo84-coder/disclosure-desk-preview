#!/usr/bin/env python3
"""Add verified official UFO/UAP collection-level references without network or invented case data."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data/historical-news-archive.json'
sources=[
 ('uk-mod-ufo-reports','UK Ministry of Defence UFO sighting reports (1997–2009)','UK Ministry of Defence','https://www.gov.uk/government/publications/ufo-reports-in-the-uk',1997,2009,'Government reports collection','Official UK UFO reporting tables for 1997–2009. The dates describe sighting-report coverage, not the webpage publication date.'),
 ('uk-na-ufo-guide','UK National Archives guide to released UFO files','The National Archives (UK)','https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/ufos/',1950,2002,'Government archive index','Guide to UK government files on sightings, policy, Parliamentary business, and correspondence. Record coverage is approximate; individual files have their own dates.'),
 ('uk-na-ufo-collection','UK National Archives UFO reports and government documents','The National Archives (UK)','https://www.nationalarchives.gov.uk/explore-the-collection/explore-by-time-period/postwar/ufo-reports/',1950,1995,'Government records collection','Source-linked exhibition of released UK UFO documents and archival catalogue references. Years indicate broad collection coverage, not a specific incident.'),
 ('us-na-bluebook-admin','Project Blue Book administrative files (1947–1969)','US National Archives','https://www.archives.gov/research/topics/uaps/textual-and-microfilm',1947,1969,'Government archive series','Official archive series 595175. Administrative records, not individual verified sightings.'),
 ('us-na-bluebook-cases','Project Blue Book case files (1947–1969)','US National Archives','https://www.archives.gov/research/catalog/catalog-bulk-downloads/uap-bulk-download',1947,1969,'Government archive series','Official archive series 595466: historical case-file collection. Source lists available metadata and downloads.'),
 ('us-na-bluebook-sanitized','Sanitized Project Blue Book sighting case files (1947–1969)','US National Archives','https://www.archives.gov/research/topics/uaps/textual-and-microfilm',1947,1969,'Government archive series','Official archive series 597821; individual case dates vary.'),
 ('us-na-air-intelligence','US Air Intelligence Reports (1948–1953)','US National Archives','https://www.archives.gov/research/topics/uaps/textual-and-microfilm',1948,1953,'Government archive series','Official archive series 23857122. Archived reports; not all necessarily describe anomalous craft.'),
 ('us-na-4602d-squadron','4602D Air Intelligence Service Squadron UFO case-file copies (1954–1956)','US National Archives','https://www.archives.gov/research/topics/uaps/textual-and-microfilm',1954,1956,'Government archive series','Official archive series 23857158. Copies of sightings case files.'),
 ('us-na-ufo-1953','US UFO sightings case files (1953–1960)','US National Archives','https://www.archives.gov/research/topics/uaps/textual-and-microfilm',1953,1960,'Government archive series','Official archive series 23857159. Records of investigated sightings; conclusions vary.'),
 ('us-na-roswell-files','Roswell Report source files (1987–1996)','US National Archives','https://www.archives.gov/research/topics/uaps/textual-and-microfilm',1987,1996,'Government archive series','Official archive series 17618564, materials assembled for later historical research about the 1947 Roswell incident; years refer to source-file series dates.'),
 ('us-na-bluebook-film','Project Blue Book motion picture films (1950–1966)','US National Archives','https://www.archives.gov/research/topics/uaps/rg-collections',1950,1966,'Government archive series','Official archive series 61934, motion picture material associated with Project Blue Book.'),
 ('us-na-bluebook-audio','Project Blue Book investigation sound recordings (1953–1967)','US National Archives','https://www.archives.gov/research/topics/uaps/rg-collections',1953,1967,'Government archive series','Official archive series 1142703, historical audio recordings associated with investigations.')
]
def main():
    existing=json.loads(OUT.read_text(encoding='utf-8'))
    assert isinstance(existing,list)
    ids={r['id'] for r in existing}
    count=0
    for key,title,source,url,year,end,kind,description in sources:
        assert url.startswith('https://') and 1947<=year<=end<=2026
        if key in ids:continue
        existing.append({'id':key,'title':title,'source':source,'url':url,'year':year,
           'endYear':end,'category':'UAP','kind':kind,'description':description,
           'dateType':'archive record coverage','evidenceStatus':'official collection; individual claims not independently verified'})
        count+=1
    assert len({r['id'] for r in existing})==len(existing)
    if count:
        existing.sort(key=lambda r:(-int(r.get('year',0)),r['id']))
        temp=OUT.with_suffix('.json.tmp')
        temp.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        temp.replace(OUT)
    print(f'Added {count} official UK/US archive collections; archive now {len(existing)} source-linked entries.')
if __name__=='__main__':main()
