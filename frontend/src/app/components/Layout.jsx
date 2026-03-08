import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import FlashMessageContainer from './FlashMessage.jsx'
import { useState } from 'react'

export default function Layout() {
  const [messages, setMessages] = useState([])

  const dismissMessage = (id) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1120] via-[#0F172A] to-[#111827]">
      <Navbar />
      <FlashMessageContainer messages={messages} onDismiss={dismissMessage} />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
