import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { User, Phone } from 'lucide-react'

import type { UpsertCustomerPayload } from '../../features/customers/types'
import { AnimatedButton } from '../animations/AnimatedButton'

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
  submitLabel,
  isSubmitting = false,
  clearOnSuccess = false,
  onSubmit,
  onCancel,
}: CustomerFormProps) => {
  const { t } = useTranslation()
  
  const schema = z.object({
    firstName: z.string().min(1, t('customer.firstNameRequired')),
    lastName: z.string().min(1, t('customer.lastNameRequired')),
    phone: z
      .string()
      .min(7, t('customer.phoneRequired'))
      .regex(/^[0-9+()\-\s]+$/, t('customer.phoneInvalid')),
  })

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })
  
  const defaultSubmitLabel = submitLabel || t('customer.saveCustomer')

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
            {t('customer.firstName')}
          </label>
          <input
            id="firstName"
            type="text"
            className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm text-black focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
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
            {t('customer.lastName')}
          </label>
          <input
            id="lastName"
            type="text"
            className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm text-black focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
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
          {t('customer.phoneNumber')}
        </label>
        <input
          id="phone"
          type="tel"
          className="mt-1 w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm text-black focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 transition-all duration-300"
          placeholder={t('customer.phonePlaceholder')}
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
          {defaultSubmitLabel}
        </AnimatedButton>
        
        {onCancel && (
          <AnimatedButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {t('common.cancel')}
          </AnimatedButton>
        )}
      </motion.div>
    </motion.form>
  )
}