import React from 'react'

export default function Select({ label, error, hint, required, children, ...props }) {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      <select
        className={['select', error ? 'has-error' : ''].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p className="helper">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
