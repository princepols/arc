/**
 * Arc AI - useChat Hook v2
 * Manages messages for a specific session.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { chatAPI } from '../utils/api'

export function useChat(sessionId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(false)

  // Track whether current messages were populated by send() (skip DB reload)
  const populatedBySend = useRef(false)

  // Load messages when session changes — but skip if send() already populated them
  useEffect(() => {
    if (!sessionId) { setMessages([]); return }

    // If send() just created this session and already has messages, don't reload
    if (populatedBySend.current) {
      populatedBySend.current = false
      return
    }

    setFetching(true)
    chatAPI.getMessages(sessionId)
      .then(msgs => setMessages(msgs))
      .catch(console.error)
      .finally(() => setFetching(false))
  }, [sessionId])

  const send = useCallback(async (text, mode = 'general', sid, onTitleUpdate, fileContext = null, fileName = null) => {
    if (!text.trim() || loading || !sid) return

    const tempId = `tmp-${Date.now()}`

    // Build display content with filename badge if file attached
    const displayContent = fileName ? `📎 **${fileName}**\n\n${text}` : text

    // Add optimistic user message
    setMessages(prev => [...prev, {
      id: tempId, role: 'user', content: displayContent, mode,
      created_at: new Date().toISOString(),
    }])
    setLoading(true)

    // Mark that we're populating via send so useEffect doesn't wipe our messages
    populatedBySend.current = true

    try {
      const data = await chatAPI.send(sid, {
        message: text,
        mode,
        file_context: fileContext || null,
        file_name: fileName || null,
      })

      // Swap temp message with real IDs + add AI reply
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        { id: data.user_message_id, role: 'user',      content: displayContent,  mode, created_at: new Date().toISOString() },
        { id: data.ai_message_id,   role: 'assistant', content: data.response,   mode, created_at: new Date().toISOString() },
      ])

      if (onTitleUpdate) onTitleUpdate(text.slice(0, 60))
    } catch (err) {
      populatedBySend.current = false
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        { id: `err-${Date.now()}`, role: 'error', content: err.message, mode, created_at: new Date().toISOString() }
      ])
    } finally {
      setLoading(false)
    }
  }, [loading])

  const clearMessages = useCallback(() => {
    populatedBySend.current = false
    setMessages([])
  }, [])

  return { messages, loading, fetching, send, clearMessages }
}