/**
 * Arc AI - App Root v2
 * Handles auth, sidebar, session management, and chat.
 */

import { useState, useCallback, useRef } from 'react'
import { useAuth }     from './hooks/useAuth'
import { useChat }     from './hooks/useChat'
import { sessionsAPI } from './utils/api'

import AuthPage    from './pages/AuthPage'
import Sidebar     from './components/Sidebar'
import Header      from './components/Header'
import MessageList from './components/MessageList'
import ChatInput   from './components/ChatInput'

const appStyle = `
  @keyframes fadeSlideIn { from { opacity:0; transform:translateY(7px) } to { opacity:1; transform:translateY(0) } }
  * { box-sizing: border-box; }
  .arc-app  { display:flex; height:100vh; width:100vw; overflow:hidden; background:var(--bg-base); }
  .arc-main { display:flex; flex-direction:column; flex:1; min-width:0; overflow:hidden; }
`

export default function App() {
  const { user, loading: authLoading, login, logout } = useAuth()

  const [activeSessionId, setActiveSessionId] = useState(null)
  const [sessionTitle,    setSessionTitle]    = useState('')
  const [sidebarOpen,     setSidebarOpen]     = useState(true)
  const [refreshSessions, setRefreshSessions] = useState(0)

  // Keep a ref so handleSend always sees the latest sessionId without stale closures
  const activeSessionRef = useRef(null)
  activeSessionRef.current = activeSessionId

  const { messages, loading, fetching, send, clearMessages } = useChat(activeSessionId)

  // Select an existing session from sidebar
  const handleSelectSession = useCallback((id, title) => {
    setActiveSessionId(id)
    setSessionTitle(title || '')
  }, [])

  // "New Chat" button — just clear state, create session lazily on first message
  const handleNewChat = useCallback(() => {
    setActiveSessionId(null)
    setSessionTitle('')
    clearMessages()
  }, [clearMessages])

  // Send a message — create session on demand if none exists
  const handleSend = useCallback(async (text, mode, fileContext = null, fileName = null) => {
    let sid = activeSessionRef.current

    // Lazily create session on first message
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

    // Pass sid explicitly so send() never uses a stale closure value
    send(text, mode, sid, (title) => {
      setSessionTitle(title)
      setRefreshSessions(r => r + 1)
    }, fileContext, fileName)
  }, [send])

  if (authLoading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</span>
    </div>
  )

  if (!user) return <AuthPage onAuth={login} />

  return (
    <>
      <style>{appStyle}</style>
      <div className="arc-app">

        {sidebarOpen && (
          <Sidebar
            user={user}
            activeSession={activeSessionId}
            onSelectSession={(id, title) => handleSelectSession(id, title)}
            onNewChat={handleNewChat}
            onLogout={logout}
            refreshTrigger={refreshSessions}
            onSessionRenamed={(title) => setSessionTitle(title)}
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
          />
          <ChatInput onSend={handleSend} loading={loading} messages={messages} />
        </div>

      </div>
    </>
  )
}