import { useCallback, useEffect, useRef, useState } from 'react'
import { useBoard } from './hooks/useBoard'
import { useToasts } from './hooks/useToasts'
import { useTheme } from './hooks/useTheme'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import Board from './components/Board'
import BoardSkeleton from './components/BoardSkeleton'
import TaskModal from './components/TaskModal'
import ConfirmDialog from './components/ConfirmDialog'
import ActivityDrawer from './components/ActivityDrawer'
import Toasts from './components/Toasts'
import { AlertIcon } from './components/Icons'

const NO_FILTERS = { query: '', priority: 'all' }

export default function App() {
  const { toasts, notify, dismiss } = useToasts()
  const [theme, toggleTheme] = useTheme()
  const board = useBoard(notify)

  const [filters, setFilters] = useState(NO_FILTERS)
  const [editor, setEditor] = useState(null) // { task } to edit, or { status } to create
  const [deleting, setDeleting] = useState(null) // the task awaiting delete confirmation
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchRef = useRef(null)

  const ready = board.phase === 'ready'
  const total = Object.keys(board.tasks).length
  const done = board.order.done.length

  const openCreate = useCallback((status = 'todo') => setEditor({ status }), [])
  const closeEditor = useCallback(() => setEditor(null), [])
  const closeDeleting = useCallback(() => setDeleting(null), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  // Keyboard shortcuts: N = new task, / = search. Ignored while typing or inside a dialog.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !ready) return
      const tag = e.target.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable) return
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        openCreate()
      } else if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready, openCreate])

  const saveTask = (data) =>
    editor.task ? board.updateTask(editor.task.id, data) : board.createTask(data)

  return (
    <div className="app">
      <Header
        ready={ready}
        total={total}
        done={done}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenActivity={() => setDrawerOpen(true)}
        onNewTask={() => openCreate()}
      />

      {board.phase === 'loading' && <BoardSkeleton />}

      {board.phase === 'error' && (
        <div className="state-card" role="alert">
          <AlertIcon width={32} height={32} />
          <h2>Couldn’t load your board</h2>
          <p className="muted">{board.loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => board.retry()}>
            Try again
          </button>
        </div>
      )}

      {ready && (
        <>
          <FilterBar filters={filters} onChange={setFilters} searchRef={searchRef} />
          <Board
            tasks={board.tasks}
            order={board.order}
            setOrder={board.setOrder}
            filters={filters}
            onMove={board.commitMove}
            onAdd={openCreate}
            onEdit={(task) => setEditor({ task })}
            onDelete={setDeleting}
          />
          {total === 0 && (
            <p className="first-run muted">
              Your board is empty. Press <kbd>N</kbd> or use <b>New task</b> to add your first card, then drag it across the
              columns.
            </p>
          )}
        </>
      )}

      {editor && <TaskModal task={editor.task} status={editor.status} onSave={saveTask} onClose={closeEditor} />}

      {deleting && (
        <ConfirmDialog
          title="Delete this task?"
          message={`“${deleting.title}” will be permanently removed. This can’t be undone.`}
          confirmLabel="Delete task"
          onConfirm={() => board.deleteTask(deleting.id)}
          onClose={closeDeleting}
        />
      )}

      {drawerOpen && <ActivityDrawer activity={board.activity} onClose={closeDrawer} onClear={board.clearActivity} />}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
