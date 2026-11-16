import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { customOptionService } from '../api/customOptionService'

const FIELD = 'patient_salutation'

export default function PatientSalutationSelect({
  options = [],
  value = '',
  onChange,
  className = 'field-control',
  disabled = false,
  skipAddOnTab = false,
}) {
  const [customOptions, setCustomOptions] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    customOptionService.getOptions(FIELD)
      .then((result) => {
        if (active) setCustomOptions(result.data || [])
      })
      .catch(() => {
        if (active) setError('Unable to load saved salutations')
      })
    return () => { active = false }
  }, [])

  const selectableOptions = useMemo(() => {
    const defaults = [...new Set(options.filter((option) => option && option !== 'Other'))]
    const customValues = [...new Set(customOptions
      .map((option) => option.value)
      .filter((option) => option && !defaults.includes(option)))]

    return [
      ...defaults.map((option) => ({ value: option, id: null, removable: false })),
      ...customValues.map((option) => {
        const record = customOptions.find((item) => item.value === option)
        return { value: option, id: record?.id, removable: true }
      }),
    ]
  }, [customOptions, options])

  const selectedCustomOption = selectableOptions.find(
    (option) => option.value === value && option.removable,
  )

  const saveOption = async () => {
    const nextValue = newValue.trim()
    if (!nextValue || saving) return
    setSaving(true)
    setError('')
    try {
      const result = await customOptionService.createOption(FIELD, nextValue)
      const savedOption = result.data
      setCustomOptions((current) => current.some((item) => String(item.id) === String(savedOption.id))
        ? current
        : [...current, savedOption])
      onChange(savedOption.value || nextValue)
      setNewValue('')
      setIsAdding(false)
    } catch {
      setError('Unable to save this salutation')
    } finally {
      setSaving(false)
    }
  }

  const deleteSelectedOption = async () => {
    if (!selectedCustomOption || deleting || disabled) return
    const confirmed = window.confirm(`Permanently delete the custom salutation “${selectedCustomOption.value}”?`)
    if (!confirmed) return

    setDeleting(true)
    setError('')
    try {
      await customOptionService.deleteOption(selectedCustomOption.id, FIELD)
      setCustomOptions((current) => current.filter((item) => String(item.id) !== String(selectedCustomOption.id)))
      onChange('')
    } catch {
      setError('Unable to delete this salutation')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 gap-1">
        <select
          className={className}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-label="Salutation"
        >
          <option value="">Select</option>
          {selectableOptions.map((option) => (
            <option key={option.id ?? `default-${option.value}`} value={option.value}>
              {option.value}
            </option>
          ))}
        </select>
        <button
          type="button"
          title={selectedCustomOption ? `Delete ${selectedCustomOption.value}` : 'Select a custom salutation to delete'}
          aria-label={selectedCustomOption ? `Delete custom salutation ${selectedCustomOption.value}` : 'Delete selected custom salutation'}
          disabled={disabled || deleting || !selectedCustomOption}
          onClick={deleteSelectedOption}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          tabIndex={skipAddOnTab ? -1 : undefined}
          disabled={disabled}
          title="Add salutation"
          aria-label="Add salutation"
          aria-expanded={isAdding}
          onClick={() => { setIsAdding((current) => !current); setError('') }}
          className="legacy-plus-button shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      <div
        aria-hidden={!isAdding}
        className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-200 ease-out ${
          isAdding ? 'mt-2 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex gap-1 rounded-lg border border-teal-200 bg-teal-50 p-2">
            <input
              className="min-w-0 flex-1 rounded-md border border-teal-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); saveOption() } }}
              placeholder="Enter a new salutation"
              autoFocus={isAdding}
              disabled={!isAdding || disabled || saving}
              tabIndex={isAdding ? 0 : -1}
            />
            <button
              type="button"
              disabled={!isAdding || disabled || saving || !newValue.trim()}
              onClick={saveOption}
              aria-label="Save salutation"
              className="rounded-md bg-teal-600 px-3 text-white disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {error && <p role="status" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
