import { useEffect, useState } from 'react'
import { workspaceService } from '../api/workspaceService'
import MediaPrintPreview from './MediaPrintPreview'

export default function ImageCompareModal({ open, onClose, images = [], mediaRecords = [], patient, visitId }) {
  const [selected, setSelected] = useState([])
  const [title, setTitle] = useState('')
  const [columns, setColumns] = useState(2)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    setSelected([]);setTitle('');setColumns(2);setPreview(false);setReady(false)
    if(open && patient?.id && visitId) {
      setBusy(true)
      workspaceService.getMediaLayout(patient.id, visitId, 'compare').then(result => {
        if(!active) return
        const layout=result.data
        setReady(true)
        if(layout) {setSelected(layout.placements.map(id => mediaRecords.find(item => item.id === id && item.status !== 'Archived')?.url).filter(Boolean));setTitle(layout.title);setColumns(layout.columns)}
        setMessage(layout ? 'Saved comparison loaded.' : 'Select images, then save the comparison.')
      }).catch(() => {if(active)setMessage('Unable to load comparison. Close and retry before saving.')}).finally(() => {if(active)setBusy(false)})
    }
    return () => {active=false}
  }, [open, patient?.id, visitId, mediaRecords])
  if(!open) return null
  const toggle = url => setSelected(current => current.includes(url) ? current.filter(item => item !== url) : [...current,url].slice(-16))
  const save = async () => {
    if(!ready || busy) return
    setBusy(true)
    try {
      const placements=selected.map(url => mediaRecords.find(item => item.url === url)?.id)
      if(placements.some(id => !id)) throw new Error('Import images to the patient visit before saving.')
      await workspaceService.saveMediaLayout(patient.id, visitId, 'compare', {placements, title, columns})
      setMessage('Comparison saved to this patient visit.')
    } catch(error) {setMessage(error.response?.data?.detail || error.message || 'Save failed.')}
    finally {setBusy(false)}
  }
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-4" role="dialog" aria-modal="true" aria-label="Image comparison">
    <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-xl bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3"><h2 className="mr-auto text-lg font-bold">Image comparison — Visit {visitId || '—'}</h2><button className="secondary-button" onClick={onClose}>Close comparison</button></div>
      <div className="mb-3 flex flex-wrap gap-3"><label>Comparison title<input className="field-control" maxLength={160} value={title} onChange={event=>setTitle(event.target.value)} /></label><label>Columns<select className="field-control" value={columns} onChange={event=>setColumns(Number(event.target.value))}>{[1,2,3,4].map(value=><option key={value}>{value}</option>)}</select></label><button disabled={busy || !ready || !patient?.id || !visitId} className="primary-button" onClick={save}>Save comparison</button><button disabled={busy} className="secondary-button" onClick={()=>setSelected([])}>Clear selection</button><button disabled={!selected.length} className="secondary-button" onClick={()=>setPreview(true)}>Print preview</button></div>
      <p role="status" className="mb-3 text-sm">{busy ? 'Loading/saving comparison…' : message}</p>
      <div className="grid min-h-0 flex-1 gap-4 overflow-auto md:grid-cols-[220px_1fr]">
        <div><p className="mb-2 text-sm">Click images to add or remove them.</p>{images.map(url=><button key={url} aria-label="Select comparison image" aria-pressed={selected.includes(url)} className={`mb-2 block w-full border-2 p-1 ${selected.includes(url)?'border-teal-600':'border-slate-200'}`} onClick={()=>toggle(url)}><img src={url} alt="Available image" className="h-28 w-full object-contain" /></button>)}</div>
        <div className="grid content-start gap-3" style={{gridTemplateColumns:`repeat(${columns}, minmax(0,1fr))`}}>{selected.map(url=><div key={url} className="rounded border p-2"><img src={url} alt="Comparison image" className="max-h-80 w-full object-contain" /><button className="secondary-button mt-2" onClick={()=>toggle(url)}>Remove from comparison</button></div>)}</div>
      </div>
    </div>
    {preview && <MediaPrintPreview images={selected} columns={columns} title={title || 'Image comparison'} onClose={()=>setPreview(false)} />}
  </div>
}
