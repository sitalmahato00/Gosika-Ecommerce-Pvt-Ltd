import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  CheckCircle2,
  Globe,
  ChevronDown,
  ShieldCheck,
  PackageCheck,
  TrendingUp,
  Headset,
  Package,
  AlertCircle,
} from 'lucide-react'
import GosikaLogo from '../components/common/GosikaLogo'
import { FacebookIcon, InstagramIcon, TwitterIcon } from '../components/common/SocialIcons'
import VendorRegister from './vendor/VendorRegister'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import sellerWorkspaceHero from '../assets/auth/seller-workspace-hero.jpg'

/* ─── Feature list ─────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: PackageCheck, text: 'Easy Product Management' },
  { icon: TrendingUp,   text: 'Real-time Order Tracking' },
  { icon: ShieldCheck,  text: 'Secure Payments' },
  { icon: Headset,      text: 'Dedicated Seller Support' },
]

export default function VendorLogin() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user, booted } = useAuth()
  const [searchParams] = useSearchParams()
  const isRegistering = searchParams.get('mode') === 'register'

  const [form, setForm] = useState({ identifier: '', password: '', rememberMe: false })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  /* Restore remembered identifier */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gosika_seller_remember')
      if (saved) setForm(p => ({ ...p, identifier: saved, rememberMe: true }))
    } catch {}
  }, [])

  /* Already-authenticated redirect */
  useEffect(() => {
    if (!booted || !user || isRegistering) return
    const roles = user.roles || []
    if (roles.includes('delivery_partner')) {
      navigate('/delivery', { replace: true })
    } else if (roles.includes('vendor_admin')) {
      navigate('/vendor', { replace: true })
    } else {
      navigate('/account', { replace: true })
    }
  }, [booted, isRegistering, navigate, user])

  /* Login handler */
  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/login', {
        identifier: form.identifier.trim(),
        password: form.password,
        device_name: 'web-seller',
      })
      const { user: u, token } = res.data.data
      const roles = u.roles || []

      if (!roles.includes('vendor_admin')) {
        /* Wrong portal — revoke token immediately */
        try { await api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } }) } catch {}
        setError('This account is not a seller account. Please use your seller credentials.')
        setLoading(false)
        return
      }

      try {
        form.rememberMe
          ? localStorage.setItem('gosika_seller_remember', form.identifier.trim())
          : localStorage.removeItem('gosika_seller_remember')
      } catch {}

      localStorage.setItem('gosika_token', token)
      localStorage.setItem('gosika_user', JSON.stringify(u))
      toast.success(`Welcome back, ${u.name?.split(' ')[0] || 'Seller'}!`)
      window.location.href = '/vendor'
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  /* Loading / redirect state */
  if (!booted || (user && !isRegistering)) {
    return (
      <div className="portal-redirect-state" role="status">
        <Spinner size={32} color="#FF5500" />
        <span>Verifying seller session…</span>
      </div>
    )
  }

  const trustItems = [
    { icon: ShieldCheck, title: 'Secure Seller Access', subtitle: 'Your store data is protected' },
    { icon: Headset, title: 'Seller Support', subtitle: 'Help when you need it' },
    { icon: Package, title: 'Built for Growth', subtitle: 'Tools to grow your business' },
  ]

  return (
    <div className="gosika-portal-page seller-portal">
      <header className="portal-header">
        <div className="portal-header__inner">
          <div className="portal-header__brand-group">
            <Link to="/" aria-label="GOSIKA Home">
              <GosikaLogo size={34} textColor="#FF5500" />
            </Link>
            <div className="portal-header__divider" aria-hidden="true" />
            <span className="portal-header__portal-badge">Seller Portal</span>
          </div>
          <div className="portal-header__actions">
            <span className="portal-header__lang-btn">
              <Globe size={15} /> English <ChevronDown size={13} />
            </span>
            <Link to="/help" className="portal-header__help-link">
              <HelpCircle size={15} /> Need Help?
            </Link>
          </div>
        </div>
      </header>

      <main className="portal-hero seller-portal__hero">
        <div className="portal-hero__inner">
          <section className="portal-hero__info">
            <h1 className="portal-hero__heading">
              {isRegistering ? 'Start Selling on' : 'Welcome Back'}
              <span>{isRegistering ? ' GOSIKA' : ' Seller'}</span>
            </h1>
            <p className="portal-hero__description">
              {isRegistering
                ? 'Create your seller account and bring your products to more customers.'
                : 'Manage your products, orders and store on the GOSIKA marketplace.'}
            </p>
            <ul className="portal-hero__features">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="portal-hero__feature-item">
                  <span className="portal-hero__feature-icon"><CheckCircle2 size={13} strokeWidth={3} /></span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="portal-hero__photo-card">
              <img src={sellerWorkspaceHero} alt="Seller workspace with products and order management" />
              <div className="portal-hero__photo-badge">
                <Store size={14} /> <span>GOSIKA Seller Workspace</span>
              </div>
            </div>
          </section>

          <section className={`portal-card${isRegistering ? ' portal-card--seller-register' : ''}`}>
            {isRegistering ? (
              <>
                <div className="portal-card__icon-wrap portal-card__icon-wrap--seller"><Store size={24} /></div>
                <h2 className="portal-card__heading">Create Seller Account</h2>
                <p className="portal-card__subheading">Enter your basic details to get started</p>
                <Link to="/seller/login" className="portal-card__back-link">
                  <ArrowLeft size={14} /> Back to Seller Login
                </Link>
                <VendorRegister hideHeader embedded />
              </>
            ) : (
              <>
                <div className="portal-card__icon-wrap portal-card__icon-wrap--seller"><Store size={24} /></div>
                <h2 className="portal-card__heading">Login to Seller Panel</h2>
                <p className="portal-card__subheading">Access your GOSIKA seller account</p>
                {error && (
                  <div className="portal-alert-error" role="alert">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="portal-form">
                  <div className="portal-form__group">
                    <label className="portal-form__label" htmlFor="seller-email">Email Address *</label>
                    <div className="portal-form__input-wrap">
                      <Mail size={17} className="portal-form__leading-icon" />
                      <input
                        id="seller-email"
                        type="text"
                        required
                        className="portal-form__input"
                        placeholder="Enter your email address"
                        value={form.identifier}
                        onChange={e => setForm({ ...form, identifier: e.target.value })}
                        autoComplete="username"
                      />
                    </div>
                  </div>
                  <div className="portal-form__group">
                    <label className="portal-form__label" htmlFor="seller-password">Password *</label>
                    <div className="portal-form__input-wrap">
                      <Lock size={17} className="portal-form__leading-icon" />
                      <input
                        id="seller-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="portal-form__input portal-form__input--password"
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="portal-form__trailing-btn"
                        onClick={() => setShowPassword(v => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="portal-form__options-row">
                    <label className="portal-form__checkbox-label">
                      <input
                        type="checkbox"
                        className="portal-form__checkbox"
                        checked={form.rememberMe}
                        onChange={e => setForm({ ...form, rememberMe: e.target.checked })}
                      />
                      <span>Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="portal-form__forgot-link">Forgot Password?</Link>
                  </div>
                  <button type="submit" disabled={loading} className="portal-btn-primary">
                    {loading ? <><Spinner size={16} color="#ffffff" /><span>Signing in…</span></> : <><span>Login as Seller</span><ArrowRight size={17} /></>}
                  </button>
                  <p className="portal-card__subtext"><span>•</span> Seller accounts only</p>
                </form>
                <div className="portal-card__register-row">
                  <span>New to GOSIKA?</span>
                  <Link to="/seller/login?mode=register" className="portal-btn-signup-link">Create Seller Account</Link>
                </div>
                <Link to="/" className="portal-card__back-link"><ArrowLeft size={14} /> Back to Marketplace</Link>
              </>
            )}
          </section>
        </div>
      </main>

      <section className="portal-trust" aria-label="Seller platform benefits">
        <div className="portal-trust__inner portal-trust__inner--3cols">
          {trustItems.map(({ icon: Icon, title, subtitle }) => (
            <div className="portal-trust__item" key={title}>
              <div className="portal-trust__icon-wrap"><Icon size={22} /></div>
              <div className="portal-trust__text">
                <span className="portal-trust__title">{title}</span>
                <span className="portal-trust__subtitle">{subtitle}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="portal-footer-dark">
        <div className="portal-footer-dark__inner">
          <Link to="/" aria-label="GOSIKA Home"><GosikaLogo size={28} textColor="#FFFFFF" /></Link>
          <span className="portal-footer-dark__copyright">© {new Date().getFullYear()} Gosika. All rights reserved.</span>
          <nav className="portal-footer-dark__links" aria-label="Legal and contact">
            <Link to="/help">Privacy Policy</Link>
            <Link to="/help">Terms of Service</Link>
            <Link to="/help">Contact</Link>
          </nav>
          <div className="portal-footer-dark__socials" aria-label="Social media">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="portal-footer-dark__social-link" aria-label="Facebook"><FacebookIcon size={16} /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="portal-footer-dark__social-link" aria-label="Instagram"><InstagramIcon size={16} /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="portal-footer-dark__social-link" aria-label="X"><TwitterIcon size={16} /></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
