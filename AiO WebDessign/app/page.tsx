"use client";

import {
  ArrowRight,
  Box,
  Captions,
  Check,
  ChevronRight,
  Film,
  FolderOpen,
  Layers3,
  Lightbulb,
  Menu,
  MonitorPlay,
  MousePointer2,
  Music2,
  Play,
  RotateCcw,
  Scissors,
  Sparkles,
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
  { id: "top", label: "Overview", short: "01", width: "20%" },
  { id: "basics", label: "Pain Points", short: "02", width: "20%" },
  { id: "lab", label: "8 Native Tools", short: "03", width: "25%" },
  { id: "comparison", label: "Vs Competitors", short: "04", width: "20%" },
  { id: "pricing", label: "Pricing", short: "05", width: "15%" },
] as const;

const tools = [
  {
    id: "assets" as const,
    name: "Asset Manager",
    category: "Media & Brand",
    childName: "28,000+ Assets at Instant Preview",
    icon: Layers3,
    color: "orange",
    oneLine: "Organize 28,000+ B-rolls, SFX, and music without slowing down your NLE.",
    explanation: "Scans your drives instantly. Preview audio waveform and video in under 1s, then drag directly into your Premiere Pro timeline on empty tracks.",
    steps: ["Scan 28k+ local assets", "Instant <1s Waveform & Video preview", "Drag & Drop directly to active track"],
  },
  {
    id: "powerbins" as const,
    name: "Power Bins",
    category: "Media & Brand",
    childName: "Universal Brand Kit Across Projects",
    icon: Box,
    color: "blue",
    oneLine: "Set up logos, intros, outros & watermarks once. Access them in every new project.",
    explanation: "Power Bins acts as a universal brand vault. When you open a fresh Premiere Pro project, all your brand assets are already standing by.",
    steps: ["Set up Brand Kit once", "Open any new project", "Assets appear automatically without re-importing"],
  },
  {
    id: "autocut" as const,
    name: "Auto Cut",
    category: "Rough Cut & Editing",
    childName: "1-Click Silence & Filler Removal",
    icon: Scissors,
    color: "purple",
    oneLine: "Detect dead air, silences, and filler pauses. Ripple delete in 1 second.",
    explanation: "Eliminates boring rough-cut labor. Automatically analyzes waveform thresholds and performs clean ripple cuts right on your timeline with 1-click undo.",
    steps: ["Analyze audio waveform", "Detect silence thresholds", "Ripple delete & tighten timeline"],
  },
  {
    id: "transcripts" as const,
    name: "Auto Transcripts",
    category: "Captions & AI",
    childName: "60-Min Audio Transcribed in 14s",
    icon: Captions,
    color: "green",
    oneLine: "100% offline speech-to-text with auto-formatted captions for TikTok & Reels.",
    explanation: "Transcribes a 60-minute episode in just 14 seconds. Auto-formats long lines (193 -> 42 chars) to ensure zero overlap and perfect reading pace.",
    steps: ["Fast offline Speech-to-Text", "Auto-wrap lines for social mobile viewing", "Export native .SRT or timeline captions"],
  },
  {
    id: "reframe" as const,
    name: "Auto Re-Frames",
    category: "Framing & Layout",
    childName: "Smart 16:9 to 9:16 Vertical Reframer",
    icon: MonitorPlay,
    color: "yellow",
    oneLine: "Convert horizontal sequence to 9:16 vertical while tracking the subject.",
    explanation: "Powered by deep subject tracking, automatically duplicates horizontal sequences into vertical 9:16 aspect ratio while keeping the speaker centered.",
    steps: ["Select horizontal sequence", "Apply subject tracking", "Generate ready-to-post 9:16 vertical video"],
  },
  {
    id: "podcast" as const,
    name: "Auto Podcast",
    category: "Rough Cut & Editing",
    childName: "Director-Level Multi-Cam Auto Switching",
    icon: WandSparkles,
    color: "orange",
    oneLine: "Auto-switch multi-cam podcast angles based on active speakers without lip-sync drift.",
    explanation: "Analyzes multi-mic audio tracks to switch camera angles like a live director. Handles mixed sample rates (44.1k/48k) with 0 lip-sync drift even on 90+ min shows.",
    steps: ["Assign speaker mics to angles", "AI detects active talkers & reaction shots", "Generates full multicam cuts in seconds"],
  },
  {
    id: "guideframe" as const,
    name: "Guide Frame",
    category: "Framing & Layout",
    childName: "0.2s Safe Zone Overlays for 10 Platforms",
    icon: Sparkles,
    color: "blue",
    oneLine: "Instant safe zone overlays for TikTok, Shorts, Reels, Shopee & composition grids.",
    explanation: "Overlay exact UI safe zones for 10+ social platforms and 53 danger areas in 0.2s. Ensures your titles and captions are never hidden behind avatar buttons.",
    steps: ["Select target social platform", "Overlay UI Safe Zone & Golden Ratio grid in 0.2s", "Clean remove anytime without clutter"],
  },
  {
    id: "cutshort" as const,
    name: "Auto Cut Short",
    category: "Rough Cut & Editing",
    childName: "Extract Viral Short Clips from Long Video",
    icon: Zap,
    color: "purple",
    oneLine: "Identify high-engagement moments in long-form videos & extract 60s shorts.",
    explanation: "Analyzes transcript density and voice emotion to pull viral-ready 60-second highlight clips from hours of raw footage, complete with dynamic captions.",
    steps: ["Scan long-form video transcript", "Rank top hook moments", "Export ready-to-post 60s Shorts"],
  },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function Header({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (open: boolean) => void }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="AiO Studio - Trang chủ">
        <BrandMark />
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

function LessonRail({ progress, active }: { progress: number; active: string }) {
  return (
    <nav className="lesson-rail" aria-label="Các bài học trên trang">
      <div className="lesson-rail-label">
        <Film size={16} />
        <span>AiO Studio · Editor workflow</span>
        <strong>{Math.round(progress * 100)}%</strong>
      </div>
      <div className="lesson-track">
        {lessons.map((lesson) => (
          <a
            key={lesson.id}
            href={`#${lesson.id}`}
            className={active === lesson.id ? "is-active" : ""}
            style={{ width: lesson.width }}
            aria-current={active === lesson.id ? "location" : undefined}
          >
            <small>{lesson.short}</small>
            <span>{lesson.label}</span>
            <Check size={13} />
          </a>
        ))}
        <i className="lesson-playhead" style={{ left: `${progress * 100}%` }} aria-hidden="true" />
      </div>
    </nav>
  );
}

function FirstEditAnimation({ run }: { run: number }) {
  return (
    <div className={run > 0 ? "first-edit is-running" : "first-edit"} key={run} aria-label="Mô phỏng đưa asset từ thư viện vào timeline">
      <div className="editor-topbar">
        <span><i /><i /><i /></span>
        <strong>Product_Launch_01</strong>
        <time>00:00:06</time>
      </div>
      <div className="editor-canvas">
        <div className="media-shelf">
          <span className="ui-label"><FolderOpen size={14} /> Asset Library</span>
          <div className="media-thumb thumb-sky"><Film size={18} /><small>Bầu_trời.mp4</small></div>
          <div className="media-thumb thumb-music"><Music2 size={18} /><small>Nhạc_vui.mp3</small></div>
        </div>
        <div className="preview-screen">
          <span className="sun" />
          <span className="hill hill-one" />
          <span className="hill hill-two" />
          <strong>Render Preview</strong>
          <Play size={22} fill="currentColor" />
        </div>
      </div>
      <div className="teaching-tip">
        <Zap size={16} />
        <span><strong>Không ngắt nhịp:</strong> preview asset trước khi import, rồi kéo thẳng xuống timeline.</span>
      </div>
      <div className="simple-timeline">
        <span className="track-name">V1</span>
        <div className="drop-zone"><small>Kéo asset vào timeline</small></div>
        <span className="track-name">A1</span>
        <div className="audio-zone"><small>Audio track</small></div>
        <i className="demo-playhead" />
      </div>
      <div className="moving-clip"><Film size={15} /> Bầu_trời.mp4</div>
      <MousePointer2 className="demo-cursor" size={24} fill="currentColor" />
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
          <BrandMark />
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
      const threshold = window.innerHeight * 0.48;
      lessons.forEach((lesson) => {
        const element = document.getElementById(lesson.id);
        if (element && element.getBoundingClientRect().top <= threshold) current = lesson.id;
      });
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
      <LessonRail progress={progress} active={activeSection} />

      <main id="main-content">
        <section className="hero section-shell">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={16} /> Workflow suite cho Premiere Pro editor</span>
            <h1>Đừng dùng giờ sáng tạo cho <em>việc lặp lại.</em></h1>
            <p>AiO Studio xử lý khoảng thời gian bị mất giữa media thô và timeline sẵn sàng — để bạn dành năng lượng cho nhịp dựng, câu chuyện và chất lượng cuối.</p>
            <div className="hero-actions">
              <button className="primary-cta" onClick={() => setHeroRun((value) => value + 1)}>
                {heroRun === 0 ? "Xem workflow thực tế" : "Xem lại workflow"}
                {heroRun === 0 ? <Play size={17} fill="currentColor" /> : <RotateCcw size={17} />}
              </button>
              <a className="secondary-cta" href="#journey">Tính thời gian lấy lại <ArrowRight size={17} /></a>
            </div>
            <div className="hero-promise" aria-label="Giá trị nổi bật">
              <span><Check size={16} /> Không giới hạn thư viện asset</span>
              <span><Check size={16} /> Render preview trong tích tắc</span>
              <span><Check size={16} /> Kết quả đưa thẳng vào timeline</span>
            </div>
          </div>
          <div className="hero-demo">
            <div className="demo-caption">
              <span>WORKFLOW PROOF</span>
              <strong>Từ Asset Library đến Premiere timeline</strong>
              <small>Nhấn để xem luồng xử lý</small>
            </div>
            <FirstEditAnimation run={heroRun} />
          </div>
        </section>

        <section className="confidence-strip" aria-label="Bằng chứng sản phẩm">
          <span><b>∞</b><strong>Asset không giới hạn</strong><small>Quản lý hàng chục nghìn file</small></span>
          <span><b>&lt;1s</b><strong>Preview tức thì</strong><small>Xem trước mà không ngắt nhịp dựng</small></span>
          <span><b>1×</b><strong>Thiết lập một lần</strong><small>Brand Kit dùng lại ở mọi project</small></span>
        </section>

        <section className="basics section-shell" id="basics">
          <div className="section-intro">
            <span className="lesson-number">ĐIỂM NGHẼN</span>
            <div>
              <h2>Editor không chậm vì thiếu kỹ năng.</h2>
              <p>Bạn chậm vì những việc nhỏ này lặp lại trong từng project.</p>
            </div>
          </div>
          <div className="concept-grid">
            <article className="concept-card media-concept">
              <span className="concept-icon"><FolderOpen size={28} /></span>
              <small>TRƯỚC KHI DỰNG</small>
              <h3>Tìm media</h3>
              <p>Mở từng thư mục, tìm lại đúng phiên bản và chờ file đủ nhanh để xem.</p>
              <div className="concept-picture media-pieces"><i /><i /><i /></div>
            </article>
            <article className="concept-card timeline-concept">
              <span className="concept-icon"><Film size={28} /></span>
              <small>MỖI PROJECT</small>
              <h3>Import lại Brand Kit</h3>
              <p>Logo, intro và nhạc thương hiệu được lặp lại dù chúng không thay đổi.</p>
              <div className="concept-picture timeline-pieces"><i /><i /><i /><b /></div>
            </article>
            <article className="concept-card cut-concept">
              <span className="concept-icon"><Scissors size={28} /></span>
              <small>DỰNG THÔ</small>
              <h3>Cắt khoảng lặng</h3>
              <p>Thời gian sáng tạo bị dùng cho việc dò và cắt những đoạn trống.</p>
              <div className="concept-picture cut-pieces"><i /><b /><i /></div>
            </article>
            <article className="concept-card export-concept">
              <span className="concept-icon"><MonitorPlay size={28} /></span>
              <small>HOÀN THIỆN</small>
              <h3>Gõ lại lời thoại</h3>
              <p>Nghe, dừng, gõ và căn phụ đề là một chuỗi việc lặp lại rất dài.</p>
              <div className="concept-picture preview-picture"><Play size={22} fill="currentColor" /></div>
            </article>
          </div>
          <div className="remember-rule">
            <Lightbulb size={22} />
            <p><strong>Điểm khác biệt:</strong> AiO Studio không dựng thay bạn. Nó dọn phần việc lặp lại để khi mở timeline, bạn có thể bắt đầu từ quyết định sáng tạo.</p>
          </div>
        </section>

        <section className="lab" id="lab">
          <div className="section-shell">
            <div className="section-intro lab-intro">
              <span className="lesson-number">SOLUTION</span>
              <div>
                <h2>8 Native Tools. Zero Workflow Interruptions.</h2>
                <p>Select any tool to see input, how AiO processes it locally, and what lands on your active timeline.</p>
              </div>
            </div>

            <div className="tool-picker" role="tablist" aria-label="Select AiO Studio tool to view workflow">
              {tools.map(({ id, name, childName, icon: Icon, color }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activeTool === id}
                  className={`tool-tab tone-${color}${activeTool === id ? " is-active" : ""}`}
                  onClick={() => selectTool(id)}
                >
                  <span><Icon size={22} /></span>
                  <div><small>{name}</small><strong>{childName}</strong></div>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>

            <div className={`learning-lab tone-${currentTool.color}`}>
              <div className="lab-copy">
                <span className="tool-badge"><CurrentToolIcon size={19} /> {currentTool.name}</span>
                <h3>{currentTool.childName}</h3>
                <strong>{currentTool.oneLine}</strong>
                <p>{currentTool.explanation}</p>
                <ol>
                  {currentTool.steps.map((step, index) => (
                    <li key={step}><span>{index + 1}</span>{step}</li>
                  ))}
                </ol>
                <button className="replay-button" onClick={() => setToolRun((value) => value + 1)}>
                  <RotateCcw size={17} /> Replay Animation
                </button>
              </div>
              <div className="lab-stage" aria-live="polite">
                <div className="stage-topbar">
                  <span><Play size={12} fill="currentColor" /> Live Workflow Demo</span>
                  <strong>{currentTool.name}</strong>
                </div>
                <ToolVisual active={activeTool} run={toolRun} />
              </div>
            </div>
          </div>
        </section>

        <section className="comparison-section section-shell" id="comparison" style={{ marginTop: "100px" }}>
          <div className="section-intro">
            <span className="lesson-number">WHY AIO STUDIO</span>
            <div>
              <h2>Built for Pros Who Refuse Web Clutter.</h2>
              <p>Compare AiO Studio against subscription web SaaS and single-purpose plugins.</p>
            </div>
          </div>

          <div style={{ overflowX: "auto", marginTop: "32px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--panel)", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--line)" }}>
              <thead>
                <tr style={{ background: "var(--panel-2)", borderBottom: "1px solid var(--line)" }}>
                  <th style={{ padding: "18px 24px", textAlign: "left" }}>Feature / Metric</th>
                  <th style={{ padding: "18px 20px", textAlign: "center" }}>AutoPod.fm</th>
                  <th style={{ padding: "18px 20px", textAlign: "center" }}>Submagic (Web)</th>
                  <th style={{ padding: "18px 20px", textAlign: "center", background: "var(--orange-soft)", color: "var(--orange-light)" }}>AiO Studio Suite</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: "600" }}>Monthly Price</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--dim)" }}>$29 / mo</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--dim)" }}>$20 - $50 / mo</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "bold", color: "var(--green)", background: "rgba(118, 217, 106, 0.05)" }}>$29 / mo</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: "600" }}>Lifetime Pass Option</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "#ff6b6b" }}>✕ None (Subscription only)</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "#ff6b6b" }}>✕ None (Subscription only)</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "bold", color: "var(--orange-light)", background: "rgba(255, 107, 44, 0.08)" }}>✓ $299 One-Time Forever</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: "600" }}>Environment</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>Native Plugin</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>Web Browser (Export & Upload)</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "bold", color: "var(--text)", background: "rgba(255, 255, 255, 0.03)" }}>✓ 100% Native Premiere Panels</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: "600" }}>Privacy & Offline</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>Server Connected</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "#ff6b6b" }}>✕ Cloud Upload Required</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "bold", color: "var(--green)", background: "rgba(118, 217, 106, 0.05)" }}>✓ 100% OFFLINE Local Processing</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "16px 24px", fontWeight: "600" }}>Audio/Video Hours Limit</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>Unlimited</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "#ff6b6b" }}>✕ Strictly Limited Credits</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "bold", color: "var(--green)", background: "rgba(118, 217, 106, 0.05)" }}>✓ UNLIMITED Processing</td>
                </tr>
                <tr>
                  <td style={{ padding: "16px 24px", fontWeight: "600" }}>Number of Tools Included</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>3 Tools</td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>1 Tool</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "bold", color: "var(--yellow)", background: "rgba(255, 209, 102, 0.05)" }}>★ FULL 8-IN-1 SUITE</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="pricing-section section-shell" id="pricing" style={{ marginTop: "100px" }}>
          <div className="section-intro">
            <span className="lesson-number">PREMIUM PRICING</span>
            <div>
              <h2>Crafted with 5 Years of Professional NLE Passion.</h2>
              <p>Choose the plan that fits your studio. Own the entire 8-tool native suite forever or subscribe yearly.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginTop: "40px" }}>
            <div style={{ padding: "32px", background: "var(--panel)", borderRadius: "20px", border: "1px solid var(--line)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dim)", fontWeight: "600" }}>Starter Pass</span>
                <h3 style={{ fontSize: "36px", margin: "16px 0 8px 0" }}>$29 <span style={{ fontSize: "16px", color: "var(--dim)" }}>/ month</span></h3>
                <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "24px" }}>Perfect for trying out the full suite for a single project.</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px", color: "var(--text)", fontSize: "14px" }}>
                  <li><Check size={16} color="var(--green)" style={{ display: "inline", marginRight: "8px" }} /> Access to all 8 Native Panels</li>
                  <li><Check size={16} color="var(--green)" style={{ display: "inline", marginRight: "8px" }} /> 1 Active Workstation Device</li>
                  <li><Check size={16} color="var(--green)" style={{ display: "inline", marginRight: "8px" }} /> 100% Offline Data Privacy</li>
                </ul>
              </div>
              <button className="secondary-cta" style={{ marginTop: "32px", width: "100%", justifyContent: "center" }}>
                Start Monthly Pass
              </button>
            </div>

            <div style={{ padding: "32px", background: "var(--panel-2)", borderRadius: "20px", border: "2px solid var(--orange)", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <span style={{ position: "absolute", top: "-14px", right: "24px", background: "var(--orange)", color: "#fff", padding: "4px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: "bold" }}>POPULAR PRO CHOICE</span>
              <div>
                <span style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--orange-light)", fontWeight: "600" }}>Annual Pro Pass</span>
                <h3 style={{ fontSize: "36px", margin: "16px 0 8px 0" }}>$149 <span style={{ fontSize: "16px", color: "var(--dim)" }}>/ year</span></h3>
                <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "24px" }}>Save 57% compared to monthly. Best for busy video editors.</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px", color: "var(--text)", fontSize: "14px" }}>
                  <li><Check size={16} color="var(--green)" style={{ display: "inline", marginRight: "8px" }} /> Access to all 8 Native Panels</li>
                  <li><Check size={16} color="var(--green)" style={{ display: "inline", marginRight: "8px" }} /> 1 Active Workstation Device</li>
                  <li><Check size={16} color="var(--green)" style={{ display: "inline", marginRight: "8px" }} /> 1 Year of Free Feature Updates</li>
                  <li><Check size={16} color="var(--green)" style={{ display: "inline", marginRight: "8px" }} /> Priority 24/7 VIP Discord Support</li>
                </ul>
              </div>
              <button className="primary-cta" style={{ marginTop: "32px", width: "100%", justifyContent: "center" }}>
                Get Annual Pass <ArrowRight size={17} />
              </button>
            </div>

            <div style={{ padding: "32px", background: "linear-gradient(145deg, var(--panel), var(--orange-soft))", borderRadius: "20px", border: "2px solid var(--yellow)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--yellow)", fontWeight: "600" }}>Lifetime Studio Pass</span>
                <h3 style={{ fontSize: "36px", margin: "16px 0 8px 0" }}>$299 <span style={{ fontSize: "16px", color: "var(--yellow)" }}>one-time</span></h3>
                <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "24px" }}>Pay once, own forever. Zero subscriptions, zero limits.</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px", color: "var(--text)", fontSize: "14px" }}>
                  <li><Check size={16} color="var(--yellow)" style={{ display: "inline", marginRight: "8px" }} /> Full 8-Tool Native Suite Forever</li>
                  <li><Check size={16} color="var(--yellow)" style={{ display: "inline", marginRight: "8px" }} /> 1 Active Workstation Device</li>
                  <li><Check size={16} color="var(--yellow)" style={{ display: "inline", marginRight: "8px" }} /> LIFETIME Free Product Updates</li>
                  <li><Check size={16} color="var(--yellow)" style={{ display: "inline", marginRight: "8px" }} /> 1-on-1 VIP Direct Founder Support</li>
                </ul>
              </div>
              <button className="primary-cta" style={{ marginTop: "32px", width: "100%", justifyContent: "center", background: "var(--yellow)", color: "#000" }}>
                Claim Lifetime Suite Pass <Sparkles size={17} />
              </button>
            </div>
          </div>
        </section>

        <section className="journey section-shell" id="journey" style={{ marginTop: "100px" }}>
          <div className="section-intro">
            <span className="lesson-number">VALUE CALCULATOR</span>
            <div>
              <h2>How Many Hours Are You Losing to Repetitive Clicks?</h2>
              <p>Adjust the sliders to match your editing workload and calculate your annual time recovery.</p>
            </div>
          </div>

          <div className="roi-calculator">
            <div className="roi-controls">
              <div className="roi-heading">
                <span><Zap size={17} /> Estimated Hours Recovered</span>
                <strong>Repetitive Tasks Only</strong>
              </div>
              <label>
                <span><b>Projects Edited Per Month</b><output>{projectsPerMonth} projects</output></span>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={projectsPerMonth}
                  onChange={(event) => setProjectsPerMonth(Number(event.target.value))}
                />
              </label>
              <label>
                <span><b>Minutes Saved Per Project</b><output>{minutesSaved} mins</output></span>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={minutesSaved}
                  onChange={(event) => setMinutesSaved(Number(event.target.value))}
                />
              </label>
              <p>Based on hours spent finding media assets, re-importing brand kits, silence trimming, and transcription.</p>
            </div>
            <div className="roi-result" aria-live="polite">
              <small>ANNUAL TIME RECOVERED</small>
              <strong>{hoursRecovered}<span> hrs</span></strong>
              <p>Equivalent to roughly <b>{Math.max(1, Math.round(hoursRecovered / 8))} full work days</b> dedicated back to storytelling or taking on more clients.</p>
              <a href="#pricing">Claim Your 8-Tool Suite <ArrowRight size={16} /></a>
            </div>
          </div>

          <div className="safe-learning" style={{ marginTop: "40px" }}>
            <div>
              <span className="eyebrow"><Zap size={15} /> 5 Years NLE Experience</span>
              <h2>Built by an Editor. For Editors.</h2>
              <p>AiO Studio was crafted from real post-production battle scars to give you raw editing speed without altering your muscle memory.</p>
            </div>
            <ul>
              <li><Check size={18} /><span><strong>Does not replace Premiere Pro</strong> — edit in the timeline you already love.</span></li>
              <li><Check size={18} /><span><strong>100% Local Privacy</strong> — no cloud uploads, zero client data leaks.</span></li>
              <li><Check size={18} /><span><strong>30-Day Money-Back Guarantee</strong> — 100% risk-free trial for your peace of mind.</span></li>
            </ul>
          </div>
        </section>

        <section className="final-cta section-shell">
          <div>
            <span className="eyebrow"><Sparkles size={15} /> AiO Studio Workflow Suite</span>
            <h2>Stop Editing Silences. Start Creating Stories.</h2>
            <p>Get all 8 native panels inside Premiere Pro. Backed by a 30-day money-back guarantee.</p>
          </div>
          <a className="primary-cta" href="#pricing">Get Lifetime Suite Pass ($299) <ArrowRight size={17} /></a>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <a className="brand" href="#top"><BrandMark /><span>AiO Studio</span></a>
        <p>Professional Workflow Suite for Premiere Pro & DaVinci Editors.</p>
        <span>Asset Manager · Power Bins · Auto Cut · Transcripts · Re-Frames · Auto Podcast · Guide Frame · Cut Short</span>
      </footer>
    </div>
  );
}
