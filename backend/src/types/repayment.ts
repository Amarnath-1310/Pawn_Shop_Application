export interface RepaymentRecord {
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

export interface RepaymentPublic extends RepaymentRecord {}

