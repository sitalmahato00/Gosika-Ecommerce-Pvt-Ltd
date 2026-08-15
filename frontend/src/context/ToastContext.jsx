import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((message, type = 'info', ms = 3500) => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), ms)
  }, [dismiss])

  const toast = useCallback({
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error', 5000),
    info: (m) => push(m, 'info'),
  }, [push])

  const icons = {
    success: <CheckCircle2 size={18} color="var(--success)" />,
    error: <XCircle size={18} color="var(--danger)" />,
    info: <Info size={18} color="var(--info)" />,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
            {icons[t.type]}
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
