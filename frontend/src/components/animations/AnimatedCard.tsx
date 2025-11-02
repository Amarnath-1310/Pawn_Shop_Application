import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  onClick?: () => void
}

export const AnimatedCard = ({ 
  children, 
  className = '', 
  delay = 0, 
  hover = true,
  onClick 
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={hover ? { 
        y: -5, 
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      } : undefined}
      className={`
        rounded-2xl border border-gold-200 bg-white/80 p-4 shadow-sm backdrop-blur
        dark:border-gray-700 dark:bg-gray-800/80 transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

export const MetricCard = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  delay = 0,
  color = 'gold'
}: {
  icon: ReactNode
  title: string
  value: string | number
  subtitle: string
  delay?: number
  color?: 'gold' | 'emerald' | 'red' | 'blue'
}) => {
  const colorClasses = {
    gold: 'text-gold-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    blue: 'text-blue-600'
  }

  return (
    <AnimatedCard delay={delay} className="sm:p-5">
      <motion.div 
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.2, duration: 0.4 }}
      >
        <div className={colorClasses[color]}>
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/60 dark:text-gray-300">
          {title}
        </p>
      </motion.div>
      
      <motion.p 
        className={`mt-3 text-2xl font-bold sm:text-3xl ${colorClasses[color]}`}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.4, duration: 0.5, type: 'spring' }}
      >
        {value}
      </motion.p>
      
      <motion.p 
        className="mt-2 text-xs text-ink/60 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.6, duration: 0.4 }}
      >
        {subtitle}
      </motion.p>
    </AnimatedCard>
  )
}

export const AnimatedTable = ({ children, className = '' }: { children: ReactNode, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`overflow-hidden rounded-2xl border border-gold-100 dark:border-gray-700 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export const AnimatedTableRow = ({ children, delay = 0, className = '' }: { 
  children: ReactNode
  delay?: number
  className?: string 
}) => {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ backgroundColor: 'rgba(251, 191, 36, 0.05)' }}
      className={`transition-colors duration-200 ${className}`}
    >
      {children}
    </motion.tr>
  )
}