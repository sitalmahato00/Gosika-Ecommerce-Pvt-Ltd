import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Store, Wallet, Building2, ShieldCheck, Banknote } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate, formatDateTime, errorMessage, getStoreImage, getStoreBanner } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useApi } from '../../hooks/useApi'

export default function AdminVendorDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [actionModal, setActionModal] = useState(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: vendor, loading, error, reload } = useApi(() => api.get(`/admin/vendors/${id}`), { deps: [id] })
  const { data: wallet } = useApi(() => api.get(`/admin/wallet/vendors/${id}/wallet`), { deps: [id] })
  const { data: commissions } = useApi(() => api.get(`/admin/wallet/vendors/${id}/commissions`), { deps: [id] })

  const isPending = vendor?.status === 'pending' || vendor?.status === 'under_review'

  const doAction = async () => {
    if (!actionModal) return
    setSaving(true)
    try {
      if (actionModal === 'approve') {
        await api.post(`/admin/vendors/${id}/approve`)
        toast.success(`Vendor ${vendor.company_name} approved`)
      } else {
        await api.post(`/admin/vendors/${id}/reject`, { reason: reason || 'Application rejected by administrator.' })
        toast.success(`Vendor ${vendor.company_name} rejected`)
      }
      setActionModal(null)
      setReason('')
      reload()
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to update vendor status.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton height={200} />
        <Skeleton height={300} />
      </div>
    )
  }

  if (error || !vendor) {
    return <ErrorState message={errorMessage(error, 'Vendor not found.')} onRetry={reload} />
  }

  const primaryStore = Array.isArray(vendor.stores) && vendor.stores.length > 0 ? vendor.stores[0] : null
  const storeBanner = getStoreBanner(primaryStore || vendor)
  const storeLogo = getStoreImage(primaryStore || vendor)
  const kyc = vendor.kyc || null
  const stores = Array.isArray(vendor.stores) ? vendor.stores : []
  const bankAccounts = Array.isArray(vendor.bank_accounts) ? vendor.bank_accounts : []
  const commissionList = Array.isArray(commissions) ? commissions : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link to="/admin/vendors" className="btn btn-outline btn-xs flex items-center gap-1">
          <ArrowLeft size={14} /> Back to All Vendors
        </Link>

        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <button className="btn btn-success btn-sm" onClick={() => setActionModal('approve')}>
                <CheckCircle2 size={14} /> Approve
              </button>
              <button className="btn btn-danger-outline btn-sm" onClick={() => setActionModal('reject')}>
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>
          <img
            src={storeBanner}
            alt={`${vendor.company_name} Cover`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.1) 60%)'
          }} />
        </div>

        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -40, marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 'var(--radius-lg)',
                  border: '4px solid #fff',
                  boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden',
                  background: '#fff',
                  flexShrink: 0
                }}
              >
                <img
                  src={storeLogo}
                  alt={vendor.company_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  {vendor.company_name}
                </h1>
                <div className="muted text-xs flex items-center gap-2 mt-1">
                  <span>ID: #{vendor.id}</span>
                  <span>·</span>
                  <span>{kyc?.business_type || 'Retail Store'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={vendor.status} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Commission Rate</span>
            <Building2 size={16} color="var(--primary)" />
          </div>
          <div className="font-extrabold text-xl mt-1" style={{ color: 'var(--primary)' }}>{vendor.commission_rate ?? '—'}%</div>
          <span className="muted text-xs mt-1 block">Platform service fee</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Wallet Balance</span>
            <Wallet size={16} color="var(--success)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-success">{wallet?.balance ? money(wallet.balance) : '—'}</div>
          <span className="muted text-xs mt-1 block">Available: {wallet?.available_balance ? money(wallet.available_balance) : '—'}</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Stores</span>
            <Store size={16} color="#7c3aed" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-ink">{stores.length} Store{stores.length !== 1 ? 's' : ''}</div>
          <span className="muted text-xs mt-1 block">Linked to this vendor</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Bank Accounts</span>
            <Banknote size={16} color="#f59e0b" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-ink">{bankAccounts.length} Account{bankAccounts.length !== 1 ? 's' : ''}</div>
          <span className="muted text-xs mt-1 block">For settlements</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Business & Contact Profile</h3>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Owner / Contact:</span>
              <span className="font-semibold text-ink">{kyc?.owner_full_name || '—'}</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Email Address:</span>
              <span className="font-semibold text-ink">{vendor.business_email || '—'}</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Phone Number:</span>
              <span className="font-semibold text-ink">{vendor.business_phone || '—'}</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">PAN / VAT Number:</span>
              <span className="font-mono font-bold text-ink">{vendor.pan_vat || '—'}</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Registration Date:</span>
              <span className="muted">{formatDate(vendor.created_at)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="muted">Approved Date:</span>
              <span className="muted">{formatDate(vendor.approved_at)}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} color="var(--primary)" /> KYC Information
          </h3>
          {kyc ? (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="muted">Citizenship Number:</span>
                <span className="font-mono font-bold text-ink">{kyc.owner_citizenship_number || '—'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="muted">KYC Email:</span>
                <span className="font-semibold text-ink">{kyc.owner_email || '—'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="muted">KYC Phone:</span>
                <span className="font-semibold text-ink">{kyc.owner_phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="muted">Business Type:</span>
                <span className="font-semibold text-ink">{kyc.business_type || '—'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="muted">Address:</span>
                <span className="font-semibold text-ink">{kyc.address || '—'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="muted">KYC Status:</span>
                <span><StatusBadge status={kyc.status} /></span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="muted">Review Notes:</span>
                <span className="font-semibold text-ink">{kyc.review_notes || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="muted">Reviewed At:</span>
                <span className="muted">{formatDateTime(kyc.reviewed_at)}</span>
              </div>
            </div>
          ) : (
            <div className="muted text-sm">No KYC submission recorded.</div>
          )}
        </div>
      </div>

      {wallet && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wallet size={16} color="var(--success)" /> Wallet
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="card" style={{ padding: 14, margin: 0, background: 'var(--bg)' }}>
              <div className="muted text-xs font-semibold">Total Balance</div>
              <div className="font-extrabold text-lg mt-1 text-ink">{money(wallet.balance)}</div>
            </div>
            <div className="card" style={{ padding: 14, margin: 0, background: 'var(--bg)' }}>
              <div className="muted text-xs font-semibold">Available Balance</div>
              <div className="font-extrabold text-lg mt-1 text-success">{money(wallet.available_balance)}</div>
            </div>
            <div className="card" style={{ padding: 14, margin: 0, background: 'var(--bg)' }}>
              <div className="muted text-xs font-semibold">Pending Balance</div>
              <div className="font-extrabold text-lg mt-1" style={{ color: '#d97706' }}>{money(wallet.pending_balance)}</div>
            </div>
            <div className="card" style={{ padding: 14, margin: 0, background: 'var(--bg)' }}>
              <div className="muted text-xs font-semibold">Currency</div>
              <div className="font-extrabold text-lg mt-1 text-ink">{wallet.currency || 'NPR'}</div>
            </div>
          </div>
        </div>
      )}

      {stores.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Store size={16} color="#7c3aed" /> Stores
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stores.map((s) => (
              <div key={s.id} className="card" style={{ padding: 14, margin: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <span className="avatar" style={{ width: 44, height: 44, borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0, background: '#fff' }}>
                    <img src={getStoreImage(s)} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="font-bold text-sm text-ink">{s.name}</div>
                    <div className="muted text-xs truncate">Slug: {s.slug} {s.contact_email ? `· ${s.contact_email}` : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bankAccounts.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Settlement & Bank Details</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Bank</th>
                  <th>Branch</th>
                  <th>Account Holder</th>
                  <th>Account Number</th>
                  <th>Type</th>
                  <th>Verified</th>
                  <th>Default</th>
                </tr>
              </thead>
              <tbody>
                {bankAccounts.map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold text-sm">{a.bank_name || '—'}</td>
                    <td className="muted">{a.branch_name || '—'}</td>
                    <td>{a.account_name || '—'}</td>
                    <td className="font-mono text-xs">{a.account_number || '—'}</td>
                    <td className="muted">{a.account_type || '—'}</td>
                    <td>{a.is_verified ? 'Yes' : 'No'}</td>
                    <td>{a.is_default ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {commissionList.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Commissions</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Rate</th>
                  <th>Basis Amount</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Calculated At</th>
                </tr>
              </thead>
              <tbody>
                {commissionList.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-xs">{c.vendor_order_id || c.order_id || '—'}</td>
                    <td>{c.rate}%</td>
                    <td>{money(c.basis_amount)}</td>
                    <td className="font-bold text-success">{money(c.amount)}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="muted text-xs">{formatDateTime(c.calculated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {actionModal && (
        <Modal
          open={!!actionModal}
          onClose={() => setActionModal(null)}
          title={actionModal === 'approve' ? 'Approve Vendor Application' : 'Reject Vendor Application'}
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm muted m-0">
              {actionModal === 'approve'
                ? `Are you sure you want to approve "${vendor.company_name}" for full marketplace selling privileges?`
                : `Are you sure you want to reject "${vendor.company_name}"? A rejection reason is required.`}
            </p>
            {actionModal === 'reject' && (
              <div className="form-group">
                <label className="label">Rejection Reason *</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Incomplete KYC documentation or unverified business registration number."
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`btn ${actionModal === 'approve' ? 'btn-success' : 'btn-danger'} btn-sm`}
                onClick={doAction}
                disabled={saving}
              >
                {saving ? 'Processing…' : actionModal === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
