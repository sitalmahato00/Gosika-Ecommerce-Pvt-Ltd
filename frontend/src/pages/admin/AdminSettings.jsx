import React, { useState, useEffect, useMemo } from 'react'
import {
  Globe, Palette, Percent, Truck, CreditCard, Store,
  Save, RotateCcw, AlertTriangle, CheckCircle2, RefreshCw
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import GeneralTab from '../../components/admin/settings/GeneralTab'
import BrandingTab from '../../components/admin/settings/BrandingTab'
import CommissionsTab from '../../components/admin/settings/CommissionsTab'
import ShippingTab from '../../components/admin/settings/ShippingTab'
import PaymentGatewaysTab from '../../components/admin/settings/PaymentGatewaysTab'
import VendorTab from '../../components/admin/settings/VendorTab'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'

const TABS = [
  { id: 'general', label: 'General', icon: Globe, endpoint: '/admin/settings/general' },
  { id: 'branding', label: 'Branding & Appearance', icon: Palette, endpoint: '/admin/settings/branding' },
  { id: 'commissions', label: 'Commissions & Payouts', icon: Percent, endpoint: '/admin/settings/commissions' },
  { id: 'shipping', label: 'Shipping & Returns', icon: Truck, endpoint: '/admin/settings/shipping' },
  { id: 'payment', label: 'Payment Gateways', icon: CreditCard, endpoint: '/admin/settings/payments' },
  { id: 'store', label: 'Store & Vendor', icon: Store, endpoint: '/admin/settings/vendors' },
]

export default function AdminSettings() {
  const toast = useToast()
  const { reloadBranding } = useBranding()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Settings State: original loaded data vs current form changes
  const [originalData, setOriginalData] = useState({})
  const [formData, setFormData] = useState({})

  // Dirty state confirmation modal
  const [pendingTab, setPendingTab] = useState(null)
  const [showDirtyDialog, setShowDirtyDialog] = useState(false)

  // Load active tab settings
  const loadTabSettings = async (tabId) => {
    setLoading(true)
    const currentTabObj = TABS.find(t => t.id === tabId)
    if (!currentTabObj) return

    try {
      // First try modular domain endpoint, fallback to legacy if needed
      const res = await api.get(currentTabObj.endpoint).catch(async () => {
        const legacyRes = await api.get('/admin/settings')
        const data = api.unwrapList(legacyRes.data)
        const mapped = {}
        data.forEach(item => {
          mapped[item.key] = item.value
        })
        return { data: { data: mapped } }
      })

      const data = res.data?.data || {}
      setOriginalData(data)
      setFormData(data)
    } catch (err) {
      toast.error(`Failed to load ${currentTabObj.label} settings.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTabSettings(activeTab)
  }, [activeTab])

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData)
  }, [formData, originalData])

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleTabSwitch = (newTabId) => {
    if (newTabId === activeTab) return

    if (isDirty) {
      setPendingTab(newTabId)
      setShowDirtyDialog(true)
    } else {
      setActiveTab(newTabId)
    }
  }

  const handleDiscardAndSwitch = () => {
    setShowDirtyDialog(false)
    if (pendingTab) {
      setActiveTab(pendingTab)
      setPendingTab(null)
    }
  }

  const handleSaveAndSwitch = async () => {
    setShowDirtyDialog(false)
    const success = await handleSave()
    if (success && pendingTab) {
      setActiveTab(pendingTab)
      setPendingTab(null)
    }
  }

  const handleReset = () => {
    setFormData({ ...originalData })
    toast.info('Changes reset to previously saved configuration.')
  }

  const handleSave = async () => {
    setSaving(true)
    const currentTabObj = TABS.find(t => t.id === activeTab)

    try {
      if (activeTab === 'branding') {
        // Branding accepts file uploads → multipart/form-data
        const fd = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          if (key.endsWith('_file')) {
            if (value instanceof File) fd.append(key, value)
          } else if (value !== undefined && value !== null) {
            fd.append(key, value)
          }
        })
        await api.post(currentTabObj.endpoint, fd)
        reloadBranding()
      } else {
        await api.put(currentTabObj.endpoint, formData).catch(async () => {
          // Fallback to legacy batch update
          const payload = Object.entries(formData).map(([key, value]) => ({
            key,
            value,
            group: activeTab === 'payment' ? 'payment' : activeTab === 'store' ? 'store' : activeTab,
          }))
          await api.put('/admin/settings', { settings: payload })
        })
      }

      setOriginalData({ ...formData })
      toast.success(`${currentTabObj.label} saved successfully.`)
      return true
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save settings.'
      toast.error(msg)
      return false
    } finally {
      setSaving(false)
    }
  }

  const renderActiveTabContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ height: 160, background: '#f1f5f9', borderRadius: 12 }} />
          <div className="card" style={{ height: 220, background: '#f1f5f9', borderRadius: 12 }} />
        </div>
      )
    }

    switch (activeTab) {
      case 'general':
        return <GeneralTab form={formData} onChange={handleFieldChange} disabled={saving} />
      case 'branding':
        return <BrandingTab form={formData} onChange={handleFieldChange} disabled={saving} />
      case 'commissions':
        return <CommissionsTab form={formData} onChange={handleFieldChange} disabled={saving} />
      case 'shipping':
        return <ShippingTab form={formData} onChange={handleFieldChange} disabled={saving} />
      case 'payment':
        return <PaymentGatewaysTab form={formData} onChange={handleFieldChange} disabled={saving} />
      case 'store':
        return <VendorTab form={formData} onChange={handleFieldChange} disabled={saving} />
      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
      <PageHeader
        title="Marketplace Platform Settings"
        description="Comprehensive configuration center for GOSIKA e-commerce operations, branding, financial rules, payment gateways, and seller governance."
        breadcrumbs={[
          { label: 'System', to: '/admin/system/settings' },
          { label: 'Settings' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => loadTabSettings(activeTab)}
              disabled={loading || saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      {/* Tab Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#fff',
          padding: 6,
          borderRadius: 12,
          border: '1px solid var(--border)',
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabSwitch(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--ink)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Tab Content */}
      {renderActiveTabContent()}

      {/* Sticky Bottom Action Bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 16,
          zIndex: 40,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '12px 24px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isDirty ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706', fontSize: 13, fontWeight: 700 }}>
              <AlertTriangle size={16} />
              <span>You have unsaved changes in this tab</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 13, fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span>All changes saved</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleReset}
            disabled={!isDirty || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RotateCcw size={14} /> Reset Changes
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={!isDirty || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, minWidth: 130, justifyContent: 'center' }}
          >
            <Save size={14} />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Dirty Tab Switch Confirmation Dialog */}
      {showDirtyDialog && (
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
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 460,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Unsaved Changes</h3>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>You have unsaved changes in the current tab</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
              If you switch tabs now without saving, your modifications will be lost. Would you like to save your changes first?
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setShowDirtyDialog(false); setPendingTab(null); }}
              >
                Stay on Tab
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleDiscardAndSwitch}
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              >
                Discard Changes
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveAndSwitch}
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
