import axios from 'axios'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { apiClient } from '../../lib/apiClient'
import type { RootState } from '../../store/store'
import type { CreateLoanPayload, Loan, LoanState, UpdateLoanStatusPayload, ReportData } from './types'
import { createRepayment } from '../repayments/repaymentsSlice'

export const fetchLoans = createAsyncThunk<Loan[]>(
  'loans/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ loans: Loan[] }>('/loans')
      return response.data.loans
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ?? 'Unable to load loans',
        )
      }
      return rejectWithValue('Unable to load loans')
    }
  },
)

export const createLoan = createAsyncThunk<Loan, CreateLoanPayload>(
  'loans/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ loan: Loan }>('/loans', payload)
      return response.data.loan
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ?? 'Unable to create loan',
        )
      }
      return rejectWithValue('Unable to create loan')
    }
  },
)

export const updateLoanStatus = createAsyncThunk<Loan, UpdateLoanStatusPayload>(
  'loans/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch<{ loan: Loan }>(`/loans/${id}`, { status })
      return response.data.loan
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ?? 'Unable to update loan',
        )
      }
      return rejectWithValue('Unable to update loan')
    }
  },
)

export const fetchLoanById = createAsyncThunk<Loan, string>(
  'loans/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ loan: Loan }>(`/loans/${id}`)
      return response.data.loan
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ?? 'Unable to load loan',
        )
      }
      return rejectWithValue('Unable to load loan')
    }
  },
)

// Add thunk for fetching report data
export const fetchReportData = createAsyncThunk<ReportData>(
  'loans/fetchReport',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ report: ReportData }>('/reports/monthly')
      return response.data.report
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ?? 'Unable to load report data',
        )
      }
      return rejectWithValue('Unable to load report data')
    }
  },
)

const initialState: LoanState = {
  items: [],
  status: 'idle',
  error: null,
  selectedLoan: undefined,
}

const loanSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    clearSelectedLoan(state) {
      state.selectedLoan = undefined
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoans.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchLoans.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchLoans.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string | undefined) ?? 'Failed to load loans'
      })
      .addCase(createLoan.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
        state.error = null
      })
      .addCase(createLoan.rejected, (state, action) => {
        state.error = (action.payload as string | undefined) ?? 'Failed to create loan'
      })
      .addCase(updateLoanStatus.fulfilled, (state, action) => {
        state.items = state.items.map((loan) => (loan.id === action.payload.id ? action.payload : loan))
        state.error = null
        if (state.selectedLoan?.id === action.payload.id) {
          state.selectedLoan = action.payload
        }
      })
      .addCase(updateLoanStatus.rejected, (state, action) => {
        state.error = (action.payload as string | undefined) ?? 'Failed to update loan'
      })
      .addCase(fetchLoanById.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchLoanById.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.selectedLoan = action.payload
        const exists = state.items.some((loan) => loan.id === action.payload.id)
        state.items = exists
          ? state.items.map((loan) => (loan.id === action.payload.id ? action.payload : loan))
          : [action.payload, ...state.items]
      })
      .addCase(fetchLoanById.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string | undefined) ?? 'Failed to load loan'
      })
      .addCase(createRepayment.fulfilled, (state, action) => {
        const updatedLoan = action.payload.loan
        state.items = state.items.map((loan) => (loan.id === updatedLoan.id ? updatedLoan : loan))
        if (state.selectedLoan?.id === updatedLoan.id) {
          state.selectedLoan = updatedLoan
        }
      })
  },
})

export const selectLoans = (state: RootState) => state.loans
export const { clearSelectedLoan } = loanSlice.actions

export default loanSlice.reducer