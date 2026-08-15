import React from 'react'

export default function Textarea({ label, error, hint, required, ...props }) {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      <textarea
        className={['textarea', error ? 'has-error' : ''].filter(Boolean).join(' ')}
        {...props}
      />
      {hint && !error && <p className="helper">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
