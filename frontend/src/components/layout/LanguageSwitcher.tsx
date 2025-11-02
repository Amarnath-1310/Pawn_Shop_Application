import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import { useState } from 'react'

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en', label: t('language.english'), native: 'English' },
    { code: 'ta', label: t('language.tamil'), native: 'தமிழ்' },
  ]

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-gold-300 px-2.5 py-1.5 text-xs font-medium text-gold-700 transition-all duration-300 hover:bg-gold-50 hover:scale-105 dark:border-gold-500 dark:text-gold-300 dark:hover:bg-gold-900/20 sm:px-3 sm:py-2 sm:text-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t('language.selectLanguage')}
      >
        <Globe size={14} className="sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">{currentLanguage.native}</span>
        <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
      </motion.button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full z-20 mt-2 min-w-[140px] rounded-xl border border-gold-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl ${
                  i18n.language === lang.code
                    ? 'bg-gold-50 font-semibold text-gold-700 dark:bg-gold-900/20 dark:text-gold-400'
                    : 'text-ink hover:bg-gold-50/50 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{lang.native}</span>
                  {i18n.language === lang.code && (
                    <span className="text-gold-600">✓</span>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}

