import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, IndianRupee, Calendar, CreditCard, FileText, Calculator } from 'lucide-react'
import dayjs from 'dayjs'

import type { Loan } from '../../features/loans/types'
import type { Customer } from '../../features/customers/types'
import type { RepaymentFormPayload } from '../../features/repayments/types'
import { AnimatedButton } from '../animations/AnimatedButton'
import { calculateLoanRepayment } from '../../lib/sms'

const schema = z.object({
  loanId: z.string().min(1, 'Select a loan'),
  amount: z
    .number({ invalid_type_error: 'Enter a payment amount' })
    .positive('Amount must be greater than zero'),
  method: z.enum(['cash', 'card', 'bank']).default('cash'),
  reference: z.string().max(80).optional(),
  paidAt: z.string().optional(),
  notes: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

interface RepaymentFormProps {
  loans: Loan[]
  customers: Customer[]
  defaultValues?: Partial<RepaymentFormPayload>
  isSubmitting?: boolean
  clearOnSuccess?: boolean
  onSubmit: (payload: RepaymentFormPayload) => void
}

export const RepaymentForm = ({ loans, customers, defaultValues, isSubmitting = false, clearOnSuccess = false, onSubmit }: RepaymentFormProps) => {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: 'cash',
      paidAt: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerLoans, setCustomerLoans] = useState<Loan[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null)

  // Watch form values
  const loanId = watch('loanId')
  const paidAt = watch('paidAt')
  
  // Find selected loan
  const selectedLoan = loans.find(loan => loan.id === loanId)

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSearchTerm(`${customer.firstName} ${customer.lastName}`)
    setShowSuggestions(false)
    
    // Filter loans for this customer
    const customerActiveLoans = loans.filter(loan => 
      loan.customerId === customer.id && loan.status !== 'REDEEMED'
    )
    setCustomerLoans(customerActiveLoans)
    
    // Clear loan selection
    setValue('loanId', '')
    setValue('amount', 0)
    setCalculatedAmount(null)
  }

  // Calculate duration in months from start date to payment date
  const getDurationInMonths = (startDate: string, endDate: string) => {
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    
    // Calculate base months difference
    let months = end.diff(start, 'month')
    
    // Calculate remaining days after accounting for full months
    const remainingDays = end.diff(start.add(months, 'month'), 'day')
    
    // If remaining days >= 10, add 0.5 month
    if (remainingDays >= 10) {
      months += 0.5
    }
    
    return months
  }

  // Calculate amount based on date difference
  const calculateAmount = () => {
    if (!selectedLoan || !paidAt) return 0
    
    // Calculate duration in months
    const months = getDurationInMonths(selectedLoan.startDate, paidAt)
    
    // Calculate repayment using the correct formula
    const calculation = calculateLoanRepayment(
      selectedLoan.principal,
      selectedLoan.interestRate,
      months
    )
    
    setCalculatedAmount(calculation.totalPayable)
    setValue('amount', Math.round(calculation.totalPayable * 100) / 100) // Round to 2 decimal places
    
    return calculation.totalPayable
  }
  
  // Auto-calculate amount when loan or date changes
  useEffect(() => {
    if (loanId && paidAt) {
      calculateAmount()
    }
  }, [loanId, paidAt, selectedLoan])

  // Clear form when clearOnSuccess prop changes
  useEffect(() => {
    if (clearOnSuccess) {
      reset({
        loanId: '',
        amount: 0,
        method: 'cash',
        paidAt: new Date().toISOString().slice(0, 10),
        reference: '',
        notes: '',
      })
      setSearchTerm('')
      setSelectedCustomer(null)
      setCustomerLoans([])
      setCalculatedAmount(null)
    }
  }, [clearOnSuccess, reset])

  return (
    <motion.form
      className="space-y-5"
      onSubmit={handleSubmit((values) => onSubmit({
        ...values,
        amount: Number(values.amount),
      }))}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Customer Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60" htmlFor="customer-search">
          <Search size={14} />
          Search Customer
        </label>
        <div className="relative mt-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
            <input
              id="customer-search"
              type="text"
              placeholder="Type customer name..."
              className="w-full rounded-xl border border-gold-200 bg-cream pl-10 pr-3 py-2 text-sm text-black focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowSuggestions(e.target.value.length > 0)
              }}
              onFocus={() => searchTerm && setShowSuggestions(true)}
            />
          </div>
          
          <AnimatePresence>
            {showSuggestions && filteredCustomers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-xl border border-gold-200 bg-white shadow-lg"
              >
                {filteredCustomers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="cursor-pointer px-3 py-2 hover:bg-gold-100 transition-colors duration-200 flex items-center gap-2"
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <User size={14} className="text-gold-600" />
                    <span>{customer.firstName} {customer.lastName}</span>
                    <span className="text-xs text-ink/60 ml-auto">📞 {customer.phone}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {selectedCustomer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 p-2 rounded-lg bg-gold-50 border border-gold-200"
            >
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-gold-600" />
                <span className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                <span className="text-xs text-ink/60 ml-auto">
                  {customerLoans.length} active loan{customerLoans.length !== 1 ? 's' : ''}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Loan Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60" htmlFor="loanId">
          <IndianRupee size={14} />
          Select Loan
        </label>
        <select
          id="loanId"
          className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
          {...register('loanId')}
          disabled={!selectedCustomer}
        >
          <option value="">
            {selectedCustomer ? 'Select a loan' : 'First select a customer'}
          </option>
          {customerLoans.map((loan) => (
            <option value={loan.id} key={loan.id}>
              ₹{loan.principal.toLocaleString()} - {loan.itemDescription} (Due: {new Date(loan.dueDate).toLocaleDateString('en-GB')})
            </option>
          ))}
        </select>
        {errors.loanId && <p className="mt-1 text-xs text-red-600">{errors.loanId.message}</p>}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60" htmlFor="amount">
            <Calculator size={14} />
            Amount (Auto-calculated)
          </label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-xl border border-gold-200 bg-cream pl-10 pr-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300 font-semibold text-gold-700"
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  readOnly
                />
              </div>
            )}
          />
          {calculatedAmount && selectedLoan && paidAt && (() => {
            const months = getDurationInMonths(selectedLoan.startDate, paidAt)
            const calculation = calculateLoanRepayment(selectedLoan.principal, selectedLoan.interestRate, months)
            
            return (
              <motion.div 
                className="mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-xs text-emerald-700">
                  <div className="font-semibold mb-2 flex items-center gap-1">
                    <Calculator size={12} />
                    Calculation Breakdown:
                  </div>
                  <div className="space-y-1 font-mono">
                    <div>Principal: ₹{calculation.principal.toLocaleString()}</div>
                    <div>Interest Rate: {calculation.interestRate.toFixed(1)}% per month</div>
                    <div>Duration: {calculation.months} months</div>
                    <div className="text-blue-700">
                      Interest = ₹{calculation.principal.toLocaleString()} × {calculation.interestRate}% × {calculation.months} ÷ 100
                    </div>
                    <div>Interest Amount: ₹{calculation.totalInterest.toLocaleString()}</div>
                    <div className="border-t border-emerald-300 pt-1 font-semibold text-emerald-800">
                      Total Payable: ₹{calculation.totalPayable.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })()}
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60" htmlFor="method">
            <CreditCard size={14} />
            Payment method
          </label>
          <select
            id="method"
            className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
            {...register('method')}
          >
            <option value="cash">💵 Cash</option>
            <option value="card">💳 Card</option>
            <option value="bank">🏦 Bank transfer</option>
          </select>
          {errors.method && <p className="mt-1 text-xs text-red-600">{errors.method.message}</p>}
        </motion.div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60" htmlFor="paidAt">
            <Calendar size={14} />
            Payment date (mm/dd/yyyy)
          </label>
          <input
            id="paidAt"
            type="date"
            className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm text-black focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
            {...register('paidAt')}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60" htmlFor="reference">
            <FileText size={14} />
            Reference
          </label>
          <input
            id="reference"
            type="text"
            placeholder="Optional receipt or transaction ID"
            className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm text-black focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
            {...register('reference')}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60" htmlFor="notes">
          <FileText size={14} />
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Optional notes for this repayment"
          className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm text-black focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
          {...register('notes')}
        />
        {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <AnimatedButton
          type="submit"
          isLoading={isSubmitting}
          className="w-full sm:w-auto"
        >
          Record Payment
        </AnimatedButton>
      </motion.div>
    </motion.form>
  )
}