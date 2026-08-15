import React from 'react'
import { DeliveryProvider, useDelivery } from '../../context/DeliveryContext'
import { DELIVERY_NAV, DELIVERY_MOBILE_NAV } from '../../utils/constants'
import DashboardLayout from './DashboardLayout'

function DeliveryShell() {
  const { rider, online, toggleOnline, toggling } = useDelivery()
  return (
    <DashboardLayout
      nav={DELIVERY_NAV}
      title="Delivery Portal"
      roleLabel="Delivery Partner"
      rider={rider}
      onDuty={online}
      onToggleDuty={toggleOnline}
      dutyToggling={toggling}
      mobileNav={DELIVERY_MOBILE_NAV}
    />
  )
}

export default function DeliveryLayout() {
  return (
    <DeliveryProvider>
      <DeliveryShell />
    </DeliveryProvider>
  )
}
