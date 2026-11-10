import { useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * MediaPrintPreview — renders a clinical-quality image print preview.
 *
 * Props:
 *   images       – array of URL strings (null/undefined slots render as "Unassigned frame")
 *   title        – freeform layout title (e.g. template name)
 *   columns      – grid column count (1–4)
 *   onClose      – callback to dismiss the preview
 *   patientId    – e.g. "TM0012026"
 *   patientName  – formatted display name
 *   visitId      – visit identifier
 *   visitDate    – formatted visit date string
 */
export default function MediaPrintPreview({
  images,
  title = 'Selected images',
  columns = 1,
  onClose,
  patientId,
  patientName,
  visitId,
  visitDate,
}) {
  const [loaded, setLoaded] = useState(new Set())
  const [failed, setFailed] = useState(false)
  const safeColumns = Math.max(1, Math.min(4, Number(columns) || 1))
  const nonBlank = images.filter(Boolean)
  const allLoaded = !failed && loaded.size === new Set(nonBlank).size && nonBlank.length > 0

  const content = (
    <div
      className="clinical-preview fixed inset-0 z-[100] overflow-auto bg-slate-800 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image print preview"
    >
      <div className="no-print mx-auto mb-3 flex max-w-4xl flex-wrap gap-3 items-center">
        <button
          type="button"
          className="primary-button"
          disabled={!allLoaded}
          onClick={() => window.print()}
        >
          Print / Save PDF
        </button>
        <button type="button" className="secondary-button" onClick={onClose}>
          Close print preview
        </button>
        {failed && (
          <p role="alert" className="bg-white p-2 text-red-700">
            An image failed to load. Close and refresh before printing.
          </p>
        )}
        {!failed && nonBlank.length > 0 && !allLoaded && (
          <p className="text-slate-300 text-sm">Loading images…</p>
        )}
      </div>

      <article className="clinical-print mx-auto max-w-4xl bg-white p-8">
        {/* Consistent patient/visit header — always present when identifiers are available */}
        {(patientId || patientName || visitId) && (
          <header className="mb-4 border-b border-slate-300 pb-3 text-sm text-slate-700">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {patientId && <span><strong>Patient ID:</strong> {patientId}</span>}
              {patientName && <span><strong>Patient:</strong> {patientName}</span>}
              {visitId && <span><strong>Visit:</strong> {visitId}</span>}
              {visitDate && <span><strong>Date:</strong> {visitDate}</span>}
            </div>
          </header>
        )}

        <h1 className="mb-4 text-xl font-bold">{title}</h1>

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}
        >
          {images.map((url, index) => (
            <figure key={index} style={{ breakInside: 'avoid' }}>
              {url ? (
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  style={{ width: '100%', maxHeight: '220mm', objectFit: 'contain' }}
                  onLoad={() => setLoaded((current) => new Set([...current, url]))}
                  onError={() => setFailed(true)}
                />
              ) : (
                <p className="border p-4 text-slate-500">Unassigned frame</p>
              )}
            </figure>
          ))}
        </div>
      </article>
    </div>
  )

  return createPortal(content, document.body)
}
