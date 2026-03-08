import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Scan, Palette, FolderHeart, Menu, X, User } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const navLinks = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Analyze Room', path: '/analyze', icon: Scan },
  { name: 'Design Studio', path: '/studio', icon: Palette },
  { name: 'My Catalog', path: '/catalog', icon: FolderHeart },
]

function getDisplayName() {
  const token = localStorage.getItem('token')
  if (!token) return ''

  const userName = localStorage.getItem('user_name')
  if (userName?.trim()) return userName.trim()

  const email = localStorage.getItem('user_email') || ''
  return email.includes('@') ? email.split('@')[0] : 'User'
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const location = useLocation()

  useEffect(() => {
    const syncUser = () => setDisplayName(getDisplayName())
    syncUser()
    window.addEventListener('storage', syncUser)
    window.addEventListener('focus', syncUser)
    return () => {
      window.removeEventListener('storage', syncUser)
      window.removeEventListener('focus', syncUser)
    }
  }, [])

  const loginLabel = displayName || 'Login'

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[rgba(15,23,42,0.8)] border-b border-[rgba(148,163,184,0.2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] bg-clip-text text-transparent">
                Gruha Alankara
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path
                const Icon = link.icon
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                      isActive
                        ? 'text-[#F8FAFC] bg-gradient-to-r from-[#7C3AED]/20 to-[#A78BFA]/20 shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                        : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{link.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#7C3AED]/10 to-[#A78BFA]/10 border border-[#7C3AED]/30"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link
                to={displayName ? "/profile" : "/login"}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300"
                title={displayName ? `Logged in as ${displayName}` : 'Login'}
              >
                <User size={18} />
                <span className="max-w-[140px] truncate">{loginLabel}</span>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm backdrop-blur-xl bg-[rgba(15,23,42,0.95)] border-l border-[rgba(148,163,184,0.2)] md:hidden"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-end mb-8">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[#CBD5E1] hover:text-[#F8FAFC] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#7C3AED]/20 to-[#A78BFA]/20 text-[#F8FAFC] shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                          : 'text-[#CBD5E1] hover:bg-white/5 hover:text-[#F8FAFC]'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-lg">{link.name}</span>
                    </Link>
                  )
                })}
              </div>

              <div className="mt-auto">
                <Link
                  to={displayName ? "/profile" : "/login"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300"
                >
                  <User size={20} />
                  <span className="truncate">{loginLabel}</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>
    </>
  )
}

