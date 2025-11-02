import type { LoanStatus } from '../../features/loans/types'

const baseStyles: Record<LoanStatus, string> = {
  ACTIVE: 'bg-gold-100 text-gold-700 border border-gold-300',
  LATE: 'bg-red-100 text-red-700 border border-red-200',
  REDEEMED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  DEFAULTED: 'bg-slate-200 text-slate-700 border border-slate-300',
}

interface LoanStatusBadgeProps {
  status: LoanStatus
  daysUntilDue?: number
}

export const LoanStatusBadge = ({ status, daysUntilDue }: LoanStatusBadgeProps) => {
  let styles = baseStyles[status]
  if (status === 'ACTIVE' && typeof daysUntilDue === 'number') {
    if (daysUntilDue < 0) {
      styles = 'bg-red-100 text-red-700 border border-red-200'
    } else if (daysUntilDue <= 7) {
      styles = 'bg-amber-100 text-amber-700 border border-amber-200'
    }
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles}`}>
      {status === 'ACTIVE'
        ? daysUntilDue !== undefined && daysUntilDue <= 7
          ? daysUntilDue < 0
            ? 'Overdue'
            : 'Due soon'
          : 'Active'
        : status === 'LATE'
          ? 'Late'
          : status === 'REDEEMED'
            ? 'Redeemed'
            : 'Defaulted'}
    </span>
  )
}

