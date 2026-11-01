import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CheckCircle2,
  Headset,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { useBranding } from '../../context/BrandingContext'
import { apiImage } from '../../utils/format'

const PORTAL_BENEFITS = [
  { icon: PackageCheck, title: 'Reliable platform', detail: 'Built for confident growth' },
  { icon: ShieldCheck, title: 'Secure access', detail: 'Your account stays protected' },
  { icon: Headset, title: 'Dedicated support', detail: 'Help when you need it' },
]

export default function AuthPortalShell({
  portal,
  title,
  description,
  highlights,
  registrationMode = false,
  children,
}) {
  const branding = useBranding()
  const brandName = branding.brand_name || branding.site_name || 'GOSIKA'
  const logoUrl = branding.logo_light || ''
  const isSeller = portal === 'Seller Portal'

  return (
    <main className={`auth-portal auth-portal--${isSeller ? 'seller' : 'admin'}${registrationMode ? ' auth-portal--register' : ''}`}>
      <div className="auth-portal__frame">
        <header className="auth-portal__header">
          <Link to="/" className="auth-portal__brand" aria-label={`${brandName} home`}>
            {logoUrl ? (
              <img src={apiImage(logoUrl)} alt="" />
            ) : (
              <span className="auth-portal__brand-mark"><ShoppingBag size={17} /></span>
            )}
            <span>{brandName}</span>
          </Link>
          <span className="auth-portal__portal"><span />{portal}</span>
          <Link to="/help" className="auth-portal__help">Need help? <ArrowUpRight size={14} /></Link>
        </header>

        <section className="auth-portal__main">
          <div className="auth-portal__intro">
            <div className="auth-portal__copy">
              <p className="auth-portal__eyebrow">{isSeller ? 'GROW WITH GOSIKA' : 'AUTHORIZED ACCESS ONLY'}</p>
              <h1>Welcome Back<span>{title}</span></h1>
              <p className="auth-portal__description">{description}</p>
              <ul>
                {highlights.map((highlight) => (
                  <li key={highlight}>
                    <CheckCircle2 size={16} />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="auth-portal__art" aria-hidden="true">
              <div className="auth-portal__art-glow" />
              {isSeller ? (
                <div className="auth-portal__seller-scene">
                  <div className="auth-portal__plant"><i /><i /><i /><i /></div>
                  <div className="auth-portal__seller-laptop"><span /><span /><span /><b /></div>
                  <div className="auth-portal__box auth-portal__box--one"><Store size={23} /></div>
                  <div className="auth-portal__box auth-portal__box--two"><Store size={20} /></div>
                  <div className="auth-portal__box auth-portal__box--three"><Store size={17} /></div>
                </div>
              ) : (
                <div className="auth-portal__admin-scene">
                  <div className="auth-portal__admin-device">
                    <div className="auth-portal__device-sidebar"><span /><span /><span /><span /></div>
                    <div className="auth-portal__device-content">
                      <b>Overview</b>
                      <div className="auth-portal__stats"><i /><i /><i /></div>
                      <div className="auth-portal__chart"><span /><span /><span /><span /><span /><span /><span /></div>
                      <div className="auth-portal__device-lines"><i /><i /><i /></div>
                    </div>
                  </div>
                  <div className="auth-portal__plant"><i /><i /><i /><i /></div>
                </div>
              )}
            </div>

            <div className="auth-portal__form-card">
              <div className="auth-portal__form-heading">
                <span>{isSeller ? <Store size={20} /> : <ShieldCheck size={20} />}</span>
                <h2>
                  {registrationMode ? 'Create your Seller Account' : `Login to ${isSeller ? 'Seller Account' : 'Admin Panel'}`}
                </h2>
                <p>
                  {registrationMode
                    ? 'Complete the steps below to apply as a Gosika seller'
                    : isSeller ? 'Access your seller dashboard' : 'Use your authorized Gosika staff account'}
                </p>
              </div>
              {children}
            </div>
          </div>

          <div className="auth-portal__benefits">
            {(isSeller ? [
              { icon: PackageCheck, title: 'Free shipping', detail: 'For your first 30 days' },
              { icon: ShieldCheck, title: 'Secure payments', detail: 'Multiple payment options' },
              { icon: Headset, title: 'Dedicated support', detail: 'We are here to help' },
              { icon: Store, title: 'Grow your business', detail: 'Reach more customers' },
            ] : PORTAL_BENEFITS).map(({ icon: Icon, title: benefitTitle, detail }) => (
              <div className="auth-portal__benefit" key={benefitTitle}>
                <Icon size={20} />
                <span>{benefitTitle}</span>
                <small>{detail}</small>
              </div>
            ))}
          </div>
        </section>

        <footer className="auth-portal__footer">
          <Link to="/" className="auth-portal__footer-brand">
            <ShoppingBag size={15} /> {brandName}
          </Link>
          <span>© {new Date().getFullYear()} {brandName}. All rights reserved.</span>
          <div><Link to="/help">Help Center</Link><Link to="/help">Contact</Link></div>
        </footer>
      </div>
    </main>
  )
}
