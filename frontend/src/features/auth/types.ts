export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'clerk'
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

