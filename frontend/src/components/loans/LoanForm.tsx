import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Search, User, IndianRupee, Calendar, FileText } from 'lucide-react'

import type { Customer } from '../../features/customers/types'
import type { CreateLoanPayload } from '../../features/loans/types'

interface LoanFormProps {
  customers: Customer[]
  defaultValues?: Partial<CreateLoanPayload>
  isSubmitting?: boolean
  clearOnSuccess?: boolean
  onSubmit: (values: CreateLoanPayload) => void
  onSuccess?: () => void
}

export const LoanForm = ({ customers, defaultValues, isSubmitting = false, clearOnSuccess = false, onSubmit, onSuccess }: LoanFormProps) => {
  const { t } = useTranslation()
  
  const schema = z.object({
    customerId: z.string().min(1, t('loan.customerRequired')),
    itemDescription: z.string().min(1, t('loan.itemDescriptionRequired')),
    principal: z
      .number({ invalid_type_error: t('loan.principalRequired') })
      .positive(t('loan.principalPositive')),
    interestRate: z
      .number({ invalid_type_error: t('loan.interestRateRequired') })
      .min(0, t('loan.interestRateInvalid'))
      .max(100, t('loan.interestRateMax'))
      .int(t('loan.interestRateWhole')),
    startDate: z.string().optional(),
    notes: z.string().max(500, t('loan.notesMaxLength')).optional(),
  })

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      interestRate: 3, // Default to 3%
      startDate: new Date().toISOString().split('T')[0], // Today's date
      ...defaultValues,
    },
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredCustomers, setFilteredCustomers] = useState(customers)

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCustomers([])
      setShowSuggestions(false)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = customers.filter(
        customer =>
          customer.firstName.toLowerCase().includes(term) ||
          customer.lastName.toLowerCase().includes(term)
      )
      setFilteredCustomers(filtered)
      setShowSuggestions(true)
    }
  }, [searchTerm, customers])

  useEffect(() => {
    if (defaultValues) {
      reset({
        interestRate: 3,
        startDate: new Date().toISOString().split('T')[0],
        ...defaultValues,
      })
    }
  }, [defaultValues, reset])

  // Clear form when clearOnSuccess prop changes
  useEffect(() => {
    if (clearOnSuccess) {
      reset({
        customerId: '',
        itemDescription: '',
        principal: 0,
        interestRate: 3,
        startDate: new Date().toISOString().split('T')[0],
        notes: '',
      })
      setSearchTerm('')
      setSelectedCustomer(null)
    }
  }, [clearOnSuccess, reset])

  const handleFormSubmit = (values: FormValues) => {
    // Convert interest rate from percentage to decimal
    const payload = {
      ...values,
      principal: Number(values.principal),
      interestRate: Number(values.interestRate) / 100, // Convert percentage to decimal
    }
    onSubmit(payload)

    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSearchTerm(`${customer.firstName} ${customer.lastName}`)
    setValue('customerId', customer.id)
    setShowSuggestions(false)
  }

  return (
    <motion.form
      className="space-y-5"
      onSubmit={handleSubmit(handleFormSubmit)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60 dark:text-gray-300" htmlFor="customer-search">
            <User size={14} />
            {t('loan.customer')}
          </label>
          <div className="relative mt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
              <input
                id="customer-search"
                type="text"
                placeholder={t('loan.typeCustomerName')}
                className="w-full rounded-xl border border-gold-200 bg-cream pl-10 pr-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm && setShowSuggestions(true)}
              />
            </div>

            <AnimatePresence>
              {showSuggestions && filteredCustomers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-xl border border-gold-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
                >
                  {filteredCustomers.map((customer, index) => (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="cursor-pointer px-3 py-2 hover:bg-gold-100 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <User size={14} className="text-gold-600" />
                      <span>{customer.firstName} {customer.lastName}</span>
                      <span className="text-xs text-ink/60 ml-auto">{customer.phone}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {selectedCustomer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 p-2 rounded-lg bg-gold-50 border border-gold-200 dark:bg-gray-600 dark:border-gray-500"
              >
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gold-600" />
                  <span className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                </div>
                <div className="text-xs text-ink/60 dark:text-gray-300 mt-1">
                  📞 {selectedCustomer.phone} • {selectedCustomer.email || 'No email'}
                </div>
              </motion.div>
            )}

            <input type="hidden" {...register('customerId')} />
          </div>
          {errors.customerId && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.customerId.message}</p>}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60 dark:text-gray-300" htmlFor="itemDescription">
            <FileText size={14} />
            {t('loan.itemDescription')}
          </label>
          <input
            id="itemDescription"
            type="text"
            className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-300"
            {...register('itemDescription')}
            placeholder={t('loan.itemPlaceholder')}
          />
          {errors.itemDescription && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.itemDescription.message}</p>}
        </motion.div>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60 dark:text-gray-300" htmlFor="principal">
            <IndianRupee size={14} />
            {t('loan.principalAmount')}
          </label>
          <input
            id="principal"
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-300"
            {...register('principal', { valueAsNumber: true })}
            placeholder="1000.00"
          />
          {errors.principal && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.principal.message}</p>}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60 dark:text-gray-300" htmlFor="interestRate">
            📊 {t('loan.interestRate')}
          </label>
          <input
            id="interestRate"
            type="number"
            step="1"
            min="0"
            max="100"
            className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-300"
            {...register('interestRate', { valueAsNumber: true })}
            placeholder="3"
          />
          {errors.interestRate && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.interestRate.message}</p>}
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60 dark:text-gray-300" htmlFor="startDate">
          <Calendar size={14} />
          {t('loan.startDate')}
        </label>
        <input
          id="startDate"
          type="date"
          className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-300"
          {...register('startDate')}
        />
        {errors.startDate && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.startDate.message}</p>}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60 dark:text-gray-300" htmlFor="notes">
          <FileText size={14} />
          {t('loan.notes')}
        </label>
        <textarea
          id="notes"
          rows={3}
          className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-300"
          {...register('notes')}
          placeholder={t('loan.notesPlaceholder')}
        />
        {errors.notes && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.notes.message}</p>}
      </motion.div>

      <motion.div
        className="flex flex-col gap-3 sm:flex-row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <motion.button
          type="submit"
          className="w-full rounded-xl bg-gold-500 px-5 py-2 text-sm font-semibold text-white shadow-card transition-all duration-300 hover:bg-gold-600 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gold-300 sm:w-auto"
          disabled={isSubmitting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSubmitting ? t('loan.creatingLoan') : t('loan.createLoan')}
        </motion.button>
      </motion.div>
    </motion.form>
  )
}