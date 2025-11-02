import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import {
  clearSelectedLoan,
  fetchLoanById,
  selectLoans,
} from '../features/loans/loanSlice'
import { selectRepaymentsState, fetchRepaymentsByLoan } from '../features/repayments/repaymentsSlice'
import { LoanStatusBadge } from '../components/loans/LoanStatusBadge'
import { useAppDispatch, useAppSelector } from '../hooks'

import { formatCurrencyPrecise } from '../lib/currency'

const dueTone = (daysUntilDue: number, status: string) => {
  if (status === 'REDEEMED') return 'text-emerald-600'
  if (status === 'DEFAULTED') return 'text-slate-600'
  if (daysUntilDue < 0) return 'text-red-600'
  if (daysUntilDue <= 7) return 'text-amber-600'
  return 'text-ink/70'
}

export const LoanDetailPage = () => {
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const loanState = useAppSelector(selectLoans)
  const repaymentState = useAppSelector(selectRepaymentsState)
  const loan = useMemo(
    () => loanState.items.find((item) => item.id === id) ?? loanState.selectedLoan,
    [loanState.items, loanState.selectedLoan, id],
  )
  const repayments = id ? repaymentState.byLoanId[id] ?? [] : []

  useEffect(() => {
    if (!id) return
    void dispatch(fetchLoanById(id))
    void dispatch(fetchRepaymentsByLoan(id))
    return () => {
      dispatch(clearSelectedLoan())
    }
  }, [dispatch, id])

  if (!id) {
    return <p className="text-sm text-red-600">Loan id missing in route.</p>
  }

  if (loanState.status === 'loading' && !loan) {
    return <p className="text-sm text-ink/60">Loading loan details…</p>
  }

  if (!loan) {
    return <p className="text-sm text-red-600">Loan not found.</p>
  }

  const totalInterestProjected = loan.principal * loan.interestRate
  const totalPaid = loan.totalRepaid
  const outstanding = loan.outstandingBalance

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl border border-gold-200 bg-white/85 p-6 shadow-card sm:rounded-3xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-ink sm:text-3xl">Loan #{loan.id.slice(-6)}</h1>
            <p className="mt-1 text-sm text-ink/70">
              {loan.customer.firstName} {loan.customer.lastName} · {loan.customer.email}
            </p>
            <p className={`text-xs uppercase tracking-wide ${dueTone(loan.daysUntilDue, loan.status)}`}>
              Due {new Date(loan.dueDate).toLocaleDateString()} ({
                loan.daysUntilDue >= 0
                  ? `${loan.daysUntilDue} days remaining`
                  : `${Math.abs(loan.daysUntilDue)} days overdue`
              })
            </p>
          </div>
          <LoanStatusBadge status={loan.status} daysUntilDue={loan.daysUntilDue} />
        </div>

        <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gold-200 bg-cream/70 px-3 py-2 text-sm sm:px-4 sm:py-3">
            <p className="text-xs font-semibold uppercase text-ink/60">Principal</p>
            <p className="mt-1 text-base font-bold text-ink sm:mt-2 sm:text-lg">{formatCurrencyPrecise(loan.principal)}</p>
          </div>
          <div className="rounded-2xl border border-gold-200 bg-cream/70 px-3 py-2 text-sm sm:px-4 sm:py-3">
            <p className="text-xs font-semibold uppercase text-ink/60">Projected interest</p>
            <p className="mt-1 text-base font-bold text-ink sm:mt-2 sm:text-lg">{formatCurrencyPrecise(totalInterestProjected)}</p>
          </div>
          <div className="rounded-2xl border border-gold-200 bg-cream/70 px-3 py-2 text-sm sm:px-4 sm:py-3">
            <p className="text-xs font-semibold uppercase text-ink/60">Total paid</p>
            <p className="mt-1 text-base font-bold text-emerald-600 sm:mt-2 sm:text-lg">{formatCurrencyPrecise(totalPaid)}</p>
          </div>
          <div className="rounded-2xl border border-gold-200 bg-cream/70 px-3 py-2 text-sm sm:px-4 sm:py-3">
            <p className="text-xs font-semibold uppercase text-ink/60">Outstanding</p>
            <p className={`mt-1 text-base font-bold sm:mt-2 sm:text-lg ${outstanding === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrencyPrecise(outstanding)}
            </p>
          </div>
        </div>

        {loan.notes && (
          <div className="mt-3 rounded-xl border border-gold-100 bg-cream/60 px-3 py-2 text-sm text-ink/70 sm:mt-4 sm:px-4 sm:py-3">
            <p className="font-semibold text-ink">Notes</p>
            <p>{loan.notes}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gold-200 bg-white/85 p-6 shadow-card sm:rounded-3xl sm:p-8">
        <h2 className="font-display text-xl text-ink">Payment history</h2>
        {repaymentState.status === 'loading' && !repayments.length ? (
          <p className="mt-3 text-sm text-ink/60">Loading repayments…</p>
        ) : null}
        <div className="mt-4 overflow-hidden rounded-2xl border border-gold-100">
          <table className="min-w-full divide-y divide-gold-100 text-sm text-ink/80">
            <thead className="bg-cream/80 text-left text-xs font-semibold uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Date</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Amount</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Method</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Reference</th>
                <th className="px-3 py-2 sm:px-4 sm:py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-50 bg-white/60">
              {repayments.map((repayment) => (
                <tr key={repayment.id}>
                  <td className="px-3 py-2 text-xs text-ink/60 sm:px-4 sm:py-3">
                    {new Date(repayment.paidAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-semibold text-gold-700 sm:px-4 sm:py-3">
                    {formatCurrencyPrecise(repayment.amount)}
                  </td>
                  <td className="px-3 py-2 capitalize sm:px-4 sm:py-3">{repayment.method}</td>
                  <td className="px-3 py-2 text-xs sm:px-4 sm:py-3">{repayment.reference ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-ink/70 sm:px-4 sm:py-3">{repayment.notes ?? '—'}</td>
                </tr>
              ))}
              {!repayments.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-ink/60 sm:px-4 sm:py-8">
                    No repayments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

