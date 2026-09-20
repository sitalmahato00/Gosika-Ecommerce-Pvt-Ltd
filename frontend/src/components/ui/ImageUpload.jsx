import React, { useRef, useState } from 'react'
import { UploadCloud, Image as ImageIcon, X, Link2, Loader2, Check } from 'lucide-react'
import api from '../../api/client'
import { apiImage, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function ImageUpload({
  label,
  value,
  onChange,
  folder = 'general',
  helper = 'Supports PNG, JPG, WEBP or SVG up to 10MB',
  required = false,
  aspectRatio = 'auto', // '16/9', '1/1', '21/9', 'auto'
  previewHeight = 140,
  allowUrl = true,
  className = '',
}) {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')

  const handleFileSelect = async (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP, SVG).')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB.')
      return
    }

    const formData = new FormData()
    formData.append('image', file)
    formData.append('folder', folder)

    setUploading(true)
    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploadedUrl = res.data?.data?.url || res.data?.url
      if (uploadedUrl) {
        onChange(uploadedUrl)
        toast.success('Image uploaded successfully!')
      } else {
        throw new Error('Upload completed but no URL returned.')
      }
    } catch (err) {
      // Fallback: if offline or server error, use FileReader data URL so user isn't blocked
      try {
        const reader = new FileReader()
        reader.onload = (e) => {
          onChange(e.target.result)
          toast.success('Image attached locally.')
        }
        reader.readAsDataURL(file)
      } catch (readErr) {
        toast.error(errorMessage(err, 'Failed to upload image.'))
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleRemove = () => {
    onChange('')
    setUrlDraft('')
  }

  const applyUrl = () => {
    if (urlDraft.trim()) {
      onChange(urlDraft.trim())
      setShowUrlInput(false)
    }
  }

  const hasImage = Boolean(value && typeof value === 'string' && value.trim())

  return (
    <div className={`form-group ${className}`} style={{ marginBottom: 14 }}>
      {label && (
        <label className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            {label} {required && <span className="req text-danger">*</span>}
          </span>
          {allowUrl && !uploading && (
            <button
              type="button"
              className="btn btn-ghost btn-xs text-primary"
              style={{ fontSize: 11, padding: '1px 6px', fontWeight: 600 }}
              onClick={() => {
                setShowUrlInput(!showUrlInput)
                if (!showUrlInput && hasImage) setUrlDraft(value)
              }}
            >
              <Link2 size={11} style={{ marginRight: 3, display: 'inline', verticalAlign: '-1px' }} />
              {showUrlInput ? 'Back to File Upload' : 'Paste URL Instead'}
            </button>
          )}
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
      />

      {/* Manual URL Input view */}
      {showUrlInput ? (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            type="url"
            className="input"
            style={{ fontSize: 13 }}
            placeholder="https://images.unsplash.com/… or /storage/…"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyUrl() } }}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={applyUrl}>
            Apply
          </button>
        </div>
      ) : null}

      {/* Main Image View / Dropzone */}
      {hasImage ? (
        <div
          style={{
            position: 'relative',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: '#f8fafc',
            height: previewHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))',
          }}
        >
          <img
            src={apiImage(value)}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: aspectRatio === '1/1' ? 'contain' : 'cover',
            }}
          />

          {/* Action overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.1) 60%)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: 10,
            }}
          >
            <span
              style={{
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                background: 'rgba(0,0,0,0.4)',
                padding: '2px 8px',
                borderRadius: 4,
                maxWidth: '65%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {value.startsWith('data:') ? 'Attached Image File' : value.split('/').pop()}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-xs"
                style={{
                  background: '#fff',
                  color: 'var(--ink)',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontWeight: 700,
                }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <UploadCloud size={13} style={{ marginRight: 4 }} />
                {uploading ? 'Uploading…' : 'Change'}
              </button>

              <button
                type="button"
                className="btn btn-xs"
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  fontWeight: 700,
                }}
                onClick={handleRemove}
                disabled={uploading}
                title="Remove Image"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 10,
            background: dragOver ? 'rgba(255, 85, 0, 0.04)' : '#fafafa',
            padding: '24px 16px',
            textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={26} className="animate-spin text-primary" color="var(--primary)" />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Uploading image to server…</div>
              <div className="muted text-xs">Please wait a moment</div>
            </>
          ) : (
            <>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255, 85, 0, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <UploadCloud size={22} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                Click to browse or drag & drop image file
              </div>
              <div className="muted text-xs" style={{ maxWidth: 300 }}>
                {helper}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
