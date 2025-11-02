import axios from 'axios'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { apiClient, setAuthToken } from '../../lib/apiClient'
import type { AuthState, LoginPayload, LoginResponse } from './types'

const AUTH_STORAGE_KEY = 'pawnbroker::auth'

const loadInitialState = (): Pick<AuthState, 'token' | 'user'> => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return { token: null, user: null }
    }
    const parsed = JSON.parse(raw) as Partial<AuthState>
    if (typeof parsed.token === 'string') {
      setAuthToken(parsed.token)
    }
    return {
      token: typeof parsed.token === 'string' ? parsed.token : null,
      user: parsed.user ?? null,
    }
  } catch (error) {
    console.warn('Failed to load auth state from storage', error)
    return { token: null, user: null }
  }
}

const persistState = (state: Pick<AuthState, 'token' | 'user'>) => {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to persist auth state', error)
  }
}

export const login = createAsyncThunk<LoginResponse, LoginPayload>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', payload)
      return response.data
    } catch (error) {
      if (axios.isAxiosError?.(error)) {
        const message =
          (error.response?.data as { message?: string } | undefined)?.message ??
          'Invalid credentials'
        return rejectWithValue(message)
      }
      return rejectWithValue('Unable to login. Please try again later.')
    }
  },
)

export const logout = createAsyncThunk('auth/logout', async () => {
  return true
})

const { token: initialToken, user: initialUser } =
  typeof window !== 'undefined' ? loadInitialState() : { token: null, user: null }

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.token
        state.user = action.payload.user
        persistState({ token: state.token, user: state.user })
        setAuthToken(state.token)
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string | undefined) ?? 'Login failed'
        state.token = null
        state.user = null
        persistState({ token: state.token, user: state.user })
        setAuthToken(null)
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle'
        state.token = null
        state.user = null
        persistState({ token: state.token, user: state.user })
        setAuthToken(null)
      })
  },
})

export const { resetError } = authSlice.actions

export default authSlice.reducer

