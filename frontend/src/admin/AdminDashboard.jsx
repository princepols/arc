/**
 * Arc AI — Admin Dashboard Shell
 * Sidebar nav + section routing for all admin features.
 */

import { useState } from 'react'
import OverviewSection       from './OverviewSection'
import UsersSection          from './UsersSection'
import AnalyticsSection      from './AnalyticsSection'
import ConversationsSection  from './ConversationsSection'
import SecuritySection       from './SecuritySection'

const NAV = [
  { id: 'overview',       label: 'Dashboard',       icon: '' },
  { id: 'users',          label: 'Users',            icon: '' },
  { id: 'analytics',      label: 'Usage Analytics',  icon: '' },
  { id: 'conversations',  label: 'Conversations',    icon: '' },
  { id: 'security',       label: 'Security',         icon: '' },
]

const SECTION_TITLES = {
  overview:      'Dashboard Overview',
  users:         'Manage Users',
  analytics:     'Usage Analytics',
  conversations: 'Conversations',
  security:      'Security & Logs',
}

export default function AdminDashboard({ onLogout }) {
  const [active, setActive] = useState('overview')

  const renderSection = () => {
    switch (active) {
      case 'overview':      return <OverviewSection />
      case 'users':         return <UsersSection />
      case 'analytics':     return <AnalyticsSection />
      case 'conversations': return <ConversationsSection />
      case 'security':      return <SecuritySection />
      default:              return null
    }
  }

  return (
    <div style={s.shell}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 99px; }
        .nav-btn:hover { background: #161620 !important; color: #c0c0cc !important; }
        .nav-btn:hover .nav-icon { filter: none !important; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandIcon}>⬡</div>
          <div>
            <div style={s.brandTitle}>Arc Admin</div>
            <div style={s.brandSub}>Control Center</div>
          </div>
        </div>

        {/* Status indicator */}
        <div style={s.statusBadge}>
          <span style={s.greenPulse} />
          <span style={{ fontSize: 10, color: '#34d399', letterSpacing: '0.08em' }}>SYSTEM ONLINE</span>
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          {NAV.map(item => (
            <button key={item.id} className="nav-btn"
              onClick={() => setActive(item.id)}
              style={{
                ...s.navBtn,
                background:  active === item.id ? '#161620' : 'transparent',
                color:       active === item.id ? '#e8e8f0' : '#555',
                borderLeft:  `3px solid ${active === item.id ? '#ef4444' : 'transparent'}`,
              }}>
              <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0, filter: active === item.id ? 'none' : 'grayscale(1) opacity(0.4)' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {active === item.id && <span style={s.activeArrow}>›</span>}
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Admin info */}
        <div style={s.adminInfo}>
          <div style={s.adminAvatar}>P</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e8e8f0' }}>princeadmin</div>
            <div style={{ fontSize: 10, color: '#444' }}>Super Admin</div>
          </div>
        </div>

        {/* Logout */}
        <button style={s.logoutBtn} onClick={onLogout}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          ⏻ &nbsp;Logout
        </button>
      </aside>

      {/* ── Main content ── */}
      <main style={s.main}>
        {/* Top bar */}
        <div style={s.topBar}>
          <div>
            <h1 style={s.pageTitle}>{SECTION_TITLES[active]}</h1>
            <p style={s.pageSub}>Arc AI · Admin Portal · {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={s.topRight}>
            <div style={s.liveTag}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', marginRight: 6, boxShadow: '0 0 6px #34d399' }} />
              LIVE
            </div>
          </div>
        </div>

        {/* Section content */}
        <div style={s.content}>
          {renderSection()}
        </div>
      </main>
    </div>
  )
}

const s = {
  shell:       { display: 'flex', height: '100vh', width: '100vw', background: '#070709', fontFamily: "'JetBrains Mono', 'Courier New', monospace", color: '#e8e8f0', overflow: 'hidden' },

  // Sidebar
  sidebar:     { width: 220, background: '#0a0a0d', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', padding: '0 0 16px', flexShrink: 0 },
  brand:       { display: 'flex', alignItems: 'center', gap: 10, padding: '22px 18px 16px', borderBottom: '1px solid #111' },
  brandIcon:   { fontSize: 24, color: '#ef4444', textShadow: '0 0 12px rgba(239,68,68,0.5)', flexShrink: 0 },
  brandTitle:  { fontSize: 14, fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.02em' },
  brandSub:    { fontSize: 9, color: '#333', letterSpacing: '0.1em', marginTop: 1 },
  statusBadge: { display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderBottom: '1px solid #111' },
  greenPulse:  { width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', display: 'inline-block' },
  nav:         { display: 'flex', flexDirection: 'column', gap: 1, padding: '12px 0' },
  navBtn:      { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', border: 'none', borderLeft: '3px solid transparent', background: 'transparent', color: '#555', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', letterSpacing: '0.02em', transition: 'all 0.15s', width: '100%' },
  activeArrow: { marginLeft: 'auto', color: '#ef4444', fontSize: 16 },
  adminInfo:   { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid #111', marginBottom: 4 },
  adminAvatar: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 },
  logoutBtn:   { margin: '0 10px', padding: '9px 14px', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#ef4444', fontFamily: 'inherit', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em', transition: 'background 0.15s' },

  // Main
  main:        { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', borderBottom: '1px solid #111', flexShrink: 0 },
  pageTitle:   { fontSize: 18, fontWeight: 800, color: '#f0f0f5', letterSpacing: '-0.03em', margin: 0 },
  pageSub:     { fontSize: 10, color: '#333', marginTop: 3, letterSpacing: '0.05em', margin: 0 },
  topRight:    { display: 'flex', alignItems: 'center', gap: 14 },
  liveTag:     { fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.14em', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 3, padding: '4px 10px', display: 'flex', alignItems: 'center' },
  content:     { flex: 1, overflowY: 'auto', padding: '22px 28px' },
}