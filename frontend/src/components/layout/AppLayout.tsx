import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, Users, IndianRupee, CreditCard, FileText, LogOut, Sun, Moon } from 'lucide-react'
import { BottomNavigation } from './BottomNavigation'

export const AppLayout = () => {
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)


  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('auth') === 'true'
      setIsAuthenticated(authStatus)
    }
    
    checkAuth()
    // Listen for storage changes (in case user logs out in another tab)
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  // Check for saved theme preference or default to light mode
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  // Update theme when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth')
    setIsAuthenticated(false)
    navigate('/login', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900">
      <header className="border-b border-gold-200 bg-white/80 backdrop-blur dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-full bg-gold-500 p-1.5 shadow-card sm:p-2">
              <span className="text-base font-semibold text-white sm:text-lg">PB</span>
            </div>
            <div className="font-display text-base text-ink dark:text-white sm:text-xl">
              <span className="hidden sm:inline">Abi & Amar Pawn Shop</span>
              <span className="sm:hidden">PawnShop</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3 sm:gap-6 text-sm font-medium text-ink/80 dark:text-gray-200">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-1 transition-all duration-300 hover:text-gold-600 hover:scale-105 ${isActive ? 'text-gold-600 dark:text-gold-400' : ''}`
              }
            >
              <BarChart3 size={16} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `flex items-center gap-1 transition-all duration-300 hover:text-gold-600 hover:scale-105 ${isActive ? 'text-gold-600 dark:text-gold-400' : ''}`
              }
            >
              <Users size={16} />
              <span>Customers</span>
            </NavLink>
            <NavLink
              to="/loans/new"
              className={({ isActive }) =>
                `flex items-center gap-1 transition-all duration-300 hover:text-gold-600 hover:scale-105 ${isActive ? 'text-gold-600 dark:text-gold-400' : ''}`
              }
            >
              <IndianRupee size={16} />
              <span>New Loan</span>
            </NavLink>
            <NavLink
              to="/repayments/new"
              className={({ isActive }) =>
                `flex items-center gap-1 transition-all duration-300 hover:text-gold-600 hover:scale-105 ${isActive ? 'text-gold-600 dark:text-gold-400' : ''}`
              }
            >
              <CreditCard size={16} />
              <span>Payment</span>
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center gap-1 transition-all duration-300 hover:text-gold-600 hover:scale-105 ${isActive ? 'text-gold-600 dark:text-gold-400' : ''}`
              }
            >
              <FileText size={16} />
              <span>Reports</span>
            </NavLink>
            <motion.button
              onClick={toggleDarkMode}
              className="rounded-full p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 sm:p-2 transition-all duration-300 hover:scale-110"
              aria-label="Toggle dark mode"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {darkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </motion.button>
            {isAuthenticated ? (
              <motion.button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-full border border-gold-400 px-3 py-1 text-xs font-semibold text-gold-700 transition-all duration-300 hover:bg-gold-500 hover:text-white hover:scale-105 dark:border-gold-500 dark:text-gold-300 dark:hover:bg-gold-600 dark:hover:text-white sm:px-4 sm:py-1 sm:text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </motion.button>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-white shadow-card transition-all duration-300 hover:bg-gold-600 hover:scale-105 sm:px-4 sm:py-1 sm:text-sm"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button & Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <motion.button
              onClick={toggleDarkMode}
              className="rounded-full p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-300"
              aria-label="Toggle dark mode"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>
            {isAuthenticated ? (
              <motion.button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-gold-400 p-2 text-gold-700 transition-all duration-300 hover:bg-gold-500 hover:text-white dark:border-gold-500 dark:text-gold-300 dark:hover:bg-gold-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut size={16} />
              </motion.button>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-gold-500 px-3 py-2 text-xs font-semibold text-white shadow-card transition-all duration-300 hover:bg-gold-600"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl grow flex-col px-4 py-4 pb-20 sm:px-6 sm:py-6 md:pb-10">
        {isAuthenticated && (
          <div className="mb-4 rounded-lg border border-gold-200 bg-white/70 px-3 py-2 text-xs text-ink/80 shadow-sm dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-200 sm:mb-6 sm:px-4 sm:py-3 sm:text-sm">
            Welcome back, <span className="font-semibold text-ink dark:text-white">Siva Kumar</span>.
          </div>
        )}
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      {isAuthenticated && <BottomNavigation />}

      <footer className="border-t border-gold-200 bg-white/60 dark:border-gray-700 dark:bg-gray-800/60 pb-16 md:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-ink/60 dark:text-gray-400 sm:flex-row sm:px-6 sm:py-4">
          <span>© {new Date().getFullYear()} Abi & Amar Pawn Shop</span>
          <span className="text-center sm:text-left">Secure pawn management for modern brokers</span>
        </div>
      </footer>
    </div>
  )
}
