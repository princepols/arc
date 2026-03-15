/**
 * Arc AI - useGuest hook
 * Manages guest session ID, prompt count, and limit state.
 */
import { useState, useEffect, useCallback } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const GUEST_LIMIT = 5

function generateGuestId() {
  return 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function getOrCreateGuestId() {
  let id = localStorage.getItem('arc_guest_id')
  if (!id) {
    id = generateGuestId()
    localStorage.setItem('arc_guest_id', id)
  }
  return id
}

export function useGuest() {
  const [guestId,      setGuestId]      = useState(null)
  const [promptCount,  setPromptCount]  = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [messages,     setMessages]     = useState([])

  // Init guest session on mount
  useEffect(() => {
    const id = getOrCreateGuestId()
    setGuestId(id)

    // Check existing usage from backend
    fetch(`${BASE_URL}/guest/status/${id}`)
      .then(r => r.json())
      .then(data => {
        setPromptCount(data.prompt_count || 0)
        setLimitReached(data.limit_reached || false)
      })
      .catch(() => {})
  }, [])

  const sendGuestMessage = useCallback(async (text, mode = 'general') => {
    if (!guestId || limitReached) return

    // Optimistically add user message
    const userMsg = { role: 'user', content: text, mode, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch(`${BASE_URL}/guest/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId, message: text, mode }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setLimitReached(true)
        setMessages(prev => [...prev, { role: 'error', content: 'Guest limit reached.', id: Date.now() }])
        return
      }

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'error', content: data.detail || 'Error occurred.', id: Date.now() }])
        return
      }

      const aiMsg = { role: 'assistant', content: data.response, mode, id: Date.now() + 1 }
      setMessages(prev => [...prev, aiMsg])
      setPromptCount(data.prompt_count)
      setLimitReached(data.limit_reached)

    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: 'Failed to connect. Please try again.', id: Date.now() }])
    } finally {
      setLoading(false)
    }
  }, [guestId, limitReached])

  // Call this after user registers to link guest session
  const convertGuest = useCallback(async (userId) => {
    if (!guestId) return
    try {
      await fetch(`${BASE_URL}/guest/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guestId, user_id: userId }),
      })
      localStorage.removeItem('arc_guest_id')
    } catch {}
  }, [guestId])

  return {
    guestId,
    promptCount,
    limitReached,
    loading,
    messages,
    limit: GUEST_LIMIT,
    remaining: Math.max(0, GUEST_LIMIT - promptCount),
    sendGuestMessage,
    convertGuest,
  }
}