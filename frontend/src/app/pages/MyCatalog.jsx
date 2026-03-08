import { useState, useEffect } from 'react'
import api from '../../api'

export default function MyCatalog() {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userId = Number(localStorage.getItem('user_id') || '1')
        const res = await api.get(`/designs/${userId}`)

        const savedIds = JSON.parse(localStorage.getItem('saved_design_ids') || '[]')
        if (savedIds.length > 0) {
          const pinned = []
          const others = []
          for (const d of res.data) {
            if (savedIds.includes(d.id)) pinned.push(d)
            else others.push(d)
          }
          setDesigns([...pinned, ...others])
        } else {
          setDesigns(res.data)
        }
      } catch {
        setDesigns([])
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen py-12 px-4 bg-[#0B1120] text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">My Catalog</h1>
        {loading ? (
          <div className="text-center">Loading history...</div>
        ) : designs.length === 0 ? (
          <div className="text-center text-slate-400">No catalog items yet. Analyze and save a design first.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <div key={design.id} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                <img src={`http://localhost:8000/${design.image_path}`} className="w-full aspect-video object-cover" alt="Catalog design" />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{design.style_theme} Design</h3>
                  <p className="text-slate-400 text-sm">Created: {new Date(design.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
