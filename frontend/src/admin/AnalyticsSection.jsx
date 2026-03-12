/**
 * Arc AI — Admin Dashboard: Analytics Section
 * 30-day chart, mode breakdown, hourly heatmap, heavy users
 */

import { useEffect, useState } from 'react'
import { adminAPI } from '../utils/api'

// ── Multi-series bar chart ─────────────────────────────────────────────────────
function MultiBarChart({ data }) {
  if (!data?.length) return <div style={c.empty}>No data yet</div>
  const maxVal = Math.max(...data.map(d => d.total || 0), 1)
  const last14 = data.slice(-14)
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100, minWidth: last14.length * 28 }}>
        {last14.map((d, i) => {
          const tot = d.total || 0
          const usr = d.user  || 0
          const err = d.errors || 0
          const day = new Date(d.day).toLocaleDateString('en', { month: 'short', day: 'numeric' })
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
              title={`${day}\nTotal: ${tot}\nUser: ${usr}\nErrors: ${err}`}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 88, gap: 1 }}>
                {err > 0 && <div style={{ width: '100%', height: Math.max((err/maxVal)*88, 2), background: '#ef4444', borderRadius: '2px 2px 0 0', opacity: 0.7 }} />}
                <div style={{ width: '100%', height: Math.max((usr/maxVal)*88, 2), background: '#3b82f6', borderRadius: err > 0 ? 0 : '2px 2px 0 0' }} />
              </div>
              <span style={{ fontSize: 8, color: '#333', whiteSpace: 'nowrap' }}>{day.split(' ')[1]}</span>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        {[['#3b82f6','User Messages'], ['#ef4444','Errors']].map(([col, lbl]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' }}>
            <div style={{ width: 10, height: 10, background: col, borderRadius: 2 }} />
            {lbl}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────
function DonutChart({ data }) {
  if (!data?.length) return <div style={c.empty}>No data yet</div>
  const COLORS = ['#ef4444','#3b82f6','#34d399','#fbbf24','#a78bfa','#fb923c','#2dd4bf','#f472b6']
  const total  = data.reduce((s, d) => s + d.cnt, 0)
  let   angle  = -90
  const segments = data.slice(0, 7).map((d, i) => {
    const pct  = d.cnt / total
    const deg  = pct * 360
    const r    = 50, cx = 60, cy = 60
    const a1   = (angle * Math.PI) / 180
    const a2   = ((angle + deg) * Math.PI) / 180
    const x1   = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const x2   = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
    const large = deg > 180 ? 1 : 0
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    angle += deg
    return { ...d, path, color: COLORS[i % COLORS.length], pct: Math.round(pct * 100) }
  })

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <svg width={120} height={120} style={{ flexShrink: 0 }}>
        {segments.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.85} />)}
        <circle cx={60} cy={60} r={28} fill="#0d0d10" />
        <text x={60} y={65} textAnchor="middle" fill="#888" fontSize={10}>{total}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, background: s.color, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ color: '#aaa', textTransform: 'capitalize' }}>{s.mode}</span>
            <span style={{ color: s.color, fontWeight: 700, marginLeft: 'auto' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Hourly heatmap ────────────────────────────────────────────────────────────
function HourlyHeatmap({ data }) {
  if (!data?.length) return <div style={c.empty}>No data yet</div>
  const map = Object.fromEntries(data.map(d => [d.hour, d.cnt]))
  const max = Math.max(...data.map(d => d.cnt), 1)
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {Array.from({ length: 24 }, (_, h) => {
        const v = map[h] || 0
        const intensity = v / max
        return (
          <div key={h} title={`${h}:00 — ${v} messages`}
            style={{ width: 28, height: 28, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `rgba(239,68,68,${0.1 + intensity * 0.85})`, fontSize: 9, color: intensity > 0.5 ? '#fff' : '#555' }}>
            {h}
          </div>
        )
      })}
      <div style={{ width: '100%', fontSize: 11, color: '#444', marginTop: 4 }}>Darker = more messages · Last 7 days</div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AnalyticsSection() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    adminAPI.analytics().then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={c.center}>Loading analytics…</div>
  if (error)   return <div style={{ color: '#f87171', padding: 20 }}>{error}</div>

  const { daily, modes, hourly, heavy_users } = data

  return (
    <div style={c.root}>
      {/* 30-day traffic */}
      <div style={c.panel}>
        <div style={c.panelTitle}>14-Day Message Traffic</div>
        <MultiBarChart data={daily} />
      </div>

      {/* Mode breakdown + Hourly */}
      <div style={c.row}>
        <div style={c.panel}>
          <div style={c.panelTitle}>Mode Usage Breakdown</div>
          <DonutChart data={modes} />
        </div>
        <div style={c.panel}>
          <div style={c.panelTitle}>Hourly Usage Pattern</div>
          <HourlyHeatmap data={hourly} />
        </div>
      </div>

      {/* Heavy users / potential spam */}
      <div style={c.panel}>
        <div style={c.panelTitle}>High-Volume Users (50+ messages)</div>
        {heavy_users?.length ? (
          <table style={c.table}>
            <thead>
              <tr>{['Username','Email','Total Messages','Risk'].map(h => <th key={h} style={c.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {heavy_users.map((u, i) => {
                const risk = u.cnt > 500 ? 'HIGH' : u.cnt > 200 ? 'MED' : 'LOW'
                const col  = risk === 'HIGH' ? '#ef4444' : risk === 'MED' ? '#fbbf24' : '#34d399'
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                    <td style={c.td}>{u.username}</td>
                    <td style={{ ...c.td, color: '#555' }}>{u.email}</td>
                    <td style={{ ...c.td, color: '#fbbf24', textAlign: 'right' }}>{u.cnt?.toLocaleString()}</td>
                    <td style={{ ...c.td, textAlign: 'center' }}>
                      <span style={{ color: col, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>{risk}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : <div style={c.empty}>No high-volume users detected</div>}
      </div>
    </div>
  )
}

const c = {
  root:       { display: 'flex', flexDirection: 'column', gap: 16 },
  row:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  panel:      { background: '#0d0d10', border: '1px solid #1a1a22', borderRadius: 6, padding: '18px 20px' },
  panelTitle: { fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '0.1em', marginBottom: 16, textTransform: 'uppercase' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:         { padding: '8px 12px 10px 0', textAlign: 'left', fontSize: 10, color: '#444', letterSpacing: '0.1em', borderBottom: '1px solid #1a1a22' },
  td:         { padding: '9px 12px 9px 0', color: '#c0c0cc', verticalAlign: 'middle' },
  center:     { padding: 60, textAlign: 'center', color: '#444', fontSize: 13 },
  empty:      { fontSize: 12, color: '#333', padding: '8px 0' },
}