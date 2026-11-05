const PORTAL_ROLE_NAMES = new Set([
  'customer',
  'vendor',
  'vendor_admin',
  'delivery',
  'delivery_partner',
  'super_admin',
])

export function getUserPortal(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : []

  if (roles.includes('super_admin') || roles.some((role) => !PORTAL_ROLE_NAMES.has(role))) {
    return 'admin'
  }
  if (roles.includes('vendor_admin') || roles.includes('vendor')) return 'vendor'
  if (roles.includes('delivery_partner') || roles.includes('delivery')) return 'delivery'
  if (roles.includes('customer')) return 'customer'
  return null
}

export function getPortalHome(user) {
  switch (getUserPortal(user)) {
    case 'admin':
      return '/admin'
    case 'vendor':
      return '/vendor'
    case 'delivery':
      return '/delivery'
    case 'customer':
      return '/account'
    default:
      return '/access-denied'
  }
}
