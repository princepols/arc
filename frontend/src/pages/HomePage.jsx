/**
 * Arc AI - Homepage
 * Marketing landing page shown before login.
 * Dark, editorial aesthetic matching Arc's --accent gold theme.
 */

import { useState, useEffect, useRef } from 'react'
import arcLogo from '../assets/arclogo.png'

// ─── Animation hook: trigger when element enters viewport ────────────────────
function useInView(threshold = 0.15) {
  const ref  = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 1800 }) {
  const [val, setVal]    = useState(0)
  const [ref, visible]   = useInView()
  useEffect(() => {
    if (!visible) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const pct = Math.min((ts - start) / duration, 1)
      setVal(Math.floor(pct * to))
      if (pct < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [visible, to, duration])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay = 0 }) {
  const [ref, visible] = useInView()
  return (
    <div ref={ref} style={{ ...cs.featureCard, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.55s ${delay}ms ease, transform 0.55s ${delay}ms ease` }}>
      <div style={cs.featureIcon}>{icon}</div>
      <div style={cs.featureTitle}>{title}</div>
      <div style={cs.featureDesc}>{desc}</div>
    </div>
  )
}

// ─── Mode pill ────────────────────────────────────────────────────────────────
function ModePill({ label, color, bg, delay = 0 }) {
  const [ref, visible] = useInView()
  return (
    <div ref={ref} style={{ ...cs.modePill, color, background: bg, borderColor: color + '44', opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.85)', transition: `all 0.4s ${delay}ms cubic-bezier(0.34,1.56,0.64,1)` }}>
      {label}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePage({ onEnter }) {
  const [scrolled, setScrolled] = useState(false)
  const [heroRef, heroVisible]  = useInView(0.05)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={cs.page}>
      <style>{css}</style>

      {/* ── Navbar ── */}
      <nav style={{ ...cs.nav, background: scrolled ? 'rgba(12,12,14,0.92)' : 'transparent', borderBottomColor: scrolled ? 'rgba(255,255,255,0.07)' : 'transparent', backdropFilter: scrolled ? 'blur(14px)' : 'none' }}>
        <div style={cs.navInner}>
          <div style={cs.navBrand}>
            <img src={arcLogo} alt="Arc" style={cs.navLogo} />
            <span style={cs.navName}>Arc</span>
          </div>
          <div style={cs.navLinks}>
            <a href="#features" style={cs.navLink}>Features</a>
            <a href="#modes"    style={cs.navLink}>Modes</a>
            <a href="#stats"    style={cs.navLink}>Stats</a>
          </div>
          <button style={cs.navCta} onClick={onEnter}>Launch</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={cs.hero} ref={heroRef}>
        {/* Radial glow behind */}
        <div style={cs.heroGlow} />
        {/* Grid overlay */}
        <div style={cs.heroGrid} />

        <div style={{ ...cs.heroContent, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(40px)', transition: 'all 0.8s ease' }}>
          <div style={cs.heroBadge}>
            <span style={cs.heroBadgeDot} />
            Powered by GPT OSS
          </div>

          <h1 style={cs.heroTitle}>
            Meet <span style={cs.heroAccent}>Arc</span>.<br />
            Your Intelligent Companion.
          </h1>

          <p style={cs.heroSub}>
            A next-generation AI assistant with web search, file analysis,<br />

            Free, No Subscription, Running 24/7, Fast Responses, Reliable AI, Always Available.<br />

            code intelligence, and human-grade writing — all in one place.
          </p>

          <div style={cs.heroCtas}>
            <button style={cs.ctaPrimary} onClick={onEnter}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Start Chatting Free
            </button>
            <a href="#features" style={cs.ctaSecondary}>See Features</a>
          </div>
        </div>

        {/* Floating mode pills in hero */}
        <div style={cs.heroPills}>
          {[
            { label: 'Web Search',     color: '#38bdf8', delay: 200  },
            { label: 'Code Mode',       color: '#a78bfa', delay: 350  },
            { label: 'Humanizer',       color: '#2dd4bf', delay: 500  },
            { label: 'Prompt Enhancer', color: '#f59e0b', delay: 650  },
            { label: 'Summarize',        color: '#34d399', delay: 800  },
            { label: 'Paraphrase',       color: '#fb923c', delay: 950  },
          ].map((p, i) => (
            <div key={i} style={{ ...cs.heroPill, color: p.color, borderColor: p.color + '33', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition: `all 0.6s ${p.delay}ms ease` }}>
              {p.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={cs.section}>
        <div style={cs.sectionInner}>
          <SectionLabel>Features</SectionLabel>
          <SectionTitle>Everything you need.<br />Nothing you don't.</SectionTitle>

          <div style={cs.featureGrid}>
            <FeatureCard delay={0}   icon="" title="Live Web Search"      desc="Arc searches the web in real time and synthesizes accurate, sourced answers using Tavily AI." />
            <FeatureCard delay={80}  icon="" title="File Intelligence"    desc="Upload PDFs, DOCX, code, CSV and more. Arc reads and analyzes your documents instantly." />
            <FeatureCard delay={160} icon="" title="Code Assistant"       desc="Write, debug, explain, and refactor code in any language with detailed, clean output." />
            <FeatureCard delay={240} icon="" title="AI Humanizer"         desc="Rewrite AI-generated text to pass any detector. Sentence-level variance, natural voice." />
            <FeatureCard delay={320} icon=""  title="Prompt Engineer"      desc="Turn rough ideas into high-performance prompts using professional prompt engineering." />
            <FeatureCard delay={400} icon="" title="Conversation Context"  desc="Arc keeps track of the discussion so each response builds naturally." />
          </div>
        </div>
      </section>

      {/* ── Modes ── */}
      <section id="modes" style={{ ...cs.section, background: 'var(--bg-surface)' }}>
        <div style={cs.sectionInner}>
          <SectionLabel>Modes</SectionLabel>
          <SectionTitle>One assistant.<br />Seven superpowers.</SectionTitle>
          <p style={cs.sectionSub}>Switch between modes instantly — each tuned for a specific task with a dedicated AI system prompt.</p>

          <div style={cs.modeGrid}>
            <ModePill label="Chat"           color="#e8a838" bg="rgba(232,168,56,0.1)"  delay={0}   />
            <ModePill label="Web Search"     color="#38bdf8" bg="rgba(56,189,248,0.1)" delay={70}  />
            <ModePill label="Summarize"       color="#34d399" bg="rgba(52,211,153,0.1)" delay={140} />
            <ModePill label="Paraphrase"      color="#fb923c" bg="rgba(251,146,60,0.1)" delay={210} />
            <ModePill label="Code"           color="#a78bfa" bg="rgba(167,139,250,0.1)"delay={280} />
            <ModePill label="Prompt Enhancer" color="#f59e0b" bg="rgba(245,158,11,0.1)" delay={350} />
            <ModePill label="Humanizer"      color="#2dd4bf" bg="rgba(45,212,191,0.1)" delay={420} />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" style={cs.section}>
        <div style={cs.sectionInner}>
          <SectionLabel>Under the Hood</SectionLabel>
          <SectionTitle>Built for speed.<br />Designed for depth.</SectionTitle>

          <div style={cs.statsGrid}>
            {[
              { val: 8000,  suffix: '',   label: 'TPM Token Rate',         sub: 'Inference speed'     },
              { val: 7,     suffix: '',   label: 'AI Modes',               sub: 'Purpose-built prompts'    },
              { val: 10,    suffix: 'MB', label: 'Max File Upload',        sub: 'PDF, DOCX, code & more'   },
              { val: 1000,  suffix: '+',  label: 'Free Searches / Month',  sub: 'Via Tavily AI Search'     },
            ].map((s, i) => <StatCard key={i} {...s} delay={i * 100} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={cs.ctaBanner}>
        <div style={cs.ctaGlow} />
        <CtaContent onEnter={onEnter} />
      </section>

      {/* ── Footer ── */}
      <footer style={cs.footer}>
        <div style={cs.footerInner}>
          <div style={cs.footerBrand}>
            <img src={arcLogo} alt="Arc" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Arc</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Built by Prince Ryan · Powered by GPT OSS
          </span>
        </div>
      </footer>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  const [ref, visible] = useInView()
  return (
    <div ref={ref} style={{ ...cs.sectionLabel, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s ease' }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  const [ref, visible] = useInView()
  return (
    <h2 ref={ref} style={{ ...cs.sectionTitle, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s 0.1s ease' }}>
      {children}
    </h2>
  )
}

function StatCard({ val, suffix, label, sub, delay }) {
  const [ref, visible] = useInView()
  return (
    <div ref={ref} style={{ ...cs.statCard, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: `all 0.55s ${delay}ms ease` }}>
      <div style={cs.statVal}>
        <Counter to={val} suffix={suffix} />
      </div>
      <div style={cs.statLabel}>{label}</div>
      <div style={cs.statSub}>{sub}</div>
    </div>
  )
}

function CtaContent({ onEnter }) {
  const [ref, visible] = useInView()
  return (
    <div ref={ref} style={{ ...cs.ctaContent, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.7s ease' }}>
      <h2 style={cs.ctaTitle}>Ready to think faster?</h2>
      <p style={cs.ctaSub}>Join the conversation. Arc is free to use and ready right now.</p>
      <button style={cs.ctaPrimary} onClick={onEnter}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
      >
        Open Arc
      </button>
    </div>
  )
}

// ─── CSS-in-JS styles ─────────────────────────────────────────────────────────

const cs = {
  page:    { minHeight: '100vh', background: 'var(--bg-base)', overflowY: 'auto', overflowX: 'hidden' },

  // Navbar
  nav:     { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: '1px solid transparent', transition: 'all 0.3s ease' },
  navInner:{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navBrand:{ display: 'flex', alignItems: 'center', gap: 9 },
  navLogo: { width: 30, height: 30, borderRadius: 7, objectFit: 'cover' },
  navName: { fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' },
  navLinks:{ display: 'flex', gap: 28 },
  navLink: { fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: '0.04em', fontWeight: 500, transition: 'color 0.15s' },
  navCta:  { padding: '7px 18px', borderRadius: 99, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', letterSpacing: '0.02em', transition: 'all 0.2s' },

  // Hero
  hero:        { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingTop: 80 },
  heroGlow:    { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(232,168,56,0.12) 0%, transparent 70%)', pointerEvents: 'none' },
  heroGrid:    { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)' },
  heroContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 1, maxWidth: 720, padding: '0 24px' },
  heroBadge:   { display: 'flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 99, border: '1px solid rgba(232,168,56,0.25)', background: 'rgba(232,168,56,0.07)', fontSize: 11, color: 'var(--accent)', fontWeight: 500, marginBottom: 28, letterSpacing: '0.04em' },
  heroBadgeDot:{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', animation: 'pulse 2s ease-in-out infinite' },
  heroTitle:   { fontSize: 'clamp(42px, 7vw, 80px)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 24 },
  heroAccent:  { color: 'var(--accent)', textShadow: '0 0 40px rgba(232,168,56,0.4)' },
  heroSub:     { fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36, maxWidth: 560 },
  heroCtas:    { display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  heroPills:   { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 56, padding: '0 24px', maxWidth: 640, zIndex: 1 },
  heroPill:    { padding: '7px 16px', borderRadius: 99, border: '1px solid', fontSize: 12, fontWeight: 600, background: 'var(--bg-elevated)', letterSpacing: '0.02em' },

  // CTA buttons
  ctaPrimary:  { padding: '12px 28px', borderRadius: 99, border: 'none', background: 'var(--accent)', color: '#0c0c0e', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', letterSpacing: '0.02em', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(232,168,56,0.3)' },
  ctaSecondary:{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' },

  // Sections
  section:     { padding: '96px 24px' },
  sectionInner:{ maxWidth: 1100, margin: '0 auto' },
  sectionLabel:{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 },
  sectionTitle:{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16 },
  sectionSub:  { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520, marginBottom: 48 },

  // Feature grid
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 48 },
  featureCard: { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '24px 22px', transition: 'border-color 0.2s, transform 0.2s' },
  featureIcon: { fontSize: 26, marginBottom: 14 },
  featureTitle:{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 },
  featureDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 },

  // Mode pills
  modeGrid:    { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 48 },
  modePill:    { padding: '10px 20px', borderRadius: 99, border: '1px solid', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' },

  // Stats
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginTop: 48 },
  statCard:    { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '28px 24px', textAlign: 'center' },
  statVal:     { fontSize: 44, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1 },
  statLabel:   { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 10, marginBottom: 4 },
  statSub:     { fontSize: 11, color: 'var(--text-muted)' },

  // CTA banner
  ctaBanner:   { padding: '96px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' },
  ctaGlow:     { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(232,168,56,0.1) 0%, transparent 70%)', pointerEvents: 'none' },
  ctaContent:  { position: 'relative', zIndex: 1 },
  ctaTitle:    { fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 14 },
  ctaSub:      { fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 },

  // Footer
  footer:      { borderTop: '1px solid var(--border-subtle)', padding: '20px 32px' },
  footerInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  footerBrand: { display: 'flex', alignItems: 'center', gap: 8 },
}

// Global keyframes
const css = `
  @keyframes pulse { 0%,100% { opacity:1; box-shadow: 0 0 8px var(--accent); } 50% { opacity:0.5; box-shadow: 0 0 3px var(--accent); } }
  #features .featureCard:hover { border-color: var(--border-strong) !important; transform: translateY(-3px) !important; }
  a[href^="#"]:hover { color: var(--text-primary) !important; }
`