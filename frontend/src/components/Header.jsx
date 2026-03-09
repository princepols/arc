/**
 * Arc AI - Header (Revamped)
 */
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export default function Header({ sessionTitle, sidebarOpen, onToggleSidebar }) {
  return (
    <header style={s.header}>
      <div style={s.left}>
        <button style={s.toggleBtn} onClick={onToggleSidebar} title="Toggle sidebar">
          {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
        <span style={s.title}>{sessionTitle || 'Arc AI'}</span>
      </div>
      <span style={s.badge}>POWERED BY GPT-OSS</span>
    </header>
  )
}

const s = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', height: 52,
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-base)', flexShrink: 0, zIndex: 10,
  },
  left: { display: 'flex', alignItems: 'center', gap: 10 },
  toggleBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6,
  },
  title: { fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge: {
    fontSize: 10, fontWeight: 500, color: 'var(--text-muted)',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
    padding: '2px 8px', borderRadius: 99, letterSpacing: '0.05em', textTransform: 'uppercase',
  },
}
