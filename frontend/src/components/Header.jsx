/**
 * Arc AI - Header (Mobile-Responsive)
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
      <span className="arc-badge" style={s.badge}>POWERED BY GPT-OSS</span>
    </header>
  )
}

const s = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', height: 52,
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-base)', flexShrink: 0, zIndex: 10,
  },
  left: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 },
  toggleBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', display: 'flex', padding: 6, borderRadius: 6,
    flexShrink: 0,
  },
  title: {
    fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    minWidth: 0,
  },
  badge: {
    fontSize: 10, fontWeight: 500, color: 'var(--text-muted)',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
    padding: '2px 8px', borderRadius: 99, letterSpacing: '0.05em',
    textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap',
  },
}