import React, { useEffect, useState } from 'react'
import { Store, Plus } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../context/ToastContext'
import { formatDate, errorMessage } from '../../utils/format'

export default function VendorBrandRequests() {
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ brand_name: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/vendor/brand-requests').then((r) => setRequests(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/vendor/brand-requests', form)
      toast.success('Brand request submitted for review')
      setModalOpen(false)
      setForm({ brand_name: '', reason: '' })
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between wrap gap-2 mb-2">
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 2 }}>Brand requests</h2>
          <p className="muted text-sm m-0">Can't find a brand? Request it and we'll add it after review.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>Request brand</Button>
      </div>

      {loading ? (
        <div className="card"><Spinner size={20} color="var(--primary)" /></div>
      ) : requests.length ? (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div className="flex items-center justify-between wrap gap-2">
                <div className="font-semibold">{r.brand_name}</div>
                <div className="flex items-center gap-2">
                  <span className="muted text-xs">{formatDate(r.created_at)}</span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
              {r.reason && <div className="muted text-sm mt-1">{r.reason}</div>}
              {r.review_notes && <div className="alert alert-info" style={{ marginBottom: 0, marginTop: 8, padding: '8px 10px', fontSize: 12 }}>Review note: {r.review_notes}</div>}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Store} title="No brand requests" message="Request a brand you want to sell and we'll review it." action={<Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>Request brand</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request a brand">
        <form onSubmit={submit} className="flex flex-col gap-2">
          <Input label="Brand name" required value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} placeholder="e.g. XYZ Textiles" />
          <Textarea label="Why do you want this brand?" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Button type="submit" block disabled={saving}>{saving ? <Spinner size={15} color="#fff" /> : 'Submit request'}</Button>
        </form>
      </Modal>
    </div>
  )
}
