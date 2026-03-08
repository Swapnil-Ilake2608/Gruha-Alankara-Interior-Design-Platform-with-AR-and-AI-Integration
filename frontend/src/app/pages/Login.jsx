import { useState } from 'react'
import { motion } from 'motion/react'
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', name: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isLogin) {
        const response = await api.post('/login', {
          email: formData.email,
          password: formData.password,
        })

        const email = formData.email.trim().toLowerCase()
        const mappedName = localStorage.getItem(`user_name_${email}`)
        const fallbackName = email.split('@')[0] || 'User'

        localStorage.setItem('token', response.data.access_token)
        localStorage.setItem('user_id', String(response.data.user_id || '1'))
        localStorage.setItem('user_email', email)
        localStorage.setItem('user_name', mappedName || fallbackName)

        navigate('/')
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }

        await api.post('/register', {
          username: formData.name,
          email: formData.email,
          password: formData.password,
        })

        const email = formData.email.trim().toLowerCase()
        localStorage.setItem(`user_name_${email}`, formData.name.trim() || email.split('@')[0])

        setIsLogin(true)
        setFormData({ ...formData, password: '', confirmPassword: '' })
        alert('Account created! Please sign in.')
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth = () => {
    setError('OAuth is not configured yet. Please use email/password login.')
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const Spinner = () => (
    <svg className="animate-spin" style={{ width: 20, height: 20, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24">
      <circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#0B1120] via-[#0F172A] to-[#111827]">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.02, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-4 bg-gradient-to-r from-[#7C3AED] via-[#3B82F6] to-[#7C3AED] opacity-20 blur-3xl rounded-full"
            />
            <div className="relative p-12 rounded-3xl bg-[rgba(30,41,59,0.4)] backdrop-blur-md border border-[rgba(148,163,184,0.2)] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
              <Sparkles className="w-16 h-16 text-[#7C3AED] mb-6" />
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent">
                Gruha Alankara
              </h1>
              <p className="text-xl text-[#CBD5E1] mb-8">Transform your space with AI-powered interior design</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <div className="p-8 sm:p-12 rounded-3xl bg-[rgba(30,41,59,0.4)] backdrop-blur-md border border-[rgba(148,163,184,0.2)] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              <p className="text-[#94A3B8]">{isLogin ? 'Sign in to continue to your designs' : 'Start your interior design journey'}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required={!isLogin}
                    className="w-full px-4 py-3 rounded-xl bg-[rgba(15,23,42,0.6)] border border-[rgba(148,163,184,0.2)] text-[#F8FAFC]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 pl-11 rounded-xl bg-[rgba(15,23,42,0.6)] border border-[rgba(148,163,184,0.2)] text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 pl-11 pr-11 rounded-xl bg-[rgba(15,23,42,0.6)] border border-[rgba(148,163,184,0.2)] text-[#F8FAFC]"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-[#CBD5E1] mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required={!isLogin}
                      className="w-full px-4 py-3 pl-11 rounded-xl bg-[rgba(15,23,42,0.6)] border border-[rgba(148,163,184,0.2)] text-[#F8FAFC]"
                    />
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <><Spinner /><span>Processing...</span></> : (isLogin ? 'Sign In' : 'Create Account')}
              </motion.button>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={handleOAuth} disabled={isLoading} className="px-4 py-3 rounded-xl border border-[rgba(148,163,184,0.2)] text-[#F8FAFC]">
                  Google
                </button>
                <button type="button" onClick={handleOAuth} disabled={isLoading} className="px-4 py-3 rounded-xl border border-[rgba(148,163,184,0.2)] text-[#F8FAFC]">
                  GitHub
                </button>
              </div>

              <div className="text-center pt-4">
                <p className="text-[#94A3B8]">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[#7C3AED] font-semibold">
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

