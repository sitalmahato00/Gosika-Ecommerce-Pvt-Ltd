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
  esewa: '/payments/esewa/esewa-icon.png',
  esewaWhite: '/payments/esewa/esewa-icon.png',
  esewaMark: '/payments/esewa/esewa-icon.png',
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
  { section: 'STORE' },
  { to: '/vendor', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
  { to: '/vendor/store/edit', label: 'Store Profile', icon: 'Store' },
  { to: '/vendor/store-settings', label: 'Store Settings', icon: 'Settings' },

  { section: 'ORDERS' },
  { to: '/vendor/orders', label: 'All Orders', icon: 'ShoppingBag' },
  { to: '/vendor/orders/ready', label: 'To Ship', icon: 'PackageCheck' },
  { to: '/vendor/orders/shipped', label: 'Shipped', icon: 'Truck' },
  { to: '/vendor/returns', label: 'Returns & Issues', icon: 'RotateCcw' },

  { section: 'PRODUCTS' },
  { to: '/vendor/products', label: 'My Products', icon: 'Package' },
  { to: '/vendor/products/new', label: 'Add Product', icon: 'PlusCircle' },
  { to: '/vendor/products/approval', label: 'Approval Status', icon: 'ShieldCheck' },
  { to: '/vendor/inventory/low-stock', label: 'Low Stock', icon: 'AlertTriangle' },
  { to: '/vendor/reviews', label: 'Reviews & Q&A', icon: 'Star' },

  { section: 'PROMOTIONS' },
  { to: '/vendor/promotions', label: 'Campaigns', icon: 'Megaphone' },
  { to: '/vendor/coupons', label: 'Vouchers', icon: 'Ticket' },

  { section: 'FINANCE' },
  { to: '/vendor/wallet', label: 'Wallet', icon: 'Wallet' },
  { to: '/vendor/payouts', label: 'Payouts', icon: 'Banknote' },
  { to: '/vendor/settlements', label: 'Settlements', icon: 'FileSpreadsheet' },

  { section: 'SHIPPING' },
  { to: '/vendor/shipping', label: 'Pickup Locations', icon: 'Warehouse' },
  { to: '/vendor/shipping/labels', label: 'Shipping Labels', icon: 'FileText' },

  { section: 'ACCOUNT' },
  { to: '/vendor/profile', label: 'Profile', icon: 'User' },
  { to: '/vendor/verification', label: 'KYC Verification', icon: 'IdCard' },
  { to: '/vendor/bank-accounts', label: 'Bank Account', icon: 'Landmark' },
  { to: '/vendor/security', label: 'Security', icon: 'Lock' },
  { to: '/vendor/notifications', label: 'Notifications', icon: 'Bell' },
  { to: '/vendor/support', label: 'Support', icon: 'Headphones' },
]

export const DELIVERY_NAV = [
  { section: 'DELIVERY' },
  { to: '/delivery', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
  { to: '/delivery/deliveries', label: 'My Deliveries', icon: 'Truck' },
  { to: '/delivery/pickups', label: 'Pickup Tasks', icon: 'PackageCheck' },
  { to: '/delivery/tasks', label: 'Delivery Tasks', icon: 'Navigation' },
  { to: '/delivery/returns', label: 'Returns', icon: 'RotateCcw' },

  { section: 'OPERATIONS' },
  { to: '/delivery/route', label: 'Today\u2019s Route', icon: 'Map' },
  { to: '/delivery/history', label: 'Delivery History', icon: 'History' },
  { to: '/delivery/failures', label: 'Failed Deliveries', icon: 'AlertTriangle' },

  { section: 'PAYMENTS' },
  { to: '/delivery/cod-collection', label: 'COD Collection', icon: 'Banknote' },
  { to: '/delivery/cod-settlement', label: 'COD Settlement', icon: 'FileSpreadsheet' },
  { to: '/delivery/earnings', label: 'Earnings', icon: 'TrendingUp' },

  { section: 'ACCOUNT' },
  { to: '/delivery/profile', label: 'Profile', icon: 'User' },
  { to: '/delivery/vehicle', label: 'Vehicle & Documents', icon: 'Car' },
  { to: '/delivery/availability', label: 'Availability', icon: 'Radio' },
  { to: '/delivery/notifications', label: 'Notifications', icon: 'Bell' },
  { to: '/delivery/security', label: 'Security', icon: 'Lock' },
  { to: '/delivery/support', label: 'Support', icon: 'Headphones' },
]

export const DELIVERY_MOBILE_NAV = [
  { to: '/delivery', label: 'Home', icon: 'LayoutDashboard', end: true },
  { to: '/delivery/deliveries', label: 'Deliveries', icon: 'Truck' },
  { to: '/delivery/route', label: 'Route', icon: 'Map' },
  { to: '/delivery/earnings', label: 'Earnings', icon: 'TrendingUp' },
  { to: '/delivery/profile', label: 'Profile', icon: 'UserCircle' },
]

export const CUSTOMER_NAV = [
  { section: 'ORDERS' },
  { to: '/account/orders', label: 'My Orders', icon: 'ShoppingBag' },
  { to: '/account/orders/active', label: 'Track Orders', icon: 'MapPin' },
  { to: '/account/returns', label: 'Returns & Refunds', icon: 'RotateCcw' },

  { section: 'SHOPPING' },
  { to: '/account/wishlist', label: 'Wishlist', icon: 'Heart' },
  { to: '/account/vouchers', label: 'Vouchers', icon: 'Ticket' },

  { section: 'REVIEWS' },
  { to: '/account/reviews', label: 'My Reviews', icon: 'Star' },

  { section: 'SUPPORT' },
  { to: '/account/help', label: 'Help Center', icon: 'LifeBuoy' },
  { to: '/account/support', label: 'Support Tickets', icon: 'Headphones' },

  { section: 'ACCOUNT' },
  { to: '/account', label: 'Account Overview', icon: 'LayoutDashboard', end: true },
  { to: '/account/notifications', label: 'Notifications', icon: 'Bell' },
  { to: '/account/profile', label: 'Personal Profile', icon: 'User' },
  { to: '/account/addresses', label: 'Addresses', icon: 'MapPin' },
  { to: '/account/security', label: 'Security', icon: 'Lock' },
]

export const ADMIN_MOBILE_NAV = [
  { to: '/admin', label: 'Home', icon: 'LayoutDashboard', end: true },
  { to: '/admin/orders', label: 'Orders', icon: 'ShoppingBag' },
  { to: '/admin/marketplace/products', label: 'Products', icon: 'Package' },
  { to: '/admin/customers', label: 'Customers', icon: 'Users' },
  { to: '/admin/system/settings', label: 'More', icon: 'Settings' },
]

export const VENDOR_MOBILE_NAV = [
  { to: '/vendor', label: 'Home', icon: 'LayoutDashboard', end: true },
  { to: '/vendor/orders', label: 'Orders', icon: 'ShoppingBag' },
  { to: '/vendor/products', label: 'Products', icon: 'Package' },
  { to: '/vendor/wallet', label: 'Wallet', icon: 'Wallet' },
  { to: '/vendor/profile', label: 'Profile', icon: 'UserCircle' },
]

export const ADMIN_NAV = [
  { section: 'Overview' },
  { to: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
  { to: '/admin/analytics/reports', label: 'Analytics & Reports', icon: 'FileBarChart' },

  { section: 'Orders' },
  { to: '/admin/orders', label: 'Orders', icon: 'ShoppingBag' },
  { to: '/admin/orders/returns', label: 'Returns & Exchanges', icon: 'RotateCcw' },
  { to: '/admin/orders/refunds', label: 'Refunds', icon: 'Receipt' },

  { section: 'Catalog' },
  { to: '/admin/marketplace/products', label: 'Products', icon: 'Package' },
  { to: '/admin/marketplace/categories', label: 'Categories & Tax', icon: 'FolderTree' },
  { to: '/admin/marketplace/brands', label: 'Brands & Brands', icon: 'Award' },
  { to: '/admin/marketplace/reviews', label: 'Reviews & Q&A', icon: 'Star' },

  { section: 'Marketplace' },
  { to: '/admin/marketplace/vendors', label: 'Sellers', icon: 'Store' },
  { to: '/admin/marketplace/kyc', label: 'Seller Applications', icon: 'UserPlus' },
  { to: '/admin/marketplace/stores', label: 'Storefronts', icon: 'Building2' },
  { to: '/admin/marketplace/tiers', label: 'Seller Tiers', icon: 'Medal' },
  { to: '/admin/marketplace/bulletins', label: 'Seller Communications', icon: 'Megaphone' },

  { section: 'Customers' },
  { to: '/admin/customers', label: 'Customers', icon: 'Users' },
  { to: '/admin/customers/support', label: 'Support', icon: 'Headphones' },

  { section: 'Logistics' },
  { to: '/admin/fulfillment/dashboard', label: 'Delivery Dashboard', icon: 'Gauge' },
  { to: '/admin/fulfillment/partners', label: 'Delivery Partners', icon: 'Truck' },
  { to: '/admin/fulfillment/assignments', label: 'Order Dispatch', icon: 'Send' },
  { to: '/admin/fulfillment/zones', label: 'Shipping & Delivery', icon: 'MapPin' },
  { to: '/admin/fulfillment/cod', label: 'COD Reconciliation', icon: 'Banknote' },

  { section: 'Finance' },
  { to: '/admin/finance/payments', label: 'Transactions', icon: 'CreditCard' },
  { to: '/admin/finance/commissions', label: 'Commissions', icon: 'Percent' },
  { to: '/admin/finance/payouts', label: 'Payouts', icon: 'Banknote' },
  { to: '/admin/finance/settlements', label: 'Settlements', icon: 'FileSpreadsheet' },

  { section: 'Marketing & Content' },
  { to: '/admin/marketing/campaigns', label: 'Campaigns', icon: 'Megaphone' },
  { to: '/admin/marketing/nominations', label: 'Product Promotions', icon: 'Gift' },
  { to: '/admin/marketing/coupons', label: 'Coupons & Vouchers', icon: 'Ticket' },
  { to: '/admin/marketing/banners', label: 'Banners & Promotions', icon: 'Image' },
  { to: '/admin/marketing/pages', label: 'Pages & Policies', icon: 'FileText' },

  { section: 'Administration' },
  { to: '/admin/system/notifications', label: 'Notifications', icon: 'Bell' },
  { to: '/admin/system/settings', label: 'Settings', icon: 'Settings' },
  { to: '/admin/system/gateways', label: 'Payment Methods', icon: 'CreditCard' },
  { to: '/admin/system/users', label: 'Admin Users', icon: 'Shield' },
  { to: '/admin/system/roles', label: 'Roles & Permissions', icon: 'KeyRound' },
  { to: '/admin/system/audit-logs', label: 'Audit Logs', icon: 'ScrollText' },
  { to: '/admin/system/logs', label: 'System Logs', icon: 'Terminal' },
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
