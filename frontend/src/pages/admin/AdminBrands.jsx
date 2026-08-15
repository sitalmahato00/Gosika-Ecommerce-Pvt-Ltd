import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Tag, Box, Check, Trash, Edit, Eye } from 'lucide-react'
import api from '../../api/client'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminBrands() {
  const toast = useToast()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/brands', { params: { search: search || undefined } }).then((r) => setBrands(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [search])

  const doDelete = async (id) => {
    if (!window.confirm('Delete this brand?')) return
    try {
      await api.delete(`/admin/brands/${id}`)
      toast.success('Brand deleted')
      setBrands((bs) => bs.filter((b) => b.id !== id))
    } catch (e) { toast.error(errorMessage(e)) }
  }

  if (loading) {
    return <div className="card"><Skeleton height={120} /></div>
  }

  if (!brands.length) return <EmptyState icon={Tag} title="No brands" message="Brands will appear here after creation." />

  return (
    <div>
      <div className="flex items-center justify-between wrap mb-2">
        <h2 style={{ fontSize: 20 }}>Brands</h2>
        <input className="input" style={{ maxWidth: 240 }} placeholder="Search brands…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex flex-col gap-3">
        {brands.map((b) => (
          <div key={b.id} className="card flex items-center gap-3" style={{ padding: 16 }}>
            <span className="thumb" style={{ width: 32, height: 32 }}><Tag size={16} /></span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{b.name}</div>
              <div className="muted text-xs">{b.slug}</div>
            </div>
            <div className="flex items-center gap-1">
              <button className="btn btn-danger-outline btn-xs" onClick={() => doDelete(b.id)}><Trash size={12} /></button>
              <button className="btn btn-outline btn-xs"><Edit size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}