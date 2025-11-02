import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit, Trash2, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  selectCustomers,
  updateCustomer,
} from '../features/customers/customerSlice'
import type { Customer, UpsertCustomerPayload } from '../features/customers/types'
import { useAppDispatch, useAppSelector } from '../hooks'
import { CustomerForm } from '../components/customers/CustomerForm'
import { PageTransition } from '../components/animations/PageTransition'
import { AnimatedCard, AnimatedTable, AnimatedTableRow } from '../components/animations/AnimatedCard'
import { AnimatedButton } from '../components/animations/AnimatedButton'
import { sendSMS, generateWelcomeSMS } from '../lib/sms'

type Feedback = { type: 'success' | 'error'; message: string } | null

export const CustomersPage = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { items, status, error } = useAppSelector(selectCustomers)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchCustomers())
    }
  }, [dispatch, status])

  useEffect(() => {
    if (error) {
      setFeedback({ type: 'error', message: error })
    }
  }, [error])

  const handleCreate = async (values: UpsertCustomerPayload) => {
    try {
      await dispatch(createCustomer(values)).unwrap()
      
      // Send welcome SMS
      try {
        const welcomeMessage = generateWelcomeSMS(`${values.firstName} ${values.lastName}`)
        const smsResult = await sendSMS({
          to: values.phone,
          message: welcomeMessage
        })
        
        if (smsResult.success) {
          setFeedback({ 
            type: 'success', 
            message: `✅ Customer added successfully! 📩 Welcome SMS sent to ${values.firstName}.` 
          })
        } else {
          setFeedback({ 
            type: 'success', 
            message: `✅ Customer added successfully! ⚠️ SMS failed: ${smsResult.message}` 
          })
        }
      } catch (smsError) {
        setFeedback({ 
          type: 'success', 
          message: '✅ Customer added successfully! ⚠️ SMS service unavailable.' 
        })
      }
      
      // Clear feedback after 5 seconds
      setTimeout(() => setFeedback(null), 5000)
    } catch (err) {
      setFeedback({ type: 'error', message: String(err) })
    }
  }

  const handleUpdate = async (values: UpsertCustomerPayload) => {
    if (!editing) return
    try {
      await dispatch(updateCustomer({ id: editing.id, changes: values })).unwrap()
      setEditing(null)
      setFeedback({ type: 'success', message: '✅ Customer updated successfully!' })
      setTimeout(() => setFeedback(null), 3000)
    } catch (err) {
      setFeedback({ type: 'error', message: String(err) })
    }
  }

  const handleDelete = async (customer: Customer) => {
    const confirm = window.confirm(
      `Delete customer ${customer.firstName} ${customer.lastName}? This cannot be undone.`,
    )
    if (!confirm) return
    try {
      await dispatch(deleteCustomer(customer.id)).unwrap()
      setFeedback({ type: 'success', message: '✅ Customer deleted successfully!' })
      setTimeout(() => setFeedback(null), 3000)
    } catch (err) {
      setFeedback({ type: 'error', message: String(err) })
    }
  }

  const sortedCustomers = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [items],
  )

  return (
    <PageTransition>
      <div className="space-y-8 sm:space-y-10">
        <AnimatedCard delay={0.1} className="sm:rounded-3xl sm:p-8">
          <motion.div 
            className="flex flex-wrap items-end justify-between gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div>
              <motion.h1 
                className="font-display text-2xl text-ink sm:text-3xl flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Users className="text-gold-600" size={28} />
                {t('customersPage.title')}
              </motion.h1>
              <motion.p 
                className="mt-2 max-w-2xl text-sm text-ink/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {t('customersPage.description')}
              </motion.p>
            </div>
            <motion.span 
              className="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700 sm:px-4 sm:py-1 flex items-center gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4, type: 'spring' }}
            >
              <Users size={14} />
              {items.length} {t('customersPage.customers')}
            </motion.span>
          </motion.div>

          <motion.div 
            className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <motion.div 
              className="rounded-2xl border border-gold-200 bg-cream/80 p-4 shadow-inner sm:p-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <h2 className="text-lg font-semibold text-ink">{t('customersPage.addCustomer')}</h2>
              <p className="mb-4 mt-1 text-xs uppercase tracking-wide text-ink/60">
                {t('customersPage.addCustomerDesc')}
              </p>
              <CustomerForm 
                onSubmit={handleCreate} 
                isSubmitting={status === 'loading'} 
                submitLabel="Save customer"
                clearOnSuccess={feedback?.type === 'success'}
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div 
                  key="editing"
                  className="rounded-2xl border border-gold-300 bg-white/90 p-4 shadow-card sm:p-6"
                  initial={{ opacity: 0, x: 30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                    <Edit size={20} className="text-gold-600" />
                    Edit {editing.firstName} {editing.lastName}
                  </h2>
                  <p className="mb-4 mt-1 text-xs uppercase tracking-wide text-ink/60">
                    Update contact information below.
                  </p>
                  <CustomerForm
                    defaultValues={editing}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditing(null)}
                    isSubmitting={status === 'loading'}
                    submitLabel="Update customer"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  className="rounded-2xl border border-dashed border-gold-200 bg-white/60 p-4 text-sm text-ink/60 sm:p-6"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <p className="font-semibold text-ink">Need to edit an existing customer?</p>
                  <p className="mt-1">
                    Choose a record in the table and select <span className="font-semibold">Edit</span>.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
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
        </AnimatedCard>

        <AnimatedCard delay={0.9} className="sm:rounded-3xl sm:p-8">
          <motion.div 
            className="flex flex-wrap items-center justify-between gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <h2 className="font-display text-xl text-ink sm:text-2xl flex items-center gap-2">
              <Users className="text-gold-600" size={24} />
              All customers
            </h2>
            {status === 'loading' && (
              <motion.span 
                className="text-sm text-ink/60 flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="h-3 w-3 rounded-full border-2 border-gold-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Refreshing…
              </motion.span>
            )}
          </motion.div>
          
          <AnimatedTable className="mt-4">
            <table className="min-w-full divide-y divide-gold-100">
              <thead className="bg-cream/80 text-left text-xs font-semibold uppercase tracking-wide text-ink/60">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Customer</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Contact</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Created</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-50 bg-white/60 text-sm text-ink/80">
                {sortedCustomers.map((customer, index) => (
                  <AnimatedTableRow key={customer.id} delay={1.1 + index * 0.05}>
                    <td className="px-3 py-3 sm:px-4 sm:py-4">
                      <div className="font-semibold text-ink">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-xs text-ink/60">#{customer.id.slice(-6)}</div>
                    </td>
                    <td className="px-3 py-3 sm:px-4 sm:py-4">
                      <div>{customer.email || 'No email'}</div>
                      <div className="text-xs text-ink/60">📞 {customer.phone}</div>
                    </td>
                    <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs text-ink/60">
                      {new Date(customer.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <AnimatedButton
                          size="sm"
                          variant="secondary"
                          className="flex items-center gap-1 !px-2 !py-1 sm:!px-3 sm:!py-1"
                          onClick={() => setEditing(customer)}
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" /> 
                          <span className="hidden sm:inline">Edit</span>
                        </AnimatedButton>
                        <AnimatedButton
                          size="sm"
                          variant="danger"
                          className="flex items-center gap-1 !px-2 !py-1 sm:!px-3 sm:!py-1"
                          onClick={() => handleDelete(customer)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" /> 
                          <span className="hidden sm:inline">Delete</span>
                        </AnimatedButton>
                      </div>
                    </td>
                  </AnimatedTableRow>
                ))}
                {!sortedCustomers.length && (
                  <AnimatedTableRow delay={1.1}>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink/60">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <Users size={32} className="text-ink/30" />
                        <span>No customers yet — add your first client to get started.</span>
                      </motion.div>
                    </td>
                  </AnimatedTableRow>
                )}
              </tbody>
            </table>
          </AnimatedTable>
        </AnimatedCard>
      </div>
    </PageTransition>
  )
}

