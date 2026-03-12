/**
 * Arc AI — Admin Dashboard: Users Section
 * List, search, ban/unban, delete, reset password
 */

import { useEffect, useState, useCallback } from 'react'
import { adminAPI } from '../utils/api'

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.box} onClick={e => e.stopPropagation()}>
        <div style={m.header}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#e8e8f0' }}>{title}</span>
          <button style={m.closeBtn} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const m = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  box:     { background: '#0d0d10', border: '1px solid #2a2a35', borderRadius: 8, width: 400, maxWidth: '90vw', overflow: 'hidden' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #1a1a22' },
  closeBtn:{ background: 'transparent', border: 'none', color: '#555', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' },
}

// ── Row actions ───────────────────────────────────────────────────────────────
function ActionBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: `1px solid ${color}33`,
      color, borderRadius: 3, padding: '3px 9px', fontSize: 11,
      fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s',
      fontWeight: 600, letterSpacing: '0.04em',
    }}
    onMouseEnter={e => e.currentTarget.style.background = color + '18'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >{label}</button>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UsersSection() {
  const [users,   setUsers]   = useState([])
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)
  const [toast,   setToast]   = useState('')

  // Modal states
  const [banModal,   setBanModal]   = useState(null)   // user object
  const [resetModal, setResetModal] = useState(null)   // user object
  const [banReason,  setBanReason]  = useState('')
  const [newPass,    setNewPass]    = useState('')
  const [actionLoad, setActionLoad] = useState(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchUsers = useCallback(() => {
    setLoading(true)
    adminAPI.users(search).then(setUsers).finally(() => setLoading(false))
  }, [search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleBan = async () => {
    setActionLoad(true)
    try {
      await adminAPI.banUser(banModal.id, { reason: banReason || 'Banned by admin' })
      showToast(`${banModal.username} banned.`)
      setBanModal(null); setBanReason('')
      fetchUsers()
    } catch (e) { showToast(e.message) }
    finally { setActionLoad(false) }
  }

  const handleUnban = async (user) => {
    try {
      await adminAPI.unbanUser(user.id)
      showToast(`${user.username} unbanned.`)
      fetchUsers()
    } catch (e) { showToast(e.message) }
  }

  const handleDelete = async (user) => {
    if (!confirm(`Delete ${user.username}? This is irreversible.`)) return
    try {
      await adminAPI.deleteUser(user.id)
      showToast(`${user.username} deleted.`)
      fetchUsers()
    } catch (e) { showToast(e.message) }
  }

  const handleReset = async () => {
    if (newPass.length < 6) { showToast('Password must be 6+ chars.'); return }
    setActionLoad(true)
    try {
      await adminAPI.resetPassword(resetModal.id, { new_password: newPass })
      showToast(`Password reset for ${resetModal.username}.`)
      setResetModal(null); setNewPass('')
    } catch (e) { showToast(e.message) }
    finally { setActionLoad(false) }
  }

  return (
    <div style={s.root}>
      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Toolbar */}
      <div style={s.toolbar}>
        <input
          style={s.search}
          placeholder="Search username or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 12, color: '#444' }}>{users.length} users</span>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.center}>Loading users…</div>
        ) : !users.length ? (
          <div style={s.center}>No users found</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['ID','Username','Email','Status','Messages','Last Active','Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #111', opacity: u.is_banned ? 0.6 : 1 }}>
                  <td style={{ ...s.td, color: '#444', fontSize: 11 }}>#{u.id}</td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 600, color: '#e8e8f0' }}>{u.username}</div>
                  </td>
                  <td style={{ ...s.td, color: '#666', fontSize: 12 }}>{u.email}</td>
                  <td style={s.td}>
                    {u.is_banned ? (
                      <span style={s.badgeBanned}>BANNED</span>
                    ) : (
                      <span style={s.badgeActive}>ACTIVE</span>
                    )}
                  </td>
                  <td style={{ ...s.td, color: '#fbbf24', textAlign: 'center' }}>{u.message_count ?? 0}</td>
                  <td style={{ ...s.td, fontSize: 11, color: '#555' }}>
                    {u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ ...s.td }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {u.is_banned ? (
                        <ActionBtn label="Unban" color="#34d399" onClick={() => handleUnban(u)} />
                      ) : (
                        <ActionBtn label="Ban" color="#f87171" onClick={() => { setBanModal(u); setBanReason('') }} />
                      )}
                      <ActionBtn label="Reset PW" color="#60a5fa" onClick={() => { setResetModal(u); setNewPass('') }} />
                      <ActionBtn label="Delete" color="#ef4444" onClick={() => handleDelete(u)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ban Modal */}
      {banModal && (
        <Modal title={`Ban @${banModal.username}`} onClose={() => setBanModal(null)}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Provide a reason (optional):</p>
            <input style={s.modalInput} placeholder="Ban reason…" value={banReason}
              onChange={e => setBanReason(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.ghostBtn} onClick={() => setBanModal(null)}>Cancel</button>
              <button style={s.dangerBtn} onClick={handleBan} disabled={actionLoad}>
                {actionLoad ? 'Banning…' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <Modal title={`Reset Password — @${resetModal.username}`} onClose={() => setResetModal(null)}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input style={s.modalInput} placeholder="New password (min 6 chars)" type="password"
              value={newPass} onChange={e => setNewPass(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.ghostBtn} onClick={() => setResetModal(null)}>Cancel</button>
              <button style={s.primaryBtn} onClick={handleReset} disabled={actionLoad}>
                {actionLoad ? 'Saving…' : 'Reset Password'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

const s = {
  root:       { display: 'flex', flexDirection: 'column', gap: 16 },
  toolbar:    { display: 'flex', gap: 12, alignItems: 'center' },
  search:     { flex: 1, background: '#111116', border: '1px solid #1e1e28', borderRadius: 4, padding: '9px 14px', color: '#e8e8f0', fontFamily: 'inherit', fontSize: 13, outline: 'none' },
  tableWrap:  { background: '#0d0d10', border: '1px solid #1a1a22', borderRadius: 6, overflowX: 'auto' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:         { padding: '12px 14px', textAlign: 'left', fontSize: 10, color: '#444', letterSpacing: '0.1em', borderBottom: '1px solid #1a1a22', whiteSpace: 'nowrap' },
  td:         { padding: '10px 14px', color: '#c0c0cc', verticalAlign: 'middle' },
  center:     { padding: 40, textAlign: 'center', color: '#444', fontSize: 13 },
  badgeActive:{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 3, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' },
  badgeBanned:{ background: 'rgba(239,68,68,0.1)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.2)',  borderRadius: 3, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' },
  modalInput: { background: '#111116', border: '1px solid #2a2a35', borderRadius: 4, padding: '10px 12px', color: '#e8e8f0', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%' },
  ghostBtn:   { background: 'transparent', border: '1px solid #2a2a35', borderRadius: 4, padding: '8px 16px', color: '#888', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' },
  dangerBtn:  { background: '#ef4444', border: 'none', borderRadius: 4, padding: '8px 16px', color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  primaryBtn: { background: '#3b82f6', border: 'none', borderRadius: 4, padding: '8px 16px', color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  toast:      { position: 'fixed', bottom: 24, right: 24, background: '#1a1a22', border: '1px solid #2a2a35', borderRadius: 6, padding: '10px 18px', color: '#e8e8f0', fontSize: 13, zIndex: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
}