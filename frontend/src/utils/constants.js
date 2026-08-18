import { humanizeEnum } from './format'
export {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS as NEPAL_DISTRICTS_BY_PROVINCE,
  getDistrictsForProvince,
  getMunicipalitiesForDistrict,
  reverseGeocodeLocal,
} from './nepalLocations'

export const NEPAL_CITY_COORDINATES = {
  'Kathmandu': { lat: 27.7172, lng: 85.3240, zoom: 14 },
  'Lalitpur': { lat: 27.6588, lng: 85.3247, zoom: 14 },
  'Bhaktapur': { lat: 27.6710, lng: 85.4298, zoom: 14 },
  'Pokhara': { lat: 28.2096, lng: 83.9856, zoom: 14 },
  'Biratnagar': { lat: 26.4525, lng: 87.2718, zoom: 14 },
  'Dharan': { lat: 26.8124, lng: 87.2834, zoom: 14 },
  'Bharatpur': { lat: 27.6833, lng: 84.4333, zoom: 14 },
  'Butwal': { lat: 27.7006, lng: 83.4484, zoom: 14 },
  'Nepalgunj': { lat: 28.0500, lng: 81.6167, zoom: 14 },
  'Dhangadhi': { lat: 28.6833, lng: 80.6000, zoom: 14 },
  'Birgunj': { lat: 27.0133, lng: 84.8778, zoom: 14 },
  'Hetauda': { lat: 27.4286, lng: 85.0322, zoom: 14 },
  'Janakpur': { lat: 26.7288, lng: 85.9244, zoom: 14 },
}

export const NEPAL_POPULAR_LOCATIONS = [
  { name: 'Kathmandu - New Road', province: 'Bagmati Province', district: 'Kathmandu', municipality: 'Kathmandu Metropolitan City', address: 'New Road, Ward 22', lat: 27.7042, lng: 85.3120 },
  { name: 'Kathmandu - Thamel', province: 'Bagmati Province', district: 'Kathmandu', municipality: 'Kathmandu Metropolitan City', address: 'Thamel Marg, Ward 26', lat: 27.7154, lng: 85.3123 },
  { name: 'Lalitpur - Patan', province: 'Bagmati Province', district: 'Lalitpur', municipality: 'Lalitpur Metropolitan City', address: 'Jhamsikhel, Ward 3', lat: 27.6782, lng: 85.3140 },
  { name: 'Pokhara - Lakeside', province: 'Gandaki Province', district: 'Kaski', municipality: 'Pokhara Metropolitan City', address: 'Lakeside Road, Ward 6', lat: 28.2096, lng: 83.9575 },
  { name: 'Biratnagar - Main Bazaar', province: 'Koshi Province', district: 'Morang', municipality: 'Biratnagar Metropolitan City', address: 'Main Road, Ward 4', lat: 26.4525, lng: 87.2718 },
  { name: 'Dharan - Bhanu Chowk', province: 'Koshi Province', district: 'Sunsari', municipality: 'Dharan Sub-Metropolitan City', address: 'Bhanu Chowk, Ward 2', lat: 26.8124, lng: 87.2834 },
  { name: 'Chitwan - Narayangarh', province: 'Bagmati Province', district: 'Chitwan', municipality: 'Bharatpur Metropolitan City', address: 'Lions Chowk, Ward 1', lat: 27.6833, lng: 84.4333 },
  { name: 'Butwal - Traffic Chowk', province: 'Lumbini Province', district: 'Rupandehi', municipality: 'Butwal Sub-Metropolitan City', address: 'Main Highway, Ward 4', lat: 27.7006, lng: 83.4484 },
]

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

export const ORDER_STATUS_FLOW = [
  'pending',
  'confirmed',
  'processing',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'completed',
]

export const DELIVERY_STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

export const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on Delivery',
  khalti: 'Khalti',
  esewa: 'eSewa',
  fonepay: 'Fonepay',
  wallet: 'Wallet',
  bank_transfer: 'Bank Transfer',
}

export const PAYMENT_BRAND_LOGOS = {
  esewa: '/payments/esewa/esewa-green.png',
  esewaWhite: '/payments/esewa/esewa-white.png',
  esewaMark: '/payments/esewa/esewa-e-green.png',
  khalti: '/payments/khalti/khalti-purple.svg',
  cod: '/payments/cod/cod-icon.svg',
}

export const PAYMENT_GATEWAY_META = {
  esewa: {
    label: 'eSewa Digital Wallet',
    color: '#15803d',
    bg: '#f0fdf4',
    description: 'Pay with eSewa wallet, internet banking or mobile banking.',
  },
  khalti: {
    label: 'Khalti Digital Wallet',
    color: '#47268B',
    bg: '#f5f3ff',
    description: 'Pay with Khalti wallet, bank transfer or mobile banking.',
  },
  cod: {
    label: 'Cash on Delivery',
    color: '#16a34a',
    bg: '#f0fdf4',
    description: 'Pay with cash when your order is delivered.',
  },
  fonepay: {
    label: 'Fonepay',
    color: '#2563eb',
    bg: '#eff6ff',
    description: 'Pay with Fonepay digital wallet.',
  },
}

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  initiated: 'Initiated',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

export function statusLabel(status) {
  if (!status) return '—'
  return humanizeEnum(status)
}

export function deliveryStatusStep(status) {
  const order = ['pending', 'accepted', 'picked_up', 'out_for_delivery', 'delivered']
  return order.indexOf(status) + 1
}

export const PAYOUT_METHODS = ['bank_transfer', 'khalti', 'esewa']

export const VENDOR_NAV = [
  { section: 'Dashboard' },
  { to: '/vendor', label: 'Dashboard', icon: 'LayoutDashboard', end: true },

  { section: 'Store' },
  { to: '/vendor/stores', label: 'Store Profile', icon: 'Store' },
  { to: '/vendor/store-settings', label: 'Store Settings', icon: 'Settings' },

  { section: 'Catalog' },
  { to: '/vendor/products', label: 'Products', icon: 'Package' },
  { to: '/vendor/products/new', label: 'Add Product', icon: 'PlusSquare' },
  { to: '/vendor/inventory', label: 'Inventory', icon: 'Layers' },

  { section: 'Orders' },
  { to: '/vendor/orders', label: 'Orders', icon: 'ShoppingBag' },
  { to: '/vendor/returns', label: 'Returns & Refunds', icon: 'RotateCcw' },

  { section: 'Finance' },
  { to: '/vendor/earnings', label: 'Earnings', icon: 'TrendingUp' },
  { to: '/vendor/commission', label: 'Commission', icon: 'Percent' },
  { to: '/vendor/wallet', label: 'Wallet', icon: 'Wallet' },
  { to: '/vendor/transactions', label: 'Transactions', icon: 'Receipt' },
  { to: '/vendor/settlements', label: 'Settlements', icon: 'FileSpreadsheet' },

  { section: 'Marketing' },
  { to: '/vendor/coupons', label: 'Coupons', icon: 'Ticket' },
  { to: '/vendor/promotions', label: 'Promotions', icon: 'Megaphone' },

  { section: 'Customers' },
  { to: '/vendor/reviews', label: 'Reviews & Ratings', icon: 'Star' },

  { section: 'Analytics' },
  { to: '/vendor/analytics', label: 'Sales & Performance', icon: 'BarChart2' },

  { section: 'Support' },
  { to: '/vendor/support', label: 'Support Tickets', icon: 'Headphones' },

  { section: 'Settings' },
  { to: '/vendor/profile', label: 'Profile', icon: 'UserCircle' },
  { to: '/vendor/security', label: 'Security', icon: 'Shield' },
  { to: '/vendor/notifications', label: 'Notifications', icon: 'Bell' },
]

export const DELIVERY_NAV = [
  { section: 'Dashboard' },
  { to: '/delivery', label: 'Rider Dashboard', icon: 'LayoutDashboard', end: true },

  { section: 'Deliveries' },
  { to: '/delivery/deliveries', label: 'Assigned Deliveries', icon: 'Truck' },
  { to: '/delivery/active', label: 'Active Delivery', icon: 'Navigation' },
  { to: '/delivery/history', label: 'Delivery History', icon: 'Clock' },

  { section: 'Finance' },
  { to: '/delivery/earnings', label: 'Earnings & Payouts', icon: 'TrendingUp' },
  { to: '/delivery/transactions', label: 'Transactions', icon: 'Receipt' },
  { to: '/delivery/cod-collection', label: 'COD Cash Ledger', icon: 'Wallet' },

  { section: 'Account' },
  { to: '/delivery/notifications', label: 'Notifications', icon: 'Bell' },
  { to: '/delivery/profile', label: 'Rider & Vehicle Profile', icon: 'UserCircle' },
  { to: '/delivery/vehicle', label: 'Vehicle Details', icon: 'Bike' },
  { to: '/delivery/settings', label: 'Settings', icon: 'Settings' },
  { to: '/delivery/support', label: 'Help & Support', icon: 'Headphones' },
]

export const DELIVERY_MOBILE_NAV = [
  { to: '/delivery', label: 'Home', icon: 'LayoutDashboard', end: true },
  { to: '/delivery/deliveries', label: 'Deliveries', icon: 'Truck' },
  { to: '/delivery/active', label: 'Active', icon: 'Navigation' },
  { to: '/delivery/earnings', label: 'Earnings', icon: 'TrendingUp' },
  { to: '/delivery/profile', label: 'Profile', icon: 'UserCircle' },
]

export const ADMIN_NAV = [
  { section: 'Dashboard' },
  { to: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', end: true },

  { section: 'Commerce' },
  { to: '/admin/orders', label: 'Orders', icon: 'ShoppingBag' },
  { to: '/admin/products', label: 'Products', icon: 'Package' },
  { to: '/admin/categories', label: 'Categories', icon: 'FolderTree' },
  { to: '/admin/brands', label: 'Brands', icon: 'Tag' },
  { to: '/admin/reviews', label: 'Reviews', icon: 'Star' },

  { section: 'Users' },
  { to: '/admin/customers', label: 'Customers', icon: 'UserCheck' },
  { to: '/admin/vendors', label: 'Vendors', icon: 'Store' },
  { to: '/admin/users', label: 'Admin Users', icon: 'Shield' },

  { section: 'Finance' },
  { to: '/admin/payments', label: 'Payments', icon: 'CreditCard' },
  { to: '/admin/commissions', label: 'Commissions', icon: 'Percent' },
  { to: '/admin/wallets', label: 'Wallets', icon: 'Wallet' },
  { to: '/admin/settlements', label: 'Settlements', icon: 'FileSpreadsheet' },
  { to: '/admin/refunds', label: 'Refunds & Returns', icon: 'RotateCcw' },

  { section: 'Operations' },
  { to: '/admin/shipping', label: 'Shipping', icon: 'MapPin' },
  { to: '/admin/deliveries', label: 'Deliveries', icon: 'Truck' },
  { to: '/admin/support', label: 'Support', icon: 'Headphones' },

  { section: 'Marketing' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'Ticket' },
  { to: '/admin/promotions', label: 'Promotions', icon: 'Megaphone' },
  { to: '/admin/notifications', label: 'Notifications', icon: 'Bell' },

  { section: 'Analytics' },
  { to: '/admin/analytics', label: 'Analytics & Reports', icon: 'BarChart2' },

  { section: 'System' },
  { to: '/admin/roles', label: 'Roles & Permissions', icon: 'Lock' },
  { to: '/admin/settings', label: 'Settings', icon: 'Settings' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: 'FileText' },
]

export const SHIPPING_METHODS = [
  { value: 'standard', label: 'Standard Delivery (3–7 days)' },
  { value: 'express', label: 'Express Delivery (1–2 days)' },
]

export const PRICE_RANGES = [
  { label: 'Under Rs. 1,000', min: 0, max: 1000 },
  { label: 'Rs. 1,000 – 5,000', min: 1000, max: 5000 },
  { label: 'Rs. 5,000 – 15,000', min: 5000, max: 15000 },
  { label: 'Rs. 15,000 – 50,000', min: 15000, max: 50000 },
  { label: 'Above Rs. 50,000', min: 50000, max: 10000000 },
]
