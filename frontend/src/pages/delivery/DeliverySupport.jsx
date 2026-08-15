import React, { useState } from 'react'
import { Headphones, MessageCircleQuestion, ChevronDown, Info } from 'lucide-react'

const FAQS = [
  {
    q: 'How do I accept a delivery?',
    a: 'Open the assigned delivery from your Deliveries list and press "Accept". You can then proceed to the pickup workflow from the vendor.',
  },
  {
    q: 'How do I confirm a delivery with the customer?',
    a: 'Start the delivery to generate a 6-digit OTP, share it with the customer, then enter their code to confirm the handover.',
  },
  {
    q: 'What if the customer is not reachable?',
    a: 'Mark the delivery as failed with a reason. You can then return the parcel to the vendor so their stock is restored.',
  },
  {
    q: 'When do I receive my delivery fee?',
    a: 'The fee is added to your earnings as soon as a delivery is confirmed. Payouts are scheduled by the GOSIKA dispatch hub.',
  },
  {
    q: 'How do I go on duty?',
    a: 'Use the Online / Off Duty toggle in the top bar or in Settings. While online, the hub can dispatch deliveries to you.',
  },
]

export default function DeliverySupport() {
  const [open, setOpen] = useState(null)

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Help & Support</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>Answers to common rider questions.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 18, margin: 0, background: '#eef2ff', border: '1px solid rgba(79, 70, 229, 0.25)' }}>
        <div className="flex items-start gap-3">
          <span className="avatar" style={{ width: 40, height: 40, background: '#4f46e5', color: '#fff', flexShrink: 0 }}>
            <Headphones size={19} />
          </span>
          <div>
            <div className="font-bold" style={{ color: '#4338ca' }}>GOSIKA Dispatch Hub</div>
            <p className="muted text-sm mt-1" style={{ margin: 0, color: '#3730a3' }}>
              For urgent issues — failed payments, lost parcels or dispatch problems — call or visit the GOSIKA dispatch hub during business hours. Contact details are provided when you onboard.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={i} className="card" style={{ padding: 0, margin: 0, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex items-center justify-between gap-3"
                style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span className="font-bold text-sm text-ink flex items-center gap-2">
                  <MessageCircleQuestion size={15} color="#4f46e5" /> {f.q}
                </span>
                <ChevronDown size={15} color="#94a3b8" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {isOpen && (
                <div className="px-4.5 pb-4" style={{ padding: '0 18px 16px', background: 'var(--bg)' }}>
                  <p className="muted text-sm" style={{ margin: 0 }}>{f.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="card" style={{ padding: 14, margin: 0, background: '#f8fafc', border: '1px solid var(--border)' }}>
        <p className="muted text-xs m-0" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Info size={14} style={{ color: '#4f46e5', flexShrink: 0, marginTop: 1 }} />
          <span>
            Need more help? Your onboarding team at the dispatch hub has your full support contact list and can raise issues on your behalf.
          </span>
        </p>
      </div>
    </div>
  )
}
