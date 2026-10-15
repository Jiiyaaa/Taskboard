import { AlertIcon, XIcon } from './Icons'

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'error' && <AlertIcon width={16} height={16} />}
          <span>{t.message}</span>
          <button type="button" className="icon-btn" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            <XIcon width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
