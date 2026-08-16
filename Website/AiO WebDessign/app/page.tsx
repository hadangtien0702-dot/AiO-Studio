"use client";

import {
  Activity,
  ArrowRight,
  Box,
  Captions,
  Check,
  ChevronRight,
  Cpu,
  Film,
  FolderOpen,
  Layers,
  Layers3,
  Lightbulb,
  Maximize2,
  Menu,
  MonitorPlay,
  MousePointer2,
  Music2,
  Play,
  RotateCcw,
  Scissors,
  ShieldCheck,
  Sliders,
  Sparkles,
  Video,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

type ToolId = 
  | "assets" 
  | "powerbins" 
  | "autocut" 
  | "transcripts" 
  | "reframe" 
  | "podcast" 
  | "guideframe" 
  | "cutshort";

const lessons = [
  { id: "top", label: "Overview", short: "01", width: 20 },
  { id: "basics", label: "Pain Points", short: "02", width: 20 },
  { id: "lab", label: "8 Native Tools", short: "03", width: 25 },
  { id: "comparison", label: "Vs Competitors", short: "04", width: 20 },
  { id: "pricing", label: "Pricing", short: "05", width: 15 },
] as const;

const tools = [
  {
    id: "autocut" as const,
    name: "Auto Cut",
    category: "Rough Cut",
    headline: "Cắt Khoảng Lặng 1-Click",
    speed: "6:29 video ➔ 23s",
    image: "/assets/autocut-420.png",
    icon: Scissors,
    color: "orange",
    tag: "Tiết kiệm 80% thời gian",
    bullets: [
      "Quét và phát hiện dải sóng âm tự động",
      "Xóa sạch khoảng lặng thừa & dồn timeline tức thì",
      "Hoàn tác một nút — panel tự nhớ trạng thái gốc",
    ],
  },
  {
    id: "podcast" as const,
    name: "Auto Podcast",
    category: "Multicam AI",
    headline: "Đạo Diễn Multicam Tự Động",
    speed: "588/588 mốc đúng cam",
    image: "/assets/autocut-800.png",
    icon: WandSparkles,
    color: "purple",
    tag: "Luôn cắt trên bản sao",
    bullets: [
      "Chuyển góc camera theo mic người nói",
      "Cắt trên bản sao — bản gốc không bị đụng tới",
      "Hỗ trợ trộn sample rate 44.1k & 48k",
    ],
  },
  {
    id: "transcripts" as const,
    name: "Auto Transcripts",
    category: "Phụ Đề AI",
    headline: "60 Phút Audio ➔ 2,4 Phút",
    speed: "chạy lại chỉ 14s",
    image: "/assets/transcripts-420.png",
    icon: Captions,
    color: "green",
    tag: "100% Offline GPU",
    bullets: [
      "AI chuyển giọng nói thành văn bản siêu tốc",
      "Tự ngắt dòng chuẩn hiển thị TikTok/Reels",
      "Xuất file .SRT hoặc Premiere Captions",
    ],
  },
  {
    id: "reframe" as const,
    name: "Auto Re-Frames",
    category: "Social 9:16",
    headline: "Chuyển 16:9 Sang 9:16 Tự Động",
    speed: "0.2s tạo sequence",
    image: "/assets/re-frames-420.png",
    icon: MonitorPlay,
    color: "yellow",
    tag: "Bám chủ thể AI",
    bullets: [
      "Deep tracking giữ chủ thể luôn ở trung tâm",
      "Tự động nhân bản sequence dọc trong 1 click",
      "Giữ nguyên độ sắc nét và khung hình gốc",
    ],
  },
  {
    id: "assets" as const,
    name: "Asset Manager",
    category: "Quản Lý Kho",
    headline: "28.000+ Assets Preview <1s",
    speed: "<1s xem trước",
    image: "/assets/asset-manager-420.png",
    icon: Layers3,
    color: "blue",
    tag: "Không lag NLE",
    bullets: [
      "Quét toàn bộ ổ cứng không làm chậm máy",
      "Xem trước video và sóng âm thanh dưới 1s",
      "Kéo thả trực tiếp vào timeline Premiere",
    ],
  },
  {
    id: "powerbins" as const,
    name: "Power Bins",
    category: "Brand Kit",
    headline: "Brand Kit Dùng Chung Mọi Project",
    speed: "Sẵn sàng tức thì",
    image: "/assets/power-bins-420.png",
    icon: Box,
    color: "orange",
    tag: "Cài 1 lần dùng mãi",
    bullets: [
      "Kho lưu trữ logo, intro, outro thương hiệu",
      "Mở project mới là có sẵn tài nguyên",
      "Không bao giờ phải import lại từ đầu",
    ],
  },
  {
    id: "guideframe" as const,
    name: "Guide Frame",
    category: "Bố Cục",
    headline: "Safe Zone 10 Nền Tảng",
    speed: "0.2s bật/tắt",
    image: "/assets/re-frames-800.png",
    icon: Sparkles,
    color: "blue",
    tag: "Chuẩn 53 vùng nguy hiểm",
    bullets: [
      "Lưới an toàn TikTok, Reels, Shorts, Shopee",
      "Tránh tiêu đề bị che bởi avatar và nút tim",
      "Bật tắt nhanh trong 0.2s không rác timeline",
    ],
  },
  {
    id: "cutshort" as const,
    name: "Auto Cut Short",
    category: "Viral Clip",
    headline: "Tách Video Ngắn 60s Tự Động",
    speed: "Sắp ra mắt",
    image: "/assets/AiO Welcome.webp",
    icon: Zap,
    color: "purple",
    tag: "Coming Soon — đang phát triển",
    bullets: [
      "Quét đoạn cao trào trong video dài",
      "Tự động trích xuất clip 60 giây nổi bật",
      "Sẵn sàng xuất bản đa nền tảng mạng xã hội",
    ],
  },
];

function AiOLogo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`aio-logo-wrap ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <img
        src="/AiO Logo 3.png"
        alt="AiO Studio"
        width={size}
        height={size}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          borderRadius: "4px",
        }}
      />
    </span>
  );
}

function Header({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (open: boolean) => void }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="AiO Studio - Trang chủ">
        <AiOLogo size={26} />
        <span>AiO Studio</span>
        <small>Workflow Suite</small>
      </a>
      <nav className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="Điều hướng chính">
        <a href="#basics" onClick={() => setMenuOpen(false)}>Vấn đề</a>
        <a href="#lab" onClick={() => setMenuOpen(false)}>Sản phẩm</a>
        <a href="#journey" onClick={() => setMenuOpen(false)}>Giá trị</a>
        <a className="nav-cta" href="#lab" onClick={() => setMenuOpen(false)}>
          Xem workflow <Play size={15} fill="currentColor" />
        </a>
      </nav>
      <button
        className="menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
    </header>
  );
}

function LessonRail({
  progress,
  active,
  onSelectSection,
}: {
  progress: number;
  active: string;
  onSelectSection: (id: string) => void;
}) {
  const activeIndex = Math.max(0, lessons.findIndex((l) => l.id === active));

  let cumPercent = 0;
  for (let i = 0; i < activeIndex; i++) {
    cumPercent += lessons[i].width;
  }
  const currentTabWidth = lessons[activeIndex].width;
  const playheadPercent = Math.min(98.5, Math.max(1.5, cumPercent + currentTabWidth / 2));

  return (
    <nav className="lesson-rail" aria-label="Các bài học trên trang">
      <div className="lesson-rail-label">
        <Film size={16} />
        <span>AiO Studio · Editor workflow</span>
        <strong>{Math.round(progress * 100)}%</strong>
      </div>
      <div className="lesson-track">
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            type="button"
            className={active === lesson.id ? "is-active" : ""}
            style={{ width: `${lesson.width}%` }}
            onClick={() => onSelectSection(lesson.id)}
            aria-current={active === lesson.id ? "location" : undefined}
          >
            <small>{lesson.short}</small>
            <span>{lesson.label}</span>
            <Check size={13} />
          </button>
        ))}
        <i
          className="lesson-playhead"
          style={{ left: `${playheadPercent}%` }}
          aria-hidden="true"
        />
      </div>
    </nav>
  );
}

type HeroSimMode = "autocut" | "podcast" | "transcripts" | "reframe";

function HeroConsoleSimulator({ run }: { run: number }) {
  const [activeMode, setActiveMode] = useState<HeroSimMode>("autocut");
  const [cutApplied, setCutApplied] = useState(true);

  useEffect(() => {
    setCutApplied(false);
    const timer = setTimeout(() => {
      setCutApplied(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [run, activeMode]);

  return (
    <div className={`hero-console-simulator ${cutApplied ? "cut-processed" : ""}`} key={`${activeMode}-${run}`}>
      {/* Streamlined Mode Switcher */}
      <div className="sim-mode-bar" role="tablist" aria-label="Chế độ mô phỏng">
        <button
          type="button"
          className={`sim-mode-btn ${activeMode === "autocut" ? "is-active" : ""}`}
          onClick={() => { setActiveMode("autocut"); setCutApplied(false); }}
        >
          <Scissors size={14} />
          <span>Auto Cut</span>
        </button>
        <button
          type="button"
          className={`sim-mode-btn ${activeMode === "podcast" ? "is-active" : ""}`}
          onClick={() => { setActiveMode("podcast"); setCutApplied(false); }}
        >
          <Video size={14} />
          <span>Auto Podcast</span>
        </button>
        <button
          type="button"
          className={`sim-mode-btn ${activeMode === "transcripts" ? "is-active" : ""}`}
          onClick={() => { setActiveMode("transcripts"); setCutApplied(false); }}
        >
          <Captions size={14} />
          <span>Transcripts AI</span>
        </button>
        <button
          type="button"
          className={`sim-mode-btn ${activeMode === "reframe" ? "is-active" : ""}`}
          onClick={() => { setActiveMode("reframe"); setCutApplied(false); }}
        >
          <MonitorPlay size={14} />
          <span>Auto Re-Frames</span>
        </button>
      </div>

      {/* Premiere Pro Main Container */}
      <div className="nle-window-frame">
        {/* NLE Topbar */}
        <div className="nle-topbar">
          <div className="nle-window-dots">
            <span className="dot dot-close" />
            <span className="dot dot-min" />
            <span className="dot dot-max" />
          </div>
          <div className="nle-title">
            <span className="pr-tag">Pr</span>
            <strong>Podcast_Episode_42_RoughCut.prproj</strong>
            <span className="seq-info">4K UHD · 23.98 fps</span>
          </div>
          <div className="nle-engine-status">
            <span className="pulse-dot" />
            <small>AiO Local GPU: Active</small>
          </div>
        </div>

        {/* NLE Workspace: Monitor + AiO Dock */}
        <div className="nle-workspace-grid">
          {/* Monitor Screen */}
          <div className="nle-monitor">
            <div className="monitor-header">
              <span>Program: Main_Sequence</span>
              <span className="timecode">00:14:32:18</span>
            </div>

            <div className="monitor-viewport">
              <div className={`video-scene mode-${activeMode}`}>
                {activeMode === "autocut" && (
                  <div className="scene-speaker-wrap">
                    <div className="speaker-avatar-frame host-frame">
                      <div className="speaker-silhouette">
                        <div className="host-head" />
                        <div className="host-body" />
                      </div>
                      <span className="speaker-tag">Host Mic (A1)</span>
                    </div>
                    {cutApplied ? (
                      <div className="cut-tag-badge">
                        <Scissors size={13} /> 54 khoảng lặng đã cắt bỏ (23s)
                      </div>
                    ) : (
                      <div className="silence-detected-badge">
                        <Activity size={13} /> Đang quét dải sóng âm...
                      </div>
                    )}
                  </div>
                )}

                {activeMode === "podcast" && (
                  <div className="scene-multicam-wrap">
                    <div className="multicam-view cam-a is-talking">
                      <div className="cam-badge">Cam A (Host) · ACTIVE TALKER</div>
                      <div className="speaker-silhouette mini">
                        <div className="host-head" />
                        <div className="host-body" />
                      </div>
                    </div>
                    <div className="multicam-view cam-b">
                      <div className="cam-badge">Cam B (Guest)</div>
                      <div className="speaker-silhouette mini guest">
                        <div className="host-head" />
                        <div className="host-body" />
                      </div>
                    </div>
                  </div>
                )}

                {activeMode === "transcripts" && (
                  <div className="scene-transcript-wrap">
                    <div className="speaker-silhouette">
                      <div className="host-head" />
                      <div className="host-body" />
                    </div>
                    <div className="live-caption-bubble">
                      <span>AiO Studio tự động chuyển </span>
                      <span className="highlight-word">60 phút audio </span>
                      <span>thành phụ đề trong </span>
                      <span className="highlight-word orange">14 giây.</span>
                    </div>
                  </div>
                )}

                {activeMode === "reframe" && (
                  <div className="scene-reframe-wrap">
                    <div className="horizontal-bg">
                      <div className="speaker-silhouette">
                        <div className="host-head" />
                        <div className="host-body" />
                      </div>
                    </div>
                    <div className="vertical-frame-guide">
                      <span className="aspect-label">9:16 Auto-Tracking</span>
                      <div className="safe-zone-box">
                        <small>TikTok Safe Zone</small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio VU Meters */}
                <div className="audio-vu-meter">
                  <div className="vu-bar left">
                    <i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                  </div>
                  <div className="vu-bar right">
                    <i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AiO Studio Native Panel (Docked in Premiere) */}
          <div className="nle-aio-dock">
            <div className="dock-header">
              <AiOLogo size={16} />
              <strong>AiO Studio</strong>
              <span className="dock-pill">Native Panel</span>
            </div>

            <div className="dock-body">
              {activeMode === "autocut" && (
                <div className="dock-controls">
                  <div className="dock-control-row">
                    <span>Ngưỡng âm (Threshold)</span>
                    <strong>-34 dB</strong>
                  </div>
                  <div className="dock-slider-mock">
                    <div className="slider-fill" style={{ width: "65%" }} />
                    <div className="slider-thumb" style={{ left: "65%" }} />
                  </div>

                  <div className="dock-control-row">
                    <span>Lặng tối thiểu</span>
                    <strong>0.30s</strong>
                  </div>
                  <div className="dock-slider-mock">
                    <div className="slider-fill" style={{ width: "40%" }} />
                    <div className="slider-thumb" style={{ left: "40%" }} />
                  </div>

                  <button
                    type="button"
                    className={`dock-action-btn ${cutApplied ? "applied" : ""}`}
                    onClick={() => setCutApplied(!cutApplied)}
                  >
                    <Scissors size={14} />
                    <span>{cutApplied ? "Đã Cắt Dồn (Undo 1-Click)" : "Cắt Dồn Ripple Delete (1-Click)"}</span>
                  </button>
                </div>
              )}

              {activeMode === "podcast" && (
                <div className="dock-controls">
                  <div className="dock-control-row">
                    <span>Chế độ Multicam</span>
                    <strong>AI Live Director</strong>
                  </div>
                  <div className="dock-control-row">
                    <span>Chống trôi Lip-Sync</span>
                    <strong style={{ color: "var(--green)" }}>0.00ms Drift</strong>
                  </div>
                  <div className="dock-control-row">
                    <span>Reaction Shots</span>
                    <strong>25%</strong>
                  </div>
                  <button type="button" className="dock-action-btn applied">
                    <Video size={14} />
                    <span>Tự Động Chuyển Góc Cam</span>
                  </button>
                </div>
              )}

              {activeMode === "transcripts" && (
                <div className="dock-controls">
                  <div className="dock-control-row">
                    <span>Thuật toán AI</span>
                    <strong>Offline Engine v2.4</strong>
                  </div>
                  <div className="dock-control-row">
                    <span>Tốc độ xử lý</span>
                    <strong style={{ color: "var(--green)" }}>14s / 60 phút</strong>
                  </div>
                  <div className="dock-control-row">
                    <span>Định dạng xuất</span>
                    <strong>Native .SRT / Pr Captions</strong>
                  </div>
                  <button type="button" className="dock-action-btn applied">
                    <Captions size={14} />
                    <span>Tạo Phụ Đề Tức Thì</span>
                  </button>
                </div>
              )}

              {activeMode === "reframe" && (
                <div className="dock-controls">
                  <div className="dock-control-row">
                    <span>Mục tiêu xuất</span>
                    <strong>9:16 TikTok / Reels</strong>
                  </div>
                  <div className="dock-control-row">
                    <span>Subject Tracking</span>
                    <strong style={{ color: "var(--green)" }}>Bám chủ thể AI</strong>
                  </div>
                  <div className="dock-control-row">
                    <span>Safe Zone Overlays</span>
                    <strong>Tự động 0.2s</strong>
                  </div>
                  <button type="button" className="dock-action-btn applied">
                    <MonitorPlay size={14} />
                    <span>Tạo Sequence 9:16 Tự Động</span>
                  </button>
                </div>
              )}

              <div className="dock-footer-metric">
                <ShieldCheck size={13} color="var(--green)" />
                <small>100% Local GPU · Bảo mật dữ liệu</small>
              </div>
            </div>
          </div>
        </div>

        {/* NLE Multi-Track Timeline */}
        <div className="nle-timeline-area">
          {/* Timeline Header & Time Ruler */}
          <div className="timeline-ruler">
            <div className="ruler-track-labels">TRACKS</div>
            <div className="ruler-marks">
              <span>00:00:00</span>
              <span>00:05:00</span>
              <span>00:10:00</span>
              <span>00:15:00</span>
              <span>00:20:00</span>
              <span>00:25:00</span>
            </div>
          </div>

          {/* Timeline Tracks Grid */}
          <div className="timeline-tracks-body">
            {/* Playhead */}
            <div className="timeline-playhead-line" />

            {/* Track V2 */}
            <div className="nle-track-row">
              <span className="track-id">V2</span>
              <div className="track-content">
                <div className="track-block block-graphics" style={{ width: "26%", left: "10%" }}>
                  <Layers size={11} /> <span>B-Roll_Drone_04.mp4</span>
                </div>
                <div className="track-block block-graphics" style={{ width: "24%", left: "60%" }}>
                  <Layers size={11} /> <span>Social_Title_Preset</span>
                </div>
              </div>
            </div>

            {/* Track V1 */}
            <div className="nle-track-row">
              <span className="track-id">V1</span>
              <div className="track-content">
                <div className="track-block block-video" style={{ width: "24%", left: "0%" }}>
                  <Video size={11} /> <span>CamA_Host_4K</span>
                </div>
                <div className="track-block block-video alt" style={{ width: "28%", left: "25%" }}>
                  <Video size={11} /> <span>CamB_Guest_4K</span>
                </div>
                <div className="track-block block-video" style={{ width: "45%", left: "54%" }}>
                  <Video size={11} /> <span>CamA_Host_4K</span>
                </div>
              </div>
            </div>

            {/* Track A1 */}
            <div className="nle-track-row track-audio">
              <span className="track-id">A1</span>
              <div className="track-content waveform-track">
                <div className="waveform-clip host-audio">
                  <span className="clip-label">Mic_Host_Clean.wav</span>
                  <div className="waveform-bars">
                    {[40, 75, 90, 60, 85, 30, 95, 100, 70, 45, 80, 90, 60, 20, 10, 5, 0, 0, 0, 5, 10, 40, 85, 95, 70, 85, 60, 90, 75, 40, 0, 0, 0, 0, 15, 60, 85, 90, 70, 50, 80, 95, 60, 30, 0, 0, 10, 70, 85, 95, 60, 40, 80].map((h, i) => (
                      <i
                        key={i}
                        className={h <= 10 ? "is-silence" : "is-active-voice"}
                        style={{ height: `${Math.max(4, h)}%` }}
                      />
                    ))}
                  </div>
                  {!cutApplied && <span className="silence-overlay-indicator" />}
                </div>
              </div>
            </div>

            {/* Track A2 */}
            <div className="nle-track-row track-audio">
              <span className="track-id">A2</span>
              <div className="track-content waveform-track">
                <div className="waveform-clip guest-audio">
                  <span className="clip-label">Mic_Guest_Clean.wav</span>
                  <div className="waveform-bars">
                    {[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 30, 70, 90, 95, 80, 60, 85, 90, 70, 30, 0, 0, 0, 10, 60, 85, 95, 90, 75, 50, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 40, 75, 85, 90, 60, 30, 0, 0].map((h, i) => (
                      <i
                        key={i}
                        className={h <= 10 ? "is-silence" : "is-active-voice"}
                        style={{ height: `${Math.max(4, h)}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Bottom Status Ribbon */}
          <div className="timeline-status-ribbon">
            <div className="status-left">
              <Zap size={13} color="var(--orange)" />
              <span>
                {cutApplied
                  ? "✓ Đã loại bỏ 54 khoảng lặng thừa ➔ Timeline dồn gọn (6:29 ➔ 6:12)"
                  : "Đang phân tích dải sóng âm... Nhấn Cắt Dồn để thực thi Ripple Delete"}
              </span>
            </div>
            <div className="status-right">
              <span className="time-savings-tag">Tiết kiệm 80% thời gian</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolVisual({ active, run }: { active: ToolId; run: number }) {
  if (active === "assets") {
    return (
      <div className="tool-animation asset-animation" key={`${active}-${run}`}>
        <div className="animation-stage-title"><span>1</span> Tìm và preview asset trước khi import</div>
        <div className="asset-source">
          <div className="mini-thumb warm"><Film size={18} /><small>Biển.mp4</small></div>
          <div className="mini-thumb cool"><Film size={18} /><small>Núi.mp4</small></div>
          <div className="mini-thumb green"><Music2 size={18} /><small>Nhạc.mp3</small></div>
        </div>
        <div className="animation-arrow"><ArrowRight size={20} /></div>
        <div className="instant-preview">
          <MonitorPlay size={28} />
          <strong>Xem thử ngay</strong>
          <span><Zap size={13} /> Dưới 1 giây</span>
        </div>
        <div className="animation-timeline">
          <b>V1</b><span className="arriving-clip">Biển.mp4</span><i />
        </div>
      </div>
    );
  }

  if (active === "powerbins") {
    return (
      <div className="tool-animation bins-animation" key={`${active}-${run}`}>
        <div className="brand-box">
          <AiOLogo size={28} />
          <strong>Brand Kit</strong>
          <span>Logo · Intro · Nhạc</span>
        </div>
        <div className="sync-lines" aria-hidden="true"><i /><i /><i /></div>
        <div className="project-row">
          {["Product Launch", "Social Reels", "Client Review"].map((name, index) => (
            <div className={`project-card project-${index + 1}`} key={name}>
              <FolderOpen size={21} />
              <strong>{name}</strong>
              <span><Check size={13} /> Đã có Brand Kit</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (active === "autocut") {
    return (
      <div className="tool-animation cut-animation" key={`${active}-${run}`}>
        <div className="long-video">
          <span className="good-part">Cảnh hay</span>
          <span className="quiet-part">Khoảng lặng</span>
          <span className="good-part second">Cảnh hay</span>
          <span className="quiet-part small">Thừa</span>
          <span className="good-part third">Kết</span>
          <Scissors className="smart-scissors" size={25} />
        </div>
        <div className="cut-explain"><WandSparkles size={18} /> AiO bỏ phần trống và giữ phần hay</div>
        <div className="short-video">
          <span>Cảnh hay</span><span>Cảnh hay</span><span>Kết</span>
          <i className="cut-playhead" />
        </div>
      </div>
    );
  }

  return (
    <div className="tool-animation transcript-animation" key={`${active}-${run}`}>
      <div className="speaker-card">
        <span className="person-head" />
        <span className="person-body" />
        <p>Chúng ta cần hoàn thiện bản dựng trước thứ Sáu.</p>
      </div>
      <div className="speech-to-text"><Captions size={22} /><ArrowRight size={18} /></div>
      <div className="caption-screen">
        <Play size={20} fill="currentColor" />
        <span className="caption-line line-one">Chúng ta cần hoàn thiện</span>
        <span className="caption-line line-two">bản dựng trước thứ Sáu.</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("top");
  const [heroRun, setHeroRun] = useState(0);
  const [activeTool, setActiveTool] = useState<ToolId>("assets");
  const [toolRun, setToolRun] = useState(1);
  const [projectsPerMonth, setProjectsPerMonth] = useState(12);
  const [minutesSaved, setMinutesSaved] = useState(45);

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);

      let current = "top";
      const navOffset = 180;
      for (let i = lessons.length - 1; i >= 0; i--) {
        const element = document.getElementById(lessons[i].id);
        if (element) {
          const top = element.getBoundingClientRect().top;
          if (top <= navOffset) {
            current = lessons[i].id;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: "smooth",
      });
    }
  };

  const selectTool = (id: ToolId) => {
    setActiveTool(id);
    setToolRun((value) => value + 1);
  };

  const currentTool = tools.find((tool) => tool.id === activeTool) ?? tools[0];
  const CurrentToolIcon = currentTool.icon;
  const hoursRecovered = Math.round((projectsPerMonth * minutesSaved * 12) / 60);

  return (
    <div className="learning-page" id="top">
      <a className="skip-link" href="#main-content">Đi đến nội dung chính</a>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <LessonRail
        progress={progress}
        active={activeSection}
        onSelectSection={scrollToSection}
      />

      <main id="main-content">
        <section className="hero section-shell">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <Zap size={13} />
              <span>BỘ CÔNG CỤ NATIVE CHO PREMIERE PRO · WINDOWS</span>
            </div>
            {/* [14/08 REDESIGN] CHU KY CUA TRANG: headline tu cat chinh no.
                "3 giờ" bi khoanh do (dung cach panel Autocut danh dau "doan se
                bo") → nhat dao quet → sap lai → "15 phút" mau track xanh don
                vao + chip −92%. San pham tu demo tren chinh cau chao cua no.
                key={heroRun} de nut Replay chay lai ca headline lan simulator. */}
            <h1 className="rz" key={heroRun}>
              Dựng thô{" "}
              <span className="rz-cut rz-chay" aria-hidden="true">
                <s>3 giờ</s>
                <i />
              </span>
              <span className="sr-only">từ 3 giờ</span>
              <span className="rz-new">còn 15 phút.</span>
              <span className="rz-chip">−92%</span>
            </h1>
            <p className="hero-lead">
              Cắt khoảng lặng, chuyển cam theo người nói, phụ đề AI — chạy thẳng trên Timeline Premiere, 100% offline, không giới hạn phút.
            </p>
            <div className="hero-actions">
              <a className="primary-cta cta-free" href="#beta">
                Tải Demo miễn phí — Asset Manager <ArrowRight size={16} />
              </a>
              <button
                type="button"
                className="secondary-cta replay-hero-btn"
                onClick={() => setHeroRun((value) => value + 1)}
              >
                <RotateCcw size={15} /> Xem cắt lại
              </button>
            </div>
            <div className="hero-feature-chips" aria-label="Đặc điểm cốt lõi">
              <span><Check size={14} color="var(--green)" /> 100% Native Timeline</span>
              <span><Check size={14} color="var(--green)" /> 100% Offline GPU</span>
              <span><Check size={14} color="var(--green)" /> Không giới hạn phút</span>
            </div>
          </div>
          <div className="hero-demo">
            <HeroConsoleSimulator run={heroRun} />
          </div>
        </section>

        <section className="confidence-strip" aria-label="Bằng chứng sản phẩm">
          <span><b>∞</b><strong>Asset Không Giới Hạn</strong><small>Quản lý hàng chục nghìn file</small></span>
          <span><b>&lt;1s</b><strong>Preview Tức Thì</strong><small>Xem trước không ngắt nhịp dựng</small></span>
          <span><b>100%</b><strong>Offline Local GPU</strong><small>Bảo mật tuyệt đối source footage</small></span>
        </section>

        {/* PAIN POINTS SECTION - CONNECTED TIMELINE PROCESS LINE FLOW */}
        <section className="basics section-shell" id="basics">
          <div className="section-intro">
            <span className="lesson-number">WORKFLOW PIPELINE</span>
            <div>
              <h2>Quy Trình 4 Bước Dựng Tối Ưu Với AiO Studio</h2>
              <p>Loại bỏ các điểm nghẽn thủ công theo từng giai đoạn làm việc của một video editor.</p>
            </div>
          </div>

          <div className="pipeline-line-flow">
            {/* Background Horizontal Connecting Rail */}
            <div className="pipeline-rail" aria-hidden="true">
              <div className="rail-track-line" />
              <div className="rail-progress-glow" />
            </div>

            {/* 4 Pipeline Connected Steps */}
            <div className="pipeline-steps-grid">
              {/* Step 1 */}
              <div className="pipeline-step-item">
                <div className="step-node-anchor">
                  <span className="step-node-dot">01</span>
                </div>
                <article className="pipeline-card">
                  <div className="pipeline-card-header">
                    <div className="pipeline-icon tone-orange">
                      <FolderOpen size={20} />
                    </div>
                    <div>
                      <span className="pipeline-phase">BƯỚC 01 · CHUẨN BỊ</span>
                      <h3>Tìm & Lục Media</h3>
                    </div>
                  </div>
                  <div className="pipeline-flow-comparison">
                    <div className="flow-row old">
                      <span className="flow-badge old-badge">Cũ</span>
                      <p>Mất 15-30p lục lọi các ổ cứng</p>
                    </div>
                    <div className="flow-arrow-down"><ArrowRight size={13} /></div>
                    <div className="flow-row aio">
                      <span className="flow-badge aio-badge">AiO</span>
                      <p>Preview sóng âm &lt;1s & kéo thả</p>
                    </div>
                  </div>
                </article>
              </div>

              {/* Step 2 */}
              <div className="pipeline-step-item">
                <div className="step-node-anchor">
                  <span className="step-node-dot">02</span>
                </div>
                <article className="pipeline-card">
                  <div className="pipeline-card-header">
                    <div className="pipeline-icon tone-blue">
                      <Box size={20} />
                    </div>
                    <div>
                      <span className="pipeline-phase">BƯỚC 02 · KHỞI TẠO</span>
                      <h3>Brand Kit & Logo</h3>
                    </div>
                  </div>
                  <div className="pipeline-flow-comparison">
                    <div className="flow-row old">
                      <span className="flow-badge old-badge">Cũ</span>
                      <p>Import lại logo & intro thủ công</p>
                    </div>
                    <div className="flow-arrow-down"><ArrowRight size={13} /></div>
                    <div className="flow-row aio">
                      <span className="flow-badge aio-badge">AiO</span>
                      <p>Power Bins có sẵn 100% tự động</p>
                    </div>
                  </div>
                </article>
              </div>

              {/* Step 3 */}
              <div className="pipeline-step-item">
                <div className="step-node-anchor">
                  <span className="step-node-dot active">03</span>
                </div>
                <article className="pipeline-card is-highlight">
                  <div className="pipeline-card-header">
                    <div className="pipeline-icon tone-purple">
                      <Scissors size={20} />
                    </div>
                    <div>
                      <span className="pipeline-phase">BƯỚC 03 · DỰNG THÔ</span>
                      <h3>Cắt Khoảng Lặng</h3>
                    </div>
                  </div>
                  <div className="pipeline-flow-comparison">
                    <div className="flow-row old">
                      <span className="flow-badge old-badge">Cũ</span>
                      <p>Ngồi dò & cắt từng khoảng trống (3h)</p>
                    </div>
                    <div className="flow-arrow-down"><ArrowRight size={13} /></div>
                    <div className="flow-row aio">
                      <span className="flow-badge aio-badge">AiO</span>
                      <p>1-Click Ripple Delete tự động</p>
                    </div>
                  </div>
                </article>
              </div>

              {/* Step 4 */}
              <div className="pipeline-step-item">
                <div className="step-node-anchor">
                  <span className="step-node-dot">04</span>
                </div>
                <article className="pipeline-card">
                  <div className="pipeline-card-header">
                    <div className="pipeline-icon tone-green">
                      <Captions size={20} />
                    </div>
                    <div>
                      <span className="pipeline-phase">BƯỚC 04 · XUẤT BẢN</span>
                      <h3>Tạo Phụ Đề & Social</h3>
                    </div>
                  </div>
                  <div className="pipeline-flow-comparison">
                    <div className="flow-row old">
                      <span className="flow-badge old-badge">Cũ</span>
                      <p>Nghe & gõ tay từng câu thoại</p>
                    </div>
                    <div className="flow-arrow-down"><ArrowRight size={13} /></div>
                    <div className="flow-row aio">
                      <span className="flow-badge aio-badge">AiO</span>
                      <p>AI Speech-to-Text — 60 phút còn 2,4 phút</p>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* 8 NATIVE TOOLS - REAL UI SCREENSHOT SHOWCASE */}
        <section className="lab" id="lab">
          <div className="section-shell">
            <div className="section-intro lab-intro">
              <span className="lesson-number">8 NATIVE PANELS</span>
              <div>
                <h2>Hệ Sinh Thái 8 Công Cụ Native Cho Premiere Pro</h2>
                <p>Khám phá giao diện thực tế và tính năng đột phá của từng công cụ trong Suite.</p>
              </div>
            </div>

            {/* Sleek Tool Dock Switcher (Clean, no text truncation) */}
            <div className="studio-dock-bar" role="tablist" aria-label="Chọn công cụ AiO Studio">
              {tools.map(({ id, name, icon: Icon, color }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTool === id}
                  className={`dock-tool-btn tone-${color}${activeTool === id ? " is-active" : ""}`}
                  onClick={() => selectTool(id)}
                >
                  <Icon size={16} />
                  <span>{name}</span>
                </button>
              ))}
            </div>

            {/* Studio Spotlight Console Frame */}
            <div className={`studio-spotlight-console tone-${currentTool.color}`}>
              <div className="spotlight-topbar">
                <div className="spotlight-dots">
                  <span className="dot dot-close" />
                  <span className="dot dot-min" />
                  <span className="dot dot-max" />
                </div>
                <strong className="spotlight-title">
                  AiO Studio Native Panel — {currentTool.name}
                </strong>
                <span className="spotlight-engine-status">
                  <span className="pulse-dot" /> 100% Offline GPU
                </span>
              </div>

              <div className="spotlight-body-grid">
                {/* Left Side: Punchy Details & Highlights */}
                <div className="spotlight-info-panel">
                  <div className="spotlight-category-row">
                    <span className="spotlight-cat-tag">{currentTool.category}</span>
                    <span className="spotlight-speed-badge"><Zap size={13} /> {currentTool.speed}</span>
                  </div>
                  <h3>{currentTool.headline}</h3>
                  <span className="spotlight-highlight-tag">{currentTool.tag}</span>

                  <ul className="spotlight-perks">
                    {currentTool.bullets.map((bullet) => (
                      <li key={bullet}>
                        <Check size={16} color="var(--green)" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="spotlight-actions">
                    {/* [16/08] Bo fontSize 14px inline — no de mat 19px cua .primary-cta
                        (19px la dieu kien de trang/cam dat chuan tuong phan) */}
                    <a className="primary-cta" href="#pricing" style={{ minHeight: "44px" }}>
                      Mở Khóa Cả 8 Tool — $17/tháng <ArrowRight size={16} />
                    </a>
                  </div>
                </div>

                {/* Right Side: Real UI Panel Display */}
                <div className="spotlight-visual-panel">
                  <div className="spotlight-image-container">
                    <img
                      src={currentTool.image}
                      alt={`Giao diện thực tế ${currentTool.name}`}
                      className="spotlight-ui-img"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON SECTION - 3 STREAMLINED VISUAL CARDS */}
        <section className="comparison-section section-shell" id="comparison" style={{ marginTop: "90px" }}>
          <div className="section-intro">
            <span className="lesson-number">SO SÁNH</span>
            <div>
              <h2>Tại Sao Editor Chuyên Nghiệp Chọn AiO Studio?</h2>
              <p>Khác biệt hoàn toàn so với giải pháp Web SaaS và các plugin đơn lẻ trên thị trường.</p>
            </div>
          </div>

          <div className="comparison-cards-grid">
            {/* Card 1: Web SaaS */}
            <div className="comp-card card-saas">
              <div className="comp-card-header">
                <small>WEB SAAS</small>
                <h3>Submagic / CapCut Web</h3>
                <span className="comp-price">$20 – $50 <span>/ tháng</span></span>
              </div>
              <ul className="comp-list">
                <li className="bad"><X size={15} /> Bắt buộc upload video GBs lên web</li>
                <li className="bad"><X size={15} /> Giới hạn credit & số phút audio</li>
                <li className="bad"><X size={15} /> Nguy cơ rò rỉ source của khách hàng</li>
                <li className="bad"><X size={15} /> Chỉ làm được 1 tính năng phụ đề</li>
                <li className="bad"><X size={15} /> Phải có Internet mới xử lý được</li>
              </ul>
            </div>

            {/* Card 2: Single Plugin */}
            <div className="comp-card card-plugin">
              <div className="comp-card-header">
                <small>PLUGIN ĐƠN LẺ</small>
                <h3>AutoPod.fm</h3>
                <span className="comp-price">$29 <span>/ tháng</span></span>
              </div>
              <ul className="comp-list">
                <li className="good"><Check size={15} /> Plugin Native trên Premiere</li>
                <li className="bad"><X size={15} /> Chỉ có 3 công cụ đơn lẻ</li>
                <li className="bad"><X size={15} /> Không có Brand Kit & Kho Asset</li>
                <li className="bad"><X size={15} /> Không có tính năng phụ đề & Safe Zone</li>
                <li className="bad"><X size={15} /> Đắt hơn 70% so với AiO ($29 vs $17)</li>
              </ul>
            </div>

            {/* Card 3: AiO Studio Suite */}
            <div className="comp-card card-aio is-featured">
              <span className="featured-badge">KHUYÊN DÙNG CHO EDITOR</span>
              <div className="comp-card-header">
                <small>SUITE TOÀN DIỆN</small>
                <h3>AiO Studio Suite</h3>
                <span className="comp-price">$17 <span>/ tháng — đủ cả 8 tool</span></span>
              </div>
              <ul className="comp-list">
                <li className="good"><Check size={15} /> Trọn bộ 8 công cụ Native trong 1 panel</li>
                <li className="good"><Check size={15} /> 100% Offline GPU — 0 rò rỉ dữ liệu</li>
                <li className="good"><Check size={15} /> Xử lý không giới hạn số phút video</li>
                <li className="good"><Check size={15} /> Demo Asset Manager miễn phí — thử trước, trả sau</li>
                <li className="good"><Check size={15} /> Windows 10/11 — cài một file, không cần quyền Admin</li>
              </ul>
              <a className="primary-cta comp-cta" href="#pricing">
                Xem Bảng Giá Ưu Đãi <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* [16/08] DEMO MIEN PHI — anh Tien chot 16/08: demo chi con MOT tool
            (Asset Manager); 7 tool con lai nam trong goi Pro $17/thang.
            (Phu dinh quyet dinh 13/08 "3 tool free".)
            Dung nguyen class cua pricing (price-card / plan-perks / primary-cta)
            de dong bo giao dien. CTA mailto la duong nhan don DUY NHAT dang co
            that — co form/backend roi thi thay. */}
        <section className="pricing-section section-shell" id="beta" style={{ marginTop: "90px" }}>
          <div className="section-intro">
            <span className="lesson-number">DEMO MIỄN PHÍ</span>
            <div>
              <h2>Dùng Thử Miễn Phí Asset Manager — Bản Windows</h2>
              <p>Cài một file duy nhất, không cần quyền Admin. Windows 10/11 · Premiere Pro.</p>
            </div>
          </div>

          <div className="pricing-cards-grid one-plan">
            <div className="price-card">
              <span className="plan-label">Asset Manager</span>
              <p className="plan-desc">Kho asset ngay trong Premiere — tìm, nghe thử, kéo thả.</p>
              <ul className="plan-perks">
                <li><Check size={16} color="var(--green)" /> 28.000+ asset, preview &lt;1s</li>
                <li><Check size={16} color="var(--green)" /> Kéo thả thẳng vào timeline</li>
                <li><Check size={16} color="var(--green)" /> Mục &quot;Dùng gần đây&quot; tự ghi nhớ</li>
              </ul>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "28px" }}>
            <a
              className="primary-cta"
              href="mailto:dreamtalentmarketing@gmail.com?subject=AiO%20Studio%20Demo%20-%20Xin%20link%20tai&body=May%20minh%20la%20Windows%2010%2F11%2C%20Premiere%20Pro%20phien%20ban%3A%20"
            >
              Nhận Link Tải Demo Qua Email <ArrowRight size={16} />
            </a>
            <p style={{ marginTop: "10px", fontSize: "13px", opacity: 0.7 }}>
              Song ngữ Việt/Anh · 100% offline · Miễn phí mãi, không cần thẻ tín dụng
            </p>
          </div>
        </section>

        {/* PRICING SECTION - CLEAN HIGH-CONTRAST */}
        <section className="pricing-section section-shell" id="pricing" style={{ marginTop: "90px" }}>
          <div className="section-intro">
            <span className="lesson-number">BẢNG GIÁ</span>
            <div>
              <h2>Bắt Đầu Miễn Phí. Nâng Cấp Khi Cần Cả Bộ.</h2>
              <p>Hai gói duy nhất — không phí ẩn, hủy bất kỳ lúc nào.</p>
            </div>
          </div>

          {/* [16/08] Bang gia moi anh Tien chot: 2 goi (Demo free + Pro $17/thang).
              BO han goi mua-mot-lan va goi nam — anh noi chua san sang ban kieu do.
              Danh sach chuoi cam quay lai nam trong tests/rendered-html.test.mjs. */}
          <div className="pricing-cards-grid two-plans">
            <div className="price-card">
              <span className="plan-label">Demo Pass</span>
              <div className="price-tag">$0 <small>miễn phí mãi</small></div>
              <p className="plan-desc">Asset Manager đầy đủ — dùng không giới hạn thời gian.</p>
              <ul className="plan-perks">
                <li><Check size={16} color="var(--green)" /> Asset Manager đầy đủ tính năng</li>
                <li><Check size={16} color="var(--green)" /> 28.000+ asset, preview &lt;1s</li>
                <li><Check size={16} color="var(--green)" /> Không cần thẻ tín dụng</li>
              </ul>
              <a className="secondary-cta plan-btn" href="#beta">Tải Demo Miễn Phí</a>
            </div>

            <div className="price-card is-popular">
              <span className="popular-pill">RẺ HƠN AUTOPOD 41%</span>
              <span className="plan-label" style={{ color: "var(--orange-light)" }}>Pro Pass</span>
              <div className="price-tag">$17 <small>/ tháng</small></div>
              <p className="plan-desc">Mở khóa cả 8 tool — xử lý không giới hạn số phút.</p>
              <ul className="plan-perks">
                <li><Check size={16} color="var(--green)" /> Trọn bộ 8 Native Panels</li>
                <li><Check size={16} color="var(--green)" /> Không giới hạn số phút video</li>
                <li><Check size={16} color="var(--green)" /> 100% Offline Data Privacy</li>
                <li><Check size={16} color="var(--green)" /> 1 Workstation Device</li>
                <li><Check size={16} color="var(--green)" /> Hủy bất kỳ lúc nào</li>
              </ul>
              {/* [14/08] Chua co cong thanh toan — mailto la duong VE DON that duy nhat.
                  Co checkout roi thi thay href, dung de nut chet. */}
              <a className="primary-cta plan-btn" href="mailto:dreamtalentmarketing@gmail.com?subject=AiO%20Studio%20-%20Goi%20Pro%20%2417%2Fthang">
                Đăng Ký Gói Pro — $17/tháng <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>

        {/* ROI VALUE CALCULATOR - STREAMLINED */}
        <section className="journey section-shell" id="journey" style={{ marginTop: "90px" }}>
          <div className="section-intro">
            <span className="lesson-number">TÍNH TOÁN ROI</span>
            <div>
              <h2>Bạn Thu Hồi Bao Nhiêu Thời Gian Mỗi Năm?</h2>
              <p>Kéo thanh trượt để tính số giờ lao động thủ công được giải phóng.</p>
            </div>
          </div>

          <div className="roi-calculator">
            <div className="roi-controls">
              <label>
                <span><b>Số Project Dựng Mỗi Tháng</b><output>{projectsPerMonth} projects</output></span>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={projectsPerMonth}
                  onChange={(event) => setProjectsPerMonth(Number(event.target.value))}
                />
              </label>
              <label>
                <span><b>Số Phút Tiết Kiệm Mỗi Project</b><output>{minutesSaved} phút</output></span>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={minutesSaved}
                  onChange={(event) => setMinutesSaved(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="roi-result" aria-live="polite">
              <small>THỜI GIAN THU HỒI MỖI NĂM</small>
              <strong>{hoursRecovered}<span> giờ</span></strong>
              <p>Tương đương <b>{Math.max(1, Math.round(hoursRecovered / 8))} ngày làm việc trọn vẹn</b> để nhận thêm dự án hoặc nghỉ ngơi.</p>
              <a href="#pricing">Dùng Đủ 8 Tool — $17/tháng <ArrowRight size={16} /></a>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="final-cta section-shell">
          <div>
            <span className="eyebrow"><Sparkles size={15} /> AiO Studio Workflow Suite</span>
            <h2>Dừng Cắt Khoảng Lặng Thủ Công. Bắt Đầu Sáng Tạo.</h2>
            <p>Trọn bộ 8 panel native bên cạnh Timeline. Bắt đầu miễn phí với Asset Manager — nâng cấp khi sẵn sàng.</p>
          </div>
          <a className="primary-cta" href="#pricing">Xem Bảng Giá — Từ $0 <ArrowRight size={17} /></a>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <a className="brand" href="#top"><AiOLogo size={24} /><span>AiO Studio</span></a>
        <p>Hệ sinh thái công cụ dựng phim chuyên nghiệp cho Premiere Pro & DaVinci Resolve.</p>
        <span>Auto Cut · Auto Podcast · Auto Transcripts · Auto Re-Frames · Asset Manager · Power Bins · Guide Frame · Cut Short</span>
      </footer>
    </div>
  );
}
