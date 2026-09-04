import React from 'react'
import { Palette, Image, Layout, Lock, Mail, CheckCircle2 } from 'lucide-react'

export default function BrandingTab({ form, onChange, disabled }) {
  const handleChange = (key, value) => {
    onChange(key, value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Logos & Assets */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Image size={18} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Brand Logos & Favicon</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>High-resolution SVG or PNG visual assets</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Logo (Light Background) URL</label>
            <input
              type="text"
              className="input input-sm"
              value={form.logo_light || ''}
              onChange={e => handleChange('logo_light', e.target.value)}
              placeholder="https://gosika.com.np/logo-light.svg"
              disabled={disabled}
            />
            {form.logo_light && (
              <div style={{ marginTop: 8, padding: 8, background: '#f8fafc', borderRadius: 6, border: '1px solid var(--border)', display: 'inline-block' }}>
                <img src={form.logo_light} alt="Light logo preview" style={{ height: 32, maxWidth: 160, objectFit: 'contain' }} />
              </div>
            )}
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Logo (Dark Background) URL</label>
            <input
              type="text"
              className="input input-sm"
              value={form.logo_dark || ''}
              onChange={e => handleChange('logo_dark', e.target.value)}
              placeholder="https://gosika.com.np/logo-dark.svg"
              disabled={disabled}
            />
            {form.logo_dark && (
              <div style={{ marginTop: 8, padding: 8, background: '#0f172a', borderRadius: 6, display: 'inline-block' }}>
                <img src={form.logo_dark} alt="Dark logo preview" style={{ height: 32, maxWidth: 160, objectFit: 'contain' }} />
              </div>
            )}
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Favicon URL (.ico or .png)</label>
            <input
              type="text"
              className="input input-sm"
              value={form.favicon_url || ''}
              onChange={e => handleChange('favicon_url', e.target.value)}
              placeholder="https://gosika.com.np/favicon.ico"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Palette size={18} color="#8b5cf6" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Theme & Color Palette</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Primary and secondary brand accents used across buttons, links, and badges</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Primary Brand Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={form.primary_color || form.brand_color || '#ff5500'}
                onChange={e => {
                  handleChange('primary_color', e.target.value)
                  handleChange('brand_color', e.target.value)
                }}
                style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                disabled={disabled}
              />
              <input
                type="text"
                className="input input-sm"
                value={form.primary_color || form.brand_color || '#ff5500'}
                onChange={e => {
                  handleChange('primary_color', e.target.value)
                  handleChange('brand_color', e.target.value)
                }}
                disabled={disabled}
              />
            </div>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Dark/Hover Accent</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={form.brand_color_dark || '#e04b00'}
                onChange={e => handleChange('brand_color_dark', e.target.value)}
                style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                disabled={disabled}
              />
              <input
                type="text"
                className="input input-sm"
                value={form.brand_color_dark || '#e04b00'}
                onChange={e => handleChange('brand_color_dark', e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Admin Portal Default Theme</label>
            <select
              className="select select-sm"
              value={form.admin_theme || 'light'}
              onChange={e => handleChange('admin_theme', e.target.value)}
              disabled={disabled}
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
              <option value="system">Follow System Preferences</option>
            </select>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Admin Sidebar Default</label>
            <select
              className="select select-sm"
              value={form.sidebar_default || 'expanded'}
              onChange={e => handleChange('sidebar_default', e.target.value)}
              disabled={disabled}
            >
              <option value="expanded">Expanded (Standard)</option>
              <option value="collapsed">Collapsed (Icons only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Storefront & Homepage Hero */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Layout size={18} color="#2563eb" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Storefront Content & Footer</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Banner text and copyright statements</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Homepage Hero Main Heading</label>
            <input
              type="text"
              className="input input-sm"
              value={form.homepage_hero_text || 'Discover Authentic Nepali Products'}
              onChange={e => handleChange('homepage_hero_text', e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Homepage Hero Subtext</label>
            <input
              type="text"
              className="input input-sm"
              value={form.homepage_hero_sub || 'Shop from verified merchant sellers across all 7 provinces with swift local delivery'}
              onChange={e => handleChange('homepage_hero_sub', e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Footer Copyright Statement</label>
            <input
              type="text"
              className="input input-sm"
              value={form.footer_text || '© 2026 GOSIKA Pvt. Ltd. All rights reserved.'}
              onChange={e => handleChange('footer_text', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Login & Email Customization */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Lock size={18} color="#d97706" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Portal Login & Transactional Emails</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Branding applied to authentication screens and transactional emails</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Auth Screen Heading</label>
            <input
              type="text"
              className="input input-sm"
              value={form.login_heading || 'Sign in to GOSIKA'}
              onChange={e => handleChange('login_heading', e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Email Header Title</label>
            <input
              type="text"
              className="input input-sm"
              value={form.email_header || 'GOSIKA Marketplace Notifications'}
              onChange={e => handleChange('email_header', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
