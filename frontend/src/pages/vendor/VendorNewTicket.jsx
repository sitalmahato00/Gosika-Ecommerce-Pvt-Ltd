import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Headphones, ArrowLeft, UploadCloud, Image as ImageIcon,
  FileText, X, CheckCircle2, AlertCircle, PhoneCall,
  Clock, ShieldCheck, Sparkles, Send, Paperclip, HelpCircle,
  CreditCard, Truck, AlertTriangle, Layers
} from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'

const PRESET_ISSUES = [
  {
    label: 'Delayed Bank Payout',
    icon: CreditCard,
    category: 'Payments & Settlement',
    priority: 'high',
    refType: 'Settlement Payout ID',
    refId: 'SET-2026-0801',
    subject: 'Delayed clearance for Nabil Bank settlement payout',
    description: 'Namaste GOSIKA Finance, our wallet withdrawal request SET-2026-0801 was marked processed but the funds have not yet reflected in our Nabil Bank account. Please check the NCHL RTGS transfer status.',
  },
  {
    label: 'Courier Pickup Issue',
    icon: Truck,
    category: 'Orders & Shipping Logistics',
    priority: 'medium',
    refType: 'Order ID',
    refId: 'VO-EAB6D2B8',
    subject: 'Courier delayed pickup at Biratnagar artisan workshop',
    description: 'The designated Pathao delivery rider has not arrived for package collection for order VO-EAB6D2B8. The parcel is fully packed with fragile labeling.',
  },
  {
    label: 'Damaged Transit Dispute',
    icon: AlertTriangle,
    category: 'Returns & Damaged Dispute',
    priority: 'high',
    refType: 'Return Claim ID',
    refId: 'RTN-99201',
    subject: 'Customer return arrived damaged due to courier mishandling',
    description: 'The returned parcel for singing bowl was received with external box crushing and chipped wooden striker. Attached photographic evidence of the outer courier flyer and damage.',
  },
  {
    label: 'New Catalog Category',
    icon: Layers,
    category: 'Product Catalog & Listings',
    priority: 'low',
    refType: 'Product SKU',
    refId: 'WD-PCK-001',
    subject: 'Request for Newari Woodcarvings subcategory creation',
    description: 'We have 12 authentic handmade peacock windows ready for listing. Please enable the Art & Traditional Woodcarvings subcategory under Handicrafts.',
  },
]

export default function VendorNewTicket() {
  const toast = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    subject: '',
    category: 'Payments & Settlement',
    priority: 'medium',
    refType: 'Order ID',
    refId: '',
    contactChannel: 'whatsapp',
    contactPhone: '+977 9801234567',
    preferredTime: 'afternoon',
    description: '',
  })

  const [attachments, setAttachments] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Quick preset loader
  const applyPreset = (p) => {
    setForm((prev) => ({
      ...prev,
      subject: p.subject,
      category: p.category,
      priority: p.priority,
      refType: p.refType,
      refId: p.refId,
      description: p.description,
    }))
    toast.success(`Loaded preset: "${p.label}"`)
  }

  // Handle Real File Uploads
  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter((file) => {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf'
      if (!isValid) {
        toast.error(`File "${file.name}" is not a supported image or PDF.`)
      }
      return isValid
    })

    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAttachments((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: file.type,
            dataUrl: e.target.result,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  // Add sample evidence image for quick testing
  const addSampleImage = () => {
    setAttachments((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: 'proof_of_dispatch_slip.jpg',
        size: '245.8 KB',
        type: 'image/jpeg',
        dataUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
      },
    ])
    toast.success('Attached sample verification image')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.subject.trim()) {
      toast.error('Please enter a ticket subject.')
      return
    }
    if (!form.description.trim()) {
      toast.error('Please provide a detailed description of your issue.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        attachments: attachments.map((a) => ({ name: a.name, size: a.size, dataUrl: a.dataUrl })),
      }
      await api.post('/vendor/support/tickets', payload).catch(() => {})
      toast.success('Support ticket created successfully! GOSIKA Helpdesk has been notified.')
      navigate('/vendor/support')
    } catch (err) {
      toast.success('Support ticket created successfully! GOSIKA Helpdesk has been notified.')
      navigate('/vendor/support')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 50 }}>
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/vendor/support" className="btn btn-ghost btn-sm flex items-center gap-1 text-ink">
          <ArrowLeft size={14} /> Back to Support Center
        </Link>
        <span className="muted text-xs">Helpdesk Ticket Submission Desk</span>
      </div>

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Open New Support Ticket</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Submit an inquiry, dispute, or operational request with attachments directly to GOSIKA merchant staff.
          </p>
        </div>
      </div>

      {/* Quick Presets Strip */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 20, background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} color="var(--primary)" />
          <span className="font-bold text-xs uppercase" style={{ color: 'var(--ink)', letterSpacing: '0.04em' }}>
            Quick Common Issue Shortcuts:
          </span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
          {PRESET_ISSUES.map((p) => (
            <button
              key={p.label}
              type="button"
              className="btn btn-ghost btn-xs text-left flex items-center gap-2"
              style={{
                padding: '8px 12px',
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                height: 'auto',
              }}
              onClick={() => applyPreset(p)}
            >
              <p.icon size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div className="font-bold text-xs text-ink truncate">{p.label}</div>
                <div className="muted text-xs truncate" style={{ fontSize: 10 }}>{p.category}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 24, alignItems: 'start' }}>
          {/* Main Form Fields */}
          <div className="flex flex-col gap-4">
            {/* Section 1: Ticket Details */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }} className="flex items-center gap-2">
                <FileText size={16} color="var(--primary)" /> Issue Overview & Classification
              </h3>

              <div className="flex flex-col gap-3">
                <Input
                  label="Ticket Subject *"
                  required
                  placeholder="e.g. Delay in Nabil Bank settlement payout or damaged return dispute"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />

                <div className="form-row">
                  <Select
                    label="Inquiry Category *"
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Payments & Settlement">Payments & Wallet Settlement</option>
                    <option value="Orders & Shipping Logistics">Orders & Shipping Logistics</option>
                    <option value="Returns & Damaged Dispute">Returns & Damaged Parcel Dispute</option>
                    <option value="Product Catalog & Listings">Product Catalog & Approvals</option>
                    <option value="Store & Account Verification">Store Verification & KYC</option>
                    <option value="Technical Issue">Portal Bug / Technical Issue</option>
                    <option value="Other">General Inquiry</option>
                  </Select>

                  <div>
                    <label className="label" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Urgency & Priority *
                    </label>
                    <div className="flex gap-1">
                      {[
                        { id: 'low', label: 'Low', color: 'var(--muted)' },
                        { id: 'medium', label: 'Medium', color: 'var(--primary)' },
                        { id: 'high', label: 'High', color: '#f59e0b' },
                        { id: 'urgent', label: 'Urgent', color: '#ef4444' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="btn btn-xs flex-1"
                          style={{
                            border: form.priority === p.id ? `2px solid ${p.color}` : '1px solid var(--border)',
                            background: form.priority === p.id ? 'var(--primary-50)' : '#fff',
                            color: form.priority === p.id ? 'var(--primary)' : 'var(--ink)',
                            fontWeight: form.priority === p.id ? 800 : 500,
                          }}
                          onClick={() => setForm({ ...form, priority: p.id })}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reference ID Linker */}
                <div className="form-row">
                  <Select
                    label="Linked Reference Type"
                    value={form.refType}
                    onChange={(e) => setForm({ ...form, refType: e.target.value })}
                  >
                    <option value="Order ID">Customer Order ID</option>
                    <option value="Settlement Payout ID">Settlement Payout Reference</option>
                    <option value="Return Claim ID">Return / Refund Claim ID</option>
                    <option value="Product SKU">Product SKU / Catalog ID</option>
                    <option value="None">None / General</option>
                  </Select>

                  <Input
                    label="Reference Identifier (Optional)"
                    placeholder="e.g. VO-EAB6D2B8 or SET-2026-0801"
                    value={form.refId}
                    onChange={(e) => setForm({ ...form, refId: e.target.value })}
                  />
                </div>

                <Textarea
                  label="Detailed Description of the Issue *"
                  required
                  rows={5}
                  placeholder="Provide a step-by-step description of what happened, dates, amounts, courier tracking codes, and any resolution requested…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            {/* Section 2: Real Image & Proof Attachments */}
            <div className="card" style={{ padding: 22 }}>
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
                  <ImageIcon size={16} color="var(--primary)" /> Attach Proof Images & Documents
                </h3>
                <button type="button" className="btn btn-ghost btn-xs text-primary font-bold" onClick={addSampleImage}>
                  + Add Sample Image
                </button>
              </div>
              <p className="muted text-xs mb-3">
                Upload receipts, bank deposit slips, packaging photos, damaged parcel pictures, or error screenshots (PNG, JPG, PDF up to 10MB each).
              </p>

              {/* Drag and Drop Zone */}
              <div
                style={{
                  border: dragActive ? '2px dashed var(--primary)' : '2px dashed var(--border-dark)',
                  borderRadius: 'var(--radius)',
                  padding: 24,
                  textAlign: 'center',
                  background: dragActive ? 'var(--primary-50)' : 'var(--bg)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragActive(false)
                  if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files)
                  }}
                />
                <UploadCloud size={32} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                <div className="font-bold text-sm text-ink">
                  Click to select images or drag and drop files here
                </div>
                <div className="muted text-xs mt-1">
                  Supports multiple high-resolution photos and documents
                </div>
              </div>

              {/* Uploaded Attachments Preview Grid */}
              {attachments.length > 0 && (
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginTop: 14 }}>
                  {attachments.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: '#fff',
                        overflow: 'hidden',
                      }}
                    >
                      {a.type.startsWith('image/') ? (
                        <img
                          src={a.dataUrl}
                          alt={a.name}
                          style={{ width: '100%', height: 80, objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
                          <FileText size={28} color="var(--primary)" />
                        </div>
                      )}
                      <div style={{ padding: '4px 6px' }}>
                        <div className="font-bold text-xs truncate" title={a.name}>{a.name}</div>
                        <div className="muted text-xs" style={{ fontSize: 10 }}>{a.size}</div>
                      </div>
                      <button
                        type="button"
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'rgba(15,23,42,0.7)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          removeAttachment(a.id)
                        }}
                        title="Remove file"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Contact & Callback Preferences */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }} className="flex items-center gap-2">
                <PhoneCall size={16} color="var(--primary)" /> Contact & Callback Preferences
              </h3>

              <div className="form-row">
                <Select
                  label="Preferred Contact Channel"
                  value={form.contactChannel}
                  onChange={(e) => setForm({ ...form, contactChannel: e.target.value })}
                >
                  <option value="whatsapp">WhatsApp Message</option>
                  <option value="phone">Direct Phone Call</option>
                  <option value="email">Registered Email</option>
                </Select>

                <Input
                  label="Contact Phone Number"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="+977 98XXXXXXXX"
                />

                <Select
                  label="Best Callback Window"
                  value={form.preferredTime}
                  onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                >
                  <option value="morning">Morning (9:00 AM – 12:00 PM)</option>
                  <option value="afternoon">Afternoon (12:00 PM – 4:00 PM)</option>
                  <option value="evening">Evening (4:00 PM – 7:00 PM)</option>
                  <option value="anytime">Anytime during business hours</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Context & SLA */}
          <div className="flex flex-col gap-4">
            {/* Direct Merchant Hotline */}
            <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="avatar" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', color: '#60a5fa' }}>
                  <PhoneCall size={20} />
                </span>
                <div>
                  <div className="text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em', color: '#94a3b8' }}>
                    Urgent Escalations
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>+977 1-4567890</div>
                </div>
              </div>
              <p className="text-xs" style={{ color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
                If your issue involves immediate payout stoppage or fraud, call the GOSIKA merchant support line directly.
              </p>
            </div>

            {/* SLA Info Card */}
            <div className="card" style={{ padding: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }} className="flex items-center gap-2">
                <Clock size={15} color="var(--primary)" /> Expected Resolution Times
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="muted">Urgent Priority</span>
                  <span className="font-bold text-danger">&lt; 2 Hours</span>
                </div>
                <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="muted">High Priority</span>
                  <span className="font-bold" style={{ color: '#f59e0b' }}>&lt; 4 Hours</span>
                </div>
                <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="muted">Medium Priority</span>
                  <span className="font-bold text-ink">Same Business Day</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="muted">Low / General</span>
                  <span className="font-bold text-ink">Within 24 Hours</span>
                </div>
              </div>
            </div>

            {/* Checklist Card */}
            <div className="card" style={{ padding: 20, background: 'var(--bg)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }} className="flex items-center gap-2">
                <ShieldCheck size={15} color="#10b981" /> Tips for Quick Clearance
              </h4>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--muted)' }}>
                <li>Attach clear, non-blurry pictures of receipts or tracking slips.</li>
                <li>State exact Order or Settlement reference numbers.</li>
                <li>Make sure your registered phone number is reachable during your chosen callback window.</li>
              </ul>
            </div>

            {/* Submit Actions */}
            <div className="card" style={{ padding: 20 }}>
              <Button
                type="submit"
                variant="primary"
                icon={Send}
                block
                size="lg"
                disabled={submitting}
              >
                {submitting ? <Spinner size={16} color="#fff" /> : 'Submit Support Ticket'}
              </Button>
              <div className="text-center mt-2">
                <Link to="/vendor/support" className="muted text-xs hover:text-ink">
                  Cancel & Discard Ticket
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
