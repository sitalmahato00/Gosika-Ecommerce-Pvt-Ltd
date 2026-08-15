import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Building2, Check, XCircle, Eye, Edit, Trash, Calendar, Mail, Phone } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function VendorCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendor/customers', { params: { per_page: 10 } }).then((res) => {
      setCustomers(res.data.data?.customers || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}><Skeleton height={200} /><Skeleton height={200} /></div>
  }

  if (!customers.length) return <EmptyState icon={Users} title="No Customers" message="No customers found." />

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Customers</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(customers && customers.map((c) => (
            <div key={c.id} className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="/placeholder-avatar.jpg"
                  alt={c.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 2 }}>{c.name}</h4>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{c.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>Total Orders</span>
                  <span style={{ fontWeight: 500 }}>{c.total_orders}</span>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>Total Spent</span>
                  <span style={{ fontWeight: 500, color: 'var(--primary)' }}>{(c.total_spent || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-3">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Member Since</span>
                <span style={{ fontWeight: 500 }}>{formatDate(c.created_at)}</span>
              </div>
            </div>
          ))}
        ]}

        {!customers.length && (
          <EmptyState icon={Users} title="No Customers" message="No customers found." />
        )}
      </div>
    </div>
  )
}