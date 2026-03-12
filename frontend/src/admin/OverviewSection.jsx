/**
 * Arc AI — Admin Dashboard: Overview Section
 * Stat cards + 7-day chart + top users + alerts
 */

import { useEffect, useState } from 'react'
import { adminAPI } from '../utils/api'

// ── Mini bar chart (pure CSS/SVG) ─────────────────────────────────────────────
function BarChart({ data, color = '#ef4444' }) {
  if (!data?.length) return <div style={{ color: '#333', fontSize: 12, padding: 20 }}>No data yet</div>
  const max = Math.max(...data.map(d => d.count || d.total || d.user || 0), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, padding: '0 4px' }}>
      {data.map((d, i) => {
        const val = d.count || d.total || d.user || 0
        const h   = Math.max((val / max) * 80, 2)
        const day = d.day ? new Date(d.day).toLocaleDateString('en', { weekday: 'short' }) : d.hour
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            title={`${day}: ${val}`}>
            <div style={{ width: '100%', height: h, background: color, borderRadius: '2px 2px 0 0', opacity: 0.85, transition: 'height 0.5s ease', minHeight: 2 }} />
            <span style={{ fontSize: 8, color: '#444', transform: 'rotate(-40deg)', transformOrigin: 'top center', whiteSpace: 'nowrap' }}>{day}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = '#ef4444', delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t) }, [delay])
  return (
    <div style={{ ...st.statCard, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.4s ease', borderTopColor: color }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: '#c0c0cc', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OverviewSection() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    adminAPI.dashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadState />
  if (error)   return <ErrorState msg={error} />
  const { stats, daily_messages, top_users, alerts } = data

  return (
    <div style={st.root}>
      {/* Stats grid */}
      <div style={st.statsGrid}>
        <StatCard delay={0}   icon="" label="Total Users"      value={stats.total_users}     color="#60a5fa" />
        <StatCard delay={60}  icon="" label="Banned Users"     value={stats.banned_users}    color="#f87171" />
        <StatCard delay={120} icon="" label="Total Messages"   value={stats.total_messages?.toLocaleString()}  color="#34d399" />
        <StatCard delay={180} icon="" label="Messages Today"   value={stats.messages_today}  color="#fbbf24" />
        <StatCard delay={240} icon="" label="Messages / Week"  value={stats.messages_week}   color="#a78bfa" />
        <StatCard delay={300} icon=""  label="Chat Sessions"   value={stats.total_sessions}  color="#fb923c" />
        <StatCard delay={360} icon="" label="New Users Today"  value={stats.new_users_today} color="#2dd4bf" />
      </div>

      {/* Row: Chart + Top Users */}
      <div style={st.row}>
        {/* 7-day traffic chart */}
        <div style={st.panel}>
          <div style={st.panelTitle}>7-Day Message Traffic</div>
          <BarChart data={daily_messages} color="#ef4444" />
          {!daily_messages?.length && <div style={st.empty}>No data yet — messages will appear here</div>}
        </div>

        {/* Top users */}
        <div style={st.panel}>
          <div style={st.panelTitle}>Most Active Users</div>
          {top_users?.length ? (
            <table style={st.table}>
              <thead>
                <tr>
                  {['User','Email','Messages'].map(h => <th key={h} style={st.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {top_users.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a22' }}>
                    <td style={st.td}><span style={{ color: '#ef4444', marginRight: 6 }}>#{i+1}</span>{u.username}</td>
                    <td style={{ ...st.td, color: '#555' }}>{u.email}</td>
                    <td style={{ ...st.td, color: '#fbbf24', textAlign: 'right' }}>{u.msg_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={st.empty}>No users yet</div>}
        </div>
      </div>

      {/* Alerts */}
      <div style={st.panel}>
        <div style={st.panelTitle}>Recent Security Alerts</div>
        {alerts?.length ? (
          alerts.map((a, i) => (
            <div key={i} style={st.alertRow}>
              <span style={{ color: '#f87171', fontSize: 12 }}>⚠</span>
              <span style={{ flex: 1, fontSize: 13 }}>{a.description}</span>
              <span style={{ fontSize: 11, color: '#444' }}>{a.created_at}</span>
            </div>
          ))
        ) : (
          <div style={{ ...st.empty, color: '#34d399' }}>No suspicious activity detected</div>
        )}
      </div>
    </div>
  )
}

const LoadState = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#444', fontSize: 13 }}>
    Loading dashboard…
  </div>
)

const ErrorState = ({ msg }) => (
  <div style={{ padding: 32, color: '#f87171', fontSize: 13 }}>{msg}</div>
)

const st = {
  root:      { display: 'flex', flexDirection: 'column', gap: 20 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 },
  statCard:  {
    background: '#0d0d10', border: '1px solid #1a1a22',
    borderTop: '2px solid #ef4444', borderRadius: 6, padding: '18px 16px',
    transition: 'all 0.4s ease',
  },
  row:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  panel:     { background: '#0d0d10', border: '1px solid #1a1a22', borderRadius: 6, padding: '18px 20px' },
  panelTitle:{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 16, textTransform: 'uppercase' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:        { textAlign: 'left', fontSize: 10, color: '#444', padding: '0 8px 10px 0', letterSpacing: '0.1em', fontWeight: 700 },
  td:        { padding: '8px 8px 8px 0', color: '#c0c0cc', verticalAlign: 'middle' },
  alertRow:  { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #111' },
  empty:     { fontSize: 12, color: '#333', padding: '12px 0' },
}