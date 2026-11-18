
import { createPortal } from 'react-dom'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { customOptionService } from '../api/customOptionService'

export default function AddableSelect({
  field,
  options = [],
  value = '',
  onChange,
  className = 'field-control',
  disabled = false,
  required = false,
  skipAddOnTab = false,
  id,
  name,
}) {
  const menuId = useId()
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const closeTimer = useRef(null)

  const [customOptions, setCustomOptions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [menuMounted, setMenuMounted] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [position, setPosition] = useState({})

  // Built-in choices are hidden only in this browser.
  const storageKey = `hidden-options-${field}`

  const [hiddenDefaults, setHiddenDefaults] = useState(() => {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(storageKey) || '[]'
      )
      return Array.isArray(stored) ? stored : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(storageKey) || '[]'
      )
      setHiddenDefaults(Array.isArray(stored) ? stored : [])
    } catch {
      setHiddenDefaults([])
    }
  }, [storageKey])

  // Load custom options
  useEffect(() => {
    let active = true

    setCustomOptions([])
    setError('')

    customOptionService.getOptions(field)
      .then(result => {
        if (active) setCustomOptions(result.data || [])
      })
      .catch(() => {
        if (active) setError('Unable to load options')
      })

    return () => {
      active = false
    }
  }, [field])

  // Combine built-in and custom options
  const allOptions = useMemo(() => {
    const defaults = [...new Set(
      options.filter(option => option && option !== 'Other')
    )]

    const defaultNames = new Set(
      defaults.map(option => option.toLowerCase())
    )

    const custom = customOptions
      .filter(item =>
        item.value &&
        !defaultNames.has(item.value.toLowerCase())
      )
      .map(item => ({
        id: item.id,
        value: item.value,
        removable: true,
      }))

    return [
      ...defaults.map(option => ({
        id: null,
        value: option,
        removable: false,
      })),
      ...custom,
    ]
  }, [options, customOptions])

  // Hide options removed in this browser
  const visibleOptions = allOptions.filter(
    option => !hiddenDefaults.includes(option.value)
  )

  // Calculate floating menu position
  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect()

    if (!rect) return

    const viewportPadding = 8
    const gap = 6

    const width = Math.min(
      Math.max(rect.width, 180),
      window.innerWidth - viewportPadding * 2
    )

    const left = Math.max(
      viewportPadding,
      Math.min(
        rect.left,
        window.innerWidth - width - viewportPadding
      )
    )

    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap

    const openAbove =
      spaceBelow < 170 && spaceAbove > spaceBelow

    const available = Math.max(
      70,
      openAbove ? spaceAbove : spaceBelow
    )

    setPosition({
      position: 'fixed',
      left,
      width,
      maxHeight: Math.min(224, available),
      zIndex: 9999,
      ...(openAbove
        ? {
            bottom: window.innerHeight - rect.top + gap,
            top: 'auto',
          }
        : {
            top: rect.bottom + gap,
            bottom: 'auto',
          }),
    })
  }

  function openMenu() {
    if (disabled) return

    clearTimeout(closeTimer.current)

    updatePosition()
    setMenuMounted(true)
    setIsOpen(true)
    setIsAdding(false)
  }

  function closeMenu() {
    setIsOpen(false)

    clearTimeout(closeTimer.current)

    closeTimer.current = setTimeout(() => {
      setMenuMounted(false)
    }, 200)
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu()
    } else {
      openMenu()
    }
  }

  // Reposition menu during scrolling or resizing
  useEffect(() => {
    if (!menuMounted) return

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [menuMounted])

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleOutside(event) {
      if (
        !containerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        closeMenu()
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        closeMenu()
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handleOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('keydown', handleEscape)

      clearTimeout(closeTimer.current)
    }
  }, [])

  useEffect(() => {
    if (disabled) {
      setIsOpen(false)
      setMenuMounted(false)
      setIsAdding(false)
    }
  }, [disabled])

  // Select option
  function selectOption(option) {
    onChange(option.value)
    closeMenu()
    triggerRef.current?.focus()
  }

  // Save new option
  async function saveOption() {
    const text = newValue.trim()

    if (!text || saving || disabled) return

    const existing = allOptions.find(
      option => option.value.toLowerCase() === text.toLowerCase()
    )

    if (existing) {
      // Restore a hidden built-in option
      if (
        !existing.removable &&
        hiddenDefaults.includes(existing.value)
      ) {
        const nextHidden = hiddenDefaults.filter(
          item => item !== existing.value
        )

        setHiddenDefaults(nextHidden)

        try {
          window.localStorage.setItem(
            storageKey,
            JSON.stringify(nextHidden)
          )
        } catch {
          // Still restored in this session
        }
      }

      onChange(existing.value)
      setNewValue('')
      setIsAdding(false)
      return
    }

    setSaving(true)
    setError('')

    try {
      const result = await customOptionService.createOption(
        field,
        text
      )

      const saved = result.data

      setCustomOptions(current =>
        current.some(
          item => String(item.id) === String(saved.id)
        )
          ? current
          : [...current, saved]
      )

      onChange(saved.value || text)
      setNewValue('')
      setIsAdding(false)
    } catch (error) {
      console.error('Unable to save dropdown option:', error)
      setError(
        error.response?.data?.detail ||
        'Unable to save this option'
      )
    } finally {
      setSaving(false)
    }
  }

  // Delete custom options, or hide built-in options locally
  async function deleteOption(option) {
    if (disabled || deleting || saving) return

    const message = option.removable
      ? `Permanently delete the custom option "${option.value}"?`
      : `Hide "${option.value}" from this dropdown on this browser?`

    if (!window.confirm(message)) return

    setError('')

    // Built-in option: hide locally
    if (!option.removable) {
      const nextHidden = [
        ...new Set([...hiddenDefaults, option.value])
      ]

      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(nextHidden)
        )
      } catch {
        // Hiding still works in this session
      }

      setHiddenDefaults(nextHidden)

      if (value === option.value) {
        onChange('')
      }

      return
    }

    // Custom option: delete permanently through API
    setDeleting(true)

    try {
      await customOptionService.deleteOption(
        option.id,
        field
      )

      setCustomOptions(current =>
        current.filter(
          item => String(item.id) !== String(option.id)
        )
      )

      if (value === option.value) {
        onChange('')
      }
    } catch (error) {
      console.error('Failed to delete custom option:', error)

      setError(
        error.response?.data?.detail ||
        'Unable to delete this option'
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div ref={containerRef} className="min-w-0">

      <div className="flex min-w-0 items-start gap-1">

        {/* Dropdown trigger */}
        <button
          id={id}
          name={name}
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-label={field.replaceAll('_', ' ')}
          aria-haspopup="true"
          aria-required={required}
          aria-expanded={isOpen}
          aria-controls={menuId}
          onClick={toggleMenu}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              openMenu()
            }
          }}
          className={`
            ${className}
            flex min-w-0 flex-1 items-center
            justify-between gap-2 text-left
            disabled:opacity-50
          `}
        >
          <span className="truncate">
            {value || 'Select'}
          </span>

          <ChevronDown
            size={16}
            className={`
              shrink-0 transition-transform duration-200
              ${isOpen ? 'rotate-180' : ''}
            `}
          />
        </button>

        {/* Add button */}
        <button
          type="button"
          disabled={disabled}
          tabIndex={skipAddOnTab ? -1 : undefined}
          aria-label={`Add ${field.replaceAll('_', ' ')}`}
          aria-expanded={isAdding}
          onClick={() => {
            setIsAdding(current => !current)
            closeMenu()
            setError('')
          }}
          className="legacy-plus-button shrink-0"
        >
          {isAdding ? (
            <X size={16} />
          ) : (
            <Plus size={16} />
          )}
        </button>
      </div>

      {/* Floating dropdown menu */}
      {menuMounted && createPortal(
        <div
          id={menuId}
          ref={menuRef}
          style={position}
          role="group"
          aria-label={`${field.replaceAll('_', ' ')} options`}
          className={`
            overflow-y-auto overscroll-contain
            rounded-lg border border-slate-200
            bg-white p-1 shadow-xl
            transition-[opacity,transform] duration-200
            ease-out motion-reduce:transition-none
            ${
              isOpen
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-95 opacity-0'
            }
          `}
        >

          {/* Clear selection */}
          <button
            type="button"
            className="
              flex min-h-9 w-full items-center
              gap-2 rounded-md px-2
              text-left text-sm text-slate-500
              hover:bg-slate-100
            "
            onClick={() => {
              onChange('')
              closeMenu()
            }}
          >
            <span className="w-4">
              {!value && <Check size={14} />}
            </span>

            Select
          </button>

          {/* Dropdown options */}
          {visibleOptions.map(option => (
            <div
              key={option.id ?? `default-${option.value}`}
              className="
                flex min-h-9 items-center gap-1
                rounded-md px-1
                transition-colors
                hover:bg-slate-100
              "
            >

              {/* Select option */}
              <button
                type="button"
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

              {/* Trash button */}
              <button
                type="button"
                disabled={disabled || deleting || saving}
                onClick={event => {
                  event.stopPropagation()
                  deleteOption(option)
                }}
                aria-label={`Delete ${option.value}`}
                title={
                  option.removable
                    ? `Delete ${option.value}`
                    : `Hide ${option.value} in this browser`
                }
                className="
                  flex h-7 w-7 shrink-0
                  items-center justify-center
                  rounded-md text-red-500
                  hover:bg-red-50
                  hover:text-red-600
                  focus-visible:outline-2
                  focus-visible:outline-red-500
                  disabled:cursor-not-allowed
                  disabled:opacity-30
                "
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          {visibleOptions.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-500">
              No options available
            </p>
          )}
        </div>,
        document.body
      )}

      {/* Add-new option form */}
      {isAdding && (
        <div className="
          mt-2 flex gap-1 rounded-lg
          border border-teal-200
          bg-teal-50 p-2
        ">
          <input
            className="
              min-w-0 flex-1 rounded-md
              border border-teal-300 bg-white
              px-2 py-1.5 text-sm
              focus:outline-none
              focus:ring-2 focus:ring-teal-500
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
            placeholder="Enter a new value"
            autoFocus
            disabled={disabled || saving}
          />

          <button
            type="button"
            disabled={
              disabled ||
              saving ||
              !newValue.trim()
            }
            onClick={saveOption}
            aria-label="Save new option"
            className="
              rounded-md bg-teal-600
              px-3 text-white
              disabled:opacity-50
            "
          >
            <Check size={16} />
          </button>
        </div>
      )}

      {/* Error messages */}
      {error && (
        <p
          role="alert"
          className="mt-1 text-xs text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  )
}