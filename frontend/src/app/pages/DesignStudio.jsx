import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Volume2, Palette, Box, Layout, Send, Mic, MessageCircle, X, Download, Save, Camera, Ruler, ShoppingCart, Receipt } from 'lucide-react'
import api from '../../api'
import ARFurniturePreview from '../components/ARFurniturePreview.jsx'

function clamp01(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return 0.5
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}
function normalizeStyleName(raw) {
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

function createStylePreview(style) {
  const presets = {
    Modern: {
      colors: ['#D9D9D9', '#A6A6A6', '#6F6F6F'],
      furniture: [
        { item: 'modular sofa', style: 'modern', color: '#A6A6A6' },
        { item: 'glass coffee table', style: 'clean-lined', color: '#D9D9D9' },
        { item: 'floor lamp', style: 'sleek', color: '#6F6F6F' },
      ],
      tip: 'Keep open circulation and use layered warm-white lighting.',
    },
    Minimalist: {
      colors: ['#E5E7EB', '#CFCFCF', '#8D99AE'],
      furniture: [
        { item: 'platform bed', style: 'minimal', color: '#CFCFCF' },
        { item: 'floating shelf', style: 'clean', color: '#8D99AE' },
        { item: 'accent chair', style: 'low-profile', color: '#E5E7EB' },
      ],
      tip: 'Use fewer pieces with clear edges and hidden storage.',
    },
    Scandinavian: {
      colors: ['#F1EFE8', '#D9CEB8', '#9CA3AF'],
      furniture: [
        { item: 'oak dining table', style: 'scandinavian', color: '#D9CEB8' },
        { item: 'fabric sofa', style: 'cozy', color: '#F1EFE8' },
        { item: 'open bookshelf', style: 'light-wood', color: '#9CA3AF' },
      ],
      tip: 'Prioritize natural textures and daylight-friendly tones.',
    },
    Industrial: {
      colors: ['#4B5563', '#1F2937', '#9A7B4F'],
      furniture: [
        { item: 'metal frame bed', style: 'industrial', color: '#4B5563' },
        { item: 'wood-metal desk', style: 'loft', color: '#9A7B4F' },
        { item: 'pipe bookshelf', style: 'raw', color: '#1F2937' },
      ],
      tip: 'Blend matte black metals with warm reclaimed wood accents.',
    },
    Bohemian: {
      colors: ['#C08457', '#7C3AED', '#F5DEB3'],
      furniture: [
        { item: 'rattan chair', style: 'boho', color: '#C08457' },
        { item: 'carved side table', style: 'artisan', color: '#F5DEB3' },
        { item: 'floor pouf', style: 'textured', color: '#7C3AED' },
      ],
      tip: 'Mix layered textiles, plants, and handcrafted decor pieces.',
    },
    Contemporary: {
      colors: ['#CBD5E1', '#94A3B8', '#334155'],
      furniture: [
        { item: 'sectional sofa', style: 'contemporary', color: '#CBD5E1' },
        { item: 'media console', style: 'streamlined', color: '#334155' },
        { item: 'accent table', style: 'curved', color: '#94A3B8' },
      ],
      tip: 'Balance bold statement pieces with neutral background tones.',
    },
    'Vastu Calm': {
      colors: ['#F5E9DA', '#A16207', '#2E5E4E'],
      furniture: [
        { item: 'wooden mandir unit', style: 'vastu', color: '#A16207' },
        { item: 'solid wood sofa set', style: 'traditional', color: '#F5E9DA' },
        { item: 'brass floor lamp', style: 'heritage', color: '#2E5E4E' },
      ],
      tip: 'Keep north-east zone clutter free and use warm natural wood tones.',
    },
    'Jaipur Heritage': {
      colors: ['#8B4513', '#D4AF37', '#F2E7D5'],
      furniture: [
        { item: 'carved jhoola chair', style: 'rajasthani', color: '#8B4513' },
        { item: 'inlay center table', style: 'heritage', color: '#D4AF37' },
        { item: 'jaali partition', style: 'artisan', color: '#F2E7D5' },
      ],
      tip: 'Blend carved wood, brass accents, and neutral walls for heritage depth.',
    },
    'Coastal India': {
      colors: ['#E0F2F1', '#0284C7', '#D6D3D1'],
      furniture: [
        { item: 'cane lounge chair', style: 'coastal', color: '#E0F2F1' },
        { item: 'teak coffee table', style: 'natural', color: '#D6D3D1' },
        { item: 'linen sofa', style: 'airy', color: '#0284C7' },
      ],
      tip: 'Use breathable fabrics, cane textures, and ocean-inspired blue accents.',
    },
    Classic: {
      colors: ['#E5D3B3', '#8B5E3C', '#5B4B3A'],
      furniture: [
        { item: 'tufted sofa', style: 'classic', color: '#E5D3B3' },
        { item: 'wooden wardrobe', style: 'ornate', color: '#8B5E3C' },
        { item: 'side cabinet', style: 'vintage', color: '#5B4B3A' },
      ],
      tip: 'Use symmetrical layouts and warm ambient lamps for elegance.',
    },
  }

  const picked = presets[style] || presets.Modern
  const ar_overlay = picked.furniture.slice(0, 3).map((f, i) => ({
    item: f.item,
    x: [0.24, 0.5, 0.76][i] ?? 0.5,
    y: 0.15,
    z: [0.72, 0.64, 0.74][i] ?? 0.7,
    scale: 1,
    anchor: 'auto',
  }))

  return {
    id: `style-preview-${style.toLowerCase()}`,
    user_id: Number(localStorage.getItem('user_id') || '1'),
    style_theme: style,
    image_path: null,
    ai_output: {
      theme_applied: style,
      color_palette: picked.colors,
      furniture_recommendations: picked.furniture,
      lighting_suggestion: picked.tip,
      ar_overlay,
    },
  }
}

function estimateFootprintSqFt(itemName) {
  const n = String(itemName || '').toLowerCase()
  if (n.includes('sofa')) return 28
  if (n.includes('bed')) return 36
  if (n.includes('wardrobe')) return 16
  if (n.includes('table') || n.includes('desk')) return 14
  if (n.includes('chair')) return 8
  if (n.includes('bookshelf') || n.includes('partition')) return 10
  if (n.includes('lamp')) return 3
  return 12
}
export default function DesignStudio() {
  const location = useLocation()
  const [designData, setDesignData] = useState(null)
  const [buddyOpen, setBuddyOpen] = useState(false)
  const [buddyLang, setBuddyLang] = useState('en')
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [messages, setMessages] = useState([])
  const [actionMessage, setActionMessage] = useState('')
  const [toolAutoOpened, setToolAutoOpened] = useState(false)
  const [stageSlider, setStageSlider] = useState(58)
  const [roomLength, setRoomLength] = useState('14')
  const [roomWidth, setRoomWidth] = useState('10')
  const [fitReport, setFitReport] = useState(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState(null)

  const [arOpen, setArOpen] = useState(false)
  const [arStarting, setArStarting] = useState(false)
  const [arError, setArError] = useState('')
  const [selectedArItemId, setSelectedArItemId] = useState('')
  const [arAnchors, setArAnchors] = useState({})
  const [arItemScales, setArItemScales] = useState({})
  const [arTapToPlace, setArTapToPlace] = useState(false)
  const [arWebXRSupported, setArWebXRSupported] = useState(false)

  const recognitionRef = useRef(null)
  const arVideoRef = useRef(null)
  const arStreamRef = useRef(null)
  const arSurfaceRef = useRef(null)
  const arDragRef = useRef({
    dragging: false,
    moved: false,
    startClientX: 0,
    startClientY: 0,
    startAnchorX: 0.5,
    startAnchorY: 0.75,
  })
  const arPinchRef = useRef({
    active: false,
    startDistance: 0,
    startScale: 1,
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const hasStyleQuery = params.has('style')
    const styleFromQuery = normalizeStyleName(params.get('style') || '')

    const tool = (params.get('tool') || '').toLowerCase()
    const mode = (params.get('mode') || '').toLowerCase()
    const toolMessages = {
      optimizer: 'Furniture optimizer is ready with layout-focused suggestions.',
      budget: 'Budget planner is ready with estimated category split.',
      '3d': '3D visualization mode is ready. Open Live AR Camera for immersive preview.',
      ar: 'Live AR Camera mode selected.',
    }
    if (toolMessages[tool]) {
      setActionMessage(toolMessages[tool])
      setTimeout(() => setActionMessage(''), 2800)
    } else if (mode === 'no-ai') {
      setActionMessage('Manual styling mode enabled (no AI analysis).')
      setTimeout(() => setActionMessage(''), 2800)
    }

    if (hasStyleQuery) {
      localStorage.setItem('preferred_style', styleFromQuery)
      setDesignData(createStylePreview(styleFromQuery))
      return
    }

    const saved = localStorage.getItem('lastDesignResult')
    if (saved) {
      setDesignData(JSON.parse(saved))
      return
    }

    const preferred = localStorage.getItem('preferred_style')
    if (preferred) {
      setDesignData(createStylePreview(normalizeStyleName(preferred)))
      return
    }

    setDesignData(createStylePreview('Modern'))
  }, [location.search])

  useEffect(() => {
    return () => {
      if (arStreamRef.current) {
        arStreamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const detectXR = async () => {
      try {
        if (!navigator.xr || !navigator.xr.isSessionSupported) return
        const supported = await navigator.xr.isSessionSupported('immersive-ar')
        if (mounted) setArWebXRSupported(Boolean(supported))
      } catch {
        if (mounted) setArWebXRSupported(false)
      }
    }
    detectXR()
    return () => {
      mounted = false
    }
  }, [])


  const aiOutput = designData?.ai_output || {}
  const mediaUrl = designData?.image_path ? `http://localhost:8000/${designData.image_path}` : null
  const mediaPath = String(designData?.image_path || "").toLowerCase()
  const isVideoMedia = /\.(mp4|webm|mov|avi|mkv)$/.test(mediaPath)

  const colorPalette = Array.isArray(aiOutput.color_palette)
    ? aiOutput.color_palette
    : ['#1E293B', '#7C3AED', '#F8FAFC']

  const rawFurniture = Array.isArray(aiOutput.furniture_recommendations)
    ? aiOutput.furniture_recommendations
    : (aiOutput.furniture_recommendations && typeof aiOutput.furniture_recommendations === 'object')
      ? Object.values(aiOutput.furniture_recommendations)
      : []

  const furnitureRecommendations = rawFurniture.map((entry) => {
    if (typeof entry === 'string') {
      return { item: entry, style: aiOutput.theme_applied || 'Modern', color: 'Neutral' }
    }
    if (entry && typeof entry === 'object') {
      return {
        item: entry.item || entry.name || entry.furniture || 'Furniture Item',
        style: entry.style || entry.theme || aiOutput.theme_applied || 'Style',
        color: entry.color || entry.shade || entry.finish || 'Color',
      }
    }
    return { item: 'Furniture Item', style: 'Style', color: 'Color' }
  })

  const arOverlayItems = useMemo(() => {
    const overlay = Array.isArray(aiOutput.ar_overlay) ? aiOutput.ar_overlay : []
    if (overlay.length > 0) {
      return overlay.map((o, i) => ({
        id: `${o.item || 'item'}-${i}`,
        item: o.item || `Item ${i + 1}`,
        anchor: o.anchor || 'center',
        x: clamp01(o.x ?? 0.5),
        y: clamp01(0.15 + (o.y ?? 0) * 0.2),
        z: clamp01(o.z ?? 0.5),
        scale: Number(o.scale || 1),
      }))
    }

    const fallback = furnitureRecommendations.slice(0, 4)
    const slots = [
      { x: 0.2, z: 0.72 },
      { x: 0.5, z: 0.62 },
      { x: 0.78, z: 0.7 },
      { x: 0.35, z: 0.82 },
    ]
    return fallback.map((f, i) => ({
      id: `${f.item}-${i}`,
      item: f.item,
      anchor: 'auto',
      x: slots[i]?.x ?? 0.5,
      y: 0.15,
      z: slots[i]?.z ?? 0.7,
      scale: 1,
    }))
  }, [aiOutput.ar_overlay, furnitureRecommendations])

  useEffect(() => {
    if (!arOverlayItems.length) {
      setSelectedArItemId('')
      return
    }
    setSelectedArItemId((prev) =>
      arOverlayItems.some((item) => item.id === prev) ? prev : arOverlayItems[0].id
    )
  }, [arOverlayItems])


  const colorNameFromHex = (hex) => {
    if (typeof hex !== 'string') return 'Color'
    const normalized = hex.trim().toUpperCase()
    const named = {
      '#FFFFFF': 'White', '#F8FAFC': 'Snow White', '#E2E8F0': 'Cool Gray', '#CBD5E1': 'Silver Mist',
      '#94A3B8': 'Slate Gray', '#64748B': 'Steel Blue Gray', '#475569': 'Slate', '#334155': 'Charcoal Blue',
      '#1E293B': 'Midnight Blue', '#111827': 'Deep Navy', '#000000': 'Black', '#7C3AED': 'Violet',
      '#A78BFA': 'Lavender', '#3B82F6': 'Royal Blue', '#10B981': 'Emerald', '#F59E0B': 'Amber',
      '#EF4444': 'Crimson', '#22C55E': 'Green', '#8B5E3C': 'Walnut Brown', '#D4AF37': 'Gold',
      '#C0C0C0': 'Silver', '#808080': 'Gray', '#FFFDD0': 'Cream', '#FAEBD7': 'Antique White',
      '#D2B48C': 'Tan', '#556B2F': 'Olive Green', '#800020': 'Burgundy',
    }
    return named[normalized] || `Shade ${normalized}`
  }

  const lightingSuggestion =
    typeof aiOutput.lighting_suggestion === 'string' ? aiOutput.lighting_suggestion : 'No lighting tip available.'

  const placementSuggestions = Array.isArray(aiOutput.placement_suggestions)
    ? aiOutput.placement_suggestions
    : []

  const budgetEstimate = useMemo(() => {
    const furnitureCost = Math.max(18000, furnitureRecommendations.length * 12000)
    const decorCost = Math.round(furnitureCost * 0.22)
    const lightingCost = Math.round(furnitureCost * 0.14)
    const laborCost = Math.round(furnitureCost * 0.12)
    const total = furnitureCost + decorCost + lightingCost + laborCost
    return {
      total,
      rows: [
        { label: 'Furniture', value: furnitureCost },
        { label: 'Decor', value: decorCost },
        { label: 'Lighting', value: lightingCost },
        { label: 'Labor', value: laborCost },
      ],
    }
  }, [furnitureRecommendations])
  const baselineBudget = Math.round(budgetEstimate.total * 0.78)
  const canRunPurchase = Number.isFinite(Number(designData?.id)) && !String(designData?.id || '').startsWith('style-preview-')
  const budgetDelta = budgetEstimate.total - baselineBudget

  const runFitCheck = () => {
    const length = Number(roomLength)
    const width = Number(roomWidth)
    if (!length || !width || length <= 0 || width <= 0) {
      setFitReport({ ok: false, message: 'Enter valid room dimensions in feet.' })
      return
    }

    const roomArea = length * width
    const neededArea = furnitureRecommendations.reduce((sum, item) => sum + estimateFootprintSqFt(item.item), 0)
    const utilization = Math.round((neededArea / Math.max(roomArea, 1)) * 100)
    const ok = utilization <= 68

    setFitReport({
      ok,
      roomArea,
      neededArea,
      utilization,
      message: ok ? 'Fit check passed. Layout should be comfortable.' : 'Fit warning: room may feel crowded. Remove 1-2 large items.',
    })
  }

  const oneTapPurchase = async () => {
    if (!canRunPurchase) return
    setPurchaseLoading(true)
    try {
      const { data } = await api.post(`/purchase/one-tap/${designData.id}`)
      setPurchaseResult(data)
      setActionMessage(`Purchase flow complete: ${data?.bookings?.length || 0} booking(s) confirmed.`)
      setTimeout(() => setActionMessage(''), 3200)
    } catch (error) {
      setActionMessage('Purchase flow failed. Please try again.')
      setTimeout(() => setActionMessage(''), 2800)
      console.error(error)
    } finally {
      setPurchaseLoading(false)
    }
  }

  const speechLang = useMemo(() => {
    if (buddyLang === 'hi') return 'hi-IN'
    if (buddyLang === 'te') return 'te-IN'
    return 'en-IN'
  }, [buddyLang])

  const speak = (text) => {
    if (!window.speechSynthesis || !text) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = speechLang
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const buddyCopy = {
    en: {
      unavailable: 'Buddy could not respond right now. Please try again.',
      greet: 'Hi, I am Buddy. Ask me for recommendations or say book now.',
      manual: 'You are in manual style mode. Buddy chat needs an analyzed design. Use "With AI" to enable full chat.',
    },
    hi: {
      unavailable: 'Buddy abhi reply nahi de pa raha hai. Kripya dobara try karein.',
      greet: 'Namaste, main Buddy hoon. Recommendations ke liye puchhiye ya "book now" boliye.',
      manual: 'Aap manual style mode mein hain. Buddy chat ke liye analyzed design chahiye. Full chat ke liye "With AI" use karein.',
    },
    te: {
      unavailable: 'Buddy ippudu respond cheyyaledu. Dayachesi malli prayatninchandi.',
      greet: 'Namaskaram, nenu Buddy ni. Recommendations kosam adagandi leda "book now" ani cheppandi.',
      manual: 'Meeru manual style mode lo unnaru. Buddy chat ki analyzed design kavali. Full chat kosam "With AI" vadandi.',
    },
  }

  const tBuddy = (lang, key) => (buddyCopy[lang] || buddyCopy.en)[key] || buddyCopy.en[key]

  const addMessage = (role, text, suggestedActions = []) => {
    setMessages((prev) => [...prev, { role, text, suggestedActions, id: `${Date.now()}-${Math.random()}` }])
  }

  const sendBuddyMessage = async (messageText) => {
    const text = messageText.trim()
    if (!text) return

    addMessage('user', text)

    if (!canRunPurchase) {
      const localReply = tBuddy(buddyLang, 'manual')
      addMessage('assistant', localReply, [])
      speak(localReply)
      return
    }

    setChatLoading(true)
    try {
      const payload = {
        user_id: Number(localStorage.getItem('user_id') || designData.user_id || '1'),
        design_id: designData.id,
        message: text,
        lang: buddyLang,
        auto_book: true,
      }

      const { data } = await api.post('/buddy/chat', payload)
      addMessage('assistant', data.reply, data.suggested_actions || ['show recommendations', 'book now'])
      speak(data.reply)
    } catch (error) {
      const fallback = tBuddy(buddyLang, 'unavailable')
      addMessage('assistant', fallback, ['show recommendations', 'book now'])
      speak(fallback)
      console.error(error)
    } finally {
      setChatLoading(false)
    }
  }

  const startBuddySession = async (langOverride = buddyLang) => {
    if (!canRunPurchase) {
      const localReply = tBuddy(langOverride, 'manual')
      addMessage('assistant', localReply, [])
      speak(localReply)
      return
    }

    setChatLoading(true)
    try {
      const payload = {
        user_id: Number(localStorage.getItem('user_id') || designData?.user_id || '1'),
        design_id: designData?.id,
        message: '__start__',
        lang: langOverride,
        auto_book: true,
      }
      const { data } = await api.post('/buddy/chat', payload)
      addMessage('assistant', data.reply, data.suggested_actions || ['show recommendations', 'book now'])
      speak(data.reply)
    } catch {
      const fallback = tBuddy(langOverride, 'greet')
      addMessage('assistant', fallback, ['show recommendations', 'book now'])
      speak(fallback)
    } finally {
      setChatLoading(false)
    }
  }

  const openBuddy = async () => {
    setBuddyOpen(true)
    if (messages.length === 0) {
      await startBuddySession(buddyLang)
    }
  }
  const saveToCatalog = async () => {
    if (!designData?.id) return

    try {
      const userId = Number(localStorage.getItem('user_id') || designData.user_id || 1)
      await api.get(`/designs/${userId}`)

      const key = 'saved_design_ids'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const merged = Array.from(new Set([...existing, designData.id]))
      localStorage.setItem(key, JSON.stringify(merged))
      setActionMessage('Saved to catalog successfully.')
      setTimeout(() => setActionMessage(''), 2200)
    } catch {
      setActionMessage('Saved locally. Catalog sync unavailable right now.')
      setTimeout(() => setActionMessage(''), 2200)
    }
  }

  const exportPdf = () => {
    if (!designData) return

    const opened = window.open('', '_blank', 'width=900,height=1000')
    if (!opened) {
      setActionMessage('Popup blocked. Allow popups to export PDF.')
      setTimeout(() => setActionMessage(''), 2200)
      return
    }

    const rows = furnitureRecommendations
      .map((f, idx) => `<li>${idx + 1}. ${f.item} (${f.style} - ${f.color})</li>`)
      .join('')

    const html = `
      <html>
        <head>
          <title>Gruha Alankara Design Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1 { margin-bottom: 4px; }
            .meta { color: #475569; margin-bottom: 16px; }
            img { width: 100%; max-width: 760px; border-radius: 8px; border: 1px solid #cbd5e1; }
            .card { margin-top: 18px; padding: 14px; border: 1px solid #cbd5e1; border-radius: 8px; }
            .palette { display: flex; gap: 10px; margin-top: 8px; }
            .swatch { width: 42px; height: 42px; border-radius: 6px; border: 1px solid #94a3b8; }
          </style>
        </head>
        <body>
          <h1>Gruha Alankara Design Plan</h1>
          <div class="meta">Theme: ${designData.style_theme || aiOutput.theme_applied || 'Design'} | Created: ${new Date().toLocaleString()}</div>
          ${mediaUrl && !isVideoMedia ? `<img src="${mediaUrl}" alt="Room" />` : ''}

          <div class="card">
            <h3>Color Palette</h3>
            <div class="palette">
              ${colorPalette.map((c) => `<div class="swatch" style="background:${c}"></div>`).join('')}
            </div>
            <div style="margin-top:6px;color:#475569;">${colorPalette.join(', ')}</div>
          </div>

          <div class="card">
            <h3>Furniture Recommendations</h3>
            <ul>${rows}</ul>
          </div>

          <div class="card">
            <h3>Layout Tip</h3>
            <p>${lightingSuggestion}</p>
          </div>

          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `

    opened.document.open()
    opened.document.write(html)
    opened.document.close()
  }

  const openArView = async () => {
    setArError('')
    setArStarting(true)

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported')
      }

      const tryConstraints = [
        { video: { facingMode: { exact: 'environment' } } },
        { video: { facingMode: 'environment' } },
        { video: true },
      ]

      let stream = null
      let lastErr = null

      for (const c of tryConstraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c)
          break
        } catch (err) {
          lastErr = err
        }
      }

      if (!stream) {
        throw lastErr || new Error('Unable to open camera')
      }

      arStreamRef.current = stream
      setArOpen(true)

      setTimeout(() => {
        if (arVideoRef.current) {
          arVideoRef.current.srcObject = stream
          arVideoRef.current.play().catch(() => {})
        }
      }, 50)
    } catch (err) {
      setArError(err?.name ? `${err.name}: ${err.message || ''}` : 'Unable to start AR camera')
    } finally {
      setArStarting(false)
    }
  }

  const closeArView = () => {
    setArOpen(false)
    if (arStreamRef.current) {
      arStreamRef.current.getTracks().forEach((t) => t.stop())
      arStreamRef.current = null
    }
    if (arVideoRef.current) arVideoRef.current.srcObject = null
  }


  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tool = (params.get('tool') || '').toLowerCase()
    if (tool !== 'ar') setToolAutoOpened(false)
    if (tool === 'ar' && designData && !arOpen && !arStarting && !toolAutoOpened) {
      setToolAutoOpened(true)
      openArView()
    }
  }, [location.search, designData, arOpen, arStarting, toolAutoOpened])
  const selectedArItem = useMemo(
    () => arOverlayItems.find((item) => item.id === selectedArItemId) || null,
    [arOverlayItems, selectedArItemId]
  )

  const selectedArModel = useMemo(() => {
    if (!selectedArItem) return null
    const label = String(selectedArItem.item || '').toLowerCase()
    let type = 'sofa'
    if (label.includes('bed')) type = 'bed'
    else if (label.includes('desk') || label.includes('table')) type = 'desk'
    else if (label.includes('bookshelf') || label.includes('shelf')) type = 'bookshelf'
    else if (label.includes('chair')) type = 'chair'
    else if (label.includes('wardrobe') || label.includes('cabinet')) type = 'wardrobe'

    const depthScale = Math.max(0.95, Math.min(2.15, selectedArItem.scale * (2.0 - selectedArItem.z * 0.45)))
    const sizeByType = { bed: 1.45, sofa: 1.35, desk: 1.2, bookshelf: 1.25, wardrobe: 1.3, chair: 1.1 }
    const typeScale = sizeByType[type] || 1.25
    const width = Math.round(290 * depthScale * typeScale)
    const height = Math.round(200 * depthScale * typeScale)

    const modelPaths = {
      bed: '/models/bed.glb',
      desk: '/models/desk.glb',
      bookshelf: '/models/bookshelf.glb',
      chair: '/models/chair.glb',
      wardrobe: '/models/wardrobe.glb',
      sofa: '/models/sofa.glb',
    }

    return { type, width, height, modelUrl: modelPaths[type] || modelPaths.sofa }
  }, [selectedArItem])


  const activeArScale = useMemo(() => {
    if (!selectedArItem) return 1
    return Math.max(0.6, Math.min(2.8, Number(arItemScales[selectedArItem.id] || 1)))
  }, [selectedArItem, arItemScales])

  const activeArAnchor = useMemo(() => {
    if (!selectedArItem) return { x: 0.5, y: 0.75 }
    const placed = arAnchors[selectedArItem.id]
    if (placed) return placed
    return {
      x: clamp01(selectedArItem.x ?? 0.5),
      y: clamp01(0.52 + (selectedArItem.z ?? 0.6) * 0.35),
    }
  }, [selectedArItem, arAnchors])

  const handleArSurfaceClick = (event) => {
    if (!arTapToPlace || !selectedArItem) return
    if (arDragRef.current.moved) {
      arDragRef.current.moved = false
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp01((event.clientX - rect.left) / Math.max(rect.width, 1))
    const rawY = clamp01((event.clientY - rect.top) / Math.max(rect.height, 1))
    const floorLockedY = Math.min(0.94, Math.max(0.5, rawY))

    setArAnchors((prev) => ({
      ...prev,
      [selectedArItem.id]: { x, y: floorLockedY },
    }))
  }


  const updateAnchorFromClientDelta = (clientX, clientY) => {
    const surface = arSurfaceRef.current
    if (!surface || !selectedArItem) return
    const rect = surface.getBoundingClientRect()
    const dx = (clientX - arDragRef.current.startClientX) / Math.max(rect.width, 1)
    const dy = (clientY - arDragRef.current.startClientY) / Math.max(rect.height, 1)
    const x = clamp01(arDragRef.current.startAnchorX + dx)
    const y = clamp01(Math.min(0.94, Math.max(0.5, arDragRef.current.startAnchorY + dy)))
    setArAnchors((prev) => ({ ...prev, [selectedArItem.id]: { x, y } }))
  }

  const handleModelMouseDown = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!selectedArItem) return
    arDragRef.current = {
      dragging: true,
      moved: false,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startAnchorX: activeArAnchor.x,
      startAnchorY: activeArAnchor.y,
    }

    const onMove = (ev) => {
      if (!arDragRef.current.dragging) return
      if (
        Math.abs(ev.clientX - arDragRef.current.startClientX) > 3 ||
        Math.abs(ev.clientY - arDragRef.current.startClientY) > 3
      ) {
        arDragRef.current.moved = true
      }
      updateAnchorFromClientDelta(ev.clientX, ev.clientY)
    }

    const onUp = () => {
      arDragRef.current.dragging = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const distanceBetweenTouches = (touches) => {
    if (!touches || touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleModelTouchStart = (event) => {
    event.stopPropagation()
    if (!selectedArItem) return

    if (event.touches.length >= 2) {
      arPinchRef.current = {
        active: true,
        startDistance: distanceBetweenTouches(event.touches),
        startScale: activeArScale,
      }
      arDragRef.current.dragging = false
      return
    }

    const touch = event.touches[0]
    if (!touch) return
    arDragRef.current = {
      dragging: true,
      moved: false,
      startClientX: touch.clientX,
      startClientY: touch.clientY,
      startAnchorX: activeArAnchor.x,
      startAnchorY: activeArAnchor.y,
    }
  }

  const handleModelTouchMove = (event) => {
    if (!selectedArItem) return
    if (event.touches.length >= 2 && arPinchRef.current.active) {
      event.preventDefault()
      event.stopPropagation()
      const currentDistance = distanceBetweenTouches(event.touches)
      const startDistance = arPinchRef.current.startDistance || currentDistance
      const ratio = currentDistance / Math.max(startDistance, 1)
      const next = Math.max(0.6, Math.min(2.8, arPinchRef.current.startScale * ratio))
      setArItemScales((prev) => ({ ...prev, [selectedArItem.id]: next }))
      return
    }

    if (!arDragRef.current.dragging || event.touches.length !== 1) return
    event.preventDefault()
    event.stopPropagation()
    const touch = event.touches[0]
    if (!touch) return
    if (
      Math.abs(touch.clientX - arDragRef.current.startClientX) > 3 ||
      Math.abs(touch.clientY - arDragRef.current.startClientY) > 3
    ) {
      arDragRef.current.moved = true
    }
    updateAnchorFromClientDelta(touch.clientX, touch.clientY)
  }

  const handleModelTouchEnd = () => {
    arDragRef.current.dragging = false
    if (arPinchRef.current.active) {
      arPinchRef.current.active = false
    }
  }

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser.')
      return
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = speechLang
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      setChatInput(transcript)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  const handleSend = async () => {
    const text = chatInput
    setChatInput('')
    await sendBuddyMessage(text)
  }

  if (!designData) return <div className="text-center py-20 text-white">Loading studio...</div>

  return (
    <div className="min-h-screen py-12 px-4 bg-[#0B1120] text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Design Studio</h1>
          <button onClick={openBuddy} className="flex items-center gap-2 px-6 py-3 bg-[#7C3AED]/20 border border-[#7C3AED] rounded-xl">
            <Volume2 size={20} /> Ask Buddy AI
          </button>
        </div>

        <div className="mb-8 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 p-4">
          <h3 className="text-xl font-bold mb-3">Before / After Auto-Staging</h3>
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
            {mediaUrl ? (
              <>
                {isVideoMedia ? (
                  <video src={mediaUrl} controls className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <img src={mediaUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - stageSlider}% 0 0)` }}>
                  {isVideoMedia ? (
                    <video src={mediaUrl} className="w-full h-full object-cover saturate-150 contrast-110" muted loop autoPlay playsInline />
                  ) : (
                    <img src={mediaUrl} alt="After" className="w-full h-full object-cover saturate-150 contrast-110" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/20 to-[#22D3EE]/10" />
                </div>
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs bg-black/60">Before</div>
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs bg-[#7C3AED]/70">After</div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">Upload media in Analyze Room to preview staged comparison.</div>
            )}
          </div>
          <input type="range" min="0" max="100" value={stageSlider} onChange={(e) => setStageSlider(Number(e.target.value))} className="mt-4 w-full" />
          <div className="mt-3 text-sm text-slate-300 flex justify-between">
            <span>Budget before styling: Rs {baselineBudget.toLocaleString()}</span>
            <span>Budget after styling: Rs {budgetEstimate.total.toLocaleString()} (delta +Rs {budgetDelta.toLocaleString()})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
            <h3 className="flex items-center gap-2 text-xl font-bold mb-6"><Palette size={20} /> Color Palette</h3>
            <div className="flex gap-4">
              {colorPalette.map((color) => (
                <div key={color} className="flex-1 h-20 rounded-xl" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 p-8 rounded-3xl border border-slate-800">
            <h3 className="flex items-center gap-2 text-xl font-bold mb-6"><Box size={20} /> AI Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {furnitureRecommendations.map((item, i) => (
                <div key={i} className="p-4 bg-slate-800 rounded-2xl">
                  <p className="font-bold text-lg">{item?.item || 'Furniture Item'}</p>
                  <p className="text-[#A78BFA] text-sm">
                    {item?.style || 'Style'} - {colorNameFromHex(item?.color)}
                    {item?.color ? ` (${item.color})` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-[#7C3AED]/10 to-transparent p-8 rounded-3xl border border-[#7C3AED]/20">
          <h3 className="flex items-center gap-2 text-xl font-bold mb-4"><Layout size={20} /> Layout Tip</h3>
          <p className="text-lg text-slate-300 italic">"{lightingSuggestion}"</p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-bold mb-4">Furniture Optimizer</h3>
            {placementSuggestions.length > 0 ? (
              <ul className="space-y-2 text-slate-300 text-sm">
                {placementSuggestions.slice(0, 4).map((s, i) => (
                  <li key={i}>
                    {s.item || 'Furniture'}: {s.zone || 'center'} zone {s.rationale ? `- ${s.rationale}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-sm">Upload an analyzed room to get zone-level optimization tips.</p>
            )}
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-bold mb-4">Budget Planner (Estimate)</h3>
            <div className="space-y-2 text-sm text-slate-300">
              {budgetEstimate.rows.map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span>{row.label}</span>
                  <span>Rs {row.value.toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700 flex justify-between font-semibold text-white">
                <span>Total</span>
                <span>Rs {budgetEstimate.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Ruler size={18} /> Real-World Fit Check</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={roomLength} onChange={(e) => setRoomLength(e.target.value)} placeholder="Length (ft)" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
              <input value={roomWidth} onChange={(e) => setRoomWidth(e.target.value)} placeholder="Width (ft)" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
            </div>
            <button onClick={runFitCheck} className="px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9]">Run Fit Check</button>
            {fitReport && (
              <div className={`mt-3 text-sm p-3 rounded-lg ${fitReport.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                <p>{fitReport.message}</p>
                {fitReport.roomArea ? <p className="mt-1">Room: {fitReport.roomArea} sq.ft | Needed: {fitReport.neededArea} sq.ft | Utilization: {fitReport.utilization}%</p> : null}
              </div>
            )}
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ShoppingCart size={18} /> One-Tap Design to Purchase</h3>
            <button onClick={oneTapPurchase} disabled={purchaseLoading || !canRunPurchase} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60">
              {purchaseLoading ? 'Processing...' : 'Auto-Book + Generate Invoice'}
            </button>
            {purchaseResult && (
              <div className="mt-4 text-sm text-slate-200 space-y-1">
                <p className="font-semibold flex items-center gap-2"><Receipt size={16} /> Invoice {purchaseResult.invoice_id}</p>
                <p>Bookings confirmed: {purchaseResult.bookings?.length || 0}</p>
                <p>Total: Rs {Number(purchaseResult.total_amount || 0).toLocaleString()}</p>
                <p>Vendor contact: {purchaseResult.vendor_contact || 'support@gruhalankara.ai'}</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={saveToCatalog} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold flex items-center gap-2">
            <Save size={16} /> Save to Catalog
          </button>
          <button onClick={openArView} disabled={arStarting} className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white font-semibold flex items-center gap-2 disabled:opacity-60">
            <Camera size={16} /> {arStarting ? 'Opening AR...' : 'Live AR Camera'}
          </button>
          <button onClick={exportPdf} className="px-4 py-2 rounded-xl bg-[#1E293B] border border-[#7C3AED]/50 text-white font-semibold flex items-center gap-2">
            <Download size={16} /> Export PDF
          </button>
        </div>

        {actionMessage && <p className="mt-3 text-sm text-emerald-300">{actionMessage}</p>}
        {arError && <p className="mt-2 text-sm text-red-400">{arError}</p>}
      </div>

      {arOpen && (
        <div className="fixed inset-0 z-[70] bg-black/85 p-4">
          <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">Live AR Camera</h2>
              <button onClick={closeArView} className="px-3 py-2 rounded-lg border border-slate-600">Close</button>
            </div>

            <div
              ref={arSurfaceRef}
              onClick={handleArSurfaceClick}
              className={`relative flex-1 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 ${arTapToPlace ? 'cursor-crosshair' : ''}`}
            >
              <video ref={arVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {selectedArItem && selectedArModel && (
                <>
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${activeArAnchor.x * 100}%`,
                      top: `${activeArAnchor.y * 100}%`,
                      width: `${selectedArModel.width}px`,
                      height: `${selectedArModel.height}px`,
                    }}
                  >
                    <div
                      className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
                      onMouseDown={handleModelMouseDown}
                      onTouchStart={handleModelTouchStart}
                      onTouchMove={handleModelTouchMove}
                      onTouchEnd={handleModelTouchEnd}
                      onTouchCancel={handleModelTouchEnd}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ARFurniturePreview
                        type={selectedArModel.type}
                        modelUrl={selectedArModel.modelUrl}
                        modelScale={activeArScale}
                      />
                    </div>
                  </div>

                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${activeArAnchor.x * 100}%`,
                      top: `${Math.max(0.08, activeArAnchor.y - 0.18) * 100}%`,
                    }}
                  >
                    <div className="px-4 py-2 rounded-xl bg-[#7C3AED]/90 text-white text-sm font-semibold shadow-[0_0_16px_rgba(124,58,237,0.7)] border border-[#A78BFA]/70 whitespace-nowrap">
                      {selectedArItem.item}
                    </div>
                  </div>
                </>
              )}
              <div className="absolute top-3 left-3 right-3 z-10">
                <div className="flex flex-wrap gap-2 bg-black/35 backdrop-blur-sm rounded-xl p-2 border border-slate-600/50">
                  {arOverlayItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedArItemId(item.id) }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        item.id === selectedArItemId
                          ? 'bg-[#7C3AED] border-[#A78BFA] text-white'
                          : 'bg-slate-900/80 border-slate-500 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {item.item}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setArTapToPlace((v) => !v) }}
                    className="px-2.5 py-1 text-[11px] rounded-md border border-slate-500 bg-slate-900/80 hover:bg-slate-800"
                  >
                    {arTapToPlace ? 'Tap-to-place: ON' : 'Tap-to-place: OFF'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!selectedArItem) return
                      setArAnchors((prev) => {
                        const next = { ...prev }
                        delete next[selectedArItem.id]
                        return next
                      })
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-md border border-slate-500 bg-slate-900/80 hover:bg-slate-800"
                  >
                    Reset Anchor
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!selectedArItem) return
                      setArItemScales((prev) => ({ ...prev, [selectedArItem.id]: 1 }))
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-md border border-slate-500 bg-slate-900/80 hover:bg-slate-800"
                  >
                    Reset Size
                  </button>
                  <span className="text-[11px] text-slate-300">
                    {arWebXRSupported ? 'WebXR AR is supported on this device (tap-to-place active)' : 'WebXR AR unavailable: using tap-to-place floor lock'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3">
              Select an item, then tap floor area to anchor placement. Floor-lock keeps objects in room zone and avoids face-level placement.
            </p>
          </div>
        </div>
      )}

      {buddyOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] max-w-[92vw] bg-slate-900 border border-[#7C3AED]/40 rounded-2xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-2 font-semibold">
              <MessageCircle size={16} /> Buddy Chat
            </div>
            <div className="flex items-center gap-2">
              <select
                value={buddyLang}
                onChange={async (e) => { const nextLang = e.target.value; setBuddyLang(nextLang); setMessages([]); if (buddyOpen) await startBuddySession(nextLang) }}
                className="bg-slate-800 text-sm rounded px-2 py-1"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
              </select>
              <button onClick={() => setBuddyOpen(false)} className="text-slate-300 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="h-72 overflow-y-auto px-4 py-3 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl px-3 py-2 text-sm ${msg.role === 'assistant' ? 'bg-slate-800 text-slate-100' : 'bg-[#7C3AED]/20 text-white ml-8'}`}
              >
                <div>{msg.text}</div>
                {msg.role === 'assistant' && Array.isArray(msg.suggestedActions) && msg.suggestedActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.suggestedActions.map((actionLabel, idx) => (
                      <button
                        key={`${msg.id}-action-${idx}`}
                        onClick={() => sendBuddyMessage(actionLabel)}
                        className="text-xs px-2 py-1 rounded-md border border-[#7C3AED]/60 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20"
                      >
                        {actionLabel}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {chatLoading && <div className="text-xs text-slate-400">Buddy is typing...</div>}
          </div>

          <div className="p-3 border-t border-slate-700 flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`p-2 rounded-lg border ${listening ? 'border-green-400 text-green-300' : 'border-slate-600 text-slate-300'}`}
              title="Voice input"
            >
              <Mic size={16} />
            </button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !chatLoading) handleSend()
              }}
              placeholder="Ask Buddy or say: book now"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={chatLoading || !chatInput.trim()}
              className="p-2 rounded-lg bg-[#7C3AED] disabled:opacity-50"
              title="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

























































