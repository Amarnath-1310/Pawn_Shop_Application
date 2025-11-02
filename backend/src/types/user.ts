export type UserRole = 'admin' | 'clerk'

export interface UserRecord {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  passwordHash: string
  createdAt: string
  updatedAt: string
}

export interface PublicUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

