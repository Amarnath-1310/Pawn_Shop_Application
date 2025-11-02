import { Navigate } from 'react-router-dom'

export const RootRedirect = () => {
  const isAuthenticated = localStorage.getItem('auth') === 'true'

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/signin" replace />
}

