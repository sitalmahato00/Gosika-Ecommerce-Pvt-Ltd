import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Store, Save, Pencil, ChevronRight, Percent } from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import StatusBadge from '../../components/commerce/StatusBadge'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function VendorStoreSettings() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [storeId, setStoreId] = useState(null)
  const [saving, setSaving] = useState('')
  const [companyForm, setCompanyForm] = useState({ company_name: '', business_email: '', business_phone: '' })
  const [storeForm, setStoreForm] = useState({ name: '', description: '', contact_email: '', contact_phone: '', status: '' })

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([api.get('/vendor/me'), api.get('/vendor/stores')])
      .then(([m, s]) => {
        const v = m.data.data || {}
        setVendor(v)
        setCompanyForm({
          company_name: v.company_name || '',
          business_email: v.business_email || '',
          business_phone: v.business_phone || '',
        })
        const first = (s.data.data || [])[0]
        if (first) {
          setStoreId(first.id)
          setStoreForm({
            name: first.name || '',
            description: first.description || '',
            contact_email: first.contact_email || '',
            contact_phone: first.contact_phone || '',
            status: first.status || '',
          })
        } else {
          setStoreId(null)
        }
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const saveCompany = async (e) => {
    e.preventDefault()
    setSaving('company')
    try {
      await api.put('/vendor/me', companyForm)
      toast.success('Company information saved')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const saveStore = async (e) => {
    e.preventDefault()
    if (!storeId) return
    setSaving('store')
    try {
      await api.put(`/vendor/stores/${storeId}`, {
        name: storeForm.name,
        description: storeForm.description || undefined,
        contact_email: storeForm.contact_email || undefined,
        contact_phone: storeForm.contact_phone || undefined,
      })
      toast.success('Store information saved')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4" style={{ paddingBottom: 40 }}>
        <Skeleton height={48} />
        <Skeleton height={260} />
        <Skeleton height={220} />
      </div>
    )
  }

  if (error) {
    return <ErrorState onRetry={load} />
  }

  return (
    <div style={{ width: '100%', paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Store Settings & Operations</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Configure your company and store profile information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/vendor/stores/edit" className="btn btn-primary btn-sm flex items-center gap-1">
            <Pencil size={13} /> Edit Store Pictures & Branding <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* 1. Company Information */}
        <div className="card" style={{ padding: 20 }}>
          <div className="flex items-center justify-between mb-3 wrap gap-2">
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <Building2 size={18} color="var(--primary)" /> Company Information
            </h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={vendor?.status} />
              {vendor?.commission_rate != null && (
                <span className="chip chip-sm" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
                  <Percent size={11} /> {vendor.commission_rate}% commission
                </span>
              )}
            </div>
          </div>

          <form onSubmit={saveCompany} className="flex flex-col gap-3">
            <Input
              label="Company Name"
              required
              value={companyForm.company_name}
              onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
            />
            <div className="form-row">
              <Input
                label="Business Email"
                type="email"
                required
                value={companyForm.business_email}
                onChange={(e) => setCompanyForm({ ...companyForm, business_email: e.target.value })}
              />
              <Input
                label="Business Phone"
                value={companyForm.business_phone}
                onChange={(e) => setCompanyForm({ ...companyForm, business_phone: e.target.value })}
                placeholder="+977 98XXXXXXXX"
              />
            </div>
            <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <Button type="submit" size="sm" disabled={saving === 'company'}>
                {saving === 'company' ? <Spinner size={14} color="#fff" /> : <><Save size={13} /> Save Company Info</>}
              </Button>
            </div>
          </form>
        </div>

        {/* 2. Store Profile Information */}
        <div className="card" style={{ padding: 20 }}>
          <div className="flex items-center justify-between mb-3 wrap gap-2">
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <Store size={18} color="var(--primary)" /> Store Profile
            </h3>
            {storeId && <StatusBadge status={storeForm.status} />}
          </div>

          {storeId ? (
            <form onSubmit={saveStore} className="flex flex-col gap-3">
              <Input
                label="Store Display Name"
                required
                value={storeForm.name}
                onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
              />
              <div className="form-row">
                <Input
                  label="Store Contact Email"
                  type="email"
                  value={storeForm.contact_email}
                  onChange={(e) => setStoreForm({ ...storeForm, contact_email: e.target.value })}
                />
                <Input
                  label="Customer Service Phone"
                  value={storeForm.contact_phone}
                  onChange={(e) => setStoreForm({ ...storeForm, contact_phone: e.target.value })}
                  placeholder="+977 98XXXXXXXX"
                />
              </div>
              <Textarea
                label="Store Description"
                rows={3}
                value={storeForm.description}
                onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
              />
              <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <Button type="submit" size="sm" disabled={saving === 'store'}>
                  {saving === 'store' ? <Spinner size={14} color="#fff" /> : <><Save size={13} /> Save Store Info</>}
                </Button>
              </div>
            </form>
          ) : (
            <div className="empty-state" style={{ padding: '28px 16px' }}>
              <div className="es-icon"><Store size={28} /></div>
              <p className="muted text-sm" style={{ margin: '0 auto 14px', maxWidth: 340 }}>
                You don't have a store yet. Create one to manage your storefront.
              </p>
              <Link to="/vendor/stores/new" className="btn btn-primary btn-sm">
                Create Store
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
