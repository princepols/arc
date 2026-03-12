/**
 * Arc AI - Message Component v2
 * User messages: right-aligned bubble
 * Arc messages:  left-aligned with avatar, with full table support
 */
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { AlertCircle, Copy, Check, ThumbsUp, ThumbsDown, Volume2, VolumeX } from 'lucide-react'
import arcLogo from '../assets/arclogo.png'
import { Avatar } from './ProfileModal'

const MODE_LABELS = {
  general: null,
  search: '🔍 Web Search',
  summarize: '∑ Summary',
  paraphrase: '↺ Paraphrase',
  code: '</> Code',
  prompt_enhance: '✦ Enhanced Prompt',
  humanize: '🧬 Humanized',
}

// ── Preprocess markdown to fix table cell line breaks ─────────────────────────
function preprocessMarkdown(text) {
  if (!text) return text

  const lines = text.split('\n')
  const out   = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (/^\s*\|/.test(line)) {
      const tableLines = []

      while (i < lines.length) {
        const l = lines[i]
        const isTableRow  = /^\s*\|/.test(l)
        const isSeparator = /^\s*[-|:\s]+$/.test(l) && l.includes('-') && l.includes('|')
        const isContinuation = !isTableRow && !isSeparator && l.trim().length > 0 && !/^#+\s/.test(l) && !/^```/.test(l)

        if (isTableRow || isSeparator) {
          tableLines.push(l)
          i++
        } else if (isContinuation && tableLines.length > 0) {
          const cleaned = l.trim().replace(/^[•\-\*]\s*/, '')
          tableLines[tableLines.length - 1] += '; ' + cleaned
          i++
        } else {
          break
        }
      }

      const processed = tableLines.map(row => {
        const isSep = /^\s*[-|:\s]+$/.test(row) && row.includes('-') && row.includes('|')
        if (isSep) return row
        return row.replace(/([^|])\s*[•\-\*]\s+/g, (_, pre) => pre + '; ')
                  .replace(/\|\s*[•\-\*]\s+/g, '| ')
      })

      out.push(...processed)
      continue
    }

    out.push(line)
    i++
  }

  return out.join('\n')
}

// ── TTS — strip markdown/symbols, speak with preferred voice ──────────────────
function cleanForSpeech(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' code block ')  // fenced code blocks
    .replace(/`[^`]*`/g, '')                       // inline code
    .replace(/#{1,6}\s/g, '')                      // headings
    .replace(/\*\*|__|\*|_|~~|>|`/g, '')           // bold/italic/quote markers
    .replace(/["""''()\[\]{};:,\-–—\/\\|<>@#$%^&*+=~]/g, ' ') // punctuation & symbols
    .replace(/🔍|📌|📎|✅|⚠️|•|→|←|★|©|®|™/g, '') // emojis & special chars
    .replace(/https?:\/\/\S+/g, '')                // URLs
    .replace(/\s{2,}/g, ' ')                       // collapse extra spaces
    .trim()
}

// Single global reference — only one message speaks at a time
let _activeSetSpeaking = null

function useTTS() {
  const [speaking, setSpeaking] = useState(false)

  const speak = (text) => {
    if (!window.speechSynthesis) return

    // Stop any currently speaking message
    window.speechSynthesis.cancel()
    if (_activeSetSpeaking) { _activeSetSpeaking(false); _activeSetSpeaking = null }

    const cleaned = cleanForSpeech(text)
    if (!cleaned) return

    const utterance = new SpeechSynthesisUtterance(cleaned)
    utterance.lang  = 'en-US'
    utterance.rate  = 1.0
    utterance.pitch = 1.0

    const assignVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      // Priority: Florian → Dragon (en) → en-US male → any en-US
      const voice =
        voices.find(v => v.name.toLowerCase().includes('florian')) ||
        voices.find(v => v.name.toLowerCase().includes('dragon') && v.lang.startsWith('en')) ||
        voices.find(v => v.lang === 'en-US' && /david|guy|mark|male/i.test(v.name)) ||
        voices.find(v => v.lang === 'en-US')
      if (voice) utterance.voice = voice
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      assignVoice()
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', function once() {
        assignVoice()
        window.speechSynthesis.removeEventListener('voiceschanged', once)
      })
    }

    utterance.onstart = () => { setSpeaking(true);  _activeSetSpeaking = setSpeaking }
    utterance.onend   = () => { setSpeaking(false); _activeSetSpeaking = null }
    utterance.onerror = () => { setSpeaking(false); _activeSetSpeaking = null }

    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    _activeSetSpeaking = null
  }

  return { speaking, speak, stop }
}

// ── Custom table components ───────────────────────────────────────────────────
const TableWrapper = ({ children }) => (
  <div style={{
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    margin: '0.9em 0',
    borderRadius: 8,
    border: '1px solid var(--border-mid)',
  }}>
    <table style={{
      borderCollapse: 'collapse',
      width: '100%',
      minWidth: 400,
      fontSize: 13,
      lineHeight: 1.55,
    }}>
      {children}
    </table>
  </div>
)

const Th = ({ children }) => (
  <th style={{
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontWeight: 700,
    padding: '9px 14px',
    textAlign: 'left',
    borderBottom: '2px solid var(--border-mid)',
    borderRight: '1px solid var(--border-subtle)',
    whiteSpace: 'nowrap',
    fontSize: 12,
    letterSpacing: '0.02em',
  }}>
    {children}
  </th>
)

const Td = ({ children }) => (
  <td style={{
    padding: '8px 14px',
    borderBottom: '1px solid var(--border-subtle)',
    borderRight: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
    verticalAlign: 'top',
    maxWidth: 320,
    wordBreak: 'break-word',
  }}>
    {children}
  </td>
)

const Tr = ({ children, isHeader }) => (
  <tr style={{
    background: isHeader ? 'var(--bg-elevated)' : 'transparent',
    transition: 'background 0.1s',
  }}
  onMouseEnter={e => { if (!isHeader) e.currentTarget.style.background = 'var(--bg-elevated)' }}
  onMouseLeave={e => { if (!isHeader) e.currentTarget.style.background = 'transparent' }}
  >
    {children}
  </tr>
)

// ── Markdown component map ────────────────────────────────────────────────────
function makeComponents() {
  return {
    code({ inline, className, children, ...props }) {
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
    },
    table: ({ children })  => <TableWrapper>{children}</TableWrapper>,
    thead: ({ children })  => <thead>{children}</thead>,
    tbody: ({ children })  => <tbody>{children}</tbody>,
    tr:    ({ children })  => <Tr>{children}</Tr>,
    th:    ({ children })  => <Th>{children}</Th>,
    td:    ({ children })  => <Td>{children}</Td>,
  }
}

// ── Copy button ───────────────────────────────────────────────────────────────
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

// ── Arc action bar ────────────────────────────────────────────────────────────
function ArcActions({ content }) {
  const [copied,   setCopied]   = useState(false)
  const [feedback, setFeedback] = useState(null)
  const { speaking, speak, stop } = useTTS()

  const copy = async () => {
    await navigator.clipboard.writeText(content).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 8 }}>

      {/* Copy */}
      <button style={s.actionBtn(copied)} onClick={copy} title={copied ? 'Copied!' : 'Copy'}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>

      {/* Speak / Stop — highlights blue while speaking */}
      <button
        style={s.actionBtn(speaking, '#38bdf8')}
        onClick={() => speaking ? stop() : speak(content)}
        title={speaking ? 'Stop speaking' : 'Read aloud'}
      >
        {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
      </button>

      <div style={{ width: 1, height: 12, background: 'var(--border-subtle)', margin: '0 3px' }} />

      {/* Feedback */}
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

// ── Tag color helpers ─────────────────────────────────────────────────────────
function modeTagStyle(mode) {
  if (mode === 'prompt_enhance') return { color: '#a855f7', background: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.22)' }
  if (mode === 'humanize')       return { color: '#2dd4bf', background: 'rgba(45,212,191,0.1)',  borderColor: 'rgba(45,212,191,0.22)' }
  if (mode === 'search')         return { color: '#38bdf8', background: 'rgba(56,189,248,0.1)',  borderColor: 'rgba(56,189,248,0.22)' }
  return {}
}

// ── Message ───────────────────────────────────────────────────────────────────
export default function Message({ message, profile }) {
  const { role, content, mode } = message
  const modeLabel   = MODE_LABELS[mode]
  const isUser      = role === 'user'
  const mdComponents = makeComponents()

  if (role === 'error') return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, color: '#f87171', fontSize: 12, maxWidth: '80%' }}>
        <AlertCircle size={13} />
        {content}
      </div>
    </div>
  )

  // ── USER ──────────────────────────────────────────────────────────────────
  if (isUser) return (
    <div style={s.userRow}>
      <div style={s.userBubbleWrap}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
          {modeLabel && <span style={{ ...s.tag, ...modeTagStyle(mode) }}>{modeLabel}</span>}
          <span style={s.userName}>{profile?.displayName || 'You'}</span>
        </div>
        <div style={s.userBubble}>{content}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <CopyBtn content={content} />
        </div>
      </div>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <Avatar profile={profile || { displayName: 'You', avatar: null }} size={28} fontSize={11} />
      </div>
    </div>
  )

  // ── ARC ───────────────────────────────────────────────────────────────────
  return (
    <div style={s.arcRow}>
      <div style={s.arcAvatar}>
        <img src={arcLogo} alt="Arc" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }} />
      </div>
      <div style={s.arcContent}>
        <div style={s.arcMeta}>
          <span style={s.arcName}>Arc</span>
          {modeLabel && <span style={{ ...s.tag, ...modeTagStyle(mode) }}>{modeLabel}</span>}
        </div>
        <div style={s.arcBubble} className="prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={mdComponents}
          >
            {preprocessMarkdown(content)}
          </ReactMarkdown>
        </div>
        <ArcActions content={content} />
      </div>
    </div>
  )
}

const s = {
  userRow:        { display: 'flex', justifyContent: 'flex-end', padding: '10px 0', animation: 'fadeSlideIn 0.2s ease forwards', gap: 8 },
  userBubbleWrap: { maxWidth: '72%', display: 'flex', flexDirection: 'column' },
  userBubble:     { background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: '18px 18px 4px 18px', padding: '10px 15px', fontSize: 14, lineHeight: 1.65, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  userName:       { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.01em' },
  arcRow:         { display: 'flex', alignItems: 'flex-start', gap: 11, padding: '10px 0', animation: 'fadeSlideIn 0.2s ease forwards' },
  arcAvatar:      { width: 30, height: 30, borderRadius: 8, flexShrink: 0, overflow: 'hidden', marginTop: 2 },
  arcContent:     { flex: 1, minWidth: 0 },
  arcMeta:        { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 },
  arcName:        { fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.01em' },
  arcBubble:      { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '4px 18px 18px 18px', padding: '10px 15px', fontSize: 14, lineHeight: 1.75, color: 'var(--text-primary)', overflowX: 'auto' },
  tag:            { fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', padding: '1px 7px', borderRadius: 99, letterSpacing: '0.04em' },
  actionBtn:      (active, color) => ({ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: active ? (color || 'var(--accent)') : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.13s' }),
  toast:          { fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 },
}