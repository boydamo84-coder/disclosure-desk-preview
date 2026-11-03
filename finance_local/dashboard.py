#!/usr/bin/env python3
"""BDS Finance L2: synthetic-only, one-session local Termux dashboard.

Security design:
- Existing L1 AES-GCM vault is opened by a hidden Termux prompt; plaintext never
  written to the filesystem by this module.
- On-device web session listens on random port on 127.0.0.1 only, has an unguessable
  per-session bearer key, strict Host/Origin checks, no CORS and no persistent cookies.
- A token fragment is consumed by the page then removed from browser history.
- Single read-only endpoint; no POST, imports, provider credentials or true finance data.
- The vault data and server disappear when the process exits / times out (10m max).
- An authenticated Lock now button revokes the entire server-side session early.

WARNING: L2 preview is for predefined fictional L1 data ONLY. Not audited or
approved for actual personal financial records, taxes or production use.
"""
from __future__ import annotations

import argparse
import datetime as dt
import getpass
import hmac
import json
import secrets
import shutil
import subprocess
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

if __package__:
    from . import vault
else:
    import vault

HOST = '127.0.0.1'
MAX_SESSION_SECONDS = 600
LABEL = 'SYNTHETIC DATA ONLY'

PAGE = r'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>BDS Finance Centre — Private demo</title>
<style>
:root{color-scheme:dark;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;background:#0b1423;color:#e9eff8}
*{box-sizing:border-box}body{margin:0;min-width:320px}.wrap{max-width:1120px;margin:auto;padding:22px 17px 65px}
header{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.logo{border:1px solid #b69357;padding:12px;border-radius:13px;font-size:19px;color:#e9c879;font-weight:900;letter-spacing:-.07em}
h1{margin:0;font-size:clamp(22px,4vw,30px);letter-spacing:-.04em}
.tag{font-size:10px;text-transform:uppercase;letter-spacing:.17em;font-weight:800;color:#c5a260}
small,.muted{color:#aab8cc}.badge{margin-left:auto;border:1px solid #9c804c;background:#33291a;border-radius:99px;padding:7px 11px;color:#f5d798;font-size:12px;font-weight:700}
.notice{border:1px solid #665439;background:#211e1a;border-radius:12px;padding:13px 15px;margin-bottom:16px;color:#ead4a5;font-size:13px}
.filters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:16px 0}
label{color:#b5c6d9;font-size:12px}select{display:block;width:100%;background:#15243a;color:#eef3fa;border:1px solid #465770;border-radius:9px;padding:11px;margin-top:5px;font:inherit}
select:focus-visible{outline:3px solid #e5b860}
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}
.metric,.panel{background:#111f31;border:1px solid #2d4059;border-radius:14px;padding:16px;min-width:0}
.metric span{display:block;color:#aebbce;font-size:12px}.metric strong{font-size:clamp(18px,2.5vw,26px);font-variant-numeric:tabular-nums;letter-spacing:-.04em}
.metric em{display:block;font-size:11px;color:#9aabc1;font-style:normal}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel h2{font-size:16px;margin:0 0 15px}
.bar-item{margin:11px 0}.bar-name{display:flex;justify-content:space-between;gap:8px;font-size:12px;margin-bottom:5px}
.bar-bg{height:8px;border-radius:99px;background:#29394f;overflow:hidden}.bar-fill{height:100%;background:linear-gradient(90deg,#a77e3e,#e0bf7c);border-radius:99px}
.table-scroll{overflow-x:auto}.ledger{margin-top:12px}table{width:100%;min-width:580px;border-collapse:collapse;font-size:13px}
th,td{border-bottom:1px solid #29394b;padding:10px 7px;text-align:left}th{color:#b9c8da;font-size:11px}td:last-child,th:last-child{text-align:right}td:last-child{font-variant-numeric:tabular-nums}
.pos{color:#9ae0c0}.neg{color:#f3afae}.quiet{color:#9eacc2}
footer{border-top:1px solid #30405b;margin-top:21px;padding-top:18px;color:#a7b5ca;font-size:12px}
#status{font-size:12px;color:#d4b876}#status[role=alert]{color:#ffb1b1}
.session-tools{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:12px 0}.session-tools button{padding:9px 15px;border:1px solid #b69357;border-radius:9px;background:#2e2a24;color:#f5dfab;font:inherit;cursor:pointer}.session-tools button:focus-visible{outline:3px solid #e5b860}.session-tools output{font-variant-numeric:tabular-nums;font-size:12px;color:#cbd6e5}
.locked{border:1px solid #5a3434;padding:24px;text-align:center;background:#261c21;border-radius:12px}
.hidden{display:none!important}
@media(max-width:760px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.grid{grid-template-columns:1fr}}
@media(max-width:400px){.wrap{padding:14px 11px}.metric{padding:12px}.badge{margin-left:0}}
</style>
</head>
<body>
<main class="wrap">
<header><div class="logo" aria-hidden="true">BDS</div><div><div class="tag">Boyd Digital Studios</div><h1>Finance Centre</h1><small>Local encrypted vault • sole trader demo</small></div><div class="badge">PRIVATE SAMPLE</div></header>
<div class="notice">Fictional records only. No Ko-fi, AdSense or Google Play accounts are connected. The vault remains encrypted on your phone. This temporary view automatically expires; it is not a real tax calculation.</div>
<div id="status" role="status" aria-live="polite">Unlocking private local view…</div>
<section id="dashboard" class="hidden">
<div class="session-tools"><button id="lockNow" type="button">Lock now</button><output id="sessionLeft" aria-live="off">Session expires in 10:00</output></div>
<div class="filters"><label>UK tax year<select id="year"></select></label><label>BDS product<select id="product"></select></label></div>
<section class="metrics" aria-label="Fictional financial summary">
 <div class="metric"><span>Gross income</span><strong id="income">£0.00</strong><em>Finalised fictional revenue</em></div>
 <div class="metric"><span>Refunds, fees, expenses</span><strong id="costs">£0.00</strong><em>Recognised sample outgoings</em></div>
 <div class="metric"><span>Fictional trading profit</span><strong id="profit">£0.00</strong><em>Excludes estimates and bank transfers</em></div>
 <div class="metric"><span>Estimated personal tax</span><strong>Not available</strong><em>PAYE and HMRC rules not configured</em></div>
</section>
<div class="grid"><section class="panel"><h2>Income sources</h2><div id="bars"></div></section>
<section class="panel"><h2>Accounting treatment</h2><div id="breakdown"></div>
<p class="muted" style="font-size:12px;margin-top:18px">Ad estimates and payout transfers are informational only — not counted twice as new income.</p></section></div>
<section class="panel ledger"><h2>Transaction ledger · <span id="counter"></span></h2><div class="table-scroll"><table><thead><tr><th>Date</th><th>Product</th><th>Source</th><th>Kind</th><th>Description</th><th>£ GBP</th></tr></thead><tbody id="rows"></tbody></table></div></section>
</section>
<div id="locked" class="locked hidden"><h2>Finance Centre locked</h2><p>This temporary session has ended. Return to Termux and start a new dashboard session.</p></div>
<footer>Offline-first, on this device only · no files exported by the dashboard · no external web assets · sample data and temporary session only. Close the browser and press Ctrl+C in Termux to end the session.</footer>
</main>
<script>
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const params=new URLSearchParams(location.hash.replace(/^#/,''));
 let token=params.get('token');
 try{history.replaceState(null,'',location.pathname);}catch(e){}
 let entries=null,locked=false,deadline=0;
 const GBP=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'});
 const cash=n=>GBP.format(n/100);
 const taxYear=s=>{const y=Number(s.slice(0,4)),m=Number(s.slice(5,7)),d=Number(s.slice(8,10));const start=(m>4||(m===4&&d>=6))?y:y-1;return String(start)+'/'+String((start+1)%100).padStart(2,'0')};
 function opt(select,val,text){const o=document.createElement('option');o.value=val;o.textContent=text;select.append(o)}
 function node(tag,text){const e=document.createElement(tag);e.textContent=text;return e}
 function showLocked(msg){
  if(locked)return;
  locked=true;entries=null;token=null;deadline=0;
  $('dashboard').classList.add('hidden');
  // Remove decrypted content from the DOM, not just its visibility. This also
  // prevents accidental browser back/forward snapshot display of old totals.
  for(const id of ['year','product','bars','breakdown','rows'])$(id).replaceChildren();
  for(const id of ['income','costs','profit'])$(id).textContent='—';
  $('counter').textContent='';$('sessionLeft').textContent='Session ended';
  $('locked').classList.remove('hidden');
  $('status').setAttribute('role','alert');$('status').textContent=msg;
 }
 async function lockNow(){
   const t=token;
   // Scrub the browser view immediately, even if the network is unavailable.
   showLocked('Locked by owner. Return to Termux to start another session.');
   if(!t)return;
   try{await fetch('/api/lock',{method:'POST',headers:{Authorization:'Bearer '+t},credentials:'omit',cache:'no-store',redirect:'error'});}catch(e){}
 }
 function tick(){
   if(locked||!deadline)return;
   const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
   $('sessionLeft').textContent='Auto-lock in '+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
   if(seconds===0)showLocked('Session timed out. Decrypted sample data cleared.');
 }
 function bar(host,name,value,max){const row=document.createElement('div');row.className='bar-item';const heading=document.createElement('div');heading.className='bar-name';heading.append(node('span',name),node('strong',cash(value)));const track=document.createElement('div');track.className='bar-bg';const fill=document.createElement('div');fill.className='bar-fill';fill.style.width=(value>0?Math.round(100*value/Math.max(max,1)):0)+'%';track.append(fill);row.append(heading,track);host.append(row)}
 function redraw(){if(!entries)return;
 const yr=$('year').value,pr=$('product').value;
 const rows=entries.filter(e=>taxYear(e.date)===yr&&(pr==='all'||e.product===pr));
 const totals={income:0,refund:0,fee:0,expense:0,estimate:0,payout:0};const sources={};
 rows.forEach(e=>{totals[e.kind]+=e.pence;if(e.kind==='income')sources[e.provider]=(sources[e.provider]||0)+e.pence});
 $('income').textContent=cash(totals.income);
 $('costs').textContent=cash(totals.refund+totals.fee+totals.expense);
 $('profit').textContent=cash(totals.income-totals.refund-totals.fee-totals.expense);
 $('counter').textContent=rows.length+' fictional entries';
 const bars=$('bars');bars.replaceChildren();const src=Object.entries(sources).sort((a,b)=>b[1]-a[1]);if(!src.length)bars.append(node('p','No recognised sample revenue.'));
 const max=Math.max(1,...src.map(x=>x[1]));src.forEach(([label,v])=>bar(bars,label,v,max));
 const breakdown=$('breakdown');breakdown.replaceChildren();for(const [kind,label] of [['refund','Refunds'],['fee','Platform fees'],['expense','Expenses'],['estimate','Estimated ads (excluded)'],['payout','Transfers (excluded)']])bar(breakdown,label,totals[kind],Math.max(1,...Object.values(totals)));
 const tbody=$('rows');tbody.replaceChildren();const sorted=rows.slice().sort((a,b)=>b.date.localeCompare(a.date)||a.ref.localeCompare(b.ref));
 for(const e of sorted){const tr=document.createElement('tr');for(const s of [e.date,e.product,e.provider,e.kind,e.description])tr.append(node('td',s));const td=node('td',(e.kind==='income'?'+':e.kind==='estimate'||e.kind==='payout'?'~':'−')+cash(e.pence));td.className=e.kind==='income'?'pos':e.kind==='estimate'||e.kind==='payout'?'quiet':'neg';tr.append(td);tbody.append(tr)}
 }
 async function start(){if(!/^[a-f0-9]{64}$/.test(token||'')){showLocked('Missing or expired local session key. Return to Termux.');return}
 try{const r=await fetch('/api/ledger',{method:'GET',headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',redirect:'error'});if(!r.ok)throw Error('This local session is unavailable or expired');const data=await r.json();
 if(locked)return;
 if(data.mode!=='synthetic-demo'||!Array.isArray(data.entries)||data.entries.length>100)throw Error('Only synthetic samples are supported');
 entries=data.entries;
 if(!Number.isFinite(data.secondsRemaining)||data.secondsRemaining<1||data.secondsRemaining>600)throw Error('Invalid session expiry');
 deadline=Date.now()+Math.max(0,data.secondsRemaining)*1000;tick();
 const years=Array.from(new Set(entries.map(x=>taxYear(x.date)))).sort().reverse();const yr=$('year');yr.replaceChildren();years.forEach(y=>opt(yr,y,y));if(years.includes('2026/27'))yr.value='2026/27';
 const prod=$('product');prod.replaceChildren();opt(prod,'all','All BDS products');Array.from(new Set(entries.map(x=>x.product))).sort().forEach(p=>opt(prod,p,p));yr.addEventListener('change',redraw);prod.addEventListener('change',redraw);
 $('dashboard').classList.remove('hidden');$('status').textContent='Local encrypted vault unlocked for this temporary session · 10-minute maximum';redraw();
 }catch(e){showLocked('Private session unavailable. Return to Termux to reopen.')}}
 // The server's actual remaining lifetime is returned with the authenticated
 // data. A browser reload cannot reset the ten-minute server deadline.
 setInterval(tick,1000);
 $('lockNow').addEventListener('click',lockNow);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)showLocked('Browser was hidden. Reopen a new session from Termux.')});
 window.addEventListener('pagehide',()=>showLocked('Page closed. Reopen from Termux.'));
 window.addEventListener('pageshow',e=>{if(e.persisted)showLocked('Browser history view locked. Reopen from Termux.')});
 start();
})();
</script>
</body>
</html>'''

CSP = ("default-src 'none'; base-uri 'none'; object-src 'none'; form-action 'none'; "
       "frame-ancestors 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; "
       "connect-src 'self'; img-src 'none'; font-src 'none'")


class DashboardServer(HTTPServer):
    """Single-device, one-session, read-only server. Not a general web backend."""

    def __init__(self, entries: list[dict], *, token: str | None = None,
                 max_seconds: int = MAX_SESSION_SECONDS):
        self.mode = vault.DEMO_MODE
        self.entries = list(entries)
        self.token = token or secrets.token_hex(32)
        self.deadline = time.monotonic() + max_seconds
        super().__init__((HOST, 0), DashboardHandler, bind_and_activate=True)
        self.timeout = 0.4

    @property
    def host_port(self) -> str:
        return f'{HOST}:{self.server_address[1]}'

    @property
    def launch_url(self) -> str:
        # Fragment never reaches an HTTP server and is removed from browser history
        # by dashboard.js on startup. Keep this URL private and NEVER screenshot it.
        return f'http://{self.host_port}/#token={self.token}'

    def get_request(self):
        connection, address = super().get_request()
        # A different Android app must not hold an incomplete HTTP request
        # open forever and defeat the ten-minute session deadline.
        connection.settimeout(3.0)
        return connection, address

    def expired(self) -> bool:
        return time.monotonic() >= self.deadline

    def run(self) -> None:
        try:
            while not self.expired():
                self.handle_request()
        finally:
            self.entries.clear()
            self.token = ''
            self.server_close()


class DashboardHandler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    server: DashboardServer

    def log_message(self, fmt, *args):  # avoid logging personal/session data
        pass

    def reply(self, status: int, data: bytes, mimetype: str) -> None:
        self.send_response(status)
        self.send_header('Content-Type', mimetype)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store, max-age=0, private')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        self.send_header('Content-Security-Policy', CSP)
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(data)
        self.close_connection = True

    def _request_ok(self) -> bool:
        # Same-device private server is not sufficient by itself: other apps can
        # contact 127.0.0.1. Reject DNS rebinding and cross-origin browser requests.
        if self.headers.get('Host') != self.server.host_port:
            self.reply(403, b'Forbidden', 'text/plain; charset=utf-8')
            return False
        if self.headers.get('Origin') not in (None, f'http://{self.server.host_port}'):
            self.reply(403, b'Forbidden', 'text/plain; charset=utf-8')
            return False
        # Chrome may label a Termux-to-browser intent as cross-site.
        # Only the no-data HTML shell may be opened from that navigation;
        # authenticated ledger and lock APIs must still reject cross-site.
        shell_navigation = self.command == 'GET' and self.path == '/'
        if not shell_navigation and self.headers.get('Sec-Fetch-Site') not in (None, 'none', 'same-origin'):
            self.reply(403, b'Forbidden', 'text/plain; charset=utf-8')
            return False
        if self.server.expired():
            self.reply(410, b'Session expired', 'text/plain; charset=utf-8')
            return False
        return True

    def do_GET(self):
        if not self._request_ok():
            return
        if self.path == '/':
            self.reply(200, PAGE.encode('utf-8'), 'text/html; charset=utf-8')
        elif self.path == '/api/ledger':
            bearer = self.headers.get('Authorization', '')
            if not hmac.compare_digest(bearer, f'Bearer {self.server.token}'):
                self.reply(403, b'Forbidden', 'text/plain; charset=utf-8')
                return
            payload = {'mode': self.server.mode, 'version': vault.FORMAT_VERSION, 'entries': self.server.entries,
                       'secondsRemaining': max(1, int(self.server.deadline - time.monotonic()))}
            blob = json.dumps(payload, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
            self.reply(200, blob, 'application/json; charset=utf-8')
        else:
            self.reply(404, b'Not found', 'text/plain; charset=utf-8')

    def do_POST(self):
        if not self._request_ok():
            return
        if self.path != '/api/lock':
            self.reply(405, b'Read-only dashboard', 'text/plain; charset=utf-8')
            return
        bearer = self.headers.get('Authorization', '')
        if not hmac.compare_digest(bearer, f'Bearer {self.server.token}'):
            self.reply(403, b'Forbidden', 'text/plain; charset=utf-8')
            return
        self.reply(200, b'Session locked', 'text/plain; charset=utf-8')
        # Revoke token and decoded records in the already authenticated server.
        # The outer request loop then closes its listener promptly.
        self.server.entries.clear()
        self.server.token = ''
        self.server.deadline = time.monotonic() - 1

    def do_unsupported(self):
        self.reply(405, b'Read-only dashboard', 'text/plain; charset=utf-8')

    do_PUT = do_DELETE = do_PATCH = do_OPTIONS = do_unsupported


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description='BDS L2 private read-only dashboard, fictional data ONLY')
    parser.add_argument('--no-open', action='store_true', help='Print a private URL without launching Android browser')
    args = parser.parse_args(argv)
    try:
        passphrase = getpass.getpass('Vault passphrase (hidden): ')
        data = vault.load(Path.home() / '.bds-finance', passphrase)
        # Only the predefined synthetic L1 data format may be rendered here.
        data = vault._validate_payload(data)
        server = DashboardServer(data['entries'])
        del data, passphrase
        print('BDS Finance Centre — SYNTHETIC DATA ONLY')
        print(f'Private local dashboard at http://{server.host_port}/, expires in 10 minutes.')
        print('No cloud upload, CSV import, external resources, or saved plaintext.')
        print('Press Ctrl+C in Termux to end session immediately.')
        # termux-open-url opens Android Chrome without storing the token in
        # Terminal stdout. If unavailable, print private URL as a fallback.
        opened = False
        if not args.no_open and shutil.which('termux-open-url'):
            try:
                result = subprocess.run(['termux-open-url', server.launch_url],
                                        stdout=subprocess.DEVNULL,
                                        stderr=subprocess.DEVNULL, timeout=7,
                                        check=False)
                opened = result.returncode == 0
            except (OSError, subprocess.TimeoutExpired):
                pass
        if opened:
            print('If your browser did not open: press Ctrl+C, then rerun with --no-open.')
        if not opened:
            print('PRIVATE ONE-TIME URL (do not screenshot or share):')
            print(server.launch_url)
            print('Copy URL into your phone browser. The address disappears after opening.')
        try:
            server.run()
            print('Private dashboard session expired or locked. Vault unchanged.')
        except KeyboardInterrupt:
            server.server_close()
            print('\nPrivate dashboard session closed.')
        return 0
    except (vault.VaultError, OSError) as e:
        print(f'BDS dashboard error: {e}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
