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
import { formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminKyc() {
  const toast = useToast()
  const [kycs, setKycs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedKyc, setSelectedKyc] = useState(null)

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

      const res = await api.get('/admin/vendors/kyc', { params })
      const data = res.data?.data || []
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
  }, [page, statusFilter])

  const handleAction = (action, kyc) => {
    setDialogState({
      isOpen: true,
      action,
      kyc,
      loading: false
    })
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
            onClick={() => setSelectedKyc(item)}
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
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'submitted', label: 'Submitted (Pending Review)' },
          { value: 'under_review', label: 'Under Review' },
          { value: 'approved', label: 'Approved' },
          { value: 'resubmission_required', label: 'Changes Requested' },
          { value: 'rejected', label: 'Rejected' },
        ]}
        onReset={() => setStatusFilter('all')}
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
              maxWidth: 720,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20
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
                  Vendor: <strong>{selectedKyc.vendor?.company_name || 'Merchant'}</strong>
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

            {/* Business & Owner Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                  Owner / Representative
                </h4>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                  <div><strong>Full Name:</strong> {selectedKyc.owner_full_name}</div>
                  <div><strong>Citizenship #:</strong> {selectedKyc.owner_citizenship_number || '—'}</div>
                  <div><strong>Email:</strong> {selectedKyc.owner_email || '—'}</div>
                  <div><strong>Phone:</strong> {selectedKyc.owner_phone || '—'}</div>
                  <div><strong>Address:</strong> {selectedKyc.address || '—'}</div>
                </div>
              </div>

              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                  Business Entity
                </h4>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                  <div><strong>Company:</strong> {selectedKyc.vendor?.company_name}</div>
                  <div><strong>Business Type:</strong> {selectedKyc.business_type || 'Sole Proprietorship'}</div>
                  <div><strong>PAN / VAT:</strong> {selectedKyc.vendor?.pan_vat || '—'}</div>
                  <div><strong>Registration #:</strong> {selectedKyc.vendor?.registration_number || '—'}</div>
                  <div><strong>Status:</strong> {selectedKyc.vendor?.status || '—'}</div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>
                Submitted Verification Documents
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
                            {doc.document_type ? doc.document_type.replace('_', ' ').toUpperCase() : 'Document'}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                            {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'Attached'}
                          </div>
                        </div>
                      </div>

                      {doc.file_path && (
                        <a
                          href={`/storage/${doc.file_path.replace('public/', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-xs"
                          style={{ flexShrink: 0, padding: '4px 8px' }}
                        >
                          <ExternalLink size={12} />
                        </a>
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
