import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
const root=path.resolve(import.meta.dirname,'../..')
const csv=value=>'"'+String(value??'').replaceAll('"','""')+'"'
const rows=[['Scan type','Section','Sequence in stored template','Field path','Value type','Mandatory/optional rule','Add/remove decision','Lower range','Upper range','Formula/method/source','Clinical approval']]
for(const kind of ['Fetal','Adult','Pediatric']){
 const source=await fs.readFile(path.join(root,`frontend/src/pages/${kind}EchoReport.jsx`),'utf8')
 const start=source.indexOf('const initialReport = '),open=source.indexOf('{',start),end=source.indexOf('\n}',open)+2
 if(start<0||end<2)throw Error('Initial template not found: '+kind)
 const report=vm.runInNewContext('('+source.slice(open,end)+')',{defaultFinalImpression:'',defaultReferralLetter:''})
 let order=0
 function walk(node,trail=[]){for(const [key,value] of Object.entries(node)){
  const field=[...trail,key]
  if(value&&typeof value==='object'&&!Array.isArray(value))walk(value,field)
  else rows.push([`${kind} Echo`,field[0],++order,field.join('.'),Array.isArray(value)?'array':typeof value,'See reportValidation.js and clinical_workflow.py; final clinical approval pending','Review required','','','Not configured without approved source','Pending'])
 }}
 walk(report)
}
await fs.writeFile(path.join(root,'docs/clinical-field-inventory.csv'),rows.map(row=>row.map(csv).join(',')).join('\n')+'\n')
console.log(`${rows.length-1} stored template fields inventoried; sequence is not a claimed clinician-approved UI order.`)
