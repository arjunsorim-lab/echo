import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, MessageSquare, Plus, Stethoscope, Trash2, Users } from 'lucide-react'
import { patientService } from '../api/patientService'
import { referralDoctorService } from '../api/referralDoctorService'
import { workspaceService } from '../api/workspaceService'

const blank = { patient_id: '', activity_type: 'Follow-up', subject: '', due_at: '', status: 'Open', notes: '' }

export default function CRM() {
  const [patients,setPatients]=useState([]), [doctors,setDoctors]=useState([]), [visits,setVisits]=useState([]), [activities,setActivities]=useState([])
  const [form,setForm]=useState(blank), [error,setError]=useState(''), [saving,setSaving]=useState(false)
  const load=()=>Promise.all([patientService.getPatients(),referralDoctorService.getReferralDoctors(),patientService.getAllVisits(),workspaceService.list('crm-activities')]).then(([p,d,v,a])=>{setPatients(p.data||[]);setDoctors(d.data||[]);setVisits(v.data||[]);setActivities(a.data||[])}).catch(()=>setError('CRM data could not be loaded.'))
  useEffect(()=>{load()},[])
  const patientMap=useMemo(()=>new Map(patients.map(p=>[String(p.id),p])),[patients])
  const open=activities.filter(item=>item.status!=='Completed').length
  const cards=[['Patients',patients.length,Users,'/patients'],['Referral doctors',doctors.length,Stethoscope,'/referral-doctors'],['Visits',visits.length,CalendarDays,'/visits'],['Open activities',open,MessageSquare,'#activities']]
  const save=async(e)=>{e.preventDefault();setError('');if(!form.subject.trim()){setError('Enter an activity subject.');return}setSaving(true);try{await workspaceService.create('crm-activities',form);setForm(blank);await load()}catch{setError('The CRM activity could not be saved.')}finally{setSaving(false)}}
  const complete=async(item)=>{try{await workspaceService.update('crm-activities',item.id,{...item,status:'Completed'});await load()}catch{setError('The activity could not be completed.')}}
  const remove=async(id)=>{try{await workspaceService.remove('crm-activities',id);await load()}catch{setError('The activity could not be deleted.')}}
  return <div className="space-y-5 p-4">
    <div><p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Clinical relationships</p><h1 className="text-2xl font-bold">CRM</h1><p className="mt-1 text-sm text-slate-500">Track appointments, follow-ups, communications, patients, and referrals.</p></div>
    {error&&<p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,Icon,to])=><Link key={label} to={to} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-teal-700"/><p className="mt-4 text-3xl font-bold">{value}</p><p className="text-sm text-slate-500">{label}</p></Link>)}</div>
    <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Add CRM activity</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <select className="field-control" value={form.patient_id} onChange={e=>setForm({...form,patient_id:e.target.value})}><option value="">No patient selected</option>{patients.map(p=><option key={p.id} value={p.id}>{p.patient_id} — {p.first_name} {p.last_name}</option>)}</select>
      <select className="field-control" value={form.activity_type} onChange={e=>setForm({...form,activity_type:e.target.value})}>{['Appointment','Follow-up','Phone call','Email','Note'].map(type=><option key={type}>{type}</option>)}</select>
      <input className="field-control" placeholder="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/><input className="field-control" type="datetime-local" value={form.due_at} onChange={e=>setForm({...form,due_at:e.target.value})}/><button type="submit" className="primary-button" disabled={saving}><Plus className="h-4 w-4"/>{saving?'Saving…':'Add activity'}</button>
    </div><textarea className="field-control mt-3" rows="2" placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></form>
    <div id="activities" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b p-4 font-semibold">Appointments, follow-ups, and communications</div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Patient</th><th>Type</th><th>Subject</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>{activities.map(item=>{const p=patientMap.get(String(item.patient_id));return <tr key={item.id}><td>{p?`${p.first_name||''} ${p.last_name||''}`.trim():'—'}</td><td>{item.activity_type}</td><td>{item.subject}{item.notes&&<div className="text-xs text-slate-500">{item.notes}</div>}</td><td>{item.due_at?new Date(item.due_at).toLocaleString():'—'}</td><td>{item.status}</td><td><div className="flex gap-2">{item.status!=='Completed'&&<button type="button" className="secondary-button" onClick={()=>complete(item)}><CheckCircle2 className="h-4 w-4"/>Complete</button>}<button type="button" className="secondary-button text-red-700" onClick={()=>remove(item.id)}><Trash2 className="h-4 w-4"/>Delete</button></div></td></tr>})}{!activities.length&&<tr><td colSpan="6" className="py-8 text-center text-slate-500">No CRM activities recorded.</td></tr>}</tbody></table></div></div>
  </div>
}
