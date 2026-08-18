import { Routes, Route, Navigate } from 'react-router-dom'
import CustomerHeader from './components/layout/CustomerHeader'
import CustomerFooter from './components/layout/CustomerFooter'
import DashboardLayout from './components/layout/DashboardLayout'
import { AuthRoute, GuestRoute, VendorRoute, AdminRoute, DeliveryRoute } from './components/layout/RouteGuards'
import { VENDOR_NAV, ADMIN_NAV } from './utils/constants'

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
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductDetail from './pages/admin/AdminProductDetail'
import AdminCategories from './pages/admin/AdminCategories'
import AdminBrands from './pages/admin/AdminBrands'
import AdminBrandRequests from './pages/admin/AdminBrandRequests'
import AdminReviews from './pages/admin/AdminReviews'
import AdminCustomers from './pages/admin/AdminCustomers'
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
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<CustomerLayout />} />

      {/* Vendor Portal */}
      <Route path="/vendor" element={<VendorRoute><DashboardLayout nav={VENDOR_NAV} title="Vendor Panel" roleLabel="Vendor" /></VendorRoute>}>
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
      <Route path="/admin" element={<AdminRoute><DashboardLayout nav={ADMIN_NAV} title="Admin Panel" roleLabel="Admin" /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />

        {/* Commerce */}
        <Route path="orders" element={<AdminOrders />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/:id" element={<AdminProductDetail />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="brands" element={<AdminBrands />} />
        <Route path="brand-requests" element={<AdminBrandRequests />} />
        <Route path="reviews" element={<AdminReviews />} />

        {/* Users */}
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="vendors/:id" element={<AdminVendorDetail />} />
        <Route path="users" element={<AdminUsers />} />

        {/* Finance */}
        <Route path="payments" element={<AdminPayments />} />
        <Route path="commissions" element={<AdminCommissions />} />
        <Route path="wallets" element={<AdminWallets />} />
        <Route path="wallet" element={<AdminWallets />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="settlements" element={<AdminSettlements />} />
        <Route path="refunds" element={<AdminRefunds />} />

        {/* Operations */}
        <Route path="shipping" element={<AdminShipping />} />
        <Route path="deliveries" element={<AdminDeliveries />} />
        <Route path="delivery-partners" element={<AdminDeliveryPartners />} />
        <Route path="support" element={<AdminSupport />} />

        {/* Marketing */}
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="promotions" element={<AdminPromotions />} />
        <Route path="notifications" element={<AdminNotifications />} />

        {/* Analytics */}
        <Route path="analytics" element={<AdminAnalytics />} />

        {/* System */}
        <Route path="roles" element={<AdminRoles />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
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
