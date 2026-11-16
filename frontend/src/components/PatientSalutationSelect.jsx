import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Trash2, X } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hiddenDefaults, setHiddenDefaults] = useState([])
  const [error, setError] = useState('')

  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const optionRefs = useRef([])

  // Load custom salutations
  useEffect(() => {
    let active = true

    customOptionService.getOptions(FIELD)
      .then((result) => {
        if (active) {
          setCustomOptions(result.data || [])
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to load saved salutations')
        }
      })

    return () => {
      active = false
    }
  }, [])

  // Combine default and custom options
  const selectableOptions = useMemo(() => {
    const defaults = [
      ...new Set(
        options.filter(option => option && option !== 'Other')
      ),
    ]

    const customValues = [
      ...new Set(
        customOptions
          .map(option => option.value)
          .filter(option => option && !defaults.includes(option))
      ),
    ]

    return [
      ...defaults.map(option => ({
        value: option,
        id: null,
        removable: false,
      })),

      ...customValues.map(option => {
        const record = customOptions.find(
          item => item.value === option
        )

        return {
          value: option,
          id: record?.id,
          removable: true,
        }
      }),
    ]
  }, [customOptions, options])

  // Only show options that have not been hidden
  const visibleOptions = selectableOptions.filter(
    option => !hiddenDefaults.includes(option.value)
  )

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setIsAdding(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (disabled) {
      setIsOpen(false)
      setIsAdding(false)
    }
  }, [disabled])

  // Select salutation
  function selectOption(option) {
    onChange(option.value)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  // Handle keyboard navigation
  function handleTriggerKeyDown(event) {
    if (disabled) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      requestAnimationFrame(() => {
        optionRefs.current[0]?.focus()
      })
    }
  }

  function handleOptionKeyDown(event, index) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      optionRefs.current[
        (index + 1) % visibleOptions.length
      ]?.focus()
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      optionRefs.current[
        (index - 1 + visibleOptions.length) %
          visibleOptions.length
      ]?.focus()
    }
  }

  // Save a new salutation
  const saveOption = async () => {
    const nextValue = newValue.trim()

    if (!nextValue || saving || disabled) return

    setSaving(true)
    setError('')

    // Restore existing options instead of adding duplicates
    const existingOption = selectableOptions.find(
      option => option.value.toLowerCase() === nextValue.toLowerCase()
    )

    if (existingOption) {
      setHiddenDefaults(current =>
        current.filter(item => item !== existingOption.value)
      )
      onChange(existingOption.value)
      setNewValue('')
      setIsAdding(false)
      setSaving(false)
      return
    }

    try {
      const result = await customOptionService.createOption(
        FIELD,
        nextValue
      )

      const savedOption = result.data

      setCustomOptions(current =>
        current.some(
          item => String(item.id) === String(savedOption.id)
        )
          ? current
          : [...current, savedOption]
      )

      onChange(savedOption.value || nextValue)
      setNewValue('')
      setIsAdding(false)
    } catch {
      setError('Unable to save this salutation')
    } finally {
      setSaving(false)
    }
  }

  // Delete an individual salutation
  const deleteOption = async (option) => {
    if (disabled || deleting || saving) return

    const message = option.removable
      ? `Permanently delete the custom salutation "${option.value}"?`
      : `Remove "${option.value}" from this dropdown for now?`

    if (!window.confirm(message)) return

    setError('')

    // Default options are only hidden locally
    if (!option.removable) {
      setHiddenDefaults(current => [
        ...new Set([...current, option.value]),
      ])

      if (value === option.value) {
        onChange('')
      }

      return
    }

    // Custom options are deleted from database
    setDeleting(true)

    try {
      await customOptionService.deleteOption(option.id, FIELD)

      setCustomOptions(current =>
        current.filter(
          item => String(item.id) !== String(option.id)
        )
      )

      if (value === option.value) {
        onChange('')
      }
    } catch {
      setError('Unable to delete this salutation')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-w-0" ref={dropdownRef}>
      <div className="flex min-w-0 gap-1">

        {/* Custom dropdown */}
        <div className="relative min-w-0 flex-1">

          {/* Dropdown trigger */}
          <button
            ref={triggerRef}
            type="button"
            disabled={disabled}
            aria-label="Salutation"
            aria-expanded={isOpen}
            aria-controls="salutation-options"
            aria-haspopup="true"
            onKeyDown={handleTriggerKeyDown}
            onClick={() => setIsOpen(current => !current)}
            className={`
              ${className}
              flex w-full items-center justify-between
              gap-2 text-left
              transition-colors duration-200
              disabled:cursor-not-allowed
              disabled:opacity-50
            `}
          >
            <span className="truncate">
              {value || 'Select'}
            </span>

            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`
                shrink-0 transition-transform duration-200
                ${isOpen ? 'rotate-180' : 'rotate-0'}
              `}
            />
          </button>

          {/* Animated dropdown menu */}
          <div
            id="salutation-options"
            aria-hidden={!isOpen}
            className={`
              absolute left-0 top-full z-50 mt-1
              w-full min-w-[180px]
              max-h-56 overflow-y-auto
              rounded-lg border border-slate-200
              bg-white p-1 shadow-lg
              origin-top
              transition-[opacity,transform,visibility]
              duration-200 ease-out
              motion-reduce:transition-none
              ${
                isOpen
                  ? 'visible translate-y-0 scale-100 opacity-100'
                  : 'invisible pointer-events-none -translate-y-2 scale-95 opacity-0'
              }
            `}
          >
            {/* Reset selection */}
            <button
              type="button"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="
                flex h-9 w-full items-center
                gap-2 rounded-md px-2
                text-left text-sm text-slate-500
                hover:bg-slate-100
              "
            >
              <span className="w-4 shrink-0">
                {!value && <Check size={14} />}
              </span>
              Select
            </button>

            {/* Individual options */}
            {visibleOptions.map((option, index) => (
              <div
                key={option.id ?? `default-${option.value}`}
                className="
                  flex min-h-9 items-center
                  gap-1 rounded-md px-1
                  transition-colors duration-150
                  hover:bg-slate-100
                "
              >
                {/* Select option */}
                <button
                  ref={element => {
                    optionRefs.current[index] = element
                  }}
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  onKeyDown={event =>
                    handleOptionKeyDown(event, index)
                  }
                  onClick={() => selectOption(option)}
                  className="
                    flex min-w-0 flex-1 items-center
                    gap-2 rounded-md px-2 py-1.5
                    text-left text-sm text-slate-800
                    focus-visible:outline-2
                    focus-visible:outline-teal-500
                  "
                >
                  <span className="w-4 shrink-0">
                    {value === option.value && (
                      <Check
                        size={14}
                        className="text-teal-600"
                      />
                    )}
                  </span>

                  <span className="truncate">
                    {option.value}
                  </span>
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  disabled={disabled || deleting || saving}
                  onClick={() => deleteOption(option)}
                  aria-label={`Delete ${option.value}`}
                  title={
                    option.removable
                      ? `Permanently delete ${option.value}`
                      : `Hide ${option.value} temporarily`
                  }
                  className="
                    flex h-7 w-7 shrink-0
                    items-center justify-center
                    rounded-md text-red-500
                    transition-colors duration-150
                    hover:bg-red-50
                    hover:text-red-600
                    focus-visible:outline-2
                    focus-visible:outline-red-500
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            ))}

            {visibleOptions.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-500">
                No salutations available
              </p>
            )}
          </div>
        </div>

        {/* Add button */}
        <button
          type="button"
          tabIndex={skipAddOnTab ? -1 : undefined}
          disabled={disabled}
          title="Add salutation"
          aria-label="Add salutation"
          aria-expanded={isAdding}
          onClick={() => {
            setIsAdding(current => !current)
            setIsOpen(false)
            setError('')
          }}
          className="
            legacy-plus-button shrink-0
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {isAdding ? (
            <X className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Animated add-new input */}
      <div
        aria-hidden={!isAdding}
        className={`
          grid overflow-hidden
          transition-[grid-template-rows,opacity,margin]
          duration-200 ease-out
          ${
            isAdding
              ? 'mt-2 grid-rows-[1fr] opacity-100'
              : 'mt-0 grid-rows-[0fr] opacity-0'
          }
        `}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="
              flex gap-1 rounded-lg
              border border-teal-200
              bg-teal-50 p-2
            "
          >
            <input
              className="
                min-w-0 flex-1 rounded-md
                border border-teal-300
                bg-white px-2 py-1.5 text-sm
                outline-none focus:ring-2
                focus:ring-teal-500
              "
              value={newValue}
              onChange={event =>
                setNewValue(event.target.value)
              }
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  saveOption()
                }
              }}
              placeholder="Enter a new salutation"
              autoFocus={isAdding}
              disabled={!isAdding || disabled || saving}
              tabIndex={isAdding ? 0 : -1}
            />

            <button
              type="button"
              disabled={
                !isAdding ||
                disabled ||
                saving ||
                !newValue.trim()
              }
              onClick={saveOption}
              aria-label="Save salutation"
              className="
                rounded-md bg-teal-600
                px-3 text-white
                disabled:opacity-50
              "
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p role="status" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
