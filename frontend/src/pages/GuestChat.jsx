/**
 * Arc AI - Guest Chat Page
 * Full chat UI for unauthenticated users with 5 prompt limit.
 */
import { useState, useRef, useEffect } from 'react'
import { useGuest } from '../hooks/useGuest'
import Message from '../components/Message'
import TypingIndicator from '../components/TypingIndicator'
import GuestLimitModal from '../components/GuestLimitModal'
import arcLogo from '../assets/arclogo.png'

const MODES = [
  { key: 'general',        label: 'General' },
  { key: 'search',         label: 'Search' },
  { key: 'summarize',      label: 'Summarize' },
  { key: 'paraphrase',     label: 'Paraphrase' },
  { key: 'code',           label: 'Code' },
  { key: 'prompt_enhance', label: 'Enhance' },
  { key: 'humanize',       label: 'Humanize' },
]

export default function GuestChat({ onSignUp, onLogin }) {
  const { promptCount, limitReached, loading, messages, limit, remaining, sendGuestMessage } = useGuest()
  const [input, setInput]     = useState('')
  const [mode,  setMode]      = useState('general')
  const [showModal, setShowModal] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (limitReached) setShowModal(true)
  }, [limitReached])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (limitReached) { setShowModal(true); return }
    setInput('')
    await sendGuestMessage(text, mode)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={s.root}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <img src={arcLogo} alt="Arc" style={s.logo} />
          <span style={s.brand}>Arc</span>
          <span style={s.guestBadge}>Guest</span>
        </div>
        <div style={s.headerRight}>
          {/* Prompt counter */}
          <div style={s.counter}>
            <div style={s.counterBar}>
              <div style={{ ...s.counterFill, width: `${(promptCount / limit) * 100}%`, background: promptCount >= limit ? '#f87171' : promptCount >= 3 ? '#fbbf24' : '#4ade80' }} />
            </div>
            <span style={{ ...s.counterText, color: promptCount >= limit ? '#f87171' : 'var(--text-muted)' }}>
              {/* {promptCount}/{limit} prompts */}
            </span>
          </div>
          <button style={s.loginBtn} onClick={onLogin}>Sign In</button>
          <button style={s.signupBtn} onClick={onSignUp}>Sign Up Free</button>
        </div>
      </div>

      {/* Messages */}
      <div style={s.messages}>
        <div style={s.messagesInner}>
        {messages.length === 0 && (
          <div style={s.welcome}>
            <img src={arcLogo} alt="Arc" style={s.welcomeLogo} />
            <h2 style={s.welcomeTitle}>Try Arc for free</h2>
            <p style={s.welcomeDesc}>Send up to {limit} messages without an account. <strong>Sign up free</strong> for unlimited access.</p>
            <div style={s.suggestions}>
              {['What can you do?', 'Write me a short poem', 'Explain quantum computing simply'].map(s_ => (
                <button key={s_} style={s.suggestion} onClick={() => sendGuestMessage(s_, 'general')}>{s_}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={msg.id || i} message={msg} profile={null} />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '10px 0' }}>
            <div style={s.arcAvatar}><img src={arcLogo} alt="Arc" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }} /></div>
            <TypingIndicator />
          </div>
        )}

        <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={s.inputArea}>
        <div style={s.inputInner}>
        {/* Mode selector */}
        <div style={s.modes}>
          {MODES.map(m => (
            <button
              key={m.key}
              style={{ ...s.modeBtn, ...(mode === m.key ? s.modeBtnActive : {}) }}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={s.inputRow}>
          <textarea
            ref={textareaRef}
            style={s.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={limitReached ? 'Create an account to continue...' : `Message Arc… `}
            disabled={limitReached || loading}
            rows={1}
          />
          <button
            style={{ ...s.sendBtn, opacity: (!input.trim() || loading || limitReached) ? 0.4 : 1 }}
            onClick={handleSend}
            disabled={!input.trim() || loading || limitReached}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        {/* Upgrade nudge */}
        {promptCount >= 3 && !limitReached && (
          <div style={s.nudge}>
            {remaining} prompt{remaining !== 1 ? 's' : ''} left —{' '}
            <button style={s.nudgeLink} onClick={onSignUp}>Sign up free for unlimited access</button>
          </div>
        )}
        </div>
      </div>

      {/* Limit modal */}
      {showModal && (
        <GuestLimitModal
          onSignUp={onSignUp}
          onLogin={onLogin}
        />
      )}
    </div>
  )
}

const s = {
  root:         { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' },
  header:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0 },
  headerLeft:   { display: 'flex', alignItems: 'center', gap: 8 },
  logo:         { width: 28, height: 28, borderRadius: 7, objectFit: 'cover' },
  brand:        { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' },
  guestBadge:   { fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', padding: '2px 7px', borderRadius: 99 },
  headerRight:  { display: 'flex', alignItems: 'center', gap: 10 },
  counter:      { display: 'flex', alignItems: 'center', gap: 7 },
  counterBar:   { width: 60, height: 4, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' },
  counterFill:  { height: '100%', borderRadius: 99, transition: 'width 0.3s ease, background 0.3s ease' },
  counterText:  { fontSize: 11, fontWeight: 600 },
  loginBtn:     { padding: '6px 14px', background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--text-secondary)', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  signupBtn:    { padding: '6px 14px', background: 'var(--accent)', border: 'none', color: '#000', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  messages:     { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  messagesInner:{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column' },
  arcAvatar:    { width: 30, height: 30, borderRadius: 8, flexShrink: 0, overflow: 'hidden', marginTop: 2 },
  welcome:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px', gap: 12 },
  welcomeLogo:  { width: 56, height: 56, borderRadius: 14, objectFit: 'cover', marginBottom: 8 },
  welcomeTitle: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
  welcomeDesc:  { fontSize: 14, color: 'var(--text-secondary)', maxWidth: 380, lineHeight: 1.6, margin: 0 },
  suggestions:  { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  suggestion:   { padding: '8px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 20, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' },
  inputArea:    { padding: '12px 20px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  inputInner:   { width: '100%', maxWidth: 760 },
  modes:        { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' },
  modeBtn:      { padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
  modeBtnActive:{ background: 'var(--accent)', color: '#000', borderColor: 'var(--accent)', fontWeight: 600 },
  inputRow:     { display: 'flex', gap: 10, alignItems: 'flex-end' },
  textarea:     { flex: 1, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 14, resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit' },
  sendBtn:      { width: 38, height: 38, borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'opacity 0.15s' },
  nudge:        { fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 },
  nudgeLink:    { background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 },
}