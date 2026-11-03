import React, { useState, useEffect } from 'react'
import {
  ShieldCheck, Check, X, AlertCircle, FileText,
  ExternalLink, UserCheck, Clock, Building, Eye, RefreshCw
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { apiImage, formatDateTime, timeAgo } from '../../utils/format'
import { downloadVendorDocument } from '../../utils/vendorDocuments'
import { useToast } from '../../context/ToastContext'

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

const formatLabel = (value) => String(value || '')
  .replaceAll('_', ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase())

function DetailField({ label, value, wide = false, multiline = false }) {
  return (
    <div className={`kyc-detail-field${wide ? ' kyc-detail-field-wide' : ''}`}>
      <div className="kyc-detail-field-label">{label}</div>
      <div className={`kyc-detail-field-value${multiline ? ' kyc-detail-field-multiline' : ''}`}>
        {displayValue(value)}
      </div>
    </div>
  )
}

export default function AdminKyc() {
  const toast = useToast()
  const [kycs, setKycs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appliedDates, setAppliedDates] = useState({ from: '', to: '' })
  const [selectedKyc, setSelectedKyc] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Dialog State
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject' | 'changes'
    kyc: null,
    loading: false
  })

  const loadKycList = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (appliedDates.from) params.date_from = appliedDates.from
      if (appliedDates.to) params.date_to = appliedDates.to

      const res = await api.get('/admin/vendors/kyc', { params })
      const data = api.unwrapList(res.data)
      setKycs(data)
      if (res.data?.meta?.pagination) {
        setPagination(res.data.meta.pagination)
      } else {
        setPagination({
          current_page: page,
          last_page: 1,
          total: data.length,
          per_page: 15
        })
      }
    } catch (err) {
      toast.error('Failed to load KYC verification requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKycList()
  }, [page, statusFilter, appliedDates])

  const handleAction = (action, kyc) => {
    setDialogState({
      isOpen: true,
      action,
      kyc,
      loading: false
    })
  }

  const openKycDetails = async (kyc) => {
    const targetId = kyc.uuid || kyc.id
    setSelectedKyc(kyc)
    setDetailLoading(true)
    try {
      const response = await api.get(`/admin/vendors/kyc/${targetId}`, { skipCache: true })
      setSelectedKyc((current) => (
        (current?.uuid || current?.id) === targetId
          ? response.data?.data || current
          : current
      ))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load complete KYC submission details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDocumentDownload = async (doc) => {
    try {
      const extension = doc.file_path?.split('.').pop() || 'file'
      await downloadVendorDocument(
        `/admin/vendors/documents/${doc.id}/download`,
        `${doc.document_type || 'verification-document'}.${extension}`
      )
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not download this verification document.')
    }
  }

  const handleConfirmAction = async (reason) => {
    const { action, kyc } = dialogState
    if (!kyc) return

    setDialogState(prev => ({ ...prev, loading: true }))

    try {
      const targetId = kyc.uuid || kyc.id

      if (action === 'approve') {
        await api.post(`/admin/vendors/kyc/${targetId}/approve`, { notes: reason || 'Approved by admin' })
        toast.success(`KYC for ${kyc.owner_full_name || 'vendor'} approved successfully!`)
      } else if (action === 'reject') {
        await api.post(`/admin/vendors/kyc/${targetId}/reject`, { reason })
        toast.success(`KYC rejected.`)
      } else if (action === 'changes') {
        await api.post(`/admin/vendors/kyc/${targetId}/request-changes`, { notes: reason })
        toast.success(`Requested document/info updates from vendor.`)
      }

      setDialogState({ isOpen: false, action: null, kyc: null, loading: false })
      if (selectedKyc && (selectedKyc.id === kyc.id || selectedKyc.uuid === kyc.uuid)) {
        setSelectedKyc(null)
      }
      loadKycList()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed. Please try again.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const columns = [
    {
      header: 'Vendor / Company',
      accessor: item => item.vendor?.company_name || '—',
      render: item => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 13 }}>
            {item.vendor?.company_name || 'Business'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            PAN/VAT: {item.vendor?.pan_vat || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Legal Owner',
      accessor: 'owner_full_name',
      render: item => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>
            {item.owner_full_name}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            Citizenship: {item.owner_citizenship_number || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      render: item => (
        <div style={{ fontSize: 12 }}>
          <div>{item.owner_phone || item.vendor?.business_phone || '—'}</div>
          <div style={{ color: 'var(--muted)', fontSize: 11 }}>{item.owner_email || item.vendor?.business_email || '—'}</div>
        </div>
      )
    },
    {
      header: 'Documents',
      render: item => {
        const count = item.documents?.length || 0
        return (
          <span className="chip chip-sm" style={{ fontSize: 11, fontWeight: 700, background: '#f1f5f9' }}>
            <FileText size={12} style={{ marginRight: 4 }} />
            {count} {count === 1 ? 'doc' : 'docs'}
          </span>
        )
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Submitted',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {timeAgo(item.created_at)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => openKycDetails(item)}
            title="Inspect Verification Details"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Eye size={13} /> View
          </button>

          {item.status !== 'approved' && (
            <button
              type="button"
              className="btn btn-xs"
              style={{ background: '#16a34a', color: '#fff', border: 'none' }}
              onClick={() => handleAction('approve', item)}
              title="Approve KYC"
            >
              <Check size={13} /> Approve
            </button>
          )}

          {item.status !== 'rejected' && item.status !== 'approved' && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={() => handleAction('reject', item)}
              title="Reject KYC"
            >
              <X size={13} /> Reject
            </button>
          )}
        </div>
      )
    }
  ]

  const detailVendor = selectedKyc?.vendor || {}
  const detailUser = detailVendor.user || {}
  const detailStores = detailVendor.stores || []
  const detailBankAccounts = detailVendor.bank_accounts || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Vendor KYC Verification"
        description="Verify government identification, PAN/VAT certificates, business registry, and merchant bank accounts."
        breadcrumbs={[
          { label: 'Marketplace', to: '/admin/marketplace/vendors' },
          { label: 'KYC Verification' }
        ]}
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadKycList}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        }
      />

      <FilterBar
        statusFilter={statusFilter}
        onStatusChange={(value) => { setPage(1); setStatusFilter(value) }}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApplyFilters={() => {
          setPage(1)
          setAppliedDates({ from: fromDate, to: toDate })
        }}
        onReset={() => {
          setStatusFilter('all')
          setFromDate('')
          setToDate('')
          setAppliedDates({ from: '', to: '' })
          setPage(1)
        }}
        statusOptions={[
          { value: 'submitted', label: 'Submitted (Pending Review)' },
          { value: 'under_review', label: 'Under Review' },
          { value: 'approved', label: 'Approved' },
          { value: 'resubmission_required', label: 'Changes Requested' },
          { value: 'rejected', label: 'Rejected' },
        ]}
      />

      {/* KYC Table */}
      <DataTable
        columns={columns}
        data={kycs}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No KYC submissions found"
        emptyDescription="There are no merchant KYC verification submissions matching your filter criteria."
      />

      {/* KYC Detail Drawer / Modal */}
      {selectedKyc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedKyc(null) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 1080,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 22
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                    KYC Verification Details
                  </h3>
                  <StatusBadge status={selectedKyc.status} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
                  Vendor: <strong>{detailVendor.company_name || 'Merchant'}</strong>
                  {selectedKyc.created_at && (
                    <span> · Submitted {formatDateTime(selectedKyc.created_at)}</span>
                  )}
                </p>
              </div>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => setSelectedKyc(null)}
                style={{ padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading && (
              <div className="kyc-detail-loading" role="status">Loading complete submitted details…</div>
            )}

            <div className="kyc-detail-sections">
              <section className="kyc-detail-section">
                <h4><UserCheck size={16} /> Owner / Authorized Representative</h4>
                <div className="kyc-detail-fields">
                  <DetailField label="Full name" value={selectedKyc.owner_full_name} />
                  <DetailField label="Citizenship / ID number" value={selectedKyc.owner_citizenship_number} />
                  <DetailField label="Email" value={selectedKyc.owner_email || detailUser.email} />
                  <DetailField label="Phone" value={selectedKyc.owner_phone || detailUser.phone} />
                </div>
              </section>

              <section className="kyc-detail-section">
                <h4><Building size={16} /> Business Registration</h4>
                <div className="kyc-detail-fields">
                  <DetailField label="Company / business name" value={detailVendor.company_name} />
                  <DetailField label="Business type" value={selectedKyc.business_type} />
                  <DetailField label="PAN / VAT number" value={detailVendor.pan_vat} />
                  <DetailField label="Registration number" value={detailVendor.registration_number} />
                  <DetailField label="Business email" value={detailVendor.business_email} />
                  <DetailField label="Business phone" value={detailVendor.business_phone} />
                  <DetailField label="Vendor status" value={formatLabel(detailVendor.status)} />
                  <DetailField label="KYC status" value={formatLabel(selectedKyc.status)} />
                </div>
              </section>

              <section className="kyc-detail-section">
                <h4><Building size={16} /> Registered Business Address</h4>
                <div className="kyc-detail-fields">
                  <DetailField label="Street / address" value={selectedKyc.address} />
                  <DetailField label="Landmark" value={selectedKyc.landmark} />
                  <DetailField label="Municipality" value={selectedKyc.municipality} />
                  <DetailField label="District" value={selectedKyc.district} />
                  <DetailField label="Province" value={selectedKyc.province} />
                  <DetailField
                    label="Map coordinates"
                    value={selectedKyc.latitude && selectedKyc.longitude
                      ? `${selectedKyc.latitude}, ${selectedKyc.longitude}`
                      : null}
                  />
                </div>
              </section>

              <section className="kyc-detail-section">
                <h4><Building size={16} /> Store Details ({detailStores.length})</h4>
                {detailStores.length ? detailStores.map((store) => (
                  <div className="kyc-detail-record" key={store.uuid || store.id}>
                    <div className="kyc-detail-record-title">
                      {store.name || 'Store'}
                      <span>{formatLabel(store.status)}</span>
                    </div>
                    <div className="kyc-detail-fields">
                      <DetailField label="Store name" value={store.name} />
                      <DetailField label="Store URL slug" value={store.slug} />
                      <DetailField label="Contact email" value={store.contact_email} />
                      <DetailField label="Contact phone" value={store.contact_phone} />
                      <DetailField label="Description" value={store.description} wide multiline />
                    </div>
                    {store.addresses?.map((address) => (
                      <div className="kyc-store-address" key={address.uuid || address.id}>
                        <div className="kyc-store-address-title">
                          {formatLabel(address.address_type || 'business')} address
                        </div>
                        <div className="kyc-detail-fields">
                          <DetailField label="Address line" value={address.address_line_1} />
                          <DetailField label="Additional address" value={address.address_line_2} />
                          <DetailField label="Province" value={address.province?.name} />
                          <DetailField label="District" value={address.district?.name} />
                          <DetailField label="Municipality" value={address.municipality?.name} />
                          <DetailField label="Landmark" value={address.landmark} />
                          <DetailField
                            label="Map coordinates"
                            value={address.latitude && address.longitude
                              ? `${address.latitude}, ${address.longitude}`
                              : null}
                          />
                        </div>
                      </div>
                    ))}
                    {store.logo && (
                      <div className="kyc-store-image">
                        <span>Store logo</span>
                        <img src={apiImage(store.logo)} alt={`${store.name || 'Store'} logo`} />
                      </div>
                    )}
                    {store.banner && (
                      <div className="kyc-store-image">
                        <span>Store banner</span>
                        <img src={apiImage(store.banner)} alt={`${store.name || 'Store'} banner`} />
                      </div>
                    )}
                  </div>
                )) : <p className="kyc-detail-empty">No store record is attached to this submission.</p>}
              </section>

              <section className="kyc-detail-section">
                <h4><ShieldCheck size={16} /> Payout Bank Details ({detailBankAccounts.length})</h4>
                {detailBankAccounts.length ? detailBankAccounts.map((account) => (
                  <div className="kyc-detail-record" key={account.uuid || account.id}>
                    <div className="kyc-detail-fields">
                      <DetailField label="Bank" value={account.bank_name} />
                      <DetailField label="Branch" value={account.branch_name} />
                      <DetailField label="Account holder" value={account.account_name} />
                      <DetailField label="Account number" value={account.account_number} />
                      <DetailField label="Account type" value={formatLabel(account.account_type)} />
                      <DetailField label="Verified" value={account.is_verified} />
                    </div>
                  </div>
                )) : <p className="kyc-detail-empty">No bank account is attached to this submission.</p>}
              </section>
            </div>

            {/* Documents Section */}
            <div>
              <h4 className="kyc-detail-heading">
                <FileText size={16} /> Submitted Verification Documents ({selectedKyc.documents?.length || 0})
              </h4>
              {(!selectedKyc.documents || selectedKyc.documents.length === 0) ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', background: '#fafbfc', borderRadius: 8, fontSize: 13 }}>
                  No uploaded document files attached to this submission.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {selectedKyc.documents.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <FileText size={20} color="var(--primary)" />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }} className="truncate">
                            {formatLabel(doc.document_type) || 'Document'}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Attached'}
                            {doc.mime_type ? ` · ${doc.mime_type}` : ''}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>
                            Status: {formatLabel(doc.status)}
                          </div>
                          {doc.created_at && (
                            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>
                              Uploaded: {formatDateTime(doc.created_at)}
                            </div>
                          )}
                          {doc.rejection_reason && (
                            <div style={{ fontSize: 10.5, color: '#b91c1c', marginTop: 3 }}>
                              Note: {doc.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      {doc.file_path && (
                        <button
                          type="button"
                          onClick={() => handleDocumentDownload(doc)}
                          aria-label={`Download ${doc.document_type || 'verification document'}`}
                          className="btn btn-outline btn-xs"
                          style={{ flexShrink: 0, padding: '4px 8px' }}
                        >
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Notes if any */}
            {selectedKyc.review_notes && (
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #64748b', fontSize: 13 }}>
                <strong>Previous Review Notes:</strong> {selectedKyc.review_notes}
              </div>
            )}
            <div className="kyc-detail-review-meta">
              <DetailField label="Submitted" value={selectedKyc.created_at ? formatDateTime(selectedKyc.created_at) : null} />
              <DetailField label="Last updated" value={selectedKyc.updated_at ? formatDateTime(selectedKyc.updated_at) : null} />
              <DetailField label="Reviewed" value={selectedKyc.reviewed_at ? formatDateTime(selectedKyc.reviewed_at) : null} />
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleAction('changes', selectedKyc)}
                style={{ color: '#d97706', borderColor: '#fcd34d' }}
              >
                Request Changes
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleAction('reject', selectedKyc)}
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              >
                Reject KYC
              </button>

              <button
                type="button"
                className="btn btn-sm"
                onClick={() => handleAction('approve', selectedKyc)}
                style={{ background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700 }}
              >
                <Check size={14} style={{ marginRight: 4 }} />
                Approve Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, kyc: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? 'Approve Vendor KYC Verification?'
            : dialogState.action === 'reject'
            ? 'Reject KYC Submission?'
            : 'Request Changes from Vendor?'
        }
        message={
          dialogState.action === 'approve'
            ? 'Approving KYC will elevate this merchant to Verified status and activate their selling privileges across GOSIKA.'
            : dialogState.action === 'reject'
            ? 'This will reject the KYC documents. The vendor will be notified with your rejection reason.'
            : 'Specify what documents or information need correction so the vendor can resubmit their verification.'
        }
        variant={dialogState.action === 'approve' ? 'success' : dialogState.action === 'reject' ? 'danger' : 'warning'}
        confirmText={
          dialogState.action === 'approve' ? 'Approve KYC' : dialogState.action === 'reject' ? 'Reject KYC' : 'Send Change Request'
        }
        requireReason={dialogState.action === 'reject' || dialogState.action === 'changes'}
        reasonPlaceholder={
          dialogState.action === 'reject'
            ? 'State the reason for rejection (e.g. Invalid PAN document, blurry image)...'
            : 'Specify which document needs to be re-uploaded...'
        }
      />
    </div>
  )
}
