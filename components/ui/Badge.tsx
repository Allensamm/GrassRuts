import { cn } from '@/lib/utils'

type Variant = 'default' | 'pending' | 'high_priority' | 'in_review' | 'resolved' | 'verified' | 'success' | 'error' | 'warning'

const VARIANTS: Record<Variant, string> = {
  default:       'bg-slate-100 text-slate-600 border-slate-200',
  pending:       'bg-amber-50  text-amber-700  border-amber-200',
  high_priority: 'bg-red-50    text-red-700    border-red-200',
  in_review:     'bg-blue-50   text-blue-700   border-blue-200',
  resolved:      'bg-green-50  text-green-700  border-green-200',
  verified:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  success:       'bg-green-50  text-green-700  border-green-200',
  error:         'bg-red-50    text-red-700    border-red-200',
  warning:       'bg-amber-50  text-amber-700  border-amber-200',
}

const LABELS: Partial<Record<Variant, string>> = {
  pending:       'Pending',
  high_priority: 'High Priority',
  in_review:     'In Review',
  resolved:      'Resolved',
  verified:      'Verified',
}

interface BadgeProps {
  variant?: Variant
  children?: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border leading-none tabular',
        VARIANTS[variant],
        className
      )}
    >
      {children ?? LABELS[variant] ?? variant}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const v = status as Variant
  return <Badge variant={v in VARIANTS ? v : 'default'}>{LABELS[v] ?? status}</Badge>
}
