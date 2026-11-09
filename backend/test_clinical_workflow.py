"""Integration checks run against a temporary copy; never writes the clinical database."""
import copy
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request

class WorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix='echo-workflow-test-')
        cls.folder = Path(cls.tmp.name)
        source = Path(__file__).parent
        shutil.copy2(source / 'echo.db', cls.folder / 'test.db')
        sock = socket.socket(); sock.bind(('127.0.0.1', 0)); cls.port = sock.getsockname()[1]; sock.close()
        env = {**os.environ, 'DB_PATH':str(cls.folder/'test.db'), 'ECHOAI_USERS_PATH':str(cls.folder/'users.json'), 'ECHOAI_PASSWORD':'Workflow-test-only!42', 'PORT':str(cls.port), 'UPLOADS_DIR':str(cls.folder/'uploads')}
        cls.log = open(cls.folder/'server.log', 'w')
        cls.server = subprocess.Popen([sys.executable, 'main.py'], cwd=source, env=env, stdout=cls.log, stderr=cls.log)
        cls.base=f'http://127.0.0.1:{cls.port}'
        for _ in range(100):
            try:
                cls.call('GET','/api/health'); break
            except Exception:
                time.sleep(.1)
        else:
            raise RuntimeError('Test server did not start')
        cls.l3=cls.call('POST','/api/auth/login',{'username':'dr.shanthi','password':'Workflow-test-only!42'})[1]['token']
        cls.roles={'L3':cls.l3}
        for role in ('L1','L2'):
            cls.call('POST','/api/workflow/users',{'name':role+' Test','username':role.lower(),'password':'Workflow-test-only!42','role':role},cls.l3)
            cls.roles[role]=cls.call('POST','/api/auth/login',{'username':role.lower(),'password':'Workflow-test-only!42'})[1]['token']

    @classmethod
    def tearDownClass(cls):
        cls.server.terminate();cls.server.wait(timeout=10);cls.log.close();cls.tmp.cleanup()

    @classmethod
    def call(cls, method, route, data=None, token=None):
        body=None if data is None else json.dumps(data).encode()
        headers={'Content-Type':'application/json'}
        if token:headers['Authorization']='Bearer '+token
        request=urllib.request.Request(cls.base+route,data=body,headers=headers,method=method)
        try:
            with urllib.request.urlopen(request,timeout=10) as r:return r.status,json.load(r)
        except urllib.error.HTTPError as e:
            with e:return e.code,json.load(e)

    def test_complete_workflow(self):
        call=self.call;l1=self.roles['L1'];l2=self.roles['L2'];l3=self.roles['L3']
        self.assertEqual(call('GET','/api/patients')[0],401)
        self.assertEqual(call('POST','/api/patients',{},l1)[0],422)
        patient={'patient_id':'TEST-WORKFLOW-001','first_name':'Dummy','last_name':'Test','age':'30','gender':'F','street':'Test address','state':'Tamil Nadu','country':'India','phone1':'1234567890','family_doctor':'Self'}
        code,result=call('POST','/api/patients',patient,l1);self.assertEqual(code,200,result);pid=result['data']['id']
        self.assertEqual(call('POST','/api/patients',patient,l1)[0],400)
        self.assertEqual(call('POST','/api/patients',{**patient,'patient_id':'TEST-FUTURE-DOB','dob':'2999-01-01'},l1)[0],422)
        code,contact=call('POST','/api/referral-doctors',{'doctor_type':'hospital','institution_name':'Dummy Institute','designation':'Test designation','phone2':'2222222222'},l1)
        self.assertEqual(code,200,contact)
        fetched=call('GET',f'/api/referral-doctors/{contact["data"]["id"]}',token=l1)[1]['data']
        self.assertEqual(fetched['doctor_type'],'hospital');self.assertEqual(fetched['designation'],'Test designation');self.assertEqual(fetched['phone2'],'2222222222')
        self.assertEqual(call('POST','/api/referral-doctors',{},l1)[0],422)
        visits=call('GET',f'/api/patients/{pid}/visits',token=l1)[1]['data'];self.assertEqual(visits,[])
        visit={'visit_date':'2026-11-09T10:00','scan_type':'Fetal Echo','referral_doctor':'Test Clinic','request_id':'test-once'}
        code,result=call('POST',f'/api/patients/{pid}/visits',visit,l1);self.assertEqual(code,200,result);vid=result['data']['id']
        self.assertEqual(call('POST',f'/api/patients/{pid}/visits',visit,l1)[1]['data']['id'],vid)
        self.assertEqual(len(call('GET',f'/api/patients/{pid}/visits',token=l1)[1]['data']),1)
        draft={'patient_id':pid,'patient_display_id':patient['patient_id'],'visit_id':vid,'scan_type':'Fetal Echo','status':'draft','scan_date':'2026-11-09T10:30'}
        code,result=call('POST','/api/scans',draft,l1);self.assertEqual(code,200,result);sid=result['data']['id']
        self.assertEqual(call('POST','/api/scans',draft,l1)[1]['data']['id'],sid)
        self.assertEqual(call('POST','/api/scans',{**draft,'scan_type':'Adult Echo'},l1)[0],422)
        report={'indication':'Dummy test only','no_of_fetuses':'1','lmp':{'lmp_date':'2026-06-01'},'echo_details':{'general':{'cardiac_position':'Abnormal'}},'impression':{'final_impression':'Dummy test report','primary_consultant':'Test Consultant','report_completed':False}}
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l1)[0],422)
        report['echo_details']['general']['cardiac_position_comments']='Dummy description'
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'patient_id':0,'fetal_echo_report':report},l1)[0],409)
        code,result=call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l1);self.assertEqual(code,200,result)
        self.assertEqual(result['data']['patient_display_id'],patient['patient_id']);self.assertEqual(result['data']['scan_date'],draft['scan_date'])
        report['impression']['audit_done']=True
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l1)[0],403)
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l2)[0],200)
        report['impression']['report_completed']=True
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l2)[0],403)
        code,result=call('PUT',f'/api/scans/{sid}',{'fetal_echo_report':report},l3);self.assertEqual(code,200,result)
        self.assertEqual(result['data']['status'],'Completed')
        saved=call('GET',f'/api/scans/{sid}',token=l3)[1]['data']['fetal_echo_report']
        self.assertEqual(saved['echo_details']['general']['cardiac_position_comments'],'Dummy description')
        self.assertEqual(saved['impression']['audited_by'],'L2 Test')
        self.assertEqual(call('PUT',f'/api/scans/{sid}',{'conclusion':'changed'},l3)[0],409)
        self.assertEqual(call('DELETE',f'/api/scans/{sid}',token=l3)[0],409)
        self.assertEqual(call('DELETE',f'/api/patients/{pid}',token=l3)[0],409)
        self.assertEqual(call('PUT',f'/api/resources/scans/{sid}',{'status':'draft'},l1)[0],403)
        self.assertEqual(call('GET','/api/resources/unknown',token=l3)[0],404)

    def test_adult_paediatric_and_ultrasound(self):
        l1=self.roles['L1'];l3=self.roles['L3'];call=self.call
        patient={'patient_id':'TEST-OTHER-TYPES','first_name':'Dummy','last_name':'Other','dob':'2000-01-01','gender':'F','street':'Test','state':'Tamil Nadu','country':'India','phone2':'1234567890','family_doctor':'Self'}
        pid=call('POST','/api/patients',patient,l1)[1]['data']['id']
        for scan_type,key in [('Adult Echo','adult_echo_report'),('Pediatric Echo','pediatric_echo_report'),('Ultrasound',None)]:
            vid=call('POST',f'/api/patients/{pid}/visits',{'visit_date':'2026-11-09T12:00','scan_type':scan_type},l1)[1]['data']['id']
            payload={'patient_id':pid,'visit_id':vid,'scan_type':scan_type,'status':'draft'}
            code,result=call('POST','/api/scans',payload,l1);self.assertEqual(code,200,result);sid=result['data']['id']
            if key:
                report={'indication':'Test only','echo_details':{'general':{'situs':'Not visualized'}},'impression':{'primary_consultant':'Dummy consultant','final_impression':'Dummy only','internal_comments':'INTERNAL-NOT-FOR-PATIENT'}}
                code,result=call('PUT',f'/api/scans/{sid}',{key:report},l1);self.assertEqual(code,200,result)
                self.assertEqual(result['data'][key]['impression']['internal_comments'],'INTERNAL-NOT-FOR-PATIENT')
                self.assertEqual(result['data']['status'],'In Progress')

    def test_contact_only_updates_and_identity_locks_for_all_roles(self):
        patient={'patient_id':'TEST-CONTACT-ONLY','first_name':'Dummy','last_name':'Contact','dob':'2000-01-01','gender':'F','street':'Test','state':'Tamil Nadu','country':'India','phone2':'1234567890','family_doctor':'Self'}
        pid=self.call('POST','/api/patients',patient,self.l3)[1]['data']['id']
        for role,token in self.roles.items():
            code,result=self.call('PUT',f'/api/patients/{pid}',{'phone1':'9876543210','street':'Updated '+role,'family_doctor':'Test Clinic'},token)
            self.assertEqual(code,200,result)
            self.assertEqual(result['data']['patient_id'],patient['patient_id'])
            for key,value in {'patient_id':'CHANGED','first_name':'Changed','last_name':'Changed','dob':'2001-01-01','gender':'M'}.items():
                self.assertEqual(self.call('PUT',f'/api/patients/{pid}',{key:value},token)[0],409)
            self.assertEqual(self.call('GET',f'/api/patients/{pid}/visits',token=token)[1]['data'],[])
            self.assertEqual(self.call('GET',f'/api/scans/patient/{pid}',token=token)[1]['data'],[])

if __name__=='__main__':unittest.main(verbosity=2)
