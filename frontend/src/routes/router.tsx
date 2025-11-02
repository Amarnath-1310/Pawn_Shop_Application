import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '../components/layout/AppLayout'
import { DashboardPage } from '../screens/DashboardPage'
import { SignInPage } from '../screens/SignInPage'
import { LoginPage } from '../screens/LoginPage'
import { CustomersPage } from '../screens/CustomersPage'
import { LoanCreatePage } from '../screens/LoanCreatePage'
import { LoanDetailPage } from '../screens/LoanDetailPage'
import { RepaymentCreatePage } from '../screens/RepaymentCreatePage'
import { ReportsPage } from '../screens/ReportsPage' // Add this import
import { ProtectedRoute } from './ProtectedRoute'
import { RootRedirect } from './RootRedirect'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: 'signin',
        element: <SignInPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        index: true,
        element: <RootRedirect />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'customers',
            element: <CustomersPage />,
          },
          {
            path: 'loans/new',
            element: <LoanCreatePage />,
          },
          {
            path: 'loans/:id',
            element: <LoanDetailPage />,
          },
          {
            path: 'repayments/new',
            element: <RepaymentCreatePage />,
          },
          {
            path: 'reports', // Add this route
            element: <ReportsPage />,
          },
        ],
      },
    ],
  },
])