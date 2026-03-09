/**
 * Arc AI - Welcome Screen (Revamped)
 */
import { FileText, RefreshCw, Code2, HelpCircle, Wand2 } from 'lucide-react'
import arcLogo from '../assets/arclogo.png'

const SUGGESTIONS = [
  { icon: FileText,  mode: 'summarize',      title: 'Summarize',        prompt: 'Summarize this article: The James Webb Space Telescope...', accent: null },
  { icon: RefreshCw, mode: 'paraphrase',      title: 'Paraphrase',       prompt: 'Paraphrase: The mitochondria is the powerhouse of the cell.', accent: null },
  { icon: Code2,     mode: 'code',            title: 'Code Help',        prompt: 'Write a Python function to parse a CSV file.', accent: null },
  { icon: HelpCircle,mode: 'general',         title: 'Ask Anything',     prompt: 'What are the key differences between REST and GraphQL?', accent: null },
  { icon: Wand2,     mode: 'prompt_enhance',  title: 'Prompt Enhancer',  prompt: 'write a blog post about AI', accent: '#a855f7' },
]

export default function WelcomeScreen({ username, onSuggestion }) {
  return (
    <div style={s.container}>
      <div style={s.hero}>
        <img src={arcLogo} alt="Arc" style={s.logo} />
        <h1 style={s.title}>Hello, {username}!</h1>
        <p style={s.sub}>What can I help you with today?</p>
      </div>
      <div style={s.grid}>
        {SUGGESTIONS.map(({ icon: Icon, mode, title, prompt, accent }) => (
          <button
            key={mode}
            style={s.card}
            onClick={() => onSuggestion(prompt, mode)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent || 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: accent || 'var(--accent)', marginBottom: 6 }}>
              <Icon size={13} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
            </div>
            <p style={s.prompt}>{prompt}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

const s = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 24px', gap: 28 },
  hero: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' },
  logo: { width: 68, height: 68, borderRadius: 18, objectFit: 'cover', boxShadow: '0 0 48px var(--accent-glow)' },
  title: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 },
  sub: { fontSize: 13, color: 'var(--text-muted)', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 600 },
  card: { background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' },
  prompt: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 },
}
