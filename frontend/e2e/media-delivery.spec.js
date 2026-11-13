import {test,expect} from '@playwright/test'
import {loadFixture,login} from './fixture.js'
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO1sAAAAASUVORK5CYII=','base64')
test('visit image selection persists, exports ZIP, prints, and appears in the clinical report',async({page,request})=>{
 const info=await loadFixture()
 await request.post('/api/auth/login',{data:{username:'dr.shanthi',password:info.password}})
 const patient=(await (await request.post('/api/patients',{data:{patient_id:`MEDIA-${Date.now()}`,first_name:'Dummy',last_name:'Media',age:'30',gender:'F',street:'Synthetic address',state:'Tamil Nadu',country:'India',phone1:'1234567890',family_doctor:'Self'}})).json()).data
 const visit=(await (await request.post(`/api/patients/${patient.id}/visits`,{data:{scan_type:'Adult Echo',visit_date:'2026-11-11T09:00',referral_doctor:'Self'}})).json()).data
 const ids=[]
 for(let i=0;i<3;i++){const result=await request.post('/api/media-upload',{multipart:{patient_id:String(patient.id),visit_id:String(visit.id),file:{name:`test-${i}.png`,mimeType:'image/png',buffer:png}}});expect(result.ok()).toBe(true);ids.push((await result.json()).data.id)}
 const exported=await request.post(`/api/media-export/${patient.id}/${visit.id}`,{data:{ids}});expect(exported.ok()).toBe(true);expect((await exported.body()).subarray(0,2).toString()).toBe('PK')
 expect((await request.post(`/api/media-export/${info.patient_id||999999}/${visit.id}`,{data:{ids}})).ok()).toBe(false)
 await login(page,'l1',info.password);await page.goto(`/images?patientId=${patient.id}&visitId=${visit.id}`)
 for(let i=0;i<3;i++)await page.getByRole('button',{name:new RegExp(`test-${i}\\.png`)}).click()
 await page.getByRole('button',{name:'Include selected in report',exact:true}).click();await expect(page.getByRole('status')).toContainText('saved to this visit')
 const saved=await request.get(`/api/media-layouts/${patient.id}/${visit.id}/report`);expect((await saved.json()).data.placements).toEqual(ids)
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export selected ZIP'}).click();expect((await download).suggestedFilename()).toMatch(/\.zip$/)
 await page.getByRole('button',{name:'Print selected / Save PDF'}).click();await expect(page.getByRole('button',{name:'Print / Save PDF',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Close print preview'}).click()
 const source=(await (await request.get(`/api/scans/${info.scans['Adult Echo'].id}`)).json()).data.adult_echo_report
 const report=structuredClone(source);report.impression.audit_done=false;report.impression.report_completed=false
 const response=await request.post('/api/scans',{data:{patient_id:patient.id,visit_id:visit.id,scan_type:'Adult Echo',adult_echo_report:report}});expect(response.ok()).toBe(true)
 const scan=(await response.json()).data
 await page.goto(`/adult-echo-report/${scan.id}?patientId=${patient.id}&visitId=${visit.id}&preview=1`)
 await expect(page.getByRole('heading',{name:'Selected clinical images',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Print / Save PDF',exact:true})).toBeEnabled();await expect(page.locator('.clinical-print img')).toHaveCount(3)
})
