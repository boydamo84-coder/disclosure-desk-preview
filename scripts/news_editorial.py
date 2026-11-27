"""Deterministic research-news guard: no gaming guides, social threads or unattributed syndication.
Keep original source URLs, IDs and original headline when correcting a known spelling error.
The equivalent browser check in index.html also screens older CDN/cache snapshots.
"""
import re
from urllib.parse import urlsplit

OFF_TOPIC = re.compile(r"\b(?:gta(?:\s*[-:]?\s*(?:\d+|vi|v))?|grand theft auto|playstation|xbox|nintendo switch|fortnite|roblox|minecraft|red dead redemption|video[ -]?games?|gaming guides?|quest guides?|walkthroughs?|cheat codes?|ufo moviez|wtf)\b", re.I)
UNSUITABLE_SOURCE = re.compile(r"^(?:x|twitter|facebook|reddit|youtube|instagram|tiktok|threads|discord|google news(?: rss)?|aol(?:\.[a-z.]+)?|yahoo(?: news)?(?: [\w -]+)?|inkl|newsbreak(?::.*)?|newswav|breaking news, latest news and videos|medium|playdayone|softonic|khel now|unboxholics|foro3d|ign|gamespot|kotaku|polygon|game rant|gamerant|pc gamer|eurogamer)$", re.I)
UNSUITABLE_HOSTS = (
    'x.com','twitter.com','t.co','facebook.com','fb.com','reddit.com','redd.it',
    'youtube.com','youtu.be','instagram.com','tiktok.com','threads.net','threads.com',
    'discord.com','discord.gg','aol.com','aol.co.uk','aol.ca','yahoo.com','yahoo.co.uk',
    'inkl.com','newsbreak.com','newswav.com','softonic.com','ign.com','gamespot.com',
    'kotaku.com','polygon.com','gamerant.com','pcgamer.com','eurogamer.net',
)
UNSUITABLE_TYPE = re.compile(r"^(?:social(?:[ _-]media)?|gaming|forum|aggregator|unattributed)$", re.I)


def eligible_headline(headline):
    return isinstance(headline, str) and bool(headline.strip()) and not OFF_TOPIC.search(headline)


def editorial_eligible(row):
    if not isinstance(row, dict) or not eligible_headline(row.get('headline')):
        return False
    source = row.get('source', '')
    if not isinstance(source, str) or not source.strip() or UNSUITABLE_SOURCE.fullmatch(source.strip()):
        return False
    if UNSUITABLE_TYPE.fullmatch(str(row.get('sourceType', '')).strip()):
        return False
    for field in ('url', 'publisherUrl'):
        try:
            host = (urlsplit(row.get(field) or '').hostname or '').lower().rstrip('.')
        except (ValueError, TypeError, AttributeError):
            return False
        if any(host == domain or host.endswith('.'+domain) for domain in UNSUITABLE_HOSTS):
            return False
    return True


def editorial_display(row):
    """Repair this known misspelling without changing reporter attribution or link."""
    headline = row['headline']
    clean = re.sub(r'\bAustrailian\b', lambda m: 'Australian' if m[0][0].isupper() else 'australian', headline, flags=re.I)
    if clean == headline:
        return row
    return {**row, 'headline': clean, 'originalHeadline': row.get('originalHeadline') or headline}


def editorial_rows(rows):
    """Screen nested links independently; retain legitimate alt coverage if primary was removed."""
    for raw in rows:
        if not isinstance(raw, dict):
            continue
        for item in [raw, *(raw.get('relatedCoverage') if isinstance(raw.get('relatedCoverage'), list) else [])]:
            if editorial_eligible(item):
                yield editorial_display({k:v for k,v in item.items() if k != 'relatedCoverage'})
