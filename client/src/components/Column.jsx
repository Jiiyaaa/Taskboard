import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import { InboxIcon, PlusIcon, SearchOffIcon } from './Icons'

export default function Column({
  column,
  taskIds,
  total,
  tasks,
  filtering,
  dragDisabled,
  onAdd,
  onEdit,
  onDelete,
}) {
  // The column itself is a drop target, so cards can be dropped into an empty column.
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const empty = taskIds.length === 0

  return (
    <section className={`column column-${column.id}${isOver ? ' is-over' : ''}`} aria-labelledby={`col-${column.id}`}>
      <header className="column-header">
        <span className="column-dot" aria-hidden="true" />
        <h2 id={`col-${column.id}`}>{column.label}</h2>
        {/* aria-live so screen readers hear the count change after a drag */}
        <span className="count" aria-live="polite" aria-label={`${total} tasks`}>
          {filtering ? `${taskIds.length} of ${total}` : total}
        </span>
        <button
          type="button"
          className="icon-btn add-btn"
          onClick={() => onAdd(column.id)}
          aria-label={`Add a task to ${column.label}`}
          title={`Add to ${column.label}`}
        >
          <PlusIcon width={16} height={16} />
        </button>
      </header>

      <div ref={setNodeRef} className="column-body">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {taskIds.map((id) => (
            <TaskCard
              key={id}
              task={tasks[id]}
              disabled={dragDisabled}
              onEdit={() => onEdit(tasks[id])}
              onDelete={() => onDelete(tasks[id])}
            />
          ))}
        </SortableContext>

        {empty && (
          <div className="empty">
            {filtering && total > 0 ? (
              <>
                <SearchOffIcon width={26} height={26} />
                <p>No tasks match your filters</p>
              </>
            ) : (
              <>
                <InboxIcon width={26} height={26} />
                <p>{column.hint}</p>
                <button type="button" className="link-btn" onClick={() => onAdd(column.id)}>
                  + Add a task
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
