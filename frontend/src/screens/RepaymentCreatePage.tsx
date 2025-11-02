import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

import { fetchLoans, selectLoans } from '../features/loans/loanSlice'
import { fetchCustomers, selectCustomers } from '../features/customers/customerSlice'
import { createRepayment } from '../features/repayments/repaymentsSlice'
import type { RepaymentFormPayload } from '../features/repayments/types'
import { RepaymentForm } from '../components/repayments/RepaymentForm'
import { useAppDispatch, useAppSelector } from '../hooks'
import { PageTransition } from '../components/animations/PageTransition'
import { AnimatedCard } from '../components/animations/AnimatedCard'
import { sendSMS, generatePaymentSMS } from '../lib/sms'

type Feedback = { type: 'success' | 'error'; message: string } | null

export const RepaymentCreatePage = () => {
  const dispatch = useAppDispatch()
  const loanState = useAppSelector(selectLoans)
  const customerState = useAppSelector(selectCustomers)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    if (loanState.status === 'idle') {
      void dispatch(fetchLoans())
    }
    if (customerState.status === 'idle') {
      void dispatch(fetchCustomers())
    }
  }, [dispatch, loanState.status, customerState.status])

  const activeLoans = useMemo(
    () => loanState.items.filter((loan) => loan.status !== 'REDEEMED'),
    [loanState.items],
  )

  const handleSubmit = async (payload: RepaymentFormPayload) => {
    try {
      await dispatch(createRepayment(payload)).unwrap()
      
      // Find the loan and customer for SMS
      const loan = activeLoans.find(l => l.id === payload.loanId)
      const customer = customerState.items.find(c => c.id === loan?.customerId)
      
      if (customer && customer.phone && loan) {
        // Send payment confirmation SMS
        try {
          const paymentMessage = generatePaymentSMS(
            `${customer.firstName} ${customer.lastName}`,
            payload.amount,
            new Date().toLocaleDateString('en-GB')
          )
          
          const smsResult = await sendSMS({
            to: customer.phone,
            message: paymentMessage
          })
          
          if (smsResult.success) {
            setFeedback({ 
              type: 'success', 
              message: `✅ Payment recorded successfully! 📩 SMS sent to ${customer.firstName} ${customer.lastName}.` 
            })
          } else {
            setFeedback({ 
              type: 'success', 
              message: `✅ Payment recorded successfully! ⚠️ SMS failed: ${smsResult.message}` 
            })
          }
        } catch (smsError) {
          setFeedback({ 
            type: 'success', 
            message: '✅ Payment recorded successfully! ⚠️ SMS service unavailable.' 
          })
        }
      } else {
        setFeedback({ type: 'success', message: '✅ Payment recorded successfully!' })
      }
      
      // Clear feedback after 5 seconds
      setTimeout(() => setFeedback(null), 5000)
    } catch (error) {
      setFeedback({ type: 'error', message: String(error) })
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8">
        <AnimatedCard delay={0.1} className="sm:rounded-3xl sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="font-display text-2xl text-ink sm:text-3xl flex items-center gap-2">
              <CreditCard className="text-gold-600" size={28} />
              Record a repayment
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink/70">
              Track customer payments against outstanding pawn loans. Balances update automatically and overdue accounts trigger alerts across the dashboard.
            </p>
          </motion.div>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={`mt-4 rounded-xl border px-3 py-2 text-sm sm:mt-6 sm:px-4 sm:py-3 flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle size={16} className="flex-shrink-0" />
                ) : (
                  <AlertCircle size={16} className="flex-shrink-0" />
                )}
                <span>{feedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            className="mt-4 rounded-2xl border border-gold-100 bg-cream/80 p-4 shadow-inner sm:mt-8 sm:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <RepaymentForm
              loans={activeLoans}
              customers={customerState.items}
              onSubmit={handleSubmit}
              isSubmitting={loanState.status === 'loading'}
              clearOnSuccess={feedback?.type === 'success'}
            />
            {!activeLoans.length && loanState.status === 'succeeded' && (
              <motion.p 
                className="mt-3 text-xs text-ink/60 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                All loans are redeemed — create a new loan before recording repayments.
              </motion.p>
            )}
          </motion.div>
        </AnimatedCard>
      </div>
    </PageTransition>
  )
}

