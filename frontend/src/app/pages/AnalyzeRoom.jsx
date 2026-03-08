import { useEffect, useRef, useState } from 'react'
import { Camera, Upload, Check, ArrowRight, Globe, Palette, Video, StopCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000' : 'http://localhost:8000')

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

export default function AnalyzeRoom() {
  const location = useLocation()

  // Extended cameraState: idle | requesting | active | captured | error | recording
  const [cameraState, setCameraState] = useState('idle') 
  const [capturedImage, setCapturedImage] = useState(null) // Stores preview URL (Image or Video)
  const [uploadFile, setUploadFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [analysisPreview, setAnalysisPreview] = useState('')

  const [selectedStyle, setSelectedStyle] = useState('Modern')
  const [selectedLang, setSelectedLang] = useState('en')

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunks = useRef([])

  const stopCamera = (forceIdle = false) => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    if (forceIdle || (cameraState !== 'captured' && cameraState !== 'error' && cameraState !== 'recording')) {
      setCameraState('idle')
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const styleFromQuery = params.get('style')
    const styleFromStorage = localStorage.getItem('preferred_style')
    const resolved = normalizeStyle(styleFromQuery || styleFromStorage || 'Modern')
    setSelectedStyle(resolved)
  }, [location.search])

  useEffect(() => {
    return () => {
      stopCamera(true)
      if (capturedImage?.startsWith('blob:')) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, [capturedImage])

  const waitForVideoElement = async (timeoutMs = 1200) => {
    const started = Date.now()
    while (!videoRef.current) {
      if (Date.now() - started > timeoutMs) return null
      await new Promise((resolve) => setTimeout(resolve, 30))
    }
    return videoRef.current
  }

  const activateStream = async (stream) => {
    const video = await waitForVideoElement()
    if (!video) throw new Error('Video element unavailable')
    video.srcObject = stream
    streamRef.current = stream
    await video.play().catch(() => {})
    setCameraState('active')
  }

  const requestCamera = async () => {
    setErrorMessage('')
    stopCamera(true)
    setCameraState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      await activateStream(stream)
    } catch (err) {
      setCameraState('error')
      setErrorMessage('Unable to access camera.')
    }
  }

  // --- New Video Recording Functions ---
  const startRecording = () => {
    if (!streamRef.current) return
    recordedChunks.current = []
    const options = { mimeType: 'video/webm; codecs=vp9' }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) options.mimeType = ''

    const recorder = new MediaRecorder(streamRef.current, options)
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' })
      const file = new File([blob], 'room_scan.webm', { type: 'video/webm' })
      setUploadFile(file)
      const previewUrl = URL.createObjectURL(blob)
      setCapturedImage(previewUrl)
      setCameraState('captured')
    }
    mediaRecorderRef.current = recorder
    recorder.start()
    setCameraState('recording')
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      stopCamera(false)
    }
  }

  const captureImage = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob((blob) => {
      const file = new File([blob], 'room.jpg', { type: 'image/jpeg' })
      setUploadFile(file)
      setCapturedImage(URL.createObjectURL(blob))
      stopCamera(true)
      setCameraState('captured')
    }, 'image/jpeg', 0.92)
  }

  const analyzeFile = async (fileToAnalyze) => {
    const file = fileToAnalyze || uploadFile
    if (!file) return
    setAnalyzing(true)
    setErrorMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('style_theme', selectedStyle)
      formData.append('lang', selectedLang)

      const activeUserId = localStorage.getItem('user_id') || '1'
      const response = await fetch(`${API_BASE}/upload/${activeUserId}`, {
        method: 'POST',
        body: formData,
        headers: localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {},
      })
      if (!response.ok) throw new Error('Upload failed')
      const data = await response.json()
      localStorage.setItem('lastDesignResult', JSON.stringify(data))
      setAnalyzed(true)
    } catch {
      setErrorMessage('Analysis failed. Check if backend is running.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setCapturedImage(URL.createObjectURL(file))
    setCameraState('captured')
    await analyzeFile(file)
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-[#0B1120] text-white font-sans">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Analyze Your Room</h1>
        <p className="text-slate-400 mb-12">Capture a photo or record a video scan of your space</p>

        {/* Existing Selectors (Layout Maintained) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
            <Palette className="text-[#7C3AED]" />
            <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="bg-transparent w-full focus:outline-none text-slate-200">
              <option value="Modern">Modern Style</option>
              <option value="Scandinavian">Scandinavian</option>
              <option value="Industrial">Industrial</option>
              <option value="Bohemian">Bohemian</option>
              <option value="Contemporary">Contemporary</option>
              <option value="Vastu Calm">Vastu Calm</option>
              <option value="Jaipur Heritage">Jaipur Heritage</option>
              <option value="Coastal India">Coastal India</option>
            </select>
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
            <Globe className="text-[#7C3AED]" />
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="bg-transparent w-full focus:outline-none text-slate-200">
              <option value="en">English (Buddy)</option>
              <option value="hi">Hindi (Buddy)</option>
            </select>
          </div>
        </div>

        {/* Preview Area (Layout Maintained) */}
        <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 mb-8 shadow-2xl">
          {(cameraState === 'active' || cameraState === 'requesting' || cameraState === 'recording') && (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          )}
          {cameraState === 'captured' && (
            uploadFile?.type.includes('video') ? (
              <video src={capturedImage} controls className="w-full h-full object-cover" />
            ) : (
              <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
            )
          )}
          {(cameraState === 'idle' || cameraState === 'error') && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Camera size={48} className="mb-4 opacity-20" />
              <p>{cameraState === 'error' ? 'Camera unavailable' : 'No image or video selected'}</p>
            </div>
          )}
          {cameraState === 'recording' && (
             <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-3 py-1.5 rounded-full animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-xs font-bold">RECORDING</span>
             </div>
          )}
          {analyzing && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-[1px]">
              <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xl font-medium">Buddy AI is analyzing your space...</p>
            </div>
          )}
        </div>

        {/* Action Buttons (Integrated into Existing Flow) */}
        <div className="flex flex-wrap justify-center gap-4">
          {(cameraState === 'idle' || cameraState === 'error') && (
            <>
              <button onClick={requestCamera} className="px-8 py-3 bg-[#7C3AED] rounded-xl flex items-center gap-2 hover:bg-[#6D28D9] transition-all">
                <Camera size={20} /> Start Camera
              </button>
              <label className="px-8 py-3 border-2 border-[#7C3AED] text-[#F8FAFC] rounded-xl flex items-center gap-2 hover:bg-[#7C3AED]/10 transition-all cursor-pointer">
                <Upload size={20} /> Upload Photo/Video
                <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </>
          )}

          {cameraState === 'active' && (
            <>
              <button onClick={captureImage} className="px-6 py-3 bg-white text-slate-900 rounded-xl flex items-center gap-2 font-bold">
                <Check size={20} /> Capture Photo
              </button>
              <button onClick={startRecording} className="px-6 py-3 bg-red-600 rounded-xl flex items-center gap-2 font-bold hover:bg-red-700">
                <Video size={20} /> Record Video
              </button>
            </>
          )}

          {cameraState === 'recording' && (
            <button onClick={stopRecording} className="px-8 py-3 bg-white text-red-600 rounded-xl flex items-center gap-2 font-bold shadow-lg animate-bounce">
              <StopCircle size={20} /> Stop Recording
            </button>
          )}

          {cameraState === 'captured' && !analyzing && (
            <>
              <button onClick={() => analyzeFile()} className="px-10 py-3 bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] rounded-xl font-bold flex items-center gap-2 transition-transform hover:scale-105">
                Analyze with AI <ArrowRight size={20} />
              </button>
              <button onClick={() => { stopCamera(true); setCameraState('idle'); }} className="px-8 py-3 border border-slate-700 rounded-xl">Change Media</button>
            </>
          )}
        </div>

        {errorMessage && <p className="mt-6 text-red-400">{errorMessage}</p>}

        {analyzed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-12 p-10 bg-slate-900/80 rounded-3xl border border-[#7C3AED]/30 backdrop-blur-md">
            <h2 className="text-3xl font-bold mb-4">Analysis Complete!</h2>
            <Link to="/studio" className="inline-flex items-center gap-2 px-12 py-4 bg-[#7C3AED] rounded-xl font-bold hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all">
              Go to Design Studio <ArrowRight size={20} />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

