import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PRIORITY_LABEL } from '../constants'
import { formatDue, isOverdue } from '../utils'
import { CalendarIcon, EditIcon, TrashIcon } from './Icons'

/** The visual card. Used in the list, and (with `overlay`) as the floating copy while dragging. */
export function TaskCardView({ task, overlay = false, onEdit, onDelete, ...rest }) {
  const overdue = isOverdue(task)

  return (
    <article
      className={`card priority-${task.priority}${overlay ? ' card-overlay' : ''}`}
      aria-label={`${task.title}, ${PRIORITY_LABEL[task.priority]} priority`}
      {...rest}
    >
      <div className="card-top">
        <h3 className="card-title">{task.title}</h3>
        {!overlay && (
          <div className="card-actions">
            <button type="button" className="icon-btn" onClick={onEdit} aria-label={`Edit ${task.title}`}>
              <EditIcon width={15} height={15} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              onClick={onDelete}
              aria-label={`Delete ${task.title}`}
            >
              <TrashIcon width={15} height={15} />
            </button>
          </div>
        )}
      </div>

      {task.description && <p className="card-desc">{task.description}</p>}

      <div className="card-meta">
        <span className={`badge badge-${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
        {task.dueDate && (
          <span className={`due${overdue ? ' overdue' : ''}`} title={overdue ? 'Overdue' : 'Due date'}>
            <CalendarIcon width={13} height={13} />
            {overdue && 'Overdue · '}
            {formatDue(task.dueDate)}
          </span>
        )}
      </div>
    </article>
  )
}

/** A card wired into dnd-kit: sortable inside its column and draggable between columns. */
function SortableTaskCard({ task, disabled, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled,
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  // Space/Enter belong to dnd-kit's keyboard sensor to lift a card; Enter opens the editor
  // only when the card is not being lifted (see Board's keyboardCodes: start = Space only).
  const handleKeyDown = (e) => {
    listeners?.onKeyDown?.(e)
    if (e.key === 'Enter' && e.target === e.currentTarget) onEdit()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-wrap${isDragging ? ' is-dragging' : ''}${disabled ? '' : ' draggable'}`}
      {...attributes}
      {...listeners}
      onKeyDown={handleKeyDown}
    >
      <TaskCardView task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

export default memo(SortableTaskCard)
