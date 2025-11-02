export type LoanStatus = 'ACTIVE' | 'REDEEMED' | 'DEFAULTED' | 'LATE'

export interface LoanCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface Loan {
  id: string
  customerId: string
  itemDescription: string
  principal: number
  interestRate: number
  totalPayable: number // Add this field for auto-calculated total
  startDate: string
  durationMonths: number // Add this field for loan duration
  dueDate: string
  status: LoanStatus
  notes?: string
  createdAt: string
  updatedAt: string
  customer: LoanCustomer
  daysUntilDue: number
  totalRepaid: number
  outstandingBalance: number
}

export interface LoanState {
  items: Loan[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  selectedLoan?: Loan
}

export interface CreateLoanPayload {
  customerId: string
  itemDescription: string
  principal: number
  interestRate: number
  startDate?: string
  notes?: string
}

export interface UpdateLoanStatusPayload {
  id: string
  status: LoanStatus
}

// Add interface for report data
export interface ReportData {
  totalLoans: number
  totalPrincipal: number
  totalPayable: number
  totalRepaid: number
  totalInterestEarned: number
  pendingLoans: number
  activeLoans: number
  redeemedLoans: number
}