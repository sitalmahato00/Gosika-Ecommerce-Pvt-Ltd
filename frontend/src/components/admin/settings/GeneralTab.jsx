import React from 'react'
import { Building, Globe, Mail, Phone, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function GeneralTab({ form, onChange, disabled }) {
  const handleChange = (key, value) => {
    onChange(key, value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Platform Identity */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Building size={18} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Platform & Business Identity</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Core marketplace naming and legal entity metadata</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Platform Name *</label>
            <input
              type="text"
              className="input input-sm"
              value={form.platform_name || form.site_name || ''}
              onChange={e => {
                handleChange('platform_name', e.target.value)
                handleChange('site_name', e.target.value)
              }}
              placeholder="e.g. GOSIKA"
              disabled={disabled}
            />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Displayed on customer storefront, emails, and invoices</span>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Tagline / Slogan</label>
            <input
              type="text"
              className="input input-sm"
              value={form.tagline || form.site_tagline || ''}
              onChange={e => {
                handleChange('tagline', e.target.value)
                handleChange('site_tagline', e.target.value)
              }}
              placeholder="e.g. Nepal's Premier Multi-Vendor Marketplace"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Platform Public URL</label>
            <input
              type="url"
              className="input input-sm"
              value={form.platform_url || ''}
              onChange={e => handleChange('platform_url', e.target.value)}
              placeholder="https://gosika.com.np"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Business Address</label>
            <input
              type="text"
              className="input input-sm"
              value={form.business_address || form.site_address || ''}
              onChange={e => {
                handleChange('business_address', e.target.value)
                handleChange('site_address', e.target.value)
              }}
              placeholder="e.g. Putalisadak, Kathmandu, Nepal"
              disabled={disabled}
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Platform Description (SEO)</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.description || form.site_description || ''}
            onChange={e => {
              handleChange('description', e.target.value)
              handleChange('site_description', e.target.value)
            }}
            placeholder="Official e-commerce marketplace connecting authentic sellers with buyers across all 7 provinces of Nepal."
            disabled={disabled}
          />
        </div>
      </div>

      {/* Regional & Localization */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Globe size={18} color="#0284c7" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Regional & Currency Settings</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Currency symbol formatting, timezone, and regional defaults</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Base Currency Code</label>
            <select
              className="select select-sm"
              value={form.currency || 'NPR'}
              onChange={e => handleChange('currency', e.target.value)}
              disabled={disabled}
            >
              <option value="NPR">NPR (Nepalese Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="INR">INR (Indian Rupee)</option>
            </select>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Currency Symbol</label>
            <input
              type="text"
              className="input input-sm"
              value={form.currency_symbol || 'रू'}
              onChange={e => handleChange('currency_symbol', e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Symbol Placement</label>
            <select
              className="select select-sm"
              value={form.currency_position || 'before'}
              onChange={e => handleChange('currency_position', e.target.value)}
              disabled={disabled}
            >
              <option value="before">Before Amount (रू 1,500)</option>
              <option value="after">After Amount (1,500 रू)</option>
            </select>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Marketplace Timezone</label>
            <select
              className="select select-sm"
              value={form.timezone || 'Asia/Kathmandu'}
              onChange={e => handleChange('timezone', e.target.value)}
              disabled={disabled}
            >
              <option value="Asia/Kathmandu">Asia/Kathmandu (UTC +05:45)</option>
              <option value="UTC">UTC (GMT +00:00)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <AlertTriangle size={18} color="#d97706" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Platform Maintenance Control</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Temporarily suspend public storefront while performing infrastructure upgrades</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>Enable Maintenance Mode</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>When enabled, customers see the maintenance notice instead of the shopping catalog</div>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={form.maintenance_mode === true || form.maintenance_mode === 'true'}
            onChange={e => handleChange('maintenance_mode', e.target.checked)}
            disabled={disabled}
          />
        </div>

        {(form.maintenance_mode === true || form.maintenance_mode === 'true') && (
          <div style={{ marginTop: 14 }}>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Maintenance Notice to Visitors</label>
            <textarea
              className="textarea"
              rows={2}
              value={form.maintenance_message || ''}
              onChange={e => handleChange('maintenance_message', e.target.value)}
              placeholder="We are currently undergoing scheduled maintenance to serve you better. We will be back online shortly!"
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Support & Contact */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Mail size={18} color="#16a34a" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Customer Support & Inquiries</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Helpdesk channels displayed in footer and transaction communications</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Support Email *</label>
            <input
              type="email"
              className="input input-sm"
              value={form.support_email || ''}
              onChange={e => handleChange('support_email', e.target.value)}
              placeholder="support@gosika.com.np"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Support Phone / Hotline *</label>
            <input
              type="text"
              className="input input-sm"
              value={form.support_phone || ''}
              onChange={e => handleChange('support_phone', e.target.value)}
              placeholder="+977-1-4200000"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Business Inquiries Email</label>
            <input
              type="email"
              className="input input-sm"
              value={form.business_email || ''}
              onChange={e => handleChange('business_email', e.target.value)}
              placeholder="partners@gosika.com.np"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Customer Help Center URL</label>
            <input
              type="url"
              className="input input-sm"
              value={form.customer_support_url || ''}
              onChange={e => handleChange('customer_support_url', e.target.value)}
              placeholder="https://gosika.com.np/help"
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
