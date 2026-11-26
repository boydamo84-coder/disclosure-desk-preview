"""All exchanges simulated, no network; run with Python stdlib unittest."""
import hashlib
import json
import unittest
from adapter import (API, STORAGE, QA_KEY, NAME, V1_MAX, MAX_BYTES, MAX_POLLS,
                     BOUNDARY, Response, ScriptedTransport, scan)

SID = 'scan_00000000000000000000000000'
# Deliberately inert synthetic transport bytes. Actual PDF parser tests live in
# scanner/test_worker.py; these size-boundary buffers are not valid PDFs.
SMALL = b'%PDF-1.7\n% fictional protocol fixture\n%%EOF\n'
LARGE = SMALL + b' ' * (MAX_BYTES - len(SMALL))

def digest(raw): return hashlib.sha256(raw).hexdigest()
def ok(data, code=200): return Response(code, json.dumps({'status':'success','data':data}).encode())
def usage(**change): return ok({'tier':'free','scans_used':4,'scans_limit':500,**change})
def start(raw, **change):
    large = len(raw) > V1_MAX
    obj = {'scan_id':SID,'status':'pending','poll_url':f'/{"v2" if large else "v1"}/scan/{SID}'}
    if large:
        obj.update({'max_file_size':26_214_400,'upload':{'url':STORAGE,'fields':{
            'key':f'uploads/{SID}/{NAME}','policy':'fictional-policy','x-amz-signature':'fictional-signature'}}})
    else:
        obj['file'] = {'name':NAME,'size':len(raw)}
    obj.update(change)
    return ok(obj,201 if large else 202)
def completed(raw, **change):
    data = {'scan_id':SID,'status':'completed','verdict':'clean','file':{'name':NAME,'mime_type':'application/pdf','size':len(raw),'sha256':digest(raw)},
            'threats':[],'engines':{'signature':{'result':'clean'},'pattern':{'result':'clean'}}}
    data.update(change)
    return ok(data)

def run(replies, raw=SMALL, sha=None):
    mock = ScriptedTransport(replies)
    return scan(mock,raw,digest(raw) if sha is None else sha),mock

class AdapterTests(unittest.TestCase):
    def blocked(self,replies,reason,raw=SMALL,sha=None):
        result,mock=run(replies,raw,sha)
        self.assertEqual(result,{'status':'blocked','reason':reason,'release_eligible':False})
        return mock
    def test_v1_success_and_exact_multipart(self):
        res,m=run([usage(),start(SMALL),ok({'scan_id':SID,'status':'pending'}),ok({'scan_id':SID,'status':'scanning'}),completed(SMALL)])
        self.assertEqual(res,{'status':'candidate_clean_only','sha256':digest(SMALL),'bytes':len(SMALL),'release_eligible':False})
        self.assertEqual([c.url for c in m.calls],[API+'/v1/scan/usage',API+'/v1/scan']+[API+'/v1/scan/'+SID]*3)
        self.assertEqual(m.delays,[2,2,2]); self.assertIn(SMALL,m.calls[1].body)
        self.assertEqual(m.calls[1].headers['X-API-Key'],QA_KEY)
    def test_v2_max_pilot_and_no_key_forwarded(self):
        res,m=run([usage(),start(LARGE),Response(204),completed(LARGE)],LARGE)
        self.assertEqual(res['status'],'candidate_clean_only'); self.assertFalse(res['release_eligible'])
        self.assertEqual([c.url for c in m.calls],[API+'/v1/scan/usage',API+'/v2/scan',STORAGE,API+'/v2/scan/'+SID])
        self.assertEqual(set(m.calls[2].headers),{'Content-Type'})
        self.assertNotIn(QA_KEY.encode(),m.calls[2].body)
        self.assertIn(LARGE,m.calls[2].body); self.assertTrue(m.calls[2].body.endswith(f'\r\n--{BOUNDARY}--\r\n'.encode()))
        self.assertLess(m.calls[2].body.index(b'name="policy"'),m.calls[2].body.index(b'name="file"'))
    def test_v1_to_v2_threshold(self):
        for n,version in ((V1_MAX,'v1'),(V1_MAX+1,'v2')):
            with self.subTest(n=n):
                raw=SMALL+b' '*(n-len(SMALL)); replies=[usage(),start(raw)]+([Response(204)] if version=='v2' else [])+[completed(raw)]
                result,m=run(replies,raw); self.assertEqual(result['status'],'candidate_clean_only'); self.assertEqual(m.calls[1].url,API+f'/{version}/scan')
    def test_local_size_and_hash_rejected_before_network(self):
        for raw,sha,reason in ((LARGE+b'x',None,'pilot_file_size'),(b'a',None,'pilot_file_size'),(SMALL,'bad','invalid_expected_digest'),(SMALL,'0'*64,'digest_mismatch')):
            with self.subTest(reason=reason): self.assertEqual(self.blocked([],reason,raw,sha).calls,[])
    def test_no_production_transport_allowed(self):
        self.assertEqual(scan(object(),SMALL,digest(SMALL)),{'status':'blocked','reason':'mock_transport_required','release_eligible':False})
    def test_quota_and_tier(self):
        for change in ({'scans_used':500},{'scans_used':-1},{'scans_used':True},{'scans_limit':501},{'tier':'pro'},{'tier':None}):
            with self.subTest(change=change): self.assertEqual(len(self.blocked([usage(**change)],'free_quota_unconfirmed_or_exhausted').calls),1)
    def test_http_errors_no_retry(self):
        for code,reason in ((401,'authentication_or_permission'),(403,'authentication_or_permission'),(429,'quota_or_rate_limit'),(413,'provider_size_limit'),(500,'unexpected_http_status'),(302,'unexpected_http_status'),(404,'unexpected_http_status')):
            for stage,replies in [('usage',[Response(code)]),('start',[usage(),Response(code)]),('poll',[usage(),start(SMALL),Response(code)])]:
                with self.subTest(code=code,stage=stage): self.assertEqual(len(self.blocked(replies,reason).calls),len(replies))
    def test_transport_failures(self):
        for failure in (TimeoutError('secret-not-returned'),OSError('secret-not-returned')):
            with self.subTest(failure=type(failure)): self.assertEqual(len(self.blocked([usage(),failure],'transport_error').calls),2)
    def test_malformed_response(self):
        for response,reason in ((Response(200,b'not JSON'),'invalid_json'),(Response(200,b'{"status":"success","status":"error","data":{}}'),'duplicate_json_key'),(Response(200,b' '*128001),'invalid_response_size'),(Response(200,b'{"status":"error","data":{}}'),'unconfirmed_envelope'),(Response(200,b'{"status":"success","data":[]}'),'unconfirmed_envelope')):
            with self.subTest(reason=reason): self.blocked([response],reason)
    def test_untrusted_start(self):
        for change,reason in (({'scan_id':'../scan/secret'},'invalid_start_receipt'),({'status':'completed'},'invalid_start_receipt'),({'poll_url':'https://elsewhere.invalid/steal'},'untrusted_poll_url'),({'file':{'name':NAME,'size':1}},'start_file_mismatch')):
            with self.subTest(change=change): self.blocked([usage(),start(SMALL,**change)],reason)
    def test_v2_destination_and_fields(self):
        for url in ('http://qa-bouncer-upload.example.invalid/','https://qa-bouncer-upload.example.invalid.evil.test/','https://qa-bouncer-upload.example.invalid@evil.test/','https://evil.test/'):
            with self.subTest(url=url): self.assertEqual(len(self.blocked([usage(),start(LARGE,upload={'url':url,'fields':{}})],'unapproved_storage_origin',LARGE).calls),2)
        self.blocked([usage(),start(LARGE,max_file_size=MAX_BYTES-1)],'unconfirmed_storage_limit',LARGE)
        self.blocked([usage(),start(LARGE,upload={'url':STORAGE,'fields':{'key':'elsewhere','policy':'x','x-amz-signature':'x'}})],'invalid_storage_fields',LARGE)
        self.blocked([usage(),start(LARGE,upload={'url':STORAGE,'fields':{'key':f'uploads/{SID}/{NAME}','policy':'x','x-amz-signature':'x','file':'injection'}})],'bad_storage_field',LARGE)
        self.blocked([usage(),start(LARGE),Response(307)],'storage_upload_unconfirmed',LARGE)
    def test_flagged_verdicts(self):
        for verdict in ('suspicious','malicious'):
            with self.subTest(verdict=verdict):
                result,_=run([usage(),start(SMALL),completed(SMALL,verdict=verdict)]); self.assertEqual(result,{'status':'rejected','reason':'provider_flagged','release_eligible':False})
    def test_response_binding(self):
        for prop,value in [('name','other.pdf'),('size',len(SMALL)+1),('size',True),('mime_type','application/octet-stream'),('sha256','0'*64)]:
            f={'name':NAME,'mime_type':'application/pdf','size':len(SMALL),'sha256':digest(SMALL),prop:value}
            with self.subTest(prop=prop,value=value): self.blocked([usage(),start(SMALL),completed(SMALL,file=f)],'scan_file_mismatch')
        self.blocked([usage(),start(SMALL),completed(SMALL,scan_id='wrong')],'scan_id_mismatch')
    def test_unconfirmed_verdict_or_engine(self):
        for change,reason in (({'verdict':'unknown'},'unconfirmed_clean_verdict'),({'threats':None},'unconfirmed_clean_verdict'),({'threats':[{'name':'unexpected'}]},'unconfirmed_clean_verdict'),({'engines':None},'engine_success_unconfirmed'),({'engines':{'signature':{'result':'clean'}}},'engine_success_unconfirmed'),({'engines':{'signature':{'result':'clean'},'pattern':{'result':'skipped'}}},'engine_success_unconfirmed'),({'engines':{'signature':{'result':'clean'},'pattern':{'result':'clean'},'other':{'result':'error'}}},'engine_success_unconfirmed'),({'status':'failed'},'scan_not_completed')):
            with self.subTest(change=change): self.blocked([usage(),start(SMALL),completed(SMALL,**change)],reason)
    def test_poll_timeout_bounded(self):
        mock=self.blocked([usage(),start(SMALL)]+[ok({'scan_id':SID,'status':'pending'})]*MAX_POLLS,'poll_timeout')
        self.assertEqual(len(mock.calls),2+MAX_POLLS); self.assertEqual(mock.delays,[2]*MAX_POLLS)

if __name__=='__main__': unittest.main(verbosity=2)
