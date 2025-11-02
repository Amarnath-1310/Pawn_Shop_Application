import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

import type { FormEvent } from 'react'

// Constants for login credentials
const VALID_EMAIL = 'sivaamar1706@gmail.com'
const VALID_PASSWORD = 'sivakumar'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation() as Location & { state?: { from?: { pathname: string } } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const redirectPath = useMemo(() => location.state?.from?.pathname ?? '/dashboard', [location.state])

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem('auth') === 'true'
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true })
    }
  }, [navigate, redirectPath])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate a brief loading state for better UX
    setTimeout(() => {
      if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        localStorage.setItem('auth', 'true')
        navigate(redirectPath, { replace: true })
      } else {
        setError('Invalid credentials. Please try again.')
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="flex grow items-center justify-center p-4 sm:p-6 min-h-[calc(100vh-200px)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid w-full max-w-md grid-cols-1 gap-6 rounded-2xl border border-gold-200 bg-white/80 p-6 shadow-xl shadow-gold-500/10 backdrop-blur sm:max-w-xl sm:rounded-3xl sm:p-10"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Sign in to Abi & Amar Pawn Shop</h1>
          <p className="mt-2 text-sm text-ink/70">
            Manage inventory, loans, and customer accounts securely.
          </p>
        </motion.div>

        <motion.form 
          className="space-y-4" 
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div 
            className="space-y-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink/70" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm text-ink shadow-inner focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 sm:px-4 sm:py-2 transition-all duration-300"
              autoComplete="email"
              required
            />
          </motion.div>

          <motion.div 
            className="space-y-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <label className="block text-xs font-semibold uppercase tracking-wide text-ink/70" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 pr-10 text-sm text-ink shadow-inner focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 sm:px-4 sm:py-2 transition-all duration-300"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/60 hover:text-ink transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:px-4 sm:py-3"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-gold-500/30 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:from-gold-500 hover:to-gold-700 disabled:cursor-not-allowed disabled:bg-gold-300"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {isLoading ? 'Signing in…' : 'Login'}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  )
}