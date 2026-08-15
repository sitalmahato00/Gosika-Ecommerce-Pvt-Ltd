import React, { useEffect, useState } from 'react'
import { Landmark, Plus, Trash2 } from 'lucide-react'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

const emptyForm = { bank_name: '', branch_name: '', account_name: '', account_number: '', account_type: 'savings' }

export default function VendorBankAccounts() {
  const toast = useToast()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/vendor/bank-accounts').then((r) => setAccounts(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/vendor/bank-accounts', form)
      toast.success('Bank account added')
      setModalOpen(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/vendor/bank-accounts/${deleteTarget.id}`)
      toast.success('Bank account removed')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between wrap gap-2 mb-2">
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 2 }}>Bank accounts</h2>
          <p className="muted text-sm m-0">Accounts used for payout settlements.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>Add account</Button>
      </div>

      {loading ? (
        <div className="card"><Spinner size={20} color="var(--primary)" /></div>
      ) : accounts.length ? (
        <div className="flex flex-col gap-3">
          {accounts.map((a) => (
            <div key={a.id} className="card flex items-center gap-3" style={{ padding: 16 }}>
              <span className="thumb" style={{ width: 48, height: 48 }}><Landmark size={20} /></span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold" style={{ fontSize: 15 }}>
                  {a.bank_name} {a.branch_name && <span className="muted font-normal">· {a.branch_name}</span>}
                  {a.is_default && (
                    <span className="chip chip-sm" style={{ marginLeft: 8, background: 'var(--primary-50)', color: 'var(--primary)' }}>Default</span>
                  )}
                </div>
                <div className="muted text-sm">{a.account_name} · {a.account_number}</div>
                <div className="capitalize text-xs muted">{a.account_type || 'savings'}</div>
              </div>
              <div className="flex items-center gap-1">
                <button className="btn btn-danger-outline btn-sm" onClick={() => setDeleteTarget(a)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Landmark} title="No bank accounts" message="Add a bank account so you can withdraw your earnings." action={<Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>Add account</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add bank account">
        <form onSubmit={save} className="flex flex-col gap-2">
          <div className="form-row">
            <Input label="Bank name" required value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="e.g. Nabil Bank" />
            <Input label="Branch" value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} placeholder="e.g. Thamel" />
          </div>
          <Input label="Account holder name" required value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
          <Input label="Account number" required value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
          <Select label="Account type" value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })}>
            <option value="savings">Savings</option>
            <option value="current">Current</option>
            <option value="other">Other</option>
          </Select>
          <Button type="submit" block disabled={saving}>{saving ? <Spinner size={15} color="#fff" /> : 'Add account'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        danger
        loading={deleting}
        title="Remove bank account?"
        message={`${deleteTarget?.bank_name} (${deleteTarget?.account_number}) will be removed.`}
        confirmText="Remove"
      />
    </div>
  )
}
