import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { User, Building2, Package, Wallet, Clock, CheckCircle, XCircle, Eye, Edit, Trash, LogOut } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function AdminVendorDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [action, setAction] = useState('approve')
  const [reason, setReason] = useState('')

  useEffect(() => {
    api.get(`/admin/vendors/${id}`).then((r) => setVendor(r.data.data)).catch((e) => setError(e)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div>Loading vendor…</div>
  if (error || !vendor) return <ErrorState message={errorMessage(error, 'Vendor not found.')} onRetry={() => { useEffect(() => {}, []) }} />

  const doAct = async () => {
    setModalOpen(false)
    try {
      await api.post(`/admin/vendors/${id}/${action}`, reason ? { reason } : {})
      toast.success(`${action === 'approve' ? 'Approved' : 'Rejected'} vendor ${vendor.company_name}`)
    } catch (e) { toast.error(errorMessage(e)) }
  }

  const items = [
    { to: '/admin/vendors', label: '← Back to vendors', icon: ArrowLeft },
    { to: `/admin/vendors/${id}/stores`, label: 'Stores', icon: Folder },
  ]

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-1 muted text-sm" aria-label="Breadcrumb">
        {items.map((it, i) => (i > 0 ? <span key={i}>&bull;</span> : null))}
        {items.map((it) => (
          <Link key={it.label} to={it.to} style={{ color: it.to.startsWith('/admin') ? 'var(--primary)' : 'inherit' }}>{it.label}</Link>
        ))}
      </nav>

      <div className="card flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="thumb" style={{ width: 56, height: 56 }}><Building2 size={24} /></span>
          <div>
            <h2 style={{ fontSize: 20 }}>{vendor.company_name}</h2>
            <div className="muted text-sm">{vendor.business_email}</div>
            <StatusBadge status={vendor.status?.value || vendor.status} />
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div>
            <div className="kpi-label">Commission Rate</div>
            <div className="kpi-value">{vendor.commission_rate}%</div>
          </div>
          <div>
            <div className="kpi-label">Stores</div>
            <div className="kpi-value">{vendor.stores?.length || 0}</div>
          </div>
          <div>
            <div className="kpi-label">Bank Accounts</div>
            <div className="kpi-value">{vendor.bank_accounts?.length || 0}</div>
          </div>
        </div>

        {vendor.kyc && (
          <div className="card" style={{ padding: 16, background: 'var(--bg)' }}>
            <h3 style={{ fontSize: 16 }} className="mb-2">KYC Verification</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="font-medium">Full name</div><div className="muted">{vendor.kyc.owner_full_name}</div></div>
              <div><div className="font-medium">Citizenship</div><div className="muted">{vendor.kyc.owner_citizenship_number}</div></div>
              <div><div className="font-medium">Email</div><div className="muted">{vendor.kyc.owner_email}</div></div>
              <div><div className="font-medium">Phone</div><div className="muted">{vendor.kyc.owner_phone}</div></div>
              <div><div className="font-medium">Business type</div><div className="muted capitalize">{vendor.kyc.business_type}</div></div>
              <div><div className="font-medium">Address</div><div className="muted">{vendor.kyc.address}</div></div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button className="btn btn-success flex-1" onClick={() => { setAction('approve'); setModalOpen(true) }}>Approve vendor</button>
          <button className="btn btn-danger flex-1" onClick={() => { setAction('reject'); setModalOpen(true) }}>Reject vendor</button>
        </div>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${action === 'approve' ? 'Approve' : 'Reject'} vendor`}>
          {action === 'reject' && (
            <div className="mt-2">
              <Input label="Rejection reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Brief reason for rejection" />
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button type="button" onClose={() => setModalOpen(false)}>Cancel</button>
            <button onClick={doAct}>{action === 'approve' ? 'Approve' : 'Reject'}</button>
          </div>
        </Modal>
      </div>
    </div>
  )
}