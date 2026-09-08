import React, { useState } from 'react'
import {
  CreditCard, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  ExternalLink, Info, Eye, EyeOff, ShieldCheck, Clock
} from 'lucide-react'
import { PAYMENT_BRAND_LOGOS } from '../../../utils/constants'

export default function PaymentGatewaysTab({ form, onChange, disabled }) {
  const [expandedGateway, setExpandedGateway] = useState('esewa')
  const [showSecrets, setShowSecrets] = useState({})

  const handleChange = (key, value) => {
    onChange(key, value)
  }

  const toggleShowSecret = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const gwSettings = {
    cod: {
      title: 'Cash on Delivery (COD)',
      description: 'Accept cash payments at the customer doorstep upon item delivery.',
      color: '#16a34a',
      bg: '#f0fdf4',
      enabledKey: 'checkout.cod_enabled',
      altEnabledKey: 'payment.cod_enabled',
      info: 'Cash on Delivery allows buyers across Nepal to pay in cash when the delivery partner reaches their doorstep. Recommended for high conversion.',
    },
    esewa: {
      title: 'eSewa Mobile Wallet',
      description: 'Nepal’s premier digital payment wallet & mobile banking gateway.',
      color: '#60BB46',
      bg: '#f0fdf4',
      enabledKey: 'payment.esewa_enabled',
      info: 'eSewa is Nepal\'s leading digital wallet. Customers pay directly from the eSewa app or internet banking.',
      docs: 'https://developer.esewa.com.np',
    },
    khalti: {
      title: 'Khalti Digital Wallet',
      description: 'Digital wallet, mobile banking & ConnectIPS gateway.',
      color: '#5C2D91',
      bg: '#faf5ff',
      enabledKey: 'payment.khalti_enabled',
      info: 'Khalti enables swift payments via wallet, mobile banking, and ConnectIPS across all commercial banks in Nepal.',
      docs: 'https://docs.khalti.com',
    },
  }

  const isEnabled = (gw) => {
    const config = gwSettings[gw]
    if (!config) return false
    const val = form[config.enabledKey] ?? form[config.altEnabledKey]
    return val === true || val === 'true'
  }

  const renderGatewayCard = (gw) => {
    const config = gwSettings[gw]
    if (!config) return null

    const enabled = isEnabled(gw)
    const isExpanded = expandedGateway === gw

    return (
      <div
        key={gw}
        style={{
          border: `1px solid ${enabled ? config.color + '40' : 'var(--border)'}`,
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 16,
          background: enabled ? config.bg : '#fff',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 20px',
            cursor: 'pointer',
            userSelect: 'none',
            background: enabled ? 'transparent' : '#f8fafc',
            borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
          }}
          onClick={() => setExpandedGateway(isExpanded ? null : gw)}
        >
          {PAYMENT_BRAND_LOGOS[gw] ? (
            <img
              src={PAYMENT_BRAND_LOGOS[gw]}
              alt={config.title}
              style={{
                height: 32,
                width: 'auto',
                borderRadius: 6,
                background: '#fff',
                padding: '2px 8px',
                border: '1px solid var(--border)',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 32,
                borderRadius: 6,
                background: config.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              COD
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{config.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{config.description}</div>
          </div>

          <div
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              background: enabled ? config.color : 'var(--border)',
              color: enabled ? '#fff' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {enabled ? 'ENABLED' : 'DISABLED'}
          </div>

          {isExpanded ? <ChevronDown size={18} color="var(--muted)" /> : <ChevronRight size={18} color="var(--muted)" />}
        </div>

        {/* Expanded Body */}
        {isExpanded && (
          <div style={{ padding: '20px 24px', background: '#fff' }}>
            {config.info && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                  border: '1px solid var(--border)'
                }}
              >
                <span style={{ flexShrink: 0, marginTop: 1, display: 'inline-flex' }}><Info size={16} color="var(--primary)" /></span>
                <span style={{ flex: 1 }}>{config.info}</span>
                {config.docs && (
                  <a
                    href={config.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                  >
                    API Docs <ExternalLink size={11} />
                  </a>
                )}
              </div>
            )}

            {/* Gateway Fields */}
            {gw === 'cod' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Enable Cash on Delivery</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Allow buyers to pay cash to riders upon delivery</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={enabled}
                    onChange={e => {
                      handleChange('checkout.cod_enabled', e.target.checked ? 'true' : 'false')
                      handleChange('payment.cod_enabled', e.target.checked ? 'true' : 'false')
                      handleChange('cod_enabled', e.target.checked)
                    }}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>COD Instructions</label>
                  <input
                    type="text"
                    className="input input-sm"
                    value={form['payment.cod_instructions'] || form.cod_instructions || 'Pay with cash upon delivery. Please keep exact change ready.'}
                    onChange={e => {
                      handleChange('payment.cod_instructions', e.target.value)
                      handleChange('cod_instructions', e.target.value)
                    }}
                    disabled={disabled}
                  />
                </div>
              </div>
            )}

            {gw === 'esewa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Enable eSewa Gateway</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Show eSewa as payment option during checkout</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={enabled}
                    onChange={e => {
                      handleChange('payment.esewa_enabled', e.target.checked ? 'true' : 'false')
                      handleChange('esewa_enabled', e.target.checked)
                    }}
                    disabled={disabled}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div>
                    <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Environment</label>
                    <select
                      className="select select-sm"
                      value={form['payment.esewa_environment'] || form.esewa_environment || 'uat'}
                      onChange={e => {
                        handleChange('payment.esewa_environment', e.target.value)
                        handleChange('esewa_environment', e.target.value)
                      }}
                      disabled={disabled}
                    >
                      <option value="uat">UAT / Sandbox (Testing)</option>
                      <option value="prod">Production (Live)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Product Code (Merchant ID)</label>
                    <input
                      type="text"
                      className="input input-sm"
                      value={form['payment.esewa_product_code'] || form.esewa_product_code || 'EPAYTEST'}
                      onChange={e => {
                        handleChange('payment.esewa_product_code', e.target.value)
                        handleChange('esewa_product_code', e.target.value)
                      }}
                      placeholder="e.g. EPAYTEST"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>eSewa Secret Key</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSecrets['esewa_secret'] ? 'text' : 'password'}
                      className="input input-sm"
                      value={form['payment.esewa_secret_key'] || form.esewa_secret_key || ''}
                      onChange={e => {
                        handleChange('payment.esewa_secret_key', e.target.value)
                        handleChange('esewa_secret_key', e.target.value)
                      }}
                      placeholder="8gBm/:&EnhH.1/q"
                      disabled={disabled}
                      style={{ paddingRight: 40, fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret('esewa_secret')}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                    >
                      {showSecrets['esewa_secret'] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Used for HMAC-SHA256 signature verification</span>
                </div>

                {/* Callbacks */}
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Auto-configured Return Callbacks:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: 11.5, color: '#334155' }}>
                    <div>Success: <code style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>{window.location.origin}/payments/esewa/callback</code></div>
                    <div>Failure: <code style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>{window.location.origin}/payments/esewa/callback?status=failure</code></div>
                  </div>
                </div>
              </div>
            )}

            {gw === 'khalti' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Enable Khalti Gateway</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Show Khalti digital wallet & e-banking during checkout</div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={enabled}
                    onChange={e => {
                      handleChange('payment.khalti_enabled', e.target.checked ? 'true' : 'false')
                      handleChange('khalti_enabled', e.target.checked)
                    }}
                    disabled={disabled}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div>
                    <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Environment</label>
                    <select
                      className="select select-sm"
                      value={form['payment.khalti_environment'] || form.khalti_environment || 'uat'}
                      onChange={e => {
                        handleChange('payment.khalti_environment', e.target.value)
                        handleChange('khalti_environment', e.target.value)
                      }}
                      disabled={disabled}
                    >
                      <option value="uat">UAT / Sandbox (Testing)</option>
                      <option value="prod">Production (Live)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Khalti Public Key</label>
                    <input
                      type="text"
                      className="input input-sm"
                      value={form['payment.khalti_public_key'] || form.khalti_public_key || ''}
                      onChange={e => {
                        handleChange('payment.khalti_public_key', e.target.value)
                        handleChange('khalti_public_key', e.target.value)
                      }}
                      placeholder="test_public_key_..."
                      disabled={disabled}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Khalti Live/Secret Key</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSecrets['khalti_secret'] ? 'text' : 'password'}
                      className="input input-sm"
                      value={form['payment.khalti_secret_key'] || form.khalti_secret_key || ''}
                      onChange={e => {
                        handleChange('payment.khalti_secret_key', e.target.value)
                        handleChange('khalti_secret_key', e.target.value)
                      }}
                      placeholder="live_secret_key_..."
                      disabled={disabled}
                      style={{ paddingRight: 40, fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret('khalti_secret')}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                    >
                      {showSecrets['khalti_secret'] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Callbacks */}
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Auto-configured Return Callback:</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#334155' }}>
                    Return URL: <code style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>{window.location.origin}/payments/khalti/callback</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Gateway Cards */}
      {['esewa', 'khalti', 'cod'].map(renderGatewayCard)}

      {/* General Payment Controls */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Clock size={18} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Checkout & Payment Expiration</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>TTL rules for unpaid customer checkout orders</p>
          </div>
        </div>

        <div style={{ maxWidth: 320 }}>
          <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Payment Link Expiration (Minutes)</label>
          <input
            type="number"
            min="5"
            max="1440"
            className="input input-sm"
            value={form['payment.expiration_minutes'] || form.expiration_minutes || 60}
            onChange={e => {
              handleChange('payment.expiration_minutes', parseInt(e.target.value, 10) || 60)
              handleChange('expiration_minutes', parseInt(e.target.value, 10) || 60)
            }}
            disabled={disabled}
          />
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Unpaid orders auto-cancel after this duration</span>
        </div>
      </div>
    </div>
  )
}
