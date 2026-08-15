import React, { useState } from 'react'
import { Headphones, Mail, Phone, ChevronDown, Truck, CreditCard, RefreshCcw, Store } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'

const SECTIONS = {
  shipping: {
    title: 'Shipping & Delivery',
    icon: Truck,
    body: 'We deliver across all 7 provinces of Nepal through trusted logistics partners.\n\n• Standard delivery: 2–5 working days.\n• Express delivery (selected areas): 1–2 working days.\n• Free delivery on orders above Rs. 2,000.\n• You will receive live tracking once your order ships.',
  },
  payments: {
    title: 'Payment Methods',
    icon: CreditCard,
    body: 'We support Cash on Delivery (COD) and Khalti online payments.\n\n• COD: Pay in cash when your order arrives. COD is available for orders up to Rs. 50,000.\n• Khalti: Pay securely online at checkout. Your order is confirmed once payment is verified.',
  },
  returns: {
    title: 'Returns & Refunds',
    icon: RefreshCcw,
    body: 'Eligible items can be returned within 7 days of delivery.\n\n• Items must be unused and in original packaging.\n• Refunds are processed within 5 working days of a successful return.\n• Damaged or incorrect items are eligible for free return pickup.\n\nContact support to initiate a return.',
  },
  selling: {
    title: 'Selling on Gosika',
    icon: Store,
    body: 'Join Gosika to reach customers across Nepal.\n\n• Apply as a vendor and complete KYC.\n• Get approved by our team (usually within 2 working days).\n• List products, set your own prices.\n• We deduct a small commission per sale.\n• Withdraw earnings to your bank account anytime.',
  },
}

export default function Help() {
  const [open, setOpen] = useState('shipping')
  return (
    <div className="page-shell container">
      <div className="text-center mb-3" style={{ maxWidth: 560, margin: '0 auto 24px' }}>
        <span className="avatar" style={{ width: 56, height: 56, marginBottom: 10 }}><Headphones size={26} /></span>
        <h1 style={{ fontSize: 24 }}>How can we help?</h1>
        <p className="muted">Find answers about shipping, payments, returns and selling.</p>
      </div>

      <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
        {Object.entries(SECTIONS).map(([key, s]) => (
          <div key={key} style={{ borderBottom: '1px solid var(--border)' }}>
            <button
              className="flex items-center justify-between gap-2"
              onClick={() => setOpen(open === key ? '' : key)}
              style={{ width: '100%', padding: '14px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, textAlign: 'left' }}
              aria-expanded={open === key}
            >
              <span className="flex items-center gap-2"><s.icon size={18} color="var(--primary)" /> {s.title}</span>
              <ChevronDown size={17} style={{ transform: open === key ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {open === key && <p className="muted" style={{ padding: '0 8px 16px', whiteSpace: 'pre-line' }}>{s.body}</p>}
          </div>
        ))}
      </div>

      <div className="card mt-2" style={{ maxWidth: 640, margin: '16px auto 0' }}>
        <h2 style={{ fontSize: 17 }} className="flex items-center gap-2"><Headphones size={18} color="var(--primary)" /> Still need help?</h2>
        <p className="muted text-sm">Our support team is available 24/7.</p>
        <div className="flex items-center gap-4 wrap mt-2">
          <a href="mailto:support@gosika.com.np" className="btn btn-outline"><Mail size={16} /> support@gosika.com.np</a>
          <a href="tel:+9779800000000" className="btn btn-outline"><Phone size={16} /> +977 9800 000 000</a>
        </div>
      </div>
    </div>
  )
}
