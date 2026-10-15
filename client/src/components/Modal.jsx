import { useEffect, useRef } from 'react'

/**
 * Accessible modal shell: closes on Esc or backdrop click, traps Tab inside the dialog,
 * and returns focus to whatever opened it.
 */
export default function Modal({ title, onClose, children, labelledBy = 'modal-title' }) {
  const dialogRef = useRef(null)
  // Keep the latest onClose without re-running the focus/keyboard effect on every render.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const opener = document.activeElement
    const dialog = dialogRef.current
    const focusable = () =>
      dialog.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')

    // Prefer the first form field over the close button.
    const first = dialog.querySelector('[data-autofocus]') || focusable()[0]
    first?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = [...focusable()].filter((el) => !el.disabled)
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      opener?.focus?.()
    }
  }, [])

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <h2 id={labelledBy} className="modal-title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
