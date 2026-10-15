import { useEffect } from 'react'
import { STATUS_LABEL } from '../constants'
import { formatTime } from '../utils'
import { ActivityIcon, XIcon } from './Icons'

/** Turns an activity record into a readable sentence. */
function Sentence({ entry }) {
  const title = <strong>{entry.taskTitle}</strong>
  switch (entry.type) {
    case 'created':
      return <>{title} was created in {STATUS_LABEL[entry.to]}</>
    case 'moved':
      return <>{title} moved to <b className={`dest dest-${entry.to}`}>{STATUS_LABEL[entry.to]}</b></>
    case 'deleted':
      return <>{title} was deleted</>
    default:
      return <>{title} was updated</>
  }
}

export default function ActivityDrawer({ activity, onClose, onClear }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-label="Activity log">
        <header className="drawer-head">
          <h2>
            <ActivityIcon width={18} height={18} /> Activity
          </h2>
          <div>
            {activity.length > 0 && (
              <button type="button" className="link-btn" onClick={onClear}>
                Clear
              </button>
            )}
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close activity log" autoFocus>
              <XIcon />
            </button>
          </div>
        </header>

        {activity.length === 0 ? (
          <p className="empty-drawer muted">Nothing yet. Create or move a task and it will show up here.</p>
        ) : (
          <ol className="timeline">
            {activity.map((entry) => (
              <li key={entry.id} className={`event event-${entry.type}`}>
                <p>
                  <Sentence entry={entry} />
                </p>
                <time className="muted" dateTime={entry.createdAt}>
                  {formatTime(entry.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  )
}
