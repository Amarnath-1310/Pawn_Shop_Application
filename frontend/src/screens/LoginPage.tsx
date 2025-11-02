import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Mail, Smartphone } from 'lucide-react'
import { apiClient } from '../lib/apiClient'

import type { FormEvent } from 'react'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const location = useLocation() as Location & { state?: { email?: string; from?: { pathname: string } } }
  const [email, setEmail] = useState(location.state?.email || '')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpFromDev, setOtpFromDev] = useState<string | null>(null)

  const redirectPath = useMemo(() => location.state?.from?.pathname ?? '/dashboard', [location.state])

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem('auth') === 'true'
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true })
    }
  }, [navigate, redirectPath])

  const handleRequestOTP = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await apiClient.post('/auth/otp/request', {
        email: email.toLowerCase(),
        phone: phone || undefined,
      })

      if (response.data.message) {
        setOtpSent(true)
        setStep('verify')
        // In development, OTP is returned in response
        if (response.data.otp) {
          setOtpFromDev(response.data.otp)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('otp.requestFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await apiClient.post('/auth/otp/verify', {
        email: email.toLowerCase(),
        otp: otp,
      })

      if (response.data.token) {
        localStorage.setItem('auth', 'true')
        localStorage.setItem('token', response.data.token)
        navigate(redirectPath, { replace: true })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('otp.verificationFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setOtp('')
    setError('')
    setIsLoading(true)
    try {
      const response = await apiClient.post('/auth/otp/request', {
        email: email.toLowerCase(),
        phone: phone || undefined,
      })
      if (response.data.otp) {
        setOtpFromDev(response.data.otp)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('otp.requestFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'verify') {
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
            <button
              onClick={() => setStep('request')}
              className="mb-4 flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors"
            >
              <ArrowLeft size={16} />
              {t('otp.backToEmail')}
            </button>
            <h1 className="font-display text-2xl text-ink sm:text-3xl">{t('otp.verifyTitle')}</h1>
            <p className="mt-2 text-sm text-ink/70">
              {t('otp.verifySubtitle', { email })}
            </p>
          </motion.div>

          <motion.form
            className="space-y-4"
            onSubmit={handleVerifyOTP}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {otpFromDev && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 sm:px-4 sm:py-3"
              >
                <strong>{t('otp.devMode')}:</strong> {otpFromDev}
              </motion.div>
            )}

            <motion.div
              className="space-y-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink/70" htmlFor="otp">
                <Smartphone size={14} />
                {t('otp.otpLabel')}
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-center text-2xl font-bold text-ink tracking-widest shadow-inner focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 sm:px-4 sm:py-3 transition-all duration-300"
                placeholder="000000"
                maxLength={6}
                required
              />
              <p className="text-xs text-ink/60 mt-1">{t('otp.otpHint')}</p>
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

            <div className="space-y-2">
              <motion.button
                type="submit"
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-gold-500/30 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:from-gold-500 hover:to-gold-700 disabled:cursor-not-allowed disabled:bg-gold-300"
                disabled={isLoading || otp.length !== 6}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {isLoading ? t('otp.verifying') : t('otp.verify')}
              </motion.button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="w-full text-sm text-ink/60 hover:text-ink transition-colors disabled:opacity-50"
              >
                {t('otp.resend')}
              </button>
            </div>
          </motion.form>
        </motion.div>
      </div>
    )
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
          <button
            onClick={() => navigate('/signin')}
            className="mb-4 flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} />
            {t('login.backToSignIn')}
          </button>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{t('login.title')}</h1>
          <p className="mt-2 text-sm text-ink/70">
            {t('login.subtitle')}
          </p>
        </motion.div>

        <motion.form
          className="space-y-4"
          onSubmit={handleRequestOTP}
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
              {t('login.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm text-ink shadow-inner focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 sm:px-4 sm:py-2 transition-all duration-300"
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </motion.div>

          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink/70" htmlFor="phone">
              <Smartphone size={14} />
              {t('login.phoneLabel')} ({t('login.optional')})
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-gold-200 bg-cream px-3 py-2 text-sm text-ink shadow-inner focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200 sm:px-4 sm:py-2 transition-all duration-300"
              placeholder={t('login.phonePlaceholder')}
              disabled={isLoading}
            />
            <p className="text-xs text-ink/60 mt-1">{t('login.phoneHint')}</p>
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
            disabled={isLoading || !email}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {isLoading ? t('otp.sending') : t('otp.sendOTP')}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  )
}