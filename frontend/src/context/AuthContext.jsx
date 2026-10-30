import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
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

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { identifier: email, password, device_name: 'web' })
    const { token, user: u } = res.data.data
    localStorage.setItem('gosika_token', token)
    localStorage.setItem('gosika_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const saveSession = useCallback((token, userData) => {
    localStorage.setItem('gosika_token', token)
    localStorage.setItem('gosika_user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    localStorage.removeItem('gosika_token')
    localStorage.removeItem('gosika_user')
    setUser(null)
  }, [])

  const hasRole = useCallback((role) => !!user?.roles?.includes(role), [user])
  const isVendor = useCallback(() => hasRole('vendor_admin'), [hasRole])
  const isSuperAdmin = useCallback(() => hasRole('super_admin'), [hasRole])
  const isDeliveryPartner = useCallback(() => hasRole('delivery_partner'), [hasRole])
  const isCustomer = useCallback(() => !!user && (hasRole('customer') || isVendor()), [user, hasRole, isVendor])

  // Permission Set for O(1) lookup performance
  const permissions = useMemo(() => {
    if (!user?.permissions) return new Set()
    return new Set(user.permissions)
  }, [user])

  // Permission check functions
  const hasPermission = useCallback((permission) => {
    if (!user) return false
    if (isSuperAdmin()) return true
    return permissions.has(permission)
  }, [user, permissions, isSuperAdmin])

  const hasAnyPermission = useCallback((permissionList) => {
    if (!user) return false
    if (isSuperAdmin()) return true
    return permissionList.some(p => permissions.has(p))
  }, [user, permissions, isSuperAdmin])

  const hasAllPermissions = useCallback((permissionList) => {
    if (!user) return false
    if (isSuperAdmin()) return true
    return permissionList.every(p => permissions.has(p))
  }, [user, permissions, isSuperAdmin])

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const updated = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      localStorage.setItem('gosika_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me')
      const u = res.data.data
      setUser(u)
      localStorage.setItem('gosika_user', JSON.stringify(u))
      return u
    } catch {
      return null
    }
  }, [])

  const reloadUser = useCallback(async () => {
    return refreshUser()
  }, [refreshUser])

  const value = useMemo(() => ({
    user, booted, permissions, login, saveSession, logout, updateUser, refreshUser, reloadUser, isVendor, isSuperAdmin, isDeliveryPartner, isCustomer, hasPermission, hasAnyPermission, hasAllPermissions
  }), [user, booted, permissions, login, saveSession, logout, updateUser, refreshUser, reloadUser, isVendor, isSuperAdmin, isDeliveryPartner, isCustomer, hasPermission, hasAnyPermission, hasAllPermissions])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
