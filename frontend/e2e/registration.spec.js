import { test, expect } from '@playwright/test'
import { loadFixture, login } from './fixture.js'

let info
test.beforeAll(async () => {
  info = await loadFixture()
})

test('L1 registers a patient and saves Adult and Paediatric reports from new visits', async ({ page }) => {
  await login(page, 'l1', info.password)
  await page.goto('/patients/new')

  const inputAfter = (label) => page.getByText(label, { exact: true }).first().locator('xpath=following-sibling::input[1]')
  await page.getByPlaceholder('e.g., TM0012026').fill(`E2E-${Date.now()}`)
  await inputAfter('First Name').fill('Dummy')
  await inputAfter('Surname / Initial').fill('Registration')
  await page.getByPlaceholder('Age').fill('30')
  await page.locator('input[name="gender"][value="F"]').check()
  await inputAfter('Street Address').fill('Synthetic test address')
  await page.getByText('State', { exact: true }).first().locator('xpath=following-sibling::div//select').selectOption('Tamil Nadu')
  await inputAfter('Phone (at least one required)').fill('1234567890')
  await page.locator('#newpatient-family_doctor').selectOption('Self')
  await page.getByRole('button', { name: 'Save Patient' }).click()
  await page.waitForURL(/\/visits\?patient=/)
  const patientId = new URL(page.url()).searchParams.get('patient')

  for (const [scanType, route, savedMessage] of [
    ['Adult Echo', 'adult-echo-report', 'Adult echo report saved.'],
    ['Pediatric Echo', 'pediatric-echo-report', 'Pediatric echo report saved.'],
  ]) {
    await page.goto(`/visits?patient=${patientId}`)
    await page.getByText('New visits will be linked to').waitFor()
    await page.getByText('Scan type', { exact: true }).first().locator('xpath=ancestor::label[1]//select').selectOption(scanType)
    const saveVisit = page.getByRole('button', { name: 'Save & Go to Reporting' })
    await expect(saveVisit).toBeEnabled()
    await saveVisit.click()
    await page.waitForURL(new RegExp(`/${route}/`))
    await page.getByRole('button', { name: 'Save report' }).click()
    await expect(page.getByText(savedMessage).first()).toBeVisible()
  }
})

test('duplicate patient IDs are rejected and contact updates do not create visits or scans',async({page,request})=>{
  await request.post('/api/auth/login',{data:{username:'dr.shanthi',password:info.password}})
  const input={patient_id:`SYNTH-DUP-${Date.now()}`,first_name:'Dummy',last_name:'Contact',dob:'2000-01-01',gender:'F',street:'Synthetic address',state:'Tamil Nadu',country:'India',phone1:'1234567890',family_doctor:'Self'}
  const patient=(await (await request.post('/api/patients',{data:input})).json()).data
  expect((await request.post('/api/patients',{data:input})).status()).toBe(400)
  await login(page,'l1',info.password);await page.goto(`/patients/${patient.id}/edit`)
  await expect(page.getByLabel('Patient ID',{exact:true})).toHaveValue(input.patient_id)
  for(const label of ['Patient ID','First Name','Surname / Initial','Date of Birth'])await expect(page.getByLabel(label,{exact:true})).toHaveAttribute('readonly','')
  await expect(page.locator('input[name="gender"]')).toHaveCount(3)
  for(const radio of await page.locator('input[name="gender"]').all())await expect(radio).toBeDisabled()
  await page.getByLabel('Street Address',{exact:true}).fill('Updated synthetic address')
  await page.getByRole('button',{name:'Update Patient',exact:true}).click();await expect(page).toHaveURL(/\/patients$/)
  expect((await (await request.get(`/api/patients/${patient.id}/visits`)).json()).data).toHaveLength(0)
  expect((await (await request.get(`/api/scans/patient/${patient.id}`)).json()).data).toHaveLength(0)
  expect((await (await request.get(`/api/patients/${patient.id}`)).json()).data.street).toBe('Updated synthetic address')
})
