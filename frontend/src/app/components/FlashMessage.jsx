import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'

const typeStyles = {
  success: {
    border: 'border-l-4 border-[#22C55E]',
    bg: 'bg-[#22C55E]/10 backdrop-blur-md',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    Icon: CheckCircle,
    color: 'text-[#22C55E]',
    progressBg: 'bg-[#22C55E]',
  },
  error: {
    border: 'border-l-4 border-[#EF4444]',
    bg: 'bg-[#EF4444]/10 backdrop-blur-md',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    Icon: AlertCircle,
    color: 'text-[#EF4444]',
    progressBg: 'bg-[#EF4444]',
  },
  info: {
    border: 'border-l-4 border-[#3B82F6]',
    bg: 'bg-[#3B82F6]/10 backdrop-blur-md',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    Icon: Info,
    color: 'text-[#3B82F6]',
    progressBg: 'bg-[#3B82F6]',
  },
  warning: {
    border: 'border-l-4 border-[#F59E0B]',
    bg: 'bg-[#F59E0B]/10 backdrop-blur-md',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    Icon: AlertTriangle,
    color: 'text-[#F59E0B]',
    progressBg: 'bg-[#F59E0B]',
  },
}

export function FlashMessage({ type, message, duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)
  const style = typeStyles[type]
  const { Icon } = style

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev - 100 / (duration / 100)
          if (next <= 0) {
            clearInterval(interval)
            handleClose()
            return 0
          }
          return next
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [duration])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`${style.border} ${style.bg} ${style.glow} rounded-xl p-4 flex items-start gap-3 relative overflow-hidden`}
        >
          <Icon className={`${style.color} flex-shrink-0 mt-0.5`} size={20} />
          <p className="text-[#F8FAFC] flex-1">{message}</p>
          <button
            onClick={handleClose}
            className="text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div className={`h-full ${style.progressBg}`} style={{ width: `${progress}%`, transition: 'width 0.1s' }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function FlashMessageContainer({ messages, onDismiss }) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 space-y-2">
      {messages.map((msg) => (
        <FlashMessage
          key={msg.id}
          type={msg.type}
          message={msg.message}
          onClose={() => onDismiss(msg.id)}
        />
      ))}
    </div>
  )
}
