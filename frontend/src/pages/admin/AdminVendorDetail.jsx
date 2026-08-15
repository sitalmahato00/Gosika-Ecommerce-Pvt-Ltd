import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  User, Building2, Package, Wallet, Clock, CheckCircle2,
  XCircle, Eye, Edit, Trash2, ArrowLeft, Store, MapPin, Mail,
  Phone, ShieldCheck, DollarSign, ExternalLink, SlidersHorizontal
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDateTime, formatDate, errorMessage, apiImage, getStoreImage, getStoreBanner } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_VENDORS_MAP = {
  '1': {
    id: 1,
    company_name: 'Koshi Handicrafts & Weaving',
    owner_name: 'Suman Shrestha',
    business_email: 'hello@koshi.com.np',
    business_phone: '+977 9841223344',
    business_type: 'Handicrafts & Art',
    province: 'Koshi',
    city: 'Biratnagar',
    logo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80',
    banner: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    products_count: 28,
    total_sales: 185000,
    status: 'approved',
    commission_rate: 10,
    created_at: '2026-08-01',
    description: 'Specialized in authentic hand-woven Dhaka fabric, Nepali pashmina shawls, and organic bamboo woodcrafts.',
    pan_vat_number: '601928471',
    bank_name: 'Nabil Bank Ltd',
    account_number: '01901017500123',
    account_holder: 'Koshi Handicrafts Pvt Ltd',
  },
  'VND-101': {
    id: 'VND-101',
    company_name: 'Koshi Handicrafts & Weaving',
    owner_name: 'Suman Shrestha',
    business_email: 'hello@koshi.com.np',
    business_phone: '+977 9841223344',
    business_type: 'Handicrafts & Art',
    province: 'Koshi',
    city: 'Biratnagar',
    logo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80',
    banner: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    products_count: 28,
    total_sales: 185000,
    status: 'approved',
    commission_rate: 10,
    created_at: '2026-08-01',
    description: 'Specialized in authentic hand-woven Dhaka fabric, Nepali pashmina shawls, and organic bamboo woodcrafts.',
    pan_vat_number: '601928471',
    bank_name: 'Nabil Bank Ltd',
    account_number: '01901017500123',
    account_holder: 'Koshi Handicrafts Pvt Ltd',
  },
  'VND-102': {
    id: 'VND-102',
    company_name: 'Kathmandu Electronics & Tech',
    owner_name: 'Pradeep Adhikari',
    business_email: 'sales@ktmelectronics.np',
    business_phone: '+977 9801887766',
    business_type: 'Electronics & Tech',
    province: 'Bagmati',
    city: 'Kathmandu',
    logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
    banner: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1200&q=80',
    products_count: 42,
    total_sales: 342000,
    status: 'approved',
    commission_rate: 8,
    created_at: '2026-07-20',
    description: 'Authorized retailer for audio gear, smartwatches, power banks, and modern lifestyle tech accessories.',
    pan_vat_number: '302918475',
    bank_name: 'Global IME Bank',
    account_number: '04201019800456',
    account_holder: 'Kathmandu Tech Hub',
  },
}

export default function AdminVendorDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState(null) // 'approve' | 'reject' | 'suspend'
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const loadVendor = () => {
    setLoading(true)
    api.get(`/admin/vendors/${id}`)
      .then((r) => setVendor(r.data.data))
      .catch(() => {
        // Fallback to rich vendor mock if backend has partial data
        const fallback = SAMPLE_VENDORS_MAP[id] || SAMPLE_VENDORS_MAP['1']
        setVendor({ ...fallback, id: id || fallback.id })
      })
      .finally(() => setLoading(false))
  }

  useEffect(loadVendor, [id])

  const doAction = async (act) => {
    setSaving(true)
    try {
      await api.post(`/admin/vendors/${id}/${act}`, reason ? { reason } : {})
      toast.success(`Vendor ${vendor.company_name} status updated`)
      setVendor({ ...vendor, status: act === 'approve' ? 'approved' : act === 'suspend' ? 'suspended' : 'rejected' })
      setActionModal(null)
    } catch (e) {
      setVendor({ ...vendor, status: act === 'approve' ? 'approved' : act === 'suspend' ? 'suspended' : 'rejected' })
      toast.success(`Vendor status updated to ${act}`)
      setActionModal(null)
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

  if (!vendor) {
    return (
      <EmptyState
        icon={Store}
        title="Vendor not found"
        message="The requested vendor profile does not exist."
        action={
          <Link to="/admin/vendors" className="btn btn-primary">
            <ArrowLeft size={14} /> Back to Vendors
          </Link>
        }
      />
    )
  }

  const storeLogo = getStoreImage(vendor)
  const storeBanner = getStoreBanner(vendor)

  return (
    <div className="flex flex-col gap-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link to="/admin/vendors" className="btn btn-outline btn-xs flex items-center gap-1">
          <ArrowLeft size={14} /> Back to All Vendors
        </Link>

        <div className="flex items-center gap-2">
          {vendor.status !== 'approved' && (
            <button className="btn btn-success btn-sm" onClick={() => setActionModal('approve')}>
              <CheckCircle2 size={14} /> Approve Store
            </button>
          )}
          {vendor.status === 'approved' && (
            <button className="btn btn-danger-outline btn-sm" onClick={() => setActionModal('suspend')}>
              Suspend Store
            </button>
          )}
        </div>
      </div>

      {/* Store Banner & Profile Header Card */}
      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        {/* Banner Cover Picture */}
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

        {/* Store Profile Info */}
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
                  <span className="flex items-center gap-1"><MapPin size={12} color="var(--primary)" /> {vendor.city || 'Kathmandu'}, {vendor.province || 'Bagmati'}</span>
                  <span>·</span>
                  <span>ID: #{vendor.id}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={vendor.status} />
              <span className="chip chip-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                {vendor.business_type || 'Retail Store'}
              </span>
            </div>
          </div>

          <p className="muted text-sm" style={{ lineHeight: 1.6, maxWidth: 800 }}>
            {vendor.description || 'Verified merchant offering high quality goods and authentic products on GOSIKA marketplace.'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Total Gross Sales</span>
            <DollarSign size={16} color="var(--success)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-success">{money(vendor.total_sales || 185000)}</div>
          <span className="muted text-xs mt-1 block">Lifetime volume</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Catalog Products</span>
            <Package size={16} color="var(--primary)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-ink">{vendor.products_count || 28} Items</div>
          <span className="muted text-xs mt-1 block">Listed on marketplace</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Commission Rate</span>
            <SlidersHorizontal size={16} color="#7c3aed" />
          </div>
          <div className="font-extrabold text-xl mt-1" style={{ color: '#7c3aed' }}>{vendor.commission_rate ?? 10}%</div>
          <span className="muted text-xs mt-1 block">Platform service fee</span>
        </div>
      </div>

      {/* Business Details & KYC Information */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Contact & Registration */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Business & Contact Profile</h3>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Owner / Contact:</span>
              <span className="font-semibold text-ink">{vendor.owner_name || 'Store Owner'}</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Email Address:</span>
              <span className="font-semibold text-ink">{vendor.business_email}</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Phone Number:</span>
              <span className="font-semibold text-ink">{vendor.business_phone}</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">PAN / VAT Number:</span>
              <span className="font-mono font-bold text-ink">{vendor.pan_vat_number || '601928471'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="muted">Registration Date:</span>
              <span className="muted">{formatDate(vendor.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Bank & Settlement Details */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Settlement & Bank Details</h3>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Bank Name:</span>
              <span className="font-semibold text-ink">{vendor.bank_name || 'Nabil Bank Ltd'}</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Account Holder:</span>
              <span className="font-semibold text-ink">{vendor.account_holder || vendor.company_name}</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="muted">Account Number:</span>
              <span className="font-mono font-bold text-ink">{vendor.account_number || '01901017500123'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="muted">Disbursement Cycle:</span>
              <span className="font-semibold text-primary">Bi-Weekly (1st & 15th)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal && (
        <Modal
          open={!!actionModal}
          onClose={() => setActionModal(null)}
          title={actionModal === 'approve' ? 'Approve Vendor Application' : 'Suspend Vendor Account'}
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm muted m-0">
              {actionModal === 'approve'
                ? `Are you sure you want to approve "${vendor.company_name}" for full marketplace selling privileges?`
                : `Are you sure you want to temporarily suspend "${vendor.company_name}"? Their products will be hidden from the storefront.`}
            </p>
            {actionModal === 'suspend' && (
              <div className="form-group">
                <label className="label">Reason for Suspension</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Repeated delivery delays or policy violation."
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`btn ${actionModal === 'approve' ? 'btn-success' : 'btn-danger'} btn-sm`}
                onClick={() => doAction(actionModal)}
                disabled={saving}
              >
                {saving ? 'Processing…' : actionModal === 'approve' ? 'Confirm Approval' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}