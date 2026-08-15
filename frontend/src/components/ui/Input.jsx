import React from 'react'

export function Field({ label, required, error, hint, children }) {
  return (
    <div className="form-group">
      {label && (
        <label className="label">
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="helper">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}

export default function Input({ label, error, hint, required, className, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <input
        className={['input', error ? 'has-error' : '', className || ''].filter(Boolean).join(' ')}
        {...props}
      />
    </Field>
  )
}
