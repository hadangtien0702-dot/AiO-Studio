import { useState } from 'react'

export default function AppCyberpunkUI() {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom' | 'history'>('preset')
  const [selectedFormat, setSelectedFormat] = useState<'vertical' | 'horizontal'>('vertical')
  const [speechModel, setSpeechModel] = useState<'fast' | 'pro'>('pro')
  const [autoMarker, setAutoMarker] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleStartTranscribe = () => {
    setIsProcessing(true)
    setProgress(15)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          return 100
        }
        return prev + 25
      })
    }, 400)
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 0%, #1a102f 0%, #0b0813 60%, #05040a 100%)',
      color: '#e2e8f0',
      fontFamily: '"Outfit", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      {/* ── HEADER NEON BAR ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#ff007a',
            boxShadow: '0 0 12px #ff007a, 0 0 20px #ff007a'
          }} />
          <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AiO TRANSCRIPTS
          </span>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: 'rgba(165, 180, 252, 0.1)', color: '#a5b4fc', border: '1px solid rgba(165, 180, 252, 0.2)' }}>
            STUDIO 2026
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#00f2fe', background: 'rgba(0, 242, 254, 0.1)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(0, 242, 254, 0.25)', fontWeight: 600 }}>
            ● PREMIERE LIVE
          </span>
        </div>
      </header>

      {/* ── TAB NAVIGATION ── */}
      <nav style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
        {[
          { id: 'preset', label: '⚡ Studio Presets' },
          { id: 'custom', label: '🎛 Custom Engine' },
          { id: 'history', label: '📜 Recent Exports' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '12px',
              border: activeTab === tab.id ? '1px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.05)',
              background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(236, 72, 153, 0.15))' : 'rgba(255, 255, 255, 0.02)',
              color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 4px 20px rgba(124, 58, 237, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── MAIN CARD CONTAINER ── */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* HERO CARD WITH LIQUID GLASS EFFECT */}
        <div style={{
          position: 'relative',
          padding: '20px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px', borderRadius: '6px', background: 'linear-gradient(90deg, #7c3aed, #ec4899)', color: '#fff' }}>
              PRO ENGINE 2026
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>In/Out Mark Active</span>
          </div>

          <h1 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', background: 'linear-gradient(90deg, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Speech-to-Text Subtitle Generator
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            Set In/Out points (<kbd style={{ background: '#1e1b4b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #4338ca', color: '#818cf8' }}>I</kbd> / <kbd style={{ background: '#1e1b4b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #4338ca', color: '#818cf8' }}>O</kbd>) on sequence. Engine generates timeline captions & confidence markers automatically.
          </p>
        </div>

        {/* FORMAT SELECTION GRID */}
        <div style={{
          padding: '20px',
          borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            1. Select Output Format & Rules
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Vertical Option */}
            <div
              onClick={() => setSelectedFormat('vertical')}
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: selectedFormat === 'vertical' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: selectedFormat === 'vertical' ? '1px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ width: '12px', height: '18px', border: '2px solid #ec4899', borderRadius: '3px', display: 'inline-block' }} />
                <strong style={{ fontSize: '13px', color: '#fff' }}>Vertical 9:16</strong>
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Shorts/Reels (Max 24 chars/line, safe zone aware)</p>
            </div>

            {/* Horizontal Option */}
            <div
              onClick={() => setSelectedFormat('horizontal')}
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: selectedFormat === 'horizontal' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: selectedFormat === 'horizontal' ? '1px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ width: '18px', height: '12px', border: '2px solid #38bdf8', borderRadius: '3px', display: 'inline-block' }} />
                <strong style={{ fontSize: '13px', color: '#fff' }}>Horizontal 16:9</strong>
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>YouTube/TV (Max 42 chars/line, broadcast standard)</p>
            </div>
          </div>
        </div>

        {/* AI MODEL & OPTIONS */}
        <div style={{
          padding: '20px',
          borderRadius: '20px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            2. Whisper AI Engine & Markers
          </label>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <button
              onClick={() => setSpeechModel('fast')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                background: speechModel === 'fast' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: speechModel === 'fast' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.05)',
                color: speechModel === 'fast' ? '#38bdf8' : '#94a3b8',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              ⚡ Fast Turbo (Shorts)
            </button>
            <button
              onClick={() => setSpeechModel('pro')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                background: speechModel === 'pro' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: speechModel === 'pro' ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.05)',
                color: speechModel === 'pro' ? '#ec4899' : '#94a3b8',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              🎯 Deep Precision (Podcast)
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e1' }}>
            <input
              type="checkbox"
              checked={autoMarker}
              onChange={(e) => setAutoMarker(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#7c3aed', cursor: 'pointer' }}
            />
            <span>Auto-flag low-confidence words with Red Timeline Markers</span>
          </label>
        </div>

        {/* ACTION BUTTON WITH NEON GLOW */}
        <button
          onClick={handleStartTranscribe}
          disabled={isProcessing}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            border: 'none',
            background: isProcessing ? '#334155' : 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            color: '#000',
            fontWeight: 900,
            fontSize: '14px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            boxShadow: isProcessing ? 'none' : '0 8px 30px rgba(0, 242, 254, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {isProcessing ? `Processing AI Speech... ${progress}%` : '🚀 GENERATE TIMELINE CAPTIONS'}
        </button>

        {/* PROGRESS BAR */}
        {isProcessing && (
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #00f2fe, #ec4899)', transition: 'width 0.3s ease' }} />
          </div>
        )}

      </main>
    </div>
  )
}
