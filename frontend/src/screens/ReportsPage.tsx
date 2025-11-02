import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, BarChart3, TrendingUp, Calendar, CalendarDays, CalendarRange } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'

import { useAppDispatch } from '../hooks'
import { fetchReportData } from '../features/loans/loanSlice'
import type { ReportData } from '../features/loans/types'
import { formatCurrencyPrecise } from '../lib/currency'
import { PageTransition } from '../components/animations/PageTransition'
import { AnimatedCard, MetricCard } from '../components/animations/AnimatedCard'
import { AnimatedButton } from '../components/animations/AnimatedButton'
import { apiClient } from '../lib/apiClient'

type ReportType = 'daily' | 'monthly' | 'yearly'

interface DetailedReportData {
  customer_id: string
  loan_id: string
  start_date: string
  name: string
  phone: string
  item: string
  amount: number
  due_date: string
  interest_amount: number
  total_amount: number
}

export const ReportsPage = () => {
  const dispatch = useAppDispatch()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [detailedReports, setDetailedReports] = useState<DetailedReportData[]>([])
  const [activeTab, setActiveTab] = useState<ReportType>('monthly')
  const [loading, setLoading] = useState(true)
  const [detailedLoading, setDetailedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch summary report data
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        setError(null)
        const action = await dispatch(fetchReportData())
        if (fetchReportData.fulfilled.match(action)) {
          setReportData(action.payload)
        } else {
          setError('Failed to load report data')
        }
      } catch (error) {
        console.error('Failed to fetch report data:', error)
        setError('Failed to load report data')
      } finally {
        setLoading(false)
      }
    }

    void fetchReport()
  }, [dispatch])

  // Fetch detailed reports when tab changes
  useEffect(() => {
    const fetchDetailedReports = async () => {
      try {
        setDetailedLoading(true)
        const response = await apiClient.get<{ reports: DetailedReportData[] }>(`/reports?type=${activeTab}`)
        setDetailedReports(response.data.reports)
      } catch (error) {
        console.error('Failed to fetch detailed reports:', error)
        setDetailedReports([])
      } finally {
        setDetailedLoading(false)
      }
    }

    void fetchDetailedReports()
  }, [activeTab])

  const exportToExcel = async () => {
    try {
      toast.loading('Generating Excel report...', { id: 'excel-export' })

      const response = await apiClient.get(`/reports/export?type=${activeTab}`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      saveAs(blob, `report-${activeTab}.xlsx`)
      toast.success(`${getTabLabel(activeTab)} exported successfully!`, { id: 'excel-export' })
    } catch (error) {
      console.error('Failed to export Excel:', error)
      toast.error('Server export failed, generating locally...', { id: 'excel-export' })
      // Fallback to client-side Excel generation
      exportToExcelFallback()
    }
  }

  const exportToExcelFallback = () => {
    if (detailedReports.length === 0) {
      toast.error('No data available to export')
      return
    }

    try {
      const ws = XLSX.utils.json_to_sheet(detailedReports.map(report => ({
        'Customer ID': report.customer_id,
        'Loan ID': report.loan_id,
        'Start Date': report.start_date,
        'Name': report.name,
        'Item': report.item,
        'Amount (₹)': report.amount,
        'Phone': report.phone,
        'Due Date': report.due_date,
        'Interest (₹)': report.interest_amount,
        'Total Amount (₹)': report.total_amount
      })))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Loans Report')
      XLSX.writeFile(wb, `report-${activeTab}.xlsx`)
      toast.success(`${getTabLabel(activeTab)} exported successfully!`)
    } catch (error) {
      toast.error('Failed to export Excel file')
      console.error('Excel export error:', error)
    }
  }

  const getTabIcon = (type: ReportType) => {
    switch (type) {
      case 'daily': return <Calendar size={16} />
      case 'monthly': return <CalendarDays size={16} />
      case 'yearly': return <CalendarRange size={16} />
    }
  }

  const getTabLabel = (type: ReportType) => {
    switch (type) {
      case 'daily': return 'Daily Report'
      case 'monthly': return 'Monthly Report'
      case 'yearly': return 'Yearly Report'
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex h-64 items-center justify-center">
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="h-8 w-8 rounded-full border-4 border-gold-500 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="mt-4 text-lg text-ink dark:text-gray-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Loading report data...
            </motion.div>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <div className="flex h-64 items-center justify-center">
          <motion.div
            className="rounded-lg bg-red-50 p-6 text-center dark:bg-red-900/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-lg font-medium text-red-800 dark:text-red-200">{error}</div>
            <AnimatedButton
              variant="danger"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Retry
            </AnimatedButton>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  if (!reportData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg text-ink dark:text-gray-200">No data available for report</div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Summary Cards */}
        <AnimatedCard delay={0.1} className="rounded-3xl p-10">
          <motion.div
            className="flex flex-col justify-between gap-4 md:flex-row md:items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div>
              <h1 className="font-display text-3xl text-ink dark:text-white flex items-center gap-2">
                <BarChart3 className="text-gold-600" size={32} />
                Reports Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-ink/70 dark:text-gray-300">
                Financial overview and detailed loan reports
              </p>
            </div>
          </motion.div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={<FileText size={20} />}
              title="Total Loans"
              value={reportData.totalLoans}
              subtitle="All loans in system"
              delay={0.4}
              color="blue"
            />

            <MetricCard
              icon={<TrendingUp size={20} />}
              title="Total Principal"
              value={formatCurrencyPrecise(reportData.totalPrincipal)}
              subtitle="Principal amount"
              delay={0.5}
              color="gold"
            />

            <MetricCard
              icon={<BarChart3 size={20} />}
              title="Interest Earned"
              value={formatCurrencyPrecise(reportData.totalInterestEarned)}
              subtitle="Total interest"
              delay={0.6}
              color="emerald"
            />

            <MetricCard
              icon={<FileText size={20} />}
              title="Pending Loans"
              value={reportData.pendingLoans}
              subtitle="Awaiting payment"
              delay={0.7}
              color="red"
            />
          </div>
        </AnimatedCard>

        {/* Detailed Reports */}
        <AnimatedCard delay={0.3} className="rounded-3xl p-10">
          <motion.div
            className="flex flex-col justify-between gap-4 md:flex-row md:items-center mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div>
              <h2 className="font-display text-2xl text-ink dark:text-white flex items-center gap-2">
                <FileText className="text-gold-600" size={28} />
                Detailed Reports
              </h2>
              <p className="mt-1 text-sm text-ink/70 dark:text-gray-300">
                View and export detailed loan information
              </p>
            </div>
            <AnimatedButton
              onClick={exportToExcel}
              className="flex items-center gap-2"
              disabled={detailedReports.length === 0}
            >
              <Download size={16} />
              Export Excel
            </AnimatedButton>
          </motion.div>

          {/* Tabs */}
          <motion.div
            className="flex space-x-1 rounded-xl bg-gold-100 p-1 dark:bg-gray-700 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {(['daily', 'monthly', 'yearly'] as ReportType[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${activeTab === type
                  ? 'bg-white text-gold-600 shadow-sm dark:bg-gray-600 dark:text-gold-400'
                  : 'text-gold-700 hover:text-gold-600 dark:text-gray-300 dark:hover:text-gold-400'
                  }`}
              >
                {getTabIcon(type)}
                {getTabLabel(type)}
              </button>
            ))}
          </motion.div>

          {/* Report Summary */}
          {detailedReports.length > 0 && !detailedLoading && (
            <motion.div
              className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
            >
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="text-sm text-blue-600 dark:text-blue-400">Total Records</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{detailedReports.length}</div>
              </div>
              <div className="rounded-lg bg-gold-50 p-4 dark:bg-gold-900/20">
                <div className="text-sm text-gold-600 dark:text-gold-400">Total Amount</div>
                <div className="text-2xl font-bold text-gold-700 dark:text-gold-300">
                  {formatCurrencyPrecise(detailedReports.reduce((sum, report) => sum + report.amount, 0))}
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
                <div className="text-sm text-emerald-600 dark:text-emerald-400">Total Interest</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrencyPrecise(detailedReports.reduce((sum, report) => sum + report.interest_amount, 0))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Reports Table */}
          <motion.div
            className="overflow-hidden rounded-xl border border-gold-100 dark:border-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {detailedLoading ? (
              <div className="flex h-32 items-center justify-center">
                <motion.div
                  className="h-6 w-6 rounded-full border-4 border-gold-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : detailedReports.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-ink/70 dark:text-gray-300">
                No loans found for the selected period
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="space-y-3 sm:hidden p-4">
                  {detailedReports.map((report, index) => (
                    <motion.div
                      key={report.loan_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
                      className="rounded-lg border border-gold-100 bg-white p-4 dark:border-gray-600 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-ink dark:text-gray-200">{report.name}</h4>
                          <p className="text-xs text-ink/60 dark:text-gray-400">{report.item}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-ink dark:text-gray-200">{formatCurrencyPrecise(report.total_amount)}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">+{formatCurrencyPrecise(report.interest_amount)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-ink/60 dark:text-gray-400">Principal</p>
                          <p className="font-medium text-gold-600 dark:text-gold-400">{formatCurrencyPrecise(report.amount)}</p>
                        </div>
                        <div>
                          <p className="text-ink/60 dark:text-gray-400">Due Date</p>
                          <p className="font-medium text-ink dark:text-gray-200">{report.due_date}</p>
                        </div>
                        <div>
                          <p className="text-ink/60 dark:text-gray-400">Phone</p>
                          <p className="font-medium text-ink dark:text-gray-200">{report.phone}</p>
                        </div>
                        <div>
                          <p className="text-ink/60 dark:text-gray-400">Start Date</p>
                          <p className="font-medium text-ink dark:text-gray-200">{report.start_date}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="overflow-x-auto hidden sm:block">
                  <table className="w-full">
                    <thead className="bg-gold-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-ink/70 dark:text-gray-300 uppercase tracking-wider">Customer ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-ink/70 dark:text-gray-300 uppercase tracking-wider">Loan ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-ink/70 dark:text-gray-300 uppercase tracking-wider">Start Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-ink/70 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-ink/70 dark:text-gray-300 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-ink/70 dark:text-gray-300 uppercase tracking-wider">Amount (₹)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-ink/70 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-ink/70 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-ink/70 dark:text-gray-300 uppercase tracking-wider">Interest (₹)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-ink/70 dark:text-gray-300 uppercase tracking-wider">Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gold-100 dark:divide-gray-600">
                      {detailedReports.map((report, index) => (
                        <motion.tr
                          key={report.loan_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.05, duration: 0.3 }}
                          className="hover:bg-gold-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <td className="px-4 py-3 text-sm text-ink dark:text-gray-200">{report.customer_id}</td>
                          <td className="px-4 py-3 text-sm text-ink dark:text-gray-200">{report.loan_id}</td>
                          <td className="px-4 py-3 text-sm text-ink dark:text-gray-200">{report.start_date}</td>
                          <td className="px-4 py-3 text-sm font-medium text-ink dark:text-gray-200">{report.name}</td>
                          <td className="px-4 py-3 text-sm text-ink dark:text-gray-200">{report.item}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gold-600 dark:text-gold-400">{formatCurrencyPrecise(report.amount)}</td>
                          <td className="px-4 py-3 text-sm text-ink dark:text-gray-200">{report.phone}</td>
                          <td className="px-4 py-3 text-sm text-ink dark:text-gray-200">{report.due_date}</td>
                          <td className="px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">{formatCurrencyPrecise(report.interest_amount)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-ink dark:text-gray-200">{formatCurrencyPrecise(report.total_amount)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        </AnimatedCard>
      </div>
    </PageTransition>
  )
}