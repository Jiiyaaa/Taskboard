const pad = (n) => String(n).padStart(2, '0')

/** Today as YYYY-MM-DD in the user's local time zone. */
export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Due dates are date-only. The server stores them as UTC midnight, so we read the
 * calendar day straight from the ISO string instead of converting time zones
 * (which could shift the day for users west of UTC).
 */
export const dueKey = (iso) => (iso ? iso.slice(0, 10) : '')

export function isOverdue(task) {
  return Boolean(task.dueDate) && task.status !== 'done' && dueKey(task.dueDate) < todayKey()
}

export function formatDue(iso) {
  const key = dueKey(iso)
  const today = new Date()
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  if (key === todayKey(today)) return 'Today'
  if (key === todayKey(tomorrow)) return 'Tomorrow'
  const [y, m, d] = key.split('-').map(Number)
  const sameYear = y === today.getFullYear()
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** "2:30 PM" for today, "Oct 13, 2:30 PM" for earlier days. */
export function formatTime(iso) {
  const d = new Date(iso)
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (todayKey(d) === todayKey()) return time
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${date}, ${time}`
}

export function matchesFilters(task, { query, priority }) {
  if (priority !== 'all' && task.priority !== priority) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  return task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q)
}
