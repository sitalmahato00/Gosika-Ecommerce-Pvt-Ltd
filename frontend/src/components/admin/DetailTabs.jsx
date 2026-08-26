import React from 'react'

export default function DetailTabs({
  tabs = [],
  activeTab,
  onChange,
  style = {}
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderBottom: '1px solid var(--border)',
        marginBottom: 20,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        ...style
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--primary)' : 'var(--muted)',
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              marginBottom: -1
            }}
          >
            {tab.icon && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: 10,
                  background: isActive ? '#dbeafe' : '#f1f5f9',
                  color: isActive ? 'var(--primary)' : '#64748b'
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
