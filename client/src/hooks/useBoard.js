import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../api'
import { STATUSES } from '../constants'

const emptyOrder = () => Object.fromEntries(STATUSES.map((s) => [s, []]))

/** Turns the server's flat list into { tasks: {id: task}, order: {status: [id, ...]} }. */
function normalize(list) {
  const tasks = {}
  const order = emptyOrder()
  for (const task of list) {
    tasks[task.id] = task
    order[task.status].push(task.id) // list arrives sorted by position, so order is preserved
  }
  return { tasks, order }
}

/**
 * All board state and server calls live here, so components stay presentational.
 *
 *  tasks - lookup of every task by id
 *  order - the id order of each column; this is what the UI renders and what
 *          drag-and-drop mutates while you drag
 */
export function useBoard(notify) {
  const [tasks, setTasks] = useState({})
  const [order, setOrder] = useState(emptyOrder)
  const [activity, setActivity] = useState([])
  const [phase, setPhase] = useState('loading') // 'loading' | 'ready' | 'error'
  const [loadError, setLoadError] = useState('')

  // Moves are sent one at a time, in the order the user made them.
  const moveQueue = useRef(Promise.resolve())

  const refreshActivity = useCallback(async () => {
    try {
      setActivity(await api.getActivity())
    } catch {
      // The log is a nice-to-have; never interrupt the user for it.
    }
  }, [])

  // `silent` = a background refresh: failures show a toast instead of replacing the board.
  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const [list, log] = await Promise.all([api.getTasks(), api.getActivity()])
        const next = normalize(list)
        setTasks(next.tasks)
        setOrder(next.order)
        setActivity(log)
        setPhase('ready')
      } catch (err) {
        if (silent) {
          notify(err.message, 'error')
        } else {
          setLoadError(err.message)
          setPhase('error')
        }
      }
    },
    [notify],
  )

  // The initial phase is already 'loading', so the first fetch needs no extra state change.
  useEffect(() => {
    // Fetching on mount is the intended use of an effect; state is only set after the await.
    // oxlint-disable-next-line react/set-state-in-effect
    load()
  }, [load])

  const retry = useCallback(() => {
    setPhase('loading')
    return load()
  }, [load])

  // The three mutations below throw on failure so the form can show the message.
  const createTask = useCallback(
    async (data) => {
      const task = await api.createTask(data)
      setTasks((prev) => ({ ...prev, [task.id]: task }))
      setOrder((prev) => ({ ...prev, [task.status]: [...prev[task.status], task.id] }))
      refreshActivity()
      return task
    },
    [refreshActivity],
  )

  const updateTask = useCallback(
    async (id, data) => {
      const task = await api.updateTask(id, data)
      setTasks((prev) => ({ ...prev, [task.id]: task }))
      refreshActivity()
      return task
    },
    [refreshActivity],
  )

  const deleteTask = useCallback(
    async (id) => {
      await api.deleteTask(id)
      setTasks((prev) => {
        const { [id]: _removed, ...rest } = prev
        return rest
      })
      setOrder((prev) =>
        Object.fromEntries(Object.entries(prev).map(([s, ids]) => [s, ids.filter((x) => x !== id)])),
      )
      refreshActivity()
    },
    [refreshActivity],
  )

  /**
   * Persist a drop. The UI already shows the new position (drag-and-drop changed
   * `order` live), so this is optimistic: we only talk to the server in the
   * background and, if that fails, reload the truth from the server.
   */
  const commitMove = useCallback(
    (id, status, index) => {
      setTasks((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], status } } : prev))

      moveQueue.current = moveQueue.current
        .then(() => api.moveTask(id, status, index))
        .then((task) => {
          setTasks((prev) => (prev[task.id] ? { ...prev, [task.id]: task } : prev))
          refreshActivity()
        })
        .catch((err) => {
          notify(`Could not save the move: ${err.message}`, 'error')
          return load({ silent: true })
        })
    },
    [load, notify, refreshActivity],
  )

  const clearActivity = useCallback(async () => {
    try {
      await api.clearActivity()
      setActivity([])
    } catch (err) {
      notify(err.message, 'error')
    }
  }, [notify])

  return {
    tasks,
    order,
    setOrder,
    activity,
    phase,
    loadError,
    retry,
    createTask,
    updateTask,
    deleteTask,
    commitMove,
    clearActivity,
  }
}
