import React, { useState } from 'react'
import {
  User, Truck, Phone, ShieldCheck, MapPin, Building2,
  Calendar, FileText, CheckCircle2, Edit, Save, Lock
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'

export default function DeliveryProfile() {
  const toast = useToast()
  const [profile, setProfile] = useState({
    name: 'Bikash Shrestha',
    phone: '+977 980-1234567',
    email: 'bikash.rider@gosika.com.np',
    citizenship_no: '27-01-78-01928',
    license_no: '01-08-992140',
    license_expiry: '2029-04-15',
    vehicle_type: 'Motorcycle',
    vehicle_plate: 'BA 88 PA 4912',
    vehicle_model: 'Hero Splendor Plus (Black)',
    assigned_hub: 'Kathmandu Central Logistics Hub (Thamel)',
    emergency_contact: 'Sunil Shrestha (Brother - +977 984-1122334)',
  })
  const [editing, setEditing] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setEditing(false)
    toast.success('Rider and vehicle profile updated successfully!')
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Rider & Vehicle Profile
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Manage your personal identity details, driver license validity, and vehicle registration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button
              type="button"
              className="btn btn-outline btn-sm flex items-center gap-1"
              onClick={() => setEditing(true)}
            >
              <Edit size={14} /> Edit Profile
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={handleSave}
            >
              <Save size={14} /> Save Changes
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Verification Status Banner */}
        <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '16px 20px', margin: 0, background: '#ecfdf5', border: '1px solid #bbf7d0' }}>
          <div className="flex items-center gap-3">
            <span className="avatar" style={{ width: 40, height: 40, background: '#10b981', color: '#ffffff' }}>
              <ShieldCheck size={22} />
            </span>
            <div>
              <div className="font-bold text-sm" style={{ color: '#166534' }}>
                Verified GOSIKA Delivery Partner
              </div>
              <div className="text-xs" style={{ color: '#166534' }}>
                Background check, Driver License, and Vehicle Bluebook verified by Central HQ.
              </div>
            </div>
          </div>
          <span className="badge badge-success font-bold">● Active & Authorized</span>
        </div>

        {/* 2-Col Profile Cards */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {/* Rider Personal Info */}
          <div className="card" style={{ padding: 20, margin: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
              <User size={16} color="var(--primary)" /> Personal & License Information
            </h3>

            <div className="flex flex-col gap-3">
              <div className="form-group">
                <label className="label">Full Legal Name</label>
                <input
                  className="input font-bold"
                  disabled={!editing}
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Mobile Phone</label>
                  <input
                    className="input"
                    disabled={!editing}
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Official Email</label>
                  <input
                    className="input"
                    disabled
                    value={profile.email}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Driver's License Number</label>
                  <input
                    className="input font-mono font-bold"
                    disabled={!editing}
                    value={profile.license_no}
                    onChange={(e) => setProfile({ ...profile, license_no: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label">License Expiry Date</label>
                  <input
                    className="input"
                    disabled={!editing}
                    value={profile.license_expiry}
                    onChange={(e) => setProfile({ ...profile, license_expiry: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Emergency Contact</label>
                <input
                  className="input"
                  disabled={!editing}
                  value={profile.emergency_contact}
                  onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Vehicle & Hub Info */}
          <div className="card" style={{ padding: 20, margin: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
              <Truck size={16} color="var(--primary)" /> Vehicle & Operations Hub
            </h3>

            <div className="flex flex-col gap-3">
              <div className="form-group">
                <label className="label">Assigned Operations Hub</label>
                <input
                  className="input font-bold"
                  disabled
                  value={profile.assigned_hub}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Vehicle Type</label>
                  <select
                    className="select"
                    disabled={!editing}
                    value={profile.vehicle_type}
                    onChange={(e) => setProfile({ ...profile, vehicle_type: e.target.value })}
                  >
                    <option value="Motorcycle">Motorcycle (125cc-150cc)</option>
                    <option value="Scooter">Scooter (110cc-125cc)</option>
                    <option value="Electric Bike">Electric Two-Wheeler</option>
                    <option value="Delivery Van">Commercial Mini-Van / Cargo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">License Plate Number</label>
                  <input
                    className="input font-mono font-bold"
                    disabled={!editing}
                    value={profile.vehicle_plate}
                    onChange={(e) => setProfile({ ...profile, vehicle_plate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Vehicle Make & Model</label>
                <input
                  className="input"
                  disabled={!editing}
                  value={profile.vehicle_model}
                  onChange={(e) => setProfile({ ...profile, vehicle_model: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
