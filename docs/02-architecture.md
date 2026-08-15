# GOSIKA Commerce — Architecture

## Stack
- Backend: Laravel 12 (PHP 8.2), modular monolith
- DB: MySQL 8.4 (utf8mb4, InnoDB), single schema `gosika_ecommerce`
- Auth: Sanctum (bearer tokens, SPA-stateful enabled), Spatie roles/permissions
- Admin: Filament 3 (Phase 18)
- Frontend: React SPA (Phase 20)

## Module layout
```
app/Modules/{Module}/
  Domain/          enums, DTO-free domain constants, exceptions, value logic
  Application/     services (use cases), DataTransferObjects
  Infrastructure/  Eloquent models, persistence, external services
  Presentation/    Http Controllers, FormRequests, Resources
  Providers/       {Module}ServiceProvider  (routes + DI registration)
  Routes/          api.php  (web.php if needed)
```

Registered providers in `bootstrap/providers.php`.

## Shared infrastructure (app/Modules/Shared)
- `Domain/Enums/*` — 25 status enums (backed strings)
- `Infrastructure/Models/BaseModel` — HasUuid + Blameable base
- `Infrastructure/Traits/HasUuid`, `Blameable`
- `Domain/Exceptions/` — DomainException, PaymentException, InsufficientStockException
- `Infrastructure/Services/` — Money (NPR), ReferenceNumber generators
- `Presentation/Http/Response` — unified envelope
- `Providers/SharedServiceProvider` — singleton services + named rate limiters

## API conventions
- Base path `/api/v1`
- Envelope: `{success, message, data, meta}` (+ `errors` on 4xx)
- Public IDs: UUID; DB PKs internal
- Auth: `Authorization: Bearer <token>` (Sanctum); 401/403/429 handled globally in `bootstrap/app.php`
- Validation errors → 422 with `errors` map

## Modules → API prefix
| Module | Prefix | Status |
|---|---|---|
| Identity | `/api/v1/auth`, `/api/v1/users` | Implemented (auth) |
| Platform | `/api/v1/platform` | Seeder done; API pending |
| Vendor | `/api/v1/vendor` | pending |
| Catalog | `/api/v1/products`, `/api/v1/categories` | pending |
| Marketplace | `/api/v1/marketplace` | pending |
| Cart | `/api/v1/cart` | pending |
| Checkout | `/api/v1/checkout` | pending |
| Order | `/api/v1/orders` | pending |
| Payment | `/api/v1/payments` | pending |
| Wallet | `/api/v1/wallet` | pending |
| Shipping | `/api/v1/shipping` | pending |
| Customer | `/api/v1/customer` | pending |
| Marketing | `/api/v1/marketing` | pending |
| Analytics | `/api/v1/analytics` | pending |
| Support | `/api/v1/support` | pending |
| Administration | `/api/v1/admin` | pending |

## Database (72 tables)
Identity: users, password_reset_tokens, sessions, permissions/roles (spatie)
Platform: settings, countries, provinces, districts, municipalities
Vendor: vendors, vendor_kycs, vendor_documents, stores, store_addresses, store_operating_hours, bank_accounts
Catalog: categories, brands, brand_requests, products, product_images, product_variants, product_attributes, product_attribute_values
Customer: customer_profiles, customer_addresses
Marketplace: wishlists, wishlist_items, recently_viewed, product_reviews, store_reviews
Cart/Checkout: carts, cart_items, checkout_sessions
Order: orders, vendor_orders, order_items, order_status_history, return_requests
Payment: payments, payment_attempts, payment_status_history, refunds, reconciliation_records
Wallet: vendor_wallets, wallet_transactions, commissions, settlements, payout_requests, payout_records
Shipping: delivery_partners, delivery_assignments, delivery_tracking
Marketing: coupons, coupon_redemptions
Admin: audit_logs, activity_logs
Content: notification_templates, banners
Support: support_tickets, ticket_messages

Migration order respects FK dependencies: users → platform → vendor → catalog → customer → cart → checkout → order → marketplace → payment → wallet → shipping → marketing → admin → content → support.

## Seeders
- RolePermissionSeeder (4 roles, 41 permissions)
- NepalGeoSchemaSeeder (1 country, 7 provinces, 77 districts, 208 major municipalities)
- DatabaseSeeder: super admin + demo customer
