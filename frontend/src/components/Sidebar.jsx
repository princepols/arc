/**
 * Arc AI - Sidebar
 * Chat history with rename, delete, search, and user info.
 */

import { useState, useEffect, useRef } from 'react'
import { sessionsAPI } from '../utils/api'
import { Plus, Search, Trash2, LogOut, MessageSquare, X, Pencil, Check, MoreHorizontal } from 'lucide-react'
import arcLogo from '../assets/arclogo.png'

// Per-session context menu: rename / delete
function SessionItem({ session, active, onSelect, onDelete, onRename }) {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [renaming,    setRenaming]    = useState(false)
  const [renameVal,   setRenameVal]   = useState(session.title || 'New Chat')
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [hovered,     setHovered]     = useState(false)
  const inputRef = useRef(null)
  const menuRef  = useRef(null)

  // Focus input when rename mode opens
  useEffect(() => {
    if (renaming) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [renaming])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const submitRename = async () => {
    const val = renameVal.trim()
    if (val && val !== session.title) {
      await onRename(session.id, val)
    } else {
      setRenameVal(session.title || 'New Chat')
    }
    setRenaming(false)
    setMenuOpen(false)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirmDel) { setConfirmDel(true); return }
    await onDelete(session.id)
  }

  return (
    <div
      style={s.item(active, hovered)}
      onClick={() => { if (!renaming) onSelect(session.id, session.title) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDel(false) }}
    >
      <MessageSquare size={13} style={{ flexShrink: 0, marginTop: renaming ? 8 : 3, color: active ? 'var(--accent)' : 'var(--text-muted)' }} />

      <div style={s.itemBody}>
        {renaming ? (
          <input
            ref={inputRef}
            style={s.renameInput}
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') { setRenaming(false); setRenameVal(session.title) } }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <>
            <span style={s.itemTitle}>{session.title || 'New Chat'}</span>
            <span style={s.itemDate}>{formatDate(session.updated_at)}</span>
          </>
        )}
      </div>

      {/* Action buttons — shown on hover or when menu open */}
      {!renaming && (hovered || menuOpen || active) && (
        <div style={s.actions} onClick={e => e.stopPropagation()} ref={menuRef}>
          {/* Rename */}
          <button
            style={s.iconBtn('var(--text-muted)')}
            onClick={() => { setRenaming(true); setMenuOpen(false) }}
            title="Rename"
          >
            <Pencil size={11} />
          </button>

          {/* Delete with confirm */}
          <button
            style={s.iconBtn(confirmDel ? '#f87171' : 'var(--text-muted)', confirmDel)}
            onClick={handleDelete}
            title={confirmDel ? 'Click again to confirm' : 'Delete'}
          >
            {confirmDel ? <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.03em' }}>DEL?</span> : <Trash2 size={11} />}
          </button>
        </div>
      )}

      {/* Confirm rename tick */}
      {renaming && (
        <button
          style={{ ...s.iconBtn('#4ade80'), marginTop: 6 }}
          onClick={e => { e.stopPropagation(); submitRename() }}
          title="Save"
        >
          <Check size={11} />
        </button>
      )}
    </div>
  )
}

function formatDate(str) {
  const d = new Date(str), now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff}d ago`
  return d.toLocaleDateString()
}

export default function Sidebar({ user, activeSession, onSelectSession, onNewChat, onLogout, refreshTrigger, onSessionRenamed }) {
  const [sessions, setSessions]   = useState([])
  const [search, setSearch]       = useState('')
  const [searchResults, setRes]   = useState(null)

  useEffect(() => {
    sessionsAPI.list().then(setSessions).catch(console.error)
  }, [refreshTrigger])

  useEffect(() => {
    if (!search.trim()) { setRes(null); return }
    const t = setTimeout(() => sessionsAPI.search(search).then(setRes).catch(console.error), 300)
    return () => clearTimeout(t)
  }, [search])

  const handleDelete = async (id) => {
    await sessionsAPI.delete(id)
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSession === id) onSelectSession(null)
  }

  const handleRename = async (id, title) => {
    await sessionsAPI.rename(id, title)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))
    if (onSessionRenamed && activeSession === id) onSessionRenamed(title)
  }

  const displayed = searchResults !== null ? searchResults : sessions

  return (
    <aside style={s.sidebar}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.brand}>
          <img src={arcLogo} alt="Arc" style={s.logo} />
          <span style={s.brandText}>Arc</span>
        </div>
        <button
          style={s.newBtn}
          onClick={onNewChat}
          title="New Chat"
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <Search size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <input
          style={s.searchInput}
          placeholder="Search chats…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button style={s.clearBtn} onClick={() => setSearch('')}><X size={11} /></button>
        )}
      </div>

      {/* Session list */}
      <div style={s.list}>
        {displayed.length === 0 && (
          <div style={s.empty}>{search ? 'No results found.' : 'No chats yet. Start one!'}</div>
        )}
        {displayed.map(session => (
          <SessionItem
            key={session.id}
            session={session}
            active={activeSession === session.id}
            onSelect={onSelectSession}
            onDelete={handleDelete}
            onRename={handleRename}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.userInfo}>
          <div style={s.avatar}>{user.username[0].toUpperCase()}</div>
          <span style={s.username}>{user.username}</span>
        </div>
        <button
          style={s.logoutBtn}
          onClick={onLogout}
          title="Sign out"
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}

const s = {
  sidebar: {
    width: 260, flexShrink: 0,
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex', flexDirection: 'column',
    height: '100vh', overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '15px 14px', borderBottom: '1px solid var(--border-subtle)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8 },
  logo:  { width: 26, height: 26, borderRadius: 6, objectFit: 'cover' },
  brandText: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  newBtn: {
    width: 30, height: 30, borderRadius: 7,
    border: '1px solid var(--border-subtle)',
    background: 'transparent', color: 'var(--text-muted)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 7,
    margin: '10px 12px', padding: '7px 10px',
    background: 'var(--bg-elevated)', borderRadius: 8,
    border: '1px solid var(--border-subtle)',
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 12,
  },
  clearBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', display: 'flex', padding: 0,
  },
  list: { flex: 1, overflowY: 'auto', padding: '4px 8px' },
  empty: { fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' },
  item: (active, hovered) => ({
    display: 'flex', alignItems: 'flex-start', gap: 8,
    padding: '8px 9px', borderRadius: 8, cursor: 'pointer',
    background: active ? 'var(--accent-dim)' : hovered ? 'var(--bg-hover)' : 'transparent',
    border: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
    marginBottom: 2, transition: 'all 0.12s', minHeight: 44,
  }),
  itemBody: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 1 },
  itemTitle: {
    fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  itemDate: { fontSize: 10, color: 'var(--text-muted)' },
  renameInput: {
    width: '100%', background: 'var(--bg-elevated)',
    border: '1px solid var(--accent)', borderRadius: 5,
    color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
    fontSize: 12, padding: '3px 6px', outline: 'none',
  },
  actions: { display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, marginTop: 2 },
  iconBtn: (color, highlight) => ({
    width: 22, height: 22, borderRadius: 5, border: 'none',
    background: highlight ? 'rgba(248,113,113,0.12)' : 'transparent',
    color, cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', transition: 'all 0.13s', padding: 0,
    flexShrink: 0,
  }),
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', borderTop: '1px solid var(--border-subtle)',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--accent)', color: '#0c0c0e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700,
  },
  username: { fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' },
  logoutBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', display: 'flex', padding: 4,
    borderRadius: 6, transition: 'color 0.15s',
  },
}