import { useEffect, useMemo, useState } from 'react'
import { Ruler, Search, Download, Filter } from 'lucide-react'
import { patientService } from '../api/patientService'
import { scanService } from '../api/scanService'

const isValue = (value) => value !== '' && value !== null && value !== undefined && value !== false

function flattenMeasurements(source, prefix = '') {
  if (!source || typeof source !== 'object') return []
  return Object.entries(source).flatMap(([key, value]) => {
    const label = [prefix, key].filter(Boolean).join(' ').replace(/_/g, ' ')
    if (value && typeof value === 'object' && !Array.isArray(value)) return flattenMeasurements(value, label)
    return isValue(value) ? [[label, Array.isArray(value) ? value.join(', ') : value]] : []
  })
}

function reportForScan(scan) {
  return scan.fetal_echo_report || scan.pediatric_echo_report || scan.adult_echo_report || {}
}

function categoryMeasurements(scan, category) {
  const report = reportForScan(scan)
  const biometry = report.biometry || {}
  const categorySource = {
    Biometry: biometry,
    '2D Measurements': biometry.b_mode || report.cardio_biometry || report.measurements?.two_d || report.measurements || {},
    'M-Mode & Functional': biometry.m_mode || report.m_mode || report.measurements?.m_mode || report.functional || {},
    'Doppler Analysis': report.doppler || report.doppler_analysis || {},
  }[category]

  if (category === 'Z-Scores') {
    const structured = flattenMeasurements(report).filter(([label]) => /z[ -]?score|ratio|index/i.test(label))
    if (structured.length) return structured
  }
  const structured = flattenMeasurements(categorySource)
  if (structured.length) return structured

  const patterns = {
    Biometry: /\b(mm|cm|dimension|diameter|annulus|area|length|width|size)\b/i,
    '2D Measurements': /\b(2d|dimension|diameter|annulus|area|length|width|cavity|wall)\b/i,
    'M-Mode & Functional': /\b(m-mode|lvef|ejection fraction|fractional shortening|contractility|function)\b/i,
    'Z-Scores': /\b(z[ -]?score|ratio|index)\b/i,
    'Doppler Analysis': /\b(doppler|velocity|gradient|flow|vmax|m\/s|mmhg|regurgitation)\b/i,
  }
  return String(`${scan.findings || ''}. ${scan.conclusion || ''}`)
    .split(/(?<=[.;])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence && patterns[category]?.test(sentence))
    .slice(0, 6)
    .map((sentence, index) => [`Recorded finding ${index + 1}`, sentence.replace(/[.;]+$/, '')])
}

function ratioSummary(entries) {
  const normalized = entries.map(([label, value]) => [label.toLowerCase(), Number.parseFloat(value)])
  const find = (pattern) => normalized.find(([label, value]) => pattern.test(label) && Number.isFinite(value))?.[1]
  const rv = find(/right ventricular width|rv width|rv.*diameter/)
  const lv = find(/left ventricular width|lv width|lv.*diameter/)
  if (!rv || !lv) return ''
  return `RV/LV Ratio: ${(rv / lv).toFixed(2)}`
}

export default function Measurements() {
  const [scans, setScans] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('2D Measurements')
  const [selectedScanType, setSelectedScanType] = useState('All')

  useEffect(() => {
    Promise.all([patientService.getPatients(), scanService.getScans()])
      .then(([p, s]) => {
        setPatients(p.data || [])
        setScans(s.data || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const patientMap = useMemo(() => {
    const map = new Map()
    patients.forEach((p) => map.set(p.id, p))
    return map
  }, [patients])

  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const p = patientMap.get(scan.patient_id) || {}
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
      const pid = String(p.patient_id || '').toLowerCase()
      const query = searchQuery.toLowerCase()
      const matchesSearch = !query || name.includes(query) || pid.includes(query)
      const matchesType = selectedScanType === 'All' || scan.scan_type === selectedScanType
      return matchesSearch && matchesType
    })
  }, [scans, patientMap, searchQuery, selectedScanType])

  const exportMModeToExcel = () => {
    const rows = filteredScans.flatMap((scan) => {
      const patient = patientMap.get(scan.patient_id) || {}
      const report = scan.fetal_echo_report || scan.pediatric_echo_report || scan.adult_echo_report || {}
      const mMode = report.biometry?.m_mode || report.m_mode || report.measurements?.m_mode || {}
      const values = Object.entries(mMode).filter(([, value]) => value !== '' && value != null)
      return values.length
        ? values.map(([measurement, value]) => [patient.patient_id || scan.patient_display_id || '', `${patient.first_name || ''} ${patient.last_name || ''}`.trim(), scan.scan_type || '', measurement.replace(/_/g, ' '), value])
        : [[patient.patient_id || scan.patient_display_id || '', `${patient.first_name || ''} ${patient.last_name || ''}`.trim(), scan.scan_type || '', 'No recorded M-Mode values', '']]
    })
    const html = `<table><tr><th>Patient ID</th><th>Patient</th><th>Scan type</th><th>Measurement</th><th>Value</th></tr>${rows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell).replace(/[&<>]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character]))}</td>`).join('')}</tr>`).join('')}</table>`
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `m-mode-measurements-${new Date().toISOString().slice(0, 10)}.xls`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header card */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider">
            <Ruler className="w-4 h-4" /> Echocardiography Measurements
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Patient Measurements Explorer</h1>
          <p className="mt-1 text-sm text-slate-500">
            View, search, and export 2D, M-Mode, Z-Scores, and Doppler measurements recorded across studies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {activeCategory === 'M-Mode & Functional' && <button type="button" onClick={exportMModeToExcel} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Download className="h-4 w-4" />Export M-Mode to Excel</button>}
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
            value={selectedScanType}
            onChange={(e) => setSelectedScanType(e.target.value)}
          >
            <option value="All">All Study Types</option>
            <option value="Adult Echo">Adult Echo</option>
            <option value="Pediatric Echo">Pediatric Echo</option>
            <option value="Fetal Echo">Fetal Echo</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {['Biometry', '2D Measurements', 'M-Mode & Functional', 'Z-Scores', 'Doppler Analysis'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeCategory === cat
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          placeholder="Search by Patient ID or Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>

      {/* Measurements Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Scan Type</th>
                <th className="px-4 py-3">Key Measurements</th>
                <th className="px-4 py-3">Z-Score / Ratios</th>
                <th className="px-4 py-3">Date Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredScans.map((scan) => {
                const p = patientMap.get(scan.patient_id) || {}
                const name = `${p.salutation || ''} ${p.first_name || ''} ${p.last_name || ''}`.trim() || p.patient_id || 'Unknown'
                const details = categoryMeasurements(scan, activeCategory)
                const ratio = ratioSummary(flattenMeasurements(reportForScan(scan)))
                const dateStr = scan.scan_date ? new Date(scan.scan_date).toLocaleDateString() : '—'

                return (
                  <tr key={scan.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div>{name}</div>
                      <div className="text-xs text-slate-500">{p.patient_id || scan.patient_display_id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                        {scan.scan_type || 'Echo Study'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      {details.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {details.slice(0, 6).map(([k, v]) => (
                            <span key={k} className="rounded bg-slate-100 px-2 py-0.5 font-medium">
                              {k}: <strong className="text-slate-900">{String(v)}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">No {activeCategory.toLowerCase()} values recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      {ratio ? <span className="inline-flex items-center rounded bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 border border-teal-200">{ratio}</span> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{dateStr}</td>
                  </tr>
                )
              })}
              {!loading && filteredScans.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-slate-500">
                    No measurement records match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
