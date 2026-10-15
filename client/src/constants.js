// Keep in sync with server/src/constants.js
export const COLUMNS = [
  { id: 'todo', label: 'To Do', hint: 'Things waiting to be started' },
  { id: 'in-progress', label: 'In Progress', hint: 'What you are working on now' },
  { id: 'done', label: 'Done', hint: 'Finished work' },
]

export const STATUSES = COLUMNS.map((c) => c.id)
export const STATUS_LABEL = Object.fromEntries(COLUMNS.map((c) => [c.id, c.label]))

export const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
]
export const PRIORITY_LABEL = Object.fromEntries(PRIORITIES.map((p) => [p.id, p.label]))
