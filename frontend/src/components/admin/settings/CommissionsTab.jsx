import React from 'react'
import { Percent, DollarSign, Clock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react'

export default function CommissionsTab({ form, onChange, disabled }) {
  const handleChange = (key, value) => {
    onChange(key, value)
  }

  const isCommissionEnabled = form.commission_enabled === true || form.commission_enabled === 'true' || form.commission_enabled === undefined
  const isPayoutEnabled = form.vendor_payouts_enabled === true || form.vendor_payouts_enabled === 'true' || form.vendor_payouts_enabled === undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Commission Governance */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Percent size={18} color="#d97706" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Platform Commission Rules</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Define marketplace monetization rates deducted from seller sales</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={isCommissionEnabled}
            onChange={e => handleChange('commission_enabled', e.target.checked)}
            disabled={disabled}
          />
        </div>

        {isCommissionEnabled && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Commission Type</label>
              <select
                className="select select-sm"
                value={form.default_commission_type || 'percentage'}
                onChange={e => handleChange('default_commission_type', e.target.value)}
                disabled={disabled}
              >
                <option value="percentage">Percentage of Sales (%)</option>
                <option value="fixed">Fixed Amount per Item (NPR)</option>
                <option value="percentage_plus_fixed">Percentage + Fixed Fee</option>
              </select>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Default Rate (%) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="input input-sm"
                value={form.default_rate ?? '10'}
                onChange={e => handleChange('default_rate', parseFloat(e.target.value) || 0)}
                disabled={disabled}
              />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Standard rate applied when vendor has no custom agreement</span>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Minimum Fee per Order (NPR)</label>
              <input
                type="number"
                min="0"
                className="input input-sm"
                value={form.min_commission ?? '0'}
                onChange={e => handleChange('min_commission', parseFloat(e.target.value) || 0)}
                disabled={disabled}
              />
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Maximum Fee Cap (NPR, 0 for unlimited)</label>
              <input
                type="number"
                min="0"
                className="input input-sm"
                value={form.max_commission ?? '0'}
                onChange={e => handleChange('max_commission', parseFloat(e.target.value) || 0)}
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>

      {/* Calculation Basis & Financial Flow */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <DollarSign size={18} color="#16a34a" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Calculation Order & Tax Baseline</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Governs exact mathematical sequence applied during checkout</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Calculation Basis</label>
            <select
              className="select select-sm"
              value={form.calculation_basis || 'product_subtotal'}
              onChange={e => handleChange('calculation_basis', e.target.value)}
              disabled={disabled}
            >
              <option value="product_subtotal">Product Subtotal (Unit Price × Qty)</option>
              <option value="product_total">Product Total (After Item Discounts)</option>
              <option value="order_total">Full Order Total (Including Delivery)</option>
            </select>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Delivery Fee in Commission</label>
            <select
              className="select select-sm"
              value={form.delivery_fee_included ? 'included' : 'excluded'}
              onChange={e => handleChange('delivery_fee_included', e.target.value === 'included')}
              disabled={disabled}
            >
              <option value="excluded">Excluded (100% to Courier/Rider)</option>
              <option value="included">Included in Commission base</option>
            </select>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Discount Funding Responsibility</label>
            <select
              className="select select-sm"
              value={form.discount_funding || 'vendor'}
              onChange={e => handleChange('discount_funding', e.target.value)}
              disabled={disabled}
            >
              <option value="vendor">Vendor Funded (Deducted from Seller payout)</option>
              <option value="platform">Platform Funded (Deducted from GOSIKA fee)</option>
              <option value="proportional">Proportional Split</option>
            </select>
          </div>

          <div>
            <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Tax / VAT Sequence</label>
            <select
              className="select select-sm"
              value={form.tax_calculation_point || 'before_commission'}
              onChange={e => handleChange('tax_calculation_point', e.target.value)}
              disabled={disabled}
            >
              <option value="before_commission">Calculate Commission on Pre-Tax Amount</option>
              <option value="after_commission">Calculate Commission on Post-Tax Amount</option>
            </select>
          </div>
        </div>

        {/* Visualizer */}
        <div style={{ marginTop: 18, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>
            Financial Order Calculation Pipeline:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
            <span className="chip" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>Product Subtotal</span>
            <ArrowRight size={14} color="var(--muted)" />
            <span className="chip" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>Item Discounts</span>
            <ArrowRight size={14} color="var(--muted)" />
            <span className="chip" style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700 }}>VAT (13%)</span>
            <ArrowRight size={14} color="var(--muted)" />
            <span className="chip" style={{ background: '#fee2e2', color: '#b91c1c', fontWeight: 800 }}>- GOSIKA Commission</span>
            <ArrowRight size={14} color="var(--muted)" />
            <span className="chip" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 900 }}>= Vendor Wallet Balance</span>
          </div>
        </div>
      </div>

      {/* Payout & Settlement Rules */}
      <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="#2563eb" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Vendor Settlements & Payouts</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Holding periods, minimum withdrawal thresholds, and disbursement automation</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={isPayoutEnabled}
            onChange={e => handleChange('vendor_payouts_enabled', e.target.checked)}
            disabled={disabled}
          />
        </div>

        {isPayoutEnabled && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Settlement Holding Period (days) *</label>
              <input
                type="number"
                min="0"
                max="60"
                className="input input-sm"
                value={form.settlement_holding_days ?? form['settlement.waiting_days'] ?? 7}
                onChange={e => {
                  handleChange('settlement_holding_days', parseInt(e.target.value, 10) || 0)
                  handleChange('settlement.waiting_days', parseInt(e.target.value, 10) || 0)
                }}
                disabled={disabled}
              />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Days after delivery before funds unlock in merchant wallet</span>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Minimum Payout Amount (NPR) *</label>
              <input
                type="number"
                min="100"
                className="input input-sm"
                value={form.min_payout_amount ?? form['settlement.min_payout_amount'] ?? 1000}
                onChange={e => {
                  handleChange('min_payout_amount', parseFloat(e.target.value) || 0)
                  handleChange('settlement.min_payout_amount', parseFloat(e.target.value) || 0)
                }}
                disabled={disabled}
              />
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Payout Schedule Frequency</label>
              <select
                className="select select-sm"
                value={form.payout_frequency || 'weekly'}
                onChange={e => handleChange('payout_frequency', e.target.value)}
                disabled={disabled}
              >
                <option value="manual">Manual On-Demand Request</option>
                <option value="daily">Daily Batch</option>
                <option value="weekly">Weekly (Every Sunday)</option>
                <option value="biweekly">Biweekly (1st & 15th)</option>
                <option value="monthly">Monthly (1st of month)</option>
              </select>
            </div>

            <div>
              <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Require Manual Admin Approval</label>
              <select
                className="select select-sm"
                value={form.require_manual_payout_approval ? 'yes' : 'no'}
                onChange={e => handleChange('require_manual_payout_approval', e.target.value === 'yes')}
                disabled={disabled}
              >
                <option value="yes">Yes (Admin must verify bank account)</option>
                <option value="no">No (Auto-disburse approved schedules)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
