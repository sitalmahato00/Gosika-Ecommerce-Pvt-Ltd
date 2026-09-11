import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Banknote, Wallet, CreditCard, Smartphone, Truck, Shield, Star, Headphones, ChevronRight, Mail, Phone, MapPin
} from 'lucide-react'
import { PAYMENT_BRAND_LOGOS } from '../../utils/constants'
import { apiImage } from '../../utils/format'

const Facebook = ({ size = 15, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" />
  </svg>
)

const Instagram = ({ size = 15, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const Twitter = ({ size = 15, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
  </svg>
)

const Youtube = ({ size = 15, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
  </svg>
)

const QUICK_LINKS = [
  { label: 'All Products', to: '/shop' },
  { label: 'New Arrivals', to: '/shop?sort=newest' },
  { label: 'Deals & Offers', to: '/shop?filter=deals' },
  { label: 'Top Rated', to: '/shop?sort=top' },
  { label: 'Brands', to: '/shop?mode=brands' },
]

const ACCOUNT_LINKS = [
  { label: 'My Account', to: '/account' },
  { label: 'My Orders', to: '/orders' },
  { label: 'Wishlist', to: '/wishlist' },
  { label: 'Addresses', to: '/account/addresses' },
  { label: 'Payment Methods', to: '/account/payments' },
]

const SELLER_LINKS = [
  { label: 'Vendor Dashboard', to: '/vendor' },
  { label: 'Become a Seller', to: '/vendor/register' },
  { label: 'Seller Guidelines', to: '/help' },
  { label: 'Commission Info', to: '/help' },
]

const HELP_LINKS = [
  { label: 'Help Center', to: '/help' },
  { label: 'Returns & Refunds', to: '/help' },
  { label: 'Shipping Policy', to: '/help' },
  { label: 'Privacy Policy', to: '/help' },
  { label: 'Terms of Service', to: '/help' },
]

const PAYMENT_METHODS = [
  { label: 'Cash on Delivery', icon: Banknote },
  { label: 'Khalti', icon: Wallet },
  { label: 'eSewa', logo: PAYMENT_BRAND_LOGOS.esewaWhite },
  { label: 'Fonepay', icon: Smartphone },
]

const PROVINCES = [
  'Koshi', 'Madhesh', 'Bagmati', 'Gandaki',
  'Lumbini', 'Karnali', 'Sudurpashchim',
]

import { useBranding } from '../../context/BrandingContext'

export default function CustomerFooter() {
  const branding = useBranding()
  const brandName = branding.brand_name || branding.site_name || 'GOSIKA'
  const footerText = `© ${new Date().getFullYear()} ${brandName} Pvt. Ltd. All rights reserved.`
  const logoUrl = branding.logo_light || ''

  return (
    <footer className="footer" role="contentinfo" style={{ background: '#161d2b', color: '#94a3b8', fontSize: 13 }}>
      {/* --- Main footer grid --- */}
      <div className="container" style={{ padding: '50px 20px 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 36 }}>
          {/* Brand column */}
          <div style={{ gridColumn: 'span 1' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 16 }}>
              {logoUrl ? (
                <img
                  src={apiImage(logoUrl)}
                  alt={`${brandName} logo`}
                  style={{ height: 44, width: 'auto', maxWidth: 230, objectFit: 'contain', flexShrink: 0 }}
                />
              ) : (
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#ff5500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: 17,
                    boxShadow: '0 2px 6px rgba(255,85,0,0.3)',
                    flexShrink: 0
                  }}
                >
                  G
                </span>
              )}
              <span style={{ fontWeight: 900, color: '#ffffff', fontSize: 21, letterSpacing: '-0.02em' }}>
                {brandName}
              </span>
            </Link>
            <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 260, margin: '0 0 18px', color: '#94a3b8' }}>
              Nepal's leading multi-vendor marketplace connecting trusted local sellers with buyers nationwide. Sabai ek thau ma.
            </p>

            {/* Social links */}
            <div className="footer-social" style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
              {[
                { href: 'https://facebook.com', icon: Facebook, label: 'Facebook' },
                { href: 'https://instagram.com', icon: Instagram, label: 'Instagram' },
                { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
                { href: 'https://youtube.com', icon: Youtube, label: 'YouTube' },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn"
                  aria-label={label}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e2e8f0',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>

            {/* Payment methods */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 10 }}>
                Accepted Payments
              </div>
              <div className="footer-payment-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PAYMENT_METHODS.map((m) => (
                  <span
                    key={m.label}
                    className="payment-badge"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255,255,255,0.06)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      color: '#cbd5e1',
                      fontSize: 11,
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    {m.logo ? (
                      <img src={m.logo} alt={m.label} style={{ height: 16, width: 'auto' }} />
                    ) : (
                      <m.icon size={13} color="#ff5500" />
                    )}
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Shop</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/shop" style={{ color: '#94a3b8', textDecoration: 'none' }}>All Products</Link>
              <Link to="/shop?sort=newest" style={{ color: '#94a3b8', textDecoration: 'none' }}>New Arrivals</Link>
              <Link to="/shop?filter=deals" style={{ color: '#94a3b8', textDecoration: 'none' }}>Flash Deals</Link>
              <Link to="/brands" style={{ color: '#94a3b8', textDecoration: 'none' }}>Top Brands</Link>
              <Link to="/shop?mode=featured" style={{ color: '#94a3b8', textDecoration: 'none' }}>Featured Deals</Link>
            </div>
          </div>

          {/* About Us */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>About Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>About GOSIKA</Link>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Careers</Link>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Press & Media</Link>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms & Conditions</Link>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</Link>
            </div>
          </div>

          {/* Help & Support */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Help & Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Help Center</Link>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>How to Buy</Link>
              <Link to="/orders" style={{ color: '#94a3b8', textDecoration: 'none' }}>Track Your Order</Link>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Returns & Refunds</Link>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contact Us</Link>
            </div>
          </div>

          {/* For Sellers */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>For Sellers</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/vendor/register" style={{ color: '#ff5500', fontWeight: 600, textDecoration: 'none' }}>Become a Seller</Link>
              <Link to="/vendor/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>Seller Hub</Link>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Seller Guidelines</Link>
              <Link to="/help" style={{ color: '#94a3b8', textDecoration: 'none' }}>Commission Rates</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ marginTop: 44, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>{footerText}</span>
          <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            Made with <span style={{ color: '#ef4444' }}>❤️</span> in Nepal 🇳🇵
          </span>
        </div>
      </div>
    </footer>
  )
}
