import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Globe,
  ChevronDown,
  HelpCircle,
  Headset,
  Package,
  AlertCircle,
} from 'lucide-react'
import GosikaLogo from '../components/common/GosikaLogo'
import { FacebookIcon, InstagramIcon, TwitterIcon } from '../components/common/SocialIcons'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { getPortalHome, getUserPortal } from '../utils/portalAccess'
import { useBranding } from '../context/BrandingContext'
import { apiImage } from '../utils/format'
import api from '../api/client'
import adminDashboardHero from '../assets/auth/admin-dashboard-hero.jpg'

export default function AdminLogin() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user, booted } = useAuth()
  const branding = useBranding()
  const brandName = branding.brand_name || branding.site_name || 'GOSIKA'
  const logoUrl = branding.logo_light || branding.logo_dark

  const features = [
    'Manage vendors & products',
    'Handle orders & payments',
    'Track platform performance',
    'Configure system settings',
  ]
  const trustItems = [
    { icon: ShieldCheck, title: 'Secure Access', subtitle: 'Your data is protected' },
    { icon: Headset, title: '24/7 Support', subtitle: 'Our team is always here' },
    { icon: Package, title: 'Reliable Platform', subtitle: 'Built for growth' },
  ]

  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load remembered admin email if available
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('gosika_admin_remember')
      if (savedEmail) {
        setForm((prev) => ({ ...prev, email: savedEmail, rememberMe: true }))
      }
    } catch {}
  }, [])

  // If already authenticated, redirect to appropriate destination
  useEffect(() => {
    if (!booted || !user) return

    navigate(getPortalHome(user), { replace: true })
  }, [booted, navigate, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await api.post('/auth/login', {
        identifier: form.email.trim(),
        password: form.password,
        device_name: 'web-admin',
      })

      const { user: authedUser, token } = res.data.data
      const portal = getUserPortal(authedUser)

      if (portal !== 'admin' && portal !== 'delivery') {
        const targetPortal = portal === 'delivery'
          ? '/delivery'
          : portal === 'vendor'
            ? '/seller/login'
            : portal === 'customer'
              ? '/login'
              : '/access-denied'
        const portalLabel = portal === 'delivery' ? 'delivery partner' : portal

        // Revoke token immediately
        try {
          await api.post('/auth/logout', null, {
            headers: { Authorization: `Bearer ${token}` },
          })
        } catch {}

        setError(
          `This account belongs to the ${portalLabel} portal. Please sign in through ${targetPortal}.`
        )
        setLoading(false)
        return
      }

      // Remember me handling
      try {
        if (form.rememberMe) {
          localStorage.setItem('gosika_admin_remember', form.email.trim())
        } else {
          localStorage.removeItem('gosika_admin_remember')
        }
      } catch {}

      // Commit session
      localStorage.setItem('gosika_token', token)
      localStorage.setItem('gosika_user', JSON.stringify(authedUser))

      toast.success(`Welcome back, ${authedUser.name?.split(' ')[0] || 'Admin'}!`)

      // Redirect
      window.location.href = getPortalHome(authedUser)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  if (!booted || user) {
    return (
      <div className="portal-redirect-state" role="status">
        <Spinner size={32} color="#FF5500" />
        <span>Verifying admin session…</span>
      </div>
    )
  }

  return (
    <div className="gosika-portal-page admin-portal">
      {/* ── Top Header Navigation ────────────────────────────────────────── */}
      <header className="portal-header">
        <div className="portal-header__inner">
          <div className="portal-header__brand-group">
            <Link to="/" aria-label="GOSIKA Home">
              {logoUrl ? (
                <img className="portal-header__logo" src={apiImage(logoUrl)} alt={brandName} />
              ) : (
                <GosikaLogo size={34} textColor="#FF5500" />
              )}
            </Link>
            <div className="portal-header__divider" aria-hidden="true" />
            <span className="portal-header__portal-badge">Admin Portal</span>
          </div>

          <div className="portal-header__actions">
            <button type="button" className="portal-header__lang-btn" aria-label="Language selector">
              <Globe size={15} />
              <span>English</span>
              <ChevronDown size={13} />
            </button>
            <Link to="/help" className="portal-header__help-link">
              <HelpCircle size={15} />
              <span>Need Help?</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="portal-hero">
        <div className="portal-hero__inner">
          <section className="portal-hero__info">
            <h1 className="portal-hero__heading">
              Welcome Back <span>Admin</span>
            </h1>
            <p className="portal-hero__description">
              Manage your marketplace, users, products and keep everything running smoothly.
            </p>
            <ul className="portal-hero__features">
              {features.map((feature) => (
                <li key={feature} className="portal-hero__feature-item">
                  <span className="portal-hero__feature-icon"><CheckCircle2 size={13} strokeWidth={3} /></span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="portal-hero__photo-card">
              <img
                src={adminDashboardHero}
                alt="Modern workspace for managing the Gosika marketplace"
              />
              <div className="portal-hero__photo-badge">
                <ShieldCheck size={14} />
                <span>Gosika Administration</span>
              </div>
            </div>
          </section>

          <section className="portal-card">
            <div className="portal-card__icon-wrap portal-card__icon-wrap--brand">
              {logoUrl ? (
                <img className="portal-card__brand-logo" src={apiImage(logoUrl)} alt={brandName} />
              ) : (
                <GosikaLogo size={34} showText={false} />
              )}
            </div>

            <h2 className="portal-card__heading">Login to Admin Panel</h2>
            <p className="portal-card__subheading">Access your Gosika administration</p>

            {error && (
              <div className="portal-alert-error" role="alert">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="portal-form">
              <div className="portal-form__group">
                <label className="portal-form__label" htmlFor="admin-email">
                  Email Address *
                </label>
                <div className="portal-form__input-wrap">
                  <Mail size={17} className="portal-form__leading-icon" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    className="portal-form__input"
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="portal-form__group">
                <label className="portal-form__label" htmlFor="admin-password">
                  Password *
                </label>
                <div className="portal-form__input-wrap">
                  <Lock size={17} className="portal-form__leading-icon" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="portal-form__input portal-form__input--password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="portal-form__trailing-btn"
                    onClick={() => setShowPassword(!showPassword)}
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
                    onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="portal-form__forgot-link">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="portal-btn-primary"
              >
                {loading ? (
                  <>
                    <Spinner size={16} color="#ffffff" />
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    <span>Login as Admin</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <p className="portal-card__subtext">
                <span>•</span> Restricted to authorized administrators and staff
              </p>
            </form>
          </section>
        </div>
      </main>

      <section className="portal-trust" aria-label="Platform assurance">
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
          <Link to="/" aria-label={`${brandName} Home`}>
            {logoUrl ? (
              <img className="portal-footer__logo" src={apiImage(logoUrl)} alt={brandName} />
            ) : (
              <GosikaLogo size={28} textColor="#FFFFFF" />
            )}
          </Link>
          <span className="portal-footer-dark__copyright">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </span>
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
