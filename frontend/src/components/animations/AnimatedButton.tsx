import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

const variants = {
  primary: 'bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-white hover:from-gold-500 hover:to-gold-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600'
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

export const AnimatedButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  className = '',
  disabled = false,
  type = 'button',
  onClick
}: AnimatedButtonProps) => {
  return (
    <motion.button
      className={`
        rounded-xl font-semibold shadow-lg transition-all duration-300 ease-in-out
        disabled:cursor-not-allowed disabled:opacity-50
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      whileHover={{ 
        scale: disabled || isLoading ? 1 : 1.05,
        boxShadow: disabled || isLoading ? undefined : '0 10px 25px rgba(0,0,0,0.15)'
      }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      disabled={disabled || isLoading}
      type={type}
      onClick={onClick}
    >
      {isLoading ? (
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          Loading...
        </motion.div>
      ) : (
        children
      )}
    </motion.button>
  )
}

export const AnimatedIconButton = ({ 
  children, 
  className = '',
  onClick
}: { 
  children: ReactNode
  className?: string
  onClick?: () => void
}) => {
  return (
    <motion.button
      className={`
        rounded-full p-2 transition-all duration-300 ease-in-out
        hover:bg-gold-100 dark:hover:bg-gray-700
        ${className}
      `}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}