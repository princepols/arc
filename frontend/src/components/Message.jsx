/**
 * Arc AI - Message Component v2
 * User messages: right-aligned bubble
 * Arc messages:  left-aligned with avatar
 */
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { AlertCircle, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import arcLogo from '../assets/arclogo.png'

const MODE_LABELS = {
  general: null,
  search: '🔍 Web Search',
  summarize: '∑ Summary',
  paraphrase: '↺ Paraphrase',
  code: '</> Code',
  prompt_enhance: '✦ Enhanced Prompt',
  humanize: '🧬 Humanized',
}

function CodeBlock({ inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '')
  return !inline && match ? (
    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
      customStyle={{ background: '#0a0a0d', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: '12.5px', margin: '0.75em 0' }} {...props}>
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85em', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', padding: '0.15em 0.45em', borderRadius: 4, color: 'var(--accent)' }} {...props}>
      {children}
    </code>
  )
}

// Copy button for user messages (right side)
function CopyBtn({ content }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(content).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button style={s.actionBtn(copied)} onClick={copy} title={copied ? 'Copied!' : 'Copy'}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

// Action bar for Arc messages (left side)
function ArcActions({ content }) {
  const [copied, setCopied]     = useState(false)
  const [feedback, setFeedback] = useState(null)
  const copy = async () => {
    await navigator.clipboard.writeText(content).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 8 }}>
      <button style={s.actionBtn(copied)} onClick={copy} title={copied ? 'Copied!' : 'Copy'}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      <div style={{ width: 1, height: 12, background: 'var(--border-subtle)', margin: '0 3px' }} />
      <button style={s.actionBtn(feedback === 'up', '#4ade80')} onClick={() => setFeedback(p => p === 'up' ? null : 'up')} title="Good response">
        <ThumbsUp size={12} />
      </button>
      <button style={s.actionBtn(feedback === 'down', '#f87171')} onClick={() => setFeedback(p => p === 'down' ? null : 'down')} title="Bad response">
        <ThumbsDown size={12} />
      </button>
      {feedback === 'up'   && <span style={s.toast}>Thanks!</span>}
      {feedback === 'down' && <span style={s.toast}>Got it.</span>}
    </div>
  )
}

export default function Message({ message }) {
  const { role, content, mode } = message
  const modeLabel = MODE_LABELS[mode]
  const isUser = role === 'user'

  // Error message — centered
  if (role === 'error') return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, color: '#f87171', fontSize: 12, maxWidth: '80%' }}>
        <AlertCircle size={13} />
        {content}
      </div>
    </div>
  )

  // ── USER MESSAGE (right-aligned bubble) ──────────────────────────────────
  if (isUser) return (
    <div style={s.userRow}>
      <div style={s.userBubbleWrap}>
        {/* Mode tag above bubble */}
        {modeLabel && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
            <span style={{
              ...s.tag,
              ...(mode === 'prompt_enhance' ? { color: '#a855f7', background: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.22)' } : {}),
              ...(mode === 'humanize'       ? { color: '#2dd4bf', background: 'rgba(45,212,191,0.1)',  borderColor: 'rgba(45,212,191,0.22)'  } : {}),
              ...(mode === 'search'         ? { color: '#38bdf8', background: 'rgba(56,189,248,0.1)',  borderColor: 'rgba(56,189,248,0.22)'  } : {}),
            }}>
              {modeLabel}
            </span>
          </div>
        )}
        <div style={s.userBubble}>
          {content}
        </div>
        {/* Copy button below bubble, right-aligned */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <CopyBtn content={content} />
        </div>
      </div>
    </div>
  )

  // ── ARC MESSAGE (left-aligned with avatar) ───────────────────────────────
  return (
    <div style={s.arcRow}>
      {/* Avatar */}
      <div style={s.arcAvatar}>
        <img src={arcLogo} alt="Arc" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }} />
      </div>

      {/* Content */}
      <div style={s.arcContent}>
        <div style={s.arcMeta}>
          <span style={s.arcName}>Arc</span>
          {modeLabel && (
            <span style={{
              ...s.tag,
              ...(mode === 'prompt_enhance' ? { color: '#a855f7', background: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.22)' } : {}),
              ...(mode === 'humanize'       ? { color: '#2dd4bf', background: 'rgba(45,212,191,0.1)',  borderColor: 'rgba(45,212,191,0.22)'  } : {}),
              ...(mode === 'search'         ? { color: '#38bdf8', background: 'rgba(56,189,248,0.1)',  borderColor: 'rgba(56,189,248,0.22)'  } : {}),
            }}>
              {modeLabel}
            </span>
          )}
        </div>
        <div style={s.arcBubble} className="prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
            {content}
          </ReactMarkdown>
        </div>
        <ArcActions content={content} />
      </div>
    </div>
  )
}

const s = {
  // ── User (right) ──────────────────────────────────────────────────────────
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '10px 0',
    animation: 'fadeSlideIn 0.2s ease forwards',
  },
  userBubbleWrap: {
    maxWidth: '72%',
    display: 'flex',
    flexDirection: 'column',
  },
  userBubble: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    borderRadius: '18px 18px 4px 18px',
    padding: '10px 15px',
    fontSize: 14,
    lineHeight: 1.65,
    color: 'var(--text-primary)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },

  // ── Arc (left) ────────────────────────────────────────────────────────────
  arcRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 11,
    padding: '10px 0',
    animation: 'fadeSlideIn 0.2s ease forwards',
  },
  arcAvatar: {
    width: 30, height: 30,
    borderRadius: 8,
    flexShrink: 0,
    overflow: 'hidden',
    marginTop: 2,
  },
  arcContent: {
    flex: 1,
    minWidth: 0,
    maxWidth: '85%',
  },
  arcMeta: {
    display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5,
  },
  arcName: {
    fontSize: 12, fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '0.01em',
  },
  arcBubble: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '4px 18px 18px 18px',
    padding: '10px 15px',
    fontSize: 14,
    lineHeight: 1.75,
    color: 'var(--text-primary)',
  },

  // ── Shared ────────────────────────────────────────────────────────────────
  tag: {
    fontSize: 10, color: 'var(--text-muted)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    padding: '1px 7px', borderRadius: 99, letterSpacing: '0.04em',
  },
  actionBtn: (active, color) => ({
    width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent',
    color: active ? (color || 'var(--accent)') : 'var(--text-muted)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.13s',
  }),
  toast: { fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 },
}