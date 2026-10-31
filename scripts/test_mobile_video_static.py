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
        'function governmentVideoMatch(',
        'governmentVideoMatch(c,gov)',
        'iframe[data-src]',
        'window.ddVideoGetProgress',
        'window.ddVideoMergeProgress',
        'id="pickerIncludeDiscussion"',
        'data-open-saved-discussion',
        'data-clip-action="discuss"',
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
        if 'window.ddOpenCaseDiscussion' not in discussion.read_text(encoding='utf-8'):
            sys.exit('Board discussion opener missing')
        if 'data-case-discussion' not in page:
            sys.exit("Case discussion button missing from case cards")
        print("PASS: Case discussion JS syntax and case button wiring.")
    moderator = ROOT / "assets" / "case-comment-moderation.js"
    if moderator.exists():
        result = subprocess.run(["node", "--check", str(moderator)], capture_output=True, text=True)
        if result.returncode:
            sys.exit("Moderator JS syntax failed: " + result.stderr)
        if 'assets/case-comment-moderation.js' not in page:
            sys.exit("Moderator UI script not wired")
        print("PASS: Case moderation JS syntax and wiring.")
    print(f"PASS: {len(scripts)} inline JS script(s) parsed; video controls and progress hooks present.")
    print("NOTE: browser runtime, mobile performance, and APK integration are not validated by this test.")

if __name__ == "__main__":
    main()
