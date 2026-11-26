import argparse
import csv
import hashlib
import json
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

parser = argparse.ArgumentParser(description='Build the public PURSUE catalogue from the reviewed government CSV snapshot.')
parser.add_argument('source', type=Path)
args = parser.parse_args()
snapshot = args.source.read_bytes()
expected_sha = 'bae7455d6b5dff3ab84beb22607bc119db27cfb45a2746cec3c39e8a7662b247'
if hashlib.sha256(snapshot).hexdigest() != expected_sha:
    raise SystemExit('CSV checksum differs from the reviewed PURSUE snapshot.')
rows = list(csv.DictReader(snapshot.decode('utf-8-sig').splitlines()))
def iso_date(value):
    year = value.split('/')[-1]
    return datetime.strptime(value, '%m/%d/%Y' if len(year)==4 else '%m/%d/%y').date().isoformat()

dates = sorted({iso_date(row['Release Date']) for row in rows})
relations = {
    'CIA-UAP-015': [['Project Blue Book archive review', '/investigations#blue-book', 'Project Blue Book analysis']],
    'DOW-UAP-D102': [['Project Blue Book archive review', '/investigations#blue-book', 'Blue Book case file']],
    'DOW-UAP-D103': [['Project Blue Book archive review', '/investigations#blue-book', 'Blue Book photograph file']],
    'DOW-UAP-D092': [['Project Blue Book archive review', '/investigations#blue-book', 'Review of the programme']],
    'DOW-UAP-D096': [['Project Blue Book archive review', '/investigations#blue-book', 'Programme correspondence']],
    'DOW-UAP-D097': [['Project Blue Book archive review', '/investigations#blue-book', 'Historical predecessor programme']],
    'DOE-UAP-D005': [['Pantex imagery in Release 02', '/pursue#record-r02-doe-uap-d001', 'Same site, separate catalogue entry']],
    'DOE-UAP-D001': [['2015 Pantex incident report', '/pursue#record-r04-doe-uap-d005', 'Same site, separate catalogue entry']],
    'DOW-UAP-D089': [['Related PURSUE footage', '/pursue#record-r04-dow-uap-pr106', 'Companion material identified by AARO']],
    'DOW-UAP-D090': [['Companion PURSUE footage', '/pursue#record-r04-dow-uap-pr112', 'Companion record in the government catalogue']],
    'DOW-UAP-D091': [['Companion PURSUE footage', '/pursue#record-r04-dow-uap-pr116', 'Companion record in the government catalogue']],
    'DOW-UAP-PR112': [['Range Fouler reporting form', '/pursue#record-r04-dow-uap-d090', 'Companion record in the government catalogue']],
    'DOW-UAP-PR116': [['Range Fouler debrief', '/pursue#record-r04-dow-uap-d091', 'Companion record in the government catalogue']],
    'DOW-UAP-PR106': [['Related Range Fouler debrief', '/pursue#record-r04-dow-uap-d089', 'Companion material identified by AARO']],
}
kind = {'PDF': 'Document', 'VID': 'Video', 'IMG': 'Image', 'AUD': 'Audio'}
records = []
for row in rows:
    title = re.sub(r'\\n|\s+', ' ', row['Title']).strip()
    match = re.match(r'^([A-Z][A-Z0-9]+-UAP-[A-Z]*\d+)(?:[\s,_.-]|$)', title)
    code = match[1] if match else ''
    if not code:
        legacy = re.match(r'^([0-9]+_(?:HS1-)?[0-9]+)(?:_|\s)', title)
        code = legacy[1] if legacy else ''
        if kind[row['Type'].strip()] == 'Video' and not code and row['DVIDS Video ID'].strip():
            code = 'DVIDS ' + row['DVIDS Video ID'].strip()
    release_date = iso_date(row['Release Date'])
    release = dates.index(release_date) + 1
    direct = row['PDF | Image Link'].strip()
    dvids = row['DVIDS Video ID'].strip()
    record_type = kind[row['Type'].strip()]
    if record_type in {'Video', 'Audio'} and dvids.isdigit():
        direct = 'https://www.dvidshub.net/video/' + dvids
    assert urlparse(direct).scheme == 'https' and urlparse(direct).hostname in {'www.war.gov', 'www.dvidshub.net'}, (title, direct)
    slug = f'r{release:02d}-'
    if re.fullmatch(r'[A-Z][A-Z0-9]+-UAP-[A-Z]*\d+', code):
        slug += code.lower()
    else:
        slug += hashlib.sha256((title + '\n' + direct).encode()).hexdigest()[:16]
    if any(r['key'] == slug for r in records):
        slug += '-' + hashlib.sha256(direct.encode()).hexdigest()[:8]
    record = dict(key=slug, identifier=code, title=title, release=release, kind=record_type,
                  agency=row['Agency'].strip(), source=direct)
    for key, field in [('date', 'Incident Date'), ('location', 'Incident Location'), ('virin', 'Image VIRIN')]:
        if row[field].strip() and row[field].strip() != 'N/A':
            record[key] = row[field].strip()
    if code in relations and (release == 4 or code in {'DOE-UAP-D001','CIA-UAP-015','DOW-UAP-D102','DOW-UAP-D103'}):
        record['related'] = relations[code]
    records.append(record)

assert len({r['key'] for r in records}) == len(records)
release_rows = [{'number': i+1, 'date': d} for i,d in enumerate(dates)]
data = {
    'catalogue': 'https://www.war.gov/UFO/',
    'sourceSnapshot': 'https://www.pursueindex.com/methodology/',
    'sourceSha256': hashlib.sha256(snapshot).hexdigest(),
    'releases': release_rows,
    'records': sorted(records, key=lambda r: (-r['release'], r['title'].casefold(), r['key'])),
}
(Path(__file__).resolve().parents[1] / 'data' / 'pursue-index.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n')
