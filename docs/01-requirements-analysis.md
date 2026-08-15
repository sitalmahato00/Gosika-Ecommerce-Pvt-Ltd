# GOSIKA Commerce — Requirements Analysis & Decisions

Source docs (official, read fully before building; sole source of truth):
- `D:\Gosika Pvt. Ltd\GOSIKA E-Commercce.docx` — SRS v1.0, GOSIKA Technologies Pvt. Ltd.
- `D:\Gosika Pvt. Ltd\GOSIKA_Payment_Settlement_Specification_Formatted.docx` — Payment & Settlement Spec v1.0
- Extracted text: `C:\Users\user\AppData\Local\Temp\opencode\gosika_docs\main.txt` (SRS), `...\payment.txt` (Payment spec)

## Product
Multi-tenant, multi-vendor marketplace SaaS. Currency NPR. Launch market: Koshi Province, Nepal; roadmap to nationwide Nepal.
Platform roles: Super Admin, Vendor Admin, Delivery Partner, Customer.

## Resolved decisions (whenever SRS and instructions conflict)
| Topic | SRS says | Decision |
|---|---|---|
| Database | PostgreSQL (§10.14) vs MySQL (§11.3/§18.4) | **MySQL 8.4 LTS** |
| Frontend | Inertia.js | **React SPA** (Vite + React Router + Axios) |
| Payments Phase 1 | Khalti/eSewa/COD (§8.11/§8.14 conflict) | **Khalti + COD**; eSewa + Fonepay in Phase 2 |
| API envelope | `{success,message,data,errors}` vs `{data,meta,message}` | unified `{success, message, data, meta, errors}` |
| Architecture | not specified | Laravel 12 modular monolith + shared DB + single business-logic layer |

## Assumptions (docs silent — flagged for client confirmation)
- Default commission **10%**; configurable. Commission precedence **product > category > vendor > global**, resolved & frozen at order finalization.
- Return period **7 days**, configurable. Delivery charges configurable (flat + free-delivery threshold). COD rules configurable.
- Money stored `DECIMAL(12,2)`, never float; NPR has no decimal subunit in UI (paisa for provider APIs).
- Settlement eligibility after delivery confirmation + return window expiry.

## Modules (17)
Shared, Identity, Platform, Vendor, Catalog, Marketplace, Cart, Checkout, Order, Payment, Wallet, Shipping, Customer, Marketing, Analytics, Support, Administration.

## Key state machines
- **Order** (parent): pending → payment_pending → confirmed → processing → completed; alt: cancelled, failed, refunded, returned.
- **Vendor order**: pending → accepted/rejected → preparing → ready_for_pickup → picked_up → out_for_delivery → delivered → completed; alt: cancelled, returned, refunded.
- **Payment**: initiated → processing → verification → paid | failed | cancelled | expired | timeout | exception; post-payment: refunded, partially_refunded.
- **Refund**: requested → approved → processing → refunded; alt failed, cancelled.
- **Settlement**: pending → eligible → processing → paid; alt: failed, on_hold, reversed.
- **Vendor**: pending → under_review → approved | rejected | suspended | inactive.
- **Product**: draft → pending_review → published | hidden | archived; stock: in_stock/low_stock/out_of_stock.

## Financial invariants
- Escrow: payment held until delivery + return window; commission deducted; net credited to vendor wallet.
- Reconciliation: Provider Transaction == GOSIKA Payment Transaction (1:1).
- Immutable wallet ledger: every entry records balance_before/balance_after; optimistic-lock `version` column.
- `Vendor Payable = Eligible Sales − Commission − Adjustments`.
- Never trust client-supplied price/discount/status; idempotency + DB transactions for orders/payments/inventory/wallet/refunds.

## Rate limits
public 60/min, auth 120/min, login 10/min, password 5/15min, OTP 5/10min, payment 30/min, admin 300/min, upload 20/min.
