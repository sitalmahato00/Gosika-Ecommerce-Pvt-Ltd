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

    // Update document title if site name specified
    if (data.brand_name && document.title.includes('GOSIKA')) {
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
      // Non-fatal, use fallback
      applyBrandingToDOM(branding)
    } finally {
      setLoading(false)
    }
  }, [applyBrandingToDOM, branding])

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
