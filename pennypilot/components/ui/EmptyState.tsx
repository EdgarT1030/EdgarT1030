import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-copper-50 to-amber-50 ring-1 ring-copper-100">
        <Icon className="h-7 w-7 text-copper-400" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mb-5 max-w-xs text-sm leading-relaxed text-ink-muted">{description}</p>
      )}
      {action}
    </div>
  )
}
