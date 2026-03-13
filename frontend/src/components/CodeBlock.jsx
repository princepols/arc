/**
 * Arc AI - Code Block with Copy Button
 * Reusable component for displaying code with a copy-to-clipboard button
 */
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false)
  
  const code = String(children).replace(/\n$/, '')
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div style={s.container}>
      {/* Language label + copy button row */}
      <div style={s.header}>
        <span style={s.language}>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          style={s.copyBtn(copied)}
          title={copied ? 'Copied!' : 'Copy code'}
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Code content */}
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          background: '#0a0a0d',
          border: 'none',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          fontSize: '12.5px',
          margin: '0',
          padding: '12px 14px',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

const s = {
  container: {
    margin: '0.75em 0',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid var(--border-subtle)',
    background: '#0a0a0d',
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    borderBottom: '1px solid var(--border-subtle)',
    padding: '8px 12px',
  },
  
  language: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    textTransform: 'lowercase',
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  
  copyBtn: (copied) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 4,
    border: '1px solid var(--border-subtle)',
    background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
    color: copied ? '#4ade80' : 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontSize: 0,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
}
