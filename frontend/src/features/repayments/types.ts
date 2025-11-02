export interface Repayment {
  id: string
  loanId: string
  amount: number
  method: 'cash' | 'card' | 'bank'
  reference?: string
  paidAt: string
  createdAt: string
  updatedAt: string
  notes?: string
}

export interface RepaymentFormPayload {
  loanId: string
  amount: number
  method: 'cash' | 'card' | 'bank'
  reference?: string
  paidAt?: string
  notes?: string
}

export interface RepaymentState {
  byLoanId: Record<string, Repayment[]>
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

