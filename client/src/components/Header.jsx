import { ActivityIcon, MoonIcon, PlusIcon, SunIcon } from './Icons'

export default function Header({ total, done, theme, onToggleTheme, onOpenActivity, onNewTask, ready }) {
  const percent = total ? Math.round((done / total) * 100) : 0

  return (
    <header className="topbar">
      <div className="brand">
        <span className="logo" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div>
          <h1>Taskboard</h1>
          <p className="muted">Plan it, drag it, finish it.</p>
        </div>
      </div>

      {ready && (
        <div className="progress" aria-label={`${done} of ${total} tasks done`}>
          <div className="progress-text">
            <strong>{percent}%</strong>
            <span className="muted">
              {done} of {total} done
            </span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      <div className="topbar-actions">
        <button type="button" className="btn btn-ghost" onClick={onOpenActivity}>
          <ActivityIcon /> <span className="hide-sm">Activity</span>
        </button>
        <button
          type="button"
          className="icon-btn big"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button type="button" className="btn btn-primary" onClick={onNewTask} disabled={!ready} title="New task (N)">
          <PlusIcon /> New task
        </button>
      </div>
    </header>
  )
}
