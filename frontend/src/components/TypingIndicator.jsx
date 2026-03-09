/**
 * Arc AI - Typing Indicator
 * Animated dots shown while the AI is generating a response.
 */

import { Zap } from 'lucide-react'

const styles = `
  @keyframes pulse-dot {
    0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
    40%           { opacity: 1;   transform: scale(1); }
  }
  .dot { animation: pulse-dot 1.2s ease-in-out infinite; }
  .dot:nth-child(2) { animation-delay: 0.15s; }
  .dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

export default function TypingIndicator() {
  return (
    <>
      <style>{styles}</style>
      <div style={{
        display: 'flex',
        gap: '14px',
        padding: '20px 0',
        borderBottom: '1px solid var(--border-subtle)',
        animation: 'fadeSlideIn 0.2s ease forwards',
      }}>
        {/* Avatar */}
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '7px',
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
        }}>
          <Zap size={13} color="#0c0c0e" strokeWidth={2.5} fill="#0c0c0e" />
        </div>

        {/* Dots */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          paddingTop: '6px',
        }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'block',
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
