"""Synthetic-only Bouncer contract QA. Not a production scanner or transport.

No HTTP implementation, real key, filesystem intake, DB or publication entry
point. The only transport here is an in-memory scripted exchange. A clean
candidate NEVER grants release clearance or replaces worker.official_scan.
"""
from dataclasses import dataclass
import hashlib
import json
import re

API = 'https://api.usebouncer.dev'
# Fictional, deliberately non-resolvable endpoint; NOT a real bucket allowlist.
STORAGE = 'https://qa-bouncer-upload.example.invalid/'
QA_KEY = 'synthetic-placeholder-not-an-api-key'
MAX_BYTES = 5_000_000
V1_MAX = 4_000_000  # conservative margin below documented ~4.5 MB request cap
MAX_RESPONSE = 128_000
MAX_POLLS = 8
SCAN_ID = re.compile(r'^scan_[0-9A-Z]{26}$')
SHA256 = re.compile(r'^[0-9a-f]{64}$')
NAME = 'fixture.pdf'
BOUNDARY = 'dd-qa-offline-boundary-4f6ef492'
FIELD = re.compile(r'^[A-Za-z0-9_-]{1,64}$')


class Stop(Exception):
    pass


def insist(condition, code):
    if not condition:
        raise Stop(code)


def no_dupes(pairs):
    result = {}
    for k, v in pairs:
        insist(k not in result, 'duplicate_json_key')
        result[k] = v
    return result


@dataclass(frozen=True)
class Response:
    status: int
    body: bytes = b''


@dataclass(frozen=True)
class Request:
    method: str
    url: str
    headers: dict
    body: bytes


class ScriptedTransport:
    """No sockets, redirects, retries, or credentials. Any unexpected call fails."""
    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = []
        self.delays = []

    def send(self, request):
        self.calls.append(request)
        insist(bool(self.replies), 'unexpected_mock_request')
        reply = self.replies.pop(0)
        if isinstance(reply, Exception):
            raise reply
        return reply

    def pause(self, seconds):
        self.delays.append(seconds)


def response_data(response, expected):
    insist(type(response) is Response and type(response.status) is int, 'invalid_response')
    if response.status in (401, 403):
        raise Stop('authentication_or_permission')
    if response.status == 429:
        raise Stop('quota_or_rate_limit')
    if response.status == 413:
        raise Stop('provider_size_limit')
    if response.status != expected:
        raise Stop('unexpected_http_status')
    insist(type(response.body) is bytes and 0 < len(response.body) <= MAX_RESPONSE, 'invalid_response_size')
    try:
        envelope = json.loads(response.body, object_pairs_hook=no_dupes,
                              parse_constant=lambda _: (_ for _ in ()).throw(ValueError('nonfinite')))
    except (ValueError, UnicodeError, RecursionError):
        raise Stop('invalid_json')
    insist(type(envelope) is dict and envelope.get('status') == 'success'
           and type(envelope.get('data')) is dict, 'unconfirmed_envelope')
    return envelope['data']


def api(transport, method, path, body=b'', content_type=None):
    headers = {'Accept': 'application/json', 'X-API-Key': QA_KEY}
    if content_type:
        headers['Content-Type'] = content_type
    return transport.send(Request(method, API + path, headers, body))


def multipart(raw, fields=None):
    parts = []
    for key, val in (fields or {}).items():
        insist(type(key) is str and FIELD.fullmatch(key) and key.lower() != 'file', 'bad_storage_field')
        insist(type(val) is str and 0 < len(val) <= 32768 and '\r' not in val and '\n' not in val,
               'bad_storage_field')
        insist(BOUNDARY not in val, 'boundary_collision')
        parts.append(f'--{BOUNDARY}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{val}\r\n'.encode())
    insist(BOUNDARY.encode() not in raw, 'boundary_collision')
    parts.extend([f'--{BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="{NAME}"\r\nContent-Type: application/pdf\r\n\r\n'.encode(),
                  raw, f'\r\n--{BOUNDARY}--\r\n'.encode()])
    body = b''.join(parts)
    insist(len(body) <= MAX_BYTES + 128_000, 'multipart_too_large')
    return body, f'multipart/form-data; boundary={BOUNDARY}'


def scan(transport, fixture_bytes, expected_sha):
    """Exercise the candidate protocol with scripted responses only.

    The caller must still run all original trusted structural, signature,
    storage, rendering and review gates; there is no release receipt here.
    """
    result = {'status': 'blocked', 'release_eligible': False}
    try:
        insist(type(transport) is ScriptedTransport, 'mock_transport_required')
        insist(type(fixture_bytes) is bytes and 16 <= len(fixture_bytes) <= MAX_BYTES, 'pilot_file_size')
        insist(type(expected_sha) is str and SHA256.fullmatch(expected_sha), 'invalid_expected_digest')
        insist(hashlib.sha256(fixture_bytes).hexdigest() == expected_sha, 'digest_mismatch')
        usage = response_data(api(transport, 'GET', '/v1/scan/usage'), 200)
        used, limit = usage.get('scans_used'), usage.get('scans_limit')
        insist(usage.get('tier') == 'free' and type(limit) is int and limit == 500
               and type(used) is int and 0 <= used < limit, 'free_quota_unconfirmed_or_exhausted')
        version = 'v1' if len(fixture_bytes) <= V1_MAX else 'v2'
        if version == 'v1':
            body, ctype = multipart(fixture_bytes)
            insist(len(body) <= 4_100_000, 'v1_body_too_large')
            started = response_data(api(transport, 'POST', '/v1/scan', body, ctype), 202)
        else:
            info = json.dumps({'file_name': NAME, 'mime_type': 'application/pdf'}).encode()
            started = response_data(api(transport, 'POST', '/v2/scan', info, 'application/json'), 201)
        scan_id = started.get('scan_id')
        insist(type(scan_id) is str and SCAN_ID.fullmatch(scan_id) and started.get('status') == 'pending',
               'invalid_start_receipt')
        path = f'/{version}/scan/{scan_id}'
        # Never follow vendor-supplied arbitrary URLs. Build the known poll path.
        insist(started.get('poll_url', path) == path, 'untrusted_poll_url')
        if version == 'v1':
            f = started.get('file')
            insist(type(f) is dict and type(f.get('size')) is int and f['size'] == len(fixture_bytes)
                   and f.get('name') == NAME, 'start_file_mismatch')
        else:
            target = started.get('upload')
            insist(type(started.get('max_file_size')) is int
                   and len(fixture_bytes) <= started['max_file_size'] <= 26_214_400,
                   'unconfirmed_storage_limit')
            insist(type(target) is dict and target.get('url') == STORAGE, 'unapproved_storage_origin')
            fields = target.get('fields')
            insist(type(fields) is dict and 3 <= len(fields) <= 24 and
                   fields.get('key') == f'uploads/{scan_id}/{NAME}' and
                   {'key', 'policy', 'x-amz-signature'} <= set(fields), 'invalid_storage_fields')
            body, ctype = multipart(fixture_bytes, fields)
            # No API key, cookie or Authorization is passed to the external bucket.
            receipt = transport.send(Request('POST', STORAGE, {'Content-Type': ctype}, body))
            insist(type(receipt) is Response and receipt.status == 204 and receipt.body == b'',
                   'storage_upload_unconfirmed')
        for attempt in range(MAX_POLLS):
            transport.pause(2)
            data = response_data(api(transport, 'GET', path), 200)
            insist(data.get('scan_id') == scan_id, 'scan_id_mismatch')
            state = data.get('status')
            if state in ('pending', 'scanning'):
                continue
            insist(state == 'completed', 'scan_not_completed')
            f = data.get('file')
            insist(type(f) is dict and f.get('name') == NAME and f.get('mime_type') == 'application/pdf'
                   and type(f.get('size')) is int and f['size'] == len(fixture_bytes)
                   and f.get('sha256') == expected_sha, 'scan_file_mismatch')
            if data.get('verdict') in ('suspicious', 'malicious'):
                return {'status': 'rejected', 'reason': 'provider_flagged', 'release_eligible': False}
            insist(data.get('verdict') == 'clean' and data.get('threats') == [], 'unconfirmed_clean_verdict')
            engines = data.get('engines')
            # Conservative candidate contract: docs show engine names/results,
            # but the exact clean-engine payload needs real API confirmation.
            insist(type(engines) is dict and {'signature','pattern'} <= set(engines)
                   and all(type(e) is dict and e.get('result') == 'clean' for e in engines.values()),
                   'engine_success_unconfirmed')
            return {'status': 'candidate_clean_only', 'sha256': expected_sha,
                    'bytes': len(fixture_bytes), 'release_eligible': False}
        raise Stop('poll_timeout')
    except Stop as e:
        return {**result, 'reason': str(e)}
    except (OSError, TimeoutError):
        return {**result, 'reason': 'transport_error'}
    except (TypeError, ValueError, KeyError, AttributeError, RecursionError, OverflowError):
        return {**result, 'reason': 'unconfirmed_response'}
