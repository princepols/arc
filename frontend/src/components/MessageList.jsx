/**
 * Arc AI - MessageList v2
 */
import { useEffect, useRef } from 'react'
import Message from './Message'
import TypingIndicator from './TypingIndicator'
import WelcomeScreen from './WelcomeScreen'

export default function MessageList({ messages, loading, fetching, username, onSuggestion }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (fetching) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {messages.length === 0 && !loading
        ? <WelcomeScreen username={username} onSuggestion={onSuggestion} />
        : (
          <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '8px 24px', flex: 1 }}>
            {messages.map(msg => <Message key={msg.id} message={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} style={{ height: 1 }} />
          </div>
        )
      }
    </div>
  )
}
