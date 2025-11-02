import axios from 'axios'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { apiClient } from '../../lib/apiClient'
import type { RootState } from '../../store/store'
import type { Repayment, RepaymentFormPayload, RepaymentState } from './types'
import type { Loan } from '../loans/types'

export const fetchRepaymentsByLoan = createAsyncThunk<Repayment[], string>(
  'repayments/fetchByLoan',
  async (loanId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ repayments: Repayment[] }>(`/repayments/${loanId}`)
      return response.data.repayments
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ??
            'Unable to load repayments',
        )
      }
      return rejectWithValue('Unable to load repayments')
    }
  },
)

export const createRepayment = createAsyncThunk<
  { repayment: Repayment; loan: Loan },
  RepaymentFormPayload
>(
  'repayments/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ repayment: Repayment; loan: Loan }>('/repayments', payload)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ??
            'Unable to record repayment',
        )
      }
      return rejectWithValue('Unable to record repayment')
    }
  },
)

const initialState: RepaymentState = {
  byLoanId: {},
  status: 'idle',
  error: null,
}

const repaymentsSlice = createSlice({
  name: 'repayments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepaymentsByLoan.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchRepaymentsByLoan.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const loanId = action.meta.arg
        state.byLoanId[loanId] = action.payload
      })
      .addCase(fetchRepaymentsByLoan.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string | undefined) ?? 'Failed to load repayments'
      })
      .addCase(createRepayment.fulfilled, (state, action) => {
        const { repayment } = action.payload
        const existing = state.byLoanId[repayment.loanId] ?? []
        state.byLoanId[repayment.loanId] = [...existing, repayment].sort(
          (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime(),
        )
        state.error = null
      })
      .addCase(createRepayment.rejected, (state, action) => {
        state.error = (action.payload as string | undefined) ?? 'Failed to record repayment'
      })
  },
})

export const selectRepaymentsState = (state: RootState) => state.repayments
export const selectRepaymentsByLoan = (loanId: string) => (state: RootState) =>
  state.repayments.byLoanId[loanId] ?? []

export default repaymentsSlice.reducer

