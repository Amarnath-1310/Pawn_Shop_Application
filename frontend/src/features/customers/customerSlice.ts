import axios from 'axios'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { apiClient } from '../../lib/apiClient'
import type { RootState } from '../../store/store'
import type { Customer, CustomerState, UpsertCustomerPayload } from './types'

export const fetchCustomers = createAsyncThunk<Customer[]>(
  'customers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ customers: Customer[] }>('/customers')
      return response.data.customers
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ??
            'Unable to load customers',
        )
      }
      return rejectWithValue('Unable to load customers')
    }
  },
)

export const createCustomer = createAsyncThunk<Customer, UpsertCustomerPayload>(
  'customers/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ customer: Customer }>('/customers', payload)
      return response.data.customer
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ??
            'Unable to create customer',
        )
      }
      return rejectWithValue('Unable to create customer')
    }
  },
)

export const updateCustomer = createAsyncThunk<
  Customer,
  { id: string; changes: UpsertCustomerPayload }
>(
  'customers/update',
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<{ customer: Customer }>(`/customers/${id}`, changes)
      return response.data.customer
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ??
            'Unable to update customer',
        )
      }
      return rejectWithValue('Unable to update customer')
    }
  },
)

export const deleteCustomer = createAsyncThunk<string, string>(
  'customers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/customers/${id}`)
      return id
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as { message?: string } | undefined)?.message ??
            'Unable to delete customer',
        )
      }
      return rejectWithValue('Unable to delete customer')
    }
  },
)

const initialState: CustomerState = {
  items: [],
  status: 'idle',
  error: null,
}

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string | undefined) ?? 'Failed to load customers'
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
        state.error = null
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.error = (action.payload as string | undefined) ?? 'Failed to create customer'
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.items = state.items.map((customer) =>
          customer.id === action.payload.id ? action.payload : customer,
        )
        state.error = null
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.error = (action.payload as string | undefined) ?? 'Failed to update customer'
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter((customer) => customer.id !== action.payload)
        state.error = null
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.error = (action.payload as string | undefined) ?? 'Failed to delete customer'
      })
  },
})

export const selectCustomers = (state: RootState) => state.customers

export default customerSlice.reducer

