import { useEffect, useState } from 'react'

// index.html already set data-theme before first paint; this hook keeps React in sync.
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // Storage can be blocked (e.g. private mode); the theme simply will not persist.
    }
  }, [theme])

  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}
