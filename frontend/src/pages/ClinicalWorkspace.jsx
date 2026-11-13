import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileDown, FileText, Film, Mail, Plus, Printer, Save, Trash2, Upload } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Field, FieldGrid, Section, Tabs, Workspace } from '../components/WorkspaceUI'
import SearchableSelect from '../components/SearchableSelect'
import { patientService } from '../api/patientService'
import { referralDoctorService } from '../api/referralDoctorService'
import { workspaceService } from '../api/workspaceService'
import {
  adult2D, adultDoppler, aortic, echoSections, fetalBiometry, fetalDoppler, impressionFields,
  lmpFields, mMode, pediatricBiometry, pediatricDoppler, pisa,
} from '../data/clinicalFields'

const tabsByType = {
  'Adult Echo': ['Echo details', '2D measurements', 'M-Mode', 'Doppler', 'PISA', 'Aortic Stenosis', 'Impression', 'Multiframes', 'Preview'],
  'Pediatric Echo': ['Echo details', 'Biometry', 'Doppler', 'Custom measurements', 'Impression', 'Multiframes', 'Preview'],
  'Fetal Echo': ['LMP details', 'Echo details', 'Aortic', 'Biometry', 'Doppler', 'Impression', 'Multiframes', 'Preview'],
  Ultrasound: ['Ultrasound details', 'Impression', 'Preview'],
}

const indications = ['Routine assessment', 'Chest pain', 'Shortness of breath', 'Palpitations', 'Murmur', 'Heart failure', 'Pre-operative assessment', 'Follow-up', 'Other']
const machineReadOnlyKeys = ['bsa', 'fractionalShortening', 'avPeakGrad', 'rvsp', 'trPeakGrad']

const formatFields = [
  {key:'imageColumns',label:'Images per row',type:'select',options:['1','2','3','4']},
  {key:'investigationStatus',label:'Investigation status',type:'select',options:['Draft','In progress','Completed']},
]

const emptyData = () => ({ imageColumns:'1', investigationStatus:'Draft', customMeasurements:[{name:'',value:'',unit:'mm'}], clips:[] })

export default function ClinicalWorkspace({ initialType = 'Adult Echo' }) {
  const [params, setParams] = useSearchParams()
  const [scanType, setScanType] = useState(params.get('type') || initialType)
  const [activeTab, setActiveTab] = useState(tabsByType[params.get('type') || initialType][0])
  const [data, setData] = useState(emptyData)
  const [reportId, setReportId] = useState('')
  const [patients, setPatients] = useState([])
  const [visits, setVisits] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patientId, setPatientId] = useState(params.get('patient') || '')
  const [visitId, setVisitId] = useState(params.get('visit') || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [reportLocked, setReportLocked] = useState(false)
  const [history, setHistory] = useState([])
  const [clips, setClips] = useState([])
  const [studyMedia, setStudyMedia] = useState([])
  const [mediaError, setMediaError] = useState('')
  const [dicomwebConfigured, setDicomwebConfigured] = useState(false)

  const patientOptions = useMemo(() => {
    return patients.map((item) => ({
      value: item.id,
      label: `${item.patient_id || ''} — ${item.first_name || ''} ${item.last_name || ''}`.trim(),
    }))
  }, [patients])

  useEffect(() => {
    Promise.all([patientService.getPatients(), referralDoctorService.getReferralDoctors()])
      .then(([p, d]) => { setPatients(p.data || []); setDoctors(d.data || []) })
      .catch(() => { setPatients([]); setDoctors([]) })
    workspaceService.getDicomwebStatus().then((result) => setDicomwebConfigured(Boolean(result.configured))).catch(() => setDicomwebConfigured(false))
  }, [])

  useEffect(() => {
    const urlType = params.get('type')
    if (urlType && tabsByType[urlType] && urlType !== scanType) {
      setScanType(urlType)
      setActiveTab(tabsByType[urlType][0])
    }
  }, [params, scanType])

  useEffect(() => {
    if (!patientId) { setVisits([]); setVisitId(''); return }
    patientService.getVisits(patientId).then((result) => setVisits(result.data || [])).catch(() => setVisits([]))
  }, [patientId])

  useEffect(() => {
    setSaved(false)
    workspaceService.getReports({ patient_id: patientId || undefined, visit_id: visitId || undefined })
      .then((result) => {
        const match = (result.data || []).find((report) => report.scan_type === scanType)
        if (match) {
          const reportData = match.data || (typeof match.findings === 'string' ? JSON.parse(match.findings || '{}') : match.findings) || {}
          setReportId(match.id)
          workspaceService.getReportHistory(match.id).then((historyResult) => setHistory(historyResult.data || [])).catch(() => setHistory([]))
          setReportLocked((match.status || reportData.investigationStatus || '').toLowerCase() === 'completed')
          setData({...emptyData(), ...reportData, investigationStatus:match.status || reportData.investigationStatus || 'Draft'})
          setSavedSnapshot(JSON.stringify({...emptyData(), ...reportData, investigationStatus:match.status || reportData.investigationStatus || 'Draft'}))
        }
        else { setReportId(''); setReportLocked(false); setHistory([]); setData(emptyData()); setSavedSnapshot('') }
      }).catch(() => { setReportId(''); setReportLocked(false); setHistory([]); setData(emptyData()); setSavedSnapshot('') })
  }, [patientId, visitId, scanType])

  useEffect(() => {
    if (!patientId || !visitId) { setStudyMedia([]); return }
    workspaceService.getMediaRecords({ patient_id: patientId, visit_id: visitId })
      .then((result) => setStudyMedia(result.data || []))
      .catch(() => setStudyMedia([]))
  }, [patientId, visitId])

  const patient = patients.find((item) => String(item.id) === String(patientId))
  const reportTitle = `${scanType} Report${patient ? ` - ${patient.first_name || ''} ${patient.last_name || ''}`.trim() : ''}`
  const patientDetails = patient ? `${patient.patient_id || ''} · ${patient.first_name || ''} ${patient.last_name || ''} · ${patient.dob || (patient.age ? `${patient.age} ${patient.age_unit || 'Years'}` : '')} · ${patient.gender || ''} · ${patient.mobile || ''}` : ''
  const changeType = (type) => { setScanType(type); setActiveTab(tabsByType[type][0]); setParams((current) => { current.set('type', type); return current }) }

  const calculated = useMemo(() => {
    const next = {}
    const weight = Number(data.weight), height = Number(data.height)
    if (weight && height) next.bsa = Math.sqrt((weight * height) / 3600).toFixed(2)
    const lvedd = Number(data.lvedd), lvesd = Number(data.lvesd)
    if (lvedd && lvesd) next.fractionalShortening = (((lvedd - lvesd) / lvedd) * 100).toFixed(1)
    const av = Number(data.avVmax || data.aorticValveVmax)
    if (av) next.avPeakGrad = (4 * av * av).toFixed(1)
    const tr = Number(data.trVmax)
    if (tr) next.rvsp = (4 * tr * tr + Number(data.rap || 3)).toFixed(1)
    if (data.lmp && !Number.isNaN(Date.parse(data.lmp))) {
      const elapsedDays = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(`${data.lmp}T00:00:00`).getTime()) / 86400000)
      if (elapsedDays >= 0) {
        next.gaWeeks = Math.floor(elapsedDays / 7)
        next.gaDays = elapsedDays % 7
      }
    }
    return next
  }, [data.weight, data.height, data.lvedd, data.lvesd, data.avVmax, data.aorticValveVmax, data.trVmax, data.rap])

  const save = async () => {
    setSaveError('')
    if (!patientId || !visitId) {
      setSaveError('Select a patient and visit before saving this reporting page.')
      return false
    }
    if (scanType === 'Fetal Echo') {
      if (!data.fetuses) {
        setSaveError('Select the number of fetuses before saving a fetal report.')
        return false
      }
      const datingInputs = [data.lmp, data.edd, data.etDate].filter(Boolean)
      if (datingInputs.length > 1) {
        setSaveError('Enter only one dating source: LMP, EDD, or embryo transfer date.')
        return false
      }
    }
    const invalidDate = Object.entries(data).find(([key, value]) => /date|lmp|edd/i.test(key) && value && Number.isNaN(Date.parse(value)))
    if (invalidDate) {
      setSaveError(`Enter a valid date for ${invalidDate[0]}.`)
      return false
    }
    for (const field of fields.filter((item) => item.type === 'number')) {
      const value = data[field.key]
      const lower = data[`${field.key}Lower`]
      const upper = data[`${field.key}Upper`]
      if (value !== '' && value != null && !Number.isFinite(Number(value))) {
        setSaveError(`${field.label} must be a valid number.`)
        return false
      }
      if (lower !== '' && upper !== '' && Number(lower) > Number(upper)) {
        setSaveError(`The lower range for ${field.label} cannot exceed its upper range.`)
        return false
      }
    }
    setSaving(true); setSaved(false)
    try {
      const fullData = {...data, investigationStatus: data.reportCompleted ? 'Completed' : data.investigationStatus, reportTitle, patientDetails, indication: data.customIndication || data.indication, ...calculated}
      let changedBy = ''
      try { changedBy = JSON.parse(localStorage.getItem('echoai_user') || sessionStorage.getItem('echoai_user') || '{}').name || '' } catch {}
      const payload = { patient_id:patientId, patient_display_id:patient?.patient_id || '', patient_name:patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : '', visit_id:visitId, scan_type:scanType, report_title:reportTitle, status:fullData.investigationStatus || 'Draft', changed_by:changedBy, data:fullData }
      const result = reportId ? await workspaceService.updateReport(reportId, payload) : await workspaceService.createReport(payload)
      setReportId(result.data.id); setData(fullData); setSaved(true); setSavedSnapshot(JSON.stringify(fullData)); setReportLocked(fullData.investigationStatus === 'Completed')
      if (result.data.id) workspaceService.getReportHistory(result.data.id).then((historyResult) => setHistory(historyResult.data || [])).catch(() => setHistory([]))
      return true
    } catch (error) {
      setSaveError(error.response?.data?.detail || 'Unable to save this reporting page.')
      return false
    } finally { setSaving(false) }
  }

  const navigateTab = async (direction) => {
    const tabs = tabsByType[scanType]
    const current = tabs.indexOf(activeTab)
    const next = current + direction
    if (next < 0 || next >= tabs.length) return
    const savedOk = savedSnapshot === JSON.stringify(data) || await save()
    if (savedOk) setActiveTab(tabs[next])
  }

  const addFiles = async (event) => {
    const files = [...(event.target.files || [])]
    event.target.value = ''
    if (!patientId || !visitId) { setMediaError('Select a patient and visit before importing study media.'); return }
    setMediaError('')
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      form.append('patient_id', patientId)
      form.append('visit_id', visitId)
      try {
        await workspaceService.uploadMedia(form)
      } catch (error) {
        setMediaError(error.response?.data?.detail || `Unable to import ${file.name}.`)
      }
    }
    workspaceService.getMediaRecords({ patient_id: patientId, visit_id: visitId })
      .then((result) => setStudyMedia(result.data || []))
      .catch(() => setStudyMedia([]))
  }
  const fields = activeTab === '2D measurements' ? adult2D : activeTab === 'M-Mode' ? mMode : activeTab === 'PISA' ? pisa : activeTab === 'Aortic' || activeTab === 'Aortic Stenosis' ? aortic : activeTab === 'Biometry' ? (scanType === 'Fetal Echo' ? fetalBiometry : pediatricBiometry) : activeTab === 'Doppler' ? (scanType === 'Adult Echo' ? adultDoppler : scanType === 'Fetal Echo' ? fetalDoppler : pediatricDoppler) : []

  return <Workspace title={`${scanType} reporting`} description="Patient-linked measurements, images, impression, referral letter and report output." actions={<><button className="primary-button" onClick={save} disabled={saving || reportLocked}><Save className="h-4 w-4" />{saving?'Saving…':'Save report'}</button>{saved&&<span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4"/>Saved to database</span>}</>}>
    {saveError&&<p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>}
    <Section title="Patient and visit" className="mb-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="field-label">
          <span>Patient</span>
          <SearchableSelect
            options={patientOptions}
            value={patientId}
            onChange={(val) => { setPatientId(val); setVisitId('') }}
            placeholder="Select"
            searchPlaceholder="Search patient ID or name..."
          />
        </div>
        <label className="field-label">
          <span>Visit</span>
          <select className="field-control" value={visitId} onChange={(e)=>setVisitId(e.target.value)}>
            <option value="">Select</option>
            {visits.map((visit)=><option key={visit.id} value={visit.id}>{visit.visit_date ? new Date(visit.visit_date).toLocaleString() : visit.id}</option>)}
          </select>
        </label>
        <Field label="Report title" value={reportTitle} readOnly onChange={()=>{}}/>
        <Field label="Common indication" type="select" options={indications} value={indications.includes(data.indication) ? data.indication : ''} onChange={(value)=>setData({...data,indication:value,customIndication:''})}/>
        <Field label="Other indication / details" value={data.customIndication || (indications.includes(data.indication) ? '' : data.indication)} onChange={(value)=>setData({...data,customIndication:value,indication:value})}/>
      </div>
    </Section>
    <fieldset disabled={reportLocked} className="min-w-0">
    <FieldGrid columns="lg:grid-cols-5" fields={formatFields} data={data} setData={setData}/>
    <div className="mt-4"><Tabs items={tabsByType[scanType]} value={activeTab} onChange={async (tab) => {
      const current = tabsByType[scanType].indexOf(activeTab)
      const requested = tabsByType[scanType].indexOf(tab)
      if (requested <= current && savedSnapshot === JSON.stringify(data)) setActiveTab(tab)
    }}/></div>

    {activeTab==='Ultrasound details'&&<Section title="Ultrasound details"><Field label="Study notes" type="textarea" value={data.comments} onChange={(value)=>setData({...data,comments:value})}/></Section>}
    {activeTab==='LMP details'&&<Section title="Pregnancy dating"><FieldGrid fields={lmpFields.map((field)=>({...field,type:['lmp','edd','etDate','btDate'].includes(field.key)?'date':field.type,required:field.key==='fetuses'}))} data={data} setData={setData}/></Section>}
    {activeTab==='Echo details'&&<div className="space-y-4">{echoSections.map((section)=><Section key={section.title} title={section.title}><FindingGrid fields={section.fields} data={data} setData={setData}/></Section>)}<Section title="Additional details"><div className="grid gap-3 lg:grid-cols-2"><Field type="textarea" rows={8} label="Additional comments" value={data.comments} onChange={(value)=>setData({...data,comments:value})}/><Field type="textarea" rows={8} label="Default normal comments" value={data.normalComments} onChange={(value)=>setData({...data,normalComments:value})}/></div></Section></div>}
    {fields.length>0&&<Section title={activeTab} description="All blank measurements are omitted from the final report. Calculated fields update when their source measurements are entered."><MeasurementGrid fields={fields.map((field)=>machineReadOnlyKeys.includes(field.key)?{...field,readOnly:true}:field)} data={{...data,...calculated}} setData={setData} showZScore={scanType!=='Adult Echo'&&['Biometry','Aortic'].includes(activeTab)}/>{Object.keys(calculated).length>0&&<div className="mt-4 rounded-lg bg-primary-50 p-3 text-sm text-primary-800">Calculated: {Object.entries(calculated).map(([key,value])=><span className="mr-4" key={key}><strong>{key.replace(/([A-Z])/g,' $1')}:</strong> {value}</span>)}</div>}</Section>}
    {activeTab==='Custom measurements'&&<CustomMeasurements data={data} setData={setData}/>}
    {activeTab==='Impression'&&<Impression data={data} setData={setData} doctors={doctors}/>}
    {activeTab==='Referral letter'&&<ReferralLetter data={data} setData={setData} doctors={doctors} patient={patient}/>}
    {activeTab==='Multiframes'&&<Multiframes clips={clips} setClips={setClips} addFiles={addFiles} media={studyMedia} error={mediaError} dicomwebConfigured={dicomwebConfigured} patientId={patientId} visitId={visitId} selectedMedia={data.selectedMedia||[]} setSelectedMedia={(selectedMedia)=>setData({...data,selectedMedia})} setMediaFrame={(id,frame)=>setData({...data,reportMediaFrames:{...data.reportMediaFrames,[id]:frame}})} onImported={()=>workspaceService.getMediaRecords({patient_id:patientId,visit_id:visitId}).then((result)=>setStudyMedia(result.data||[]))}/>}
    {activeTab==='Preview'&&<ReportPreview scanType={scanType} data={{...data,...calculated,reportTitle,patientDetails}} setData={setData} patient={patient} media={studyMedia}/>}
    <div className="mt-5 flex justify-between">
      <button type="button" className="secondary-button" onClick={() => navigateTab(-1)} disabled={tabsByType[scanType].indexOf(activeTab) === 0}>Back</button>
      <button type="button" className="primary-button" onClick={() => navigateTab(1)} disabled={saving || tabsByType[scanType].indexOf(activeTab) === tabsByType[scanType].length - 1}>Save &amp; Next</button>
    </div>
    {reportId&&<details className="mt-4 rounded-lg border border-slate-200 bg-white p-3"><summary className="cursor-pointer text-sm font-semibold">Field change history ({history.length})</summary><div className="mt-3 max-h-56 overflow-auto text-xs">{history.length?history.map((item,index)=><div key={`${item.field_path}-${index}`} className="grid gap-1 border-t border-slate-100 py-2 sm:grid-cols-[1.5fr_1fr_1fr_1fr]"><span className="font-semibold">{item.field_path}</span><span>Old: {item.old_value ?? '—'}</span><span>New: {item.new_value ?? '—'}</span><span>{item.changed_by || 'Unknown'} · {item.changed_at}</span></div>):<p className="py-2 text-slate-500">No field changes recorded.</p>}</div></details>}
    </fieldset>
  </Workspace>
}

function FindingGrid({fields,data,setData}) { return <div className="grid gap-3 lg:grid-cols-2">{fields.map((field)=><div key={field.key} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-2"><Field label={field.label} type={field.type} options={field.options} addable={field.addable} optionField={field.key} value={data[field.key]} onChange={(value)=>setData({...data,[field.key]:value})}/><Field label={`${field.label} comments`} value={data[`${field.key}Comment`]} onChange={(value)=>setData({...data,[`${field.key}Comment`]:value})}/></div>)}</div> }

function MeasurementGrid({fields,data,setData,showZScore}) {
  return <div className="grid gap-3 lg:grid-cols-2">{fields.map((field)=>{
    const z = Number(data[`${field.key}ZScore`])
    const zLower = Number(data[`${field.key}ZScoreLower`])
    const zUpper = Number(data[`${field.key}ZScoreUpper`])
    const abnormalZ = Number.isFinite(z) && ((data[`${field.key}ZScoreLower`] !== '' && z < zLower) || (data[`${field.key}ZScoreUpper`] !== '' && z > zUpper))
    const value = Number(data[field.key])
    const lower = Number(data[`${field.key}Lower`])
    const upper = Number(data[`${field.key}Upper`])
    const outsideRange = data[field.key] !== '' && ((data[`${field.key}Lower`] !== '' && value < lower) || (data[`${field.key}Upper`] !== '' && value > upper))
    return <div key={field.key} className={`grid gap-2 rounded-lg border p-3 ${abnormalZ||outsideRange?'border-red-300 bg-red-50':'border-slate-100 bg-slate-50'}`}>
      <Field label={field.label} type={field.type} options={field.options} addable={field.addable} value={data[field.key]} readOnly={field.readOnly} onChange={(value)=>setData({...data,[field.key]:value})}/>
      <Field label={`${field.label} comment`} value={data[`${field.key}Comment`]} onChange={(value)=>setData({...data,[`${field.key}Comment`]:value})}/>
      {field.type==='number'&&<div className="grid grid-cols-2 gap-2"><Field label="Lower range" type="number" value={data[`${field.key}Lower`]} onChange={(value)=>setData({...data,[`${field.key}Lower`]:value})}/><Field label="Upper range" type="number" value={data[`${field.key}Upper`]} onChange={(value)=>setData({...data,[`${field.key}Upper`]:value})}/></div>}
      {showZScore&&<><Field label="Z-score" type="number" value={data[`${field.key}ZScore`]} onChange={(value)=>setData({...data,[`${field.key}ZScore`]:value})}/><div className="grid grid-cols-2 gap-2"><Field label="Z-score lower limit" type="number" value={data[`${field.key}ZScoreLower`]} onChange={(value)=>setData({...data,[`${field.key}ZScoreLower`]:value})}/><Field label="Z-score upper limit" type="number" value={data[`${field.key}ZScoreUpper`]} onChange={(value)=>setData({...data,[`${field.key}ZScoreUpper`]:value})}/></div></>}
      {abnormalZ&&<p className="text-xs font-semibold text-red-700">Outside configured Z-score limits</p>}
      {outsideRange&&<p className="text-xs font-semibold text-red-700">Outside entered lower/upper range</p>}
    </div>
  })}</div>
}

function CustomMeasurements({data,setData}) {
  const rows=data.customMeasurements||[]
  const update=(index,key,value)=>setData({...data,customMeasurements:rows.map((row,i)=>i===index?{...row,[key]:value}:row)})
  return <Section title="Custom measurements"><div className="space-y-2">{rows.map((row,index)=><div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_140px_1fr_auto]"><input className="field-control" placeholder="Measurement name" value={row.name} onChange={(e)=>update(index,'name',e.target.value)}/><input className="field-control" placeholder="Value" value={row.value} onChange={(e)=>update(index,'value',e.target.value)}/><select className="field-control" value={row.unit} onChange={(e)=>update(index,'unit',e.target.value)}>{['mm','cm','m/s','cm/s','mmHg','%','ms'].map((unit)=><option key={unit}>{unit}</option>)}</select><input className="field-control" placeholder="Z-score / comment" value={row.comment||''} onChange={(e)=>update(index,'comment',e.target.value)}/><button className="secondary-button" onClick={()=>setData({...data,customMeasurements:rows.filter((_,i)=>i!==index)})}><Trash2 className="h-4 w-4"/></button></div>)}</div><button className="secondary-button mt-3" onClick={()=>setData({...data,customMeasurements:[...rows,{name:'',value:'',unit:'mm',comment:''}]})}><Plus className="h-4 w-4"/>Add measurement</button></Section>
}

function Impression({data,setData,doctors}) {
  const names=doctors.map((doctor)=>doctor.doctor_type==='hospital'?doctor.institution_name:`${doctor.first_name||''} ${doctor.last_name||''}`.trim()).filter(Boolean)
  return <div className="space-y-4"><Section title="Report details"><FieldGrid fields={impressionFields.map((field)=>['signedByLeft','signedByRight','primaryConsultant','secondConsultant','auditedBy','typedBy'].includes(field.key)?{...field,type:'select',options:names,addable:true}:field)} data={data} setData={setData}/><div className="mt-3 grid gap-3 sm:grid-cols-3"><Field label="Abnormal" type="checkbox" value={data.abnormal} onChange={(value)=>setData({...data,abnormal:value})}/><Field label="Ambiguity" type="checkbox" value={data.ambiguity} onChange={(value)=>setData({...data,ambiguity:value})}/><Field label="Growth abnormality" type="checkbox" value={data.growthAbnormality} onChange={(value)=>setData({...data,growthAbnormality:value})}/></div></Section><div className="grid gap-4 lg:grid-cols-2"><Section title="Comments"><Field type="textarea" rows={5} label="Header comments" value={data.headerComments} onChange={(value)=>setData({...data,headerComments:value})}/><div className="mt-3"><Field type="textarea" rows={5} label="Footer comments" value={data.footerComments} onChange={(value)=>setData({...data,footerComments:value})}/></div><div className="mt-3"><Field type="textarea" rows={5} label="System impression" value={data.systemImpression} onChange={(value)=>setData({...data,systemImpression:value})}/></div></Section><Section title="Finalisation"><Field type="textarea" rows={8} label="Final impression" value={data.impression} onChange={(value)=>setData({...data,impression:value})}/><div className="mt-3"><Field type="textarea" rows={4} label="Recommendations" value={data.recommendations} onChange={(value)=>setData({...data,recommendations:value})}/></div><div className="mt-3"><Field type="textarea" rows={4} label="Disclaimer comments" value={data.disclaimer} onChange={(value)=>setData({...data,disclaimer:value})}/></div><div className="mt-3"><Field type="textarea" rows={4} label="Internal comments (not printed)" value={data.internalComments} onChange={(value)=>setData({...data,internalComments:value})}/></div><div className="mt-3"><Field label="Auditing done" type="checkbox" value={data.auditingDone} onChange={(value)=>setData({...data,auditingDone:value})}/><Field label="Report completed" type="checkbox" value={data.reportCompleted} onChange={(value)=>setData({...data,reportCompleted:value})}/></div></Section></div></div>
}

function ReferralLetter({data,setData,doctors,patient}) {
  const names=doctors.map((doctor)=>doctor.doctor_type==='hospital'?doctor.institution_name:`${doctor.first_name||''} ${doctor.last_name||''}`.trim()).filter(Boolean)
  const createLetter=()=>setData({...data,letter:`Dear Doctor,\n\nThank you for referring ${patient?`${patient.salutation||''} ${patient.first_name||''} ${patient.last_name||''}`.trim():'the patient'}.\n\n${data.impression||''}\n\nThank you,\n${data.signedByRight||data.signedByLeft||''}`})
  return <Section title="Referral letter"><div className="grid gap-4 lg:grid-cols-[280px_1fr]"><div className="space-y-3"><Field label="Letter name" value={data.letterName} onChange={(value)=>setData({...data,letterName:value})}/><Field label="To" type="select" options={names} addable value={data.recipient} onChange={(value)=>setData({...data,recipient:value})}/><Field label="Letter copy to" type="select" options={names} addable value={data.copyTo} onChange={(value)=>setData({...data,copyTo:value})}/><Field label="Subject" value={data.subject} onChange={(value)=>setData({...data,subject:value})}/><button className="secondary-button" onClick={createLetter}><FileText className="h-4 w-4"/>Generate letter text</button></div><Field type="textarea" rows={18} label="Letter body" value={data.letter} onChange={(value)=>setData({...data,letter:value})}/></div></Section>
}

function Multiframes({clips,setClips,addFiles,media,error,dicomwebConfigured,patientId,visitId,onImported,selectedMedia,setSelectedMedia,setMediaFrame}) {
  const [frames, setFrames] = useState({})
  const [sendStatus, setSendStatus] = useState('')
  const [remoteStudies, setRemoteStudies] = useState([])
  const apiBase = import.meta.env.VITE_API_URL || '/api'
  const sendToPacs = async (id) => {
    setSendStatus('Sending study to DICOMweb…')
    try { await workspaceService.sendToDicomweb(id); setSendStatus('Study accepted by DICOMweb.') }
    catch (error) { setSendStatus(error.response?.data?.detail || 'Unable to send study to DICOMweb.') }
  }
  const searchPacs = async () => {
    if (!patientId) { setSendStatus('Select a patient before searching DICOMweb.'); return }
    setSendStatus('Searching DICOMweb…')
    try {
      const result = await workspaceService.searchDicomwebStudies(patientId)
      setRemoteStudies(result.data || [])
      setSendStatus(`${(result.data || []).length} matching study record(s) found.`)
    } catch (error) { setSendStatus(error.response?.data?.detail || 'Unable to query DICOMweb.') }
  }
  const importStudy = async (study) => {
    if (!visitId) { setSendStatus('Select a visit before importing a DICOMweb study.'); return }
    const uid = study['0020000D']?.Value?.[0]
    if (!uid) { setSendStatus('The DICOMweb study has no Study Instance UID.'); return }
    setSendStatus('Importing DICOMweb study…')
    try {
      const result = await workspaceService.importDicomwebStudy(uid, patientId, visitId)
      await onImported()
      setSendStatus(`${result.data?.length || 0} DICOM instance(s) imported.`)
    } catch (error) { setSendStatus(error.response?.data?.detail || 'Unable to import DICOMweb study.') }
  }
  return <Section title="Study images and cine" description="Imported files are saved against the selected patient and visit. DICOM multi-frame studies can be reviewed frame by frame.">
    <label className="primary-button mb-4 cursor-pointer"><Upload className="h-4 w-4"/>Import study files<input type="file" accept="video/*,.dcm,.dicom,application/dicom,image/*" multiple className="hidden" onChange={addFiles}/></label>
    {dicomwebConfigured&&<button className="secondary-button mb-4 ml-2" onClick={searchPacs}>Find patient studies in DICOMweb</button>}
    {error&&<p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {remoteStudies.length>0&&<div className="mb-4 space-y-2 rounded-lg border border-slate-200 p-3"><h3 className="font-semibold">DICOMweb studies for {patientId}</h3>{remoteStudies.map((study,index)=><div key={study['0020000D']?.Value?.[0]||index} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 py-2 text-sm"><span>{study['00080020']?.Value?.[0]||'Date unknown'} · {study['00081030']?.Value?.[0]||'Study'} · {study['0020000D']?.Value?.[0]}</span><button className="secondary-button" onClick={()=>importStudy(study)} disabled={!visitId}>Import to selected visit</button></div>)}</div>}
    {media.length||clips.length?<div className="grid gap-4 lg:grid-cols-2">
      {media.map((item)=><div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
        {item.modality||item.type?.startsWith('image/')? <><div className="flex items-center justify-between text-sm"><strong>{item.name}</strong>{item.modality&&<span>{item.modality} · {item.number_of_frames} frame{item.number_of_frames===1?'':'s'}</span>}</div>
          <img className="mt-3 max-h-[480px] w-full bg-black object-contain" src={item.modality?`${apiBase}/media-records/${item.id}/frames/${frames[item.id]||0}`:item.url} alt={`${item.name} frame ${(frames[item.id]||0)+1}`}/>
          {item.number_of_frames>1&&<label className="mt-3 block text-sm">Frame {(frames[item.id]||0)+1} of {item.number_of_frames}<input className="mt-2 w-full" type="range" min="0" max={item.number_of_frames-1} value={frames[item.id]||0} onChange={(event)=>{const frame=Number(event.target.value);setFrames({...frames,[item.id]:frame});setMediaFrame(item.id,frame)}}/></label>}
          <div className="mt-2 flex flex-wrap items-center gap-4"><a className="inline-block text-sm text-primary-700 underline" href={item.url} target="_blank" rel="noreferrer">Download original file</a>{item.modality&&dicomwebConfigured&&<button className="secondary-button" onClick={()=>sendToPacs(item.id)}>Send to DICOMweb</button>}</div></>
          : <><video src={item.url} controls className="aspect-video w-full bg-slate-950"/><p className="mt-2 text-sm">{item.name}</p></>}
        {(item.modality||item.type?.startsWith('image/'))&&<label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedMedia.includes(item.id)} onChange={(event)=>setSelectedMedia(event.target.checked?[...selectedMedia,item.id]:selectedMedia.filter((id)=>id!==item.id))}/>Include in report and print</label>}
      </div>)}
      {clips.map((clip,index)=><div key={`${clip.name}-${index}`} className="rounded-xl bg-slate-950 p-3"><video src={clip.url} controls className="aspect-video w-full"/><div className="mt-2 text-sm text-white">{clip.name} (not saved)</div></div>)}
    </div>:<div className="flex min-h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500"><Film className="mb-3 h-12 w-12 text-slate-300"/>No study media imported for this visit.</div>}
    {sendStatus&&<p role="status" className="mt-3 text-sm text-slate-700">{sendStatus}</p>}
  </Section>
}

function ReportPreview({scanType,data,setData,patient,media}) {
  const options=[{key:'reportType',label:'Report type',type:'select',options:['Report only','Report with images','With biometry graphs']},{key:'preprinted',label:'Preprinted stationery',type:'checkbox'},{key:'showLogo',label:'Logo',type:'checkbox'},{key:'showAlias',label:'Alias ID',type:'checkbox'},{key:'hideSectionTitles',label:'Hide section titles',type:'checkbox'},{key:'reportBorder',label:'Report border',type:'checkbox'},{key:'imageBorder',label:'Image border',type:'checkbox'},{key:'leftMargin',label:'Left margin',type:'number'},{key:'topMargin',label:'Top margin',type:'number'},{key:'lineSpacing',label:'Report line spacing',type:'number'},{key:'sectionSpacing',label:'Section spacing',type:'number'},{key:'landscape',label:'Landscape',type:'checkbox'},{key:'blackBackground',label:'Black image background',type:'checkbox'},{key:'footerLine',label:'Footer line',type:'checkbox'},{key:'pageNumberDate',label:'Page number and date',type:'checkbox'},{key:'printFooterText',label:'Print footer text',type:'checkbox'}]
  const entries=Object.entries(data).filter(([key,value])=>value!==''&&value!==false&&!['customMeasurements','patientDetails'].includes(key)&&typeof value!=='object').slice(0,90)
  const selectedMedia=(media||[]).filter((item)=>(data.selectedMedia||[]).includes(item.id))
  const apiBase=import.meta.env.VITE_API_URL||'/api'
  const mailBody=`${data.reportTitle||scanType}\nPatient: ${patient?`${patient.first_name||''} ${patient.last_name||''}`.trim():''}\nPatient ID: ${patient?.patient_id||''}\n\n${data.impression||''}`
  return <div className="grid gap-4 xl:grid-cols-[340px_1fr]"><Section title="Report layout and print options"><FieldGrid columns="lg:grid-cols-2" fields={options} data={data} setData={setData}/><p className="mt-3 text-xs text-slate-500">Layout choices are saved with the report when Save report is selected.</p></Section><div className="rounded border border-slate-300 bg-white p-8 shadow-lg"><div className="mb-6 flex justify-between border-b-2 border-primary-600 pb-4"><div><p className="text-sm font-semibold text-primary-700">{data.companyName||'echoAI'}</p><h2 className="text-2xl font-bold">{data.reportTitle||`${scanType} Report`}</h2></div><div className="flex gap-2 print:hidden"><button onClick={()=>window.print()} className="secondary-button"><Printer className="h-4 w-4"/>Print</button><button onClick={()=>window.print()} className="secondary-button"><FileDown className="h-4 w-4"/>PDF</button><button onClick={()=>window.location.href=`mailto:?subject=${encodeURIComponent(data.reportTitle||scanType)}&body=${encodeURIComponent(mailBody)}`} className="secondary-button"><Mail className="h-4 w-4"/>Mail</button></div></div><div className="grid gap-2 sm:grid-cols-2"><p><strong>Patient:</strong> {patient?`${patient.first_name||''} ${patient.last_name||''}`:'—'}</p><p><strong>Patient ID:</strong> {patient?.patient_id||'—'}</p><p><strong>Date of birth / Age:</strong> {patient?.dob||([patient?.age,patient?.age_unit].filter(Boolean).join(' '))||'—'}</p><p><strong>Gender:</strong> {patient?.gender||'—'}</p><p><strong>Contact:</strong> {patient?.mobile||patient?.phone1||'—'}</p></div><div className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">{entries.map(([key,value])=><div className="flex justify-between gap-3 border-b border-slate-100 py-1 text-sm" key={key}><span className="capitalize text-slate-500">{key.replace(/([A-Z])/g,' $1')}</span><span className="text-right font-medium">{String(value)}</span></div>)}</div>{selectedMedia.length>0&&<section className="mt-7"><h3 className="font-semibold">Selected study images</h3><div className="mt-3 grid gap-4 sm:grid-cols-2">{selectedMedia.map((item)=><figure key={item.id} className="break-inside-avoid"><img className="max-h-80 w-full object-contain" src={item.modality?`${apiBase}/media-records/${item.id}/frames/${data.reportMediaFrames?.[item.id]||0}`:item.url} alt={item.name}/><figcaption className="mt-1 text-xs text-slate-600">{item.name}{item.modality?` · frame ${(data.reportMediaFrames?.[item.id]||0)+1}`:""}</figcaption></figure>)}</div></section>}{data.impression&&<div className="mt-7"><h3 className="font-semibold">Final impression</h3><p className="mt-2 whitespace-pre-wrap text-sm">{data.impression}</p></div>}{data.disclaimer&&<p className="mt-8 border-t pt-3 text-xs text-slate-500">{data.disclaimer}</p>}</div></div>
}
