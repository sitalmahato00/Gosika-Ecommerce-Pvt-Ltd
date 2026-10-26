import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/client'

const BrandingContext = createContext(null)

const DEFAULT_BRANDING = {
  brand_name: 'GOSIKA',
  tagline: "Nepal's Premier Multi-Vendor Marketplace",
  logo_light: '',
  logo_dark: '',
  favicon_url: '',
  primary_color: '#ff5500',
  brand_color_dark: '#e04b00',
  support_email: 'support@gosika.com.np',
  support_phone: '+977-1-4200000',
  business_address: 'Kathmandu, Nepal',
  footer_text: '© 2026 GOSIKA Pvt. Ltd. All rights reserved.',
  currency_symbol: 'रु',
  currency: 'NPR',
  maintenance_mode: false,
  maintenance_message: '',
  // Storefront content
  homepage_hero_text: 'Discover Authentic Nepali Products',
  homepage_hero_sub: 'Shop from verified merchant sellers across all 7 provinces with swift local delivery',
  storefront_tagline: '',
  vendor_banner_text: '',
  announcement_banner: '',
  footer_legal: '',
  // SEO & social
  seo_meta_description: '',
  og_image_url: '',
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_youtube: '',
  // Trust & policy labels
  verified_seller_label: 'Verified Seller',
  authentic_product_label: 'Authentic Product',
  return_policy_label: '7-Day Easy Returns',
  secure_checkout_label: 'Safe & Secure Checkout',
  fast_delivery_label: 'Swift Local Delivery',
  support_tagline: '24/7 Customer Support',
  // Auth / email
  login_heading: 'Sign in to GOSIKA',
  login_description: '',
  email_header: 'GOSIKA Marketplace Notifications',
  email_footer: '',
}

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(() => {
    try {
      const cached = localStorage.getItem('gosika_branding')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.primary_color === '#6366f1') parsed.primary_color = '#ff5500'
        if (parsed.brand_color_dark === '#4338ca') parsed.brand_color_dark = '#e04b00'
        return { ...DEFAULT_BRANDING, ...parsed }
      }
      return DEFAULT_BRANDING
    } catch {
      return DEFAULT_BRANDING
    }
  })
  const [loading, setLoading] = useState(true)

  const applyBrandingToDOM = useCallback((data) => {
    if (!data) return

    // Apply primary color to document root
    const primary = (data.primary_color && data.primary_color !== '#6366f1') ? data.primary_color : '#ff5500'
    const dark = (data.brand_color_dark && data.brand_color_dark !== '#4338ca') ? data.brand_color_dark : '#e04b00'
    document.documentElement.style.setProperty('--primary', primary)
    document.documentElement.style.setProperty('--primary-600', primary)
    document.documentElement.style.setProperty('--primary-dark', dark)

    // Update document title if site name specified (avoid duplicating the brand name)
    if (data.brand_name && document.title.includes('GOSIKA') && !document.title.includes(data.brand_name)) {
      document.title = document.title.replace(/GOSIKA/g, data.brand_name)
    }

    // Update favicon if url present
    if (data.favicon_url) {
      let link = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = data.favicon_url
    }
  }, [])

  const fetchBranding = useCallback(async () => {
    try {
      const res = await api.get('/platform/config')
      const data = res.data?.data || {}
      const merged = { ...DEFAULT_BRANDING, ...data }
      setBranding(merged)
      try {
        localStorage.setItem('gosika_branding', JSON.stringify(merged))
      } catch {}
      applyBrandingToDOM(merged)
    } catch (err) {
      // Non-fatal: apply whatever is already in state via the functional updater
      // (avoids closing over `branding` which would add it to deps → infinite loop)
      setBranding((current) => {
        applyBrandingToDOM(current)
        return current
      })
    } finally {
      setLoading(false)
    }
  // ⚠️  Do NOT add `branding` here — it would recreate fetchBranding on every
  //     setBranding() call, causing useEffect below to loop infinitely and
  //     crash the browser tab with "Page Unresponsive".
  }, [applyBrandingToDOM])

  useEffect(() => {
    fetchBranding()
  }, [fetchBranding])

  return (
    <BrandingContext.Provider
      value={{
        ...branding,
        branding,
        loading,
        reloadBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  return context || DEFAULT_BRANDING
}
