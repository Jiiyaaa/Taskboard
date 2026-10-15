import { useState } from 'react'
import Modal from './Modal'

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose} labelledBy="confirm-title">
      <p className="confirm-text">{message}</p>
      {error && (
        <p className="banner-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" data-autofocus onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={confirm} disabled={busy}>
          {busy ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
