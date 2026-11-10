import { useEffect, useRef, useState } from 'react'
import { workspaceService } from '../api/workspaceService'
import MediaPrintPreview from './MediaPrintPreview'
import { X, Save, Trash2, RotateCcw, Printer } from 'lucide-react'

const ruleConfigs = {
  'Rule of two': {
    gridCols: 'grid-cols-2',
    count: 4,
    labels: ['A4 CH', 'LVOT VIEW', 'RVOT VIEW', '3VV VIEW'],
  },
  'Rule of three': {
    gridCols: 'grid-cols-3',
    count: 9,
    labels: [
      'ABD SITUS',
      'THORAX SITUS',
      'A4 CH',
      'A4 CH COL',
      'LVOT VIEW',
      'LVOT COL',
      'RVOT VIEW',
      'RVOT COL',
      '3VV VIEW',
    ],
  },
  'Rule of four': {
    gridCols: 'grid-cols-4',
    count: 16,
    labels: [
      'ABD SITUS',
      'THORAX SITUS',
      'A4 CH',
      'A4 CH COL',
      'LVOT VIEW',
      'LVOT COL',
      'RVOT VIEW',
      'RVOT COL',
      '3VV VIEW',
      '3VT VIEW',
      'IVC VIEW',
      'SVC VIEW',
      'DUCTAL ARCH',
      'AORTIC ARCH',
      'SAGITTAL',
      'TRANSVERSE',
    ],
  },
}

const kindFor = (mode) => ({ 'Rule of two': 'rule-2', 'Rule of three': 'rule-3', 'Rule of four': 'rule-4' }[mode])

export default function TiffaTemplateModal({
  open,
  onClose,
  patient,
  visitDate = '',
  visitId = '',
  mediaRecords = [],
  images = [],
  initialRuleMode = 'Rule of three',
}) {
  const [ruleMode, setRuleMode] = useState(initialRuleMode)
  const [templateName, setTemplateName] = useState('FETAL ECHO')
  const [activeSlot, setActiveSlot] = useState(0)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(false)
  const [dirty, setDirty] = useState(false)

  const currentConfig = ruleConfigs[ruleMode] || ruleConfigs['Rule of three']
  const [placements, setPlacements] = useState(() => Array(currentConfig.count).fill(null))
  const savedPlacementsRef = useRef([])

  useEffect(() => {
    if (initialRuleMode) setRuleMode(initialRuleMode)
  }, [initialRuleMode])

  useEffect(() => {
    let active = true
    const cfg = ruleConfigs[ruleMode] || ruleConfigs['Rule of three']
    const empty = Array(cfg.count).fill(null)
    setPlacements(empty)
    savedPlacementsRef.current = empty
    setActiveSlot(0)
    setPreview(false); setReady(false); setDirty(false)
    if (open && patient?.id && visitId) {
      setBusy(true)
      workspaceService.getMediaLayout(patient.id, visitId, kindFor(ruleMode)).then(result => {
        if (!active) return
        if (result.data) {
          const loaded = Array.from({ length: cfg.count }, (_, index) =>
            mediaRecords.find(item => item.id === result.data.placements[index] && item.status !== 'Archived')?.url || null
          )
          setPlacements(loaded)
          savedPlacementsRef.current = loaded
          setTemplateName(result.data.title || 'FETAL ECHO')
        }
        setReady(true)
        setMessage(result.data ? 'Saved layout loaded.' : 'Choose images and save this visit layout.')
      }).catch(() => { if (active) setMessage('Unable to load layout. Close and retry before saving.') })
        .finally(() => { if (active) setBusy(false) })
    }
    return () => { active = false }
  }, [ruleMode, open, patient?.id, visitId, mediaRecords])

  const saveLayout = async () => {
    if (!ready || busy) return
    setBusy(true)
    try {
      const ids = placements.map(url => url ? mediaRecords.find(item => item.url === url)?.id : null)
      if (ids.some(id => id === undefined)) throw new Error('Save the source images to this visit before saving the layout.')
      await workspaceService.saveMediaLayout(patient.id, visitId, kindFor(ruleMode), {
        title: templateName,
        columns: Math.sqrt(currentConfig.count),
        placements: ids,
      })
      savedPlacementsRef.current = [...placements]
      setDirty(false)
      setMessage('Layout saved to this patient visit.')
    } catch (error) { setMessage(error.response?.data?.detail || error.message || 'Layout save failed.') }
    finally { setBusy(false) }
  }

  if (!open) return null

  const patientName = patient
    ? [patient.salutation, patient.first_name, patient.last_name].filter(Boolean).join(' ') || patient.patient_id || 'Select patient'
    : 'Select patient'

  const placeImage = (img) => {
    const next = [...placements]
    next[activeSlot] = img
    setPlacements(next)
    setDirty(true)
    setActiveSlot(Math.min(activeSlot + 1, placements.length - 1))
  }

  const confirmSwitchRule = (nextMode) => {
    if (dirty && !window.confirm('Switching layout will discard your unsaved image placements for this rule. Continue?')) return
    setRuleMode(nextMode)
  }

  const handleClose = () => {
    if (dirty && !window.confirm('You have unsaved image placements. Close and discard them?')) return
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-2xs" role="dialog" aria-modal="true" aria-label="Image layout">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-300 bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-900">
            Image layout — Patient: <span className="font-bold">{patientName}</span> · Visit# {visitId || '—'} {visitDate}
          </h2>
          <button type="button" onClick={handleClose} className="rounded p-1 text-slate-500 hover:bg-slate-300 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Top Action Toolbar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <button type="button" disabled={busy || !ready} onClick={saveLayout} className="legacy-small-button">
              <Save className="mr-1 h-3.5 w-3.5 text-teal-700" /> Save
            </button>
            <button type="button" onClick={() => { setPlacements(Array(currentConfig.count).fill(null)); setDirty(true) }} className="legacy-small-button">
              <Trash2 className="mr-1 h-3.5 w-3.5 text-red-600" /> Clear layout
            </button>
            <button type="button" disabled={!placements.some(Boolean)} onClick={() => setPreview(true)} className="legacy-small-button">
              <Printer className="mr-1 h-3.5 w-3.5 text-teal-700" /> Preview
            </button>
            <button type="button" onClick={handleClose} className="legacy-small-button">
              <X className="mr-1 h-3.5 w-3.5 text-slate-600" /> Close
            </button>
            {dirty && <span className="text-amber-600 font-semibold">Unsaved changes</span>}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span>Click once to place an image in the active frame.</span>
          </div>
        </div>

        <p role="status" className="px-4 py-2 text-sm">{busy ? 'Loading/saving layout…' : message}</p>

        {/* Template Controls Bar */}
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs">
          {/* Rule Selector */}
          <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1 shadow-2xs">
            {['Rule of two', 'Rule of three', 'Rule of four'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => confirmSwitchRule(mode)}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition ${ruleMode === mode ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 font-semibold text-slate-700">
            <span>Template name</span>
            <select
              value={templateName}
              onChange={(e) => { setTemplateName(e.target.value); setDirty(true) }}
              className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
            >
              <option value="FETAL ECHO">FETAL ECHO</option>
              <option value="Standard TIFFA 9-View">Standard TIFFA 9-View</option>
              <option value="Fetal Heart 4-View">Fetal Heart 4-View</option>
              <option value="Outflow Tracts 3-View">Outflow Tracts 3-View</option>
            </select>
          </label>

          <button type="button" onClick={() => { setPlacements(Array(currentConfig.count).fill(null)); setDirty(true) }} className="legacy-small-button">
            Clear images
          </button>
        </div>

        {/* Main Body */}
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px] gap-3 bg-slate-50 p-3">
          {/* Left Panel: Template Frame Grid */}
          <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-2xs overflow-auto">
            <div className={`grid flex-1 ${currentConfig.gridCols} gap-2 min-h-0`}>
              {placements.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveSlot(idx)}
                  className={`flex aspect-4/3 flex-col items-center justify-between rounded-lg border-2 p-1.5 transition cursor-pointer overflow-hidden ${activeSlot === idx
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                >
                  <div className="flex flex-1 w-full items-center justify-center overflow-hidden rounded bg-slate-50">
                    {img ? (
                      <img src={img} alt={`Frame ${idx + 1}`} className="h-full w-full object-cover rounded" />
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Unassigned</span>
                    )}
                  </div>
                  <span className="mt-1 text-[11px] font-bold text-slate-800 uppercase tracking-tight">
                    {currentConfig.labels[idx] || `View ${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center text-xs font-bold text-slate-700">
              Template: {templateName} ({ruleMode})
            </div>
          </div>

          {/* Right Panel: Image List */}
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">Image list</div>
            <div className="min-h-0 flex-1 overflow-y-auto space-y-2">
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={(event) => { if (event.detail <= 1) placeImage(img) }}
                    className="cursor-pointer rounded border border-slate-200 bg-slate-50 p-1 hover:border-teal-500"
                  >
                    <img src={img} alt={`List item ${idx}`} className="h-24 w-full object-cover rounded" />
                    <span className="block truncate text-[10px] text-slate-500 mt-1">Image {idx + 1}</span>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs text-slate-400 p-4">
                  Click images to assign them to the active frame.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {preview && (
        <MediaPrintPreview
          images={placements}
          columns={Math.sqrt(currentConfig.count)}
          title={templateName}
          patientId={patient?.patient_id}
          patientName={patientName}
          visitId={visitId}
          visitDate={visitDate}
          onClose={() => setPreview(false)}
        />
      )}
    </div>
  )
}
