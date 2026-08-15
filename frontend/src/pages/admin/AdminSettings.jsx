import React, { useEffect, useState } from 'react'
import { Settings, Check, XCircle, Clock } from 'lucide-react'
import api from '../../api/client'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function AdminSettings() {
  const toast = useToast()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState('')

  useEffect(() => {
    if (!key) return
    api.get(`/admin/settings/${key}`).then((r) => setSettings(r.data.data || r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [key])

  const doUpdate = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const payload = Object.fromEntries(formData.entries())
    try {
      await api.put(`/admin/settings/${key}`, payload)
      toast.success('Settings updated')
    } catch (e) { toast.error(errorMessage(e)) }
  }

  if (loading || !key) {
    return (
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16 }}>Settings</h3>
          <p className="muted">Select a setting key from the list below, or enter a custom key.</p>
          <select className="select" onChange={(e) => { setKey(e.target.value); useEffect(() => {}, [key]) }}> <option value="">— Select setting key —</option> <option value="site_name">Site name</option> <option value="currency">Currency</option> <option value="timezone">Timezone</option> <option value="locale">Locale</option> </select>
        </div>
        <div>Loading…</div>
      </div>
    )
  }

  const keys = Object.keys(settings)
  if (!keys.length) return <EmptyState icon={Settings} title="No settings" message="No settings found for key: {key}" />

  return (
    <div>
      <div className="flex items-center justify-between wrap mb-2">
        <h2 style={{ fontSize: 20 }}>Settings: {key}</h2>
        <input className="input" style={{ maxWidth: 240 }} placeholder="Search settings…" value={key} onChange={(e) => setKey(e.target.value)} />
      </div>

      <form onSubmit={doUpdate} className="card" style={{ maxWidth: 500 }}>
        <div className="form-group">
          <label className="label">Key</label>
          <input className="input" value={key} readOnly />
        </div>
        <div className="form-group">
          <label className="label">Value</label>
          <input className="input" value={settings[key] || ''} onChange={(e) => { setSettings({ ...settings, [key]: e.target.value }) }} />
        </div>
        <Button type="submit" block>Update setting</Button>
      </form>
    </div>
  )
}