/**
 * Arc AI - Guest Limit Modal
 * Shows when guest user hits the 5 prompt limit.
 */
import { useEffect } from 'react'

export default function GuestLimitModal({ onSignUp, onLogin }) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        {/* Icon */}
        <div style={s.iconWrap}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>

        {/* Text */}
        <h2 style={s.title}>You've reached the guest limit</h2>
        <p style={s.desc}>
          You've used all <strong>5 free prompts</strong>. Create a free account to unlock unlimited access to Arc — no credit card required.
        </p>

        {/* Perks */}
        <div style={s.perks}>
          {['Unlimited messages', 'Chat history saved', 'Web search & file upload', 'All 7 AI modes'].map(p => (
            <div key={p} style={s.perk}>
              <span style={s.check}>✓</span>
              <span>{p}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <button style={s.btnPrimary} onClick={onSignUp}>
          Create Free Account
        </button>
        <button style={s.btnSecondary} onClick={onLogin}>
          Sign In
        </button>

      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
    backdropFilter: 'blur(4px)',
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-mid)',
    borderRadius: 18,
    padding: '36px 32px',
    maxWidth: 420,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 0,
    animation: 'fadeSlideIn 0.25s ease',
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'rgba(234,179,8,0.1)',
    border: '1px solid rgba(234,179,8,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20, fontWeight: 700,
    color: 'var(--text-primary)', margin: '0 0 10px',
  },
  desc: {
    fontSize: 14, color: 'var(--text-secondary)',
    lineHeight: 1.6, margin: '0 0 20px',
  },
  perks: {
    width: '100%', display: 'flex', flexDirection: 'column',
    gap: 8, marginBottom: 24,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 10, padding: '14px 16px',
  },
  perk: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13, color: 'var(--text-secondary)', textAlign: 'left',
  },
  check: {
    color: '#4ade80', fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  btnPrimary: {
    width: '100%', padding: '12px 0',
    background: 'var(--accent)', color: '#000',
    border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    marginBottom: 10, transition: 'opacity 0.15s',
  },
  btnSecondary: {
    width: '100%', padding: '11px 0',
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-mid)',
    borderRadius: 10, fontSize: 14,
    cursor: 'pointer', transition: 'all 0.15s',
  },
}