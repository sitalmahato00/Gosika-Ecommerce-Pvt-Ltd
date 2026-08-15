import React from 'react'
import { NavLink } from 'react-router-dom'
import * as Icons from 'lucide-react'

export default function MobileBottomNav({ items }) {
  if (!items || items.length === 0) return null
  return (
    <nav className="delivery-bottom-nav" aria-label="Delivery partner mobile navigation">
      {items.map((item) => {
        const Ic = Icons[item.icon] || Icons.Circle
        return (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Ic size={20} strokeWidth={2} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
