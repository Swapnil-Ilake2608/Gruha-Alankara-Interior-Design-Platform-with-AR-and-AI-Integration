import { useEffect, useMemo, useState } from 'react'
import api from '../../api'

export default function Profile() {
  const [bookings, setBookings] = useState([])
  const [designMap, setDesignMap] = useState({})
  const [furnitureMap, setFurnitureMap] = useState({})
  const [loading, setLoading] = useState(true)

  const userId = Number(localStorage.getItem('user_id') || '0')
  const userName = localStorage.getItem('user_name') || 'User'
  const userEmail = localStorage.getItem('user_email') || ''

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        setBookings([])
        setLoading(false)
        return
      }

      try {
        const [bookingsRes, designsRes, furnitureRes] = await Promise.all([
          api.get(`/bookings/user/${userId}`),
          api.get(`/designs/${userId}`),
          api.get('/furniture'),
        ])

        const dMap = {}
        for (const d of designsRes.data || []) dMap[d.id] = d

        const fMap = {}
        for (const f of furnitureRes.data || []) fMap[f.id] = f

        const sorted = [...(bookingsRes.data || [])].sort(
          (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
        )

        setDesignMap(dMap)
        setFurnitureMap(fMap)
        setBookings(sorted)
      } catch {
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  const summary = useMemo(() => {
    const total = bookings.length
    const confirmed = bookings.filter((b) => ['confirmed', 'auto_confirmed'].includes(String(b.status || '').toLowerCase())).length
    const pending = bookings.filter((b) => String(b.status || '').toLowerCase() === 'pending').length
    return { total, confirmed, pending }
  }, [bookings])

  return (
    <div className="min-h-screen py-12 px-4 bg-[#0B1120] text-white">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 mb-8">
          <h1 className="text-3xl font-bold">{userName}</h1>
          <p className="text-slate-400 mt-1">{userEmail || 'No email available'}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">Total Bookings: {summary.total}</span>
            <span className="px-3 py-1 rounded-lg bg-emerald-900/30 border border-emerald-700/40">Confirmed: {summary.confirmed}</span>
            <span className="px-3 py-1 rounded-lg bg-amber-900/30 border border-amber-700/40">Pending: {summary.pending}</span>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Booking History</h2>

        {loading ? (
          <div className="text-slate-300">Loading booking history...</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            No bookings found yet. Use Buddy AI and say "book now" to create bookings.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const design = designMap[b.design_id]
              const furniture = furnitureMap[b.furniture_id]
              const status = String(b.status || 'pending').toLowerCase()
              const statusClass =
                status === 'confirmed' || status === 'auto_confirmed'
                  ? 'bg-emerald-900/30 border-emerald-700/40 text-emerald-300'
                  : 'bg-amber-900/30 border-amber-700/40 text-amber-300'

              return (
                <div key={b.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{furniture?.name || `Furniture #${b.furniture_id}`}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {design?.style_theme || 'Design'} | Booking ID: {b.id}
                      </p>
                      <p className="text-sm text-emerald-300 mt-1">
                        Price: Rs {Number(b.furniture_price ?? furniture?.price ?? 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {new Date(b.booking_date).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg border text-sm ${statusClass}`}>{status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

