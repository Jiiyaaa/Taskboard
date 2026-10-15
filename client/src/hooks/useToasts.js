import { useCallback, useState } from 'react'

let nextId = 1

export function useToasts() {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const notify = useCallback(
    (message, type = 'info') => {
      const id = nextId++
      setToasts((t) => [...t.slice(-3), { id, message, type }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  return { toasts, notify, dismiss }
}
