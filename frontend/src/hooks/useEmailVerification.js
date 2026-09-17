import { useState, useRef, useEffect, useCallback } from 'react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/format'

export default function useEmailVerification({ email, verified, onVerified, autoSend = false }) {
  const toast = useToast()
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const sentOnce = useRef(false)

  const resend = useCallback(async () => {
    if (!email) return
    setError(null)
    setSending(true)
    try {
      await api.post('/auth/email/resend', { email })
      setSent(true)
      toast.success(`Verification code sent to ${email}`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }, [email, toast])

  useEffect(() => {
    if (autoSend && !verified && email && !sentOnce.current) {
      sentOnce.current = true
      resend()
    }
  }, [autoSend, verified, email, resend])

  const verify = useCallback(async (e) => {
    if (e) e.preventDefault()
    setError(null)
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code you received by email.')
      return
    }
    setVerifying(true)
    try {
      await api.post('/auth/email/verify', { email, code })
      toast.success('Email verified — your account is now active.')
      if (onVerified) await onVerified()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setVerifying(false)
    }
  }, [code, email, onVerified, toast])

  return { code, setCode, sending, verifying, sent, error, resend, verify }
}