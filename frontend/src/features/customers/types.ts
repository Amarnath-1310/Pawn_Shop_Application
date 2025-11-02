export interface Customer {
  id: string
  firstName: string
  lastName: string
  email?: string // Make email optional
  phone: string
  createdAt: string
  updatedAt: string
}

export interface UpsertCustomerPayload {
  firstName: string
  lastName: string
  email?: string // Make email optional
  phone: string
}

export interface CustomerState {
  items: Customer[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}