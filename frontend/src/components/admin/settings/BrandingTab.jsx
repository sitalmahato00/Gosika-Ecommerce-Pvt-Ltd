import React, { useState } from 'react'
import { Palette, Image, Layout, Lock, Upload, X } from 'lucide-react'

const ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp,.ico'

function LogoUpload({ label, form, formKey, fileKey, onChange, disabled, previewBg }) {
  const [objectUrl, setObjectUrl] = useState('')
  const file = form[fileKey]
  const preview = file ? objectUrl : form[formKey]

  const applyFile = (e) => {
    const f = e.target.files?.[0]
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    if (f) {
      setObjectUrl(URL.createObjectURL(f))
      onChange(fileKey, f)
    } else {
      setObjectUrl('')
    }
  }

  const removeFile = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl('')
    onChange(fileKey, null)
  }

  return (
    <div>
      <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 86,
            height: 56,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: previewBg || '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {preview ? (
            <img src={preview} alt={`${label} preview`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>No image</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label
            className="btn btn-outline btn-xs"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', borderRadius: 8 }}
          >
            <Upload size={13} /> Upload
            <input
              type="file"
              accept={ACCEPT}
              style={{ display: 'none' }}
              disabled={disabled}
              onChange={applyFile}
            />
          </label>
          {file && (
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={removeFile}
              disabled={disabled}
              style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 5, color: '#dc2626' }}
            >
              <X size={12} /> Remove
            </button>
          )}
          <input
            type="text"
            className="input input-sm"
            value={form[formKey] || ''}
            onChange={e => onChange(formKey, e.target.value)}
            placeholder="…or paste an existing image URL"
            disabled={disabled}
            style={{ marginTop: 6 }}
          />
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>PNG, JPG, SVG or WebP up to 2 MB</span>
        </div>
      </div>
    </div>
  )
}

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
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>High-resolution SVG or PNG visual assets. Uploaded images are stored locally and applied across the storefront, portals and reports.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <LogoUpload
            label="Logo (Light Background)"
            form={form}
            formKey="logo_light"
            fileKey="logo_light_file"
            onChange={handleChange}
            disabled={disabled}
            previewBg="#f8fafc"
          />

          <LogoUpload
            label="Logo (Dark Background)"
            form={form}
            formKey="logo_dark"
            fileKey="logo_dark_file"
            onChange={handleChange}
            disabled={disabled}
            previewBg="#0f172a"
          />

          <LogoUpload
            label="Favicon (.ico or .png)"
            form={form}
            formKey="favicon_url"
            fileKey="favicon_file"
            onChange={handleChange}
            disabled={disabled}
          />
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
