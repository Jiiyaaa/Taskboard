import { PRIORITIES } from '../constants'
import { SearchIcon, XIcon } from './Icons'

export default function FilterBar({ filters, onChange, searchRef }) {
  const active = filters.query !== '' || filters.priority !== 'all'

  return (
    <div className="filters" role="search">
      <label className="search">
        <SearchIcon width={16} height={16} />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search tasks…  ( / )"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          aria-label="Search tasks"
        />
      </label>

      <div className="segmented" role="group" aria-label="Filter by priority">
        {[{ id: 'all', label: 'All' }, ...PRIORITIES].map((p) => (
          <button
            key={p.id}
            type="button"
            className={`seg seg-${p.id}${filters.priority === p.id ? ' active' : ''}`}
            aria-pressed={filters.priority === p.id}
            onClick={() => onChange({ ...filters, priority: p.id })}
          >
            {p.label}
          </button>
        ))}
      </div>

      {active && (
        <>
          <button type="button" className="link-btn" onClick={() => onChange({ query: '', priority: 'all' })}>
            <XIcon width={14} height={14} /> Clear
          </button>
          <span className="muted filter-hint">Filters on — clear them to drag and reorder.</span>
        </>
      )}
    </div>
  )
}
