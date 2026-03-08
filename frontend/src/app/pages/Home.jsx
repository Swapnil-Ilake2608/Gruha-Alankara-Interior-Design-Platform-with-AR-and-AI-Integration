import { Link } from 'react-router-dom'
import {
  Scan,
  Sparkles,
  Box,
  Maximize2,
  DollarSign,
  Camera,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'motion/react'
import ImageWithFallback from '../components/figma/ImageWithFallback.jsx'
import { toolCards, designStyles } from '../../data/index.js'

const iconMap = { Scan, Sparkles, Box, Maximize2, DollarSign, Camera }

export default function Home() {
  const mapStyleForAnalyze = (name) => {
    const value = String(name || '').toLowerCase()
    if (value.includes('modern')) return 'Modern'
    if (value.includes('scandinavian')) return 'Scandinavian'
    if (value.includes('industrial')) return 'Industrial'
    if (value.includes('bohemian')) return 'Bohemian'
    if (value.includes('contemporary')) return 'Contemporary'
    if (value.includes('classic')) return 'Classic'
    if (value.includes('minimal')) return 'Minimalist'
    return 'Modern'
  }

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
          >
            Transform Your Space with{' '}
            <span className="bg-gradient-to-r from-[#A78BFA] via-[#7C3AED] to-[#A78BFA] bg-clip-text text-transparent animate-gradient">
              AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-[#CBD5E1] mb-10 max-w-3xl mx-auto"
          >
            Personalized interior designs powered by intelligent agents
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/analyze"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all duration-300 flex items-center gap-2"
            >
              <span>Start Designing</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/design-style"
              className="px-8 py-4 rounded-xl border-2 border-[#7C3AED] text-[#F8FAFC] hover:bg-[#7C3AED]/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all duration-300"
            >
              Learn More
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Intelligent Design Tools
          </h2>
          <p className="text-[#94A3B8] text-center mb-12 max-w-2xl mx-auto">
            Powerful AI-driven features to help you create the perfect interior design
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolCards.map((tool, index) => {
              const Icon = iconMap[tool.icon]
              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={tool.link} className="group block h-full">
                    <div className="h-full p-6 rounded-2xl bg-[rgba(30,41,59,0.4)] backdrop-blur-md border border-[rgba(148,163,184,0.2)] hover:border-[#7C3AED] hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all duration-300 hover:-translate-y-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all">
                        <Icon className="text-white" size={24} />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-[#F8FAFC]">{tool.title}</h3>
                      <p className="text-[#94A3B8] mb-4">{tool.description}</p>
                      <div className="flex items-center gap-2 text-[#A78BFA] group-hover:gap-3 transition-all">
                        <span>Explore</span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Design Styles Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Popular Design Styles
          </h2>
          <p className="text-[#94A3B8] text-center mb-12 max-w-2xl mx-auto">
            Explore trending interior design styles and find your perfect aesthetic
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {designStyles.map((style, index) => (
              <motion.div
                key={style.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
              >
                <ImageWithFallback
                  src={style.image}
                  alt={style.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{style.name}</h3>
                  <Link
                    to={`/design-style?style=${encodeURIComponent(mapStyleForAnalyze(style.name))}`}
                    onClick={() => localStorage.setItem('preferred_style', mapStyleForAnalyze(style.name))}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 w-fit opacity-100"
                  >
                    <span>Select Style</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="absolute inset-0 rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0)] group-hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-shadow duration-300 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#7C3AED]/20 to-[#3B82F6]/20 backdrop-blur-md border border-[rgba(148,163,184,0.2)] shadow-[0_0_40px_rgba(124,58,237,0.3)]"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Transform Your Space?
            </h2>
            <p className="text-[#CBD5E1] mb-8 text-lg">
              Start your interior design journey with AI-powered tools today
            </p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all duration-300"
            >
              <span>Get Started Free</span>
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}


