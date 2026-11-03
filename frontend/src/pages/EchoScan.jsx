import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { scanService } from '../api/scanService'
import ClinicalWorkspace from './ClinicalWorkspace'
import AdultEchoReport from './AdultEchoReport'
import PediatricEchoReport from './PediatricEchoReport'
import FetalEchoReport from './FetalEchoReport'

export default function EchoScan() {
  const { scanId } = useParams()
  const [params] = useSearchParams()
  const [scanType, setScanType] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!scanId) return
    scanService.getScan(scanId)
      .then((result) => setScanType(result.data?.scan_type || ''))
      .catch(() => setError('This echo study could not be loaded.'))
  }, [scanId])

  if (!scanId) {
    const type = params.get('type') || 'Adult Echo'
    if (type === 'Fetal Echo') return <FetalEchoReport />
    if (type === 'Pediatric Echo') return <PediatricEchoReport />
    return <AdultEchoReport />
  }
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
  if (!scanType) return <div className="p-6 text-sm text-slate-500">Loading echo study…</div>
  if (scanType === 'Fetal Echo') return <FetalEchoReport />
  if (scanType === 'Pediatric Echo') return <PediatricEchoReport />
  return <AdultEchoReport />
}
