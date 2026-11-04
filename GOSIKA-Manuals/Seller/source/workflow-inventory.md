# GOSIKA Seller Portal – Workflow Inventory (Sidebar-Synchronized)
# Phase 1 Documentation Status: COMPLETED

This manual is synchronized **strictly with the live Seller Portal sidebar navigation** (`VENDOR_NAV`).

## 1. Sidebar Sections & Documented Workflows

| Section | Feature / Screen | Route | Documented Procedure | Screenshots Embedded | Status |
|:---|:---|:---|:---|:---|:---:|
| **Entry** | Seller Login | `/seller/login` | Accessing the Seller Portal | `01-seller-login-page.png`<br/>`01b-login-form-filled.png` | Complete |
| **Entry** | Navigation Menu | `/vendor/*` | Using the Responsive Sidebar | `03-sidebar-navigation.png` | Complete |
| **STORE** | Dashboard | `/vendor` | Reviewing Store KPIs & Metrics | `02-seller-dashboard.png` | Complete |
| **STORE** | Store Profile | `/vendor/store/edit` | Managing Logo, Banner & Bio | `05-store-profile.png`<br/>`06-store-edit.png` | Complete |
| **STORE** | Store Settings | `/vendor/store-settings` | Configuring Operational Policies | `07-store-settings.png` | Complete |
| **ORDERS** | All Orders | `/vendor/orders` | Searching & Filtering Orders | `16-all-orders.png`<br/>`17-order-filters.png` | Complete |
| **ORDERS** | Order Details | `/vendor/orders/{id}` | Auditing Customer Order Items | `18-order-detail.png` | Complete |
| **ORDERS** | To Ship | `/vendor/orders/ready` | Packing & Preparing Pickups | `20b-orders-to-ship.png` | Complete |
| **ORDERS** | Shipped | `/vendor/orders/shipped` | Tracking In-Transit Courier Dispatches | `21b-orders-shipped.png` | Complete |
| **ORDERS** | Returns & Issues | `/vendor/returns` | Handling Customer Claims, Inspections & Resolutions (9-Step Process) | `22-returns-issues.png` | Complete |
| **PRODUCTS** | My Products | `/vendor/products` | Managing Product Listings | `08-my-products.png`<br/>`09-product-filters.png` | Complete |
| **PRODUCTS** | Add Product | `/vendor/products/new` | Creating New Marketplace Listing | `10-add-product-form-top.png`<br/>`11-add-product-form-mid.png`<br/>`12-add-product-form-bottom.png` | Complete |
| **PRODUCTS** | Edit Product | `/vendor/products/{id}/edit` | Modifying Product Details | `13-product-edit.png` | Complete |
| **PRODUCTS** | Approval Status | `/vendor/products/approval` | Tracking Admin Review Queue | `09b-product-approval.png` | Complete |
| **PRODUCTS** | Low Stock | `/vendor/inventory/low-stock` | Replenishing Critical Stock | `15-low-stock.png` | Complete |
| **PRODUCTS** | Reviews & Q&A | `/vendor/reviews` | Managing Ratings & Buyer Inquiries | `23-reviews-qa.png` | Complete |
| **PROMOTIONS** | Campaigns | `/vendor/promotions` | Enrolling in Marketplace Sales Events | `26-promotions-campaigns.png` | Complete |
| **PROMOTIONS** | Vouchers | `/vendor/coupons` | Creating Custom Discount Codes | `25-coupons-vouchers.png` | Complete |
| **FINANCE** | Wallet | `/vendor/wallet` | Tracking Available & Escrow Funds | `27-wallet.png` | Complete |
| **FINANCE** | Payouts | `/vendor/payouts` | Requesting Bank Wire Withdrawals | `29-payouts.png` | Complete |
| **FINANCE** | Settlements | `/vendor/settlements` | Reviewing Net Payout Calculations | `30-settlements.png` | Complete |
| **SHIPPING** | Pickup Locations | `/vendor/shipping` | Registering Warehouse Dispatch Hubs | `34-pickup-locations.png` | Complete |
| **SHIPPING** | Shipping Labels | `/vendor/shipping/labels` | Bulk Printing Scannable Waybills | `35-shipping-labels.png` | Complete |
| **ACCOUNT** | Profile | `/vendor/profile` | Managing Account Contact Info | `36-vendor-profile.png` | Complete |
| **ACCOUNT** | KYC Verification | `/vendor/verification` | Submitting Business Identity Documents | `38-kyc-verification.png` | Complete |
| **ACCOUNT** | Bank Account | `/vendor/bank-accounts` | Linking Verified Settlement Accounts | `39-bank-accounts.png` | Complete |
| **ACCOUNT** | Security | `/vendor/security` | Updating Authentication Password | `37-security.png` | Complete |
| **ACCOUNT** | Notifications | `/vendor/notifications` | Monitoring System Alerts & Prefs | `04-notifications.png`<br/>`40-notification-prefs.png` | Complete |
| **ACCOUNT** | Support | `/vendor/support` | Helpdesk Tickets & Inquiry Creation | `41-support.png`<br/>`42-new-support-ticket.png` | Complete |

## 2. Project File Locations

The generated 38-page Phase 1 PDF manual is synchronized and saved in three locations in the project:
1. `D:\Gosika Pvt. Ltd\Gosika Ecommerce\GOSIKA-Manuals\Seller\GOSIKA-Seller-User-Manual-Phase-1.pdf` (Manuals workspace)
2. `D:\Gosika Pvt. Ltd\Gosika Ecommerce\manuals\vendor\GOSIKA-Seller-User-Manual-Phase-1.pdf` (Internal vendor documentation)
3. `D:\Gosika Pvt. Ltd\Gosika Ecommerce\public\manuals\GOSIKA-Seller-User-Manual-Phase-1.pdf` (Public web download asset)

## 3. Standard Operating Procedure: Returns, Exchanges & Refunds (9-Step Lifecycle)

All marketplace returns follow this strict 9-step governance pipeline:

1. **Customer Request Initiation:** Customer opens *My Orders* on any delivered parcel and selects *Return / Exchange / Refund*.
2. **Product & Type Selection:** Customer selects item(s) and request category:
   - *Return & Refund* (monetary reimbursement)
   - *Exchange for another product* (alternate size/variant)
   - *Replacement* (defective or damaged item exchange)
3. **Request Evidence & Details:** Customer inputs reason, narrative, attaches photo/video proof, and selects return pickup method.
4. **Automated Eligibility Check:** System validates 7-day return window, non-returnable categories, and product condition criteria.
5. **Seller Review & Dispute Management:** Seller audits evidence under `/vendor/returns`, approves with pickup instructions or rejects with reason. Admin oversight available for disputes.
6. **Logistics & Tracking Generation:** System assigns unique return reference (`RTN-XXXXXXXX`) and dispatches pickup task to courier/delivery network.
7. **Delivery Collection & Seller Physical Inspection:** Delivery rider collects parcel (`/delivery/returns`), vendor receives item, logs received condition (`good`, `defective`, `damaged`, `missing_parts`), photos, and audit result.
8. **Resolution Execution:**
   - *Exchange/Replacement:* Seller dispatches replacement unit with tracking code.
   - *Refund:* Admin/finance releases refund with transaction reference; vendor ledger adjusted.
9. **Closure & Audit Trail:** Case marked resolved, real-time alerts dispatched to customer, and full event timeline recorded.
