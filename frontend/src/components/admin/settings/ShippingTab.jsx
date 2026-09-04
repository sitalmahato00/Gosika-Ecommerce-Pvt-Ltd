import React from 'react'
import { Truck, RotateCcw, DollarSign, ShieldCheck } from 'lucide-react'

export default function ShippingTab({ form, onChange, disabled }) {
  const handleChange = (key, value) => {
    onChange(key, value)
  }

  const isShippingEnabled = form.shipping_enabled === true || form.shipping_enabled === 'true' || form.shipping_enabled === undefined
  const isCodEnabled = form.cod_enabled === true || form.cod_enabled === 'true' || form['checkout.cod_enabled'] === 'true' || form['checkout.cod_enabled'] === true
  const isReturnAllowed = form.allow_returns === true || form.allow_returns === 'true' || form['return.allow_returns'] === 'true' || form['return.allow_returns'] === true

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Delivery & Shipping Charges */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={18} color="var(--primary)" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Shipping & Courier Charges</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Configure delivery fees, free shipping eligibility, and calculation models</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={isShippingEnabled}
            onChange={e => handleChange('shipping_enabled', e.target.checked)}
            disabled={disabled}
          />
        </div>

        {isShippingEnabled && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Calculation Method</label>
              <select
                className="select select-sm"
                value={form.calculation_method || 'flat_rate'}
                onChange={e => handleChange('calculation_method', e.target.value)}
                disabled={disabled}
              >
                <option value="flat_rate">Flat Rate per Order</option>
                <option value="weight_based">Weight-based Matrix</option>
                <option value="distance_based">Distance / Zone-based</option>
                <option value="provider_based">Live Courier API Rate</option>
              </select>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Default Flat Shipping Fee (NPR) *</label>
              <input
                type="number"
                min="0"
                className="input input-sm"
                value={form.flat_charge ?? form['shipping.flat_charge'] ?? 80}
                onChange={e => {
                  handleChange('flat_charge', parseFloat(e.target.value) || 0)
                  handleChange('shipping.flat_charge', parseFloat(e.target.value) || 0)
                }}
                disabled={disabled}
              />
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Free Shipping Threshold (NPR)</label>
              <input
                type="number"
                min="0"
                className="input input-sm"
                value={form.free_delivery_threshold ?? form.free_shipping_threshold ?? form['shipping.free_delivery_threshold'] ?? 2000}
                onChange={e => {
                  handleChange('free_delivery_threshold', parseFloat(e.target.value) || 0)
                  handleChange('free_shipping_threshold', parseFloat(e.target.value) || 0)
                  handleChange('shipping.free_delivery_threshold', parseFloat(e.target.value) || 0)
                }}
                disabled={disabled}
              />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Orders above this value receive free delivery</span>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Shipping Fee Paid By</label>
              <select
                className="select select-sm"
                value={form.fee_responsibility || 'customer'}
                onChange={e => handleChange('fee_responsibility', e.target.value)}
                disabled={disabled}
              >
                <option value="customer">Buyer / Customer</option>
                <option value="vendor">Merchant / Vendor</option>
                <option value="platform">Platform Subsidized</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Cash on Delivery (COD) Rules */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={18} color="#16a34a" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Cash on Delivery (COD) Configuration</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Enable doorstep cash collections and specify risk control caps</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={isCodEnabled}
            onChange={e => {
              handleChange('cod_enabled', e.target.checked)
              handleChange('checkout.cod_enabled', e.target.checked ? 'true' : 'false')
            }}
            disabled={disabled}
          />
        </div>

        {isCodEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>COD Surcharge Fee (NPR)</label>
                <input
                  type="number"
                  min="0"
                  className="input input-sm"
                  value={form.cod_fee ?? 0}
                  onChange={e => handleChange('cod_fee', parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Min Order for COD (NPR)</label>
                <input
                  type="number"
                  min="0"
                  className="input input-sm"
                  value={form.cod_min_amount ?? form['payment.cod_min_amount'] ?? 0}
                  onChange={e => {
                    handleChange('cod_min_amount', parseFloat(e.target.value) || 0)
                    handleChange('payment.cod_min_amount', parseFloat(e.target.value) || 0)
                  }}
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Max Order Cap for COD (NPR) *</label>
                <input
                  type="number"
                  min="1000"
                  className="input input-sm"
                  value={form.cod_max_amount ?? form['payment.cod_max_amount'] ?? form['checkout.cod_max_amount'] ?? 50000}
                  onChange={e => {
                    handleChange('cod_max_amount', parseFloat(e.target.value) || 0)
                    handleChange('payment.cod_max_amount', parseFloat(e.target.value) || 0)
                    handleChange('checkout.cod_max_amount', parseFloat(e.target.value) || 0)
                  }}
                  disabled={disabled}
                />
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>High-value orders above this threshold must pay via digital wallet</span>
              </div>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>COD Buyer Instructions</label>
              <input
                type="text"
                className="input input-sm"
                value={form.cod_instructions ?? form['payment.cod_instructions'] ?? 'Pay with cash upon delivery. Please keep exact change ready.'}
                onChange={e => {
                  handleChange('cod_instructions', e.target.value)
                  handleChange('payment.cod_instructions', e.target.value)
                }}
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>

      {/* Return & Refund Policy */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RotateCcw size={18} color="#dc2626" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Returns & Refunds Policy</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Governs buyer return windows and refund methods</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={isReturnAllowed}
            onChange={e => {
              handleChange('allow_returns', e.target.checked)
              handleChange('return.allow_returns', e.target.checked ? 'true' : 'false')
            }}
            disabled={disabled}
          />
        </div>

        {isReturnAllowed && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Return Window (days) *</label>
              <input
                type="number"
                min="1"
                max="60"
                className="input input-sm"
                value={form.return_window_days ?? form['return.window_days'] ?? 7}
                onChange={e => {
                  handleChange('return_window_days', parseInt(e.target.value, 10) || 1)
                  handleChange('return.window_days', parseInt(e.target.value, 10) || 1)
                }}
                disabled={disabled}
              />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Window for buyer to file return request after delivery confirmation</span>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Return Shipping Paid By</label>
              <select
                className="select select-sm"
                value={form.return_shipping_paid_by || 'customer'}
                onChange={e => handleChange('return_shipping_paid_by', e.target.value)}
                disabled={disabled}
              >
                <option value="customer">Buyer / Customer</option>
                <option value="vendor">Fulfilling Vendor (if defective)</option>
                <option value="platform">Platform Guarantee</option>
              </select>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Default Refund Method</label>
              <select
                className="select select-sm"
                value={form.default_refund_method || 'original_payment'}
                onChange={e => handleChange('default_refund_method', e.target.value)}
                disabled={disabled}
              >
                <option value="original_payment">Original Gateway / Digital Wallet</option>
                <option value="wallet">Customer Store Wallet / Credit</option>
                <option value="manual">Manual Bank Wire Transfer</option>
              </select>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Restocking Fee (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                className="input input-sm"
                value={form.restocking_fee ?? 0}
                onChange={e => handleChange('restocking_fee', parseFloat(e.target.value) || 0)}
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
