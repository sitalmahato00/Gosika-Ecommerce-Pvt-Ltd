import React, { useState } from 'react'
import {
  Settings, Save, Globe, Shield, CreditCard, Bell,
  Store, CheckCircle2, Sliders, Smartphone, Mail, Building
} from 'lucide-react'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { useToast } from '../../context/ToastContext'

const SETTING_TABS = [
  { id: 'general', label: 'General & Identity', icon: Globe },
  { id: 'commissions', label: 'Commissions & Payouts', icon: Store },
  { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
  { id: 'notifications', label: 'SMS & Email (Nepal)', icon: Bell },
  { id: 'security', label: 'Security & Moderation', icon: Shield },
]

export default function AdminSettings() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    site_name: 'GOSIKA Commerce',
    site_tagline: 'Nepal’s Premier Multi-Vendor Marketplace',
    support_email: 'support@gosika.com.np',
    support_phone: '+977 1 4220000',
    vat_number: '609823412',
    currency: 'NPR',
    currency_symbol: 'Rs.',
    timezone: 'Asia/Kathmandu',
    default_commission: '10',
    min_payout_amount: '2000',
    payout_schedule: 'biweekly',
    auto_approve_vendors: false,
    auto_approve_products: false,
    enable_cod: true,
    enable_khalti: true,
    enable_esewa: true,
    enable_fonepay: true,
    sparrow_sms_token: 'sparrow_test_tok_9824',
    sparrow_sms_sender: 'GOSIKA',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('Marketplace settings updated successfully')
    }, 500)
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Platform Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Configure marketplace operational defaults, gateway credentials, commissions, and regional parameters.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          <Save size={15} /> Save All Settings
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {SETTING_TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              className={`tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 780, padding: 24 }}>
        {activeTab === 'general' && (
          <div className="flex flex-col gap-3">
            <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>General Marketplace Settings</h3>
            <Input
              label="Marketplace Name"
              required
              value={form.site_name}
              onChange={(e) => setForm({ ...form, site_name: e.target.value })}
            />
            <Input
              label="Tagline / Headline"
              value={form.site_tagline}
              onChange={(e) => setForm({ ...form, site_tagline: e.target.value })}
            />
            <div className="form-row">
              <Input
                label="Support Email"
                type="email"
                required
                value={form.support_email}
                onChange={(e) => setForm({ ...form, support_email: e.target.value })}
              />
              <Input
                label="Support Phone (Nepal)"
                value={form.support_phone}
                onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
              />
            </div>
            <div className="form-row">
              <Input
                label="Company PAN / VAT Number"
                value={form.vat_number}
                onChange={(e) => setForm({ ...form, vat_number: e.target.value })}
              />
              <Select
                label="Default Timezone"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              >
                <option value="Asia/Kathmandu">Asia/Kathmandu (UTC+5:45)</option>
              </Select>
            </div>
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="flex flex-col gap-3">
            <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>Commissions & Settlement Defaults</h3>
            <div className="form-row">
              <Input
                label="Default Commission Rate (%)"
                type="number"
                min="0"
                max="50"
                value={form.default_commission}
                onChange={(e) => setForm({ ...form, default_commission: e.target.value })}
                helper="Applied to vendors who do not have custom rate overrides"
              />
              <Input
                label="Minimum Vendor Payout Threshold (Rs.)"
                type="number"
                value={form.min_payout_amount}
                onChange={(e) => setForm({ ...form, min_payout_amount: e.target.value })}
              />
            </div>
            <Select
              label="Settlement Cycle Frequency"
              value={form.payout_schedule}
              onChange={(e) => setForm({ ...form, payout_schedule: e.target.value })}
            >
              <option value="weekly">Weekly (Every Sunday)</option>
              <option value="biweekly">Bi-Weekly (1st & 15th of month)</option>
              <option value="monthly">Monthly (1st of month)</option>
            </Select>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="flex flex-col gap-4">
            <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>Enabled Payment Gateways in Nepal</h3>

            <div className="card" style={{ padding: 14, background: 'var(--bg)' }}>
              <label className="checkbox-row" style={{ fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.enable_cod}
                  onChange={(e) => setForm({ ...form, enable_cod: e.target.checked })}
                />
                Cash on Delivery (COD) — Nationwide
              </label>
              <p className="muted text-xs m-0 mt-1 pl-6">Allow buyers to pay cash upon parcel handover.</p>
            </div>

            <div className="card" style={{ padding: 14, background: 'var(--bg)' }}>
              <label className="checkbox-row" style={{ fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.enable_khalti}
                  onChange={(e) => setForm({ ...form, enable_khalti: e.target.checked })}
                />
                Khalti Payment Gateway (EPAY / Merchant API)
              </label>
              <p className="muted text-xs m-0 mt-1 pl-6">Accept Khalti Wallet, e-Banking, SCT Card, and Mobile Banking.</p>
            </div>

            <div className="card" style={{ padding: 14, background: 'var(--bg)' }}>
              <label className="checkbox-row" style={{ fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.enable_esewa}
                  onChange={(e) => setForm({ ...form, enable_esewa: e.target.checked })}
                />
                eSewa ePay Gateway
              </label>
              <p className="muted text-xs m-0 mt-1 pl-6">Accept payments via eSewa digital wallet account.</p>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="flex flex-col gap-3">
            <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>SMS & OTP Gateway (Nepal Providers)</h3>
            <Input
              label="Sparrow SMS API Key / Token"
              type="password"
              value={form.sparrow_sms_token}
              onChange={(e) => setForm({ ...form, sparrow_sms_token: e.target.value })}
            />
            <Input
              label="SMS Sender Identity"
              value={form.sparrow_sms_sender}
              onChange={(e) => setForm({ ...form, sparrow_sms_sender: e.target.value })}
              helper="Registered Sender ID approved by Nepal Telecom"
            />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="flex flex-col gap-3">
            <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>Catalog & Vendor Moderation</h3>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.auto_approve_vendors}
                onChange={(e) => setForm({ ...form, auto_approve_vendors: e.target.checked })}
              />
              Auto-approve new vendor registrations without KYC review
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.auto_approve_products}
                onChange={(e) => setForm({ ...form, auto_approve_products: e.target.checked })}
              />
              Auto-publish new vendor product listings without moderation review
            </label>
          </div>
        )}

        <div className="flex justify-end pt-4 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving Changes…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}