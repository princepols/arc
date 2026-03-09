/**
 * Arc AI - ChatInput v4
 * With file upload + token ring indicator.
 */

import { useState, useRef, useEffect } from 'react'
import { Send, FileText, RefreshCw, Code2, MessageSquare, Wand2, Paperclip, X, Sparkles, Globe } from 'lucide-react'
import FileUpload  from './FileUpload'
import TokenRing   from './TokenRing'

const MODES = [
  { id: 'general',        label: 'Chat',           icon: MessageSquare },
  { id: 'search',         label: 'Search',         icon: Globe         },
  { id: 'summarize',      label: 'Summarize',      icon: FileText      },
  { id: 'paraphrase',     label: 'Paraphrase',     icon: RefreshCw     },
  { id: 'code',           label: 'Code',           icon: Code2         },
  { id: 'prompt_enhance', label: 'Prompt Enhancer',icon: Wand2         },
  { id: 'humanize',       label: 'Humanizer',      icon: Sparkles      },
]

export default function ChatInput({ onSend, loading, messages = [] }) {
  const [text, setText]             = useState('')
  const [mode, setMode]             = useState('general')
  const [showUpload, setShowUpload] = useState(false)
  const [attachedFile, setAttached] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const ta = ref.current; if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }, [text])

  const canSend = (text.trim().length > 0 || attachedFile) && !loading

  const send = () => {
    if (!canSend) return
    const msg = text.trim() || (attachedFile ? `Please analyze this file: ${attachedFile.filename}` : '')
    onSend(msg, mode, attachedFile ? attachedFile.content : null, attachedFile?.filename || null)
    setText('')
    setAttached(null)
    setShowUpload(false)
  }

  const handleFileReady = (fileData) => {
    setAttached(fileData)
    setShowUpload(false)
    if (mode === 'general') setMode('summarize')
  }

  const clearFile = () => { setAttached(null); setShowUpload(false) }

  return (
    <div style={s.container}>

      {/* ── Mode buttons ── */}
      <div style={s.modeRow}>
        {MODES.map(({ id, label, icon: Icon }) => {
          const isEnhancer = id === 'prompt_enhance'
          const isHumanize = id === 'humanize'
          const isSearch   = id === 'search'
          const active     = mode === id
          const activeColor = isEnhancer ? '#a855f7' : isHumanize ? '#2dd4bf' : isSearch ? '#38bdf8' : 'var(--accent)'
          const activeBg    = isEnhancer ? 'rgba(168,85,247,0.12)' : isHumanize ? 'rgba(45,212,191,0.12)' : isSearch ? 'rgba(56,189,248,0.12)' : 'var(--accent-dim)'
          return (
            <button key={id} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
              borderRadius: 99, fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
              border:      active ? `1px solid ${activeColor}` : '1px solid var(--border-subtle)',
              background:  active ? activeBg : 'transparent',
              color:       active ? activeColor : 'var(--text-muted)',
              transition: 'all 0.13s',
            }} onClick={() => setMode(id)}>
              <Icon size={11} />{label}
            </button>
          )
        })}
      </div>

      {/* ── File upload panel ── */}
      {showUpload && (
        <div style={s.uploadPanel}>
          <div style={s.uploadHeader}>
            <span style={s.uploadTitle}>Attach a file</span>
            <button style={s.closeUpload} onClick={() => setShowUpload(false)}><X size={13} /></button>
          </div>
          <FileUpload onFileReady={handleFileReady} onClear={clearFile} attachedFile={null} />
        </div>
      )}

      {/* ── Attached file pill ── */}
      {attachedFile && !showUpload && (
        <div style={s.attachedRow}>
          <FileUpload onFileReady={handleFileReady} onClear={clearFile} attachedFile={attachedFile} />
        </div>
      )}

      {/* ── Input row: [ 📎 ] [ textarea ] [ ◯ token ] [ ➤ send ] ── */}
      <div style={s.row}>

        {/* Attach button */}
        <button
          style={s.attachBtn(showUpload || !!attachedFile)}
          onClick={() => { if (attachedFile) clearFile(); else setShowUpload(p => !p) }}
          title={attachedFile ? 'Remove file' : 'Attach file'}
          disabled={loading}
        >
          <Paperclip size={15} />
        </button>

        {/* Textarea */}
        <div style={s.inputWrap}>
          <textarea
            ref={ref} style={s.textarea} value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={
              attachedFile              ? `Ask something about ${attachedFile.filename}…` :
              mode === 'search'         ? 'Search the web for anything…'     :
              mode === 'summarize'      ? 'Paste text to summarize…'         :
              mode === 'paraphrase'     ? 'Paste text to paraphrase…'        :
              mode === 'code'           ? 'Describe your coding problem…'    :
              mode === 'prompt_enhance' ? 'Enter a rough prompt to enhance…' :
              mode === 'humanize'       ? 'Paste text to humanize…'          :
              'Ask Arc anything…'
            }
            disabled={loading} rows={1}
          />
        </div>

        {/* ◯ Token ring — sits between textarea and send */}
        <TokenRing messages={messages} inputText={text} mode={mode} />

        {/* Send button */}
        <button style={s.sendBtn(canSend)} onClick={send} disabled={!canSend}>
          <Send size={15} />
        </button>

      </div>

      <p style={s.hint}>Enter to send · Shift+Enter for new line</p>
    </div>
  )
}

const s = {
  container:    { padding: '12px 20px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)', flexShrink: 0 },
  modeRow:      { display: 'flex', gap: 5, marginBottom: 9, flexWrap: 'wrap' },
  uploadPanel:  { marginBottom: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 12px' },
  uploadHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  uploadTitle:  { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' },
  closeUpload:  { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' },
  attachedRow:  { marginBottom: 8 },
  row:          { display: 'flex', gap: 8, alignItems: 'flex-end' },
  attachBtn: (active) => ({
    width: 38, height: 38, borderRadius: 9, flexShrink: 0,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`,
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.13s',
  }),
  inputWrap: { flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 12, transition: 'border-color 0.15s' },
  textarea:  { width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.6, padding: '10px 14px', minHeight: 44, maxHeight: 180, display: 'block' },
  sendBtn: (can) => ({ width: 38, height: 38, borderRadius: 9, border: 'none', background: can ? 'var(--accent)' : 'var(--bg-elevated)', color: can ? '#0c0c0e' : 'var(--text-muted)', cursor: can ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.13s' }),
  hint:      { fontSize: 11, color: 'var(--text-muted)', marginTop: 7, textAlign: 'center' },
}