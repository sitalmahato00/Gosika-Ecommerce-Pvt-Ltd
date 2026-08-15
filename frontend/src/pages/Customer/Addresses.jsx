import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Plus, Trash, Eye, Edit, XCircle, Check, Clock } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'

export default function CustomerAddresses() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/customer/addresses').then((res) => {
      setAddresses(res.data.data?.addresses || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  if (!addresses.length) {
    return (
      <div className="p-8 text-center">
        <div className="es-icon"><MapPin size={48} /></div>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>No Addresses Saved</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Add an address to save delivery locations.</p>
        <Link to="/customer/addresses/add" className="btn btn-primary">Add Address</Link>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Saved Addresses</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {(addresses && addresses.map((a) => (
            <div key={a.id} className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div style={{ width: 24, height: 24, borderRadius: 50, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: 12 }}>{a.name.split(' ')[0][0]}</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, marginBottom: 2 }}>{a.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{a.phone}</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{a.street}, {a.city}, {a.state} {a.zip}</p>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Default</span>
                <button className="btn btn-sm btn-outline">Edit</button>
                <button className="btn btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'right' }}>
          <Link to="/customer/addresses/add" className="btn btn-primary mt-4">Add New Address</Link>
        </div>
      </div>
    </div>
  )
}