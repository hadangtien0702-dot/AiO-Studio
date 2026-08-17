"use client";
/* [17/08] LY DO DUY NHAT co "use client" trong du an: anh Tien yeu cau
   "nguoi dung bam vao xem se tuong tac duoc voi cac tinh nang". Trang chinh
   (page.tsx) van la server component 0 JS — chi RIENG section nay tai JS
   (island). Moi demo la mot mo phong bam-thu-duoc cua tinh nang that,
   khong goi mang, khong thu vien ngoai. */
import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { PLUGINS, type PluginId } from "./plugins";

/* ── Demo 1: Auto Cut — PANEL THAT canh TIMELINE (y anh Tien 17/08, lay
   tu cach doi thu lam demo nhung KHONG copy bo cuc/chu cua ho):
   trai = panel AiO Auto Cut voi thong so chinh duoc that (so mac dinh la
   so that cua panel: nguong am -34dB, lang toi thieu 0,30s), keo slider
   la thay truoc "se cat may khoang" (nhan tham so noi HAU QUA), bam nut
   la khoang lang tren timeline ben phai chay do roi don lai. ─────────── */
const CAC_LANG = [0.25, 0.45, 0.9]; // do dai 3 khoang lang (giay) tren timeline demo

function DemoAutoCut() {
  const [nguong, setNguong] = useState(0.3);
  const [daCat, setDaCat] = useState(false);
  const seCat = CAC_LANG.filter((l) => l >= nguong);
  const giayDon = seCat.reduce((s, l) => s + l, 0);
  return (
    <div className="lab2">
      <div className="lab2-panel">
        <div className="lab2-panel-dau">
          <img src="/AiO Logo Mark.png" alt="" width={14} height={13} aria-hidden="true" />
          <strong>Auto Cut</strong>
          <i className="cham-xanh" aria-hidden="true" />
        </div>
        <div className="lab2-thongso">
          <span>Ngưỡng âm</span>
          <b>−34 dB</b>
        </div>
        <label className="lab2-truot">
          <span className="lab2-thongso"><span>Lặng tối thiểu</span><b>{nguong.toFixed(2).replace(".", ",")}s</b></span>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={nguong}
            onChange={(e) => { setNguong(Number(e.target.value)); setDaCat(false); }}
          />
        </label>
        <p className="lab2-hau-qua">
          {seCat.length
            ? `Sẽ cắt ${seCat.length} khoảng lặng — gọn ${giayDon.toFixed(2).replace(".", ",")} giây`
            : "Ngưỡng cao quá — không khoảng nào bị cắt"}
        </p>
        {daCat ? (
          <button type="button" className="lab-nut-phu" onClick={() => setDaCat(false)}>
            <RotateCcw size={13} /> Làm lại
          </button>
        ) : (
          <button type="button" className="lab-nut" onClick={() => setDaCat(true)} disabled={!seCat.length}>
            Cắt khoảng lặng
          </button>
        )}
      </div>

      <div className="lab2-timeline" aria-hidden="true">
        <div className="lab2-track">
          <i className="clip" style={{ flex: "3 1 0" }} />
          {CAC_LANG.map((dai, i) => (
            <span key={i} style={{ display: "contents" }}>
              <i
                className={`lang ${daCat && dai >= nguong ? "bi-cat" : ""} ${!daCat && dai >= nguong ? "sap-cat" : ""}`}
                style={{ flexBasis: `${dai * 90}px` }}
              />
              <i className="clip" style={{ flex: `${2 + i} 1 0` }} />
            </span>
          ))}
        </div>
        <p className="lab-ket-qua">
          {daCat
            ? `✓ Đã cắt ${seCat.length} khoảng lặng — timeline gọn hơn ${giayDon.toFixed(2).replace(".", ",")} giây`
            : "vệt sáng cam = khoảng sẽ bị cắt với ngưỡng hiện tại"}
        </p>
      </div>
    </div>
  );
}

/* ── Demo 2: Auto Podcast — bam xem ai noi, cam do len hinh ───────────── */
function DemoPodcast() {
  const [nguoi, setNguoi] = useState<"a" | "b">("a");
  return (
    <div className="lab-demo">
      <div className="lab-cams" aria-hidden="true">
        <div className={`lab-cam ${nguoi === "a" ? "live" : ""}`}><span>Cam A — Host</span>{nguoi === "a" && <b>LIVE</b>}</div>
        <div className={`lab-cam ${nguoi === "b" ? "live" : ""}`}><span>Cam B — Khách</span>{nguoi === "b" && <b>LIVE</b>}</div>
      </div>
      <div className="lab-hang-nut">
        <span className="lab-nhan">Ai đang nói?</span>
        <button type="button" className={`lab-nut-phu ${nguoi === "a" ? "chon" : ""}`} onClick={() => setNguoi("a")}>Host</button>
        <button type="button" className={`lab-nut-phu ${nguoi === "b" ? "chon" : ""}`} onClick={() => setNguoi("b")}>Khách</button>
        <span className="lab-ket-qua">→ panel tự bật đúng cam</span>
      </div>
    </div>
  );
}

/* ── Demo 3: Transcripts — 1 cham, phu de hien ra ─────────────────────── */
function DemoTranscripts() {
  const [chay, setChay] = useState(false);
  const DONG = ["Chào mừng tới AiO Studio.", "Phụ đề tạo ngay trên máy bạn.", "Không cần mạng, không giới hạn phút."];
  return (
    <div className="lab-demo">
      <div className="lab-captions">
        {chay
          ? DONG.map((d, i) => (
              <p key={d} style={{ animationDelay: `${i * 0.45}s` }}>
                <span className="lab-tc">00:0{i * 2}</span> {d}
              </p>
            ))
          : <p className="lab-mo">Bấm nút — phụ đề hiện ra như trong panel.</p>}
      </div>
      <div className="lab-hang-nut">
        <button type="button" className="lab-nut" onClick={() => setChay(!chay)}>
          {chay ? "Làm lại" : "1 chạm tạo phụ đề"}
        </button>
      </div>
    </div>
  );
}

/* ── Demo 4: Re-Frames — keo ngang thanh doc, chu the giu giua ────────── */
function DemoReframes() {
  const [doc, setDoc] = useState(false);
  return (
    <div className="lab-demo">
      <div className="lab-reframe-san" aria-hidden="true">
        <div className={`lab-khung ${doc ? "doc" : ""}`}>
          <i className="chu-the" />
        </div>
      </div>
      <div className="lab-hang-nut">
        <button type="button" className="lab-nut" onClick={() => setDoc(!doc)}>
          {doc ? "Về bản ngang 16:9" : "Đổi sang dọc 9:16"}
        </button>
        {doc && <span className="lab-ket-qua">✓ chủ thể vẫn giữa khung</span>}
      </div>
    </div>
  );
}

/* ── Demo 5: Asset Manager — go de loc kho ngay lap tuc ───────────────── */
function DemoAssets() {
  const [tim, setTim] = useState("");
  const KHO = ["intro_logo.mp4", "nhac_nen_chill.wav", "drone_bien.mp4", "logo_animation.mov", "tieng_vo_tay.wav", "b-roll_quan_cafe.mp4", "outro_kenh.mp4", "hieu_ung_whoosh.wav"];
  const thay = KHO.filter((t) => t.toLowerCase().includes(tim.toLowerCase()));
  return (
    <div className="lab-demo">
      <label className="lab-tim">
        <span>Tìm trong kho</span>
        <input value={tim} onChange={(e) => setTim(e.target.value)} placeholder="thử gõ: logo, nhạc, drone…" />
      </label>
      <div className="lab-kho">
        {thay.length ? thay.map((t) => <span key={t} className={/\.wav$/.test(t) ? "am" : ""}>{t}</span>) : <span className="lab-mo">Không thấy — thử từ khác</span>}
      </div>
      <p className="lab-ket-qua">{thay.length}/8 file mẫu · bản thật lọc 28.000+ file nhanh y vậy</p>
    </div>
  );
}

/* ── Demo 6: Power Bins — doi project, khay brand van con ─────────────── */
function DemoPowerBins() {
  const [du, setDu] = useState<"a" | "b">("a");
  return (
    <div className="lab-demo">
      <div className="lab-hang-nut">
        <span className="lab-nhan">Mở project</span>
        <button type="button" className={`lab-nut-phu ${du === "a" ? "chon" : ""}`} onClick={() => setDu("a")}>Video cưới</button>
        <button type="button" className={`lab-nut-phu ${du === "b" ? "chon" : ""}`} onClick={() => setDu("b")}>TVC cà phê</button>
      </div>
      <div className="lab-bins">
        <div className="lab-bin brand">
          <small>POWER BIN — đi theo bạn</small>
          <span>Logo.png</span><span>Intro.mp4</span><span>Nhạc hiệu.wav</span>
        </div>
        <div className="lab-bin">
          <small>Media của project</small>
          {du === "a" ? <><span>Le_don_dau.mp4</span><span>Trao_nhan.mp4</span></> : <><span>Rot_ca_phe.mp4</span><span>Canh_quan.mp4</span></>}
        </div>
      </div>
      <p className="lab-ket-qua">✓ đổi project — khay brand vẫn nguyên chỗ</p>
    </div>
  );
}

/* ── Demo 7: Guide Frame — chon nen tang, vung che doi theo ───────────── */
function DemoGuideFrame() {
  const [nen, setNen] = useState<"tiktok" | "reels" | "shorts">("tiktok");
  return (
    <div className="lab-demo">
      <div className="lab-hang-nut">
        {(["tiktok", "reels", "shorts"] as const).map((n) => (
          <button key={n} type="button" className={`lab-nut-phu ${nen === n ? "chon" : ""}`} onClick={() => setNen(n)}>
            {n === "tiktok" ? "TikTok" : n === "reels" ? "Reels" : "Shorts"}
          </button>
        ))}
      </div>
      <div className={`lab-safe ${nen}`} aria-hidden="true">
        <i className="vung tren" /><i className="vung phai" /><i className="vung duoi" />
        <span>vùng an toàn cho chữ</span>
      </div>
      <p className="lab-ket-qua">vùng mờ = chỗ avatar/nút của app sẽ che mất chữ</p>
    </div>
  );
}

const DEMOS: Partial<Record<PluginId, () => React.ReactElement>> = {
  autocut: DemoAutoCut,
  podcast: DemoPodcast,
  transcripts: DemoTranscripts,
  reframes: DemoReframes,
  assets: DemoAssets,
  powerbins: DemoPowerBins,
  guideframe: DemoGuideFrame,
};

/* ── [17/08 chieu] BO CUC MOI: THE TAB DOC (anh Tien gui hinh mau) ──────
   Bo danh sach 8 hang mo/dong kieu accordion. Nay: cot trai la 8 the tab
   xep doc, dau phai cua the TUT XUONG DUOI mep bang lon ben phai; the
   dang chon NOI LEN TREN nen nhin nhu cai luoi keo ra khoi ngan ho so.
   Doi accordion -> tab thi ARIA cung phai doi: aria-expanded (dong/mo)
   KHONG con dung nghia, phai la role=tab + aria-selected + tablist, va
   phim mui ten phai chay duoc (test canh dong nay). */
export default function PluginLab() {
  const [mo, setMo] = useState<PluginId>("autocut");
  const chon = PLUGINS.find((p) => p.id === mo) ?? PLUGINS[0];
  const Demo = DEMOS[chon.id];

  /* Tablist chuan: mui ten len/xuong (va trai/phai khi man hep xep ngang),
     Home/End ve dau/cuoi. Chuyen tab xong phai KEO LUON focus theo, khong
     thi nguoi dung ban phim mat dau con tro. */
  function phim(e: React.KeyboardEvent, i: number) {
    const buoc: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let toi = -1;
    if (e.key in buoc) toi = (i + buoc[e.key] + PLUGINS.length) % PLUGINS.length;
    else if (e.key === "Home") toi = 0;
    else if (e.key === "End") toi = PLUGINS.length - 1;
    if (toi < 0) return;
    e.preventDefault();
    setMo(PLUGINS[toi].id);
    document.getElementById(`tab-${PLUGINS[toi].id}`)?.focus();
  }

  return (
    <div className="lab-khoi">
      <div className="lab-tabs" role="tablist" aria-orientation="vertical" aria-label="Tám plugin">
        {PLUGINS.map(({ id, icon: Icon, ten, nhan }, i) => {
          const dangChon = mo === id;
          return (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={dangChon}
              aria-controls={`bang-${id}`}
              tabIndex={dangChon ? 0 : -1}
              className={`lab-tab${dangChon ? " chon" : ""}`}
              onClick={() => setMo(id)}
              onKeyDown={(e) => phim(e, i)}
            >
              <Icon size={17} aria-hidden="true" />
              <span className="lab-tab-ten">{ten}</span>
              {nhan && <span className={nhan === "FREE" ? "free" : "soon"}>{nhan}</span>}
            </button>
          );
        })}
      </div>

      {/* key=id: doi plugin la bang ve lai tu dau (chay lai hieu ung hien) */}
      <div
        key={chon.id}
        className="lab-than"
        id={`bang-${chon.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${chon.id}`}
        tabIndex={0}
      >
        <div className="lab-than-dau">
          <h3>{chon.ten}</h3>
          <span className="so">{chon.so}</span>
          <p>{chon.mota}</p>
        </div>
        {Demo ? <Demo /> : (
          <div className="lab-demo">
            <p className="lab-mo">Đang phát triển — có mặt trong bản cập nhật tới.</p>
          </div>
        )}
      </div>
    </div>
  );
}
