import {test,expect} from '@playwright/test'
import {loadFixture,login,reportUrl} from './fixture.js'
for(const type of ['Fetal Echo','Adult Echo','Pediatric Echo']){
 test(`${type} keeps saved report controls unavailable until content is loaded`,async({page})=>{
  const info=await loadFixture();await login(page,'l1',info.password)
  const id=info.scans[type].id
  let release;const ready=new Promise(resolve=>{release=resolve})
  await page.route(`**/api/scans/${id}`,async route=>{await ready;await route.continue()})
  await page.goto(reportUrl(info,type))
  await expect(page.getByRole('status')).toContainText('Loading saved report')
  await expect(page.getByRole('button',{name:'Impression',exact:true})).toHaveCount(0)
  release()
  await expect(page.getByLabel(/^Indication/)).toHaveValue('Dummy browser test only')
  await page.getByRole('button',{name:'Impression',exact:true}).click()
  await expect(page.getByText('Audit: Pending')).toBeVisible()
 })
}
