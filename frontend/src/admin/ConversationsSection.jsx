/**
 * Arc AI — Admin Dashboard: Conversations Section
 * Browse sessions, view full message threads, detect errors
 */

import { useEffect, useState } from 'react'
import { adminAPI } from '../utils/api'

// ── Mode badge ────────────────────────────────────────────────────────────────
const MODE_COLORS = {
  chat: '#e8a838', search: '#38bdf8', code: '#a78bfa',
  humanizer: '#2dd4bf', summarize: '#34d399', paraphrase: '#fb923c', enhancer: '#f59e0b',
}
function ModeBadge({ mode }) {
  const col = MODE_COLORS[mode] || '#666'
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: col, background: col + '18',
      border: `1px solid ${col}33`, borderRadius: 3, padding: '1px 7px', letterSpacing: '0.05em' }}>
      {mode || 'chat'}
    </span>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MsgBubble({ msg }) {
  const isUser  = msg.role === 'user'
  const isError = msg.role === 'error'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#444' }}>
        {!isUser && <span style={{ color: '#ef4444' }}>◆ Arc</span>}
        {isUser  && <span style={{ color: '#60a5fa' }}>@{msg.username}</span>}
        <ModeBadge mode={msg.mode} />
        <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
      </div>
      <div style={{
        maxWidth: '80%', padding: '10px 14px', borderRadius: 8, fontSize: 13,
        lineHeight: 1.55, wordBreak: 'break-word',
        background: isError ? 'rgba(239,68,68,0.1)' : isUser ? '#1a1a28' : '#111116',
        border: `1px solid ${isError ? 'rgba(239,68,68,0.3)' : '#1e1e28'}`,
        color: isError ? '#f87171' : '#d0d0dc',
      }}>
        {msg.content.length > 600 ? msg.content.slice(0, 600) + '…' : msg.content}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ConversationsSection() {
  const [sessions,  setSessions]  = useState([])
  const [messages,  setMessages]  = useState([])
  const [activeId,  setActiveId]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [msgLoad,   setMsgLoad]   = useState(false)
  const [filter,    setFilter]    = useState('all')  // 'all' | 'errors'

  useEffect(() => {
    adminAPI.conversations().then(setSessions).finally(() => setLoading(false))
  }, [])

  const openSession = async (id) => {
    setActiveId(id)
    setMsgLoad(true)
    try {
      const msgs = await adminAPI.getMessages(id)
      setMessages(msgs)
    } catch (e) {
      setMessages([])
    } finally {
      setMsgLoad(false)
    }
  }

  const displayed = filter === 'errors'
    ? sessions.filter(s => messages.some(m => m.role === 'error'))
    : sessions

  const shownMsgs = filter === 'errors'
    ? messages.filter(m => m.role === 'error')
    : messages

  return (
    <div style={s.root}>
      {/* Filter */}
      <div style={s.filterRow}>
        {['all','errors'].map(f => (
          <button key={f} style={{ ...s.filterBtn, background: filter === f ? '#ef4444' : 'transparent', color: filter === f ? '#fff' : '#555', borderColor: filter === f ? '#ef4444' : '#2a2a35' }}
            onClick={() => setFilter(f)}>
            {f === 'all' ? '💬 All' : '⚠ Errors Only'}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#444', marginLeft: 'auto' }}>{sessions.length} sessions</span>
      </div>

      <div style={s.layout}>
        {/* Session list */}
        <div style={s.sessionList}>
          {loading ? (
            <div style={s.center}>Loading…</div>
          ) : !sessions.length ? (
            <div style={s.center}>No conversations yet</div>
          ) : sessions.map(sess => (
            <div key={sess.id}
              onClick={() => openSession(sess.id)}
              style={{ ...s.sessionRow, background: activeId === sess.id ? '#161620' : 'transparent',
                borderLeft: `3px solid ${activeId === sess.id ? '#ef4444' : 'transparent'}` }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#d0d0dc', marginBottom: 4 }}>
                {sess.title || 'Untitled'}
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#444' }}>
                <span>@{sess.username}</span>
                <span>·</span>
                <span>{sess.message_count} msgs</span>
                <span>·</span>
                <span>{new Date(sess.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Message thread */}
        <div style={s.thread}>
          {!activeId ? (
            <div style={s.center}>← Select a conversation</div>
          ) : msgLoad ? (
            <div style={s.center}>Loading messages…</div>
          ) : !shownMsgs.length ? (
            <div style={s.center}>{filter === 'errors' ? 'No errors in this conversation' : 'No messages'}</div>
          ) : (
            <div style={{ padding: '16px 20px' }}>
              {shownMsgs.map(m => <MsgBubble key={m.id} msg={m} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  root:        { display: 'flex', flexDirection: 'column', gap: 14, height: '100%' },
  filterRow:   { display: 'flex', gap: 8, alignItems: 'center' },
  filterBtn:   { border: '1px solid', borderRadius: 4, padding: '6px 14px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s', fontWeight: 600 },
  layout:      { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, flex: 1, minHeight: 500 },
  sessionList: { background: '#0d0d10', border: '1px solid #1a1a22', borderRadius: 6, overflowY: 'auto' },
  sessionRow:  { padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #111', transition: 'all 0.1s' },
  thread:      { background: '#0d0d10', border: '1px solid #1a1a22', borderRadius: 6, overflowY: 'auto' },
  center:      { padding: 40, textAlign: 'center', color: '#444', fontSize: 13 },
}