/**
 * Arc AI - TokenRing Component
 * SVG circular progress ring showing token usage for the current session.
 *
 * Props:
 *   messages   — array of message objects from useChat
 *   inputText  — current text in the textarea (counted live)
 *   mode       — current mode (used to pick system prompt length estimate)
 */

import { useState, useMemo } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN_LIMIT = 8000   // Groq TPM (tokens per minute) for gpt-oss-120b

// Approximate system prompt sizes per mode (in tokens)
// Based on actual character counts in gemini.py ÷ 4
const SYSTEM_PROMPT_TOKENS = {
  general:        120,
  search:         110,
  summarize:       95,
  paraphrase:      90,
  code:            95,
  prompt_enhance: 115,
  humanize:       200,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Estimate token count from a string (1 token ≈ 4 chars) */
function estimateTokens(text = '') {
  return Math.ceil(text.length / 4)
}

/** Calculate total tokens for the whole conversation context */
function calcTokenUsage(messages, inputText, mode) {
  const systemTokens = SYSTEM_PROMPT_TOKENS[mode] ?? 120

  // Count all stored messages
  const historyTokens = messages.reduce((sum, m) => {
    // Each message has ~4 tokens overhead (role, formatting)
    return sum + estimateTokens(m.content) + 4
  }, 0)

  // Count what the user is currently typing
  const inputTokens = estimateTokens(inputText)

  return {
    system:  systemTokens,
    history: historyTokens,
    input:   inputTokens,
    total:   systemTokens + historyTokens + inputTokens,
  }
}

/** Pick ring color based on usage percentage */
function ringColor(pct) {
  if (pct >= 80) return '#f87171'   // red
  if (pct >= 50) return '#fbbf24'   // yellow
  return '#4ade80'                  // green
}

// ─── SVG Ring ────────────────────────────────────────────────────────────────

const SIZE   = 28      // outer diameter
const STROKE = 3       // ring thickness
const R      = (SIZE - STROKE) / 2
const CIRC   = 2 * Math.PI * R

function SvgRing({ pct, color }) {
  const filled = CIRC * Math.min(pct / 100, 1)
  const gap    = CIRC - filled

  return (
    <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle
        cx={SIZE / 2} cy={SIZE / 2} r={R}
        fill="none"
        stroke="var(--border-mid)"
        strokeWidth={STROKE}
      />
      {/* Progress */}
      <circle
        cx={SIZE / 2} cy={SIZE / 2} r={R}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
        style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.4s ease' }}
      />
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TokenRing({ messages = [], inputText = '', mode = 'general' }) {
  const [hover, setHover] = useState(false)

  const usage = useMemo(
    () => calcTokenUsage(messages, inputText, mode),
    [messages, inputText, mode]
  )

  const pct      = Math.min((usage.total / TOKEN_LIMIT) * 100, 100)
  const color    = ringColor(pct)
  const remaining = Math.max(TOKEN_LIMIT - usage.total, 0)
  const nearLimit = pct >= 90

  return (
    <div
      style={s.wrapper}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* ── Ring ── */}
      <div style={s.ring}>
        <SvgRing pct={pct} color={color} />
        {/* Tiny dot in center */}
        <div style={{ ...s.dot, background: color }} />
      </div>

      {/* ── Tooltip ── */}
      {hover && (
        <div style={s.tooltip}>
          {/* Header */}
          <div style={s.ttHeader}>
            <span style={s.ttTitle}>Token Rate Usage</span>
            <span style={{ ...s.ttBadge, background: color + '22', color }}>
              {Math.round(pct)}%
            </span>
          </div>

          <div style={s.ttDivider} />

          {/* Stats */}
          <div style={s.ttRows}>
            <TtRow label="Request Tokens"    value={`${usage.total.toLocaleString()} / ${TOKEN_LIMIT.toLocaleString()}`} />
            <TtRow label="System Prompt"     value={`~${usage.system} tokens`}  dim />
            <TtRow label="Conversation"      value={`~${usage.history} tokens`} dim />
            <TtRow label="Current Input"     value={`~${usage.input} tokens`}   dim />
            <TtRow label="Messages"          value={messages.length} />
            <TtRow label="Est. Remaining"    value={`~${remaining.toLocaleString()} tokens`} highlight={color} />
          </div>

          {/* Progress bar */}
          <div style={s.ttBar}>
            <div style={{ ...s.ttBarFill, width: `${pct}%`, background: color }} />
          </div>

          {/* Warning */}
          {nearLimit && (
            <div style={s.ttWarning}>
              ⚠ Request approaching the 8,000 tokens/min limit.<br />
              Please create a new chat.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Single row in the tooltip */
function TtRow({ label, value, dim, highlight }) {
  return (
    <div style={s.ttRow}>
      <span style={{ ...s.ttLabel, opacity: dim ? 0.6 : 1 }}>{label}</span>
      <span style={{ ...s.ttValue, color: highlight || 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  wrapper: {
    position: 'relative',
    display:  'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'default',
  },

  ring: {
    width: SIZE, height: SIZE,
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  dot: {
    position: 'absolute',
    width: 5, height: 5,
    borderRadius: '50%',
    transition: 'background 0.4s',
  },

  // ── Tooltip ──────────────────────────────────────────────────────────────
  tooltip: {
    position: 'absolute',
    bottom: 'calc(100% + 10px)',
    right: 0,
    width: 240,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    borderRadius: 12,
    padding: '12px 14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    zIndex: 999,
    animation: 'fadeSlideIn 0.15s ease forwards',
    pointerEvents: 'none',
  },

  ttHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  ttTitle: {
    fontSize: 12, fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '0.02em',
  },
  ttBadge: {
    fontSize: 10, fontWeight: 700,
    padding: '2px 7px', borderRadius: 99,
  },

  ttDivider: {
    height: 1,
    background: 'var(--border-subtle)',
    margin: '8px 0',
  },

  ttRows: { display: 'flex', flexDirection: 'column', gap: 5 },

  ttRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  ttLabel: { fontSize: 11, color: 'var(--text-secondary)' },
  ttValue: { fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' },

  ttBar: {
    height: 4, borderRadius: 99,
    background: 'var(--border-subtle)',
    marginTop: 10, overflow: 'hidden',
  },
  ttBarFill: {
    height: '100%', borderRadius: 99,
    transition: 'width 0.4s ease, background 0.4s ease',
  },

  ttWarning: {
    marginTop: 10,
    padding: '7px 10px',
    background: 'rgba(248,113,113,0.08)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 8,
    fontSize: 10,
    color: '#f87171',
    lineHeight: 1.6,
  },
}