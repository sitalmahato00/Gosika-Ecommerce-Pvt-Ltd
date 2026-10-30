/**
 * Filter navigation items based on user permissions
 * @param {Array} navItems - Navigation items from ADMIN_NAV or ADMIN_MOBILE_NAV
 * @param {Object} permissionMap - ADMIN_PERMISSION_MAP
 * @param {Object} permissions - Permission check functions from AuthContext
 * @returns {Array} Filtered navigation items
 */
export function filterNavigation(navItems, permissionMap, { hasPermission, hasAnyPermission, isSuperAdmin }) {
  // Super admin sees everything
  if (isSuperAdmin) return navItems

  const filtered = []
  let lastSection = null

  for (const item of navItems) {
    // Section headers: include if at least one item in section is visible
    if (item.section) {
      lastSection = item
      continue
    }

    // Check permission requirements
    const requiredPerms = permissionMap[item.to]
    
    // No requirements = accessible to all admins
    if (requiredPerms === null || requiredPerms === undefined) {
      if (lastSection) {
        filtered.push(lastSection)
        lastSection = null
      }
      filtered.push(item)
      continue
    }

    // Single permission string
    if (typeof requiredPerms === 'string') {
      if (hasPermission(requiredPerms)) {
        if (lastSection) {
          filtered.push(lastSection)
          lastSection = null
        }
        filtered.push(item)
      }
      continue
    }

    // Array of permissions (OR logic - user needs any one)
    if (Array.isArray(requiredPerms)) {
      if (hasAnyPermission(requiredPerms)) {
        if (lastSection) {
          filtered.push(lastSection)
          lastSection = null
        }
        filtered.push(item)
      }
    }
  }

  return filtered
}
