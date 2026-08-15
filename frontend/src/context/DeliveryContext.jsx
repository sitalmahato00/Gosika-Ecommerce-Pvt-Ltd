import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../api/client'
import { useApi } from '../hooks/useApi'

const DeliveryContext = createContext(null)

export function DeliveryProvider({ children }) {
  const { data, loading, error, reload } = useApi(() => api.get('/delivery-partner/me'))
  const [online, setOnline] = useState(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (data && data.is_online !== undefined) setOnline(Boolean(data.is_online))
  }, [data])

  const toggleOnline = useCallback(async () => {
    const current = online ?? Boolean(data?.is_online ?? false)
    const next = !current
    setToggling(true)
    try {
      const res = await api.post('/delivery-partner/online', { is_online: next })
      const updated = res?.data?.data
      setOnline(Boolean(updated?.is_online))
      reload({ silent: true })
      return updated
    } finally {
      setToggling(false)
    }
  }, [online, data, reload])

  return (
    <DeliveryContext.Provider
      value={{
        rider: data,
        loading,
        error,
        reload,
        online,
        setOnline,
        toggleOnline,
        toggling,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  )
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext)
  if (!ctx) throw new Error('useDelivery must be used within a DeliveryProvider')
  return ctx
}
