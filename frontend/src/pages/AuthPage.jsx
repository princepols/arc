/**
 * Arc AI - Auth Page v2 (Mobile-Responsive)
 */

import { useState } from 'react'
import { authAPI } from '../utils/api'
import arcLogo from '../assets/arclogo.png'

export default function AuthPage({ onAuth }) {
  const [tab,      setTab]      = useState('login')
  const [form,     setForm]     = useState({ username: '', email: '', password: '' })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const update   = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const switchTab = (t) => { setTab(t); setError('') }

  const handleLogin = async () => {
    setError('')
    if (!form.email.trim() || !form.password.trim()) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try { onAuth(await authAPI.login({ email: form.email.trim(), password: form.password })) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleRegister = async () => {
    setError('')
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try { onAuth(await authAPI.register({ username: form.username.trim(), email: form.email.trim(), password: form.password })) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.logoWrap}>
          <img src={arcLogo} alt="Arc" style={s.logo} />
          <h1 style={s.brand}>Arc</h1>
          <p style={s.tagline}>Sign up and start thinking with Arc</p>
        </div>

        <div style={s.tabs}>
          {['login', 'register'].map(t => (
            <button key={t} style={s.tab(tab === t)} onClick={() => switchTab(t)}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {tab === 'login' && (
          <div style={s.form}>
            <input style={s.input} placeholder="Email" type="email" value={form.email}
              onChange={e => update('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <input style={s.input} placeholder="Password" type="password" value={form.password}
              onChange={e => update('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            {error && <div style={s.errorBox}>{error}</div>}
            <button style={s.btn(loading)} onClick={handleLogin} disabled={loading}>
              {loading ? <><span style={s.spinner} /> Signing in…</> : 'Sign In'}
            </button>
          </div>
        )}

        {tab === 'register' && (
          <div style={s.form}>
            <input style={s.input} placeholder="Username" value={form.username}
              onChange={e => update('username', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} />
            <input style={s.input} placeholder="Gmail" type="email" value={form.email}
              onChange={e => update('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} />
            <input style={s.input} placeholder="Password" type="password" value={form.password}
              onChange={e => update('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} />
            {error && <div style={s.errorBox}>{error}</div>}
            <button style={s.btn(loading)} onClick={handleRegister} disabled={loading}>
              {loading ? <><span style={s.spinner} /> Registering…</> : 'Register'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  page:    { minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '16px' },
  card:    { width: '100%', maxWidth: 420, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: 22, boxSizing: 'border-box' },
  logoWrap:{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  logo:    { width: 60, height: 60, borderRadius: 14, objectFit: 'cover', boxShadow: '0 0 30px var(--accent-glow)' },
  brand:   { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 },
  tagline: { fontSize: 12, color: 'var(--text-muted)', margin: 0 },
  tabs:    { display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)' },
  tab:     (a) => ({ flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)', background: a ? 'var(--accent)' : 'transparent', color: a ? '#0c0c0e' : 'var(--text-muted)', transition: 'all 0.15s' }),
  form:    { display: 'flex', flexDirection: 'column', gap: 10 },
  input:   { padding: '11px 14px', borderRadius: 8, border: '1px solid var(--border-mid)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box' },
  errorBox:{ fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 12px' },
  infoBox: { fontSize: 12, color: '#4ade80', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 6, padding: '8px 12px' },
  infoBanner: { background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 10, padding: '14px 16px' },
  btn:     (d) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', borderRadius: 8, border: 'none', background: d ? 'var(--bg-elevated)' : 'var(--accent)', color: d ? 'var(--text-muted)' : '#0c0c0e', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: d ? 'not-allowed' : 'pointer', transition: 'all 0.15s', marginTop: 4 }),
  ghostBtn:(d) => ({ background: 'transparent', border: 'none', cursor: d ? 'not-allowed' : 'pointer', color: d ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: 12, padding: '4px 0', fontFamily: 'var(--font-sans)', transition: 'color 0.15s' }),
  spinner: { display: 'inline-block', width: 13, height: 13, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0c0c0e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
}