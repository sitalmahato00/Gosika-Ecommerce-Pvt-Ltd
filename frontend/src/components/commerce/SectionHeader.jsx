import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function SectionHeader({ title, subtitle, to, action }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-2" style={{ marginBottom: 16 }}>
      <div>
        <h2 className="m-0" style={{ fontSize: 20 }}>
          {title}
        </h2>
        {subtitle && <p className="muted m-0 mt-1" style={{ fontSize: 13 }}>{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="flex items-center gap-1" style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
          View all <ChevronRight size={15} />
        </Link>
      )}
      {action}
    </div>
  )
}
