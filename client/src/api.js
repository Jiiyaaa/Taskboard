// Thin wrapper around fetch. Every function returns parsed JSON or throws an ApiError
// whose message is safe to show to the user.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status = 0, details = []) {
    super(message)
    this.status = status
    this.details = details // [{ field, message }] from server-side validation
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.')
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const fallback =
      res.status >= 500
        ? 'The server is not responding right now. Please try again in a moment.'
        : `Request failed (${res.status})`
    throw new ApiError(
      data?.details?.[0]?.message || data?.error || fallback,
      res.status,
      data?.details,
    )
  }
  return data
}

export const getTasks = () => request('/tasks')
export const createTask = (data) => request('/tasks', { method: 'POST', body: data })
export const updateTask = (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: data })
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' })
export const moveTask = (id, status, index) =>
  request(`/tasks/${id}/move`, { method: 'PATCH', body: { status, index } })
export const getActivity = () => request('/activity')
export const clearActivity = () => request('/activity', { method: 'DELETE' })
