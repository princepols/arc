/**
 * Arc AI - App Root v3 (Mobile-Responsive)
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth }    from './hooks/useAuth'
import { useChat }    from './hooks/useChat'
import { useProfile } from './hooks/useProfile'
import { sessionsAPI, warmupBackend } from './utils/api'

import AuthPage       from './pages/AuthPage'
import HomePage       from './pages/HomePage'
import AdminLogin     from './admin/AdminLogin'
import AdminDashboard from './admin/AdminDashboard'
import Sidebar        from './components/Sidebar'
import Header         from './components/Header'
import MessageList    from './components/MessageList'
import ChatInput      from './components/ChatInput'
import ProfileModal   from './components/ProfileModal'

const isMobile = () => window.innerWidth < 768

const appStyle = `
  @keyframes fadeSlideIn { from { opacity:0; transform:translateY(7px) } to { opacity:1; transform:translateY(0) } }
  @keyframes spin { to { transform: rotate(360deg); } }
  * { box-sizing: border-box; }
  .arc-app  { display:flex; height:100vh; width:100vw; overflow:hidden; background:var(--bg-base); position:relative; }
  .arc-main { display:flex; flex-direction:column; flex:1; min-width:0; overflow:hidden; }

  .sidebar-overlay {
    display: none;
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    z-index: 40; backdrop-filter: blur(2px);
  }
  .sidebar-overlay.active { display: block; }

  @media (max-width: 767px) {
    .arc-sidebar {
      position: fixed !important;
      top: 0; left: 0; height: 100vh;
      z-index: 50;
      transform: translateX(-100%);
      transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
    }
    .arc-sidebar.open {
      transform: translateX(0);
      box-shadow: 4px 0 32px rgba(0,0,0,0.6);
    }
  }
`

export default function App() {
  const { user, loading: authLoading, login, logout } = useAuth()

  const [activeSessionId, setActiveSessionId] = useState(null)
  const [sessionTitle,    setSessionTitle]    = useState('')
  const [sidebarOpen,     setSidebarOpen]     = useState(!isMobile())
  const [refreshSessions, setRefreshSessions] = useState(0)
  const [profileOpen,     setProfileOpen]     = useState(false)

  const activeSessionRef = useRef(null)
  activeSessionRef.current = activeSessionId

  const { messages, loading, fetching, send, clearMessages } = useChat(activeSessionId)
  const { profile, updateProfile } = useProfile(user?.username || '')

  useEffect(() => {
    warmupBackend() // Wake up Render backend on app load
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSelectSession = useCallback((id, title) => {
    setActiveSessionId(id)
    setSessionTitle(title || '')
    if (isMobile()) setSidebarOpen(false)
  }, [])

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null)
    setSessionTitle('')
    clearMessages()
    if (isMobile()) setSidebarOpen(false)
  }, [clearMessages])

  const handleSend = useCallback(async (text, mode, fileContext = null, fileName = null) => {
    let sid = activeSessionRef.current
    if (!sid) {
      try {
        const session = await sessionsAPI.create('New Chat')
        sid = session.id
        setActiveSessionId(sid)
        activeSessionRef.current = sid
        setRefreshSessions(r => r + 1)
      } catch (e) {
        console.error('Failed to create session:', e)
        return
      }
    }
    send(text, mode, sid, (title) => {
      setSessionTitle(title)
      setRefreshSessions(r => r + 1)
    }, fileContext, fileName)
  }, [send])

  const [showHome,  setShowHome]  = useState(!window.location.pathname.startsWith('/admin'))
  const [adminView, setAdminView] = useState(() => {
    if (!window.location.pathname.startsWith('/admin')) return false
    return sessionStorage.getItem('arc_admin_token') ? 'dashboard' : 'login'
  })

  const handleAdminLogout = () => { sessionStorage.removeItem('arc_admin_token'); window.location.href = '/' }
  const handleAdminLogin  = () => setAdminView('dashboard')

  if (authLoading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)' }}>
      <span style={{ color:'var(--text-muted)', fontSize:13 }}>Loading…</span>
    </div>
  )

  if (adminView === 'dashboard') return <AdminDashboard onLogout={handleAdminLogout} />
  if (adminView === 'login')     return <AdminLogin onLogin={handleAdminLogin} />
  if (showHome) return <HomePage onEnter={() => setShowHome(false)} />
  if (!user)    return <AuthPage onAuth={login} />

  return (
    <>
      <style>{appStyle}</style>
      <div className="arc-app arc-overflow-hidden">

        {/* Overlay — mobile only, shown when sidebar is open */}
        <div
          className={`sidebar-overlay ${sidebarOpen && isMobile() ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Desktop: mount/unmount | Mobile: always mounted, CSS slides in/out */}
        {(sidebarOpen || isMobile()) && (
          <Sidebar
            className={isMobile() ? (sidebarOpen ? 'open' : '') : ''}
            user={user}
            profile={profile}
            activeSession={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onLogout={logout}
            refreshTrigger={refreshSessions}
            onSessionRenamed={(title) => setSessionTitle(title)}
            onOpenProfile={() => setProfileOpen(true)}
          />
        )}

        <div className="arc-main">
          <Header
            sessionTitle={sessionTitle || 'New Chat'}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(p => !p)}
          />
          <MessageList
            messages={messages}
            loading={loading}
            fetching={fetching}
            username={user.username}
            onSuggestion={(prompt, mode) => handleSend(prompt, mode, null, null)}
            profile={profile}
          />
          <ChatInput onSend={handleSend} loading={loading} messages={messages} />
        </div>

      </div>

      {profileOpen && (
        <ProfileModal
          profile={profile}
          onSave={updateProfile}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </>
  )
}