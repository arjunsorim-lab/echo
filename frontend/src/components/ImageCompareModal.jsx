import { useEffect, useRef, useState } from 'react'
import { workspaceService } from '../api/workspaceService'
import MediaPrintPreview from './MediaPrintPreview'

export default function ImageCompareModal({ open, onClose, images = [], mediaRecords = [], patient, visitId, visitDate = '' }) {
  const [selected, setSelected] = useState([])
  const [title, setTitle] = useState('')
  const [columns, setColumns] = useState(2)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const [ready, setReady] = useState(false)
  // Track whether the in-memory selection differs from what was last saved/loaded
  const savedRef = useRef({ selected: [], title: '', columns: 2 })
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let active = true
    setSelected([]); setTitle(''); setColumns(2); setPreview(false); setReady(false); setDirty(false)
    savedRef.current = { selected: [], title: '', columns: 2 }
    if (open && patient?.id && visitId) {
      setBusy(true)
      workspaceService.getMediaLayout(patient.id, visitId, 'compare').then(result => {
        if (!active) return
        const layout = result.data
        setReady(true)
        if (layout) {
          const loaded = layout.placements
            .map(id => mediaRecords.find(item => item.id === id && item.status !== 'Archived')?.url)
            .filter(Boolean)
          setSelected(loaded)
          setTitle(layout.title)
          setColumns(layout.columns)
          savedRef.current = { selected: loaded, title: layout.title, columns: layout.columns }
        }
        setMessage(layout ? 'Saved comparison loaded.' : 'Select images, then save the comparison.')
      }).catch(() => { if (active) setMessage('Unable to load comparison. Close and retry before saving.') })
        .finally(() => { if (active) setBusy(false) })
    }
    return () => { active = false }
  }, [open, patient?.id, visitId, mediaRecords])

  if (!open) return null

  const patientName = patient
    ? [patient.salutation, patient.first_name, patient.last_name].filter(Boolean).join(' ') || patient.patient_id || ''
    : ''

  const toggle = url => {
    setSelected(current => {
      const next = current.includes(url) ? current.filter(item => item !== url) : [...current, url].slice(-16)
      setDirty(true)
      return next
    })
  }

  const handleTitleChange = e => { setTitle(e.target.value); setDirty(true) }
  const handleColumnsChange = e => { setColumns(Number(e.target.value)); setDirty(true) }

  const save = async () => {
    if (!ready || busy) return
    setBusy(true)
    try {
      const placements = selected.map(url => mediaRecords.find(item => item.url === url)?.id)
      if (placements.some(id => !id)) throw new Error('Import images to the patient visit before saving.')
      await workspaceService.saveMediaLayout(patient.id, visitId, 'compare', { placements, title, columns })
      savedRef.current = { selected: [...selected], title, columns }
      setDirty(false)
      setMessage('Comparison saved to this patient visit.')
    } catch (error) { setMessage(error.response?.data?.detail || error.message || 'Save failed.') }
    finally { setBusy(false) }
  }

  const handleClose = () => {
    if (dirty && !window.confirm('You have unsaved changes to this comparison. Close and discard them?')) return
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-4" role="dialog" aria-modal="true" aria-label="Image comparison">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-xl bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-lg font-bold">
            Image comparison — {patientName && <span className="font-normal text-slate-600">{patientName} · </span>}Visit {visitId || '—'} {visitDate && <span className="font-normal text-slate-500 text-sm">({visitDate})</span>}
          </h2>
          <button className="secondary-button" onClick={handleClose}>Close comparison</button>
        </div>
        <div className="mb-3 flex flex-wrap gap-3">
          <label>
            Comparison title
            <input className="field-control" maxLength={160} value={title} onChange={handleTitleChange} />
          </label>
          <label>
            Columns
            <select className="field-control" value={columns} onChange={handleColumnsChange}>
              {[1, 2, 3, 4].map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
          <button disabled={busy || !ready || !patient?.id || !visitId} className="primary-button" onClick={save}>
            Save comparison
          </button>
          <button disabled={busy} className="secondary-button" onClick={() => { setSelected([]); setDirty(true) }}>
            Clear selection
          </button>
          <button disabled={!selected.length} className="secondary-button" onClick={() => setPreview(true)}>
            Print preview
          </button>
          {dirty && <span className="self-center text-xs text-amber-600 font-medium">Unsaved changes</span>}
        </div>
        <p role="status" className="mb-3 text-sm">{busy ? 'Loading/saving comparison…' : message}</p>
        <div className="grid min-h-0 flex-1 gap-4 overflow-auto md:grid-cols-[220px_1fr]">
          <div>
            <p className="mb-2 text-sm">Click images to add or remove them.</p>
            {images.map(url => (
              <button key={url} aria-label="Select comparison image" aria-pressed={selected.includes(url)}
                className={`mb-2 block w-full border-2 p-1 ${selected.includes(url) ? 'border-teal-600' : 'border-slate-200'}`}
                onClick={() => toggle(url)}>
                <img src={url} alt="Available image" className="h-28 w-full object-contain" />
              </button>
            ))}
          </div>
          <div className="grid content-start gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
            {selected.map(url => (
              <div key={url} className="rounded border p-2">
                <img src={url} alt="Comparison image" className="max-h-80 w-full object-contain" />
                <button className="secondary-button mt-2" onClick={() => toggle(url)}>Remove from comparison</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {preview && (
        <MediaPrintPreview
          images={selected}
          columns={columns}
          title={title || 'Image comparison'}
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
