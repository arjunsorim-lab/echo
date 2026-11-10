import {test} from 'node:test'
import assert from 'node:assert/strict'
import {blankReport,mergeReport,reportErrors} from './src/reportValidation.js'
import {getScanMeasurements} from './src/measurementData.js'
test('incomplete drafts persist but progression and completion require profile fields',()=>{
  const report={indication:'',lmp:{},impression:{},no_of_fetuses:''}
  assert.deepEqual(reportErrors(report,true),[])
  assert.equal(reportErrors(report,true,false,true).length,3)
  assert.equal(reportErrors(report,true,true).length,5)
  assert(reportErrors({...report,lmp:{edd:'2026-02-30'}},true).length)
  assert(reportErrors({...report,no_of_fetuses:'0'},true).length)
})
test('abnormal descriptions reject whitespace; not visualized remains optional',()=>{
  assert(reportErrors({echo_details:{situs:'Abnormal',situs_comments:'  '}}).length)
  assert.deepEqual(reportErrors({echo_details:{situs:'Not visualized'}}),[])
})
test('blank templates remove example values, and partial historical reports merge without invented defaults',()=>{
  const template={echo_details:{situs:'Normal',annulus:'1.5',additional_comments_enabled:true},doppler:{annulus_e:'9'},impression:{final_impression:'NORMAL',report_title:'Title'}}
  const blank=blankReport(template)
  assert.equal(blank.echo_details.situs,'');assert.equal(blank.echo_details.annulus,'');assert.equal(blank.doppler.annulus_e,'');assert.equal(blank.impression.final_impression,'')
  const result=mergeReport(blank,{echo_details:{situs:'Entered'},impression:{final_impression:'Entered impression'}})
  assert.equal(result.echo_details.situs,'Entered');assert.equal(result.echo_details.annulus,'');assert.equal(template.echo_details.situs,'Normal')
})
test('measurement explorer never invents absent values, thresholds or Z-scores',()=>{
  const missing=getScanMeasurements({findings:'Unstructured text'})
  for(const group of Object.values(missing))for(const value of Object.values(group))assert.equal(value,'—')
  const entered=getScanMeasurements({pediatric_echo_report:{biometry:{lvef:'0'}},fetal_echo_report:{aortic:{aortic_valve:{z_score:'1.23'}}}})
  assert.equal(entered.mMode.lvef,'0');assert.equal(entered.zScores.aoAnnulusZ,'1.23')
})
