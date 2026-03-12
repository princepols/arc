/**
 * Arc AI - Auth Page v2 (Mobile-Responsive)
 */

import { useState, useRef, useEffect } from 'react'
import { authAPI } from '../utils/api'
import arcLogo from '../assets/arclogo.png'

function OtpInput({ value, onChange, disabled }) {
  const refs   = useRef([])
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const handleChange = (i, char) => {
    const digit = char.replace(/\D/, '')
    if (!digit && char !== '') return
    const next = digits.slice(); next[i] = digit
    onChange(next.join(''))
    if (digit && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      const next = digits.slice()
      if (next[i]) { next[i] = ''; onChange(next.join('')) }
      else if (i > 0) refs.current[i - 1]?.focus()
    }
    if (e.key === 'ArrowLeft'  && i > 0) refs.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (p) { onChange(p.padEnd(6, '').slice(0, 6)); e.preventDefault() }
  }

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={el => refs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1} disabled={disabled}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste} onFocus={e => e.target.select()}
          style={{
            width: 'clamp(36px, 12vw, 44px)',
            height: 'clamp(44px, 13vw, 52px)',
            textAlign: 'center',
            fontSize: 'clamp(16px, 5vw, 22px)',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            background: digits[i] ? 'rgba(232,168,56,0.08)' : 'var(--bg-elevated)',
            border: `1.5px solid ${digits[i] ? 'var(--accent)' : 'var(--border-mid)'}`,
            borderRadius: 10, color: 'var(--accent)', outline: 'none',
            transition: 'all 0.15s', caretColor: 'transparent',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
      ))}
    </div>
  )
}

function Countdown({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (left <= 0) { onExpire?.(); return }
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  const m = String(Math.floor(left / 60)).padStart(2, '0')
  const sc = String(left % 60).padStart(2, '0')
  return <span style={{ color: left < 60 ? '#f87171' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{m}:{sc}</span>
}

export default function AuthPage({ onAuth }) {
  const [tab,      setTab]      = useState('login')
  const [step,     setStep]     = useState('form')
  const [form,     setForm]     = useState({ username: '', email: '', password: '' })
  const [otp,      setOtp]      = useState('')
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [expired,  setExpired]  = useState(false)
  const [countdown,setCountdown]= useState(null)
  const [resendCD, setResendCD] = useState(0)

  const update   = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const resetReg = () => { setStep('form'); setOtp(''); setError(''); setInfo(''); setExpired(false); setCountdown(null) }

  const handleSendOtp = async () => {
    setError(''); setInfo('')
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const res = await authAPI.sendOtp({ username: form.username.trim(), email: form.email.trim(), password: form.password })
      setStep('verify'); setExpired(false); setOtp('')
      setCountdown(res.expires_in ?? 600); setResendCD(60)
      setInfo(`Code sent to ${form.email}`)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleVerify = async () => {
    setError('')
    if (otp.replace(/\D/g, '').length < 6) { setError('Enter the full 6-digit code.'); return }
    if (expired) { setError('Code expired. Request a new one.'); return }
    setLoading(true)
    try {
      const data = await authAPI.register({ username: form.username.trim(), email: form.email.trim(), password: form.password, otp: otp.trim() })
      onAuth(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (resendCD > 0) return
    setError(''); setInfo(''); setOtp(''); setLoading(true)
    try {
      const res = await authAPI.sendOtp({ username: form.username.trim(), email: form.email.trim(), password: form.password })
      setExpired(false); setCountdown(res.expires_in ?? 600); setResendCD(60); setInfo('New code sent!')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (resendCD <= 0) return
    const t = setTimeout(() => setResendCD(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCD])

  const handleLogin = async () => {
    setError('')
    if (!form.email.trim() || !form.password.trim()) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try { onAuth(await authAPI.login({ email: form.email.trim(), password: form.password })) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const switchTab = (t) => { setTab(t); setError(''); setInfo(''); setStep('form'); setOtp(''); setExpired(false); setCountdown(null) }

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

        {tab === 'register' && step === 'form' && (
          <div style={s.form}>
            <input style={s.input} placeholder="Username" value={form.username}
              onChange={e => update('username', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendOtp()} />
            <input style={s.input} placeholder="Gmail address" type="email" value={form.email}
              onChange={e => update('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendOtp()} />
            <input style={s.input} placeholder="Password (min 6 chars)" type="password" value={form.password}
              onChange={e => update('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendOtp()} />
            {error && <div style={s.errorBox}>{error}</div>}
            <button style={s.btn(loading)} onClick={handleSendOtp} disabled={loading}>
              {loading ? <><span style={s.spinner} /> Sending code…</> : 'Send Verification Code'}
            </button>
          </div>
        )}

        {tab === 'register' && step === 'verify' && (
          <div style={s.form}>
            <div style={s.infoBanner}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Check your email</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Code sent to <strong style={{ color: 'var(--accent)' }}>{form.email}</strong>
              </div>
            </div>
            {countdown !== null && !expired && (
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                Expires in <Countdown seconds={countdown} onExpire={() => setExpired(true)} />
              </div>
            )}
            {expired && <div style={{ ...s.errorBox, textAlign: 'center' }}>⏱ Code expired. Request a new one.</div>}
            <OtpInput value={otp} onChange={setOtp} disabled={loading || expired} />
            {info  && <div style={s.infoBox}>{info}</div>}
            {error && <div style={s.errorBox}>{error}</div>}
            <button style={s.btn(loading || expired)} onClick={handleVerify} disabled={loading || expired || otp.length < 6}>
              {loading ? <><span style={s.spinner} /> Verifying…</> : '✓ Create Account'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
              <button style={s.ghostBtn(resendCD > 0)} onClick={handleResend} disabled={loading || resendCD > 0}>
                {resendCD > 0 ? `Resend in ${resendCD}s` : '↺ Resend code'}
              </button>
              <button style={s.ghostBtn(false)} onClick={resetReg}>← Back</button>
            </div>
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