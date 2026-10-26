import React, { useState } from 'react'
import {
  Palette, Image, Layout, Lock, Upload, X,
  Share2, Search, Mail, Globe, Tag, MessageSquare,
  ShoppingBag, Star, Eye, Bell,
} from 'lucide-react'

const ACCEPT_IMAGE = 'image/png,image/jpeg,image/svg+xml,image/webp,.ico'

function LogoUpload({ label, form, formKey, fileKey, onChange, disabled, previewBg, hint }) {
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
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>No image…</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label
              className="btn btn-outline btn-xs"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: disabled ? 'not-allowed' : 'pointer', borderRadius: 8 }}
            >
              <Upload size={13} /> Upload
              <input
                type="file"
                accept={ACCEPT_IMAGE}
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#dc2626' }}
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>
          <input
            type="text"
            className="input input-sm"
            value={form[formKey] || ''}
            onChange={e => onChange(formKey, e.target.value)}
            placeholder="…or paste an existing image URL"
            disabled={disabled}
            style={{ marginTop: 6 }}
          />
          {hint && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{hint}</span>}
        </div>
      </div>
    </div>
  )
}

function ColorField({ label, formKey, form, onChange, disabled, hint }) {
  const value = form[formKey] || '#ff5500'
  return (
    <div>
      <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: value,
              border: '2px solid var(--border)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              overflow: 'hidden',
            }}
          >
            <input
              type="color"
              value={value}
              onChange={e => onChange(formKey, e.target.value)}
              disabled={disabled}
              style={{
                opacity: 0,
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            />
          </div>
        </div>
        <input
          type="text"
          className="input input-sm"
          value={value}
          onChange={e => onChange(formKey, e.target.value)}
          placeholder="#ff5500"
          disabled={disabled}
          style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
        />
      </div>
      {hint && <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'block' }}>{hint}</span>}
    </div>
  )
}

export default function BrandingTab({ form, onChange, disabled }) {
  const primary = form.primary_color || form.brand_color || '#ff5500'
  const dark = form.brand_color_dark || '#e04b00'

  const handleChange = (key, value) => onChange(key, value)
  const handleColorChange = (key, value) => {
    onChange(key, value)
    if (key === 'primary_color') onChange('brand_color', value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Brand Logos & Favicon ───────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Image size={18} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Brand Logos & Favicon</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              High-resolution SVG or PNG visual assets. Uploaded images are stored locally and applied across the storefront, portals and reports.
            </p>
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
            hint="PNG, JPG, SVG or WebP"
          />

          <LogoUpload
            label="Logo (Dark Background)"
            form={form}
            formKey="logo_dark"
            fileKey="logo_dark_file"
            onChange={handleChange}
            disabled={disabled}
            previewBg="#0f172a"
            hint="PNG, JPG, SVG or WebP"
          />

          <LogoUpload
            label="Favicon (.ico or .png)"
            form={form}
            formKey="favicon_url"
            fileKey="favicon_file"
            onChange={handleChange}
            disabled={disabled}
            previewBg="#f8fafc"
            hint="PNG, ICO or SVG"
          />
        </div>
      </div>

      {/* ── Theme & Color Palette ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Palette size={18} color="#8b5cf6" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Theme & Color Palette</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Primary and secondary brand accents used across buttons, links, and badges</p>
          </div>
        </div>

        {/* Live color strip preview */}
        <div
          style={{
            marginBottom: 16,
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              background: primary,
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Primary</span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>{primary}</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <div style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Button</div>
              <div style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Badge</div>
            </div>
          </div>
          <div
            style={{
              padding: '12px 16px',
              background: dark,
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hover/Dark</span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>{dark}</span>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <div style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Hover</div>
              <div style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Active</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <ColorField
            label="Primary Brand Color"
            formKey="primary_color"
            form={form}
            onChange={handleColorChange}
            disabled={disabled}
            hint="Main CTA buttons, links, highlights"
          />
          <ColorField
            label="Dark / Hover Accent"
            formKey="brand_color_dark"
            form={form}
            onChange={handleChange}
            disabled={disabled}
            hint="Button hover states and active elements"
          />

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

      {/* ── Storefront Content & Footer ────────────────────────────────────────── */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Layout size={18} color="#2563eb" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Storefront Content & Footer</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Banner text and copyright statements</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
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
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Storefront Brand Tagline</label>
              <input
                type="text"
                className="input input-sm"
                value={form.storefront_tagline || ''}
                onChange={e => handleChange('storefront_tagline', e.target.value)}
                placeholder="e.g. Nepal's Premier Multi-Vendor Marketplace"
                disabled={disabled}
              />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Displayed beneath the logo on the storefront header</span>
            </div>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Vendor Storefront Banner Text</label>
              <input
                type="text"
                className="input input-sm"
                value={form.vendor_banner_text || ''}
                onChange={e => handleChange('vendor_banner_text', e.target.value)}
                placeholder="e.g. Verified seller on GOSIKA Marketplace"
                disabled={disabled}
              />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Shown on individual vendor storefronts</span>
            </div>
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Announcement Banner</label>
              <input
                type="text"
                className="input input-sm"
                value={form.announcement_banner || ''}
                onChange={e => handleChange('announcement_banner', e.target.value)}
                placeholder="e.g. Free delivery on orders above रू 2,000!"
                disabled={disabled}
              />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Shown as a top bar across the entire storefront</span>
            </div>
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

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Footer Additional Links / Legal Notice</label>
            <input
              type="text"
              className="input input-sm"
              value={form.footer_legal || ''}
              onChange={e => handleChange('footer_legal', e.target.value)}
              placeholder="e.g. GOSIKA is a registered trademark of Gosika Pvt. Ltd., Nepal."
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* ── SEO & Social Sharing ───────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Search size={18} color="#0284c7" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>SEO & Social Sharing</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Meta tags, Open Graph image, and social platform profiles for the marketplace</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>SEO Meta Description</label>
            <textarea
              className="textarea"
              rows={2}
              value={form.seo_meta_description || ''}
              onChange={e => handleChange('seo_meta_description', e.target.value)}
              placeholder="Official e-commerce marketplace connecting authentic Nepali sellers with buyers across all 7 provinces."
              disabled={disabled}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Recommended 150–160 characters. Used in search engine result pages.</span>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Open Graph / Social Share Image URL</label>
            <input
              type="text"
              className="input input-sm"
              value={form.og_image_url || ''}
              onChange={e => handleChange('og_image_url', e.target.value)}
              placeholder="https://gosika.com.np/og-cover.jpg"
              disabled={disabled}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>1200×630 px image shown when the storefront URL is shared on social platforms</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Facebook Page URL</label>
              <input
                type="url"
                className="input input-sm"
                value={form.social_facebook || ''}
                onChange={e => handleChange('social_facebook', e.target.value)}
                placeholder="https://facebook.com/gosika"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Instagram Profile URL</label>
              <input
                type="url"
                className="input input-sm"
                value={form.social_instagram || ''}
                onChange={e => handleChange('social_instagram', e.target.value)}
                placeholder="https://instagram.com/gosika"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Twitter / X Profile URL</label>
              <input
                type="url"
                className="input input-sm"
                value={form.social_twitter || ''}
                onChange={e => handleChange('social_twitter', e.target.value)}
                placeholder="https://twitter.com/gosika"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>YouTube Channel URL</label>
              <input
                type="url"
                className="input input-sm"
                value={form.social_youtube || ''}
                onChange={e => handleChange('social_youtube', e.target.value)}
                placeholder="https://youtube.com/@gosika"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Portal Login & Transactional Emails ───────────────────────────────── */}
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
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Auth Screen Description</label>
            <input
              type="text"
              className="input input-sm"
              value={form.login_description || ''}
              onChange={e => handleChange('login_description', e.target.value)}
              placeholder="Welcome back! Sign in to manage your account."
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

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Email Footer Text</label>
            <input
              type="text"
              className="input input-sm"
              value={form.email_footer || ''}
              onChange={e => handleChange('email_footer', e.target.value)}
              placeholder="© 2026 GOSIKA Pvt. Ltd. All rights reserved."
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* ── Marketplace Trust & Policy Labels ─────────────────────────────────── */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <ShoppingBag size={18} color="#16a34a" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Marketplace Trust & Policy Labels</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
              Short trust badges and policy copy shown on product pages, cart, and checkout
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Verified Seller Badge Label</label>
            <input
              type="text"
              className="input input-sm"
              value={form.verified_seller_label || 'Verified Seller'}
              onChange={e => handleChange('verified_seller_label', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Authentic Product Badge Label</label>
            <input
              type="text"
              className="input input-sm"
              value={form.authentic_product_label || 'Authentic Product'}
              onChange={e => handleChange('authentic_product_label', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Return Policy Summary</label>
            <input
              type="text"
              className="input input-sm"
              value={form.return_policy_label || '7-Day Easy Returns'}
              onChange={e => handleChange('return_policy_label', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Secure Checkout Label</label>
            <input
              type="text"
              className="input input-sm"
              value={form.secure_checkout_label || 'Safe & Secure Checkout'}
              onChange={e => handleChange('secure_checkout_label', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Fast Delivery Badge Label</label>
            <input
              type="text"
              className="input input-sm"
              value={form.fast_delivery_label || 'Swift Local Delivery'}
              onChange={e => handleChange('fast_delivery_label', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Customer Support Tagline</label>
            <input
              type="text"
              className="input input-sm"
              value={form.support_tagline || '24/7 Customer Support'}
              onChange={e => handleChange('support_tagline', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
