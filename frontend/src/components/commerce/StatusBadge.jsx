import React from 'react'
import Badge from '../ui/Badge'
import { humanizeEnum } from '../../utils/format'

export default function StatusBadge({ status }) {
  const v = status?.value || status
  return <Badge variant={v || 'default'}>{v ? humanizeEnum(v) : '—'}</Badge>
}
