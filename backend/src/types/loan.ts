export type LoanStatus = 'ACTIVE' | 'REDEEMED' | 'DEFAULTED' | 'LATE'

export interface LoanRecord {
  id: string
  customerId: string
  itemDescription: string
  principal: number
  interestRate: number
  totalPayable: number // Add this field for auto-calculated total
  startDate: string
  dueDate: string
  status: LoanStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface LoanPublic extends LoanRecord {
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  daysUntilDue: number
  totalRepaid: number
  outstandingBalance: number
}