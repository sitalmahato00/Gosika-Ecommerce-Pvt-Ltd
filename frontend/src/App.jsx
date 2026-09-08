import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import CustomerHeader from './components/layout/CustomerHeader'
import CustomerFooter from './components/layout/CustomerFooter'
import CustomerBottomNav from './components/layout/CustomerBottomNav'
import DashboardLayout from './components/layout/DashboardLayout'
import { AuthRoute, GuestRoute, VendorRoute, AdminRoute, DeliveryRoute } from './components/layout/RouteGuards'
import { VENDOR_NAV, ADMIN_NAV, VENDOR_MOBILE_NAV, ADMIN_MOBILE_NAV } from './utils/constants'

import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Store from './pages/Store'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import PaymentCallback from './pages/PaymentCallback'
import OrderList from './pages/OrderList'
import OrderDetail from './pages/OrderDetail'
import Wishlist from './pages/Wishlist'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SocialAuth from './pages/SocialAuth'
import Help from './pages/Help'
import NotFound from './pages/NotFound'

import CategoryPage from './pages/Public/CategoryPage'
import BrandPage from './pages/Public/BrandPage'
import DealsPage from './pages/Public/DealsPage'
import SearchPage from './pages/Public/SearchPage'

import AccountLayout from './pages/account/AccountLayout'
import AccountDashboard from './pages/account/AccountDashboard'
import AccountProfile from './pages/account/AccountProfile'
import AccountAddresses from './pages/account/AccountAddresses'
import AccountPayments from './pages/account/AccountPayments'
import AccountReturns from './pages/account/Returns'
import AccountSupport from './pages/account/AccountSupport'

import VendorRegister from './pages/vendor/VendorRegister'
import VendorDashboard from './pages/vendor/VendorDashboard'
import VendorOrders from './pages/vendor/VendorOrders'
import VendorOrderDetail from './pages/vendor/VendorOrderDetail'
import VendorProducts from './pages/vendor/VendorProducts'
import VendorProductForm from './pages/vendor/VendorProductForm'
import VendorWallet from './pages/vendor/VendorWallet'
import VendorPayouts from './pages/vendor/VendorPayouts'
import VendorSettlements from './pages/vendor/VendorSettlements'
import VendorStores from './pages/vendor/VendorStores'
import VendorStoreEdit from './pages/vendor/VendorStoreEdit'
import VendorBankAccounts from './pages/vendor/VendorBankAccounts'
import VendorBrandRequests from './pages/vendor/VendorBrandRequests'
import VendorProfile from './pages/vendor/VendorProfile'

import VendorInventory from './pages/vendor/Inventory'
import VendorReviews from './pages/vendor/Reviews'
import VendorDiscounts from './pages/vendor/Discounts'
import VendorPromotions from './pages/vendor/Promotions'
import VendorAnalytics from './pages/vendor/Analytics'
import VendorStoreSettings from './pages/vendor/StoreSettings'
import VendorReturns from './pages/vendor/Returns'
import VendorEarnings from './pages/vendor/Earnings'
import VendorCommission from './pages/vendor/Commission'
import VendorTransactions from './pages/vendor/Transactions'
import VendorCoupons from './pages/vendor/Coupons'
import VendorNotifications from './pages/vendor/Notifications'
import VendorSupport from './pages/vendor/Support'
import VendorNewTicket from './pages/vendor/VendorNewTicket'
import VendorSecurity from './pages/vendor/Security'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminReturns from './pages/admin/AdminReturns'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductDetail from './pages/admin/AdminProductDetail'
import AdminKyc from './pages/admin/AdminKyc'
import AdminStores from './pages/admin/AdminStores'
import AdminCategories from './pages/admin/AdminCategories'
import AdminBrands from './pages/admin/AdminBrands'
import AdminBrandRequests from './pages/admin/AdminBrandRequests'
import AdminReviews from './pages/admin/AdminReviews'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminCustomerSupport from './pages/admin/AdminCustomerSupport'
import AdminVendors from './pages/admin/AdminVendors'
import AdminVendorDetail from './pages/admin/AdminVendorDetail'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPayments from './pages/admin/AdminPayments'
import AdminCommissions from './pages/admin/AdminCommissions'
import AdminWallets from './pages/admin/AdminWallets'
import AdminPayouts from './pages/admin/AdminPayouts'
import AdminSettlements from './pages/admin/AdminSettlements'
import AdminRefunds from './pages/admin/AdminRefunds'
import AdminShipping from './pages/admin/AdminShipping'
import AdminDeliveries from './pages/admin/AdminDeliveries'
import AdminDeliveryPartners from './pages/admin/AdminDeliveryPartners'
import AdminSupport from './pages/admin/AdminSupport'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminPromotions from './pages/admin/AdminPromotions'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminRoles from './pages/admin/AdminRoles'
import AdminSettings from './pages/admin/AdminSettings'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'

import DeliveryLayout from './components/layout/DeliveryLayout'
import DeliveryDashboard from './pages/delivery/DeliveryDashboard'
import DeliveryDeliveries from './pages/delivery/DeliveryDeliveries'
import DeliveryDetail from './pages/delivery/DeliveryDetail'
import DeliveryPickup from './pages/delivery/DeliveryPickup'
import DeliveryDeliver from './pages/delivery/DeliveryDeliver'
import DeliveryFailure from './pages/delivery/DeliveryFailure'
import DeliveryActiveRoute from './pages/delivery/DeliveryActiveRoute'
import DeliveryHistory from './pages/delivery/DeliveryHistory'
import DeliveryEarnings from './pages/delivery/DeliveryEarnings'
import DeliveryTransactions from './pages/delivery/DeliveryTransactions'
import DeliveryCodLedger from './pages/delivery/DeliveryCodLedger'
import DeliveryNotifications from './pages/delivery/DeliveryNotifications'
import DeliveryProfile from './pages/delivery/DeliveryProfile'
import DeliveryVehicle from './pages/delivery/DeliveryVehicle'
import DeliverySettings from './pages/delivery/DeliverySettings'
import DeliverySupport from './pages/delivery/DeliverySupport'

function CustomerLayout() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <CustomerHeader />
      <main className="flex-1" style={{ display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/store/:id" element={<Store />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<AuthRoute><Wishlist /></AuthRoute>} />
          <Route path="/checkout" element={<AuthRoute><Checkout /></AuthRoute>} />
          <Route path="/order-success" element={<AuthRoute><OrderSuccess /></AuthRoute>} />
          <Route path="/payments/esewa/callback" element={<PaymentCallback />} />
          <Route path="/orders" element={<AuthRoute><OrderList /></AuthRoute>} />
          <Route path="/orders/:id" element={<AuthRoute><OrderDetail /></AuthRoute>} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/brand/:brand" element={<BrandPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/help" element={<Help />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/verify" element={<GuestRoute><Verify /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
          <Route path="/social-auth" element={<SocialAuth />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/account" element={<AuthRoute><AccountLayout /></AuthRoute>}>
            <Route index element={<AccountDashboard />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="payments" element={<AccountPayments />} />
            <Route path="returns" element={<AccountReturns />} />
            <Route path="support" element={<AccountSupport />} />
            <Route path="orders" element={<Navigate to="/orders" replace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <CustomerFooter />
      <CustomerBottomNav onSearchClick={() => navigate('/search')} />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<CustomerLayout />} />

      {/* Vendor Portal */}
      <Route path="/vendor" element={<VendorRoute><DashboardLayout nav={VENDOR_NAV} title="Vendor Panel" roleLabel="Vendor" mobileNav={VENDOR_MOBILE_NAV} /></VendorRoute>}>
        <Route index element={<VendorDashboard />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="orders/:id" element={<VendorOrderDetail />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="products/new" element={<VendorProductForm />} />
        <Route path="products/:id/edit" element={<VendorProductForm />} />
        <Route path="inventory" element={<VendorInventory />} />
        <Route path="reviews" element={<VendorReviews />} />
        <Route path="discounts" element={<VendorDiscounts />} />
        <Route path="coupons" element={<VendorCoupons />} />
        <Route path="promotions" element={<VendorPromotions />} />
        <Route path="analytics" element={<VendorAnalytics />} />
        <Route path="wallet" element={<VendorWallet />} />
        <Route path="earnings" element={<VendorEarnings />} />
        <Route path="commission" element={<VendorCommission />} />
        <Route path="transactions" element={<VendorTransactions />} />
        <Route path="returns" element={<VendorReturns />} />
        <Route path="store-settings" element={<VendorStoreSettings />} />
        <Route path="notifications" element={<VendorNotifications />} />
        <Route path="support" element={<VendorSupport />} />
        <Route path="support/new" element={<VendorNewTicket />} />
        <Route path="security" element={<VendorSecurity />} />
        <Route path="payouts" element={<VendorPayouts />} />
        <Route path="settlements" element={<VendorSettlements />} />
        <Route path="stores" element={<VendorStores />} />
        <Route path="stores/edit" element={<VendorStoreEdit />} />
        <Route path="stores/:id/edit" element={<VendorStoreEdit />} />
        <Route path="store/edit" element={<VendorStoreEdit />} />
        <Route path="bank-accounts" element={<VendorBankAccounts />} />
        <Route path="brand-requests" element={<VendorBrandRequests />} />
        <Route path="profile" element={<VendorProfile />} />
      </Route>

      {/* Admin Panel */}
      <Route path="/admin" element={<AdminRoute><DashboardLayout nav={ADMIN_NAV} title="Admin Panel" roleLabel="Admin" mobileNav={ADMIN_MOBILE_NAV} /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />

        {/* Marketplace */}
        <Route path="marketplace/vendors" element={<AdminVendors />} />
        <Route path="marketplace/vendors/:id" element={<AdminVendorDetail />} />
        <Route path="marketplace/kyc" element={<AdminKyc />} />
        <Route path="marketplace/stores" element={<AdminStores />} />
        <Route path="marketplace/products" element={<AdminProducts />} />
        <Route path="marketplace/products/:id" element={<AdminProductDetail />} />
        <Route path="marketplace/categories" element={<AdminCategories />} />
        <Route path="marketplace/brands" element={<AdminBrands />} />
        <Route path="marketplace/brands/requests" element={<AdminBrandRequests />} />
        <Route path="marketplace/reviews" element={<AdminReviews />} />

        {/* Orders & Service */}
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="orders/returns" element={<AdminReturns />} />
        <Route path="orders/refunds" element={<AdminRefunds />} />

        {/* Fulfillment */}
        <Route path="fulfillment/partners" element={<AdminDeliveryPartners />} />
        <Route path="fulfillment/assignments" element={<AdminDeliveries />} />
        <Route path="fulfillment/zones" element={<AdminShipping />} />

        {/* Finance & Ledger */}
        <Route path="finance/payments" element={<AdminPayments />} />
        <Route path="finance/commissions" element={<AdminCommissions />} />
        <Route path="finance/wallets" element={<AdminWallets />} />
        <Route path="finance/settlements" element={<AdminSettlements />} />
        <Route path="finance/payouts" element={<AdminPayouts />} />

        {/* Customers */}
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="customers/support" element={<AdminCustomerSupport />} />

        {/* Marketing */}
        <Route path="marketing/promotions" element={<AdminPromotions />} />
        <Route path="marketing/coupons" element={<AdminCoupons />} />
        <Route path="marketing/banners" element={<AdminPromotions />} />

        {/* Analytics */}
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="analytics/sales" element={<AdminAnalytics />} />
        <Route path="analytics/vendors" element={<AdminAnalytics />} />
        <Route path="analytics/customers" element={<AdminAnalytics />} />
        <Route path="analytics/products" element={<AdminAnalytics />} />

        {/* System & Security */}
        <Route path="system/notifications" element={<AdminNotifications />} />
        <Route path="system/users" element={<AdminUsers />} />
        <Route path="system/roles" element={<AdminRoles />} />
        <Route path="system/audit-logs" element={<AdminAuditLogs />} />
        <Route path="system/settings" element={<AdminSettings />} />

        {/* Backward-Compatible Redirects */}
        <Route path="vendors" element={<Navigate to="/admin/marketplace/vendors" replace />} />
        <Route path="vendors/:id" element={<Navigate to="/admin/marketplace/vendors" replace />} />
        <Route path="kyc" element={<Navigate to="/admin/marketplace/kyc" replace />} />
        <Route path="stores" element={<Navigate to="/admin/marketplace/stores" replace />} />
        <Route path="products" element={<Navigate to="/admin/marketplace/products" replace />} />
        <Route path="products/:id" element={<Navigate to="/admin/marketplace/products" replace />} />
        <Route path="categories" element={<Navigate to="/admin/marketplace/categories" replace />} />
        <Route path="brands" element={<Navigate to="/admin/marketplace/brands" replace />} />
        <Route path="brand-requests" element={<Navigate to="/admin/marketplace/brands/requests" replace />} />
        <Route path="reviews" element={<Navigate to="/admin/marketplace/reviews" replace />} />
        <Route path="returns" element={<Navigate to="/admin/orders/returns" replace />} />
        <Route path="refunds" element={<Navigate to="/admin/orders/refunds" replace />} />
        <Route path="shipping" element={<Navigate to="/admin/fulfillment/zones" replace />} />
        <Route path="deliveries" element={<Navigate to="/admin/fulfillment/assignments" replace />} />
        <Route path="delivery-partners" element={<Navigate to="/admin/fulfillment/partners" replace />} />
        <Route path="payments" element={<Navigate to="/admin/finance/payments" replace />} />
        <Route path="commissions" element={<Navigate to="/admin/finance/commissions" replace />} />
        <Route path="wallets" element={<Navigate to="/admin/finance/wallets" replace />} />
        <Route path="wallet" element={<Navigate to="/admin/finance/wallets" replace />} />
        <Route path="payouts" element={<Navigate to="/admin/finance/payouts" replace />} />
        <Route path="settlements" element={<Navigate to="/admin/finance/settlements" replace />} />
        <Route path="coupons" element={<Navigate to="/admin/marketing/coupons" replace />} />
        <Route path="promotions" element={<Navigate to="/admin/marketing/promotions" replace />} />
        <Route path="banners" element={<Navigate to="/admin/marketing/banners" replace />} />
        <Route path="support" element={<Navigate to="/admin/customers/support" replace />} />
        <Route path="users" element={<Navigate to="/admin/system/users" replace />} />
        <Route path="roles" element={<Navigate to="/admin/system/roles" replace />} />
        <Route path="audit-logs" element={<Navigate to="/admin/system/audit-logs" replace />} />
        <Route path="settings" element={<Navigate to="/admin/system/settings" replace />} />
        <Route path="notifications" element={<Navigate to="/admin/system/notifications" replace />} />
      </Route>

      {/* Delivery Partner Portal */}
      <Route path="/delivery" element={<DeliveryRoute><DeliveryLayout /></DeliveryRoute>}>
        <Route index element={<DeliveryDashboard />} />
        <Route path="deliveries" element={<DeliveryDeliveries />} />
        <Route path="deliveries/:id" element={<DeliveryDetail />} />
        <Route path="deliveries/:id/pickup" element={<DeliveryPickup />} />
        <Route path="deliveries/:id/deliver" element={<DeliveryDeliver />} />
        <Route path="deliveries/:id/failure" element={<DeliveryFailure />} />
        <Route path="active" element={<DeliveryActiveRoute />} />
        <Route path="history" element={<DeliveryHistory />} />
        <Route path="earnings" element={<DeliveryEarnings />} />
        <Route path="transactions" element={<DeliveryTransactions />} />
        <Route path="cod-collection" element={<DeliveryCodLedger />} />
        <Route path="notifications" element={<DeliveryNotifications />} />
        <Route path="profile" element={<DeliveryProfile />} />
        <Route path="vehicle" element={<DeliveryVehicle />} />
        <Route path="settings" element={<DeliverySettings />} />
        <Route path="support" element={<DeliverySupport />} />
      </Route>
    </Routes>
  )
}
