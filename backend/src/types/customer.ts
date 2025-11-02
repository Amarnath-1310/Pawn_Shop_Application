export interface CustomerRecord {
  id: string
  firstName: string
  lastName: string
  email?: string // Make email optional
  phone: string
  createdAt: string
  updatedAt: string
}

export type CustomerPublic = CustomerRecord