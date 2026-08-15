import React, { useEffect, useMemo, useState } from 'react'
import {
  Save, Globe, Store, CreditCard, Truck, Building
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import Input from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SETTING_DEFS = [
  { key: 'site_name', label: 'Marketplace Name', group: 'general', type: 'string', defaultValue: 'GOSIKA Commerce' },
  { key: 'support_email', label: 'Support Email', group: 'general', type: 'string', defaultValue: 'support@gosika.com.np' },
  { key: 'currency', label: 'Currency Code', group: 'general', type: 'string', defaultValue: 'NPR' },
  { key: 'default_rate', label: 'Default Commission Rate (%)', group: 'commission', type: 'decimal', defaultValue: '10' },
  { key: 'product_rate', label: 'Product Commission Rate (%)', group: 'commission', type: 'decimal', defaultValue: '8' },
  { key: 'category_rate', label: 'Category Commission Rate (%)', group: 'commission', type: 'decimal', defaultValue: '6' },
  { key: 'free_delivery_threshold', label: 'Free Delivery Threshold (NPR)', group: 'shipping', type: 'decimal', defaultValue: '2000' },
  { key: 'commission', label: 'Store Commission (%)', group: 'store', type: 'decimal', defaultValue: '5' },
]

const GROUP_META = {
  general: { label: 'General & Identity', icon: Globe },
  commission: { label: 'Commissions & Payouts', icon: Store },
  shipping: { label: 'Shipping & Delivery', icon: Truck },
  payment: { label: 'Payment Gateways', icon: CreditCard },
  store: { label: 'Store Configuration', icon: Building },
}

const defFor = (key) => SETTING_DEFS.find((d) => d.key === key)

export default function AdminSettings() {
  const toast = useToast()
  const { data, loading, error, reload } = useApi(() => api.get('/admin/settings'))
  const [form, setForm] = useState({})
  const [groupsMeta, setGroupsMeta] = useState({})
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    if (!data) return
    const next = {}
    const groups = {}
    data.forEach((s) => {
      next[s.key] = s.value
      groups[s.key] = { group: s.group || 'general', type: s.type || 'string' }
    })
    SETTING_DEFS.forEach((d) => {
      if (!(d.key in next)) next[d.key] = d.defaultValue
      if (!(d.key in groups)) groups[d.key] = { group: d.group, type: d.type }
    })
    setForm(next)
    setGroupsMeta(groups)
  }, [data])

  const groups = useMemo(() => {
    return Object.keys(GROUP_META).filter((g) =>
      Object.keys(groupsMeta).some((k) => groupsMeta[k].group === g),
    )
  }, [groupsMeta])

  const keysForGroup = (group) =>
    Object.keys(groupsMeta).filter((k) => groupsMeta[k].group === group)

  const setValue = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const saveGroup = async (group) => {
    const keys = keysForGroup(group)
    if (!keys.length) return
    setSaving(group)
    try {
      for (const key of keys) {
        const meta = groupsMeta[key]
        await api.put(`/admin/settings/${key}`, {
          value: form[key],
          group: meta.group || defFor(key)?.group || group,
          type: meta.type || defFor(key)?.type || 'string',
        })
      }
      toast.success('Settings saved')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(null)
    }
  }

  const saveAll = async () => {
    for (const g of groups) {
      await saveGroup(g)
    }
  }

  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Platform Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Configure marketplace operational defaults, gateway credentials, commissions, and regional parameters.
          </p>
        </div>
        <button className="btn btn-primary" onClick={saveAll} disabled={!!saving}>
          <Save size={15} /> Save All Settings
        </button>
      </div>

      {loading ? (
        <Skeleton height={200} />
      ) : groups.length === 0 ? (
        <ErrorState message="No settings returned by the backend." onRetry={reload} />
      ) : (
        <>
          <div className="tabs" style={{ marginBottom: 20 }}>
            {groups.map((g) => {
              const Icon = GROUP_META[g].icon
              return (
                <button
                  key={g}
                  className={`tab ${activeTab === g ? 'active' : ''}`}
                  onClick={() => setActiveTab(g)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon size={15} />
                  {GROUP_META[g].label}
                </button>
              )
            })}
          </div>

          <div className="card" style={{ maxWidth: 780, padding: 24 }}>
            <h3 style={{ fontSize: 16, margin: '0 0 16px' }}>{GROUP_META[activeTab].label}</h3>
            <div className="flex flex-col gap-3">
              {keysForGroup(activeTab).map((key) => {
                const meta = groupsMeta[key]
                const def = defFor(key)
                const label = def ? def.label : key.replace(/_/g, ' ')
                if (meta.type === 'boolean') {
                  return (
                    <label key={key} className="checkbox-row" style={{ fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!form[key]}
                        onChange={(e) => setValue(key, e.target.checked)}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{label}</span>
                    </label>
                  )
                }
                return (
                  <Input
                    key={key}
                    label={label.charAt(0).toUpperCase() + label.slice(1)}
                    value={form[key] ?? ''}
                    onChange={(e) => setValue(key, e.target.value)}
                    placeholder="—"
                  />
                )
              })}
            </div>

            <div className="flex justify-end pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                className="btn btn-primary"
                disabled={saving === activeTab}
                onClick={() => saveGroup(activeTab)}
              >
                {saving === activeTab ? 'Saving…' : 'Save Group'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
