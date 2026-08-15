import React, { useState } from 'react'
import { FileText, Search, Shield, Filter, Download, ArrowRight, UserCheck, AlertCircle } from 'lucide-react'
import { formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_LOGS = [
  { id: 1082, user: 'Admin Administrator (admin@gosika.com.np)', action: 'Vendor Approved', resource: 'Vendor #14 (Himalaya Organics)', oldValue: 'Status: Pending Review', newValue: 'Status: Approved', ip: '103.10.28.44 (Kathmandu)', time: '2026-08-15 11:22:15' },
  { id: 1081, user: 'Kiran Basnet (Finance Admin)', action: 'Payout Processed', resource: 'Payout #PO-401 (Kathmandu Crafts)', oldValue: 'Status: Pending', newValue: 'Status: Paid (Rs. 45,000 via Nabil Bank)', ip: '27.34.41.90 (Lalitpur)', time: '2026-08-15 10:45:02' },
  { id: 1080, user: 'Dipesh Shrestha (Product Manager)', action: 'Product Approved', resource: 'Product #89 (Pashmina Shawl)', oldValue: 'Status: Pending Review', newValue: 'Status: Published', ip: '103.10.28.44 (Kathmandu)', time: '2026-08-15 09:30:41' },
  { id: 1079, user: 'Admin Administrator (admin@gosika.com.np)', action: 'Commission Override', resource: 'Vendor #8 (Pokhara Electronics)', oldValue: 'Rate: 10.0%', newValue: 'Rate: 8.5%', ip: '103.10.28.44 (Kathmandu)', time: '2026-08-14 17:15:00' },
  { id: 1078, user: 'Pooja Thapa (Operations Admin)', action: 'Delivery Reassigned', resource: 'Assignment #DEL-902', oldValue: 'Partner: Rider 14', newValue: 'Partner: Rider 22', ip: '27.34.41.90 (Lalitpur)', time: '2026-08-14 14:02:18' },
  { id: 1077, user: 'System (Security Engine)', action: 'Admin Login Successful', resource: 'Session #SES-9821', oldValue: 'None', newValue: 'Authenticated (2FA Verified)', ip: '103.10.28.44 (Kathmandu)', time: '2026-08-14 09:00:11' },
]

const ACTION_TYPES = [
  '',
  'Vendor Approved',
  'Payout Processed',
  'Product Approved',
  'Commission Override',
  'Delivery Reassigned',
  'Admin Login Successful',
]

export default function AdminAuditLogs() {
  const toast = useToast()
  const [logs, setLogs] = useState(SAMPLE_LOGS)
  const [actionFilter, setActionFilter] = useState('')
  const [search, setSearch] = useState('')

  const exportLogs = () => {
    toast.success('Audit security log exported to encrypted CSV')
  }

  const filtered = logs.filter((l) => {
    const matchesAction = !actionFilter || l.action === actionFilter
    const matchesSearch = !search ||
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase()) ||
      l.ip.toLowerCase().includes(search.toLowerCase())
    return matchesAction && matchesSearch
  })

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Security Audit & Activity Logs</h1>
          <p>Immutable forensic record of all administrative modifications, approvals, payments, and system accesses</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={exportLogs}>
          <Download size={14} /> Export Audit Log
        </button>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search audit trail by user, resource, IP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 200 }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Action Types</option>
          {ACTION_TYPES.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Admin User</th>
              <th>Action Performed</th>
              <th>Target Resource</th>
              <th>Previous Value</th>
              <th>New Value</th>
              <th>IP Address & Location</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td>
                  <span className="font-mono text-xs text-muted">#{l.id}</span>
                </td>
                <td>
                  <span className="font-semibold text-sm text-ink">{l.user}</span>
                </td>
                <td>
                  <span className="badge badge-primary">{l.action}</span>
                </td>
                <td className="text-sm font-medium">{l.resource}</td>
                <td className="muted text-xs font-mono">{l.oldValue}</td>
                <td className="text-xs font-mono text-success font-semibold">{l.newValue}</td>
                <td className="muted text-xs">{l.ip}</td>
                <td className="muted text-xs whitespace-nowrap">{l.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
