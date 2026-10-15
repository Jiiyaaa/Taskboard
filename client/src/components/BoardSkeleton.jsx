import { useEffect, useState } from 'react'
import { COLUMNS } from '../constants'

const CARDS = [3, 2, 1]

/** Placeholder board shown while loading. Explains slow cold starts on free hosting. */
export default function BoardSkeleton() {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {slow && (
        <p className="slow-note" role="status">
          Waking the server up — free hosting sleeps when idle, so the first load can take up to a minute.
        </p>
      )}
      <main className="board" aria-busy="true" aria-label="Loading tasks">
        {COLUMNS.map((column, i) => (
          <section key={column.id} className="column">
            <header className="column-header">
              <span className="column-dot" aria-hidden="true" />
              <h2>{column.label}</h2>
              <span className="count skeleton-block" style={{ width: 28 }}>&nbsp;</span>
            </header>
            <div className="column-body">
              {Array.from({ length: CARDS[i] }, (_, n) => (
                <div key={n} className="card skeleton">
                  <div className="skeleton-block" style={{ width: '70%', height: 14 }} />
                  <div className="skeleton-block" style={{ width: '95%', height: 10, marginTop: 12 }} />
                  <div className="skeleton-block" style={{ width: '40%', height: 18, marginTop: 14 }} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  )
}
