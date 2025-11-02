import { NavLink } from 'react-router-dom'
import { Home, Users, CreditCard, FileText, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export const BottomNavigation = () => {
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/loans/new', icon: CreditCard, label: 'Loans' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' }
  ]

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gold-200 dark:bg-gray-800 dark:border-gray-700 md:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-around items-center py-2 px-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-gold-600 dark:text-gold-400 bg-gold-50 dark:bg-gold-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-400'
              }`
            }
          >
            {({ isActive }) => (
              <motion.div
                className="flex flex-col items-center"
                whileTap={{ scale: 0.95 }}
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </motion.nav>
  )
}