#!/usr/bin/env python3
"""
GOSIKA Seller Portal – Phase 1 PDF Generator (Sidebar-Synchronized Edition)
==========================================================================
Generates GOSIKA-Seller-User-Manual-Phase-1.pdf based STRICTLY on the actual
pages and features displayed in the live GOSIKA Seller Portal sidebar navigation
(VENDOR_NAV):
  • Getting Started (Seller Login & Sidebar Navigation)
  • STORE (Dashboard, Store Profile, Store Settings)
  • ORDERS (All Orders, To Ship, Shipped, Returns & Issues)
  • PRODUCTS (My Products, Add Product, Edit Product, Approval Status, Low Stock, Reviews & Q&A)
  • PROMOTIONS (Campaigns, Vouchers)
  • FINANCE (Wallet, Payouts, Settlements)
  • SHIPPING (Pickup Locations, Shipping Labels)
  • ACCOUNT (Profile, KYC Verification, Bank Account, Security, Notifications, Support)

Requirements:
    pip install reportlab pillow

Usage:
    python generate_pdf.py
"""

import json
import os
import shutil
import sys
from pathlib import Path
from datetime import datetime

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm, mm
    from reportlab.lib.colors import HexColor, white, black, Color
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak,
        Table, TableStyle, HRFlowable, KeepTogether
    )
    from reportlab.pdfgen import canvas
except ImportError:
    print("ERROR: ReportLab not installed. Run: pip install reportlab")
    sys.exit(1)

try:
    from PIL import Image as PILImage
except ImportError:
    PILImage = None

# ── Paths ───────────────────────────────────────────────────────────────────
SOURCE_DIR    = Path(__file__).resolve().parent
BASE_DIR      = SOURCE_DIR.parent                      # GOSIKA-Manuals/Seller
PROJECT_DIR   = BASE_DIR.parent.parent                 # Gosika Ecommerce root
SS_DIR        = BASE_DIR / "screenshots"
MANIFEST_PATH = SOURCE_DIR / "screenshot-manifest.json"
OUTPUT_PDF    = BASE_DIR / "GOSIKA-Seller-User-Manual-Phase-1.pdf"

# Project copy destinations
PROJECT_MANUAL_DIR = PROJECT_DIR / "manuals" / "vendor"
PUBLIC_MANUAL_DIR  = PROJECT_DIR / "public" / "manuals"

# ── Brand Colors ─────────────────────────────────────────────────────────────
GOSIKA_ORANGE  = HexColor("#FF5500")
GOSIKA_DARK    = HexColor("#1A1A1A")
GOSIKA_LIGHT   = HexColor("#FFF5F0")
GOSIKA_GRAY    = HexColor("#666666")
GOSIKA_BORDER  = HexColor("#DDDDDD")
GOSIKA_ACCENT  = HexColor("#FF8C00")

# ── Page Sizes ───────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN         = 2.0 * cm
CONTENT_W      = PAGE_W - 2 * MARGIN

# ── Sidebar-Synchronized Chapter Definitions ─────────────────────────────────
# Exactly matching VENDOR_NAV in frontend/src/utils/constants.js
CHAPTERS = [
    {
        "id": "1",
        "title": "Portal Entry & Navigation",
        "description": "How to authenticate your seller account, access the GOSIKA Seller Portal, and navigate using the responsive sidebar menu.",
        "sections": [
            {
                "title": "Seller Login",
                "purpose": "Secure authentication gate providing authorized vendors access to their store management dashboard.",
                "access": "Navigate to http://localhost:8000/seller/login",
                "screenshots": ["01-seller-login-page.png", "01b-login-form-filled.png"],
                "steps": [
                    "Open the browser and visit the Seller Login URL.",
                    "Enter your registered seller email address.",
                    "Enter your password.",
                    "Click 'Sign In' to authenticate.",
                    "Upon successful authentication, the system redirects to the Vendor Dashboard.",
                ],
                "result": "You are securely signed in and the Seller Portal workspace loads.",
                "warnings": ["Never share your login credentials or OTP codes with third parties."],
            },
            {
                "title": "Sidebar Navigation Overview",
                "purpose": "The primary sidebar menu groups all vendor operations into logical sections: STORE, ORDERS, PRODUCTS, PROMOTIONS, FINANCE, SHIPPING, and ACCOUNT.",
                "access": "Always accessible on the left edge of all Seller Portal pages (/vendor/*).",
                "screenshots": ["03-sidebar-navigation.png"],
                "steps": [
                    "Locate the dark navigation sidebar along the left edge of the screen.",
                    "Review the section headers: STORE, ORDERS, PRODUCTS, PROMOTIONS, FINANCE, SHIPPING, and ACCOUNT.",
                    "Click any menu item to switch instantly to that operational section.",
                    "On mobile or small viewports, click the top menu toggle to expand or collapse the sidebar.",
                ],
                "result": "Fast, direct access to any store management function in the platform.",
                "warnings": [],
            },
        ],
    },
    {
        "id": "2",
        "title": "STORE",
        "description": "Daily store operations, real-time KPI overview, store public profile customization, and operational policies.",
        "sections": [
            {
                "title": "Dashboard",
                "purpose": "Executive summary of store health, revenue, total orders, pending actions, and quick metric summaries.",
                "access": "Click 'Dashboard' in the sidebar or visit /vendor",
                "screenshots": ["02-seller-dashboard.png"],
                "steps": [
                    "Click 'Dashboard' at the top of the STORE sidebar section.",
                    "Review the primary KPI summary cards (Total Revenue, Orders, Products, Customer Ratings).",
                    "Check quick alert badges for orders requiring immediate dispatch or low stock notices.",
                ],
                "result": "Comprehensive high-level view of your current business performance.",
                "warnings": [],
            },
            {
                "title": "Store Profile",
                "purpose": "Manage public-facing store branding, including store name, logo, banner, and business description.",
                "access": "Click 'Store Profile' in the sidebar or visit /vendor/store/edit",
                "screenshots": ["05-store-profile.png", "06-store-edit.png"],
                "steps": [
                    "Click 'Store Profile' in the STORE sidebar section.",
                    "Review your current store listing and brand presence.",
                    "Click 'Edit' to update the store name, description, logo, and cover banner.",
                    "Save your changes to update your marketplace storefront.",
                ],
                "result": "Updated branding displays immediately to customers browsing your store on GOSIKA.",
                "warnings": ["Ensure logo and banner images comply with GOSIKA image resolution standards."],
            },
            {
                "title": "Store Settings",
                "purpose": "Configure operational parameters including shipping methods, return windows, and store policies.",
                "access": "Click 'Store Settings' in the sidebar or visit /vendor/store-settings",
                "screenshots": ["07-store-settings.png"],
                "steps": [
                    "Click 'Store Settings' in the STORE sidebar section.",
                    "Review return policies, packaging guidelines, and minimum order values.",
                    "Adjust toggle settings and click 'Save Changes'.",
                ],
                "result": "Store operational policies are enforced across all customer transactions.",
                "warnings": [],
            },
        ],
    },
    {
        "id": "3",
        "title": "ORDERS",
        "description": "Fulfillment pipeline management: tracking customer orders from initial placement through preparation, dispatch, and returns handling.",
        "sections": [
            {
                "title": "All Orders",
                "purpose": "Comprehensive order registry with multi-status filtering, order searching, and date range filters.",
                "access": "Click 'All Orders' in the sidebar or visit /vendor/orders",
                "screenshots": ["16-all-orders.png", "17-order-filters.png"],
                "steps": [
                    "Click 'All Orders' in the ORDERS sidebar section.",
                    "Search orders by customer name, order number, or tracking code.",
                    "Use status filter tabs to filter by Pending, Processing, Shipped, or Delivered.",
                    "Click any order record to open its detailed breakdown.",
                ],
                "result": "Real-time list of all orders matching the chosen search criteria.",
                "warnings": [],
            },
            {
                "title": "Order Details",
                "purpose": "Deep view of order items, quantities, customer shipping address, payment method, and dispatch timeline.",
                "access": "Click any order row from All Orders or visit /vendor/orders/{id}",
                "screenshots": ["18-order-detail.png"],
                "steps": [
                    "Open an order row from the orders table.",
                    "Review ordered item SKUs, sizes, colors, and quantities.",
                    "Verify the delivery address and customer contact phone.",
                    "Execute safe state transitions (Confirm, Package, or Dispatch) when ready.",
                ],
                "result": "Complete order specification and workflow action triggers.",
                "warnings": ["Confirm an order only after checking that physical stock is ready for packing."],
            },
            {
                "title": "To Ship",
                "purpose": "Dedicated queue for confirmed orders that need packaging and courier pickup preparation.",
                "access": "Click 'To Ship' in the sidebar or visit /vendor/orders/ready",
                "screenshots": ["20b-orders-to-ship.png"],
                "steps": [
                    "Click 'To Ship' in the ORDERS sidebar section.",
                    "Pick and pack the items corresponding to each ready order.",
                    "Affix the printed shipping label to the parcel.",
                    "Mark order as ready for handover to the GOSIKA delivery courier.",
                ],
                "result": "Orders are queued for pickup and the delivery courier is dispatched.",
                "warnings": ["Failing to dispatch within SLA targets may impact seller reliability ratings."],
            },
            {
                "title": "Shipped",
                "purpose": "Orders currently in transit with the delivery logistics network.",
                "access": "Click 'Shipped' in the sidebar or visit /vendor/orders/shipped",
                "screenshots": ["21b-orders-shipped.png"],
                "steps": [
                    "Click 'Shipped' in the ORDERS sidebar section.",
                    "Monitor ongoing delivery transit states and live carrier tracking status.",
                ],
                "result": "Live visibility into parcels dispatched to customers.",
                "warnings": [],
            },
            {
                "title": "Returns & Issues",
                "purpose": "Customer return claims, exchange requests, and damaged goods disputes.",
                "access": "Click 'Returns & Issues' in the sidebar or visit /vendor/returns",
                "screenshots": ["22-returns-issues.png"],
                "steps": [
                    "Click 'Returns & Issues' in the ORDERS sidebar section.",
                    "Review the customer's stated return reason, proof photos, and requested resolution.",
                    "Approve or reject the claim in accordance with store policies.",
                ],
                "result": "Return authorization is processed and reverse logistics arranged.",
                "warnings": ["Respond to customer return requests within 48 hours to avoid automatic escalations."],
            },
        ],
    },
    {
        "id": "4",
        "title": "PRODUCTS",
        "description": "Product catalogue management, new product creation, approval auditing, low-stock alerts, and customer reviews.",
        "sections": [
            {
                "title": "My Products",
                "purpose": "Master catalogue list of all vendor products with SKU, pricing, stock levels, and publish status.",
                "access": "Click 'My Products' in the sidebar or visit /vendor/products",
                "screenshots": ["08-my-products.png", "09-product-filters.png"],
                "steps": [
                    "Click 'My Products' in the PRODUCTS sidebar section.",
                    "Filter products by active status, category, or stock availability.",
                    "Search by SKU or product title.",
                    "Click the edit icon on any listing to modify details.",
                ],
                "result": "Full catalogue management overview.",
                "warnings": [],
            },
            {
                "title": "Add Product",
                "purpose": "Submit a new product listing with title, categories, media gallery, pricing, variants, and initial stock.",
                "access": "Click 'Add Product' in the sidebar or visit /vendor/products/new",
                "screenshots": [
                    "10-add-product-form-top.png",
                    "11-add-product-form-mid.png",
                    "12-add-product-form-bottom.png"
                ],
                "steps": [
                    "Click 'Add Product' in the PRODUCTS sidebar section.",
                    "Fill in the Product Title, Brand, and Primary Category.",
                    "Upload high-resolution product photography (white background recommended).",
                    "Enter regular price, discount price, SKU, and barcode.",
                    "Configure variants (sizes, colors, materials) if applicable.",
                    "Click 'Submit for Approval'.",
                ],
                "result": "The product is submitted into the admin review queue.",
                "warnings": ["All newly added products must be reviewed and approved by GOSIKA administrators before going live."],
            },
            {
                "title": "Edit Product",
                "purpose": "Update existing product specifications, pricing adjustments, or gallery images.",
                "access": "Click Edit on any product row in My Products or visit /vendor/products/{id}/edit",
                "screenshots": ["13-product-edit.png"],
                "steps": [
                    "Locate the product you want to modify in My Products.",
                    "Click the Edit button (pencil icon).",
                    "Make the necessary updates to description, pricing, or media.",
                    "Click 'Save Changes'.",
                ],
                "result": "Product specifications are updated.",
                "warnings": ["Major price or description changes may trigger a brief administrative re-review."],
            },
            {
                "title": "Approval Status",
                "purpose": "Audit product moderation states (Pending, Approved, Rejected) and read administrator review feedback.",
                "access": "Click 'Approval Status' in the sidebar or visit /vendor/products/approval",
                "screenshots": ["09b-product-approval.png"],
                "steps": [
                    "Click 'Approval Status' in the PRODUCTS sidebar section.",
                    "Review listings that are Pending Administrative Review.",
                    "If a product was Rejected, read the reviewer notes to see what corrections are required.",
                ],
                "result": "Clear visibility into catalogue approval progress.",
                "warnings": [],
            },
            {
                "title": "Low Stock",
                "purpose": "Dedicated inventory replenishment screen highlighting products near or at zero stock.",
                "access": "Click 'Low Stock' in the sidebar or visit /vendor/inventory/low-stock",
                "screenshots": ["15-low-stock.png"],
                "steps": [
                    "Click 'Low Stock' in the PRODUCTS sidebar section.",
                    "Identify items that have reached their minimum inventory threshold.",
                    "Update stock quantities directly to restore product availability.",
                ],
                "result": "Fast prevention of stockouts and loss of marketplace visibility.",
                "warnings": ["Products with 0 stock are automatically flagged as Out of Stock on the public storefront."],
            },
            {
                "title": "Reviews & Q&A",
                "purpose": "Monitor customer star ratings, read written reviews, and respond directly to customer pre-purchase inquiries.",
                "access": "Click 'Reviews & Q&A' in the sidebar or visit /vendor/reviews",
                "screenshots": ["23-reviews-qa.png"],
                "steps": [
                    "Click 'Reviews & Q&A' in the PRODUCTS sidebar section.",
                    "Review star ratings and feedback left by verified buyers.",
                    "Answer open questions submitted by prospective buyers on your listings.",
                ],
                "result": "Strengthened customer trust and improved conversion rates.",
                "warnings": ["Maintain a professional, polite tone in all public replies."],
            },
        ],
    },
    {
        "id": "5",
        "title": "PROMOTIONS",
        "description": "Store growth tools: participation in marketplace-wide sales events and creation of custom voucher codes.",
        "sections": [
            {
                "title": "Campaigns",
                "purpose": "Join official GOSIKA seasonal promotions, mega sales (e.g., Dashain Festival Sales), and banner features.",
                "access": "Click 'Campaigns' in the sidebar or visit /vendor/promotions",
                "screenshots": ["26-promotions-campaigns.png"],
                "steps": [
                    "Click 'Campaigns' in the PROMOTIONS sidebar section.",
                    "Browse active and upcoming marketplace campaigns.",
                    "Select participating products and commit required discount percentages.",
                    "Submit enrollment for marketing team inclusion.",
                ],
                "result": "Eligible products receive promotional badges and featured homepage placement.",
                "warnings": ["Ensure sufficient inventory is allocated before joining high-volume campaigns."],
            },
            {
                "title": "Vouchers",
                "purpose": "Create seller-funded discount vouchers and coupons for your storefront.",
                "access": "Click 'Vouchers' in the sidebar or visit /vendor/coupons",
                "screenshots": ["25-coupons-vouchers.png"],
                "steps": [
                    "Click 'Vouchers' in the PROMOTIONS sidebar section.",
                    "Click 'Create Voucher' to generate a promo code.",
                    "Specify discount value (Percentage or Fixed NPR), minimum spend, and validity period.",
                    "Activate the voucher.",
                ],
                "result": "Customers can apply the coupon code at checkout for immediate discounts.",
                "warnings": [],
            },
        ],
    },
    {
        "id": "6",
        "title": "FINANCE",
        "description": "Financial ledger management: wallet balances, withdrawal payouts, and settlement calculation sheets.",
        "sections": [
            {
                "title": "Wallet",
                "purpose": "Real-time balance tracking, pending balance clearance, and financial overview.",
                "access": "Click 'Wallet' in the sidebar or visit /vendor/wallet",
                "screenshots": ["27-wallet.png"],
                "steps": [
                    "Click 'Wallet' in the FINANCE sidebar section.",
                    "View Available Withdrawable Balance and Escrow/Pending Balance.",
                    "Review overall lifetime earnings.",
                ],
                "result": "Transparent visibility into your store liquidity.",
                "warnings": ["Funds remain in pending status until the customer return window closes."],
            },
            {
                "title": "Payouts",
                "purpose": "Request direct bank wire withdrawals of cleared wallet earnings and view historical disbursements.",
                "access": "Click 'Payouts' in the sidebar or visit /vendor/payouts",
                "screenshots": ["29-payouts.png"],
                "steps": [
                    "Click 'Payouts' in the FINANCE sidebar section.",
                    "Verify your available balance meets the minimum payout threshold.",
                    "Click 'Request Payout' and select your verified destination bank account.",
                    "Confirm the withdrawal amount.",
                ],
                "result": "Payout request is queued for processing per the GOSIKA banking schedule.",
                "warnings": ["Payouts are only dispatched to bank accounts that have passed identity verification."],
            },
            {
                "title": "Settlements",
                "purpose": "Itemized settlement reconciliation statements showing gross sales, marketplace commission, and net pay.",
                "access": "Click 'Settlements' in the sidebar or visit /vendor/settlements",
                "screenshots": ["30-settlements.png"],
                "steps": [
                    "Click 'Settlements' in the FINANCE sidebar section.",
                    "Select a settlement cycle period.",
                    "Examine line-by-line order revenue deductions, platform fees, and net disbursement totals.",
                    "Download the settlement sheet for accounting records.",
                ],
                "result": "Auditable accounting breakdown for all store disbursements.",
                "warnings": [],
            },
        ],
    },
    {
        "id": "7",
        "title": "SHIPPING",
        "description": "Logistics operations: warehouse pickup locations and shipping label generation for outbound packages.",
        "sections": [
            {
                "title": "Pickup Locations",
                "purpose": "Register and manage physical warehouse or shop addresses where couriers collect packed parcels.",
                "access": "Click 'Pickup Locations' in the sidebar or visit /vendor/shipping",
                "screenshots": ["34-pickup-locations.png"],
                "steps": [
                    "Click 'Pickup Locations' in the SHIPPING sidebar section.",
                    "Review registered dispatch hubs.",
                    "Click 'Add Location' to configure a new pickup address with contact person and phone number.",
                    "Set your primary default pickup address.",
                ],
                "result": "GOSIKA delivery couriers route directly to your designated warehouse for pickups.",
                "warnings": ["Provide exact landmark details and active contact numbers for pickup drivers."],
            },
            {
                "title": "Shipping Labels",
                "purpose": "Bulk print barcode labels and packing slips for orders scheduled for courier pickup.",
                "access": "Click 'Shipping Labels' in the sidebar or visit /vendor/shipping/labels",
                "screenshots": ["35-shipping-labels.png"],
                "steps": [
                    "Click 'Shipping Labels' in the SHIPPING sidebar section.",
                    "Select the orders ready for parcel dispatch.",
                    "Click 'Generate Labels' to render print-ready PDF shipping barcodes.",
                    "Print labels and tape securely to the exterior parcel package.",
                ],
                "result": "Standardized scannable waybills for error-free courier transit.",
                "warnings": ["Ensure the barcode is flat and unscratched for scanner readability."],
            },
        ],
    },
    {
        "id": "8",
        "title": "ACCOUNT",
        "description": "Vendor profile settings, security management, KYC verification, bank account records, notifications, and support.",
        "sections": [
            {
                "title": "Profile",
                "purpose": "Manage authorized vendor account representative details, email contact, and business registration info.",
                "access": "Click 'Profile' in the sidebar or visit /vendor/profile",
                "screenshots": ["36-vendor-profile.png"],
                "steps": [
                    "Click 'Profile' in the ACCOUNT sidebar section.",
                    "Update contact name, primary email, and phone number.",
                    "Save profile changes.",
                ],
                "result": "Current contact info saved for platform correspondence.",
                "warnings": [],
            },
            {
                "title": "KYC Verification",
                "purpose": "Submit government identification, PAN/VAT certificates, and business registration for compliance.",
                "access": "Click 'KYC Verification' in the sidebar or visit /vendor/verification",
                "screenshots": ["38-kyc-verification.png"],
                "steps": [
                    "Click 'KYC Verification' in the ACCOUNT sidebar section.",
                    "Select your business entity type (Individual / Registered Company).",
                    "Upload citizenship/passport scan and company PAN/VAT certificate.",
                    "Submit for administrative verification.",
                ],
                "result": "Account achieves verified seller status, unlocking unrestricted selling limits.",
                "warnings": ["Ensure uploaded document scans are crisp, legible, and unexpired."],
            },
            {
                "title": "Bank Account",
                "purpose": "Link verified commercial bank accounts for automatic settlement disbursements.",
                "access": "Click 'Bank Account' in the sidebar or visit /vendor/bank-accounts",
                "screenshots": ["39-bank-accounts.png"],
                "steps": [
                    "Click 'Bank Account' in the ACCOUNT sidebar section.",
                    "Click 'Add Bank Account'.",
                    "Enter the Bank Name, Branch, Account Holder Name, and Account Number.",
                    "Save and designate as primary payout destination.",
                ],
                "result": "Direct deposit destination configured for all future payout withdrawals.",
                "warnings": ["Account holder name must match your legal business registration or citizenship."],
            },
            {
                "title": "Security",
                "purpose": "Update account login passwords and manage authentication credentials.",
                "access": "Click 'Security' in the sidebar or visit /vendor/security",
                "screenshots": ["37-security.png"],
                "steps": [
                    "Click 'Security' in the ACCOUNT sidebar section.",
                    "Enter your current password.",
                    "Set a new strong password (at least 8 characters, numbers, and symbols).",
                    "Confirm and save.",
                ],
                "result": "Account security updated immediately.",
                "warnings": ["Never reuse passwords across multiple services."],
            },
            {
                "title": "Notifications",
                "purpose": "Review system announcements, order updates, stock alerts, and customize alert preferences.",
                "access": "Click 'Notifications' in the sidebar or visit /vendor/notifications",
                "screenshots": ["04-notifications.png", "40-notification-prefs.png"],
                "steps": [
                    "Click 'Notifications' in the ACCOUNT sidebar section.",
                    "Review unread alerts regarding new orders, reviews, or policy updates.",
                    "Adjust email and in-app notification toggles.",
                ],
                "result": "Immediate awareness of critical store events.",
                "warnings": [],
            },
            {
                "title": "Support",
                "purpose": "Contact GOSIKA vendor support helpdesk, view open support tickets, and submit new inquiries.",
                "access": "Click 'Support' in the sidebar or visit /vendor/support",
                "screenshots": ["41-support.png", "42-new-support-ticket.png"],
                "steps": [
                    "Click 'Support' in the ACCOUNT sidebar section.",
                    "Browse previous ticket history or common seller FAQs.",
                    "Click 'New Ticket' to open an inquiry.",
                    "Select issue category, type details, attach screenshots, and submit.",
                ],
                "result": "Support ticket is dispatched to the GOSIKA merchant assistance team.",
                "warnings": ["Support teams typically respond within 24 business hours."],
            },
        ],
    },
]


# ── Style Sheet ──────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()

    styles = {
        "chapter_heading": ParagraphStyle(
            "chapter_heading",
            fontName="Helvetica-Bold",
            fontSize=18,
            textColor=GOSIKA_ORANGE,
            leading=24,
            spaceBefore=10,
            spaceAfter=4,
        ),
        "chapter_desc": ParagraphStyle(
            "chapter_desc",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=GOSIKA_GRAY,
            leading=14,
            spaceAfter=12,
        ),
        "section_heading": ParagraphStyle(
            "section_heading",
            fontName="Helvetica-Bold",
            fontSize=13,
            textColor=GOSIKA_DARK,
            leading=18,
            spaceBefore=8,
            spaceAfter=4,
        ),
        "purpose_label": ParagraphStyle(
            "purpose_label",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=GOSIKA_ORANGE,
            leading=12,
        ),
        "purpose_text": ParagraphStyle(
            "purpose_text",
            fontName="Helvetica",
            fontSize=9,
            textColor=GOSIKA_DARK,
            leading=13,
            spaceAfter=5,
        ),
        "step_num": ParagraphStyle(
            "step_num",
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=white,
            leading=11,
        ),
        "step_text": ParagraphStyle(
            "step_text",
            fontName="Helvetica",
            fontSize=9,
            textColor=GOSIKA_DARK,
            leading=13,
        ),
        "caption": ParagraphStyle(
            "caption",
            fontName="Helvetica-Oblique",
            fontSize=8,
            textColor=GOSIKA_GRAY,
            alignment=TA_CENTER,
            leading=11,
            spaceAfter=8,
        ),
        "warning_text": ParagraphStyle(
            "warning_text",
            fontName="Helvetica",
            fontSize=8.5,
            textColor=HexColor("#8B0000"),
            leading=12,
            leftIndent=6,
        ),
        "result_text": ParagraphStyle(
            "result_text",
            fontName="Helvetica",
            fontSize=9,
            textColor=HexColor("#005500"),
            leading=13,
        ),
        "toc_entry": ParagraphStyle(
            "toc_entry",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=GOSIKA_DARK,
            leading=16,
        ),
        "toc_chapter": ParagraphStyle(
            "toc_chapter",
            fontName="Helvetica-Bold",
            fontSize=10.5,
            textColor=GOSIKA_ORANGE,
            leading=18,
        ),
        "intro_text": ParagraphStyle(
            "intro_text",
            fontName="Helvetica",
            fontSize=9.5,
            textColor=GOSIKA_DARK,
            leading=15,
            spaceAfter=7,
        ),
    }
    return styles


# ── Scale image ──────────────────────────────────────────────────────────────
def scale_image(img_path, max_width, max_height=None):
    """Preserve aspect ratio and scale image cleanly."""
    if PILImage:
        try:
            with PILImage.open(img_path) as im:
                orig_w, orig_h = im.size
        except Exception:
            return max_width, max_width * 0.5625
    else:
        return max_width, max_width * 0.5625

    ratio = orig_w / orig_h
    w = min(max_width, orig_w)
    h = w / ratio
    if max_height and h > max_height:
        h = max_height
        w = h * ratio
    return w, h


# ── Screenshot element ───────────────────────────────────────────────────────
def screenshot_element(ss_path, caption, styles, max_w=None, max_h=None):
    if max_w is None:
        max_w = CONTENT_W
    if max_h is None:
        max_h = PAGE_H * 0.45  # Keep image within 45% of page height
    elements = []
    if os.path.exists(ss_path):
        w, h = scale_image(ss_path, max_w, max_h)
        img = Image(ss_path, width=w, height=h)
        img.hAlign = "CENTER"
        elements.append(img)
        elements.append(Paragraph(caption, styles["caption"]))
    else:
        elements.append(Paragraph(f"[Screenshot not found: {os.path.basename(ss_path)}]", styles["caption"]))
    return elements


# ── Build Document Flow ──────────────────────────────────────────────────────
def build_pdf(manifest):
    styles = build_styles()
    ss_map = {s["filename"]: s for s in manifest.get("screenshots", [])}

    story = []

    # ── Cover Page ──────────────────────────────────────────────────────────
    cover_content = [
        [Spacer(1, 5 * cm)],
        [Paragraph("GOSIKA", ParagraphStyle("logo", fontName="Helvetica-Bold", fontSize=46,
                                             textColor=white, leading=50))],
        [Spacer(1, 0.3 * cm)],
        [Paragraph("Seller Portal", ParagraphStyle("portal", fontName="Helvetica-Bold", fontSize=26,
                                                    textColor=HexColor("#FFD0B0"), leading=32))],
        [Spacer(1, 0.3 * cm)],
        [Paragraph("User Manual — Phase 1", ParagraphStyle("manual", fontName="Helvetica", fontSize=20,
                                                            textColor=white, leading=26))],
        [Spacer(1, 0.5 * cm)],
        [HRFlowable(width=CONTENT_W * 0.65, thickness=1.5, color=HexColor("#FFD0B0"), hAlign="LEFT")],
        [Spacer(1, 0.5 * cm)],
        [Paragraph("Sidebar Navigation & Features Guide", ParagraphStyle(
            "sub", fontName="Helvetica-Bold", fontSize=13, textColor=white, leading=18))],
        [Spacer(1, 0.2 * cm)],
        [Paragraph("Covers all 7 operational sidebar sections: STORE • ORDERS • PRODUCTS • PROMOTIONS • FINANCE • SHIPPING • ACCOUNT", ParagraphStyle(
            "phase", fontName="Helvetica", fontSize=10, textColor=HexColor("#FFD0B0"), leading=14))],
        [Spacer(1, 0.4 * cm)],
        [Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", ParagraphStyle(
            "gendate", fontName="Helvetica", fontSize=9.5, textColor=HexColor("#FFAA80"), leading=13))],
        [Spacer(1, 0.3 * cm)],
        [Paragraph("GOSIKA Pvt. Ltd. · Internal & Vendor Documentation", ParagraphStyle(
            "conf", fontName="Helvetica", fontSize=8.5, textColor=HexColor("#FF9966"), leading=11))],
    ]

    cover_inner = Table(cover_content, colWidths=[CONTENT_W])
    cover_inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GOSIKA_ORANGE),
        ("LEFTPADDING", (0, 0), (-1, -1), MARGIN),
        ("RIGHTPADDING", (0, 0), (-1, -1), MARGIN),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    story.append(cover_inner)
    story.append(PageBreak())

    # ── Table of Contents ───────────────────────────────────────────────────
    story.append(Paragraph("Table of Contents", styles["chapter_heading"]))
    story.append(HRFlowable(width=CONTENT_W, thickness=1.5, color=GOSIKA_ORANGE))
    story.append(Spacer(1, 0.3 * cm))

    for ch in CHAPTERS:
        story.append(Paragraph(f"Chapter {ch['id']}: {ch['title']}", styles["toc_chapter"]))
        for sec in ch["sections"]:
            story.append(Paragraph(f"    • {sec['title']}", styles["toc_entry"]))
        story.append(Spacer(1, 0.15 * cm))

    story.append(PageBreak())

    # ── Introduction ────────────────────────────────────────────────────────
    story.append(Paragraph("Introduction & Scope", styles["chapter_heading"]))
    story.append(HRFlowable(width=CONTENT_W, thickness=1.5, color=GOSIKA_ORANGE))
    story.append(Spacer(1, 0.3 * cm))

    intro_paras = [
        "This official manual covers the active operational features of the <b>GOSIKA Seller Portal</b>. It is directly synchronized with the live seller portal interface, covering every feature accessible via the main sidebar menu.",
        "<b>Sidebar-First Structure:</b> In alignment with the user interface, this documentation is structured into the 7 primary operational sections of the GOSIKA Seller Portal:",
        "• <b>STORE:</b> Dashboard KPIs, Store Profile customization, and Store Settings.<br/>"
        "• <b>ORDERS:</b> All Orders registry, Order Details, To Ship fulfillment, Shipped tracking, and Returns & Issues handling.<br/>"
        "• <b>PRODUCTS:</b> My Products catalogue, Add Product creation, Edit Product, Approval Status, Low Stock alerts, and Reviews & Q&A.<br/>"
        "• <b>PROMOTIONS:</b> Marketplace Campaign enrollment and Custom Voucher / Coupon creation.<br/>"
        "• <b>FINANCE:</b> Wallet balance, Payout withdrawals, and Itemized Settlement sheets.<br/>"
        "• <b>SHIPPING:</b> Pickup Locations configuration and bulk Shipping Labels generation.<br/>"
        "• <b>ACCOUNT:</b> Profile information, KYC business verification, Bank Account configuration, Security passwords, Notifications, and Support helpdesk.",
        "<b>Phase 1 Scope:</b> All screenshots in this manual are genuine, unedited captures from the live GOSIKA e-commerce platform. Phase 2 will introduce directional highlight arrows, numbered badges, and enhanced graphic overlays.",
    ]
    for p in intro_paras:
        story.append(Paragraph(p, styles["intro_text"]))

    story.append(PageBreak())

    # ── Chapters & Sections ─────────────────────────────────────────────────
    for ch_idx, ch in enumerate(CHAPTERS):
        story.append(Paragraph(f"Chapter {ch['id']}: {ch['title']}", styles["chapter_heading"]))
        story.append(HRFlowable(width=CONTENT_W, thickness=2, color=GOSIKA_ORANGE))
        story.append(Spacer(1, 0.15 * cm))
        story.append(Paragraph(ch["description"], styles["chapter_desc"]))

        for sec_idx, sec in enumerate(ch["sections"]):
            story.append(Spacer(1, 0.25 * cm))
            story.append(Paragraph(f"{ch['id']}.{sec_idx + 1}  {sec['title']}", styles["section_heading"]))
            story.append(HRFlowable(width=CONTENT_W, thickness=0.5, color=GOSIKA_BORDER))
            story.append(Spacer(1, 0.15 * cm))

            # Purpose
            story.append(Paragraph("Purpose:", styles["purpose_label"]))
            story.append(Paragraph(sec["purpose"], styles["purpose_text"]))

            # Access
            story.append(Paragraph("How to access:", styles["purpose_label"]))
            story.append(Paragraph(sec["access"], styles["purpose_text"]))

            # Screenshots
            for ss_name in sec.get("screenshots", []):
                ss_path = str(SS_DIR / ss_name)
                ss_entry = ss_map.get(ss_name, {})
                cap = ss_entry.get("caption", ss_name.replace("-", " ").replace(".png", "").title())
                story.extend(screenshot_element(ss_path, f"Figure: {cap}", styles))

            # Steps
            if sec.get("steps"):
                story.append(Spacer(1, 0.15 * cm))
                story.append(Paragraph("Step-by-step instructions:", styles["purpose_label"]))
                story.append(Spacer(1, 0.1 * cm))
                for step_i, step_text in enumerate(sec["steps"], 1):
                    pill = Table(
                        [[Paragraph(str(step_i), styles["step_num"])]],
                        colWidths=[0.55 * cm],
                        rowHeights=[0.48 * cm],
                    )
                    pill.setStyle(TableStyle([
                        ("BACKGROUND", (0, 0), (-1, -1), GOSIKA_ORANGE),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 1),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 1),
                        ("TOPPADDING", (0, 0), (-1, -1), 1),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                    ]))
                    row = Table(
                        [[pill, Paragraph(step_text, styles["step_text"])]],
                        colWidths=[0.7 * cm, CONTENT_W - 0.7 * cm],
                    )
                    row.setStyle(TableStyle([
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("TOPPADDING", (0, 0), (-1, -1), 2),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ]))
                    story.append(row)

            # Expected Result
            if sec.get("result"):
                story.append(Spacer(1, 0.15 * cm))
                story.append(Paragraph("Expected Result:", styles["purpose_label"]))
                story.append(Paragraph(sec["result"], styles["result_text"]))

            # Warnings
            if sec.get("warnings"):
                story.append(Spacer(1, 0.15 * cm))
                warn_rows = [[Paragraph("⚠ " + w, styles["warning_text"])] for w in sec["warnings"]]
                warn_table = Table(warn_rows, colWidths=[CONTENT_W])
                warn_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), HexColor("#FFF5F5")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#FFBBBB")),
                    ("LINEAFTER", (0, 0), (0, -1), 3, HexColor("#CC0000")),
                ]))
                story.append(warn_table)

            story.append(Spacer(1, 0.35 * cm))

        story.append(PageBreak())

    return story


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("\n📄  GOSIKA PDF Generator – Sidebar-Synchronized Phase 1 Manual")
    print("=" * 60)

    if not MANIFEST_PATH.exists():
        print(f"ERROR: Manifest not found at {MANIFEST_PATH}")
        sys.exit(1)

    with open(MANIFEST_PATH, "r", encoding="utf-8-sig") as f:
        manifest = json.load(f)

    story = build_pdf(manifest)

    # Custom canvas for headers & two-pass page numbering
    class NumberedCanvas(canvas.Canvas):
        def __init__(self, filename, **kwargs):
            super().__init__(filename, **kwargs)
            self._saved_page_states = []

        def showPage(self):
            self._saved_page_states.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            num_pages = len(self._saved_page_states)
            for state in self._saved_page_states:
                self.__dict__.update(state)
                self._draw_header_footer(num_pages)
                canvas.Canvas.showPage(self)
            canvas.Canvas.save(self)

        def _draw_header_footer(self, page_count):
            page_num = self._pageNumber
            if page_num <= 1:
                return
            self.saveState()
            # Header line
            self.setStrokeColor(GOSIKA_ORANGE)
            self.setLineWidth(1.5)
            self.line(MARGIN, PAGE_H - 1.5 * cm, PAGE_W - MARGIN, PAGE_H - 1.5 * cm)
            self.setFont("Helvetica-Bold", 9)
            self.setFillColor(GOSIKA_ORANGE)
            self.drawString(MARGIN, PAGE_H - 1.2 * cm, "GOSIKA")
            self.setFillColor(GOSIKA_DARK)
            self.drawString(MARGIN + 1.3 * cm, PAGE_H - 1.2 * cm, "Seller Portal – Sidebar User Manual")
            self.setFont("Helvetica", 8)
            self.setFillColor(GOSIKA_GRAY)
            self.drawRightString(PAGE_W - MARGIN, PAGE_H - 1.2 * cm, "Phase 1 Draft")
            # Footer line
            self.setStrokeColor(GOSIKA_BORDER)
            self.setLineWidth(0.5)
            self.line(MARGIN, 1.5 * cm, PAGE_W - MARGIN, 1.5 * cm)
            self.setFont("Helvetica", 8)
            self.setFillColor(GOSIKA_GRAY)
            self.drawString(MARGIN, 1.0 * cm, f"© {datetime.now().year} GOSIKA Pvt. Ltd.  Confidential.")
            self.drawRightString(PAGE_W - MARGIN, 1.0 * cm, f"Page {page_num} of {page_count}")
            self.restoreState()

    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm,
        title="GOSIKA Seller Portal – Sidebar User Manual Phase 1",
        author="GOSIKA Pvt. Ltd.",
        subject="Seller Portal Documentation",
        creator="GOSIKA Manual Generator v1.1",
    )

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"\n✅  PDF generated: {OUTPUT_PDF}")
    print(f"    Size: {OUTPUT_PDF.stat().st_size / 1024:.1f} KB")

    # ── Keep in Project Copies ───────────────────────────────────────────────
    # Copy to manuals/vendor/
    PROJECT_MANUAL_DIR.mkdir(parents=True, exist_ok=True)
    vendor_dest = PROJECT_MANUAL_DIR / "GOSIKA-Seller-User-Manual-Phase-1.pdf"
    shutil.copy2(OUTPUT_PDF, vendor_dest)
    print(f"✅  Copied to project manuals: {vendor_dest}")

    # Copy to public/manuals/ (for direct web download / access in app)
    PUBLIC_MANUAL_DIR.mkdir(parents=True, exist_ok=True)
    public_dest = PUBLIC_MANUAL_DIR / "GOSIKA-Seller-User-Manual-Phase-1.pdf"
    shutil.copy2(OUTPUT_PDF, public_dest)
    print(f"✅  Copied to public web assets: {public_dest}")


if __name__ == "__main__":
    main()
