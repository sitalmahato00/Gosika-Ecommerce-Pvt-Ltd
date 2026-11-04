/**
 * GOSIKA Seller Portal – Phase 1 Screenshot Automation
 * =====================================================
 * Credentials are passed as environment variables at runtime:
 *   GOSIKA_EMAIL=... GOSIKA_PASSWORD=... node capture_seller_manual.cjs
 * Or embedded inline when the user explicitly provides them.
 */

'use strict';

const { chromium } = require('@playwright/test');
const fs           = require('fs');
const path         = require('path');

// ── Configuration ─────────────────────────────────────────────────────────
const BASE_URL   = 'http://localhost:8000';
const SS_DIR     = path.resolve(__dirname, '..', 'screenshots');
const SRC_DIR    = path.resolve(__dirname);
const MANIFEST   = path.join(SRC_DIR, 'screenshot-manifest.json');

// Credentials (provided by user at runtime – not stored in repo)
const EMAIL    = process.env.GOSIKA_EMAIL    || '';
const PASSWORD = process.env.GOSIKA_PASSWORD || '';

const VIEWPORT     = { width: 1440, height: 1000 };
const LOAD_WAIT    = 2500;   // ms after navigation
const SCROLL_WAIT  = 600;
const NAV_TIMEOUT  = 30_000;

// ── Helpers ───────────────────────────────────────────────────────────────
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

async function settle(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 18_000 }); } catch {}
  await page.waitForTimeout(LOAD_WAIT);
}

async function goto(page, url) {
  const full = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  try {
    await page.goto(full, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  } catch {}
  await settle(page);
}

async function capture(page, file, caption, manifest, fullPage = true) {
  // Lightly redact obvious sensitive fields
  await page.evaluate(() => {
    document.querySelectorAll(
      'input[type=password], [data-sensitive], input[name*=account_no], input[name*=bank_no]'
    ).forEach(el => { el.style.filter = 'blur(8px)'; });
  });
  const fp = path.join(SS_DIR, file);
  await page.screenshot({ path: fp, fullPage, type: 'png' });
  console.log(`  📸  ${file}`);
  manifest.screenshots.push({ filename: file, caption, path: fp });
}

async function tryCapture(page, file, caption, manifest, url, fullPage = true) {
  try {
    if (url) await goto(page, url);
    // If we landed on a redirect/404/login page, skip
    const cur = page.url();
    if (cur.includes('/seller/login') || cur.includes('/login')) {
      manifest.inaccessible.push({ page: caption, reason: 'Redirected to login – not accessible with current session' });
      return false;
    }
    await capture(page, file, caption, manifest, fullPage);
    return true;
  } catch (e) {
    manifest.inaccessible.push({ page: caption, reason: String(e.message || e) });
    console.log(`  ⚠️  Skipped ${file}: ${e.message}`);
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
(async () => {
  ensureDir(SS_DIR);

  const manifest = {
    generated    : new Date().toISOString(),
    base_url     : BASE_URL,
    screenshots  : [],
    inaccessible : [],
    notes        : [],
  };

  console.log('\n🚀  GOSIKA Seller Portal – Phase 1 Screenshot Automation');
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 80,
    args: ['--start-maximized'],
  });

  const ctx = await browser.newContext({
    viewport         : VIEWPORT,
    deviceScaleFactor: 1,
    locale           : 'en-US',
    timezoneId       : 'Asia/Kathmandu',
  });

  const page = await ctx.newPage();

  // ════════════════════════════════════════════════════════════════════════
  // A · LOGIN
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[A] Getting Started');
  await goto(page, '/seller/login');
  await capture(page, '01-seller-login-page.png', 'Seller Login Page', manifest, false);

  console.log('  → Filling login form …');

  // Fill email
  const emailSel = 'input[type=email], input[name=email], input[placeholder*=email i], input[placeholder*=Email]';
  await page.locator(emailSel).first().fill(EMAIL);
  await page.waitForTimeout(400);

  // Fill password
  const pwSel = 'input[type=password], input[name=password]';
  await page.locator(pwSel).first().fill(PASSWORD);
  await page.waitForTimeout(400);

  // Screenshot with form filled (password field blurred by our redact helper)
  await capture(page, '01b-login-form-filled.png', 'Seller Login – Credentials Entered', manifest, false);

  // Submit
  const submitSel = 'button[type=submit], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Log In")';
  await page.locator(submitSel).first().click();
  console.log('  → Submitted – waiting for dashboard …');
  await page.waitForURL(url => !url.includes('/seller/login') && !url.includes('/login'), { timeout: 15_000 }).catch(() => {});
  await settle(page);

  // Confirm we are logged in
  const afterUrl = page.url();
  if (afterUrl.includes('/seller/login') || afterUrl.includes('/login')) {
    console.error('\n❌  Login failed – still on login page. Check credentials or app state.');
    await browser.close();
    process.exit(1);
  }
  console.log(`  ✅  Logged in. Current URL: ${afterUrl}`);

  // ════════════════════════════════════════════════════════════════════════
  // A · DASHBOARD & NAVIGATION
  // ════════════════════════════════════════════════════════════════════════
  await goto(page, '/vendor');
  await capture(page, '02-seller-dashboard.png', 'Seller Dashboard – Overview', manifest, true);
  // Viewport-only shot to show the full sidebar
  await capture(page, '03-sidebar-navigation.png', 'Sidebar Navigation Menu', manifest, false);

  // Notifications
  await tryCapture(page, '04-notifications.png', 'Notifications', manifest, '/vendor/notifications', true);

  // ════════════════════════════════════════════════════════════════════════
  // B · STORE MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[B] Store Management');

  await tryCapture(page, '05-store-profile.png', 'My Stores – Store List', manifest, '/vendor/stores', true);

  // Try to open the store edit page
  await goto(page, '/vendor/stores');
  try {
    const editBtn = page.locator('a[href*="/stores"][href*="edit"], a[href="/vendor/stores/edit"], button:has-text("Edit"), a:has-text("Edit")').first();
    if (await editBtn.isVisible({ timeout: 4_000 })) {
      const href = await editBtn.getAttribute('href').catch(() => null);
      if (href) {
        await goto(page, href.startsWith('http') ? href : `${BASE_URL}${href}`);
      } else {
        await editBtn.click();
        await settle(page);
      }
      await capture(page, '06-store-edit.png', 'Store Edit Page', manifest, true);
    } else {
      // Try direct URL
      await tryCapture(page, '06-store-edit.png', 'Store Edit Page', manifest, '/vendor/stores/edit', true);
    }
  } catch (e) {
    await tryCapture(page, '06-store-edit.png', 'Store Edit Page', manifest, '/vendor/stores/edit', true);
  }

  await tryCapture(page, '07-store-settings.png', 'Store Settings', manifest, '/vendor/store-settings', true);

  // ════════════════════════════════════════════════════════════════════════
  // C · PRODUCT MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[C] Product Management');

  await tryCapture(page, '08-my-products.png', 'My Products – Product List', manifest, '/vendor/products', true);
  await capture(page, '09-product-filters.png', 'Product Search and Filters (viewport)', manifest, false);

  // Approval tab
  await tryCapture(page, '09b-product-approval.png', 'Product Approval Status View', manifest, '/vendor/products/approval', true);

  // Add Product form
  await goto(page, '/vendor/products/new');
  if (!page.url().includes('/login')) {
    await capture(page, '10-add-product-form-top.png', 'Add Product – Form Top', manifest, false);
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(SCROLL_WAIT);
    await capture(page, '11-add-product-form-mid.png', 'Add Product – Form Middle', manifest, false);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(SCROLL_WAIT);
    await capture(page, '12-add-product-form-bottom.png', 'Add Product – Form Bottom / Save Controls', manifest, false);
    manifest.screenshots.push({ filename: '10-11-12-combined', caption: 'Add Product Form (3 panels)', path: '' });
    manifest.screenshots.pop(); // remove the fake combined entry
  } else {
    manifest.inaccessible.push({ page: 'Add Product Form', reason: 'Redirected to login' });
  }

  // Edit an existing product
  await goto(page, '/vendor/products');
  try {
    // Look for any edit link in the product list
    const editLink = await page.locator('a[href*="/products/"][href*="/edit"]').first();
    const isVis = await editLink.isVisible({ timeout: 3_000 }).catch(() => false);
    if (isVis) {
      const href = await editLink.getAttribute('href');
      await goto(page, href.startsWith('http') ? href : `${BASE_URL}${href}`);
      await capture(page, '13-product-edit.png', 'Edit Product Page', manifest, true);
    } else {
      manifest.inaccessible.push({ page: 'Edit Product', reason: 'No products with edit links found' });
    }
  } catch (e) {
    manifest.inaccessible.push({ page: 'Edit Product', reason: String(e.message) });
  }

  // ════════════════════════════════════════════════════════════════════════
  // D · INVENTORY
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[D] Inventory');

  await tryCapture(page, '14-inventory.png', 'Inventory Management', manifest, '/vendor/inventory', true);
  await tryCapture(page, '15-low-stock.png', 'Inventory – Low Stock View', manifest, '/vendor/inventory/low-stock', true);

  // ════════════════════════════════════════════════════════════════════════
  // E · ORDER MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[E] Order Management');

  await tryCapture(page, '16-all-orders.png', 'All Orders', manifest, '/vendor/orders', true);
  await capture(page, '17-order-filters.png', 'Order Search and Filters (viewport)', manifest, false);

  // Order detail – first available order
  await goto(page, '/vendor/orders');
  try {
    const firstRow = page.locator('table tbody tr').first();
    const isVis = await firstRow.isVisible({ timeout: 3_000 }).catch(() => false);
    if (isVis) {
      // Try clicking the row or a View/Detail link
      const detailLink = page.locator('table tbody tr:first-child a, table tbody tr:first-child td:last-child a, a[href*="/orders/"]').first();
      const linkVis = await detailLink.isVisible({ timeout: 2_000 }).catch(() => false);
      if (linkVis) {
        const href = await detailLink.getAttribute('href').catch(() => null);
        if (href) {
          await goto(page, href.startsWith('http') ? href : `${BASE_URL}${href}`);
          await capture(page, '18-order-detail.png', 'Order Detail Page', manifest, true);
          await page.goBack(); await settle(page);
        }
      } else {
        await firstRow.click().catch(() => {});
        await settle(page);
        if (!page.url().includes('/vendor/orders') || page.url().match(/\/orders\/\d/)) {
          await capture(page, '18-order-detail.png', 'Order Detail Page', manifest, true);
          await page.goBack(); await settle(page);
        } else {
          manifest.inaccessible.push({ page: 'Order Detail', reason: 'Row click did not navigate to detail' });
        }
      }
    } else {
      manifest.inaccessible.push({ page: 'Order Detail', reason: 'No orders found in the list' });
    }
  } catch (e) {
    manifest.inaccessible.push({ page: 'Order Detail', reason: String(e.message) });
  }

  // Ready-to-ship / shipped views
  await tryCapture(page, '19-orders-pending.png', 'Pending Orders', manifest, '/vendor/orders', true);

  // Try status tab filters on the orders page
  await goto(page, '/vendor/orders');
  const statusTabs = [
    { text: 'Pending',  file: '19b-orders-pending-tab.png',  caption: 'Orders – Pending Tab' },
    { text: 'Ready',    file: '20-orders-ready.png',         caption: 'Orders – Ready to Ship' },
    { text: 'Shipped',  file: '21-orders-shipped.png',       caption: 'Orders – Shipped' },
  ];
  for (const t of statusTabs) {
    try {
      const tab = page.locator(
        `button:has-text("${t.text}"), [role="tab"]:has-text("${t.text}"), a:has-text("${t.text}")`
      ).first();
      if (await tab.isVisible({ timeout: 2_500 })) {
        await tab.click();
        await settle(page);
        await capture(page, t.file, t.caption, manifest, true);
      } else {
        manifest.notes.push(`Tab "${t.text}" not found on Orders page`);
      }
    } catch {}
  }

  // Dedicated ready/shipped URLs
  await tryCapture(page, '20b-orders-to-ship.png', 'Orders – To Ship (URL)', manifest, '/vendor/orders/ready', true);
  await tryCapture(page, '21b-orders-shipped.png', 'Orders – Shipped (URL)', manifest, '/vendor/orders/shipped', true);

  // ════════════════════════════════════════════════════════════════════════
  // F · RETURNS & REVIEWS
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[F] Returns and Reviews');

  await tryCapture(page, '22-returns-issues.png', 'Returns and Issues', manifest, '/vendor/returns', true);
  await tryCapture(page, '23-reviews-qa.png', 'Reviews and Q&A', manifest, '/vendor/reviews', true);

  // ════════════════════════════════════════════════════════════════════════
  // G · PROMOTIONS
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[G] Promotions');

  await tryCapture(page, '24-discounts.png', 'Discounts', manifest, '/vendor/discounts', true);
  await tryCapture(page, '25-coupons-vouchers.png', 'Coupons and Vouchers', manifest, '/vendor/coupons', true);
  await tryCapture(page, '26-promotions-campaigns.png', 'Promotions and Campaigns', manifest, '/vendor/promotions', true);

  // ════════════════════════════════════════════════════════════════════════
  // H · FINANCE
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[H] Finance');

  await tryCapture(page, '27-wallet.png', 'Wallet Overview', manifest, '/vendor/wallet', true);
  await tryCapture(page, '28-transactions.png', 'Transaction History', manifest, '/vendor/transactions', true);
  await tryCapture(page, '29-payouts.png', 'Payouts', manifest, '/vendor/payouts', true);
  await tryCapture(page, '30-settlements.png', 'Settlements', manifest, '/vendor/settlements', true);
  await tryCapture(page, '31-earnings.png', 'Earnings Overview', manifest, '/vendor/earnings', true);
  await tryCapture(page, '32-commission.png', 'Commission Information', manifest, '/vendor/commission', true);
  await tryCapture(page, '33-analytics.png', 'Analytics Dashboard', manifest, '/vendor/analytics', true);

  // ════════════════════════════════════════════════════════════════════════
  // I · SHIPPING
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[I] Shipping');

  await tryCapture(page, '34-pickup-locations.png', 'Pickup Locations / Shipping Setup', manifest, '/vendor/shipping', true);
  await tryCapture(page, '35-shipping-labels.png', 'Shipping Labels', manifest, '/vendor/shipping/labels', true);

  // ════════════════════════════════════════════════════════════════════════
  // J · ACCOUNT & SUPPORT
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n[J] Account and Support');

  await tryCapture(page, '36-vendor-profile.png', 'Vendor Profile', manifest, '/vendor/profile', true);
  await tryCapture(page, '37-security.png', 'Security Settings', manifest, '/vendor/security', true);
  await tryCapture(page, '38-kyc-verification.png', 'KYC Verification', manifest, '/vendor/verification', true);
  await tryCapture(page, '39-bank-accounts.png', 'Bank Accounts', manifest, '/vendor/bank-accounts', true);
  await tryCapture(page, '40-notification-prefs.png', 'Notification Preferences', manifest, '/vendor/notifications', true);
  await tryCapture(page, '41-support.png', 'Support Centre', manifest, '/vendor/support', true);
  await tryCapture(page, '42-new-support-ticket.png', 'New Support Ticket', manifest, '/vendor/support/new', true);
  await tryCapture(page, '43-brand-requests.png', 'Brand Requests', manifest, '/vendor/brand-requests', true);

  // ════════════════════════════════════════════════════════════════════════
  // WRAP UP
  // ════════════════════════════════════════════════════════════════════════
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('\n' + '='.repeat(60));
  console.log(`✅  DONE: ${manifest.screenshots.length} screenshots captured`);
  console.log(`📁  Saved to: ${SS_DIR}`);
  if (manifest.inaccessible.length) {
    console.log(`\n⚠️  ${manifest.inaccessible.length} pages were inaccessible:`);
    manifest.inaccessible.forEach(i => console.log(`   - ${i.page}: ${i.reason}`));
  }
  if (manifest.notes.length) {
    console.log(`\n📝  Notes:`);
    manifest.notes.forEach(n => console.log(`   - ${n}`));
  }
  console.log(`\n📋  Manifest: ${MANIFEST}`);
  console.log('▶️   Run next:  python generate_pdf.py\n');

  await browser.close();
})().catch(err => {
  console.error('\n❌  Fatal error:', err);
  process.exit(1);
});
