import { useState } from 'react'
import { PRIORITIES, STATUS_LABEL } from '../constants'
import { dueKey } from '../utils'
import Modal from './Modal'

const TITLE_MAX = 120
const DESC_MAX = 1000

/**
 * Create / edit form.
 *  task    - when present we are editing it, otherwise creating
 *  status  - the column a new task will be added to
 *  onSave  - async (data) => void; may throw an ApiError, which is shown in the form
 */
export default function TaskModal({ task, status, onSave, onClose }) {
  const editing = Boolean(task)
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'medium',
    dueDate: dueKey(task?.dueDate),
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setErrors({ title: 'Title is required' })
      return
    }

    setSaving(true)
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
        ...(editing ? {} : { status }),
      })
      onClose()
    } catch (err) {
      // Show server-side validation next to the field when we can, otherwise as a banner.
      const fieldErrors = {}
      for (const d of err.details ?? []) if (d.field) fieldErrors[d.field] = d.message
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { form: err.message })
      setSaving(false)
    }
  }

  return (
    <Modal title={editing ? 'Edit task' : `New task · ${STATUS_LABEL[status]}`} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="title">
            Title <span className="req">*</span>
          </label>
          <input
            id="title"
            data-autofocus
            value={form.title}
            onChange={set('title')}
            maxLength={TITLE_MAX}
            placeholder="e.g. Design the landing page"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          <div className="field-foot">
            {errors.title ? (
              <span id="title-error" className="error" role="alert">
                {errors.title}
              </span>
            ) : (
              <span />
            )}
            <span className="muted counter">
              {form.title.length}/{TITLE_MAX}
            </span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={set('description')}
            maxLength={DESC_MAX}
            placeholder="Optional details, links, acceptance criteria…"
          />
          {errors.description && (
            <span className="error" role="alert">
              {errors.description}
            </span>
          )}
        </div>

        <div className="field-row">
          <fieldset className="field">
            <legend>Priority</legend>
            <div className="radio-group">
              {PRIORITIES.map((p) => (
                <label key={p.id} className={`radio radio-${p.id}${form.priority === p.id ? ' checked' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value={p.id}
                    checked={form.priority === p.id}
                    onChange={set('priority')}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="dueDate">Due date</label>
            <input id="dueDate" type="date" value={form.dueDate} onChange={set('dueDate')} />
          </div>
        </div>

        {errors.form && (
          <p className="banner-error" role="alert">
            {errors.form}
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
