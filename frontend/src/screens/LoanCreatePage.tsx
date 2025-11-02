import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { fetchCustomers, selectCustomers } from '../features/customers/customerSlice'
import { selectLoans, createLoan } from '../features/loans/loanSlice'
import type { CreateLoanPayload } from '../features/loans/types'
import { useAppDispatch, useAppSelector } from '../hooks'
import { LoanForm } from '../components/loans/LoanForm'
import { sendSMS, generateLoanSMS } from '../lib/sms'

type Feedback = { type: 'success' | 'error'; message: string } | null

export const LoanCreatePage = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const customerState = useAppSelector(selectCustomers)
  const loanState = useAppSelector(selectLoans)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    if (customerState.status === 'idle') {
      void dispatch(fetchCustomers())
    }
  }, [dispatch, customerState.status])

  const handleSubmit = async (values: CreateLoanPayload) => {
    try {
      setFeedback(null)
      await dispatch(createLoan(values)).unwrap()
      
      // Find the customer for SMS
      const customer = customerState.items.find(c => c.id === values.customerId)
      
      if (customer && customer.phone) {
        // Send SMS notification
        const smsMessage = generateLoanSMS(
          `${customer.firstName} ${customer.lastName}`,
          values.principal,
          new Date().toLocaleDateString('en-GB')
        )
        
        try {
          const smsResult = await sendSMS({
            to: customer.phone,
            message: smsMessage
          })
          
          if (smsResult.success) {
            setFeedback({ 
              type: 'success', 
              message: `✅ Loan created successfully! 📩 SMS sent to ${customer.firstName} ${customer.lastName}.` 
            })
          } else {
            setFeedback({ 
              type: 'success', 
              message: `✅ Loan created successfully! ⚠️ SMS failed: ${smsResult.message}` 
            })
          }
        } catch (smsError) {
          setFeedback({ 
            type: 'success', 
            message: '✅ Loan created successfully! ⚠️ SMS service unavailable.' 
          })
        }
      } else {
        setFeedback({ type: 'success', message: '✅ Loan created successfully!' })
      }
      
      // Clear form after success (this will be handled by the form component)
    } catch (err) {
      setFeedback({ type: 'error', message: String(err) })
    }
  }

  return (
    <motion.div 
      className="space-y-6 sm:space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="rounded-2xl border border-gold-200 bg-white/85 p-6 shadow-card dark:border-gray-700 dark:bg-gray-800/85 sm:rounded-3xl sm:p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="font-display text-2xl text-ink dark:text-white sm:text-3xl">{t('loanCreatePage.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/70 dark:text-gray-300">
            {t('loanCreatePage.description')}
          </p>
        </motion.div>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`mt-4 rounded-xl border px-3 py-2 text-sm sm:mt-6 sm:px-4 sm:py-3 flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle size={16} className="flex-shrink-0" />
            ) : (
              <MessageSquare size={16} className="flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </motion.div>
        )}

        <motion.div 
          className="mt-4 rounded-2xl border border-gold-100 bg-cream/80 p-4 shadow-inner dark:border-gray-700 dark:bg-gray-700/50 sm:mt-8 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <LoanForm
            customers={customerState.items}
            onSubmit={handleSubmit}
            isSubmitting={loanState.status === 'loading'}
            clearOnSuccess={feedback?.type === 'success'}
          />
          {customerState.status === 'loading' && (
            <motion.div 
              className="mt-3 flex items-center text-xs text-ink/60 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="mr-2 h-3 w-3 animate-spin rounded-full border border-gold-500 border-t-transparent"></div>
              {t('loanCreatePage.loadingCustomers')}
            </motion.div>
          )}
          {!customerState.items.length && customerState.status === 'succeeded' && (
            <motion.p 
              className="mt-3 text-xs text-ink/60 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {t('loanCreatePage.addCustomerFirst')}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
