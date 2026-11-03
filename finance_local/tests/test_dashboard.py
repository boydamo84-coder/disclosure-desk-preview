"""Synthetic local-only L2 dashboard security and integration tests."""
import http.client
import json
import os
from pathlib import Path
import re
import tempfile
import threading
import time
import unittest
from unittest import mock
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from finance_local import dashboard, vault

PASS = 'fictional-strong-passphrase-only'


class PrivateDashboardTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.root = Path(self.folder.name) / '.bds-finance'
        vault.init(self.root, PASS)
        self.assertEqual(vault.fill_demo(self.root, PASS), 10)
        self.data = vault.load(self.root, PASS)
        self.server = dashboard.DashboardServer(self.data['entries'], max_seconds=35)
        self.thread = threading.Thread(target=self.server.run, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.deadline = time.monotonic() - 1
        # handle_request() timeout means join stays bounded.
        self.thread.join(timeout=4)
        self.server.server_close()
        self.folder.cleanup()
        self.assertFalse(self.thread.is_alive(), 'Local session must close after expiry')

    def request(self, path, *, token=None, headers=None, method='GET'):
        hdrs = dict(headers or {})
        if token is not None:
            hdrs['Authorization'] = 'Bearer ' + token
        if method != 'GET':
            req = Request('http://'+self.server.host_port+path, data=b'test',
                          headers=hdrs, method=method)
        else:
            req = Request('http://'+self.server.host_port+path, headers=hdrs)
        try:
            with urlopen(req, timeout=4) as resp:
                return resp.status, resp.headers, resp.read()
        except HTTPError as e:
            return e.code, e.headers, e.read()

    def test_ephemeral_loopback_binding_and_unpredictable_fragment(self):
        self.assertEqual(self.server.server_address[0], '127.0.0.1')
        self.assertNotEqual(self.server.server_address[1], 80)
        self.assertRegex(self.server.token, r'^[a-f0-9]{64}$')
        self.assertIn('#token=', self.server.launch_url)
        self.assertNotIn('?', self.server.launch_url)
        self.assertNotIn(self.server.token, dashboard.PAGE)
        self.assertNotIn(self.server.token, self.server.host_port)
        different = dashboard.DashboardServer([], max_seconds=1)
        try:
            self.assertNotEqual(self.server.token, different.token)
        finally:
            different.server_close()

    def test_public_shell_contains_no_ledger_or_session_secret(self):
        status, headers, html = self.request('/')
        self.assertEqual(status, 200)
        self.assertIn(b'Finance Centre', html)
        self.assertIn(b'Fictional records only', html)
        self.assertNotIn(b'demo:coffee', html)
        self.assertNotIn("£277.50".encode('utf-8'), html)
        self.assertNotIn(self.server.token.encode(), html)
        self.assertEqual(headers['Referrer-Policy'], 'no-referrer')
        self.assertIn('no-store', headers['Cache-Control'])
        self.assertIn("default-src 'none'", headers['Content-Security-Policy'])
        self.assertNotIn('Access-Control-Allow-Origin', headers)
        self.assertEqual(headers['X-Frame-Options'], 'DENY')
        self.assertEqual(headers['X-Content-Type-Options'], 'nosniff')
        for forbidden in ('localStorage', 'sessionStorage', 'indexedDB', 'serviceWorker',
                          'https://', 'http://'):
            self.assertNotIn(forbidden, dashboard.PAGE)

    def test_unauthenticated_and_wrong_bearer_denied(self):
        for token in (None, 'x' * 64, self.server.token[:-1] + ('0' if self.server.token[-1]!='0' else '1')):
            status, head, body = self.request('/api/ledger', token=token)
            self.assertEqual(status, 403)
            self.assertNotIn(b'fictional', body)
            self.assertIn('no-store', head['Cache-Control'])
        # Fragment/private token in query is never used to authorize data.
        status, _, _ = self.request('/api/ledger?token='+self.server.token)
        self.assertEqual(status, 404)

    def test_owner_bearer_reads_only_synthetic_data(self):
        status, headers, raw = self.request('/api/ledger', token=self.server.token)
        self.assertEqual(status, 200)
        self.assertIn('application/json', headers['Content-Type'])
        data = json.loads(raw)
        self.assertEqual(data['mode'], 'synthetic-demo')
        self.assertEqual(len(data['entries']), 10)
        self.assertEqual(vault.demo_summary(data, '2026/27')['profit'], 27750)
        self.assertNotIn(PASS.encode(), raw)
        self.assertEqual(len(data['entries']), len(self.data['entries']))

    def test_external_origin_and_spoofed_host_blocked_even_with_token(self):
        for hdr in ({'Origin':'https://malicious.example'},
                    {'Origin':'http://localhost:9000'},
                    {'Host':'external.example'},
                    {'Host':'localhost:'+str(self.server.server_address[1])}):
            status, _, body = self.request('/api/ledger', token=self.server.token, headers=hdr)
            self.assertEqual(status, 403, hdr)
            self.assertNotIn(b'SIMULATED', body)

    def test_expired_session_denies_token_and_server_stops(self):
        self.server.deadline = time.monotonic() - 1
        try:
            status, _, _ = self.request('/api/ledger',token=self.server.token)
            self.assertIn(status, (410,))
        except OSError:
            # It is also safe if the server has already closed its port.
            pass
        self.thread.join(timeout=4)
        self.assertFalse(self.thread.is_alive())
        self.assertEqual(self.server.entries, [])
        self.assertEqual(self.server.token, '')

    def test_dashboard_is_read_only(self):
        for method in ['POST','PUT','PATCH','DELETE','OPTIONS']:
            status, _, _ = self.request('/api/ledger', token=self.server.token, method=method)
            self.assertEqual(status, 405)
        self.assertEqual(len(vault.load(self.root,PASS)['entries']),10)

    def test_main_no_open_does_not_touch_active_vault(self):
        # Confirm CLI can start from existing L1 vault and exits without writes.
        blob=(self.root/vault.VAULT_NAME).read_bytes()
        captured=[]
        class ShortSession(dashboard.DashboardServer):
            def run(self):
                captured.append(self.launch_url)
                self.server_close()
        with mock.patch.object(dashboard,'DashboardServer',ShortSession), \
             mock.patch.object(dashboard.Path,'home',return_value=Path(self.folder.name)), \
             mock.patch.object(dashboard.getpass,'getpass',return_value=PASS), \
             mock.patch('builtins.print'):
            self.assertEqual(dashboard.main(['--no-open']),0)
        self.assertEqual((self.root/vault.VAULT_NAME).read_bytes(),blob)
        self.assertEqual(len(captured),1)

    def test_reject_bad_passphrase_no_network_listener(self):
        with mock.patch.object(dashboard.Path,'home',return_value=Path(self.folder.name)), \
             mock.patch.object(dashboard.getpass,'getpass',return_value='wrong fake passphrase'), \
             mock.patch.object(dashboard,'DashboardServer',side_effect=AssertionError('must not start')):
            self.assertEqual(dashboard.main(['--no-open']),2)


if __name__=='__main__':
    unittest.main()
