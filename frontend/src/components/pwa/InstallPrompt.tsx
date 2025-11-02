import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const InstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isInWebAppiOS)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay if not dismissed before
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        if (!dismissed) {
          setShowPrompt(true)
        }
      }, 3000)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      if (outcome === 'accepted') {
        setShowPrompt(false)
        setInstallPrompt(null)
      }
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already installed or no install prompt available
  if (isInstalled || !installPrompt || !showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="rounded-xl border border-gold-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-gold-500 p-1.5">
                  <span className="text-sm font-semibold text-white">PB</span>
                </div>
                <h3 className="font-semibold text-ink dark:text-white">Install PawnShop</h3>
              </div>
              <p className="mt-2 text-sm text-ink/70 dark:text-gray-300">
                Install our app for quick access and offline features
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleInstall}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-600"
            >
              <Download size={16} />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Not now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}