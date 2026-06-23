import type { ReportStatus } from '@/lib/supabase/types'
import { STATUS_CONFIG } from '@/lib/constants'

interface BadgeProps {
  status: ReportStatus
  className?: string
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const { label, color } = STATUS_CONFIG[status]
  return (
    <span className={`badge ${color} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  )
}
