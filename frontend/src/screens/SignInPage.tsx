import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Mail } from 'lucide-react'

export const SignInPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      navigate('/login', { state: { email: email.trim() } })
    }
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
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{t('signin.title')}</h1>
          <p className="mt-2 text-sm text-ink/70">
            {t('signin.subtitle')}
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
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink/70" htmlFor="email">
              <Mail size={14} />
              {t('signin.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm text-ink shadow-inner focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 sm:px-4 sm:py-2 transition-all duration-300"
              placeholder={t('signin.emailPlaceholder')}
              autoComplete="email"
              required
            />
          </motion.div>

          <motion.button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-gold-500/30 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:from-gold-500 hover:to-gold-700 disabled:cursor-not-allowed disabled:bg-gold-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <span>{t('signin.continue')}</span>
            <ArrowRight size={16} />
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  )
}

