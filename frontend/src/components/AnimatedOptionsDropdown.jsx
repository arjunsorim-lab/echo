import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const options = [
  { value: 'option_a', label: 'Option A' },
  { value: 'option_b', label: 'Option B' },
  { value: 'option_c', label: 'Option C' },
];

const CLOSE_ANIMATION_MS = 300

export default function AnimatedOptionsDropdown({ disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const closeTimerRef = useRef(null)
  const animationFrameRef = useRef(null)

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const closeMenu = (returnFocus = false) => {
    cancelClose()
    setIsOpen(false)
    closeTimerRef.current = setTimeout(() => {
      setIsMounted(false)
      closeTimerRef.current = null
    }, CLOSE_ANIMATION_MS)
    if (returnFocus) triggerRef.current?.focus()
  }

  const openMenu = (focusFirstOption = false) => {
    if (disabled) return
    cancelClose()
    setIsMounted(true)
    animationFrameRef.current = requestAnimationFrame(() => {
      setIsOpen(true)
      if (focusFirstOption) {
        rootRef.current?.querySelector('[role="menuitem"]')?.focus()
      }
    })
  }

  useEffect(() => {
    const handleOutsidePointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        closeMenu()
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointer)
    return () => document.removeEventListener('pointerdown', handleOutsidePointer)
  }, [])

  useEffect(() => () => {
    cancelClose()
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
  }, [])

  useEffect(() => {
    if (disabled && isOpen) closeMenu()
  }, [disabled, isOpen])

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      closeMenu(true)
      return
    }

    if (event.key === 'ArrowDown' && event.target === triggerRef.current) {
      event.preventDefault()
      openMenu(true)
      return
    }

    const menuItems = Array.from(rootRef.current?.querySelectorAll('[role="menuitem"]') || [])
    const currentIndex = menuItems.indexOf(document.activeElement)
    if (currentIndex < 0 || !menuItems.length) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      const nextIndex = (currentIndex + direction + menuItems.length) % menuItems.length
      menuItems[nextIndex].focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      menuItems[event.key === 'Home' ? 0 : menuItems.length - 1].focus()
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) closeMenu()
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="additional-options-menu"
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-full border border-slate-700 bg-[#0a0a0a] px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50 ${
          isOpen ? 'bg-[#1f1f1f] text-white' : 'text-slate-200 hover:bg-[#1f1f1f]'
        }`}
      >
        <span className="min-w-0 flex-1 truncate text-left">Additional options</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : ''}`} aria-hidden="true" />
      </button>

      {isMounted && (
        <div
          id="additional-options-menu"
          role="menu"
          aria-label="Additional options"
          aria-hidden={!isOpen}
          className={`absolute left-0 top-[calc(100%+8px)] z-50 w-full max-w-[280px] origin-top-left overflow-hidden rounded-xl border border-[#333] bg-black shadow-[0_20px_45px_rgba(0,0,0,0.3)] transition-[opacity,transform] duration-300 ease-in-out ${
            isOpen ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
          }`}
        >
          <div className="grid grid-cols-1 gap-1 p-2">
            {options.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="menuitem"
                tabIndex={isOpen ? 0 : -1}
                onClick={() => closeMenu(true)}
                className="flex min-h-10 items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-[#ededed] transition-colors duration-200 hover:bg-[#1f1f1f] focus-visible:bg-[#1f1f1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
