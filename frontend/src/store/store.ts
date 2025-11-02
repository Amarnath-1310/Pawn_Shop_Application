import { configureStore } from '@reduxjs/toolkit'

import authReducer from '../features/auth/authSlice'
import customerReducer from '../features/customers/customerSlice'
import loanReducer from '../features/loans/loanSlice'
import repaymentReducer from '../features/repayments/repaymentsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customerReducer,
    loans: loanReducer,
    repayments: repaymentReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

