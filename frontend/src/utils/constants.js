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
  { section: 'STORE MANAGEMENT' },
  { to: '/vendor', label: 'Store Overview', icon: 'LayoutDashboard', end: true },
  { to: '/vendor/store-design', label: 'Storefront Decoration', icon: 'Palette' },
  { to: '/vendor/store-settings', label: 'Store Profile & Hours', icon: 'Store' },

  { section: 'ORDER FULFILLMENT' },
  { to: '/vendor/orders', label: 'All Orders', icon: 'ShoppingBag' },
  { to: '/vendor/orders/ready', label: 'Ready to Ship', icon: 'PackageCheck', badge: '18' },
  { to: '/vendor/orders/shipped', label: 'Shipped & In Transit', icon: 'Truck' },
  { to: '/vendor/returns', label: 'Returns & RTO', icon: 'RotateCcw', badge: '4' },
  { to: '/vendor/disputes', label: 'Dispute Claims', icon: 'Scale' },

  { section: 'INVENTORY & CATALOG' },
  { to: '/vendor/products', label: 'My Products', icon: 'Package' },
  { to: '/vendor/products/new', label: 'Add New Product', icon: 'PlusCircle' },
  { to: '/vendor/products/approval', label: 'Product Approval Status', icon: 'ShieldCheck', badge: '3' },
  { to: '/vendor/inventory/low-stock', label: 'Low Stock Alerts', icon: 'AlertTriangle', badge: '6' },
  { to: '/vendor/products/import', label: 'Bulk CSV Import', icon: 'Upload' },
  { to: '/vendor/reviews', label: 'Reviews & Q&A', icon: 'Star' },

  { section: 'CAMPAIGNS & PROMOTIONS' },
  { to: '/vendor/promotions/nominations', label: 'Mega Sales Nominations', icon: 'Megaphone', badge: '1' },
  { to: '/vendor/promotions', label: 'Store Vouchers', icon: 'Ticket' },
  { to: '/vendor/promotions/bundles', label: 'Bundle Deals', icon: 'Layers' },
  { to: '/vendor/promotions/free-shipping', label: 'Free Shipping Thresholds', icon: 'Truck' },

  { section: 'FINANCIALS & EARNINGS' },
  { to: '/vendor/wallet', label: 'Wallet & Balance', icon: 'Wallet' },
  { to: '/vendor/payouts', label: 'Payout Requests', icon: 'Banknote' },
  { to: '/vendor/settlements', label: 'Settlement History', icon: 'FileSpreadsheet' },
  { to: '/vendor/commission', label: 'Commission Statements', icon: 'Percent' },
  { to: '/vendor/earnings', label: 'Monthly Invoices', icon: 'Receipt' },

  { section: 'SHIPPING & PICKUPS' },
  { to: '/vendor/shipping/warehouses', label: 'Pickup Warehouses', icon: 'Warehouse' },
  { to: '/vendor/shipping/labels', label: 'Labels & Manifests', icon: 'FileBarChart' },
  { to: '/vendor/shipping/handover', label: 'Courier Handover Slips', icon: 'ClipboardList' },

  { section: 'ACCOUNT & SUPPORT' },
  { to: '/vendor/kyc', label: 'KYC & PAN/VAT', icon: 'IdCard' },
  { to: '/vendor/bank-accounts', label: 'Bank Accounts', icon: 'Landmark' },
  { to: '/vendor/staff', label: 'Staff Permissions', icon: 'Users' },
  { to: '/vendor/support', label: 'Support Tickets', icon: 'Headphones' },
]

export const DELIVERY_NAV = [
  { section: 'DISPATCH MONITOR' },
  { to: '/delivery', label: 'Dispatch Overview', icon: 'LayoutDashboard', end: true },
  { to: '/delivery/unassigned', label: 'Unassigned Parcels', icon: 'Inbox', badge: '19' },

  { section: 'PICKUP & RTO' },
  { to: '/delivery/pickups', label: 'Warehouse Pickups', icon: 'MapPin', badge: '32' },
  { to: '/delivery/manifests', label: 'Pickup Manifest Scans', icon: 'ScanLine' },
  { to: '/delivery/rto', label: 'Returns & RTO Inbound', icon: 'RotateCcw' },
  { to: '/delivery/hubs', label: 'Hub Transfers', icon: 'Warehouse' },

  { section: 'LAST-MILE DELIVERY' },
  { to: '/delivery/deliveries', label: 'All Shipments', icon: 'Truck' },
  { to: '/delivery/out', label: 'Out for Delivery', icon: 'Navigation', badge: '45' },
  { to: '/delivery/pod', label: 'Proof of Delivery', icon: 'ClipboardCheck' },
  { to: '/delivery/failures', label: 'Failed Delivery Logs', icon: 'AlertTriangle', badge: '7' },

  { section: 'FLEET MANAGEMENT' },
  { to: '/delivery/riders', label: 'Rider Directory', icon: 'Users' },
  { to: '/delivery/riders/onboarding', label: 'Rider Onboarding & KYC', icon: 'IdCard' },
  { to: '/delivery/attendance', label: 'Shift Attendance', icon: 'CalendarCheck' },
  { to: '/delivery/vehicle', label: 'Vehicle & Fuel Logs', icon: 'Car' },

  { section: 'COD SAFE & RECONCILIATION' },
  { to: '/delivery/cod/cash-turn-in', label: 'Rider Cash Turn-In', icon: 'Banknote', badge: '12' },
  { to: '/delivery/cod/vault', label: 'Hub Safe Deposit', icon: 'Vault' },
  { to: '/delivery/cod/escrow', label: 'Escrow Transfer', icon: 'ArrowLeftRight' },

  { section: 'ROUTING & SUPPORT' },
  { to: '/delivery/zones', label: 'Zones & Hubs', icon: 'Map' },
  { to: '/delivery/rates', label: 'Rate Cards & Slabs', icon: 'Weight' },
  { to: '/delivery/sos', label: 'Rider SOS Alerts', icon: 'Siren' },
]

export const DELIVERY_MOBILE_NAV = [
  { to: '/delivery', label: 'Home', icon: 'LayoutDashboard', end: true },
  { to: '/delivery/deliveries', label: 'Deliveries', icon: 'Truck' },
  { to: '/delivery/active', label: 'Active', icon: 'Navigation' },
  { to: '/delivery/earnings', label: 'Earnings', icon: 'TrendingUp' },
  { to: '/delivery/profile', label: 'Profile', icon: 'UserCircle' },
]

export const CUSTOMER_NAV = [
  { section: 'ORDERS' },
  { to: '/account', label: 'My Orders', icon: 'ShoppingBag', end: true },
  { to: '/account/orders/active', label: 'Active Order Tracking', icon: 'MapPin', badge: '1' },
  { to: '/account/returns', label: 'Returns & Exchanges', icon: 'RotateCcw' },
  { to: '/account/refunds', label: 'Refund Status', icon: 'Receipt' },

  { section: 'ASSETS & SAVINGS' },
  { to: '/account/wallet', label: 'My Wallet Balance', icon: 'Wallet' },
  { to: '/account/payments', label: 'Saved Payment Methods', icon: 'CreditCard' },
  { to: '/account/vouchers', label: 'My Discount Vouchers', icon: 'Ticket', badge: '3' },
  { to: '/account/rewards', label: 'Reward Points & Coins', icon: 'Coins' },

  { section: 'SHOPPING & LISTS' },
  { to: '/account/wishlist', label: 'My Wishlist', icon: 'Heart', badge: '14' },
  { to: '/account/stores', label: 'Followed Stores', icon: 'Store' },
  { to: '/account/buy-again', label: 'Buy Again', icon: 'RefreshCcw' },
  { to: '/account/recent', label: 'Recently Viewed', icon: 'History' },

  { section: 'COMMUNITY & FEEDBACK' },
  { to: '/account/reviews/pending', label: 'Pending Reviews', icon: 'Clock', badge: '2' },
  { to: '/account/reviews', label: 'My Reviews & Photos', icon: 'Star' },
  { to: '/account/qa', label: 'My Questions & Answers', icon: 'MessageSquare' },

  { section: 'ACCOUNT' },
  { to: '/account/profile', label: 'Personal Profile', icon: 'User' },
  { to: '/account/addresses', label: 'Delivery Address Book', icon: 'MapPin' },
  { to: '/account/security', label: 'Security & Password', icon: 'Lock' },
  { to: '/account/support', label: 'Support Tickets', icon: 'Headphones' },
]

export const CUSTOMER_MOBILE_NAV = [
  { to: '/account', label: 'Home', icon: 'LayoutDashboard', end: true },
  { to: '/account/wallet', label: 'Wallet', icon: 'Wallet' },
  { to: '/account/wishlist', label: 'Wishlist', icon: 'Heart' },
  { to: '/account/returns', label: 'Orders', icon: 'ShoppingBag' },
  { to: '/account/profile', label: 'Profile', icon: 'User' },
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
  { to: '/vendor/earnings', label: 'Earnings', icon: 'TrendingUp' },
  { to: '/vendor/profile', label: 'Profile', icon: 'UserCircle' },
]

export const ADMIN_NAV = [
  { section: 'OVERVIEW & ANALYTICS' },
  { to: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
  { to: '/admin/analytics/reports', label: 'Performance Reports', icon: 'FileBarChart' },

  { section: 'ORDER OPERATIONS' },
  { to: '/admin/orders', label: 'All Orders', icon: 'ShoppingBag', badge: '128' },
  { to: '/admin/orders/returns', label: 'Returns & Exchanges', icon: 'RotateCcw', badge: '16' },
  { to: '/admin/orders/refunds', label: 'Refunds Management', icon: 'Receipt' },

  { section: 'CATALOG & CURATION' },
  { to: '/admin/marketplace/products', label: 'All Products', icon: 'Package' },
  { to: '/admin/marketplace/categories', label: 'Categories & Tax', icon: 'FolderTree' },
  { to: '/admin/marketplace/brands', label: 'Brands & Authorizations', icon: 'Award' },
  { to: '/admin/marketplace/reviews', label: 'Reviews & Q&A', icon: 'Star' },

  { section: 'MARKETPLACE & VENDORS' },
  { to: '/admin/marketplace/vendors', label: 'All Sellers (1,284)', icon: 'Store' },
  { to: '/admin/marketplace/kyc', label: 'Seller Applications', icon: 'UserPlus', badge: '42' },
  { to: '/admin/marketplace/stores', label: 'Storefronts', icon: 'Building2' },
  { to: '/admin/marketplace/tiers', label: 'Seller Tiers & Badges', icon: 'Medal' },
  { to: '/admin/marketplace/bulletins', label: 'Seller Inquiries & Bulletins', icon: 'Megaphone' },

  { section: 'CUSTOMERS & CRM' },
  { to: '/admin/customers', label: 'Customer Directory', icon: 'Users' },
  { to: '/admin/customers/segments', label: 'Customer Segments', icon: 'Layers' },
  { to: '/admin/customers/support', label: 'Support Desk', icon: 'Headphones', badge: '5' },
  { to: '/admin/customers/wallets', label: 'Customer Wallets', icon: 'Wallet' },

  { section: 'LOGISTICS & FLEET' },
  { to: '/admin/fulfillment/partners', label: '3PL Delivery Partners', icon: 'Truck' },
  { to: '/admin/fulfillment/assignments', label: 'Order Assignments', icon: 'Send' },
  { to: '/admin/fulfillment/zones', label: 'Shipping Zones & Rates', icon: 'MapPin' },
  { to: '/admin/fulfillment/cod', label: 'COD Reconciliation', icon: 'Banknote', badge: '14' },

  { section: 'FINANCE & PAYOUTS' },
  { to: '/admin/finance/payments', label: 'Transaction Ledger', icon: 'CreditCard' },
  { to: '/admin/finance/commissions', label: 'Commission Rules', icon: 'Percent' },
  { to: '/admin/finance/wallets', label: 'Vendor Wallets', icon: 'Wallet' },
  { to: '/admin/finance/payouts', label: 'Payout Requests', icon: 'Banknote', badge: '5' },
  { to: '/admin/finance/settlements', label: 'Settlements', icon: 'FileSpreadsheet' },
  { to: '/admin/finance/invoices', label: 'Platform Invoices', icon: 'FileText' },
  { to: '/admin/finance/tax', label: 'Tax & VAT Reports', icon: 'Percent' },

  { section: 'MARKETING & CMS' },
  { to: '/admin/marketing/campaigns', label: 'Mega Campaigns', icon: 'Megaphone', badge: '2' },
  { to: '/admin/marketing/nominations', label: 'Product Nominations', icon: 'Gift' },
  { to: '/admin/marketing/coupons', label: 'Coupons & Vouchers', icon: 'Ticket' },
  { to: '/admin/marketing/banners', label: 'Banners & Sliders', icon: 'Image' },
  { to: '/admin/marketing/pages', label: 'CMS Pages & Policies', icon: 'FileText' },

  { section: 'SYSTEM & GOVERNANCE' },
  { to: '/admin/system/settings', label: 'General Settings', icon: 'Settings' },
  { to: '/admin/system/gateways', label: 'Payment Gateways', icon: 'CreditCard' },
  { to: '/admin/system/users', label: 'Admin Users & Staff', icon: 'Shield' },
  { to: '/admin/system/roles', label: 'Roles & Permissions', icon: 'KeyRound' },
  { to: '/admin/system/audit-logs', label: 'Audit Trail', icon: 'ScrollText' },
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
