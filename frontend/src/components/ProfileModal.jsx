/**
 * Arc AI - ProfileModal (Mobile-Responsive)
 */

import { useState, useRef } from 'react'
import { X, Camera, Check } from 'lucide-react'

const PRESET_AVATARS = [
  '🧑','👩','👨','🧔','👱','🧕','👮','🧑‍💻',
  '🧑‍🎨','🧑‍🚀','🦸','🧙','🐱','🐶','🦊','🐼',
  '🌟','⚡','🔥','🎯','💎','🚀','🎮','🎵',
]

export function Avatar({ profile, size = 32, fontSize = 13 }) {
  if (profile.avatar?.startsWith('data:')) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        <img src={profile.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  if (profile.avatar) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.55, flexShrink: 0 }}>
        {profile.avatar}
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent)', color: '#0c0c0e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 700, flexShrink: 0 }}>
      {(profile.displayName || 'U')[0].toUpperCase()}
    </div>
  )
}

export default function ProfileModal({ profile, onSave, onClose }) {
  const [name,      setName]     = useState(profile.displayName)
  const [avatar,    setAvatar]   = useState(profile.avatar)
  const [tab,       setTab]      = useState('preset')
  const [nameError, setNameErr]  = useState('')
  const fileRef = useRef(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setAvatar(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed)           { setNameErr('Display name cannot be empty.'); return }
    if (trimmed.length > 32){ setNameErr('Name must be 32 characters or less.'); return }
    onSave({ displayName: trimmed, avatar }); onClose()
  }

  return (
    <div style={s.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>

        <div style={s.modalHeader}>
          <span style={s.modalTitle}>Profile Settings</span>
          <button style={s.closeBtn} onClick={onClose}><X size={15} /></button>
        </div>

        <div style={s.previewRow}>
          <Avatar profile={{ displayName: name || 'U', avatar }} size={72} fontSize={26} />
          <div style={s.previewName}>{name || 'Your Name'}</div>
        </div>

        <div style={s.field}>
          <label style={s.label}>Display Name</label>
          <input
            style={{ ...s.input, ...(nameError ? { borderColor: '#f87171' } : {}) }}
            value={name}
            onChange={e => { setName(e.target.value); setNameErr('') }}
            placeholder="Enter your name…" maxLength={32}
          />
          {nameError && <span style={s.fieldErr}>{nameError}</span>}
        </div>

        <div style={s.field}>
          <label style={s.label}>Avatar</label>
          <div style={s.tabs}>
            <button style={s.tab(tab === 'preset')} onClick={() => setTab('preset')}>Emoji</button>
            <button style={s.tab(tab === 'upload')} onClick={() => setTab('upload')}>Upload Photo</button>
            <button style={s.tab(tab === 'none')}   onClick={() => { setTab('none'); setAvatar(null) }}>Initials</button>
          </div>

          {tab === 'preset' && (
            <div style={s.emojiGrid}>
              {PRESET_AVATARS.map(emoji => (
                <button key={emoji} style={s.emojiBtn(avatar === emoji)} onClick={() => setAvatar(emoji)}>{emoji}</button>
              ))}
            </div>
          )}

          {tab === 'upload' && (
            <div style={s.uploadArea} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              {avatar?.startsWith('data:') ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <img src={avatar} alt="preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click to change</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Camera size={22} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click to upload image</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>JPG, PNG, GIF · max 2 MB</span>
                </div>
              )}
            </div>
          )}

          {tab === 'none' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
              <Avatar profile={{ displayName: name || 'U', avatar: null }} size={44} fontSize={17} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your initial will be shown.</span>
            </div>
          )}
        </div>

        <div style={s.modalFooter}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.saveBtn} onClick={handleSave}><Check size={13} /> Save Changes</button>
        </div>

      </div>
    </div>
  )
}

const s = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(3px)', padding: '16px',
  },
  modal: {
    width: '100%', maxWidth: 400,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-mid)',
    borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    animation: 'fadeSlideIn 0.2s ease forwards',
    maxHeight: '90vh', overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)',
  },
  modalTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' },
  closeBtn:   { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6 },
  previewRow: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 0 12px' },
  previewName:{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  field:      { padding: '0 18px 16px' },
  label:      { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 },
  input: {
    width: '100%', background: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)', borderRadius: 9,
    color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
    fontSize: 16, padding: '9px 12px', outline: 'none',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  },
  fieldErr:   { fontSize: 11, color: '#f87171', marginTop: 4, display: 'block' },
  tabs:       { display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' },
  tab: (active) => ({
    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, cursor: 'pointer',
    border: active ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    transition: 'all 0.13s',
  }),
  emojiGrid: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, padding: '6px 0' },
  emojiBtn: (selected) => ({
    width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer',
    border: selected ? '2px solid var(--accent)' : '1px solid transparent',
    background: selected ? 'var(--accent-dim)' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s',
  }),
  uploadArea: {
    border: '1.5px dashed var(--border-mid)', borderRadius: 10, padding: '20px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-elevated)', transition: 'border-color 0.15s',
  },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: 8,
    padding: '12px 18px', borderTop: '1px solid var(--border-subtle)',
  },
  cancelBtn: {
    padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
    border: '1px solid var(--border-subtle)', background: 'transparent',
    color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontSize: 12,
  },
  saveBtn: {
    padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
    border: 'none', background: 'var(--accent)', color: '#0c0c0e',
    fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 5,
  },
}