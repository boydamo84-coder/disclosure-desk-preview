#!/usr/bin/env python3
"""Offline development checks for the mobile video UI; no browser network or deployment."""
import html.parser
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
PAGE = ROOT / "index.html"

class ExtractScripts(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.scripts = []
    def handle_starttag(self, tag, attrs):
        if tag == "script":
            attrs = dict(attrs)
            self.in_script = "src" not in attrs and attrs.get("type", "") in ("", "text/javascript", "module")
            if self.in_script:
                self.scripts.append("")
    def handle_endtag(self, tag):
        if tag == "script":
            self.in_script = False
    def handle_data(self, data):
        if self.in_script:
            self.scripts[-1] += data

def main():
    page = PAGE.read_text(encoding="utf-8")
    required = [
        'id="clipGovernment"',
        'id="ddBrowseVideos"',
        'id="ddSwipeVideos"',
        'dd-video-mode-nav',
        'function governmentVideoMatch(',
        'governmentVideoMatch(c,gov)',
        'iframe[data-src]',
        'window.ddVideoGetProgress',
        'window.ddVideoMergeProgress',
        'id="pickerIncludeDiscussion"',
        'data-open-saved-discussion',
        'data-clip-action="discuss"',
        'data-news-comments',
        'assets/inline-news-comments.js',
        'ddGoToDiscussionOrigin',
        'assets/live-hearings.js',
        'assets/watch-read.js',
        'assets/community-test-config.js',
        'data-tab="watchRead"',
        'id="watchRead"',
        'id="ddWatchReadMount"',
        'id="livePage"',
        'id="ddLiveMount"',
        'dd-archive-title-link',
        'dd-archive-actions',
        'scroll-snap-type:y proximity',
        "'video:'+c.id",
        'function openImmersive(resume=false)',
    ]
    missing = [token for token in required if token not in page]
    if missing:
        sys.exit("Missing video features: " + ", ".join(missing))
    parser = ExtractScripts()
    parser.feed(page)
    scripts = [s for s in parser.scripts if s.strip()]
    with tempfile.TemporaryDirectory() as temp:
        for i, script in enumerate(scripts):
            path = pathlib.Path(temp) / f"inline_{i}.js"
            path.write_text(script, encoding="utf-8")
            run = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
            if run.returncode:
                print(run.stderr)
                sys.exit(f"JavaScript syntax error in inline script {i}")
    discussion = ROOT / "assets" / "case-discussions.js"
    if discussion.exists():
        result = subprocess.run(["node", "--check", str(discussion)], capture_output=True, text=True)
        if result.returncode:
            sys.exit("Case discussion syntax failed: " + result.stderr)
        if 'My Profile · My Comments' not in discussion.read_text(encoding='utf-8'):
            sys.exit('My Comments profile missing')
        if 'window.ddOpenCaseDiscussion' not in discussion.read_text(encoding='utf-8'):
            sys.exit('Board discussion opener missing')
        if 'data-case-discussion' not in page:
            sys.exit("Case discussion button missing from case cards")
        print("PASS: Case discussion JS syntax and case button wiring.")
    inline_news = ROOT / "assets" / "inline-news-comments.js"
    if not inline_news.exists():
        sys.exit("Inline news comments script missing")
    syntax = subprocess.run(["node", "--check", str(inline_news)], capture_output=True, text=True)
    if syntax.returncode:
        sys.exit("Inline news comments syntax failed: " + syntax.stderr)
    for token in ["slice(-2)", "dd_case_comments", "dd_case_comment_flags", "aria-expanded", "drafts.set(id", "drafts.get(id"]:
        if token not in inline_news.read_text(encoding="utf-8"):
            sys.exit("Missing inline comments feature: "+token)
    moderator = ROOT / "assets" / "case-comment-moderation.js"
    if moderator.exists():
        result = subprocess.run(["node", "--check", str(moderator)], capture_output=True, text=True)
        if result.returncode:
            sys.exit("Moderator JS syntax failed: " + result.stderr)
        if 'assets/case-comment-moderation.js' not in page:
            sys.exit("Moderator UI script not wired")
        print("PASS: Case moderation JS syntax and wiring.")
    ratings_sql = ROOT / "supabase" / "migrations" / "20261031_watch_read_ratings.sql"
    if not ratings_sql.exists():
        sys.exit("Watch & Read ratings migration missing")
    for token in ["dd_media_votes", "dd_media_ranking()", "primary key(title_id,user_id)"]:
        if token not in ratings_sql.read_text(encoding="utf-8"):
            sys.exit("Watch & Read ratings security/schema missing: "+token)
    test_cfg = ROOT / "assets" / "community-test-config.js"
    if not test_cfg.exists() or "environment: 'test'" not in test_cfg.read_text(encoding="utf-8"):
        sys.exit("Isolated community database configuration missing")
    for path in ["assets/case-discussions.js","assets/case-comment-moderation.js","assets/watch-read.js"]:
        if "DD_COMMUNITY_TEST_CONFIG" not in (ROOT / path).read_text(encoding="utf-8"):
            sys.exit("Community script does not use isolated test configuration: "+path)
    watch = ROOT / "assets" / "watch-read.js"
    if not watch.exists():
        sys.exit("Watch & Read script missing")
    if "ddWatchReadMount" not in watch.read_text(encoding="utf-8"):
        sys.exit("Watch & Read is not mounted on its own page")
    watch_text = watch.read_text(encoding="utf-8")
    for required in ["['podcasts','Podcast Episodes']", "'podcasts','Confessions Of A UFO Insider", "'podcasts','Hollywood, The CIA", "Watch episode", "dd_media_votes", "'media:'+item.id"]:
        if required not in watch_text:
            sys.exit("Watch & Read podcast catalog or interactions missing: " + required)
    if watch_text.count("https://www.youtube.com/watch?v=") < 2:
        sys.exit("Podcast recommendations need individual episode links")
    check = subprocess.run(["node", "--check", str(watch)], capture_output=True, text=True)
    if check.returncode:
        sys.exit("Watch & Read syntax failed: " + check.stderr)
    live = ROOT / "assets" / "live-hearings.js"
    if live.exists():
        result = subprocess.run(["node", "--check", str(live)], capture_output=True, text=True)
        if result.returncode:
            sys.exit("Live hearing syntax failed: " + result.stderr)
        events = ROOT / "data" / "approved-live-events.json"
        if not events.exists():
            sys.exit("Approved hearing events feed missing")
        if "ddLiveMount" not in live.read_text(encoding="utf-8"):
            sys.exit("LIVE hub is not mounted on its dedicated page")
        live_text = live.read_text(encoding="utf-8")
        if "const URL=" in live_text or "const URL =" in live_text:
            sys.exit("LIVE shadows browser URL constructor and breaks all official media validation")
        if "const SUPABASE_URL=" not in live_text:
            sys.exit("LIVE missing explicitly named Supabase URL")
        if "embedUrl:e.embedUrl||bundled.get(e.id)?.embedUrl" not in live_text:
            sys.exit("LIVE embeds are not retained when the fetched events omit them")
        if live_text.count("youtube-nocookie.com/embed/") < 3:
            sys.exit("Missing bundled hearing playback fallback embeds")
        print("PASS: Live hearing JS syntax and curated feed present.")
    print(f"PASS: {len(scripts)} inline JS script(s) parsed; video controls and progress hooks present.")
    print("NOTE: browser runtime, mobile performance, and APK integration are not validated by this test.")

if __name__ == "__main__":
    main()
