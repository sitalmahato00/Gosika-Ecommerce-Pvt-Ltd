# GOSIKA Customer Mobile App — Full Build Blueprint

Recreates the web customer portal (storefront + account) as a mobile app using the **existing** Laravel API (`/api/v1`), **Google Socialite** auth, **eSewa (RFC-compliant) + Khalti + COD** payments, and the **exact GOSIKA branding/colors**.

---

## 1. API Foundation (all pages depend on this)

- **Base URL**: `https://<host>/api/v1`. Web SPA dev uses a Vite proxy (`http://localhost:8000` → `http://127.0.0.1:8000`). Mobile must use the absolute production host.
- **Auth**: Sanctum **Bearer tokens**. Store `token` + `user` locally. Every protected call sends `Authorization: Bearer <token>`.
- **Response envelope** (from `App\Modules\Shared\Presentation\Http\Response`):
  - Success: `{ success: true, message, data, meta }` (status 200/201)
  - `noContent`: `{ success: true, message, data: null, meta: [] }` (status **204**)
  - Error: `{ success: false, message, data, meta: [], errors? }` — `errors` only present if non-empty
- **Lists**: items are always inside `data` — either a bare array or the array is `data.data` (paginated `JsonResource::collection`). Pagination in `meta` (either `meta.pagination` for Order/Returns/Tickets, or flat `meta.current_page/per_page/total/last_page` for Catalog/Marketplace). Unwrap with the web pattern: `if (Array.isArray(data)) return data; if (data?.data array) return data.data`.
- **Error mapping** (see `bootstrap/app.php`):
  - `401 Unauthenticated.` → clear session, go to login
  - `403 You are not authorized...` → role/portal check
  - `404 Resource not found.` / `Route not found.`
  - `422 Validation failed.` → `errors` is field→messages map; show first message
  - `429 Rate limit exceeded...` → throttled (see below); disable submit + friendly retry
  - Business `DomainException` → `Response::error(message, errors, code)` (e.g. 422/403/409); **always display `message` verbatim**
- **Throttles** that apply to customer flows: `throttle:auth` (register, cart, checkout, orders), `throttle:login`, `throttle:password` (forgot/reset), `throttle:otp` (email/phone OTP), `throttle:payment` (initiate/callback), `throttle:public` (platform/geo).
- **Images**: API returns relative `/storage/...` paths (some resources already absolute via `url()`). Mobile must prefix with the API origin. Rule from web `apiImage()`: absolute `https://`/`data:` pass through; `/storage/` prefix with host; otherwise `<host>/storage/<path>`.
- **Money**: `रु` + `en-IN` locale, 2 decimals (`money()` helper). Symbol from branding `currency_symbol` (default `रु`), code `NPR`.
- **No CORS concerns** for a native app (Bearer tokens, no cookies). `statefulApi()` in `bootstrap/app.php` only affects browser session auth.

---

## 2. Authentication (Google Socialite + email/OTP + password)

### 2.1 Register — `POST /api/v1/auth/register` (public, `throttle:auth`)
Request **exact fields** (from `RegisterRequest`):
```
first_name (required, string, max:100)
last_name  (required, string, max:100)
email      (required, email, unique)
phone      (nullable, regex: ^[0-9+\- ]{7,20}$, unique)
password   (required, confirmed, min:8, letters + numbers)
```
> ⚠️ The web `Register.jsx` still posts legacy fields (`name`, `role`); the **API rejects those**. Mobile must send `first_name`/`last_name`.
Response 201:
```
{ user: <UserResource>, token: <string>, requires_email_verification: true,
  requires_phone_verification: <bool if phone set> }
```
New users get role `customer`, status `pending`, and OTPs are sent immediately (email + optionally phone). Mobile: after register, proceed to a verification screen.

### 2.2 Login — `POST /api/v1/auth/login` (public, `throttle:login`)
Request:
```
identifier    (required) — email OR phone
password      (required)
device_name   (nullable) — web uses 'web'; mobile use e.g. 'android'/'ios'
```
Response 200: `{ user: <UserResource with roles>, token: <string> }`.
Errors: `401 Invalid credentials.`; `403 Your account is not active. Please verify your email and phone.`
`identifier` lookup is email-or-phone; password checked with `Hash::check`.

### 2.3 Google Socialite (exactly as web)
1. `GET /api/v1/auth/google/redirect` (public) → 302 to Google consent (Stateless driver; only `google` allowed).
2. Google redirects to `config('services.google.redirect')` = `<APP_URL>/api/v1/auth/google/callback`.
3. `GET /api/v1/auth/google/callback` → Socialite user; creates/links user (matches by `provider+provider_id`, else by email and attaches provider; new users created with `email_verified_at=now()`, `status=active`, role `customer`; password = random).
4. Server creates token and **302-redirects** to `<frontend_url>/social-auth?token=<plainTextToken>&name=<full_name>&email=<email>`.
5. Web's `SocialAuth.jsx`: store token → `POST /auth/me` → hydrate user → route by role (`super_admin`→/admin, `vendor_admin`→/vendor, else /account).

**Mobile adaptation**: `frontend_url` is a web URL, so the callback's redirect target is a **web page**, not the app. To make Google login work from a mobile app:
- Register a real scheme/universal-link (e.g. `gosika://`) and change `.env` `FRONTEND_URL` to that scheme, OR
- Keep `FRONTEND_URL` as the web URL and have the callback land on a lightweight web page (the `/social-auth` SPA page) that **forwards the token to the app**: a universal link/custom-scheme redirect appended with `?token=...`, or a short-lived web page that the app polls/reads.
- Alternative: request a new JSON endpoint on the server that returns `{token, user}` after provider callback for non-web clients. (Reuse `SocialAuthController` logic.)
- Decision needed (Open item #1 below).

### 2.4 Email verification (OTP code — NOT a link)
- `POST /api/v1/auth/email/verify` — body `{ email, code }` (code exactly 6 chars). Cached code key `email_verify:{email}` compared as `hash('sha256',$code)`.
- `POST /api/v1/auth/email/resend` — body `{ email }` → resends.
- Success activates the account when email verified AND (no phone OR phone verified).

### 2.5 Phone verification (OTP)
- `POST /api/v1/auth/phone/otp` (Bearer) → sends to `user.phone`.
- `POST /api/v1/auth/phone/verify` (Bearer) → body `{ code }` (digits:6).

### 2.6 Forgot / Reset password
- `POST /api/v1/auth/forgot-password` — body `{ email }` → sends Laravel reset link (NOT a code). Message: `Password reset link sent.` or 422.
- The reset link (`web.php`) is `<APP_URL>/password/reset/{token}?email=...` which **302-redirects** to `<FRONTEND_URL>/reset-password?token=...&email=...`.
- `POST /api/v1/auth/reset-password` — body `{ token, email, password, password_confirmation }` (password min:8 letters+numbers).
- Mobile: the email link must open the app → requires the reset URL to be a universal link / deeplink that hands `token`+`email` to the app (Open item #1 covers the same redirect-mechanism problem as Socialite).

### 2.7 Session
- `GET /api/v1/auth/me` (Bearer) → `UserResource` with `roles[]` (role name strings). Use to hydrate on app launch; on 401 purge.
- `POST /api/v1/auth/logout` (Bearer) → revokes current token (204). `POST /auth/logout-all` revokes all.
- **UserResource fields**: `id (uuid), first_name, last_name, full_name, email, phone, avatar (abs /storage path or null), status, email_verified_at, phone_verified_at, roles[], created_at`.
- Web persisted `gosika_token`, `gosika_user`, `gosika_branding`. Mobile: secure storage equivalent.

### 2.8 Supported auth pages (mirror web)
Login, Register, Forgot Password, Reset Password, Email-Verify entry, Phone-OTP entry, Social-auth landing (web equivalent), and role-routing (customer → account home).

---

## 3. Payments — eSewa, Khalti, COD (exact flow)

### 3.1 Platform capability flags — get from `GET /api/v1/platform/config`
```
payment.esewa_enabled, payment.khalti_enabled, payment.cod_enabled
payment.cod_max_amount, checkout.cod_max_amount
```
Also `cod_enabled`. Web order: prefer `cod` (if enabled + amount ≤ max) else first enabled of `khalti`/`esewa`.

### 3.2 eSewa (the web flow, step by step)
1. **Initiate**: `POST /api/v1/payments/initiate` (Bearer, `throttle:payment`)
   ```
   { order_id: <order uuid>, method: 'esewa',
     success_url: '<origin>/payments/esewa/callback',
     failure_url: '<origin>/payments/esewa/callback?status=failure' }
   ```
   Response 201 → `PaymentResource` with `payment_form = { action, fields }` for eSewa:
   - `action` = `https://rc-epay.esewa.com.np/api/epay/main/v2/form` (UAT) or `https://epay.esewa.com.np/api/epay/main/v2/form` (prod — from `PaymentServiceProvider`)
   - `fields` (server-signed): `amount`, `tax_amount` (`0`), `total_amount`, `transaction_uuid` (= `payment_number`), `product_code`, `product_service_charge` (`0`), `product_delivery_charge` (`0`), `success_url`, `failure_url`, `signed_field_names` (`total_amount,transaction_uuid,product_code`), `signature` (HMAC-SHA256 base64 of `total_amount=…,transaction_uuid=…,product_code=…` using the configured secret — done **server-side**, never in app).
   - Note: the **provider overwrites amount math** (sends full grand total as `amount`, sub-charges 0) to avoid IRD tax lookup failures. Build payment UI from these returned fields verbatim.
2. **Submit**: web builds a hidden `POST` form to `action` with the fields and submits → browser leaves the SPA and goes to eSewa. **Mobile**: this requires doing an HTML form POST in a **WebView / SFSafariViewController / Custom Tab** (construct the form in injected HTML, or fetch eSewa first-party mobile integration). Keep the same signed fields — do not re-sign.
3. **eSewa redirects back** (POSTs `data`/`result` to `success_url` or `failure_url`).
4. **Verify** (two paths, both supported by the API):
   - **Callback verify**: `POST /api/v1/payments/esewa/callback` (public, `throttle:payment`) body `{ data: <raw base64 payload> }`. Server base64-decodes (JSON), validates product_code, verifies HMAC signature over `signed_field_names`, amount-matches, calls the status API, marks PAID → order `payment_status=paid`, order `confirmed`.
   - **Polling verify**: `POST /api/v1/payments/esewa/verify-by-order` (Bearer) body `{ order_id }`. Web uses this when no callback data arrived: polls every 3s up to **10 attempts** (30s). Server looks up the initiated eSewa payment for the order and verifies via the status API.
   - 404 `No pending eSewa payment found for this order.` → payment already confirmed or none pending.
5. **Success**: navigate to order-success with the order. Failure/cancel: show error screen; order stays `payment_pending`; offer **retry** (re-initiate eSewa) and **view order** (same as web `PaymentCallback.jsx`).
6. Server also has **legacy web** callback routes (`web.php`): `GET /payments/esewa/callback?data=...` → `esewaWebCallback` → 302 to `<frontend>/order-success?order_id=...&esewa=1`. Mobile should **not** rely on these.

**PaymentResource fields** (customer-facing): `id (uuid), payment_number, order_id (uuid), amount ("123.45" string), currency, method, provider, status, provider_pidx, provider_transaction_id, payment_url (khalti), payment_form {action, fields} (esewa), expires_at, initiated_at, verified_at, status_history[] {from_status,to_status,reason,created_at}, created_at`.

### 3.3 Khalti
- `POST /payments/initiate { order_id, method: 'khalti' }` → `payment_url` in response. Web opens it in a new tab; app should open in an in-app browser/WebView.
- Server return_url is `<APP_URL>/payments/khalti/callback`; on return the web `GET /payments/khalti/callback?...` handles it (`khaltiWebCallback`) → redirects to order-success. Server also verifies via callback `POST /payments/khalti/callback { pidx, status, transaction_id, total_amount, purchase_order_id }`.
- App can also call `GET /payments/{payment}` or `GET /payments/{payment}/status` (Bearer) to poll: status returns `{ payment, order }` (OrderResource).

### 3.4 COD
- Select `payment_method: 'cod'` at checkout. No `payments/initiate` needed — order is placed with `payment_status: pending`; collection/`markCodCollected` happens in delivery/admin. Respect `cod_max_amount`.

### 3.5 Order payment states → UI
`OrderPaymentStatus`: `pending, paid, failed, cancelled, refunded, partially_refunded`. `PaymentStatus`: `initiated, processing, verification, paid, failed, cancelled, expired, timeout, refunded, partially_refunded, exception`.
Web shows a "Pay Now" / retry affordance when `payment_status === 'pending' && method in [khalti, esewa] && status not in [cancelled, refunded, delivered, completed]` (see `OrderList.jsx`, `OrderDetail.jsx`).

---

## 4. Pages — Endpoint-by-Endpoint Build Spec

### 4.1 Home
- `GET /v1/banners` → `data[]` (BannerResource): render carousel. `GET /v1/campaigns`, `GET /v1/pages/{slug}` for CMS static pages.
- `GET /v1/categories` (+`?with_children=1` for mega menu) → `data[]`: `{id(uuid), name, slug, icon, image, products_count, children[]?}`.
- `GET /v1/deals` → paginated `ProductResource` list (same as below).
- `GET /v1/products?featured=1&sort=top&per_page=N` for featured rail.

### 4.2 Shop / Product list / Search (`GET /v1/products`)
Query params (from `PublicCatalogController::products`):
```
category (slug or uuid) · brand (slug or uuid) · store (uuid)
min_price · max_price · search (name/description LIKE)
featured|is_featured (bool) · discount (bool → compare_at_price > price)
sort ∈ price_asc|price_desc|newest|rating|top|discount   (default created_at desc)
per_page (default 12) · page
```
Also `GET /v1/brands?search=`, `GET /v1/deals?category=&per_page=`, `GET /v1/marketplace/stores?page=` (cached 180s), `GET /v1/marketplace/stores/{store}/products?search=&category=&sort=&per_page=`.

**ProductResource fields** (customer-relevant): `id, name, slug, description, short_description, sku, status, stock_status, quantity, price (number), compare_at_price, currency, is_variant, is_featured, views_count, rating_avg, rating_count, category {id,name,slug?} | null, brand {…}, store {id,name,slug} | null, images[] {url,is_primary, sort_order}, primary_image {url}, variants[] {id, sku, name, price, compare_at_price, quantity, stock_status, options, is_default, image, attributes[]}, attributes[], created_at, updated_at`.
Discount compute: `discountPercent(price, compareAt)`.

### 4.3 Product detail (`GET /v1/products/{product}`)
Same resource with `images`, `variants.attributeValues`, `category`, `brand`, `store` loaded. Server increments `views_count` and records recently-viewed when authenticated. Tabs on web: description, **reviews** (`GET /v1/marketplace/products/{product}/reviews`), **questions** (`GET /v1/marketplace/products/{product}/questions`).
- Wishlist toggle: `GET /v1/wishlist/status/{product}` (Bearer) → `{wishlisted}`; `POST /v1/wishlist/items {product_id}` → `{wishlisted:true}`; `DELETE /v1/wishlist/items {product_id}` → `{wishlisted:false}`.
- Add to cart: `POST /v1/cart/items {product_id, variant_id?, quantity}`.
- Buy-now: store selected item(s), go to checkout (web uses `gosika_selected_cart_items` localStorage — mirror in app state).

### 4.4 Store detail (`GET /v1/marketplace/stores/{store}`)
`PublicStoreResource`: `id, name, slug, logo (abs), banner (abs), description, contact_email, contact_phone, product_count, rating_avg, rating_count, location, address{…}, operating_hours[], verified, member_since, created_at`. Plus `storeProducts`, `storeReviews` (`/v1/marketplace/stores/{store}/reviews`).

### 4.5 Cart (guest-capable — NO auth middleware)
Endpoint group `v1/cart` has **only** `throttle:auth`; guests are tracked by header **`X-Session-Id`**. Persist a session id per install and send it on every cart call (auth or not).
- `GET /v1/cart` → CartResource
- `POST /v1/cart/items` → `{ item: <uuid>, cart: CartResource }`, meta `session_id`
- `PUT /v1/cart/items/{item}` body `{ quantity }` (**0 removes**)
- `DELETE /v1/cart/items/{item}`
- `DELETE /v1/cart` (clear)
**CartResource**: `id, status, item_count (sum qty), line_count, subtotal ("…"), items[], created_at, updated_at`.
**CartItemResource**: `id (uuid), product_id, name, sku, variant_id, variant_name, options, image (raw /storage path), unit_price, quantity, total_price, stock_status, store {id,name}, vendor_name, created_at`.

### 4.6 Checkout & Place order (Bearer, `throttle:auth`)
1. `GET /v1/checkout/summary?items=<uuids CSV or repeated>&selected_item_ids=&item_ids=` → `{ item_count, subtotal, discount, delivery_charge, tax, total }` (all number-formatted strings).
2. `POST /v1/checkout`:
   ```
   { shipping_address_id (uuid, required),
     billing_address_id (uuid|null),
     payment_method ∈ cod|khalti|esewa,
     item_ids[] (optional subset) }
   ```
   → 201 `CheckoutSessionResource`: `{ id, status, payment_method, shipping_address <CustomerAddressResource>, billing_address, subtotal, discount, delivery_charge, tax, total, expires_at, created_at }`.
3. `POST /v1/orders`:
   ```
   { checkout_session_id (uuid, required), customer_notes (optional, ≤1000) }
   ```
   → 201 `OrderResource`.
4. If `payment_method` = online → initiate payment (Section 3). Web calls, in order, `/checkout`, `/orders`, then `/payments/initiate`.

### 4.7 Orders
- `GET /v1/orders?status=&per_page=(1..50)&page=` → `{ data.data: [OrderResource], meta.pagination {total, per_page, current_page, last_page} }`.
- `GET /v1/orders/{order}` → OrderResource.
- `POST /v1/orders/{order}/cancel` body `{ reason? }` → OrderResource. Only when `can_cancel === true`.
**OrderResource**: `id (uuid), order_number, status, payment_method, payment_status, subtotal, discount, delivery_charge, tax, grand_total, currency, shipping_address (snapshot), items[], vendor_orders[], customer_notes, placed_at, created_at, can_cancel (bool)`.
**OrderItemResource**: `id, product_id, product_name, sku, variant_name, image (abs), quantity, unit_price, line_total, delivery_status`.
`vendor_orders` → VendorOrderResource (per-vendor fulfillment: accept/reject/pickup/delivery status).

### 4.8 Tracking (`GET /v1/orders/{order}/tracking`, Bearer)
Returns all `DeliveryTrackingResource` events in the order (controller `assertCanView` allows owner).
**DeliveryTrackingResource**: `id, assignment_id, vendor_order_id, status, latitude, longitude, note, tracked_at, created_at`.
Render as a vertical timeline; presentation text per `status` (assigned → accepted → picked_up → out_for_delivery → delivered/failed, plus vendor statuses on the order).

### 4.9 Returns & Refunds (Bearer; controller enforces `auth:sanctum`)
- `GET /v1/customer/returns?status=&order_id=&per_page=` → `meta.pagination` style.
- `POST /v1/customer/returns`:
  ```
  { order_id (uuid), order_item_id (uuid), reason_type ∈ damaged|wrong_item|not_as_described|quality_issue|other,
    reason (≤1000), quantity (≥1, ≤ purchased) }
  ```
  → 201 `CustomerReturnResource`; 404s for wrong order/item; 422 if qty or duplicate open return (not in cancelled/rejected/refunded/completed). 7-day window (`window_expires_at`).
- `POST /v1/customer/returns/{return}/cancel` → only while `requested`/`under_review`.
**CustomerReturnResource**: `id, return_number, reason_type, reason, quantity, refund_amount, status, response (review_notes), product_name, product_image, order_id, order_number, created_at, reviewed_at`.

### 4.10 Account — Profile
- `GET /v1/customer/profile` → CustomerProfileResource.
- `PUT /v1/customer/profile`:
  ```
  { first_name?, last_name?, phone? (≤20), avatar? (url string), gender? ∈ male|female|other,
    date_of_birth? (date < today), preferences? (array) }
  ```
- `PUT /v1/customer/profile/password`: `{ current_password, password, password_confirmation (min 8) }`. 422 if current mismatch.
- `POST /v1/customer/profile/avatar`: multipart field **`avatar`** (image, ≤ 2MB) → `{ avatar: "/storage/..." }`.
**CustomerProfileResource**: `id, first_name, last_name, full_name, email, phone, avatar, gender, date_of_birth, preferences, default_shipping_address <addr>, default_billing_address <addr>, created_at, updated_at`.

### 4.11 Account — Addresses (Bearer)
- `GET /v1/customer/addresses` → `CustomerAddressResource[]`.
- `POST /v1/customer/addresses` / `PUT /v1/customer/addresses/{address}`:
  ```
  { address_type ∈ shipping|billing, label?, full_name?, phone (req, ≤20), address_line_1 (req, ≤255),
    address_line_2?, country_id? uuid, province_id? uuid, district_id? uuid, municipality_id? uuid,
    postal_code?, landmark?, latitude?, longitude?, is_default? bool }
  ```
- `DELETE /v1/customer/addresses/{address}` → 204. `PUT /v1/customer/addresses/{address}/default` → `{ address, default: <uuid> }`.
**CustomerAddressResource**: `id, address_type, label, full_name, phone, address_line_1, address_line_2, country {id,name}|null, province{n}|null, district{n}|null, municipality{n}|null, postal_code, landmark, latitude, longitude, is_default, created_at, updated_at`.
**Address form UX** uses the geo endpoints (Section 4.14) for cascading pickers (country→province→district→municipality) and `reverse-geocode` for map-pin.

### 4.12 Account — Storefront extras (Bearer)
- My Reviews: `GET /v1/customer/reviews?status=&per_page=` → `MyReviewResource[]` (+ pagination).
- Pending reviews: `GET /v1/customer/reviews/pending` (order items without a review).
- My stores: `GET /v1/customer/stores?per_page=` → `CustomerStoreResource[]` (stores you ordered from).
- Submit product review: `POST /v1/marketplace/products/{product}/reviews` `{ rating (1..5, req), title?, body? (≤2000) }`.
- Submit store review: `POST /v1/marketplace/stores/{store}/reviews` `{ rating, body? }`.
- Ask question: `POST /v1/marketplace/products/{product}/questions` `{ question (≤500) }`.
- Recently viewed: `GET /v1/marketplace/recently-viewed` (Bearer).

### 4.13 Account — Wishlist, Vouchers, Support, Security
- Wishlist: `GET /v1/wishlist` → WishlistResource `{ id, name, item_count, items[] {id, product_id, product <full ProductResource>, added_at} }`.
- Vouchers: web page is a **static placeholder** (no API). Mobile: same placeholder card, link to Deals (`/deals`). (Coupon *management* is admin/vendor-only.)
- Support tickets (`GET/POST` prefixed `v1/customer/support`; controller-level `auth:sanctum`):
  - `GET /v1/customer/support/tickets?status=&per_page=`
  - `POST /v1/customer/support/tickets` `{ subject (≤250), description, category?, priority ∈ low|normal|high, attachments?[] }` → `TCK-XXXXXXXX`
  - `GET /v1/customer/support/tickets/{ticket}` (messages with sender)
  - `POST /v1/customer/support/tickets/{ticket}/messages` `{ message (≤5000), attachments?[] }` (reopens closed tickets)
  - `POST /v1/customer/support/tickets/{ticket}/close`
- Security: `PUT /v1/customer/profile/password` (Section 4.10). Note: vendor security endpoints are separate (`v1/vendor/security`) — out of scope.

### 4.14 Geo + Platform (public, `throttle:public`)
- `GET /v1/platform/countries` → `{id, uuid, name, code, phone_code}` (active only).
- `GET /v1/platform/provinces` → `{id, uuid, name, code}` (active).
- `GET /v1/platform/districts?province_id=` → `{id, uuid, province_id, name, code}`
- `GET /v1/platform/municipalities?district_id=` → `{id, uuid, district_id, name, type, ward_count}`
- `GET /v1/platform/reverse-geocode?lat=&lng=` → `{ province {uuid,name}|null, district{n}|null, municipality{n}|null, address_line, display_name }` (Nominatim + local fallback).
- `GET /v1/platform/config` (branding + capability flags, Section 3.1 + 3 / branding). `GET /v1/platform/social-providers` → `{ google: bool }`.

---

## 5. Branding & Design (reuse verbatim)
`GET /v1/platform/config` payload merged over `DEFAULT_BRANDING` in web:
`brand_name (GOSIKA), tagline, logo_light, logo_dark, favicon_url, primary_color (#ff5500), brand_color_dark (#e04b00), support_email, support_phone, business_address, footer_text, currency_symbol (रु), currency (NPR), maintenance_mode, maintenance_message` + payment flags.

Colors (`frontend/src/styles.css` :root / `tailwind.css` @theme):
| Token | Hex | Use |
|---|---|---|
| primary / brand | `#ff5500` | CTAs, links, focus, active pills |
| primary-dark | `#e04b00` | hover/pressed |
| primary-darker / brand-deep | `#c23e00` | deepest shade |
| primary-light / brand-light | `#ff7733` | tints |
| primary-50 | `#fff7ed` | soft brand bg |
| navy / navy-light | `#161d2b` / `#1f293d` | dark header/hero |
| ink | `#1e293b` | primary text |
| muted / muted-light | `#64748b` / `#94a3b8` | secondary text |
| bg / surface | `#f4f6f9` / `#ffffff` | page bg / cards |
| success | `#16a34a` (bg `#f0fdf4`) | delivered/paid/success |
| warning | `#d97706` (bg `#fffbeb`) | pending/warn |
| danger | `#dc2626` (bg `#fef2f2`) | failed/cancelled/declined |
| info | `#0284c7` (bg `#f0f9ff`) | informational |
| purple | `#7c3aed` | accents |
| radius | 6/10/14/20 px | sm..xl |
| font | Inter + system | |
| shadows | sm..xl five tiers | |

Card/motion helpers available web-side to mirror: `card-lift`, `btn-tactile`, `row-enter`, `badge-pop`, `modal-ease`, `overlay-ease`.

---

## 6. Order/Payment Status → UI Treatment (exact strings)
`OrderStatus`: `pending, payment_pending, confirmed, accepted, rejected, processing, preparing, ready_for_pickup, picked_up, out_for_delivery, delivered, completed, cancelled, returned, refunded, failed`.
`OrderPaymentStatus`: `pending, paid, failed, cancelled, refunded, partially_refunded`.
`PaymentStatus`: `initiated, processing, verification, paid, failed, cancelled, expired, timeout, refunded, partially_refunded, exception`.
Map these verbatim to the same badges/pills used by web (`OrderList`/`OrderDetail`).

---

## 7. Mobile Implementation Notes & Decisions Required

1. **Callback delivery for Google + reset links + payment callbacks** — the server redirects to `FRONTEND_URL` web URLs. Decide: (a) universal-link the app so `/social-auth`, `/reset-password`, `/payments/esewa/callback`, `/order-success` open in-app and deliver params; or (b) add server endpoints that return JSON for `?app=1&token=...`. Without this, Google login, password reset, and eSewa return can't reach the app cleanly.
2. **eSewa on device** — the gateway expects an HTML form POST with signed fields. Use a WebView/InAppBrowser configured with the returned `payment_form.action` + hidden `fields` (build tiny HTML) and intercept the return (`success_url` back to app). Keep all signature handling server-side; the app never knows the secret.
3. **Khalti** — open `payment_url` in an external/built-in browser; poll `GET /payments/{payment}/status`.
4. **Guest cart** — generate + persist `X-Session-Id`; send on all cart calls.
5. **Throttles** — respect `throttle:otp`/`throttle:payment`; show 429 messaging.
6. **Caching** — mirror web TTLs: config/categories/brands 120s, marketplace/stores 60s, products 45s, default 20s; invalidate on writes (see `api/client.js`).

## 8. Out of Scope (don't build)
`v1/admin/*`, `v1/vendor/*`, `v1/delivery-partner/*`, wallet endpoints, server-to-server payment callbacks (backend handles), coupon management.

## 9. Build checklist by page
| Page | APIs |
|---|---|
| Splash/Launch | `/platform/config`, `/auth/me` (validate token) |
| Login / Register / Forgot / Reset / OTP / Social | §2 |
| Home | `/banners`, `/campaigns`, `/categories`, `/deals`, `/products?featured` |
| Shop/List/Search/Deals | `/products`, `/brands`, `/marketplace/stores` |
| Product detail | `/products/{id}`, reviews, questions, wishlist status (+ reviews/questions/store Reviews) |
| Store detail | `/marketplace/stores/{s}`, `/{s}/products`, `/{s}/reviews` |
| Cart | §4.5 (`X-Session-Id`) |
| Checkout | `/checkout/summary`, `/checkout`, `/orders`, `/payments/initiate` |
| eSewa/Khalti callbacks | §3 (WebView + `/payments/esewa/callback` or verify-by-order polling) |
| Order list/detail | `/orders`, `/orders/{id}`, `/orders/{id}/tracking`, cancel |
| Returns | `/customer/returns` |
| Account | profile, password, avatar (multipart `avatar`), addresses+default, geo |
| Wishlist / Reviews / Vouchers / Security | §4.12–4.13 |
| Support tickets | `/customer/support/*` |
| CMS/static | `/pages`, `/pages/{slug}` |
| Branding | `/platform/config` drive colors, name, currency |