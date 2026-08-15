import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gosika_user')) || null
    } catch {
      return null
    }
  })
  const [booted, setBooted] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('gosika_token')
    if (!token) {
      setBooted(true)
      return
    }
    api
      .get('/auth/me')
      .then((res) => {
        const u = res.data.data
        setUser(u)
        localStorage.setItem('gosika_user', JSON.stringify(u))
      })
      .catch(() => {
        localStorage.removeItem('gosika_token')
        localStorage.removeItem('gosika_user')
        setUser(null)
      })
      .finally(() => setBooted(true))
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { identifier: email, password, device_name: 'web' })
    const { token, user: u } = res.data.data
    localStorage.setItem('gosika_token', token)
    localStorage.setItem('gosika_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    localStorage.removeItem('gosika_token')
    localStorage.removeItem('gosika_user')
    setUser(null)
  }

  const hasRole = (role) => !!user?.roles?.some((r) => r === role || r === 'super_admin')
  const isVendor = () => hasRole('vendor_admin')
  const isSuperAdmin = () => hasRole('super_admin')
  const isDeliveryPartner = () => hasRole('delivery_partner')
  const isCustomer = () => !!user && !hasRole('vendor_admin')

  return (
    <AuthContext.Provider
      value={{ user, booted, login, logout, isVendor, isSuperAdmin, isDeliveryPartner, isCustomer }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
