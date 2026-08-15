import React from 'react'

export default function Button({ variant = 'primary', size, block, icon: Icon, children, ...props }) {
  const cls = [
    'btn',
    variant ? `btn-${variant}` : '',
    size ? `btn-${size}` : '',
    block ? 'btn-block' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} {...props}>
      {Icon ? <Icon size={16} strokeWidth={2.2} /> : null}
      {children}
    </button>
  )
}
