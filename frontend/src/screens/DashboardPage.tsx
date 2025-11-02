import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, Users, IndianRupee } from 'lucide-react'

import { fetchCustomers } from '../features/customers/customerSlice'
import { fetchLoans, selectLoans } from '../features/loans/loanSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import { LoanStatusBadge } from '../components/loans/LoanStatusBadge'
import { formatCurrencyCompact } from '../lib/currency'

const dueTone = (daysUntilDue: number, status: string) => {
  if (status === 'REDEEMED') return 'text-emerald-600'
  if (status === 'DEFAULTED') return 'text-slate-600'
  if (daysUntilDue < 0) return 'text-red-600'
  if (daysUntilDue <= 7) return 'text-amber-600'
  return 'text-ink/60'
}

export const DashboardPage = () => {
  const dispatch = useAppDispatch()
  const loanState = useAppSelector(selectLoans)

  useEffect(() => {
    if (loanState.status === 'idle') {
      void dispatch(fetchLoans())
    }
    // always ensure customers cached for other sections
    void dispatch(fetchCustomers())
  }, [dispatch, loanState.status])
  const greeting = useMemo(() => {
    const currentHour = new Date().getHours()
    if (currentHour < 12) return 'Good morning'
    if (currentHour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const metrics = useMemo(() => {
    const activeLoans = loanState.items.filter((loan) => loan.status === 'ACTIVE' || loan.status === 'LATE')
    const portfolioValue = activeLoans.reduce((total, loan) => total + loan.principal, 0)
    const dueSoon = activeLoans.filter((loan) => loan.daysUntilDue <= 7)
    const totalCustomers = loanState.items.reduce((unique, loan) => {
      unique.add(loan.customerId)
      return unique
    }, new Set()).size

    return {
      activeCount: activeLoans.length,
      portfolioValue,
      dueSoonCount: dueSoon.length,
      customerCount: totalCustomers,
    }
  }, [loanState.items])

  const topLoans = useMemo(
    () =>
      [...loanState.items]
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5),
    [loanState.items],
  )

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-gold-300/30 via-white to-gold-100/40 p-6 shadow-card sm:p-8">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          {greeting}, Sivakumar
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          Monitor loan performance, upcoming maturities, and relationship insights at a glance. All data reflects the most recent activity across your pawn operations.
        </p>
        <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div 
            className="rounded-2xl border border-gold-200 bg-white/80 p-4 text-ink shadow-sm sm:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            whileHover={{ y: -3 }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="text-gold-600" size={20} />
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Active Loans</p>
            </div>
            <p className="mt-3 text-2xl font-bold text-gold-600 sm:text-3xl">{metrics.activeCount}</p>
            <p className="mt-2 text-xs text-ink/60">Including late accounts</p>
          </motion.div>
          
          <motion.div 
            className="rounded-2xl border border-gold-200 bg-white/80 p-4 text-ink shadow-sm sm:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ y: -3 }}
          >
            <div className="flex items-center gap-2">
              <IndianRupee className="text-gold-600" size={20} />
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Total Principal Amount</p>
            </div>
            <p className="mt-3 text-2xl font-bold text-gold-600 sm:text-3xl">
              {formatCurrencyCompact(metrics.portfolioValue)}
            </p>
            <p className="mt-2 text-xs text-ink/60">Principal outstanding</p>
          </motion.div>
          
          <motion.div 
            className="rounded-2xl border border-gold-200 bg-white/80 p-4 text-ink shadow-sm sm:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ y: -3 }}
          >
            <div className="flex items-center gap-2">
              <Users className="text-gold-600" size={20} />
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Total Customers</p>
            </div>
            <p className="mt-3 text-2xl font-bold text-gold-600 sm:text-3xl">{metrics.customerCount}</p>
            <p className="mt-2 text-xs text-ink/60">All customers in system</p>
          </motion.div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <motion.div 
          className="lg:col-span-2 rounded-2xl border border-gold-200 bg-white/80 p-4 shadow-sm sm:p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-display text-xl text-ink">Upcoming maturities</h2>
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">
              {loanState.items.length} total loans
            </span>
          </div>
          {loanState.status === 'loading' && (
            <p className="mt-3 text-xs text-ink/60">Loading latest loan activity…</p>
          )}
          {loanState.error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loanState.error}
            </p>
          )}
          {/* Mobile Card Layout */}
          <div className="mt-4 space-y-3 sm:hidden">
            {topLoans.map((loan, index) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                className="rounded-xl border border-gold-100 bg-white/80 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link to={`/loans/${loan.id}`} className="font-semibold text-ink hover:text-gold-600 transition-colors">
                      {loan.customer.firstName} {loan.customer.lastName}
                    </Link>
                    <p className="text-xs text-ink/60 mt-1">{loan.itemDescription}</p>
                  </div>
                  <LoanStatusBadge status={loan.status} daysUntilDue={loan.daysUntilDue} />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gold-100">
                  <div>
                    <p className="text-xs text-ink/60">Principal</p>
                    <p className="font-semibold text-gold-700">{formatCurrencyCompact(loan.principal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink/60">Due Date</p>
                    <p className={`text-xs font-medium ${dueTone(loan.daysUntilDue, loan.status)}`}>
                      {new Date(loan.dueDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {!topLoans.length && (
              <div className="rounded-xl border border-gold-100 bg-white/80 p-8 text-center">
                <p className="text-sm text-ink/60">
                  No loans yet — record your first pawn loan to populate the dashboard.
                </p>
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-gold-100 hidden sm:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gold-100 text-sm text-ink/80">
                <thead className="bg-cream/80 text-left text-xs font-semibold uppercase tracking-wide text-ink/60">
                  <tr>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Customer</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Principal</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Due date</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-50 bg-white/60">
                  {topLoans.map((loan, index) => (
                    <motion.tr 
                      key={loan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                      className="hover:bg-gold-50/50 transition-colors duration-200"
                    >
                      <td className="px-3 py-3 sm:px-4 sm:py-4">
                        <div className="font-semibold text-ink">
                          <Link to={`/loans/${loan.id}`} className="hover:text-gold-600 transition-colors duration-200">
                            {loan.customer.firstName} {loan.customer.lastName}
                          </Link>
                        </div>
                        <div className="text-xs text-ink/60">{loan.itemDescription}</div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4 font-semibold text-gold-700">
                        {formatCurrencyCompact(loan.principal)}
                      </td>
                      <td className={`px-3 py-3 sm:px-4 sm:py-4 text-xs ${dueTone(loan.daysUntilDue, loan.status)}`}>
                        {new Date(loan.dueDate).toLocaleDateString('en-GB')} ({
                          loan.daysUntilDue >= 0
                            ? `${loan.daysUntilDue} days`
                            : `${Math.abs(loan.daysUntilDue)} days late`
                        })
                      </td>
                      <td className="px-3 py-3 sm:px-4 sm:py-4">
                        <LoanStatusBadge status={loan.status} daysUntilDue={loan.daysUntilDue} />
                      </td>
                    </motion.tr>
                  ))}
                  {!topLoans.length && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink/60">
                        No loans yet — record your first pawn loan to populate the dashboard.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="rounded-2xl border border-gold-200 bg-white/80 p-4 shadow-sm sm:p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="font-display text-xl text-ink">Loan health snapshot</h2>
          <p className="mt-2 text-sm text-ink/70">
            Use these quick stats to prioritise outreach, renewals, and redemption offers.
          </p>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-gold-100 bg-cream/70 px-3 py-2 sm:px-4 sm:py-3">
              <dt className="font-semibold text-ink">Current yield</dt>
              <dd className="text-gold-600">
                {loanState.items.length
                  ? `${(
                      (loanState.items.reduce((total, loan) => total + loan.principal * loan.interestRate, 0) /
                        Math.max(metrics.portfolioValue, 1)) *
                      100
                    ).toFixed(1)}%`
                  : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gold-100 bg-cream/70 px-3 py-2 sm:px-4 sm:py-3">
              <dt className="font-semibold text-ink">Late accounts</dt>
              <dd className="text-red-600">
                {loanState.items.filter((loan) => loan.status === 'LATE').length}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gold-100 bg-cream/70 px-3 py-2 sm:px-4 sm:py-3">
              <dt className="font-semibold text-ink">Redeemed YTD</dt>
              <dd className="text-emerald-600">
                {loanState.items.filter((loan) => loan.status === 'REDEEMED').length}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gold-100 bg-cream/70 px-3 py-2 sm:px-4 sm:py-3">
              <dt className="font-semibold text-ink">Defaulted YTD</dt>
              <dd className="text-slate-600">
                {loanState.items.filter((loan) => loan.status === 'DEFAULTED').length}
              </dd>
            </div>
          </dl>
        </motion.div>
      </section>
    </div>
  )
}

