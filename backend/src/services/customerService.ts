import { z } from 'zod'

import { getCustomerRepository } from '../repositories/customerRepository.js'
import { getLoanRepository } from '../repositories/loanRepository.js'
import type { CustomerPublic, CustomerRecord } from '../types/customer.js'
import { sanitizeString, sanitizeEmail, sanitizePhone } from '../utils/sanitize.js'
import { withRetry } from '../utils/database.js'

const createSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Valid email required').optional().or(z.string().max(0)), // Make email optional
  phone: z.string().min(7, 'Phone number is required').max(20),
})

const updateSchema = createSchema.partial()

const toPublic = (record: CustomerRecord): CustomerPublic => record

export const listCustomers = async (): Promise<CustomerPublic[]> => {
  const repository = getCustomerRepository()
  const customers = await repository.list()
  return customers
    .map(toPublic)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const createCustomer = async (input: unknown): Promise<CustomerPublic> => {
  const data = createSchema.parse(input)
  const repository = getCustomerRepository()
  
  // Sanitize inputs
  const customerData = {
    firstName: sanitizeString(data.firstName),
    lastName: sanitizeString(data.lastName),
    email: data.email ? sanitizeEmail(data.email) || undefined : undefined,
    phone: sanitizePhone(data.phone) || data.phone, // Fallback to original if sanitization fails
  }

  const record = await withRetry(() => repository.create(customerData))
  return toPublic(record)
}

export const updateCustomer = async (
  id: string,
  input: unknown,
): Promise<CustomerPublic> => {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Customer id is required')
  }
  
  const data = updateSchema.parse(input)
  const repository = getCustomerRepository()
  
  // Sanitize inputs
  const customerData: Partial<{
    firstName: string
    lastName: string
    email?: string
    phone: string
  }> = {}
  
  if (data.firstName !== undefined) {
    customerData.firstName = sanitizeString(data.firstName)
  }
  if (data.lastName !== undefined) {
    customerData.lastName = sanitizeString(data.lastName)
  }
  if (data.email !== undefined) {
    customerData.email = data.email ? sanitizeEmail(data.email) || undefined : undefined
  }
  if (data.phone !== undefined) {
    customerData.phone = sanitizePhone(data.phone) || data.phone
  }

  const record = await withRetry(() => repository.update(id.trim(), customerData))
  return toPublic(record)
}

export const deleteCustomer = async (id: string): Promise<void> => {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Customer id is required')
  }
  
  const customerRepo = getCustomerRepository()
  const loanRepo = getLoanRepository()
  
  // Check for active loans with retry
  const loans = await withRetry(() => loanRepo.list())
  const hasActiveLoan = loans.some((loan) => loan.customerId === id.trim() && (loan.status === 'ACTIVE' || loan.status === 'LATE'))
  if (hasActiveLoan) {
    throw new Error('Customer has active loans and cannot be deleted')
  }
  
  await withRetry(() => customerRepo.delete(id.trim()))
}