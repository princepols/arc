/**
 * Arc AI — Admin Dashboard: Guests Section
 * Track guest activity, prompt usage, and conversion rates.
 */

import { useEffect, useState } from 'react'
import { adminAPI } from '../utils/api'

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = '#ef4444', sub }) {
  return (
    <div style={{ background: '#0d0d10', border: '1px solid #1a1a22', borderTop: `2px solid ${color}`, borderRadius: 6, padding: '18px 16px' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.03em' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: '#c0c0cc', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GuestsSection() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [page,    setPage]    = useState(1)

  const fetchData = (p = 1) => {
    setLoading(true)
    adminAPI.guests(p)
      .then(d => { setData(d); setPage(p) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData(1) }, [])

  if (error) return <div style={{ color: '#f87171', padding: 20 }}>{error}</div>

  const stats   = data?.stats   || {}
  const guests  = data?.guests  || []
  const total   = data?.total   || 0
  const pages   = Math.ceil(total / 50)

  return (
    <div style={s.root}>

      {/* Stat cards */}
      <div style={s.statsGrid}>
        <StatCard label="Total Guests"     value={stats.total_guests}    color="#38bdf8" />
        <StatCard label="Converted"        value={stats.converted}       color="#34d399" sub="Signed up after guest session" />
        <StatCard label="Conversion Rate"  value={stats.conversion_rate != null ? `${stats.conversion_rate}%` : '—'} color="#a78bfa" />
        <StatCard label="Total Prompts Used" value={stats.total_prompts} color="#fbbf24" />
      </div>

      {/* Guest table */}
      <div style={s.panel}>
        <div style={s.panelTitle}>
          Guest Sessions
          <span style={{ float: 'right', color: '#333', fontWeight: 400 }}>{total} total</span>
        </div>

        {loading ? (
          <div style={s.center}>Loading guests…</div>
        ) : !guests.length ? (
          <div style={s.center}>No guest sessions yet. They will appear here once users visit without an account.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Guest ID', 'Prompts Used', 'Status', 'IP Address', 'First Seen', 'Last Active'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g, i) => {
                    const isConverted = g.converted === 1
                    const isFull      = g.prompt_count >= 5
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #111' }}>
                        {/* Guest ID */}
                        <td style={s.td}>
                          <code style={{ fontSize: 11, color: '#60a5fa', background: '#111', padding: '2px 7px', borderRadius: 3 }}>
                            {g.guest_id}
                          </code>
                        </td>

                        {/* Prompts bar */}
                        <td style={s.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 5, background: '#1a1a22', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 99,
                                width: `${(g.prompt_count / 5) * 100}%`,
                                background: isFull ? '#ef4444' : g.prompt_count >= 3 ? '#fbbf24' : '#34d399',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: 12, color: isFull ? '#f87171' : '#aaa' }}>
                              {g.prompt_count}/5
                            </span>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td style={s.td}>
                          {isConverted ? (
                            <span style={s.badgeConverted}>✓ CONVERTED</span>
                          ) : isFull ? (
                            <span style={s.badgeFull}>LIMIT HIT</span>
                          ) : (
                            <span style={s.badgeGuest}>GUEST</span>
                          )}
                        </td>

                        {/* IP */}
                        <td style={{ ...s.td, color: '#555', fontSize: 11 }}>
                          {g.ip_address || '—'}
                        </td>

                        {/* First seen */}
                        <td style={{ ...s.td, fontSize: 11, color: '#666' }}>
                          {new Date(g.first_seen).toLocaleString()}
                        </td>

                        {/* Last active */}
                        <td style={{ ...s.td, fontSize: 11, color: '#666' }}>
                          {new Date(g.last_seen).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={s.pagination}>
                <button style={s.pageBtn} disabled={page <= 1} onClick={() => fetchData(page - 1)}>← Prev</button>
                <span style={{ fontSize: 12, color: '#555' }}>Page {page} of {pages}</span>
                <button style={s.pageBtn} disabled={page >= pages} onClick={() => fetchData(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info card */}
      <div style={s.infoCard}>
        <div style={s.panelTitle}>HOW GUEST MODE WORKS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#666' }}>
          <div>• Unauthenticated users get a unique <code style={{ color: '#555', background: '#111', padding: '1px 6px', borderRadius: 3 }}>guest_id</code> stored in their browser localStorage</div>
          <div>• Each guest can send up to <strong style={{ color: '#fbbf24' }}>5 prompts</strong> before being asked to create an account</div>
          <div>• After 5 prompts a modal appears with Sign Up / Login buttons</div>
          <div>• If a guest registers, their session is marked as <strong style={{ color: '#34d399' }}>Converted</strong> and linked to their new account</div>
          <div>• The backend enforces the limit — it cannot be bypassed via browser tools</div>
        </div>
      </div>

    </div>
  )
}

const s = {
  root:       { display: 'flex', flexDirection: 'column', gap: 16 },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 },
  panel:      { background: '#0d0d10', border: '1px solid #1a1a22', borderRadius: 6, padding: '18px 20px' },
  panelTitle: { fontSize: 11, fontWeight: 700, color: '#666', letterSpacing: '0.1em', marginBottom: 16, textTransform: 'uppercase' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:         { padding: '8px 14px 10px 0', textAlign: 'left', fontSize: 10, color: '#444', letterSpacing: '0.1em', borderBottom: '1px solid #1a1a22', whiteSpace: 'nowrap' },
  td:         { padding: '10px 14px 10px 0', color: '#c0c0cc', verticalAlign: 'middle' },
  center:     { padding: 40, textAlign: 'center', color: '#444', fontSize: 13 },
  badgeConverted: { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 3, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' },
  badgeFull:      { background: 'rgba(239,68,68,0.1)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.2)',  borderRadius: 3, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' },
  badgeGuest:     { background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 3, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 },
  pageBtn:    { background: 'transparent', border: '1px solid #2a2a35', borderRadius: 4, padding: '6px 14px', color: '#888', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' },
  infoCard:   { background: '#0d0d10', border: '1px solid #1a1a22', borderRadius: 6, padding: '18px 20px' },
}