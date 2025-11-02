import { z } from 'zod'

import { getCustomerRepository } from '../repositories/customerRepository.js'
import { getLoanRepository } from '../repositories/loanRepository.js'
import type { CustomerPublic, CustomerRecord } from '../types/customer.js'

const createSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required').optional().or(z.string().max(0)), // Make email optional
  phone: z.string().min(7, 'Phone number is required'),
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
  // Convert empty string to undefined for optional email
  const customerData = {
    ...data,
    email: data.email || undefined,
  }
  const record = await repository.create(customerData)
  return toPublic(record)
}

export const updateCustomer = async (
  id: string,
  input: unknown,
): Promise<CustomerPublic> => {
  if (!id) {
    throw new Error('Customer id is required')
  }
  const data = updateSchema.parse(input)
  const repository = getCustomerRepository()
  // Convert empty string to undefined for optional email
  const customerData = {
    ...data,
    email: data.email || undefined,
  }
  const record = await repository.update(id, customerData)
  return toPublic(record)
}

export const deleteCustomer = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Customer id is required')
  }
  const customerRepo = getCustomerRepository()
  const loanRepo = getLoanRepository()
  const loans = await loanRepo.list()
  const hasActiveLoan = loans.some((loan) => loan.customerId === id && loan.status === 'ACTIVE')
  if (hasActiveLoan) {
    throw new Error('Customer has active loans and cannot be deleted')
  }
  await customerRepo.delete(id)
}