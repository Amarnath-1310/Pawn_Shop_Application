import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { User, Phone } from 'lucide-react'

import type { UpsertCustomerPayload } from '../../features/customers/types'
import { AnimatedButton } from '../animations/AnimatedButton'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z
    .string()
    .min(7, 'Phone number is required')
    .regex(/^[0-9+()\-\s]+$/, 'Enter a valid phone number'),
})

type FormValues = z.infer<typeof schema>

interface CustomerFormProps {
  defaultValues?: UpsertCustomerPayload
  submitLabel?: string
  isSubmitting?: boolean
  clearOnSuccess?: boolean
  onSubmit: (values: UpsertCustomerPayload) => void
  onCancel?: () => void
}

export const CustomerForm = ({
  defaultValues,
  submitLabel = 'Save customer',
  isSubmitting = false,
  clearOnSuccess = false,
  onSubmit,
  onCancel,
}: CustomerFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues)
    }
  }, [defaultValues, reset])

  // Clear form when clearOnSuccess prop changes
  useEffect(() => {
    if (clearOnSuccess) {
      reset({
        firstName: '',
        lastName: '',
        phone: '',
      })
    }
  }, [clearOnSuccess, reset])

  const handleFormSubmit = (values: FormValues) => {
    const payload: UpsertCustomerPayload = {
      ...values,
      email: '', // Set empty email since we removed the field
    }
    onSubmit(payload)
  }

  return (
    <motion.form
      className="space-y-4"
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
          <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60" htmlFor="firstName">
            <User size={14} />
            First name
          </label>
          <input
            id="firstName"
            type="text"
            className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
            {...register('firstName')}
          />
          {errors.firstName && (
            <motion.p 
              className="mt-1 text-xs text-red-600"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.firstName.message}
            </motion.p>
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60" htmlFor="lastName">
            <User size={14} />
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
            {...register('lastName')}
          />
          {errors.lastName && (
            <motion.p 
              className="mt-1 text-xs text-red-600"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.lastName.message}
            </motion.p>
          )}
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <label className="flex items-center gap-2 text-xs font-semibold uppercase text-ink/60" htmlFor="phone">
          <Phone size={14} />
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
          placeholder="+91 98765 43210"
          {...register('phone')}
        />
        {errors.phone && (
          <motion.p 
            className="mt-1 text-xs text-red-600"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errors.phone.message}
          </motion.p>
        )}
      </motion.div>
      
      <motion.div 
        className="flex flex-col gap-3 sm:flex-row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <AnimatedButton
          type="submit"
          isLoading={isSubmitting}
          className="w-full sm:w-auto"
        >
          {submitLabel}
        </AnimatedButton>
        
        {onCancel && (
          <AnimatedButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </AnimatedButton>
        )}
      </motion.div>
    </motion.form>
  )
}