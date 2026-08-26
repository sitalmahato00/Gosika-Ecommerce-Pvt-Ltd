import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, XCircle, Store, Wallet, Building2,
  ShieldCheck, Banknote, Package, FileText, ExternalLink,
  DollarSign, RefreshCw, ShoppingBag, Clock, Send
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import PageHeader from '../../components/admin/PageHeader'
import DetailTabs from '../../components/admin/DetailTabs'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/admin/ErrorState'
import EmptyState from '../../components/admin/EmptyState'
import { money, formatDate, formatDateTime, getStoreImage, getStoreBanner } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminVendorDetail() {
  const { id } = useParams()
  const toast = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [vendor, setVendor] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [commissions, setCommissions] = useState([])
  const [payouts, setPayouts] = useState([])
  const [settlements, setSettlements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null,
    loading: false
  })

  const loadAllDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const [vRes, wRes, cRes, pRes, sRes, prodRes] = await Promise.allSettled([
        api.get(`/admin/vendors/${id}`),
        api.get(`/admin/wallet/vendors/${id}/wallet`),
        api.get(`/admin/wallet/vendors/${id}/commissions`),
        api.get(`/admin/wallet/vendors/${id}/payouts`),
        api.get(`/admin/wallet/vendors/${id}/settlements`),
        api.get('/admin/products', { params: { vendor_id: id, per_page: 20 } })
      ])

      if (vRes.status === 'fulfilled') {
        setVendor(vRes.value.data?.data || null)
      } else {
        throw new Error('Vendor not found')
      }

      if (wRes.status === 'fulfilled') setWallet(wRes.value.data?.data || null)
      if (cRes.status === 'fulfilled') setCommissions(cRes.value.data?.data || [])
      if (pRes.status === 'fulfilled') setPayouts(pRes.value.data?.data || [])
      if (sRes.status === 'fulfilled') setSettlements(sRes.value.data?.data || [])
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data?.data || [])
    } catch (err) {
      setError('Vendor record could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllDetails()
  }, [id])

  const handleConfirmAction = async (reason) => {
    const { action } = dialogState
    setDialogState(prev => ({ ...prev, loading: true }))

    try {
      const targetId = vendor.uuid || vendor.id

      if (action === 'approve') {
        await api.post(`/admin/vendors/${targetId}/approve`)
        toast.success(`Vendor "${vendor.company_name}" approved.`)
      } else if (action === 'reject') {
        await api.post(`/admin/vendors/${targetId}/reject`, { reason })
        toast.success(`Vendor application rejected.`)
      } else if (action === 'suspend') {
        await api.post(`/admin/vendors/${targetId}/suspend`, { reason })
        toast.success(`Vendor suspended.`)
      } else if (action === 'activate') {
        await api.post(`/admin/vendors/${targetId}/activate`)
        toast.success(`Vendor activated.`)
      }

      setDialogState({ isOpen: false, action: null, loading: false })
      loadAllDetails()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={40} width={200} />
        <Skeleton height={180} style={{ borderRadius: 14 }} />
        <Skeleton height={320} style={{ borderRadius: 14 }} />
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <ErrorState
        title="Vendor Not Found"
        message={error || 'The requested vendor profile does not exist.'}
        onRetry={loadAllDetails}
      />
    )
  }

  const primaryStore = Array.isArray(vendor.stores) && vendor.stores.length > 0 ? vendor.stores[0] : null
  const storeBanner = getStoreBanner(primaryStore || vendor)
  const storeLogo = getStoreImage(primaryStore || vendor)
  const kyc = vendor.kyc || null
  const stores = Array.isArray(vendor.stores) ? vendor.stores : []
  const bankAccounts = Array.isArray(vendor.bank_accounts || vendor.bankAccounts) ? (vendor.bank_accounts || vendor.bankAccounts) : []
  const documents = Array.isArray(vendor.documents) ? vendor.documents : (kyc?.documents || [])

  const isPending = vendor.status === 'pending' || vendor.status === 'under_review'
  const isActive = vendor.status === 'approved' || vendor.status === 'active'
  const isSuspended = vendor.status === 'suspended'

  const tabs = [
    { id: 'overview', label: 'Overview & Profile', icon: <Store size={15} /> },
    { id: 'stores', label: 'Storefronts', icon: <Building2 size={15} />, badge: stores.length },
    { id: 'products', label: 'Products', icon: <Package size={15} />, badge: products.length },
    { id: 'wallet', label: 'Wallet & Ledger', icon: <Wallet size={15} /> },
    { id: 'payouts', label: 'Payouts & Settlements', icon: <Banknote size={15} />, badge: payouts.length + settlements.length },
    { id: 'kyc', label: 'KYC & Documents', icon: <ShieldCheck size={15} />, badge: documents.length },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <PageHeader
        title={vendor.company_name}
        description={`Registered merchant on GOSIKA since ${formatDate(vendor.created_at)}`}
        breadcrumbs={[
          { label: 'Marketplace', to: '/admin/marketplace/vendors' },
          { label: 'Vendors', to: '/admin/marketplace/vendors' },
          { label: vendor.company_name }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700 }}
                  onClick={() => setDialogState({ isOpen: true, action: 'approve', loading: false })}
                >
                  <CheckCircle2 size={14} style={{ marginRight: 4 }} /> Approve Vendor
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => setDialogState({ isOpen: true, action: 'reject', loading: false })}
                >
                  <XCircle size={14} style={{ marginRight: 4 }} /> Reject
                </button>
              </>
            )}

            {isActive && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => setDialogState({ isOpen: true, action: 'suspend', loading: false })}
              >
                Suspend Merchant
              </button>
            )}

            {isSuspended && (
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#2563eb', color: '#fff', border: 'none' }}
                onClick={() => setDialogState({ isOpen: true, action: 'activate', loading: false })}
              >
                Reactivate Merchant
              </button>
            )}
          </div>
        }
      />

      {/* Hero Card with Banner & Logo */}
      <div className="card card-pad-none" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ height: 140, position: 'relative', overflow: 'hidden', background: '#0f172a' }}>
          {storeBanner && (
            <img src={storeBanner} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 60%)' }} />
        </div>

        <div style={{ padding: '0 24px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 14,
                border: '3px solid #fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                background: '#fff',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <img src={storeLogo} alt={vendor.company_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>
                {vendor.company_name}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>PAN/VAT: <strong>{vendor.pan_vat || '—'}</strong></span>
                <span>·</span>
                <span>Reg #: <strong>{vendor.registration_number || '—'}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={vendor.status} />
            <span className="chip chip-sm" style={{ background: '#f1f5f9', fontWeight: 700, fontSize: 12 }}>
              Commission: {vendor.commission_rate ?? 'Platform Default'}%
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <DetailTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div className="card" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Available Balance</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
                {money(wallet?.available_balance || 0)}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                Pending: {money(wallet?.pending_balance || 0)}
              </div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Active Products</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>
                {products.length}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Listed on marketplace</div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>KYC Verification</div>
              <div style={{ marginTop: 8 }}>
                <StatusBadge status={kyc?.status || 'draft'} />
              </div>
            </div>

            <div className="card" style={{ padding: 18, borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Bank Accounts</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706', marginTop: 4 }}>
                {bankAccounts.length}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Linked for payouts</div>
            </div>
          </div>

          {/* Business & Owner Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 20, borderRadius: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginBottom: 14 }}>
                Business Profile
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>Legal Entity:</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{vendor.company_name}</span>
                </div>
                <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>Business Email:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{vendor.business_email || '—'}</span>
                </div>
                <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>Business Phone:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{vendor.business_phone || '—'}</span>
                </div>
                <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>PAN / VAT:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{vendor.pan_vat || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span style={{ color: 'var(--muted)' }}>Registration #:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{vendor.registration_number || '—'}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 20, borderRadius: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginBottom: 14 }}>
                Owner & Legal Representative
              </h3>
              {kyc ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>Owner Name:</span>
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{kyc.owner_full_name}</span>
                  </div>
                  <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>Citizenship #:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{kyc.owner_citizenship_number || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>Personal Phone:</span>
                    <span style={{ fontWeight: 600 }}>{kyc.owner_phone || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>Registered Address:</span>
                    <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: 220 }}>{kyc.address || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span style={{ color: 'var(--muted)' }}>KYC Status:</span>
                    <StatusBadge status={kyc.status} />
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>No KYC record on file.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Storefronts */}
      {activeTab === 'stores' && (
        <div className="card" style={{ padding: 20, borderRadius: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Associated Storefronts</h3>
          {stores.length === 0 ? (
            <EmptyState title="No stores configured" description="This vendor has not set up any active storefronts yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stores.map(st => (
                <div
                  key={st.id || st.uuid}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fff', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={getStoreImage(st)} alt={st.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{st.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        Slug: /{st.slug} {st.contact_email ? `· ${st.contact_email}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={st.status} />
                    <a
                      href={`/store/${st.slug || st.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-xs"
                    >
                      <ExternalLink size={12} style={{ marginRight: 4 }} /> View Store
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Products */}
      {activeTab === 'products' && (
        <div className="card card-pad-none" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Catalog Products ({products.length})</h3>
            <Link to="/admin/marketplace/products" className="btn btn-outline btn-xs">
              Open Product Moderation
            </Link>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                      No products uploaded by this vendor.
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id || p.uuid}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{p.name}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.sku || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{money(p.price || 0)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.quantity ?? '—'}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Wallet & Ledger */}
      {activeTab === 'wallet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20, borderRadius: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Wallet Balance Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Total Ledger Balance</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', marginTop: 4 }}>{money(wallet?.balance || 0)}</div>
              </div>
              <div style={{ padding: 14, background: '#f0fdf4', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>Available for Payout</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{money(wallet?.available_balance || 0)}</div>
              </div>
              <div style={{ padding: 14, background: '#fffbeb', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>Pending Settlement</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#d97706', marginTop: 4 }}>{money(wallet?.pending_balance || 0)}</div>
              </div>
            </div>
          </div>

          <div className="card card-pad-none" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Recent Commission Records</h3>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Rate</th>
                    <th style={{ textAlign: 'right' }}>Basis Amount</th>
                    <th style={{ textAlign: 'right' }}>Commission</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                        No commission calculations recorded yet.
                      </td>
                    </tr>
                  ) : (
                    commissions.map(c => (
                      <tr key={c.id || c.uuid}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{c.vendor_order_id || c.order_id}</td>
                        <td style={{ fontWeight: 600 }}>{c.rate}%</td>
                        <td style={{ textAlign: 'right' }}>{money(c.basis_amount)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>{money(c.amount)}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDateTime(c.calculated_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Payouts & Settlements */}
      {activeTab === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-pad-none" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Payout Requests</h3>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Payout #</th>
                    <th>Bank Account</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Status</th>
                    <th>Requested At</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                        No payout requests filed.
                      </td>
                    </tr>
                  ) : (
                    payouts.map(p => (
                      <tr key={p.id || p.uuid}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{p.payout_number || p.id}</td>
                        <td style={{ fontSize: 12 }}>{p.bank_account?.bank_name || p.bankAccount?.bank_name || 'Bank Transfer'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{money(p.amount)}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(p.created_at || p.requested_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: KYC Documents */}
      {activeTab === 'kyc' && (
        <div className="card" style={{ padding: 20, borderRadius: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Verification Documents</h3>
          {documents.length === 0 ? (
            <EmptyState title="No documents attached" description="The vendor has not uploaded citizenship, PAN, or registration documents." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {documents.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={24} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
                        {doc.document_type ? doc.document_type.replace('_', ' ').toUpperCase() : 'Document'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'Uploaded'}
                      </div>
                    </div>
                  </div>

                  {doc.file_path && (
                    <a
                      href={`/storage/${doc.file_path.replace('public/', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline btn-xs"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <ExternalLink size={12} style={{ marginRight: 4 }} /> View Original File
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Vendor "${vendor.company_name}"?`
            : dialogState.action === 'reject'
            ? `Reject Application for "${vendor.company_name}"?`
            : dialogState.action === 'suspend'
            ? `Suspend Vendor "${vendor.company_name}"?`
            : `Reactivate Vendor "${vendor.company_name}"?`
        }
        message={
          dialogState.action === 'approve'
            ? 'Approving will grant active selling privileges and activate their store.'
            : dialogState.action === 'reject'
            ? 'State the reason for rejecting this vendor application.'
            : dialogState.action === 'suspend'
            ? 'This will immediately hide all products and pause checkouts for this vendor.'
            : 'This will restore the vendor to good standing.'
        }
        variant={dialogState.action === 'approve' || dialogState.action === 'activate' ? 'success' : 'danger'}
        confirmText={
          dialogState.action === 'approve' ? 'Approve' : dialogState.action === 'reject' ? 'Reject' : dialogState.action === 'suspend' ? 'Suspend' : 'Reactivate'
        }
        requireReason={dialogState.action === 'reject' || dialogState.action === 'suspend'}
        reasonPlaceholder="Provide the administrative explanation for this decision..."
      />
    </div>
  )
}
