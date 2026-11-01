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
  CheckCircle2,
  Globe,
  ChevronDown,
  HelpCircle,
  Truck,
  ShieldCheck,
  Headset,
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
import sellerCtaBoxes from '../assets/auth/seller-cta-boxes.jpg'

export default function VendorLogin() {
  const toast = useToast()
  const navigate = useNavigate()
  const { user, booted } = useAuth()
  const [searchParams] = useSearchParams()
  const isRegistering = searchParams.get('mode') === 'register'

  const [form, setForm] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load remembered seller identifier if available
  useEffect(() => {
    try {
      const savedIdentifier = localStorage.getItem('gosika_seller_remember')
      if (savedIdentifier) {
        setForm((prev) => ({ ...prev, identifier: savedIdentifier, rememberMe: true }))
      }
    } catch {}
  }, [])

  // If already authenticated and not in registration mode, redirect to appropriate portal
  useEffect(() => {
    if (!booted || !user || isRegistering) return

    const roles = user.roles || []
    const hasAdminRole = roles.some((role) =>
      !['customer', 'vendor_admin', 'delivery_partner'].includes(role)
    )
    if (hasAdminRole) {
      navigate('/admin', { replace: true })
    } else if (roles.includes('delivery_partner')) {
      navigate('/delivery', { replace: true })
    } else if (roles.includes('vendor_admin')) {
      navigate('/vendor', { replace: true })
    } else {
      navigate('/account', { replace: true })
    }
  }, [booted, isRegistering, navigate, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await api.post('/auth/login', {
        identifier: form.identifier.trim(),
        password: form.password,
        device_name: 'web-seller',
      })

      const { user: authedUser, token } = res.data.data
      const roles = authedUser.roles || []
      const isVendor = roles.includes('vendor_admin')

      // Strict portal enforcement: only vendors allowed
      if (!isVendor) {
        const isCustomer = roles.includes('customer')
        const hasStaffRole = roles.some(
          (role) => !['customer', 'vendor_admin'].includes(role)
        )

        let targetPortal = '/login'
        let portalLabel = 'customer'
        if (hasStaffRole) {
          targetPortal = '/admin/login'
          portalLabel = 'staff/admin'
        }

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
          localStorage.setItem('gosika_seller_remember', form.identifier.trim())
        } else {
          localStorage.removeItem('gosika_seller_remember')
        }
      } catch {}

      // Commit session
      localStorage.setItem('gosika_token', token)
      localStorage.setItem('gosika_user', JSON.stringify(authedUser))

      toast.success(`Welcome back, ${authedUser.name?.split(' ')[0] || 'Seller'}!`)

      // Redirect to seller dashboard
      window.location.href = '/vendor'
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  if (!booted || (user && !isRegistering)) {
    return (
      <div className="portal-redirect-state" role="status">
        <Spinner size={32} color="#FF5500" />
        <span>Verifying seller session…</span>
      </div>
    )
  }

  const features = [
    'List your products',
    'Manage orders & inventory',
    'Track your sales',
    'Get paid securely',
  ]

  const trustItems = [
    {
      icon: Truck,
      title: 'Free Shipping',
      subtitle: 'For your first 30 days',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Payments',
      subtitle: 'Multiple payment options',
    },
    {
      icon: Headset,
      title: 'Dedicated Support',
      subtitle: "We're here to help",
    },
    {
      icon: Store,
      title: 'Grow Your Business',
      subtitle: 'Reach more customers',
    },
  ]

  return (
    <div className="gosika-portal-page seller-portal">
      {/* ── Top Header Navigation ────────────────────────────────────────── */}
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

      {/* ── Registration Mode View ───────────────────────────────────────── */}
      {isRegistering ? (
        <main className="portal-register-wrapper">
          <div className="portal-register-banner">
            <img
              src={sellerWorkspaceHero}
              alt="GOSIKA seller fulfillment network and packing workspace"
            />
          </div>

          <div className="portal-register-head">
            <div className="portal-register-head__icon">
              <Store size={24} />
            </div>
            <h2>Create your Seller Account</h2>
            <p>Complete the steps below to apply as a Gosika seller</p>
            <Link to="/seller/login" className="portal-register-head__back">
              <ArrowLeft size={16} />
              <span>Back to Seller Login</span>
            </Link>
          </div>

          <VendorRegister hideHeader />
        </main>
      ) : (
        /* ── Login Mode View ─────────────────────────────────────────────── */
        <>
          <main className="portal-hero">
            <div className="portal-hero__inner">
              {/* Left Column: Heading, Description, Checklist & Photo */}
              <div className="portal-hero__info">
                <h1 className="portal-hero__heading">
                  Welcome Back
                  <span>Seller</span>
                </h1>

                <p className="portal-hero__description">
                  Grow your business and reach thousands of customers.
                </p>

                <ul className="portal-hero__features">
                  {features.map((feat) => (
                    <li key={feat} className="portal-hero__feature-item">
                      <span className="portal-hero__feature-icon">
                        <CheckCircle2 size={13} strokeWidth={3} />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="portal-hero__photo-card">
                  <img
                    src={sellerWorkspaceHero}
                    alt="Modern e-commerce workspace with laptop, packages, and warehouse shelves"
                  />
                  <div className="portal-hero__photo-badge">
                    <ShieldCheck size={14} />
                    <span>Gosika Seller Network</span>
                  </div>
                </div>
              </div>

              {/* Right Column: White Authentication Card */}
              <div className="portal-card">
                <div className="portal-card__icon-wrap">
                  <Store size={24} />
                </div>

                <h2 className="portal-card__heading">Login to Seller Account</h2>
                <p className="portal-card__subheading">Access your seller dashboard</p>

                {error && (
                  <div className="portal-alert-error" role="alert">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="portal-form">
                  <div className="portal-form__group">
                    <label className="portal-form__label" htmlFor="seller-identifier">
                      Email or Phone *
                    </label>
                    <div className="portal-form__input-wrap">
                      <Mail size={17} className="portal-form__leading-icon" />
                      <input
                        id="seller-identifier"
                        type="text"
                        required
                        className="portal-form__input"
                        placeholder="Enter your email or phone"
                        value={form.identifier}
                        onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="portal-form__group">
                    <label className="portal-form__label" htmlFor="seller-password">
                      Password *
                    </label>
                    <div className="portal-form__input-wrap">
                      <Lock size={17} className="portal-form__leading-icon" />
                      <input
                        id="seller-password"
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
                        <span>Login as Seller</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>

                  <div className="portal-card__divider">
                    <span>or</span>
                  </div>

                  <a
                    href="/api/v1/auth/google/redirect"
                    className="portal-btn-google"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </a>

                  <div className="portal-card__register-row">
                    <span>New to Gosika?</span>
                    <Link to="/seller/login?mode=register" className="portal-btn-signup-link">
                      Sign up
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </main>

          {/* ── Feature Trust Strip ────────────────────────────────────────── */}
          <section className="portal-trust" aria-label="Seller benefits">
            <div className="portal-trust__inner portal-trust__inner--4cols">
              {trustItems.map(({ icon: Icon, title, subtitle }) => (
                <div className="portal-trust__item" key={title}>
                  <div className="portal-trust__icon-wrap">
                    <Icon size={22} />
                  </div>
                  <div className="portal-trust__text">
                    <span className="portal-trust__title">{title}</span>
                    <span className="portal-trust__subtitle">{subtitle}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Dedicated "Be a Part of Gosika" Section ────────────────────── */}
          <section className="seller-cta-section" aria-label="Become a seller">
            <div className="seller-cta-section__inner">
              <div className="seller-cta-section__content">
                <span className="seller-cta-section__pill">• • • GOSIKA • • •</span>
                <h2 className="seller-cta-section__heading">
                  Be a Part of <span>Gosika</span>
                </h2>
                <p className="seller-cta-section__description">
                  Join a trusted marketplace where you can sell confidently and grow your business with us.
                </p>
                <Link to="/seller/login?mode=register" className="seller-cta-section__btn">
                  <span>Learn More</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="seller-cta-section__photo-card">
                <img
                  src={sellerCtaBoxes}
                  alt="Neatly stacked brown delivery parcels stamped with GOSIKA logo"
                />
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Light Warm Marketplace Footer ─────────────────────────────────── */}
      <footer className="portal-footer-light">
        <div className="portal-footer-light__inner">
          <Link to="/" aria-label="GOSIKA Home">
            <GosikaLogo size={28} textColor="#FF5500" />
          </Link>

          <span className="portal-footer-light__copyright">
            © {new Date().getFullYear()} Gosika. All rights reserved.
          </span>

          <nav className="portal-footer-light__links" aria-label="Legal and contact">
            <Link to="/help">Privacy Policy</Link>
            <Link to="/help">Terms of Service</Link>
            <Link to="/help">Contact</Link>
          </nav>

          <div className="portal-footer-light__socials" aria-label="Social media">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="portal-footer-light__social-link" aria-label="Facebook">
              <FacebookIcon size={16} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="portal-footer-light__social-link" aria-label="Instagram">
              <InstagramIcon size={16} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="portal-footer-light__social-link" aria-label="X">
              <TwitterIcon size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
