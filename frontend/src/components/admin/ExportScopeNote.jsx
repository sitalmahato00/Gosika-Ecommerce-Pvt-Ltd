import React from 'react'
import { Info } from 'lucide-react'

export default function ExportScopeNote({ children = 'Export contains only the filtered records currently shown on this page.' }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        color: '#64748b',
        fontSize: 11,
        lineHeight: 1.4,
        maxWidth: 360
      }}
    >
      <Info size={13} aria-hidden="true" />
      {children}
    </span>
  )
}
