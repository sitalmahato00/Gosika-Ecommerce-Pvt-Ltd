import React, { useEffect, useState } from 'react'
import { Loader2, Check, Trash, Eye, Edit, XCircle, Calendar, ArrowPath, Plus } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function VendorPayouts() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_holder: '' })

  useEffect(() => {
    api.get('/vendor/payouts').then((res) => {
      setPayouts(res.data.data?.payouts || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  const handleOpen = (payout?) => {
    setForm({
      bank_name: payout?.bank_name || '',
      account_number: payout?.account_number || '',
      account_holder: payout?.account_holder || '',
    })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setForm({ bank_name: '', account_number: '', account_holder: '' })
  }

  const handleWithdraw = async () => {
    setLoading(true)
    try {
      await api.post('/vendor/payouts/withdraw', form)
      toast.success('Payout requested successfully')
      handleClose()
    } catch (e) {
      toast.error('Failed to process payout')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Payouts & Wallet</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Payouts History */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Payout History</h3>

            {payouts.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(payouts && payouts.map((p) => (
                  <div key={p.id} className="p-3 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)', marginBottom: 8 }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontWeight: 500 }}>{p.method}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(p.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--primary)' }}>Rs. {p.amount}</p>
                    <p style={{ fontSize: 10, color: 'var(--muted)' }}>Status: {p.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Loader2} title="No Payouts" message="No payout records found." />
            )}
          </div>

          {/* Withdraw Form */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Request Payout</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Minimum payout threshold: Rs. 500</p>
            <form onSubmit={(e) => { e.preventDefault(); handleWithdraw() }}>
              <div>
                <label className="block text-sm font-medium mb-2">Bank Name</label>
                <input
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  placeholder "Nabil Bank"
                  className="w-full rounded-sm border p-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Account Number</label>
                  <input
                    value={form.account_number}
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                    placeholder "123456789012"
                    className="w-full rounded-sm border p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Account Holder</label>
                  <input
                    value={form.account_holder}
                    onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
                    placeholder "John Doe"
                    className="w-full rounded-sm border p-3"
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary">Request Payout</button>
                <button type="button" className="btn btn-outline ml-2" onClick={handleClose}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}