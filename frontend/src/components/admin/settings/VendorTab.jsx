import React from 'react'
import { Store, ShieldCheck, CheckSquare, Sliders, Users } from 'lucide-react'

export default function VendorTab({ form, onChange, disabled }) {
  const handleChange = (key, value) => {
    onChange(key, value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Vendor Onboarding & Registration */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Users size={18} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Seller Registration & Approval</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Governs merchant onboarding and approval stages</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Allow Vendor Registration</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Show seller sign-up portal to the public</div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.allow_registration !== false && form.allow_registration !== 'false'}
              onChange={e => handleChange('allow_registration', e.target.checked)}
              disabled={disabled}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Auto-Approve Vendors</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Skip manual admin review for new applications</div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.auto_approve === true || form.auto_approve === 'true' || form['store.auto_approve'] === 'true' || form['store.auto_approve'] === true}
              onChange={e => {
                handleChange('auto_approve', e.target.checked)
                handleChange('store.auto_approve', e.target.checked ? 'true' : 'false')
              }}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* KYC Requirements */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <ShieldCheck size={18} color="#16a34a" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>KYC Verification Requirements</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Mandatory documents required before a vendor can publish products or request payouts</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Require National ID / Citizenship</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Front & back copy</div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.require_citizenship !== false && form.require_citizenship !== 'false'}
              onChange={e => handleChange('require_citizenship', e.target.checked)}
              disabled={disabled}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Require PAN / VAT Certificate</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Tax compliance check</div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.require_pan_vat !== false && form.require_pan_vat !== 'false'}
              onChange={e => handleChange('require_pan_vat', e.target.checked)}
              disabled={disabled}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Require Bank Account Details</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Cheque leaf / statement</div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.require_bank_account !== false && form.require_bank_account !== 'false'}
              onChange={e => handleChange('require_bank_account', e.target.checked)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Catalog & Product Moderation */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Store size={18} color="#2563eb" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Product Moderation & Store Rules</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Quality controls for seller storefronts and item listings</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Auto-Approve Vendor Products</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Publish SKUs immediately without admin review</div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.auto_approve_products === true || form.auto_approve_products === 'true' || form['store.auto_approve_products'] === 'true' || form['store.auto_approve_products'] === true}
              onChange={e => {
                handleChange('auto_approve_products', e.target.checked)
                handleChange('store.auto_approve_products', e.target.checked ? 'true' : 'false')
              }}
              disabled={disabled}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Allow Guest Browsing</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Unauthenticated visitors can browse stores</div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={form.allow_guest_browse !== false && form.allow_guest_browse !== 'false' && form['store.allow_guest_browse'] !== 'false'}
              onChange={e => {
                handleChange('allow_guest_browse', e.target.checked)
                handleChange('store.allow_guest_browse', e.target.checked ? 'true' : 'false')
              }}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Limits & Quotas */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sliders size={18} color="#d97706" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Vendor Catalog Limits & Quotas</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>System limits to prevent spam and storage exhaustion</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Max Products per Vendor</label>
            <input
              type="number"
              min="10"
              className="input input-sm"
              value={form.max_products_per_vendor ?? 1000}
              onChange={e => handleChange('max_products_per_vendor', parseInt(e.target.value, 10) || 1000)}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Max Images per Product</label>
            <input
              type="number"
              min="1"
              max="20"
              className="input input-sm"
              value={form.max_images_per_product ?? 8}
              onChange={e => handleChange('max_images_per_product', parseInt(e.target.value, 10) || 8)}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Max Image Upload Size (MB)</label>
            <input
              type="number"
              min="1"
              max="20"
              className="input input-sm"
              value={form.max_image_upload_size_mb ?? 5}
              onChange={e => handleChange('max_image_upload_size_mb', parseFloat(e.target.value) || 5)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
