import { useEffect, useState } from 'react'
import api from '../api/axios'

export function useDerivedDefinitions() {
  const [definitions,setDefinitions] = useState([])
  useEffect(()=>{api.get('/workflow/calculations').then(r=>setDefinitions(r.data.data || [])).catch(()=>setDefinitions([]))},[])
  return definitions
}
export function DerivedStatus({ report }) {
  const states=Object.entries(report._derived_status || {})
  if(!states.length)return null
  return <details className="no-print rounded-lg border bg-slate-50 p-3"><summary>Calculated measurement status</summary><p className="my-2 text-sm">Calculated fields are read-only. Results require an approved formula and valid source inputs.</p>{states.map(([path,state])=><p className="text-sm" key={path}>{path.replaceAll('_',' ')}: {state.status}</p>)}</details>
}

export function currentUser() {
  try { return JSON.parse(sessionStorage.getItem('echoai_user') || localStorage.getItem('echoai_user') || '{}') } catch { return {} }
}
export function ApprovalControls({ report, updateReport }) {
  const role = currentUser().role
  const imp = report.impression || {}
  return <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 p-3">
    <span>Audit: {imp.audit_done ? `Done — ${imp.audited_by || ''}` : 'Pending'}</span>
    {['L2', 'L3'].includes(role) && <label><input type="checkbox" checked={Boolean(imp.audit_done)} onChange={e => updateReport(['impression', 'audit_done'], e.target.checked)} /> Auditing done</label>}
    {role === 'L3' && <label><input type="checkbox" checked={Boolean(imp.report_completed)} onChange={e => updateReport(['impression', 'report_completed'], e.target.checked)} /> Report completed</label>}
    {imp.report_completed && <span>Completed reports are read-only after saving.</span>}
  </div>
}
export function ClinicalFooter({ onSave, saving, message, patientId }) {
  return <div className="no-print sticky bottom-0 z-20 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white p-3 shadow-lg">
    <button type="button" disabled={saving} onClick={onSave} className="primary-button">{saving ? 'Saving…' : 'Save report'}</button>
    {patientId && <a className="secondary-button" href={`/visits?patient=${encodeURIComponent(patientId)}`}>Patient visit history</a>}
    <span role="status" aria-live="polite">{message || 'Save your changes before moving to another section.'}</span>
  </div>
}
export function FindingNotes({ report, updateReport }) {
  const fields = []
  const walk = (node, path = ['echo_details']) => {
    for (const [key, value] of Object.entries(node || {})) {
      if (value && typeof value === 'object') walk(value, [...path, key])
      else if (typeof value === 'string' && !key.includes('comment')) fields.push({path:[...path,key],value})
    }
  }
  walk(report.echo_details)
  return <details className="no-print my-3 rounded-lg border bg-white p-3"><summary className="cursor-pointer font-semibold">Comments for individual findings</summary><div className="mt-3 grid gap-3 md:grid-cols-2">{fields.map(({path,value})=>{
    const key=path.at(-1), parent=path.slice(0,-1).reduce((n,k)=>n?.[k],report)
    const abnormal=value.trim().toLowerCase()==='abnormal'
    return <label className="field-label" key={path.join('.')}><span>{path.slice(1).map(label).join(' / ')}{abnormal?' — description required':''}</span><textarea className="field-control" rows={2} value={parent?.[key+'_comments'] || ''} onChange={e=>updateReport([...path.slice(0,-1),key+'_comments'],e.target.value)}/></label>
  })}</div></details>
}
export function reportErrors(report, fetal = false, completing = false) {
  const errors = []
  if (!String(report.indication || '').trim()) errors.push('Enter an indication.')
  if (fetal) {
    const lmp = report.lmp || {}
    if (!lmp.lmp_date && !lmp.edd && !(typeof lmp.et_date === 'string' && lmp.et_date)) errors.push('Enter LMP, EDD or embryo transfer date.')
    if (!/^\d+$/.test(String(report.no_of_fetuses || '')) || Number(report.no_of_fetuses) < 1) errors.push('Enter the number of fetuses as a positive whole number.')
  }
  if (completing && !report.impression?.primary_consultant) errors.push('Primary consultant is required for completion.')
  if (completing && !report.impression?.final_impression?.trim()) errors.push('Final impression is required for completion.')
  return errors
}
export function useSavedNavigation(report) {
  const [saved, setSaved] = useState(JSON.stringify(report))
  const dirty = saved !== JSON.stringify(report)
  useEffect(() => {
    const warn = e => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  return { dirty, markSaved: value => setSaved(JSON.stringify(value)), navigateSection: (action, showError, errors = []) => {
    if (errors.length) { showError('Cannot advance. ' + errors.join(' ')); return }
    if (dirty) { showError('Not saved. Save this section before opening another section.'); return }
    action()
  } }
}
const omit = new Set(['_derived_status', '_derived_legacy', 'impression', 'images', 'print_options', 'referral_letter', 'report_template', 'report_settings', 'template', 'scan_type', 'indication', 'tag', 'no_of_fetuses', 'ga_weeks', 'ga_days', 'lmp', 'iot'])
const populated = value => value && typeof value === 'object' ? Object.values(value).some(populated) : value !== '' && value !== null && value !== undefined && value !== false
const label = key => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
function Values({ node }) {
  if (!node || typeof node !== 'object') return null
  return Object.entries(node).filter(([k,v]) => !k.endsWith('_enabled') && populated(v)).map(([k,v]) => typeof v === 'object'
    ? <section key={k} className="mb-3"><h3 className="font-semibold">{label(k)}</h3><Values node={v}/></section>
    : <div key={k} className="flex gap-3 border-b border-slate-100 py-1"><span className="w-1/2">{label(k)}</span><span>{v === true ? 'Yes' : String(v)}</span></div>)
}
export function ClinicalPreview({ report, patient, visitId, title, onClose }) {
  const [visit, setVisit] = useState(null)
  useEffect(() => { if (patient?.id && visitId) api.get(`/patients/${patient.id}/visits`).then(r => setVisit((r.data.data || []).find(v => String(v.id) === String(visitId)))).catch(() => setVisit(null)) }, [patient?.id, visitId])
  return <div className="fixed inset-0 z-50 overflow-auto bg-slate-800/90 p-4 clinical-preview">
    <div className="no-print mx-auto mb-3 flex max-w-4xl gap-3"><button className="primary-button" onClick={() => window.print()}>Print / Save PDF</button><button className="secondary-button" onClick={onClose}>Close preview</button></div>
    <article className="clinical-print mx-auto max-w-4xl bg-white p-10 text-slate-900">
      <header className="mb-5 border-b pb-4"><h2 className="text-xl font-semibold">{[patient?.salutation, patient?.first_name, patient?.last_name].filter(Boolean).join(' ')}</h2><p>Patient ID: {patient?.patient_id || '—'} · {patient?.age ?? '—'} {patient?.age_unit || 'Years'} · {patient?.gender || '—'}</p><p>Visit: {visitId || '—'} · Referred by: {visit?.referral_doctor || patient?.family_doctor || '—'}</p></header>
      <h1 className="mb-3 text-center text-2xl font-bold">{title}</h1><p className="mb-5"><strong>Indication: </strong>{report.indication || '—'}</p>
      {report.impression?.first_line && <p className="mb-3 whitespace-pre-wrap">{report.impression.first_line}</p>}
      {report.impression?.header_comments && <p className="mb-3 whitespace-pre-wrap">{report.impression.header_comments}</p>}
      {report.lmp && <section className="mb-4"><h2 className="font-bold">Fetal profile</h2><p>LMP: {report.lmp.lmp_date || '—'} · EDD: {report.lmp.edd || '—'}{typeof report.lmp.et_date === 'string' && report.lmp.et_date ? ` · Embryo transfer: ${report.lmp.et_date}` : ''}</p><p>Number of fetuses: {report.no_of_fetuses || '—'}{report.ga_weeks ? ` · Gestation: ${report.ga_weeks} weeks ${report.ga_days || '0'} days` : ''}</p></section>}
      {Object.entries(report).filter(([k,v]) => !omit.has(k) && v && typeof v === 'object').map(([k,v]) => <section key={k} className="mb-5"><h2 className="border-b text-lg font-bold">{label(k)}</h2><Values node={v}/></section>)}
      {report.impression?.final_impression && <section className="mb-4"><h2 className="font-bold">Final impression</h2><p className="whitespace-pre-wrap">{report.impression.final_impression}</p></section>}
      {report.impression?.footer_comments && <p className="whitespace-pre-wrap">{report.impression.footer_comments}</p>}
      <footer className="mt-8 flex justify-between"><span>{report.impression?.primary_consultant || ''}</span><span>{report.impression?.second_consultant || ''}</span></footer>
    </article>
  </div>
}
export function WorkflowUsers() {
  const [users,setUsers] = useState([]), [message,setMessage] = useState('')
  const [form,setForm] = useState({username:'',name:'',role:'L1',password:''})
  const load = () => api.get('/workflow/users').then(r=>setUsers(r.data.data || [])).catch(()=>setMessage('Unable to load workflow users.'))
  useEffect(()=>{if(currentUser().role==='L3')load()},[])
  if(currentUser().role!=='L3')return null
  return <section className="rounded-xl border bg-white p-4"><h2 className="text-lg font-semibold">Clinical workflow access</h2><p className="text-sm">L1: entry · L2: entry and audit · L3: entry, audit and final completion</p><form onSubmit={async e=>{e.preventDefault();try{await api.post('/workflow/users',form);setForm({username:'',name:'',role:'L1',password:''});setMessage('User created.');load()}catch(err){setMessage(err.response?.data?.detail || 'Unable to create user.')}}} className="my-3 grid gap-2 md:grid-cols-5">{['name','username','password'].map(k=><input key={k} required minLength={k==='password'?12:1} type={k==='password'?'password':'text'} className="field-control" placeholder={k==='password'?'Password (12+ characters)':label(k)} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>)}<select className="field-control" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{['L1','L2','L3'].map(r=><option key={r}>{r}</option>)}</select><button className="primary-button">Create user</button></form><p role="status">{message}</p>{users.map(u=><p key={u.username}>{u.name} · {u.username} · {u.role}</p>)}</section>
}
