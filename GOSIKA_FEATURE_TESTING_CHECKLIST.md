# GOSIKA Feature Testing Checklist

Use this checklist for a manual end-to-end QA pass of the customer storefront, seller portal, delivery portal, and admin portal. It is a test procedure, not a claim that every feature is complete or already passing. Record evidence and mark unavailable or failing features accurately.

## Run information

| Field | Value |
|---|---|
| Environment / URL | |
| Build / commit | |
| Tester | |
| Test date | |
| Browser / device | |
| Database / seed version | |

### Result legend

- `[ ]` Not run
- `[x]` Passed
- `[!]` Failed — add a defect ID and evidence
- `[-]` Blocked / unavailable — state the reason
- `[N/A]` Not applicable — state why

For each flow, record the result beside the flow heading. Capture screenshots or request/response evidence for failures, and never put real customer, payment, or identity data in test evidence.

## 1. Test environment and reusable test data

Run against a non-production environment with a disposable database and payment-provider sandbox credentials. Do not send live payments or use real personal information.

Prepare the test-only password in the approved secrets store as `QA_TEST_PASSWORD` (at least 12 characters). The same secret is applied to the seeded accounts; it is deliberately not stored in this checklist or source control. Seed with `php artisan db:seed` in a local or testing environment. The seeder is repeatable and does not truncate tables. It refuses to run outside local/testing, and the default seeder skips production.

| Reference | Account / role | Login ID | Credential location |
|---|---|---|---|
| ADM-01 | Super Admin | `admin@gosika.com.np` / `9801000001` | Approved secrets store: `QA_TEST_PASSWORD` |
| S-1 | Orders-view-only staff | `staff@gosika.com.np` / `9801000002` | Approved secrets store: `QA_TEST_PASSWORD` |
| SEL-A | Approved Seller A | `sellerA@gosika.com.np` / `9801000003` | Approved secrets store: `QA_TEST_PASSWORD` |
| SEL-B | Approved Seller B | `sellerB@gosika.com.np` / `9801000004` | Approved secrets store: `QA_TEST_PASSWORD` |
| SEL-C | Approved Seller C, pending KYC | `sellerC@gosika.com.np` / `9801000005` | Approved secrets store: `QA_TEST_PASSWORD` |
| DP-1 | Active, online delivery partner | `delivery1@gosika.com.np` / `9801000006` | Approved secrets store: `QA_TEST_PASSWORD` |
| DP-2 | Active, offline delivery partner | `delivery2@gosika.com.np` / `9801000007` | Approved secrets store: `QA_TEST_PASSWORD` |
| CUS-A | Verified Customer A, two addresses, empty wallet/cart | `customerA@gosika.com.np` / `9801000008` | Approved secrets store: `QA_TEST_PASSWORD` |
| CUS-B | Verified Customer B, isolation account | `customerB@gosika.com.np` / `9801000009` | Approved secrets store: `QA_TEST_PASSWORD` |
| PAY-SBX | Payment gateway sandbox | Do not use a live account | Approved secrets store and local app payment settings |
| MAIL-TEST | Test notification inbox | `qa-inbox@gosika.com.np` (route only to a mail sandbox) | Mail sandbox / approved secrets store |
| SMS-TEST | Test notification number | `+9779800000199` (placeholder; configure a sandbox number) | SMS sandbox / approved secrets store |

Seeded product references are P-01 (Seller A, in stock, variant), P-02 (Seller B, discounted), P-03 (Seller C, low stock), and OOS-01 (zero stock). `QA-CART-MV` contains one item from each seller; Customer A's cart stays empty. `ACTIVE10` has a minimum order, usage limits, and a discount cap; `EXPIRED10` is expired. `ZONE-X` and `ZONE-Y` have different delivery charges. `QA-ORD-RET` is a delivered Customer A order inside the configured return window. KYC upload fixtures (JPG, PNG, PDF, invalid text, and oversized file) are generated under local application storage.

The seeder never creates payment credentials or real identity data. Configure only gateway sandbox keys and test mail/SMS routing through approved secrets and environment settings. Do not copy real credentials, payment details, or identity documents into seed data.

## 2. Smoke test and public storefront

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Open the storefront home page in a fresh browser session.
2. Confirm the page loads without a blank screen, console-breaking error, or failed primary API request.
3. Check header, logo/branding, navigation, footer, search entry point, and mobile navigation.
4. Open Shop, a category, Brands, a brand detail, Deals, a store page, and Help.
5. Search for a known product by full name and partial name; then try a no-results term.
6. Apply available category, brand, price, sort, and pagination controls; clear the filters.
7. Open a product detail page; verify image gallery, title, price, stock/availability, variants, seller/store, description, reviews, and questions where data exists.
8. Use product quick view/image zoom/quantity controls if shown; close the dialog and confirm the page remains usable.
9. Refresh a deep link (for example a product or category URL) and use browser back/forward.
10. Repeat key browsing/search steps at a narrow mobile viewport.
11. Confirm an unknown public URL shows the not-found experience, while unknown `/api/*` URLs return a not-found response rather than the SPA shell.

**Expected:** Public pages load and link consistently, product and filter data match the selected item, empty states are understandable, and refresh/navigation do not lose the route.

## 3. Customer registration, sign-in, and identity

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

### Register and verify

1. Open Register and submit an invalid email, weak/mismatched password, and missing required field one at a time.
2. Confirm field-level validation appears and no account is created for invalid input.
3. Register a new test customer with valid details.
4. Confirm the success state and verification message are clear.
5. Open the email verification link or enter the supplied token; try an invalid/expired token as a negative case.
6. Request a verification resend and verify throttling/feedback when the allowed limit is exceeded.
7. If phone OTP is enabled, request an OTP, submit an invalid OTP, then a valid OTP; confirm verification state updates.
8. Sign out and sign in with the new account.
9. Visit a protected page while signed out; confirm redirect/guard behavior, then sign in and retry.

### Login, logout, and recovery

1. Try an incorrect password and a nonexistent account; confirm a safe, useful error without exposing account secrets.
2. Sign in with valid credentials and confirm the account identity/role is correct.
3. Open the account in a second session/device if available.
4. Log out of the current session; confirm protected data is no longer accessible from that session.
5. Use logout-all and confirm other sessions/tokens are invalidated.
6. Request password recovery for a test account; open the reset link/token and set a new valid password.
7. Test invalid/expired reset token and password validation.
8. Sign in with the new password and verify the old password no longer works.
9. If configured, test Google/social sign-in success, cancellation, provider error, and an unconfigured provider.

**Expected:** Registration, verification, authentication, rate limiting, and recovery are consistent; session invalidation works; role-protected routes never become accessible by changing the URL.

## 4. Customer account, profile, addresses, and preferences

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Sign in as Customer A and open the account dashboard.
2. Edit profile fields and avatar; save, refresh, and confirm persisted values.
3. Submit invalid profile data and an invalid/unsupported avatar file; confirm actionable validation.
4. Add an address using the Nepal location selectors; save and verify address details.
5. Add a second address, set it as default, edit the first, then delete the second.
6. Attempt to access or modify Customer B's address using its URL/identifier while signed in as Customer A.
7. Update password, notification preferences, and account preferences if shown; verify changes persist after refresh.
8. Review account dashboard, active orders, order history, vouchers, wishlist, reviews, returns, support, security, and notifications sections.
9. Confirm an empty account section shows an empty state and does not error.
10. If customer segments or customer wallet tools are enabled, check the Admin customer list, segment membership, wallet balance, and transaction detail against the test customer's activity.

**Expected:** Account changes persist and are scoped to the signed-in customer; default address behavior is unambiguous and customer data is not cross-accessible.

## 5. Seller registration, KYC, store, and bank details

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Start seller registration/application using Seller C.
2. Submit incomplete or invalid business/profile details; confirm validation.
3. Submit valid seller details and confirm the application is pending review.
4. Upload required KYC/business documents; try invalid type/size and confirm rejection.
5. As Admin, open the seller application and documents; verify download/view access is restricted to authorized roles.
6. Request changes, then return to Seller C and update/resubmit the application.
7. Approve the seller/KYC as Admin; separately exercise rejection with a reason using a disposable application.
8. Sign in as the approved seller; confirm pending/rejected sellers cannot use selling actions.
9. Create a store, enter name/description/contact/location/hours, upload images, and submit it for review if that workflow is available.
10. As Admin, approve/reject the store; confirm public visibility only follows the expected approval/activation rules.
11. Add, edit, and remove a seller bank account using test-only details; validate required fields and masked display.
12. Update seller profile, avatar, password, notification settings, preferences, and security options.
13. Suspend the seller as Admin; confirm the seller cannot publish products, accept orders, or receive new work; reactivate and retest.

**Expected:** Seller/KYC/store states transition as intended, document access is authorized, and suspended or unapproved sellers cannot perform restricted operations.

## 6. Catalog, product approval, and inventory

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. As Seller A, create a draft product with category, brand, description, price, images, attributes, and at least one variant.
2. Save an incomplete product, then submit it with missing/invalid values; confirm field validation.
3. Upload valid images; test unsupported format, oversized file, and missing image where required.
4. Submit the product for review; confirm status and that it is not publicly purchasable before approval.
5. As Admin, inspect product details and approve it.
6. Confirm the approved product appears in public search, shop/category/brand listings, seller store, and product detail.
7. Create a second product and have Admin reject it with a reason; confirm the seller sees the decision and can correct/resubmit if supported.
8. Edit the approved product and verify the expected review/visibility rule for material changes.
9. Update stock for an item; confirm in-stock, low-stock, and out-of-stock indicators update on seller and public pages.
10. Try a quantity above stock and a zero/negative quantity; confirm invalid orders cannot be placed.
11. As Seller B, attempt to view/update Seller A's product by identifier.
12. As Admin, create/update/archive a category and brand; confirm products and public browse pages respond appropriately.
13. Submit a brand request as a seller and review/approve/reject it as Admin.
14. As Admin, assign a seller tier and verify the seller portal reflects the applicable tier/perks; edit or remove a disposable tier assignment.
15. Create a seller bulletin as Admin and confirm its audience, visibility, and expiry behavior in the seller portal.

**Expected:** Only eligible published products are publicly purchasable; inventory, variants, pricing, images, moderation status, and seller ownership stay consistent.

## 7. Wishlist, product questions, and reviews

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. While signed out, open a product and try to use wishlist/review/question controls; confirm sign-in gating.
2. Sign in as Customer A and add a product to the wishlist.
3. Refresh, open the wishlist, remove the product, and verify state persists.
4. Open a product and submit a question; try empty/invalid content.
5. As Admin, review the question, answer it, and approve/reject it; verify public visibility matches moderation state.
6. As Customer A, attempt to review a product without a qualifying purchase; verify eligibility rules.
7. Complete a qualifying order (see section 8), submit a rating/review, and confirm pending/approved visibility.
8. As Admin, approve/reject a review; as the seller, reply to an eligible review.
9. Confirm review/question ownership and moderation actions cannot be performed by an unrelated customer or seller.
10. Review recently viewed products and confirm expected products appear without exposing another user's private activity.

**Expected:** Wishlist and marketplace contributions persist, moderation is enforced, and purchase/ownership rules are honored.

## 8. Cart, checkout, coupon, and order placement

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Add an in-stock product as a guest and as a signed-in customer; confirm the intended cart behavior in both cases.
2. Change quantity, remove an item, clear the cart, and refresh; verify totals and persistence.
3. Try invalid quantity, unavailable product, and quantity greater than stock.
4. Sign in as Customer A, add products from at least two sellers, and open checkout.
5. Select/create a delivery address and confirm location, shipping charge, delivery estimate, and order summary.
6. Apply a valid coupon; verify discount and final total. Then test expired, invalid, minimum-spend, usage-limit, and ineligible-seller coupons.
7. Change cart quantity/address/coupon and verify all totals recalculate from server-authoritative values.
8. Attempt to tamper with displayed price/discount or submit a stale cart; confirm the server rejects or recalculates it.
9. Create checkout/order with valid information; record order number, item quantities, seller splits, delivery fees, discounts, and total.
10. Double-submit the place-order action or retry after a timeout; confirm duplicate orders/charges are not created.
11. Confirm order-success page and customer order detail match the final server-calculated order.
12. Verify cart clearing/retention follows the expected order outcome for successful and failed checkouts.

**Expected:** Order totals are calculated server-side, address and stock are validated at finalization, coupons obey their rules, and retries do not duplicate orders.

## 9. Payment methods, callbacks, and refunds

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Confirm only configured payment methods are offered in the test environment.
2. Place an order with each enabled sandbox online gateway (for example Khalti; include eSewa only if enabled/configured).
3. Complete a successful sandbox payment and return through the provider callback.
4. Confirm payment and order statuses update once, with matching amount, currency, provider transaction, and order.
5. Reload/replay the same callback or verification request; confirm it is idempotent and does not duplicate payment/ledger entries.
6. Test provider cancellation, failure, timeout, invalid signature/token, mismatched amount, and unknown transaction.
7. Verify a customer cannot view another customer's payment/order by changing an identifier.
8. Place a COD order if enabled; confirm the order is not incorrectly marked as online-paid.
9. As Admin, inspect payment details and initiate a permitted refund in sandbox.
10. Exercise refund approval/rejection/status updates and confirm the order/payment/customer messaging reflects the result.
11. Confirm a refund cannot exceed the paid amount and duplicate refund submissions do not double-refund.
12. Inspect payment history/status timeline and ensure failed attempts remain distinguishable from successful payments.

**Expected:** Payment state is based on trusted provider verification, callbacks are safe to retry, amounts reconcile exactly, and refunds follow authorized transitions.

## 10. Customer orders and vendor fulfillment

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. As Customer A, review order list and open the order created in section 8.
2. Confirm item, seller, price, payment, address, and status history are accurate.
3. As Seller A, open the seller order list and verify only that seller's order lines are visible.
4. Accept a valid order; separately reject a disposable order and confirm customer/admin status updates.
5. Move an accepted order to preparing and ready-for-pickup; verify invalid/out-of-order state changes are blocked.
6. As Customer A, refresh order details and confirm updates appear consistently.
7. Cancel a cancellable order as customer; attempt cancellation after the permitted state and confirm the business rule.
8. As Admin, search/filter orders, open details, and exercise an authorized admin cancellation.
9. Confirm stock and payment status are handled correctly after rejection/cancellation.
10. Verify order notifications are sent once to the relevant customer, seller, and admin channels.

**Expected:** Customer, seller, and admin see consistent order state while each role only accesses permitted records; cancellation/rejection correctly updates inventory and payment workflow.

## 11. Delivery partner application, dispatch, and delivery lifecycle

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Apply as a delivery partner with valid test profile/documents; test missing and invalid fields.
2. As Admin, approve/reject/suspend/reactivate the partner and verify the partner's access changes.
3. Set the approved partner online; confirm offline partners cannot claim jobs.
4. As Vendor, mark the accepted order ready for pickup.
5. As Admin, inspect dispatch queue and manually assign a partner; test assigning an unavailable partner.
6. As a delivery partner, inspect available jobs, claim one, and retry claim after another partner has claimed it.
7. Accept the assignment; verify assigned order/customer details are shown only to the assigned partner.
8. Mark pickup and out-for-delivery; confirm status timeline and customer tracking update.
9. Complete delivery using the required OTP/proof flow if enabled; try invalid OTP and wrong assignment.
10. Test failed delivery with a reason, retry/reassignment, and return-to-vendor flow.
11. Open customer order tracking and confirm status/timeline are accurate without exposing private partner data unnecessarily.
12. Review partner history, active route, tasks, earnings, notifications, and availability state.
13. As Admin, reassign a delivery and inspect assignment history; confirm duplicate/conflicting assignments are prevented.
14. Verify delivery assignment notifications to customer, seller, partner, and admin.
15. As Seller, open shipping details and generate/view a shipping label if the configured carrier workflow supports it; confirm the label contains the correct order and address.

**Expected:** Assignment ownership is exclusive, role-specific actions enforce valid transitions, delivery proof is verified, and tracking/history reflect the actual lifecycle.

## 12. COD handling and operational reconciliation

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Complete a COD order through delivery and record expected cash due.
2. Mark delivery completed and record the collected amount using the configured workflow.
3. Compare COD ledger/dashboard totals with the order and assignment.
4. As Admin, open COD reconciliation and collect/reconcile a test assignment.
5. Test short, excess, duplicate, or missing collection data; confirm discrepancy status and audit trail.
6. Confirm COD state is not represented as a successful online-provider transaction.
7. Confirm a delivery partner cannot reconcile or edit an unrelated partner's collection.

**Expected:** Cash due/collected/outstanding amounts reconcile to delivered orders, changes are auditable, and duplicate collection is prevented.

## 13. Returns, exchanges, and refunds

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

### End-to-End 9-Step Verification Protocol

1. **Step 1: Customer opens My Orders**
   - As Customer, navigate to **My Account > My Orders**.
   - Select an order in **Delivered** status and verify the presence of the **Return / Exchange / Refund** button.
   - Verify that non-delivered orders (pending, processing, shipped, cancelled) do not display the button.

2. **Step 2: Selects product and request type**
   - Select the specific eligible item(s) within the order.
   - Choose the claim type from the supported options:
     - **Return & Refund:** Return the item to seller for full/partial monetary refund.
     - **Exchange for another product:** Request a different size, color, or variant.
     - **Replacement for damaged or defective product:** Request a brand-new identical replacement due to arrival defects.

3. **Step 3: Provides request details**
   - Select standard return/exchange reason from the dropdown (e.g., Defective/Damaged, Wrong Item, Size/Fit, Quality Not as Expected).
   - Enter detailed description explaining the defect or reason.
   - Upload supporting evidence (photos/videos). Verify file type and size validation.
   - Choose preferred resolution method and specify return logistics preference (courier pickup vs drop-off).

4. **Step 4: System checks eligibility**
   - System automatically validates eligibility against:
     - Delivery timestamp vs configured return window (e.g. within 7 calendar days).
     - Non-returnable product category restrictions (perishables, hygiene items, digital goods).
     - Product condition guidelines and applicable statutory consumer protection rights.
   - Verify attempt to submit past the deadline or for restricted items throws clear, user-friendly rejection.

5. **Step 5: Seller / Admin reviews request**
   - Notification delivered to seller portal under **ORDERS > Returns & Issues** (/vendor/returns).
   - Seller audits evidence, photos, and customer narrative.
   - Seller exercises action:
     - **Approve:** Authorizes the return and sets pickup instructions.
     - **Reject:** Declines the request with mandatory rejection reason communicated to customer.
   - Verify Admin dispute override: Admin can view and intervene via /admin/orders/returns, mediate disputes, or approve/reject on behalf of seller.

6. **Step 6: Return logistics & pickup arrangement**
   - System assigns unique alphanumeric return tracking number (e.g. RTN-XXXXXXXX).
   - Generates return shipping instructions or schedules return pickup task.
   - For partner pickup, task is dispatched to delivery partner pool with pickup address and return instructions.

7. **Step 7: Delivery collection & Seller receipt inspection**
   - Delivery partner views return assignment in **Exchanges & Returns** (/delivery/returns).
   - Delivery rider confirms physical collection (POST /delivery-partner/returns/{id}/collect) — verify status updates to collected without schema or conflict errors.
   - Seller confirms receipt of returned parcel.
   - Seller performs physical inspection and records:
     - Inspection date and received condition (good, defective, damaged, missing_parts).
     - Uploads inspection verification photos.
     - Selects inspection result (passed, ailed, partial).

8. **Step 8: Exchange or refund completion**
   - **Exchange / Replacement Path:**
     - Seller confirms dispatched replacement package with new dispatch/tracking reference.
     - Stock ledger decrements replacement inventory accurately.
   - **Refund Path:**
     - Admin / Finance team reviews inspection approval at /admin/orders/returns.
     - Processes monetary refund (original gateway, wallet, or bank transfer).
     - Records formal payment transaction reference number.
     - Platform commission, vendor payout balance, and customer wallet/ledger are updated without double deductions.

9. **Step 9: Request closure & notification audit**
   - Return status transitions to terminal state (completed / 
efunded / closed).
   - Customer receives real-time notification (in-app alert & email).
   - Full timeline/audit history is viewable by Customer, Seller, and Admin.
   - Confirm customer, seller, and admin interfaces reflect identical synchronized final state.

**Expected:** Return, exchange, and replacement lifecycle strictly adheres to the 9-step governance process; eligibility rules prevent invalid claims, physical inspection is documented with media, financial adjustments occur exactly once, and full audit trail is preserved.

## 14. Seller wallet, commission, settlement, and payout

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Complete a paid and delivered order; record gross sale, commission rate, fees/adjustments, and expected seller payable.
2. Verify commission precedence/configuration using applicable product/category/vendor/global rates.
3. Confirm earnings remain pending until delivery and the return-window/settlement eligibility rules are satisfied.
4. As Seller, inspect wallet summary, transactions, earnings, commission, settlements, and payout history.
5. Request a payout to a configured test bank account; submit invalid/over-balance requests as negative cases.
6. As Admin, inspect vendor ledger, transactions, commissions, and payout request.
7. Approve or reject a payout and record the reason; mark a test payout paid only through the supported workflow.
8. Generate a settlement; test hold, release, and distribute paths where eligible.
9. Compare each ledger entry's before/after balance and resulting wallet balance; confirm entries cannot be silently edited.
10. Test duplicate payout/settlement actions and concurrent requests; confirm no double debit/credit.
11. Verify vendor cannot view another seller's ledger, settlement, or payout.

**Expected:** Seller payable equals eligible sales less commission and adjustments; ledger and wallet balance agree, transitions are auditable, and duplicate financial operations are prevented.

## 15. Customer wallet, if enabled

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Open customer wallet and transaction history as Customer A.
2. Confirm available balance and each transaction match the source order/refund/adjustment.
3. Attempt to view Customer B's wallet/transactions by changing an identifier.
4. Verify refunds or credits appear once and are associated with the correct order.

**Expected:** Wallet information is customer-scoped and balances reconcile to recorded transactions. Mark blocked if no customer wallet is configured or exposed.

## 16. Coupons, promotions, campaigns, banners, and content

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. As Admin, create a coupon with validity dates, usage rules, minimum spend, and eligible scope.
2. Edit, deactivate, reactivate, and delete a disposable coupon; confirm state in storefront/checkout.
3. As Seller, create a seller coupon/promotion and verify seller ownership and applicable products.
4. Apply each valid promotion at checkout; verify stacking/precedence follows the configured business rule.
5. Try expired, inactive, exhausted, ineligible, and reused coupons; confirm clear rejection and no improper discount.
6. As Admin, create a campaign and change its status; verify public campaign/deal visibility follows schedule and state.
7. Create/update/remove a banner and confirm storefront rendering, link target, and mobile layout.
8. Create/update/publish/unpublish a CMS page; open its public slug and verify unpublished content is not public.
9. Verify promotion/coupon usage/redemption counts against completed orders and retries.
10. Review seller nominations/promotions and their approval/status workflow; verify only eligible and active items appear in the intended storefront placement.

**Expected:** Only active, eligible promotions are applied; scheduled content and campaign status control public visibility; redemption records and totals are accurate.

## 17. Notifications and communication

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Trigger registration/verification, order, payment, cancellation, delivery assignment, return, refund, support, and payout events from the flows above.
2. Check notification feeds for Customer, Seller, Delivery Partner, and Admin.
3. Compare unread count with unread items; open one notification and mark it read.
4. Mark all as read and clear read items where supported; refresh and verify state persists.
5. Check email templates/branding and test delivery using a mail sandbox or log driver.
6. Exercise notification preferences and confirm opted-out channels behave according to policy.
7. Test a failed notification provider or invalid recipient in non-production; confirm failure/retry visibility without duplicate user notifications.
8. As Admin, send a test notification/broadcast to a controlled test audience; verify only intended recipients receive it and the send result is visible.

**Expected:** Notifications reach the correct audience, are not duplicated, and read/unread state and delivery failures are visible and recoverable.

## 18. Customer, vendor, and admin support

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Create a support ticket as Customer A and as Seller A with category, subject, and description.
2. Submit invalid/empty ticket data and verify validation.
3. Open the ticket, add a message, and verify conversation order and timestamps.
4. As Admin, filter/search tickets, open the ticket, assign it, reply, and close it.
5. As Customer/Seller, reply to or close the ticket; test reopening if supported.
6. Attempt to access Customer B's or another seller's ticket.
7. Verify status, assignee, and message notifications after each transition.

**Expected:** Ticket conversations remain ordered and role-scoped; assignment/status changes are persisted and notifications go to relevant participants.

## 19. Admin users, roles, permissions, audit logs, and settings

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

### Roles and users

1. Sign in as Super Admin and open user list; test search, filters, pagination, and detail.
2. Create or invite a test admin; complete the invitation/set-password flow.
3. Assign a role, then verify the user's available pages/actions match the role's permissions.
4. As restricted Admin, attempt a forbidden route and direct API operation; confirm 403/unauthorized behavior.
5. Suspend and reactivate a disposable user; verify access changes and user-facing messaging.
6. Edit role permissions or create a test role; verify effects, then remove the test role safely.
7. Confirm a non-admin cannot access user/role endpoints or admin pages by URL/API.

### Settings, audit, and logs

1. Review general, branding, commissions, shipping, payments, vendor, and order settings.
2. Change one reversible test setting and verify public/checkout behavior reflects it; restore the original value.
3. Verify invalid settings are rejected and a restricted admin cannot modify them.
4. Perform auditable actions (role change, vendor approval, product approval, payout action); inspect audit logs for actor, action, target, and timestamp.
5. Review system logs and confirm filtering/details are available only to authorized admins.
6. Confirm sensitive values (credentials, tokens, full bank details) are not exposed in UI, API responses, logs, or audit metadata.
7. Review admin dashboard notification feed, role-specific seller/customer bulletins, and notification history for correct audience and unread state.

**Expected:** Administrative controls enforce least privilege, settings persist and affect the intended behavior, and sensitive changes have usable audit history.

## 20. Analytics, reports, tables, and exports

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. As Admin, open dashboard and analytics/performance reports with populated test data.
2. Compare summary totals, sales timeline, orders by status, payment methods, top stores, category share, and province breakdown to source records.
3. As Seller, compare summary, revenue trend, order status, top products, and category share with Seller A's orders only.
4. Apply date range and other available filters; test empty ranges, boundary dates, and invalid ranges.
5. Test search, sort, pagination, and combined filters on order/vendor/customer/payment tables.
6. Export each available report; check columns, totals, selected date range, filename, and encoding.
7. Verify an export excludes unauthorized sellers/customers and does not include unrelated records.
8. Compare a sample of export rows with the corresponding UI and source order/ledger data.

**Expected:** Charts, totals, filters, and exports use consistent source data and respect date/role scope. Record unsupported report/export items as blocked.

## 21. Shipping configuration, location data, and platform settings

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Load public platform config, social provider availability, and country/province/district/municipality selectors.
2. Verify dependent location lists narrow correctly and invalid location combinations are rejected.
3. Test reverse geocoding/location picker if configured; deny location permission and confirm manual entry remains usable.
4. As Admin, create/update/delete a test shipping zone and courier; verify validation and expected effects on checkout.
5. Change shipping fees/free-delivery threshold in test settings; verify checkout calculation at, below, and above the threshold.
6. Upload a permitted image while authenticated; test invalid type/size and confirm stored URL/display behavior.
7. Confirm public configuration contains no secret gateway credentials.

**Expected:** Location and shipping configuration are internally consistent, fees calculate correctly, and uploads/settings are validated and access-controlled.

## 22. SEO, public metadata, and crawl endpoints

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Open public home, category, product, store, and CMS pages; inspect title, description, canonical URL, Open Graph metadata, and verification tags.
2. Inspect public sitemap index and supported sitemap documents; confirm URLs are valid and do not include private/admin pages.
3. Inspect `robots.txt`; verify configured rules do not accidentally block intended public pages or expose private routes.
4. As Admin, update a test meta entry/template/keyword/redirect and confirm public output changes as expected.
5. Run SEO audit, inspect findings, resolve a disposable finding, and verify audit history.
6. Attempt SEO settings access as a non-admin.

**Expected:** Public metadata and crawl files are valid and consistent; admin SEO changes are permission-protected and do not expose private content.

## 23. Cross-browser, responsive, accessibility, and resilience checks

**Result:** [ ] Pass [ ] Fail [ ] Blocked  
**Evidence / defect:** 

1. Repeat the smoke flow in the supported desktop and mobile browsers.
2. Check common viewport sizes for clipped content, horizontal overflow, broken dialogs, unusable tables, and inaccessible navigation.
3. Navigate key registration, checkout, and admin forms with keyboard only; confirm focus visibility, labels, and usable error messages.
4. Test slow/offline network during a read request and a form submission; confirm loading, retry, and error states do not imply false success.
5. Refresh pages with unsaved forms and after completed payment/order actions; confirm no unintended duplicate submissions.
6. Review browser console and network failures for errors during each critical flow.
7. Confirm unknown pages, empty lists, expired sessions, and API validation errors have clear recovery paths.

**Expected:** Critical tasks remain usable on supported devices, failures are explicit, and retries do not create duplicate financial or order actions.

## 24. Release verification and sign-off

1. Run the automated backend suite: `php artisan test`.
2. Run `npm run build` from the `frontend\` directory.
3. Run database migration/seed validation only on a disposable test database; never run destructive migration commands against shared or production data.
4. Re-run failed critical flows after fixes and attach evidence to each defect.
5. Confirm all P0 flows are passed or explicitly accepted as release blockers by the owner.
6. Record blocked features and their owner/target date; do not mark unavailable functionality as passed.
7. Save a copy of the completed checklist with environment/build details and tester sign-off.

| Sign-off | Name | Date | Notes |
|---|---|---|---|
| QA | | | |
| Product / Operations | | | |
| Engineering | | | |
