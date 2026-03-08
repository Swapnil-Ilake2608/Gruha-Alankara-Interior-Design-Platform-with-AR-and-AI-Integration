import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Palette } from 'lucide-react'
import ImageWithFallback from '../components/figma/ImageWithFallback.jsx'
import { designStyles } from '../../data/index.js'

function normalizeStyle(raw) {
  const value = String(raw || '').trim().toLowerCase()
  if (!value) return 'Modern'
  if (value.includes('scandinavian')) return 'Scandinavian'
  if (value.includes('industrial')) return 'Industrial'
  if (value.includes('bohemian')) return 'Bohemian'
  if (value.includes('contemporary')) return 'Contemporary'
  if (value.includes('classic')) return 'Classic'
  if (value.includes('minimal')) return 'Minimalist'
  if (value.includes('vastu')) return 'Vastu Calm'
  if (value.includes('jaipur')) return 'Jaipur Heritage'
  if (value.includes('coastal')) return 'Coastal India'
  if (value.includes('modern')) return 'Modern'
  return 'Modern'
}

export default function DesignStyle() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const styleFromQuery = normalizeStyle(params.get('style') || '')
  const regionalStylePacks = [
    { name: 'Vastu Calm', description: 'Vastu-aware spacing with warm wood and brass accents.' },
    { name: 'Jaipur Heritage', description: 'Carved wood, jaali details, and royal earthy tones.' },
    { name: 'Coastal India', description: 'Airy cane textures with coastal blue and light neutrals.' },
  ]

  return (
    <div className="min-h-screen py-12 px-4 bg-[#0B1120] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Design Style</h1>
          <p className="text-slate-300 mt-3 max-w-2xl">
            Choose your preferred style. You can continue with AI analysis or apply the style directly without AI.
          </p>
        </div>

        <div className="mb-8 p-5 rounded-2xl border border-[#7C3AED]/40 bg-[#7C3AED]/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Palette className="text-[#A78BFA]" />
            <p className="text-slate-100">Current selected style: <span className="font-semibold">{styleFromQuery}</span></p>
          </div>
          <div className="flex gap-3">
            <Link
              to={`/analyze?style=${encodeURIComponent(styleFromQuery)}`}
              onClick={() => localStorage.setItem('preferred_style', styleFromQuery)}
              className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors"
            >
              Analyze Room
            </Link>
            <Link
              to={`/studio?style=${encodeURIComponent(styleFromQuery)}&mode=no-ai`}
              onClick={() => localStorage.setItem('preferred_style', styleFromQuery)}
              className="px-5 py-2.5 rounded-xl border border-[#7C3AED] hover:bg-[#7C3AED]/20 transition-colors"
            >
              Apply Without AI
            </Link>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {regionalStylePacks.map((pack) => (
            <div key={pack.name} className="p-4 rounded-xl border border-[#7C3AED]/40 bg-slate-900">
              <h3 className="font-semibold text-lg">{pack.name}</h3>
              <p className="text-slate-300 text-sm mt-2">{pack.description}</p>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/studio?style=${encodeURIComponent(pack.name)}&mode=no-ai`}
                  onClick={() => localStorage.setItem('preferred_style', pack.name)}
                  className="px-3 py-1.5 rounded-lg border border-[#7C3AED] hover:bg-[#7C3AED]/20 text-sm"
                >
                  Apply Without AI
                </Link>
                <Link
                  to={`/analyze?style=${encodeURIComponent(pack.name)}`}
                  onClick={() => localStorage.setItem('preferred_style', pack.name)}
                  className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-sm"
                >
                  Analyze with AI
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designStyles.map((style, index) => {
            const mapped = normalizeStyle(style.name)
            const active = mapped === styleFromQuery
            return (
              <motion.div
                key={style.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className={`rounded-2xl overflow-hidden border ${active ? 'border-[#A78BFA]' : 'border-slate-700'} bg-slate-900`}
              >
                <div className="relative aspect-[4/3]">
                  <ImageWithFallback src={style.image} alt={style.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-2xl font-semibold">{style.name}</h3>
                </div>

                <div className="p-4 flex items-center justify-between gap-3">
                  <Link
                    to={`/design-style?style=${encodeURIComponent(mapped)}`}
                    onClick={() => localStorage.setItem('preferred_style', mapped)}
                    className="text-[#A78BFA] hover:text-[#C4B5FD]"
                  >
                    Select Style
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/studio?style=${encodeURIComponent(mapped)}&mode=no-ai`}
                      onClick={() => localStorage.setItem('preferred_style', mapped)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#7C3AED] hover:bg-[#7C3AED]/20 transition-colors"
                    >
                      Without AI
                    </Link>
                    <Link
                      to={`/analyze?style=${encodeURIComponent(mapped)}`}
                      onClick={() => localStorage.setItem('preferred_style', mapped)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      With AI <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}




