import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function MediaPrintPreview({ images, title = 'Selected images', columns = 1, onClose }) {
  const [loaded, setLoaded] = useState(new Set())
  const [failed, setFailed] = useState(false)
  const content = <div className="clinical-preview fixed inset-0 z-[100] overflow-auto bg-slate-800 p-4" role="dialog" aria-modal="true" aria-label="Image print preview">
    <div className="no-print mx-auto mb-3 flex max-w-4xl gap-3">
      <button type="button" className="primary-button" disabled={failed || loaded.size !== new Set(images.filter(Boolean)).size || !images.some(Boolean)} onClick={() => window.print()}>Print / Save PDF</button>
      <button type="button" className="secondary-button" onClick={onClose}>Close print preview</button>
      {failed && <p role="alert" className="bg-white p-2 text-red-700">An image failed to load. Close and refresh before printing.</p>}
    </div>
    <article className="clinical-print mx-auto max-w-4xl bg-white p-8">
      <h1 className="mb-4 text-xl font-bold">{title}</h1>
      <div className="grid gap-4" style={{gridTemplateColumns:`repeat(${Math.max(1,Math.min(4,Number(columns) || 1))}, minmax(0, 1fr))`}}>
        {images.map((url,index) => <figure key={index} style={{breakInside:'avoid'}}>{url ? <img src={url} alt="Selected original image" style={{width:'100%',maxHeight:'220mm',objectFit:'contain'}} onLoad={() => setLoaded(current => new Set([...current,url]))} onError={() => setFailed(true)} /> : <p className="border p-4 text-slate-500">Unassigned frame</p>}</figure>)}
      </div>
    </article>
  </div>
  return createPortal(content, document.body)
}
