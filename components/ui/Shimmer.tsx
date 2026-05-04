import { cn } from '@/lib/utils'

interface ShimmerProps {
  className?: string
}

export function Shimmer({ className }: ShimmerProps) {
  return <div className={cn('shimmer rounded', className)} aria-hidden="true" />
}

export function TableRowShimmer({ cols = 6 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Shimmer className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function DashboardShimmer() {
  return (
    <div className="flex-1 overflow-hidden" aria-label="Loading…" aria-busy="true">
      <table className="w-full text-sm">
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRowShimmer key={i} cols={6} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
