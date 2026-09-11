import React, { useEffect, useMemo, useState } from 'react'
import {
  Terminal, RefreshCw, FileText, ClipboardCopy, Download,
  CheckCircle2, Info, AlertTriangle, XCircle, Filter, ChevronRight
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/format'

const LEVELS = ['ALL', 'DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY']

const LEVEL_COLORS = {
  DEBUG: '#64748b',
  INFO: '#0284c7',
  NOTICE: '#0d9488',
  WARNING: '#d97706',
  ERROR: '#dc2626',
  CRITICAL: '#b91c1c',
  ALERT: '#9f1239',
  EMERGENCY: '#7f1d1d',
}

const LEVEL_ICONS = {
  DEBUG: Info,
  INFO: Info,
  NOTICE: Info,
  WARNING: AlertTriangle,
  ERROR: XCircle,
  CRITICAL: XCircle,
  ALERT: XCircle,
  EMERGENCY: XCircle,
}

const LINES_OPTIONS = [200, 500, 1000, 2000]

export default function AdminSystemLogs() {
  const toast = useToast()
  const [files, setFiles] = useState([])
  const [activeFile, setActiveFile] = useState('')
  const [level, setLevel] = useState('ALL')
  const [lines, setLines] = useState(500)
  const [search, setSearch] = useState('')
  const [content, setContent] = useState([])
  const [fileMeta, setFileMeta] = useState(null)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadFiles = async () => {
    setLoadingFiles(true)
    try {
      const res = await api.get('/admin/logs')
      const list = res.data?.data || []
      setFiles(list)
      if (!activeFile && list.length > 0) {
        setActiveFile(list[0].name)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load log files.')
    } finally {
      setLoadingFiles(false)
    }
  }

  const loadContent = async () => {
    if (!activeFile) return
    setLoading(true)
    try {
      const res = await api.get('/admin/logs/view', {
        params: { file: activeFile, lines, level: level === 'ALL' ? '' : level, search },
      })
      const data = res.data?.data || {}
      setContent(data.lines || [])
      setFileMeta({ size: data.size, modified_at: data.modified_at, total: data.total ?? (data.lines || []).length })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to read log file.')
      setContent([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
    return () => setLoadingFiles(false)
  }, [])

  useEffect(() => {
    if (activeFile) loadContent()
  }, [activeFile, lines])

  const applyFilters = () => {
    loadContent()
  }

  const levelCounts = useMemo(() => {
    const counts = {}
    LEVELS.forEach((l) => { counts[l] = 0 })
    content.forEach((line) => {
      if (counts[line.level] != null) counts[line.level] += 1
    })
    return counts
  }, [content])

  const downloadRaw = () => {
    const text = content.map((l) => l.content).join('\n')
    const blob = new Blob(['\ufeff', text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeFile.replace(/\.log$/i, '')}_tail.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(content.map((l) => l.content).join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Clipboard unavailable in this browser.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 50 }}>
      <PageHeader
        title="System Logs"
        description="Inspect application runtime logs across all channels — errors, warnings, authentication and notification activities."
        breadcrumbs={[
          { label: 'System', to: '/admin/system/settings' },
          { label: 'System Logs' }
        ]}
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => { loadFiles(); loadContent(); }}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        }
      />

      {/* Controls */}
      <div className="card" style={{ padding: 16, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <select
              className="select select-sm"
              value={activeFile}
              onChange={(e) => setActiveFile(e.target.value)}
              disabled={loadingFiles}
              style={{ minWidth: 240 }}
            >
              {files.length === 0 && <option value="">No log files</option>}
              {files.map((f) => (
                <option key={f.name} value={f.name}>{f.name}</option>
              ))}
            </select>

            <select
              className="select select-sm"
              value={lines}
              onChange={(e) => setLines(Number(e.target.value))}
              style={{ width: 120 }}
            >
              {LINES_OPTIONS.map((n) => (
                <option key={n} value={n}>last {n} lines</option>
              ))}
            </select>

            <div style={{ position: 'relative' }}>
              <Filter size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
              <input
                className="input input-sm"
                style={{ paddingLeft: 28, width: 220 }}
                placeholder="Search logs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>

            <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters} disabled={loading}>
              Apply
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {fileMeta && (
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                {Number(fileMeta.size).toLocaleString()} bytes · {formatDate(fileMeta.modified_at ? new Date(fileMeta.modified_at * 1000).toISOString() : new Date().toISOString())}
              </span>
            )}
            <button type="button" className="btn btn-outline btn-xs" onClick={copyAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {copied ? <CheckCircle2 size={13} color="#16a34a" /> : <ClipboardCopy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" className="btn btn-outline btn-xs" onClick={downloadRaw} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Download size={13} /> Download
            </button>
          </div>
        </div>

        {/* Level chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
          {LEVELS.map((l) => {
            const active = level === l
            const count = l === 'ALL' ? content.length : (levelCounts[l] || 0)
            const color = l === 'ALL' ? 'var(--ink)' : (LEVEL_COLORS[l] || '#64748b')
            return (
              <button
                key={l}
                type="button"
                onClick={() => { setLevel(l); setContent([]) }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 16,
                  border: active ? `1.5px solid ${color}` : '1px solid var(--border)',
                  background: active ? `${color}18` : 'transparent',
                  color,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {l}
                <span style={{ opacity: 0.65, fontWeight: 600 }}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Log output */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border)', background: '#0b1220' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: '#131b2b',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            color: '#e2e8f0',
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          <Terminal size={15} color="#ff5500" />
          <span style={{ fontFamily: 'monospace' }}>{activeFile || 'no file selected'}</span>
          <ChevronRight size={13} style={{ color: '#475569' }} />
          <span style={{ color: '#94a3b8' }}>{fileMeta?.total ?? content.length} entries</span>
          {loading && <RefreshCw size={13} className="spin" style={{ color: '#94a3b8' }} />}
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 11.5,
            lineHeight: 1.55,
            maxHeight: '62vh',
            overflow: 'auto',
            padding: 0,
          }}
        >
          {loadingFiles ? (
            <div style={{ padding: 20, color: '#64748b' }}>Loading log files…</div>
          ) : loading ? (
            <div style={{ padding: 20, color: '#64748b' }}>Reading {activeFile}…</div>
          ) : content.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <FileText size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
              No matching log entries.
            </div>
          ) : (
            content.map((line, i) => {
              const Icon = LEVEL_ICONS[line.level] || Info
              const color = LEVEL_COLORS[line.level] || '#64748b'
              return (
                <div
                  key={`${line.n}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '1px 14px',
                    background: line.level === 'ERROR' || line.level === 'CRITICAL' ? 'rgba(220,38,38,0.08)' : 'transparent',
                    borderLeft: `2px solid ${line.level === 'ERROR' || line.level === 'CRITICAL' ? color : 'transparent'}`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <span style={{ width: 38, flexShrink: 0, textAlign: 'right', color: '#334155', userSelect: 'none' }}>{line.n}</span>
                  {line.level && line.ts ? (
                    <>
                      <span style={{ width: 18, flexShrink: 0, marginTop: 1 }}><Icon size={12} color={color} /></span>
                      <span style={{ color: '#64748b', flexShrink: 0 }}>{line.ts}</span>
                      <span style={{ color, fontWeight: 800, flexShrink: 0 }}>{line.level}</span>
                    </>
                  ) : (
                    <span style={{ width: 18, flexShrink: 0 }} />
                  )}
                  <span style={{ color: line.level && line.ts ? '#cbd5e1' : '#64748b' }}>{line.content}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}