import { useCallback, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { COLUMNS } from '../constants'
import { matchesFilters } from '../utils'
import Column from './Column'
import { TaskCardView } from './TaskCard'

/** Which column holds this id? `id` may itself be a column id (an empty-area drop). */
const findColumn = (order, id) =>
  id in order ? id : Object.keys(order).find((status) => order[status].includes(id))

export default function Board({ tasks, order, setOrder, filters, onMove, onAdd, onEdit, onDelete }) {
  const [activeId, setActiveId] = useState(null)

  // Where the dragged card started, so a drop outside the board can snap it back
  // and a drop in the same spot does not trigger a pointless server call.
  const dragStart = useRef(null)
  const lastOverId = useRef(null)

  const filtering = filters.query.trim() !== '' || filters.priority !== 'all'

  const sensors = useSensors(
    // A small movement threshold keeps plain clicks (edit/delete buttons) from starting a drag.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // On touch screens, press-and-hold to lift so normal scrolling still works.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
    }),
  )

  /**
   * Decide which droppable the dragged card is "over".
   * Pointer position wins; if the pointer is over a column (not a card), snap to the
   * closest card in that column so the list reorders smoothly.
   */
  const collisionDetection = useCallback(
    (args) => {
      const hits = pointerWithin(args)
      const collisions = hits.length ? hits : rectIntersection(args)
      let overId = getFirstCollision(collisions, 'id')

      if (overId != null) {
        if (overId in order && order[overId].length > 0) {
          const closest = closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (c) => c.id !== overId && order[overId].includes(c.id),
            ),
          })
          overId = closest[0]?.id ?? overId
        }
        lastOverId.current = overId
        return [{ id: overId }]
      }
      return lastOverId.current ? [{ id: lastOverId.current }] : []
    },
    [order],
  )

  const handleDragStart = ({ active }) => {
    const column = findColumn(order, active.id)
    dragStart.current = { order, column, index: order[column].indexOf(active.id) }
    setActiveId(active.id)
  }

  // While dragging across columns, move the card into the column it is hovering so the
  // user sees the gap open up. Reordering inside one column is handled by dnd-kit itself.
  const handleDragOver = ({ active, over }) => {
    if (!over) return
    setOrder((prev) => {
      const from = findColumn(prev, active.id)
      const to = findColumn(prev, over.id)
      if (!from || !to || from === to) return prev

      const overItems = prev[to]
      let index
      if (over.id in prev) {
        index = overItems.length // hovering the column itself: go to the end
      } else {
        const overIndex = overItems.indexOf(over.id)
        const below =
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height / 2
        index = overIndex + (below ? 1 : 0)
      }

      return {
        ...prev,
        [from]: prev[from].filter((id) => id !== active.id),
        [to]: [...overItems.slice(0, index), active.id, ...overItems.slice(index)],
      }
    })
  }

  const finishDrag = () => {
    setActiveId(null)
    lastOverId.current = null
  }

  const handleDragEnd = ({ active, over }) => {
    const start = dragStart.current
    finishDrag()
    if (!start) return

    // Dropped outside every column: put everything back where it was.
    if (!over) {
      setOrder(start.order)
      return
    }

    let next = order
    const column = findColumn(order, active.id)
    const overColumn = findColumn(order, over.id)

    if (column && column === overColumn) {
      const from = order[column].indexOf(active.id)
      const to = over.id in order ? order[column].length - 1 : order[column].indexOf(over.id)
      if (to >= 0 && from !== to) {
        next = { ...order, [column]: arrayMove(order[column], from, to) }
        setOrder(next)
      }
    }

    const finalColumn = findColumn(next, active.id)
    const finalIndex = next[finalColumn].indexOf(active.id)
    if (finalColumn !== start.column || finalIndex !== start.index) {
      onMove(active.id, finalColumn, finalIndex)
    }
  }

  const handleDragCancel = () => {
    if (dragStart.current) setOrder(dragStart.current.order)
    finishDrag()
  }

  // Cards visible after search / priority filtering. Counts still show the real totals.
  const visible = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((c) => [c.id, order[c.id].filter((id) => matchesFilters(tasks[id], filters))]),
      ),
    [order, tasks, filters],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <main className="board">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            taskIds={visible[column.id]}
            total={order[column.id].length}
            tasks={tasks}
            filtering={filtering}
            // Positions are ambiguous while some cards are hidden, so reordering waits for the filter to clear.
            dragDisabled={filtering}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </main>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeId && tasks[activeId] ? <TaskCardView task={tasks[activeId]} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
