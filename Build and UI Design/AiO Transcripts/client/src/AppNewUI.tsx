import { useState } from 'react'
import './styles.css'
import './AppNewUI.css'

export default function AppNewUI() {
  const [sequence, setSequence] = useState('Product_Launch_Sequence_01')
  const [frame, setFrame] = useState<'ngang' | 'doc'>('ngang')
  const [mode, setMode] = useState<'turbo' | 'deep'>('turbo')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const handleStart = () => {
    setIsProcessing(true)
    setShowResult(false)
    setTimeout(() => {
      setIsProcessing(false)
      setShowResult(true)
    }, 2500)
  }

  return (
    <div className="app app-newui">
      {/* Topbar Header */}
      <header className="topbar topbar-newui">
        <div className="brand-badge">
          <span className="brand-dot"></span>
          <span className="brand-title">AiO Transcripts</span>
          <span className="version-pill">v2.4.0 PRO</span>
        </div>
        <div className="status-indicator">
          <i className="status-light online"></i>
          <span>Premiere Pro Connected</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="than than-newui">
        {/* Banner Hero */}
        <section className="ui-card hero-card">
          <div className="hero-header-row">
            <span className="badge-tag">NATIVE AI SUBTITLES</span>
            <span className="engine-tag">Whisper GPU Accelerated</span>
          </div>
          <h2>Tự động chép lời & Tạo phụ đề Timeline</h2>
          <p className="hero-desc">
            Khoanh vùng bằng <kbd>I</kbd> và <kbd>O</kbd> trên Premiere Sequence.
            Hệ thống tự nhận diện giọng nói, ngắt câu chuẩn dòng và đánh dấu mốc nghi vấn.
          </p>
        </section>

        {/* Configuration Panel */}
        <section className="ui-card config-card">
          <div className="card-title-row">
            <h3>Cấu hình phiên chép lời</h3>
            <span className="sub-note">Tối ưu theo định dạng video</span>
          </div>

          {/* Sequence Selection */}
          <div className="control-group">
            <label className="control-label">Target Sequence</label>
            <select 
              className="select-custom" 
              value={sequence} 
              onChange={(e) => setSequence(e.target.value)}
            >
              <option value="Product_Launch_Sequence_01">Product_Launch_Sequence_01 (Active)</option>
              <option value="Podcast_Episode_104_Final">Podcast_Episode_104_Final</option>
              <option value="Social_Reels_Vertical_0916">Social_Reels_Vertical_0916</option>
            </select>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="control-group">
            <label className="control-label">Khung hình & Quy chuẩn dòng</label>
            <div className="segmented-control">
              <button 
                className={`segment-btn ${frame === 'ngang' ? 'active' : ''}`}
                onClick={() => setFrame('ngang')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
                Ngang 16:9 (Chuẩn TV/YouTube)
              </button>
              <button 
                className={`segment-btn ${frame === 'doc' ? 'active' : ''}`}
                onClick={() => setFrame('doc')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/></svg>
                Dọc 9:16 (Shorts/Reels)
              </button>
            </div>
            <p className="control-hint">
              {frame === 'ngang' 
                ? '✓ Tối đa 42 ký tự/dòng — chuẩn phụ đề quốc tế không che hình' 
                : '✓ Tối đa 24 ký tự/dòng — ngắt ngắn chống tràn mép & né Safe Zone'}
            </p>
          </div>

          {/* Processing Mode Selector */}
          <div className="control-group">
            <label className="control-label">Chế độ AI Whisper</label>
            <div className="segmented-control">
              <button 
                className={`segment-btn ${mode === 'turbo' ? 'active' : ''}`}
                onClick={() => setMode('turbo')}
              >
                ⚡ Turbo (Câu ngắn - Tốc độ cao)
              </button>
              <button 
                className={`segment-btn ${mode === 'deep' ? 'active' : ''}`}
                onClick={() => setMode('deep')}
              >
                🎯 Deep Transcribe (Chính xác cao)
              </button>
            </div>
            <p className="control-hint">
              {mode === 'turbo' 
                ? '⚡ Tốc độ gấp 3 lần — phù hợp video ngắn, vlog cá nhân' 
                : '🎯 Nghe kỹ từng từ — phù hợp Podcast, phỏng vấn, từ ngữ chuyên ngành'}
            </p>
          </div>

          {/* Start Action Button */}
          {!isProcessing ? (
            <button className="btn-action-primary" onClick={handleStart}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {showResult ? 'Chép lại đoạn này' : 'Bắt đầu làm phụ đề'}
            </button>
          ) : (
            <div className="processing-box">
              <div className="spinner"></div>
              <span>Đang nhận diện giọng nói & tách câu... 78%</span>
            </div>
          )}
        </section>

        {/* Results Section */}
        {showResult && (
          <section className="ui-card result-card">
            <div className="result-header">
              <span className="status-success-tag">✓ ĐÃ GẮN LÊN TIMELINE</span>
              <span className="time-tag">Thời gian xử lý: 4.2 giây</span>
            </div>

            <div className="result-stats-grid">
              <div className="stat-box">
                <span className="stat-num">48</span>
                <span className="stat-lbl">Câu phụ đề</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">642</span>
                <span className="stat-lbl">Tổng số từ</span>
              </div>
              <div className="stat-box">
                <span className="stat-num highlight">5</span>
                <span className="stat-lbl">Mốc nghi vấn (Cờ đỏ)</span>
              </div>
            </div>

            <div className="result-actions">
              <button className="btn-sec">Xem danh sách Marker</button>
              <button className="btn-sec">Xuất file .SRT</button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
