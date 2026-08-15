import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Phone, Mail, MapPin,
  Shield, Truck, Star, Headphones,
  Banknote, CreditCard, Smartphone, Wallet
} from 'lucide-react'

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
  { label: 'eSewa', icon: CreditCard },
  { label: 'Fonepay', icon: Smartphone },
]

const PROVINCES = [
  'Koshi', 'Madhesh', 'Bagmati', 'Gandaki',
  'Lumbini', 'Karnali', 'Sudurpashchim',
]

export default function CustomerFooter() {
  return (
    <footer className="footer" role="contentinfo">
      {/* --- Trust strip --- */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 0' }}>
        <div className="container" style={{ padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: Truck, title: 'Nationwide Delivery', desc: 'Delivering to all 77 districts across Nepal' },
              { icon: Shield, title: 'Buyer Protection', desc: 'Every order protected by GOSIKA Guarantee' },
              { icon: Star, title: 'Verified Vendors', desc: 'KYC-verified sellers you can trust' },
              { icon: Headphones, title: '24/7 Support', desc: 'We\'re here whenever you need help' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3" style={{ padding: '8px 0' }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <f.icon size={18} color="#60a5fa" />
                </span>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{f.title}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- Main footer grid --- */}
      <div className="container" style={{ padding: '44px 20px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 36 }}>
          {/* Brand column */}
          <div>
            <div className="brand" style={{ color: '#fff', marginBottom: 14 }}>
              <span className="brand-mark"><ShoppingBag size={18} /></span>
              GOSIKA
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260, margin: '0 0 16px', color: '#64748b' }}>
              Nepal's trusted multi-vendor marketplace. Shop from verified sellers across all seven
              provinces — delivered right to your doorstep.
            </p>

            {/* Social links */}
            <div className="footer-social">
              {[
                { href: 'https://facebook.com', icon: Facebook, label: 'GOSIKA on Facebook' },
                { href: 'https://instagram.com', icon: Instagram, label: 'GOSIKA on Instagram' },
                { href: 'https://twitter.com', icon: Twitter, label: 'GOSIKA on Twitter' },
                { href: 'https://youtube.com', icon: Youtube, label: 'GOSIKA on YouTube' },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn"
                  aria-label={label}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>

            {/* Payment methods */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: 10 }}>
                Accepted Payments
              </div>
              <div className="footer-payment-badges">
                {PAYMENT_METHODS.map((m) => (
                  <span key={m.label} className="payment-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <m.icon size={13} color="var(--primary)" /> {m.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="footer-title">Shop</h4>
            <div className="footer-links">
              {QUICK_LINKS.map((l) => (
                <Link key={l.label} to={l.to}>{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 className="footer-title">My Account</h4>
            <div className="footer-links">
              {ACCOUNT_LINKS.map((l) => (
                <Link key={l.label} to={l.to}>{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Seller */}
          <div>
            <h4 className="footer-title">Sell on GOSIKA</h4>
            <div className="footer-links">
              {SELLER_LINKS.map((l) => (
                <Link key={l.label} to={l.to}>{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Help & contact */}
          <div>
            <h4 className="footer-title">Help & Support</h4>
            <div className="footer-links">
              {HELP_LINKS.map((l) => (
                <Link key={l.label} to={l.to}>{l.label}</Link>
              ))}
              <a href="mailto:support@gosika.com.np" className="flex items-center gap-2">
                <Mail size={13} /> support@gosika.com.np
              </a>
              <a href="tel:+9779800000000" className="flex items-center gap-2">
                <Phone size={13} /> +977 9800 000 000
              </a>
            </div>
          </div>
        </div>

        {/* Province coverage */}
        <div style={{ marginTop: 36, padding: '20px 0', borderTop: '1px solid rgba(148,163,184,0.1)', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: 10 }}>
            Delivering across all provinces of Nepal
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PROVINCES.map((p) => (
              <span key={p} style={{ fontSize: 12, color: '#64748b', padding: '3px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999 }}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom flex items-center justify-between wrap gap-3" style={{ marginTop: 20 }}>
          <span>© {new Date().getFullYear()} Gosika Commerce Pvt. Ltd. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <MapPin size={13} /> Registered in Nepal · Kathmandu
          </span>
        </div>
      </div>
    </footer>
  )
}
