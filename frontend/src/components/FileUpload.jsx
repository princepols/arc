/**
 * Arc AI - FileUpload Component (Mobile-Responsive)
 */

import { useState, useRef } from 'react'
import { uploadAPI } from '../utils/api'
import { Paperclip, X, Loader, AlertCircle, CheckCircle2 } from 'lucide-react'

const ACCEPTED = '.txt,.md,.json,.csv,.xml,.yaml,.yml,.pdf,.docx,.py,.js,.jsx,.ts,.tsx,.html,.css,.java,.c,.cpp,.cs,.go,.rs,.php,.rb,.swift,.kt,.sh,.sql'

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  if (['pdf'].includes(ext))                                                          return '📄'
  if (['docx','doc'].includes(ext))                                                   return '📝'
  if (['py','js','jsx','ts','tsx','java','c','cpp','cs','go','rs','php','rb','swift','kt'].includes(ext)) return '💻'
  if (['json','csv','xml','yaml','yml'].includes(ext))                                return '📊'
  if (['md','txt'].includes(ext))                                                     return '📃'
  if (['sh','bash','sql'].includes(ext))                                              return '⚙️'
  return '📁'
}

function formatBytes(n) {
  if (n < 1024)       return `${n} B`
  if (n < 1024*1024)  return `${(n/1024).toFixed(1)} KB`
  return `${(n/1024/1024).toFixed(1)} MB`
}

export default function FileUpload({ onFileReady, onClear, attachedFile }) {
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    setError(''); setUploading(true)
    try {
      const result = await uploadAPI.upload(file)
      onFileReady(result)
    } catch (e) { setError(e.message) }
    finally { setUploading(false) }
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (attachedFile) return (
    <div style={s.pill}>
      <span style={s.pillIcon}>{getFileIcon(attachedFile.filename)}</span>
      <div style={s.pillInfo}>
        <span style={s.pillName}>{attachedFile.filename}</span>
        <span style={s.pillMeta}>{formatBytes(attachedFile.size_bytes)} · {attachedFile.char_count.toLocaleString()} chars{attachedFile.truncated ? ' (truncated)' : ''}</span>
      </div>
      <CheckCircle2 size={14} color="#4ade80" style={{ flexShrink: 0 }} />
      <button style={s.pillRemove} onClick={onClear} title="Remove file"><X size={13} /></button>
    </div>
  )

  return (
    <div>
      <div
        style={s.dropzone(dragging, uploading)}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        {uploading ? (
          <div style={s.dropInner}>
            <Loader size={18} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={s.dropText}>Reading file…</span>
          </div>
        ) : (
          <div style={s.dropInner}>
            <Paperclip size={16} color={dragging ? 'var(--accent)' : 'var(--text-muted)'} />
            <span style={s.dropText}>{dragging ? 'Drop to upload' : 'Attach a file'}</span>
            <span style={s.dropHint}>txt, pdf, docx, md, json, csv, code files · max 10 MB</span>
          </div>
        )}
      </div>
      {error && (
        <div style={s.errorRow}>
          <AlertCircle size={12} color="#f87171" />
          <span style={s.errorText}>{error}</span>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const s = {
  dropzone: (drag, loading) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '12px 16px',
    border: `1.5px dashed ${drag ? 'var(--accent)' : 'var(--border-mid)'}`,
    borderRadius: 10,
    background: drag ? 'var(--accent-dim)' : 'var(--bg-elevated)',
    cursor: loading ? 'default' : 'pointer',
    transition: 'all 0.15s',
  }),
  dropInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  dropText:  { fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' },
  dropHint:  { fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' },
  errorRow:  { display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 },
  errorText: { fontSize: 11, color: '#f87171' },
  pill: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '8px 12px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    borderRadius: 10,
  },
  pillIcon:   { fontSize: 18, flexShrink: 0 },
  pillInfo:   { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 },
  pillName:   { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pillMeta:   { fontSize: 10, color: 'var(--text-muted)' },
  pillRemove: { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2, borderRadius: 4, flexShrink: 0 },
}