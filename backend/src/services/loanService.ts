import { z } from 'zod'

import { getCustomerRepository } from '../repositories/customerRepository.js'
import { getLoanRepository } from '../repositories/loanRepository.js'
import { getRepaymentRepository } from '../repositories/repaymentRepository.js'
import type { LoanPublic, LoanRecord, LoanStatus } from '../types/loan.js'
import type { RepaymentRecord } from '../types/repayment.js'
import { sendSMS, generateLoanSMS, generatePaymentSMS } from '../lib/sms.js'

const createSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  itemDescription: z.string().min(1, 'Item description is required'),
  principal: z.number().positive('Principal must be greater than zero'),
  interestRate: z.number().min(0, 'Interest rate must be positive'),
  startDate: z.string().optional(),
  notes: z.string().max(500).optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REDEEMED', 'DEFAULTED', 'LATE']),
})

// Helper function to calculate total payable amount
const calculateTotalPayable = (principal: number, interestRate: number, durationMonths: number): number => {
  // Formula: Total = Principal + (Principal × Interest% × DurationInMonths / 100)
  // Convert interest rate from decimal to percentage if needed
  const interestPercent = interestRate > 1 ? interestRate : interestRate * 100
  const totalInterest = (principal * interestPercent * durationMonths) / 100
  return principal + totalInterest
}

// Helper function to calculate due date based on start date and duration
const calculateDueDate = (startDate: string, durationMonths: number): string => {
  const start = new Date(startDate)
  // Add months to the start date
  start.setMonth(start.getMonth() + Math.floor(durationMonths))
  // Add days for fractional months (0.5 months = ~15 days)
  if (durationMonths % 1 !== 0) {
    start.setDate(start.getDate() + 15)
  }
  return start.toISOString()
}

// Helper function to calculate duration in months between two dates
const calculateDurationMonths = (startDate: string, endDate: string): number => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Calculate base months difference
  let months = (end.getFullYear() - start.getFullYear()) * 12
  months += end.getMonth() - start.getMonth()
  
  // Calculate remaining days after accounting for full months
  const startOfMonth = new Date(start.getFullYear(), start.getMonth() + months, start.getDate())
  const remainingDays = Math.ceil((end.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))
  
  // If remaining days >= 10, add 0.5 month
  if (remainingDays >= 10) {
    months += 0.5
  }
  
  return months > 0 ? months : 1 // Minimum 1 month
}

const determineStatus = (
  record: LoanRecord,
  outstandingBalance: number,
  daysUntilDue: number,
): LoanStatus => {
  if (outstandingBalance <= 0) {
    return 'REDEEMED'
  }

  if (record.status === 'DEFAULTED') {
    return 'DEFAULTED'
  }

  if (daysUntilDue < 0) {
    return 'LATE'
  }

  return record.status === 'REDEEMED' ? 'REDEEMED' : 'ACTIVE'
}

const enrichLoans = async (records: LoanRecord[]): Promise<LoanPublic[]> => {
  const customerRepository = getCustomerRepository()
  const repaymentRepository = getRepaymentRepository()
  const customers = await customerRepository.list()
  const customerMap = new Map(customers.map((customer) => [customer.id, customer]))
  const repayments = await repaymentRepository.listAll()
  const repaymentsByLoan = repayments.reduce<Record<string, RepaymentRecord[]>>((acc, repayment) => {
    if (!acc[repayment.loanId]) {
      acc[repayment.loanId] = []
    }
    acc[repayment.loanId].push(repayment)
    return acc
  }, {})
  const now = Date.now()

  return records
    .map((record) => {
      const customer = customerMap.get(record.customerId)
      if (!customer) {
        throw new Error(`Customer ${record.customerId} not found`)
      }

      const dueDateMs = new Date(record.dueDate).getTime()
      const daysUntilDue = Math.ceil((dueDateMs - now) / (1000 * 60 * 60 * 24))
      const loanRepayments = (repaymentsByLoan[record.id] ?? []).sort(
        (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime(),
      )
      const totalRepaid = loanRepayments.reduce((total, repayment) => total + repayment.amount, 0)
      const outstandingBalance = Math.max(record.totalPayable - totalRepaid, 0)
      const status = determineStatus(record, outstandingBalance, daysUntilDue)

      return {
        ...record,
        status,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email || '',
          phone: customer.phone,
        },
        daysUntilDue,
        totalRepaid,
        outstandingBalance,
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const listLoans = async (): Promise<LoanPublic[]> => {
  const repository = getLoanRepository()
  const records = await repository.list()
  return enrichLoans(records)
}

export const getLoanById = async (id: string): Promise<LoanPublic | null> => {
  const repository = getLoanRepository()
  const record = await repository.getById(id)
  if (!record) {
    return null
  }
  const [loan] = await enrichLoans([record])
  return loan
}

export const createLoan = async (input: unknown): Promise<LoanPublic> => {
  const data = createSchema.parse(input)
  const customerRepository = getCustomerRepository()
  const loanRepository = getLoanRepository()

  const customer = await customerRepository.getById(data.customerId)
  if (!customer) {
    throw new Error('Customer not found')
  }

  // For now, we'll use a default duration of 1 month
  // In a real implementation, this would be calculated based on business rules
  const durationMonths = 1
  
  // Calculate total payable amount
  const totalPayable = calculateTotalPayable(data.principal, data.interestRate, durationMonths)
  
  // Calculate due date based on start date and duration
  const startDate = data.startDate ?? new Date().toISOString()
  const dueDate = calculateDueDate(startDate, durationMonths)

  const record = await loanRepository.create({
    ...data,
    startDate,
    dueDate,
    totalPayable,
    status: 'ACTIVE',
  })

  const [loan] = await enrichLoans([record])
  
  // Send SMS notification to customer
  if (customer.phone) {
    try {
      const smsMessage = generateLoanSMS(
        `${customer.firstName} ${customer.lastName}`,
        data.principal,
        new Date(startDate).toLocaleDateString('en-GB'),
        data.itemDescription
      )
      await sendSMS({
        to: customer.phone,
        message: smsMessage,
      })
    } catch (smsError) {
      console.error('Failed to send loan SMS:', smsError)
      // Continue even if SMS fails
    }
  }
  
  return loan
}

export const updateLoanStatus = async (id: string, input: unknown): Promise<LoanPublic> => {
  if (!id) {
    throw new Error('Loan id is required')
  }
  const data = updateStatusSchema.parse(input)
  const repository = getLoanRepository()
  const record = await repository.updateStatus(id, data.status)
  const [loan] = await enrichLoans([record])
  return loan
}

const repaymentSchema = z.object({
  loanId: z.string().min(1, 'Loan is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  method: z.enum(['cash', 'card', 'bank']).default('cash'),
  reference: z.string().max(80).optional(),
  paidAt: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export const listRepaymentsByLoan = async (loanId: string): Promise<RepaymentRecord[]> => {
  if (!loanId) {
    throw new Error('Loan id is required')
  }
  const repository = getRepaymentRepository()
  const repayments = await repository.listByLoan(loanId)
  return repayments.sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime())
}

export const recordRepayment = async (input: unknown): Promise<{
  repayment: RepaymentRecord
  loan: LoanPublic
}> => {
  const data = repaymentSchema.parse(input)

  const loanRepository = getLoanRepository()
  const loan = await loanRepository.getById(data.loanId)
  if (!loan) {
    throw new Error('Loan not found')
  }

  const repaymentRepository = getRepaymentRepository()
  const paidAt = data.paidAt ?? new Date().toISOString()
  const repayment = await repaymentRepository.create({
    loanId: data.loanId,
    amount: data.amount,
    method: data.method,
    reference: data.reference,
    paidAt,
    notes: data.notes,
  })

  const [updatedLoan] = await enrichLoans([loan])
  const repositoryStatus = determineStatus(
    loan,
    updatedLoan.outstandingBalance,
    updatedLoan.daysUntilDue,
  )
  if (repositoryStatus !== loan.status) {
    await loanRepository.updateStatus(loan.id, repositoryStatus)
  }
  const [latestLoan] = await enrichLoans([
    {
      ...loan,
      status: repositoryStatus,
    },
  ])

  // Send SMS notification to customer
  const customer = updatedLoan.customer
  if (customer && customer.phone) {
    try {
      const smsMessage = generatePaymentSMS(
        `${customer.firstName} ${customer.lastName}`,
        data.amount,
        new Date(paidAt).toLocaleDateString('en-GB'),
        loan.id
      )
      await sendSMS({
        to: customer.phone,
        message: smsMessage,
      })
    } catch (smsError) {
      console.error('Failed to send repayment SMS:', smsError)
      // Continue even if SMS fails
    }
  }

  return { repayment, loan: latestLoan }
}

export const syncLoanStatuses = async (): Promise<LoanPublic[]> => {
  const loanRepository = getLoanRepository()
  const loans = await loanRepository.list()
  const enriched = await enrichLoans(loans)

  await Promise.all(
    enriched.map(async (loan) => {
      const repoLoan = loans.find((l) => l.id === loan.id)
      if (repoLoan && repoLoan.status !== loan.status) {
        await loanRepository.updateStatus(loan.id, loan.status)
      }
    }),
  )

  return enriched
}

// New function to generate monthly reports
export const getMonthlyReport = async () => {
  const loans = await listLoans()
  const activeLoans = loans.filter(loan => loan.status === 'ACTIVE')
  const redeemedLoans = loans.filter(loan => loan.status === 'REDEEMED')
  
  // Calculate report metrics
  const totalLoans = loans.length
  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal, 0)
  const totalPayable = loans.reduce((sum, loan) => sum + (loan.totalPayable || 0), 0)
  const totalRepaid = loans.reduce((sum, loan) => sum + loan.totalRepaid, 0)
  const totalInterestEarned = totalPayable - totalPrincipal
  const pendingLoans = activeLoans.length
  
  return {
    totalLoans,
    totalPrincipal,
    totalPayable,
    totalRepaid,
    totalInterestEarned,
    pendingLoans,
    activeLoans: activeLoans.length,
    redeemedLoans: redeemedLoans.length
  }
}

// New function to get filtered reports for daily, monthly, yearly
export const getFilteredReports = async (type: 'daily' | 'monthly' | 'yearly') => {
  const loans = await listLoans()
  const now = new Date()
  let start: Date, end: Date
  
  if (type === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  } else if (type === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  } else { // yearly
    start = new Date(now.getFullYear(), 0, 1)
    end = new Date(now.getFullYear() + 1, 0, 1)
  }
  
  // Filter loans by creation date
  const filteredLoans = loans.filter(loan => {
    const createdAt = new Date(loan.createdAt)
    return createdAt >= start && createdAt < end
  })
  
  // Format the data for reports
  const formatted = filteredLoans.map(loan => {
    // Calculate duration in months
    const startDate = new Date(loan.startDate)
    const dueDate = new Date(loan.dueDate)
    const months = Math.max(1, Math.ceil((dueDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
    
    // Calculate interest amount
    const interestAmount = (loan.principal * loan.interestRate * months) / 100
    const totalAmount = loan.principal + interestAmount
    
    return {
      customer_id: loan.customer.id,
      loan_id: loan.id,
      start_date: loan.startDate.split('T')[0], // Format as YYYY-MM-DD
      name: `${loan.customer.firstName} ${loan.customer.lastName}`,
      phone: loan.customer.phone,
      item: loan.itemDescription,
      amount: loan.principal,
      due_date: loan.dueDate.split('T')[0], // Format as YYYY-MM-DD
      interest_amount: Math.round(interestAmount * 100) / 100, // Round to 2 decimal places
      total_amount: Math.round(totalAmount * 100) / 100 // Round to 2 decimal places
    }
  })
  
  return formatted
}