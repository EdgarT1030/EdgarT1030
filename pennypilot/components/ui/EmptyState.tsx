import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted">
        <Icon className="h-8 w-8 text-ink-faint" aria-hidden />
      </div>
      <h3 className="mb-1 text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mb-4 text-sm text-ink-muted max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
