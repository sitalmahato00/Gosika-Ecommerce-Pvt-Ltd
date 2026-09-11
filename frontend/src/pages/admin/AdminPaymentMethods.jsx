import React, { useEffect, useState } from 'react'
import {
  CreditCard, Save, RefreshCw, CheckCircle2, AlertTriangle, Banknote
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import PaymentGatewaysTab from '../../components/admin/settings/PaymentGatewaysTab'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'

export default function AdminPaymentMethods() {
  const toast = useToast()
  const [form, setForm] = useState({})
  const [original, setOriginal] = useState({})
  const [usage, setUsage] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [settingsRes, usageRes] = await Promise.allSettled([
        api.get('/admin/settings/payments'),
        api.get('/admin/analytics/payment-methods', { params: { range: 'all' } }),
      ])
      if (settingsRes.status === 'fulfilled') {
        const data = settingsRes.value.data?.data || {}
        setForm(data)
        setOriginal(data)
      } else {
        toast.error('Failed to load payment method settings.')
      }
      if (usageRes.status === 'fulfilled') {
        setUsage(usageRes.value.data?.data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const isDirty = JSON.stringify(form) !== JSON.stringify(original)

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/settings/payments', form)
      setOriginal({ ...form })
      toast.success('Payment methods updated successfully.')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save payment methods.')
    } finally {
      setSaving(false)
    }
  }

  const enabledCount = ['payment.esewa_enabled', 'payment.khalti_enabled', 'checkout.cod_enabled']
    .filter(key => form[key] === true || form[key] === 'true').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
      <PageHeader
        title="Payment Methods"
        description="Configure which payment methods are available at checkout, manage gateway credentials, and review transaction volume per method."
        breadcrumbs={[
          { label: 'System', to: '/admin/system/settings' },
          { label: 'Payment Methods' }
        ]}
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={load}
            disabled={loading || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        }
      />

      {/* Usage KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: 18, background: 'linear-gradient(135deg,#fff 0%,#fff7f0 100%)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} />
            </span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)' }}>{enabledCount} / 3</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Methods Enabled</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 18, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={18} />
            </span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)' }}>
                {money(usage.reduce((sum, m) => sum + Number(m.amount || 0), 0))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Total Captured Volume</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway configuration */}
      <div className="card" style={{ padding: 4, background: 'transparent', border: 'none', boxShadow: 'none' }}>
        {loading ? (
          <div className="card" style={{ height: 320, background: '#f1f5f9', borderRadius: 12 }} />
        ) : (
          <PaymentGatewaysTab form={form} onChange={handleChange} disabled={saving} />
        )}
      </div>

      {/* Usage table */}
      {usage.length > 0 && (
        <div className="card" style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px', color: 'var(--ink)' }}>Transaction Volume by Method</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th style={{ textAlign: 'right' }}>Transactions</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, textTransform: 'capitalize' }}>{m.method || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{Number(m.count ?? 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{money(m.amount)}</td>
                    <td style={{ textAlign: 'right' }}>{m.share != null ? `${Number(m.share).toFixed(1)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
            Updated {formatDate(new Date().toISOString())}
          </div>
        </div>
      )}

      {/* Sticky save bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 16,
          zIndex: 40,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '12px 24px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isDirty ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706', fontSize: 13, fontWeight: 700 }}>
              <AlertTriangle size={16} />
              <span>You have unsaved changes</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 13, fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span>All changes saved</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => { setForm({ ...original }); toast.info('Changes reset.') }}
            disabled={!isDirty || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            Reset Changes
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={!isDirty || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, minWidth: 130, justifyContent: 'center' }}
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}