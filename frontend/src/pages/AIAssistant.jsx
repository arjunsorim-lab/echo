import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

export default function AIAssistant() {
  const [patients, setPatients] = useState([])
  const [scans, setScans] = useState([])
  const [question, setQuestion] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([patientService.getPatients(), scanService.getScans()]).then(([patientResult, scanResult]) => {
      setPatients(patientResult.data || [])
      setScans(scanResult.data || [])
    }).catch(() => setError('Clinical records could not be loaded.'))
  }, [])

  const answer = useMemo(() => {
    if (!submitted) return ''
    const terms = submitted.toLowerCase().split(/\s+/).filter((term) => term.length > 2)
    const matches = scans.filter((scan) => {
      const patient = patients.find((item) => String(item.id) === String(scan.patient_id)) || {}
      const text = JSON.stringify({ ...scan, patient }).toLowerCase()
      return terms.length > 0 && terms.every((term) => text.includes(term))
    })
    const counts = matches.reduce((result, scan) => ({ ...result, [scan.scan_type || 'Other']: (result[scan.scan_type || 'Other'] || 0) + 1 }), {})
    if (!matches.length) return 'No stored studies match those terms. Try a patient ID, patient name, scan type, diagnosis, or status.'
    return `${matches.length} matching studies found. ${Object.entries(counts).map(([type, count]) => `${type}: ${count}`).join(' · ')}`
  }, [submitted, scans, patients])

  return (
    <div className="space-y-5 p-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-teal-700"><Sparkles className="h-5 w-5"/><span className="text-xs font-semibold uppercase tracking-wider">Clinical search assistant</span></div>
        <h1 className="mt-1 text-2xl font-bold">AI Assistant</h1>
        <p className="mt-2 text-sm text-slate-600">Searches stored patient and report data. It does not generate diagnoses.</p>
        <form onSubmit={(event) => { event.preventDefault(); setSubmitted(question.trim()) }} className="mt-5 flex gap-2"><input className="field-control flex-1" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Example: completed fetal studies or patient ID TM000060"/><button className="primary-button" type="submit"><Search className="h-4 w-4"/>Search records</button></form>
        {submitted && <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">{answer}</div>}
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-3"><Link className="secondary-button" to="/reports">Open reports</Link><Link className="secondary-button" to="/analytics">Advanced queries</Link><Link className="secondary-button" to="/measurements">Measurements</Link></div>
    </div>
  )
}
