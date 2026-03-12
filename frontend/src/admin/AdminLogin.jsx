/**
 * Arc AI — Admin Login
 * Separate credential gate before the dashboard.
 * Stores admin JWT in sessionStorage (cleared on tab close).
 */

import { useState } from 'react'
import { adminAPI } from '../utils/api'

export default function AdminLogin({ onLogin }) {
  const [form,    setForm]    = useState({ username: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [shake,   setShake]   = useState(false)

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await adminAPI.login(form)
      sessionStorage.setItem('arc_admin_token', data.token)
      onLogin()
    } catch (e) {
      setError(e.message)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .admin-card { animation: fadeUp 0.5s ease forwards; }
        .admin-card.shake { animation: shake 0.45s ease; }
        .admin-input:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
        .admin-btn:hover:not(:disabled) { background: #dc2626 !important; transform: translateY(-1px); }
      `}</style>

      {/* Scanline overlay */}
      <div style={s.scanlines} />
      {/* Red corner accent */}
      <div style={s.cornerTL} />
      <div style={s.cornerBR} />

      <div className={`admin-card${shake ? ' shake' : ''}`} style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.badgeRow}>
            <span style={s.redDot} />
            <span style={s.badgeText}>RESTRICTED ACCESS</span>
          </div>
          <div style={s.shield}>⬡</div>
          <h1 style={s.title}>Admin Portal</h1>
          <p style={s.sub}>Arc AI Control Center · Authorized Personnel Only</p>
        </div>

        {/* Divider */}
        <div style={s.divider} />

        {/* Form */}
        <div style={s.form}>
          <div style={s.field}>
            <label style={s.label}>USERNAME</label>
            <input
              className="admin-input"
              style={s.input}
              placeholder="admin username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoComplete="off"
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>PASSWORD</label>
            <input
              className="admin-input"
              style={s.input}
              placeholder="••••••••••••"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoComplete="off"
            />
          </div>

          {error && (
            <div style={s.errorBox}>
              <span style={{ color: '#ef4444', marginRight: 6 }}>⚠</span>
              {error}
            </div>
          )}

          <button
            className="admin-btn"
            style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={s.spinner} /> AUTHENTICATING…
              </span>
            ) : 'AUTHENTICATE →'}
          </button>
        </div>

        <div style={s.footer}>
          Arc AI Admin · Session expires on tab close
        </div>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh', width: '100vw',
    background: '#070709',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    position: 'relative', overflow: 'hidden',
  },
  scanlines: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
  },
  cornerTL: {
    position: 'fixed', top: 0, left: 0,
    width: 200, height: 200,
    background: 'radial-gradient(ellipse at top left, rgba(239,68,68,0.07), transparent 70%)',
    pointerEvents: 'none',
  },
  cornerBR: {
    position: 'fixed', bottom: 0, right: 0,
    width: 300, height: 300,
    background: 'radial-gradient(ellipse at bottom right, rgba(239,68,68,0.05), transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 420,
    background: '#0d0d10',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 4,
    boxShadow: '0 0 60px rgba(239,68,68,0.08), 0 2px 40px rgba(0,0,0,0.8)',
    overflow: 'hidden',
  },
  header: {
    padding: '32px 32px 24px',
    textAlign: 'center',
    background: 'linear-gradient(180deg, rgba(239,68,68,0.05) 0%, transparent 100%)',
  },
  badgeRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginBottom: 20,
  },
  redDot: {
    display: 'inline-block', width: 6, height: 6,
    borderRadius: '50%', background: '#ef4444',
    boxShadow: '0 0 8px #ef4444',
  },
  badgeText: {
    fontSize: 10, fontWeight: 700, color: '#ef4444',
    letterSpacing: '0.18em',
  },
  shield: {
    fontSize: 36, color: '#ef4444',
    textShadow: '0 0 20px rgba(239,68,68,0.5)',
    display: 'block', marginBottom: 14,
  },
  title: {
    fontSize: 22, fontWeight: 800, color: '#f5f5f5',
    letterSpacing: '-0.02em', margin: '0 0 6px',
  },
  sub: { fontSize: 10, color: '#4a4a55', letterSpacing: '0.06em', margin: 0 },
  divider: { height: 1, background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)' },
  form: { padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 10, color: '#5a5a68', letterSpacing: '0.14em', fontWeight: 700 },
  input: {
    background: '#111116', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 3, padding: '11px 14px',
    color: '#e8e8f0', fontFamily: 'inherit', fontSize: 13,
    outline: 'none', transition: 'all 0.2s',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 3, padding: '10px 12px',
    fontSize: 12, color: '#fca5a5',
  },
  btn: {
    background: '#ef4444', border: 'none', borderRadius: 3,
    color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
    letterSpacing: '0.1em', padding: '13px',
    cursor: 'pointer', transition: 'all 0.2s', marginTop: 4,
  },
  spinner: {
    display: 'inline-block', width: 12, height: 12,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  footer: {
    padding: '12px 32px', borderTop: '1px solid rgba(255,255,255,0.04)',
    fontSize: 10, color: '#2e2e38', textAlign: 'center', letterSpacing: '0.06em',
  },
}