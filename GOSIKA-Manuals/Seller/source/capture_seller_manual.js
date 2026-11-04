/**
 * GOSIKA Seller Portal – Phase 1 Screenshot Automation
 * =====================================================
 * Playwright script that:
 *   1. Opens the Seller Login page and pauses for manual login.
 *   2. After login confirmation, navigates through every accessible
 *      Seller Portal page in the documented order.
 *   3. Captures high-quality full-page and viewport screenshots.
 *   4. Saves a screenshot-to-step JSON manifest for the PDF generator.
 *
 * Usage:
 *   node capture_seller_manual.cjs
 *
 * Prerequisites:
 *   npx playwright install chromium
 */

const { chromium } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');
const readline = require('readline');

// ── Configuration ──────────────────────────────────────────────────────────
const BASE_URL    = 'http://localhost:8000';
const SS_DIR      = path.resolve(__dirname, '../screenshots');
const MANIFEST_PATH = path.resolve(__dirname, 'screenshot-manifest.json');

const VIEWPORT = { width: 1440, height: 1000 };
const NAV_TIMEOUT   = 30_000;
const LOAD_WAIT     = 2_000;   // ms after navigation before screenshot
const SCROLL_WAIT   = 500;

// ── Helpers ─────────────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function waitForUser(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans); }));
}

async function waitForPageLoad(page) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
  } catch {
    await page.waitForLoadState('domcontentloaded', { timeout: 10_000 });
  }
  await page.waitForTimeout(LOAD_WAIT);
}

async function hideSensitiveInfo(page) {
  // Mask phone numbers, emails, bank account numbers with blur/redaction
  await page.evaluate(() => {
    const selectors = [
      '[data-sensitive]',
      'input[type="password"]',
      'input[name*="phone"]',
      'input[name*="email"]',
      'input[name*="account"]',
      'input[name*="bank"]',
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.filter = 'blur(8px)';
      });
    });
  });
}

/**
 * Take a screenshot and add it to the manifest.
 * @param {import('@playwright/test').Page} page
 * @param {string} filename   - e.g. "01-login-page.png"
 * @param {string} caption    - Human-readable caption
 * @param {Object} manifest   - Manifest object to mutate
 * @param {boolean} fullPage  - Whether to capture the full scrollable page
 */
async function capture(page, filename, caption, manifest, fullPage = true) {
  await hideSensitiveInfo(page);
  const filePath = path.join(SS_DIR, filename);
  await page.screenshot({
    path: filePath,
    fullPage,
    type: 'png',
  });
  console.log(`  📸  ${filename}`);
  manifest.screenshots.push({ filename, caption, path: filePath });
  return filePath;
}

/**
 * Navigate to a URL and wait for the page to settle.
 */
async function goto(page, url) {
  const full = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  await page.goto(full, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  await waitForPageLoad(page);
}

/**
 * Try clicking a sidebar link by its text, with fallback navigation.
 */
async function clickSidebarLink(page, text, fallbackUrl) {
  try {
    const link = page.locator(`nav a:has-text("${text}"), aside a:has-text("${text}"), [role="navigation"] a:has-text("${text}")`).first();
    if (await link.isVisible({ timeout: 3_000 })) {
      await link.click();
      await waitForPageLoad(page);
      return true;
    }
  } catch {}
  if (fallbackUrl) {
    await goto(page, fallbackUrl);
    return true;
  }
  return false;
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  ensureDir(SS_DIR);

  const manifest = {
    generated: new Date().toISOString(),
    base_url: BASE_URL,
    screenshots: [],
    inaccessible: [],
    notes: [],
  };

  console.log('\n🚀  GOSIKA Seller Portal – Phase 1 Screenshot Automation');
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'Asia/Kathmandu',
  });

  const page = await context.newPage();

  // ── STEP 1 · Login Page ────────────────────────────────────────────────
  console.log('\n[A] Getting Started');
  await goto(page, '/seller/login');
  await capture(page, '01-seller-login-page.png', 'Seller Login Page', manifest, false);

  console.log('\n⚠️   MANUAL LOGIN REQUIRED');
  console.log('    The browser is open. Please log in to your seller account.');
  console.log('    After you are fully logged in and the dashboard is visible,');
  await waitForUser('    press ENTER here to continue ...');

  // ── STEP 2 · Dashboard ─────────────────────────────────────────────────
  // After login, navigate to vendor dashboard
  await goto(page, '/vendor');
  await waitForPageLoad(page);
  await capture(page, '02-seller-dashboard.png', 'Seller Dashboard – Overview', manifest, true);

  // Sidebar screenshot (viewport only so sidebar is fully visible)
  await capture(page, '03-sidebar-navigation.png', 'Sidebar Navigation Menu', manifest, false);

  // ── Notifications ──────────────────────────────────────────────────────
  console.log('\n  → Notifications');
  const notifResult = await clickSidebarLink(page, 'Notifications', '/vendor/notifications');
  if (notifResult) {
    await capture(page, '04-notifications.png', 'Notifications Page', manifest, true);
  } else {
    manifest.inaccessible.push({ page: 'Notifications', reason: 'Link not found' });
  }

  // ── [B] STORE MANAGEMENT ───────────────────────────────────────────────
  console.log('\n[B] Store Management');

  // Store Profile / My Stores
  await goto(page, '/vendor/stores');
  await capture(page, '05-store-profile.png', 'My Stores – Store List', manifest, true);

  // Store Edit
  try {
    const editBtn = page.locator('a[href*="/stores/"][href*="/edit"], button:has-text("Edit"), a:has-text("Edit Store")').first();
    if (await editBtn.isVisible({ timeout: 4_000 })) {
      await editBtn.click();
      await waitForPageLoad(page);
      await capture(page, '06-store-edit.png', 'Store Edit Page', manifest, true);
      await page.goBack();
      await waitForPageLoad(page);
    } else {
      manifest.inaccessible.push({ page: 'Store Edit', reason: 'No edit button found' });
    }
  } catch (e) {
    manifest.inaccessible.push({ page: 'Store Edit', reason: e.message });
  }

  // Store Settings
  await goto(page, '/vendor/store-settings');
  await capture(page, '07-store-settings.png', 'Store Settings', manifest, true);

  // ── [C] PRODUCT MANAGEMENT ────────────────────────────────────────────
  console.log('\n[C] Product Management');

  await goto(page, '/vendor/products');
  await capture(page, '08-my-products.png', 'My Products – Product List', manifest, true);

  // Product filters / search bar (viewport)
  await capture(page, '09-product-filters.png', 'Product Search and Filters', manifest, false);

  // Add Product form – actual route is /vendor/products/new
  await goto(page, '/vendor/products/new');
  await capture(page, '10-add-product-form.png', 'Add Product – Form (top)', manifest, false);
  // Scroll down to capture more fields
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(SCROLL_WAIT);
  await capture(page, '11-add-product-form-scroll.png', 'Add Product – Form (continued)', manifest, false);
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(SCROLL_WAIT);
  await capture(page, '12-add-product-form-bottom.png', 'Add Product – Form (bottom / save controls)', manifest, false);

  // Try to open an existing product detail/edit
  await goto(page, '/vendor/products');
  await waitForPageLoad(page);
  try {
    const editLink = page.locator('a[href*="/products/"][href*="/edit"], button:has-text("Edit"), [title="Edit"]').first();
    if (await editLink.isVisible({ timeout: 3_000 })) {
      await editLink.click();
      await waitForPageLoad(page);
      await capture(page, '13-product-edit.png', 'Edit Product Page', manifest, true);
      await page.goBack();
      await waitForPageLoad(page);
    } else {
      manifest.inaccessible.push({ page: 'Product Edit', reason: 'No existing products to edit or edit button not found' });
    }
  } catch (e) {
    manifest.inaccessible.push({ page: 'Product Edit', reason: e.message });
  }

  // ── [D] INVENTORY ─────────────────────────────────────────────────────
  console.log('\n[D] Inventory');

  await goto(page, '/vendor/inventory');
  await capture(page, '14-inventory.png', 'Inventory Management', manifest, true);

  // Try low-stock via dedicated URL
  await goto(page, '/vendor/inventory/low-stock');
  await capture(page, '15-low-stock.png', 'Inventory – Low Stock View', manifest, true);

  // ── [E] ORDER MANAGEMENT ──────────────────────────────────────────────
  console.log('\n[E] Order Management');

  await goto(page, '/vendor/orders');
  await capture(page, '16-all-orders.png', 'All Orders', manifest, true);
  await capture(page, '17-order-filters.png', 'Order Search and Filters', manifest, false);

  // Order detail – try to open the first available order
  try {
    const firstOrderLink = page.locator('table tbody tr td a, .order-row a').first();
    if (await firstOrderLink.isVisible({ timeout: 3_000 })) {
      const href = await firstOrderLink.getAttribute('href');
      await firstOrderLink.click();
      await waitForPageLoad(page);
      await capture(page, '18-order-detail.png', 'Order Detail Page', manifest, true);
      await page.goBack();
      await waitForPageLoad(page);
    } else {
      manifest.inaccessible.push({ page: 'Order Detail', reason: 'No orders found to open' });
    }
  } catch (e) {
    manifest.inaccessible.push({ page: 'Order Detail', reason: e.message });
  }

  // Status tabs – Pending / To Ship / Shipped
  const orderStatusTabs = [
    { label: 'Pending',  file: '19-orders-pending.png',  caption: 'Pending Orders' },
    { label: 'To Ship',  file: '20-orders-to-ship.png',  caption: 'Orders – To Ship' },
    { label: 'Shipped',  file: '21-orders-shipped.png',  caption: 'Shipped Orders' },
  ];
  for (const tab of orderStatusTabs) {
    try {
      const tabEl = page.locator(`button:has-text("${tab.label}"), a:has-text("${tab.label}"), [role="tab"]:has-text("${tab.label}")`).first();
      if (await tabEl.isVisible({ timeout: 3_000 })) {
        await tabEl.click();
        await waitForPageLoad(page);
        await capture(page, tab.file, tab.caption, manifest, true);
      } else {
        manifest.inaccessible.push({ page: tab.caption, reason: 'Tab not found' });
      }
    } catch (e) {
      manifest.inaccessible.push({ page: tab.caption, reason: e.message });
    }
  }

  // ── [F] RETURNS AND REVIEWS ───────────────────────────────────────────
  console.log('\n[F] Returns and Reviews');

  await goto(page, '/vendor/returns');
  await capture(page, '22-returns-issues.png', 'Returns and Issues', manifest, true);

  await goto(page, '/vendor/reviews');
  await capture(page, '23-reviews-qa.png', 'Reviews and Q&A', manifest, true);

  // ── [G] PROMOTIONS ────────────────────────────────────────────────────
  console.log('\n[G] Promotions');

  await goto(page, '/vendor/discounts');
  await capture(page, '24-discounts.png', 'Discounts', manifest, true);

  await goto(page, '/vendor/coupons');
  await capture(page, '25-coupons-vouchers.png', 'Coupons and Vouchers', manifest, true);

  await goto(page, '/vendor/promotions');
  await capture(page, '26-promotions-campaigns.png', 'Promotions and Campaigns', manifest, true);

  // ── [H] FINANCE ───────────────────────────────────────────────────────
  console.log('\n[H] Finance');

  await goto(page, '/vendor/wallet');
  await capture(page, '27-wallet.png', 'Wallet Overview', manifest, true);

  await goto(page, '/vendor/transactions');
  await capture(page, '28-transactions.png', 'Transaction History', manifest, true);

  await goto(page, '/vendor/payouts');
  await capture(page, '29-payouts.png', 'Payouts', manifest, true);

  await goto(page, '/vendor/settlements');
  await capture(page, '30-settlements.png', 'Settlements', manifest, true);

  await goto(page, '/vendor/earnings');
  await capture(page, '31-earnings.png', 'Earnings Overview', manifest, true);

  await goto(page, '/vendor/commission');
  await capture(page, '32-commission.png', 'Commission Information', manifest, true);

  await goto(page, '/vendor/analytics');
  await capture(page, '33-analytics.png', 'Analytics Dashboard', manifest, true);

  // ── [I] SHIPPING ──────────────────────────────────────────────────────
  console.log('\n[I] Shipping');

  await goto(page, '/vendor/shipping');
  await capture(page, '34-pickup-locations.png', 'Pickup Locations / Shipping Setup', manifest, true);

  await goto(page, '/vendor/shipping/labels');
  await capture(page, '35-shipping-labels.png', 'Shipping Labels', manifest, true);

  // ── [J] ACCOUNT AND SUPPORT ───────────────────────────────────────────
  console.log('\n[J] Account and Support');

  await goto(page, '/vendor/profile');
  await capture(page, '36-vendor-profile.png', 'Vendor Profile', manifest, true);

  await goto(page, '/vendor/security');
  await capture(page, '37-security.png', 'Security Settings', manifest, true);

  await goto(page, '/vendor/verification');
  await capture(page, '38-kyc-verification.png', 'KYC Verification', manifest, true);

  await goto(page, '/vendor/bank-accounts');
  await capture(page, '39-bank-accounts.png', 'Bank Accounts', manifest, true);

  await goto(page, '/vendor/notifications');
  await capture(page, '40-notifications-settings.png', 'Notification Preferences', manifest, true);

  await goto(page, '/vendor/support');
  await capture(page, '41-support.png', 'Support Centre', manifest, true);

  await goto(page, '/vendor/support/new');
  await capture(page, '42-new-support-ticket.png', 'New Support Ticket', manifest, true);

  await goto(page, '/vendor/brand-requests');
  await capture(page, '43-brand-requests.png', 'Brand Requests', manifest, true);

  // ── Save manifest ──────────────────────────────────────────────────────
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\n✅  Screenshot capture complete.`);
  console.log(`    ${manifest.screenshots.length} screenshots saved to: ${SS_DIR}`);
  console.log(`    Manifest: ${MANIFEST_PATH}`);
  if (manifest.inaccessible.length) {
    console.log(`\n⚠️   Inaccessible pages (${manifest.inaccessible.length}):`);
    manifest.inaccessible.forEach(i => console.log(`    - ${i.page}: ${i.reason}`));
  }

  await browser.close();
  console.log('\n🎉  Browser closed. Run generate_pdf.py next.\n');
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
