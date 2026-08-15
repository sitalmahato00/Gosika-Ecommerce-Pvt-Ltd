# GOSIKA Commerce — Implementation Checklist

Legend: [x] done, [~] in progress, [ ] pending

## Phase 1 — Scaffold, modules, schema
- [x] Laravel 12 scaffolded; sanctum + spatie/laravel-permission installed
- [x] Modular skeleton (17 modules × Application/Domain/Infrastructure/Presentation/Providers/Routes)
- [x] Shared infra: 25 enums, BaseModel, HasUuid, Blameable, Response envelope, exceptions, Money/ReferenceNumber, rate limiters
- [x] API exception handling + envelope in `bootstrap/app.php`
- [x] Full schema migrations (72 tables) migrated on MySQL 8.4
- [~] Eloquent models per module (Identity done; others pending)

## Phase 2 — Identity
- [x] User model (module), factory, auth config switched
- [x] Roles + permissions seeded (super_admin, vendor_admin, delivery_partner, customer; 41 perms)
- [x] Auth API: register, login, me, logout, logout-all
- [x] Email verify (token), phone OTP (send/verify), auto-activation
- [x] Forgot/reset password (broker)
- [x] Feature tests (7) passing; `php artisan test` green (9 tests)
- [ ] Profile update endpoints (PATCH /me), change password
- [ ] Admin user management (list/suspend/roles)

## Phase 3 — Platform
- [x] Nepal geo seeders (provinces/districts/municipalities)
- [x] Settings model + defaults seeder (commission 10%, return 7d, COD, shipping)
- [x] Public config endpoint + geo lookup API
- [x] Admin settings CRUD (permission-guarded)
- [x] Feature tests (3) passing

## Phase 4 — Vendor  [~]
## Phase 5 — Catalog  [ ]
## Phase 6 — Marketplace  [ ]
## Phase 7 — Cart  [ ]
## Phase 8 — Checkout  [ ]
## Phase 9 — Order  [ ]
## Phase 10 — Payment (Khalti + COD)  [ ]
## Phase 11 — Wallet / commission / settlement / payout  [ ]
## Phase 12 — Shipping  [ ]
## Phase 13 — Customer  [ ]
## Phase 14 — Marketing  [ ]
## Phase 15 — Analytics  [ ]
## Phase 16 — Support  [ ]
## Phase 17 — Administration (audit, reconciliation)  [ ]
## Phase 18 — Filament admin panel  [ ]
## Phase 19 — Security + full test coverage  [ ]
## Phase 20 — Production readiness + React SPA  [ ]

## Verification commands
- `php artisan migrate:fresh --seed`
- `php artisan test`
- `php artisan route:list`
