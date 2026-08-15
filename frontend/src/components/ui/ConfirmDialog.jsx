import React from 'react'
import Modal from './Modal'
import Button from './Button'
import Spinner from './Spinner'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  loading = false,
  danger = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {loading && <Spinner size={14} color="#fff" />}
            {confirmText}
          </Button>
        </>
      }
    >
      {message && <p className="m-0">{message}</p>}
      {children}
    </Modal>
  )
}
