/**
 * Arc AI — Admin Dashboard: Security Section
 * Activity logs, event filters, suspicious activity view
 */

import { useEffect, useState } from 'react'
import { adminAPI } from '../utils/api'

const EVENT_TYPES = ['', 'login', 'ban', 'unban', 'password_reset', 'suspicious', 'error']

const EVENT_STYLE = {
  login:          { color: '#60a5fa', icon: '' },
  ban:            { color: '#f87171', icon: '' },
  unban:          { color: '#34d399', icon: ''  },
  password_reset: { color: '#fbbf24', icon: '' },
  suspicious:     { color: '#ef4444', icon: ''  },
  error:          { color: '#f87171', icon: ''  },
  message:        { color: '#a78bfa', icon: '' },
}

// ── Security score card ───────────────────────────────────────────────────────
function SecurityScore({ logs }) {
  const suspicious = logs.filter(l => l.event_type === 'suspicious').length
  const bans       = logs.filter(l => l.event_type === 'ban').length
  const errors     = logs.filter(l => l.event_type === 'error').length
  const score      = Math.max(0, 100 - suspicious * 10 - bans * 5 - errors * 2)
  const color      = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#ef4444'
  const label      = score >= 80 ? 'HEALTHY' : score >= 50 ? 'WARNING' : 'CRITICAL'

  return (
    <div style={s.scoreCard}>
      <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em', marginBottom: 14 }}>SECURITY SCORE</div>
      <div style={{ fontSize: 52, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.1em', marginTop: 6 }}>{label}</div>
      <div style={s.scoreBreakdown}>
        {[['Suspicious', suspicious, '#ef4444'], ['Bans', bans, '#f87171'], ['Errors', errors, '#fbbf24']].map(([lbl, val, col]) => (
          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid #111' }}>
            <span style={{ color: '#555' }}>{lbl}</span>
            <span style={{ color: col, fontWeight: 700 }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SecuritySection() {
  const [logs,    setLogs]    = useState([])
  const [filter,  setFilter]  = useState('')
  const [loading, setLoading] = useState(true)

  const fetchLogs = (type) => {
    setLoading(true)
    setFilter(type)
    adminAPI.logs(type).then(setLogs).finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs('') }, [])

  const ev = (type) => EVENT_STYLE[type] || { color: '#666', icon: '•' }

  return (
    <div style={s.root}>
      <div style={s.layout}>
        {/* Left: score + filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SecurityScore logs={logs} />

          {/* Event type filters */}
          <div style={s.panel}>
            <div style={s.panelTitle}>FILTER BY EVENT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {EVENT_TYPES.map(t => (
                <button key={t} onClick={() => fetchLogs(t)}
                  style={{ ...s.filterBtn, background: filter === t ? '#161620' : 'transparent',
                    color: filter === t ? '#e8e8f0' : '#555',
                    borderLeft: `3px solid ${filter === t ? '#ef4444' : 'transparent'}` }}>
                  {t ? `${ev(t).icon} ${t}` : 'All Events'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: log list */}
        <div style={s.logPanel}>
          <div style={s.panelTitle}>
            ACTIVITY LOG
            <span style={{ float: 'right', color: '#333', fontWeight: 400 }}>{logs.length} entries</span>
          </div>

          {loading ? (
            <div style={s.center}>Loading logs…</div>
          ) : !logs.length ? (
            <div style={s.center}>No activity logs yet</div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {logs.map((log, i) => {
                const { color, icon } = ev(log.event_type)
                return (
                  <div key={i} style={s.logRow}>
                    <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.06em' }}>
                          {log.event_type.toUpperCase()}
                        </span>
                        {log.username && <span style={{ fontSize: 11, color: '#555' }}>@{log.username}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.description || '—'}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: '#333', flexShrink: 0, textAlign: 'right' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* API monitoring info card */}
      <div style={s.infoCard}>
        <div style={s.panelTitle}>API KEY MONITORING</div>
        <div style={s.infoGrid}>
          {[
            ['Groq API',   'GEMINI_API_KEY',   'Active — GPT-OSS-120B via Groq'],
            ['Tavily',     'TAVILY_API_KEY',   'Active — 1000 free searches/month'],
            ['JWT Secret', 'JWT_SECRET',       'Session tokens (72h expiry)'],
            ['SMTP',       'SMTP_EMAIL',       'Gmail OTP verification'],
          ].map(([name, key, desc]) => (
            <div key={name} style={s.keyRow}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={s.greenDot} />
                <span style={{ fontWeight: 600, fontSize: 13, color: '#d0d0dc' }}>{name}</span>
              </div>
              <code style={{ fontSize: 11, color: '#555', background: '#111', padding: '2px 7px', borderRadius: 3 }}>{key}</code>
              <span style={{ fontSize: 11, color: '#666' }}>{desc}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#333', marginTop: 12, marginBottom: 0 }}>
          API keys are stored in <code style={{ color: '#555' }}>.env</code> and never exposed to the frontend.
        </p>
      </div>
    </div>
  )
}

const s = {
  root:       { display: 'flex', flexDirection: 'column', gap: 16 },
  layout:     { display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' },
  scoreCard:  { background: '#0d0d10', border: '1px solid #1a1a22', borderTop: '2px solid #ef4444', borderRadius: 6, padding: '20px 18px' },
  scoreBreakdown: { marginTop: 14 },
  panel:      { background: '#0d0d10', border: '1px solid #1a1a22', borderRadius: 6, padding: '16px 14px' },
  panelTitle: { fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: '0.12em', marginBottom: 12 },
  filterBtn:  { background: 'transparent', border: 'none', borderLeft: '3px solid transparent', padding: '7px 10px', color: '#555', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', textAlign: 'left', borderRadius: '0 4px 4px 0', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.04em' },
  logPanel:   { background: '#0d0d10', border: '1px solid #1a1a22', borderRadius: 6, padding: '16px 18px' },
  logRow:     { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #0f0f14' },
  center:     { padding: 40, textAlign: 'center', color: '#444', fontSize: 13 },
  infoCard:   { background: '#0d0d10', border: '1px solid #1a1a22', borderRadius: 6, padding: '18px 20px' },
  infoGrid:   { display: 'flex', flexDirection: 'column', gap: 8 },
  keyRow:     { display: 'grid', gridTemplateColumns: '140px 200px 1fr', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #111' },
  greenDot:   { display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', flexShrink: 0 },
}