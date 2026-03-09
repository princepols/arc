/**
 * Arc AI - Auth Page
 * Login and Register forms.
 */

import { useState } from 'react'
import { authAPI } from '../utils/api'
import arcLogo from '../assets/arclogo.png'

export default function AuthPage({ onAuth }) {
  const [tab, setTab]         = useState('login') // 'login' | 'register'
  const [form, setForm]       = useState({ username: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const data = tab === 'login'
        ? await authAPI.login({ email: form.email, password: form.password })
        : await authAPI.register({ username: form.username, email: form.email, password: form.password })
      onAuth(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') submit() }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <img src={arcLogo} alt="Arc" style={s.logo} />
          <h1 style={s.brand}>Arc</h1>
          <p style={s.tagline}>Your AI assistant by Prince Ryan</p>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {['login','register'].map(t => (
            <button key={t} style={s.tab(tab === t)} onClick={() => { setTab(t); setError('') }}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={s.form}>
          {tab === 'register' && (
            <input
              style={s.input}
              placeholder="Username"
              value={form.username}
              onChange={e => update('username', e.target.value)}
              onKeyDown={handleKey}
            />
          )}
          <input
            style={s.input}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            onKeyDown={handleKey}
          />
          <input
            style={s.input}
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={e => update('password', e.target.value)}
            onKeyDown={handleKey}
          />

          {error && <div style={s.error}>{error}</div>}

          <button style={s.btn(loading)} onClick={submit} disabled={loading}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh', width: '100vw',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-base)',
  },
  card: {
    width: '100%', maxWidth: 400,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 16, padding: '36px 32px',
    display: 'flex', flexDirection: 'column', gap: 24,
  },
  logoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  logo: { width: 60, height: 60, borderRadius: 14, objectFit: 'cover', boxShadow: '0 0 30px var(--accent-glow)' },
  brand: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 },
  tagline: { fontSize: 12, color: 'var(--text-muted)', margin: 0 },
  tabs: { display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)' },
  tab: (active) => ({
    flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#0c0c0e' : 'var(--text-muted)',
    transition: 'all 0.15s',
  }),
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  input: {
    padding: '11px 14px', borderRadius: 8,
    border: '1px solid var(--border-mid)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)', fontSize: 14,
    outline: 'none',
  },
  error: {
    fontSize: 12, color: '#f87171',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 6, padding: '8px 12px',
  },
  btn: (loading) => ({
    padding: '11px', borderRadius: 8, border: 'none',
    background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
    color: loading ? 'var(--text-muted)' : '#0c0c0e',
    fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', marginTop: 4,
  }),
}
