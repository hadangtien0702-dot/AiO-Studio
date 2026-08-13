import { dich } from './ngonngu'
/**
 * DaiSong.tsx — hai dải sóng: TRƯỚC và SAU khi cắt, cùng tỉ lệ.
 *
 * Anh Tiến 2026-07-29: *"khi anh bấm vào các phần này thì sẽ hiện ra timeline
 * được cut để hình dung luôn"*. Nên bấm ba mức là hai dải đổi ngay lập tức —
 * tính lại từ dữ liệu đã đo nên chỉ mất vài mili giây, không phải chạy lại.
 *
 * Trước đó anh đã chỉ thẳng là dòng chữ mô tả mức ("bỏ mọi chỗ im trên 0,2s ·
 * chừa 0,06s…") **người dùng không đọc**. Hình thay chữ.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ĐƯỜNG NGƯỠNG Ở ĐÂY UỐN THEO NỀN ỒN — KHÔNG PHẢI MỘT ĐƯỜNG THẲNG
 * ══════════════════════════════════════════════════════════════════════════
 *
 * AutoCut (đối thủ) vẽ một đường thẳng −35 dB cho cả file. Trên video của anh
 * Tiến cách đó sai chắc chắn: nền ồn dao động **7,9 dB** giữa các phút vì quay
 * nhiều cam. Đo thật 2026-07-28 — một ngưỡng cứng cho cả file làm **321 câu bị
 * cắt mất quá nửa lời**, toàn của người ngồi xa mic.
 *
 * Đường vẽ ở đây là `nenCucBo[i] + bien`, nhấp nhô theo từng đoạn 30 giây.
 * Nhìn cái là hiểu vì sao tool này không cắt mất lời người ngồi xa.
 */
import { useEffect, useRef } from 'react'
import { vungConLai, type MucAm, type Quang } from './services/amluong'

// `uocVungCat` để trong `services/amluong.ts` chứ không để ở file này: nó là
// tính toán thuần, mà `npm run kiem` chỉ biên dịch thư mục services. Để ở đây
// là mất khả năng tự kiểm bằng số — thứ đắt nhất của dự án này.
// Từ 03/08 chính App gọi nó rồi truyền `cat` xuống đây.

const NEN_DAY = -75 // đáy khung vẽ; dưới mức này coi như im hẳn
const NEN_DINH = -5 // đỉnh khung vẽ

const MAU_GIU = '#4ec98a' // --ok
const MAU_YEU = '#2c2c31' // --bg-5
const MAU_NGUONG = '#ff5714' // --accent
const MAU_CAT = 'rgb(255 95 109 / 26%)' // --danger, mờ để còn thấy sóng dưới

/** Vẽ một cột sóng cho khoảng cửa sổ [i0, i1). Trả về true nếu cột đó được giữ. */
function veCot(
  ctx: CanvasRenderingContext2D,
  m: MucAm,
  bien: number,
  i0: number,
  i1: number,
  x: number,
  cao: number,
): void {
  let dinh = -Infinity
  let nenCong = 0
  for (let i = i0; i < i1; i++) {
    if (m.cua[i] > dinh) dinh = m.cua[i]
    nenCong += m.nenCucBo[i]
  }
  const nen = nenCong / (i1 - i0) + bien
  const t = (dinh - NEN_DAY) / (NEN_DINH - NEN_DAY)
  const yTop = cao - Math.max(0, Math.min(1, t)) * cao
  // Nhìn MÀU là biết, khỏi đọc số: xanh = giữ, xám = dưới ngưỡng.
  ctx.fillStyle = dinh > nen ? MAU_GIU : MAU_YEU
  ctx.fillRect(x, yTop, 1, cao - yTop)
}

/** Chuẩn bị canvas theo đúng kích thước thật trên màn hình. Trả null nếu chưa đo được. */
function sanSang(
  cv: HTMLCanvasElement,
  cao: number,
): { ctx: CanvasRenderingContext2D; rong: number } | null {
  const ctx = cv.getContext('2d')
  if (!ctx) return null
  const rong = cv.clientWidth
  if (rong < 8) return null
  // Nhân theo devicePixelRatio, không thì nét vẽ nhoè trên màn hình tỉ lệ khác 1.
  const dpr = window.devicePixelRatio || 1
  cv.width = Math.round(rong * dpr)
  cv.height = Math.round(cao * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, rong, cao)
  return { ctx, rong }
}

interface PropsSong {
  mucAm: MucAm
  bien: number
  cat: Quang[]
  cao: number
}

/** Dải TRƯỚC khi cắt: sóng đầy đủ + đường ngưỡng + vùng đỏ sẽ bị bỏ. */
function DaiGoc({ mucAm, bien, cat, cao }: PropsSong) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const s = sanSang(cv, cao)
    if (!s) return
    const { ctx, rong } = s

    const n = mucAm.cua.length
    if (!n) return
    const tongGiay = n * mucAm.buocGiay
    // Mỗi cột pixel gộp nhiều cửa sổ 20ms: video 58 phút = 175.850 cửa sổ dồn
    // vào ~560 px, tức ~314 cửa sổ một cột. Lấy ĐỈNH của cụm chứ không lấy
    // trung bình — trung bình làm tiếng nói ngắn biến mất khỏi hình.
    const moiCot = n / rong

    for (let x = 0; x < rong; x++) {
      const i0 = Math.floor(x * moiCot)
      const i1 = Math.min(n, Math.max(i0 + 1, Math.floor((x + 1) * moiCot)))
      veCot(ctx, mucAm, bien, i0, i1, x, cao)
    }

    // Đường ngưỡng vẽ SAU để nằm trên, và vẽ mảnh để không che sóng.
    ctx.beginPath()
    ctx.strokeStyle = MAU_NGUONG
    ctx.lineWidth = 1.25
    for (let x = 0; x < rong; x++) {
      const i0 = Math.floor(x * moiCot)
      const i1 = Math.min(n, Math.max(i0 + 1, Math.floor((x + 1) * moiCot)))
      let c = 0
      for (let i = i0; i < i1; i++) c += mucAm.nenCucBo[i]
      const db = c / (i1 - i0) + bien
      const t = (db - NEN_DAY) / (NEN_DINH - NEN_DAY)
      const yy = cao - Math.max(0, Math.min(1, t)) * cao
      if (x === 0) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
    }
    ctx.stroke()

    ctx.fillStyle = MAU_CAT
    for (const c of cat) {
      const x0 = (c.tu / tongGiay) * rong
      const x1 = (c.den / tongGiay) * rong
      // Tối thiểu 0,7 px: video 58 phút nén vào ~560 px thì một khoảng lặng
      // 0,3 giây chỉ chiếm 0,08 px — không ép bề rộng là nó biến mất khỏi hình
      // và người dùng tưởng chỗ đó không bị cắt.
      ctx.fillRect(x0, 0, Math.max(0.7, x1 - x0), cao)
    }
  }, [mucAm, bien, cat, cao])

  return <canvas ref={ref} className="song" style={{ height: cao }} />
}

/**
 * Dải SAU khi cắt: chỉ các đoạn còn lại, nối liền nhau.
 *
 * Vẽ ở CÙNG TỈ LỆ pixel/giây với dải gốc, nên nó ngắn hơn thật — đó chính là
 * chỗ người dựng "hình dung luôn" video ngắn đi bao nhiêu.
 */
function DaiSauCat({ mucAm, bien, cat, cao }: PropsSong) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const s = sanSang(cv, cao)
    if (!s) return
    const { ctx, rong } = s

    const n = mucAm.cua.length
    if (!n) return
    const b = mucAm.buocGiay
    const tongGiay = n * b
    const giu = vungConLai(cat, tongGiay)
    let conGiay = 0
    for (const g of giu) conGiay += g.den - g.tu
    if (conGiay <= 0) return

    // Bề rộng canvas đã bị co lại theo tỉ lệ (xem style width bên dưới), nên
    // ở đây cứ trải đều `conGiay` lên toàn bộ `rong` là ra đúng tỉ lệ chung.
    const moiCot = conGiay / rong
    let x = 0
    let daQua = 0 // đã vẽ bao nhiêu giây (tính theo trục SAU cắt)

    for (const g of giu) {
      const dai = g.den - g.tu
      const soCot = Math.max(1, Math.round(dai / moiCot))
      for (let k = 0; k < soCot && x < rong; k++, x++) {
        const giayGoc = g.tu + (k / soCot) * dai
        const giayGocSau = g.tu + ((k + 1) / soCot) * dai
        const i0 = Math.floor(giayGoc / b)
        const i1 = Math.min(n, Math.max(i0 + 1, Math.floor(giayGocSau / b)))
        veCot(ctx, mucAm, bien, i0, i1, x, cao)
      }
      daQua += dai
    }
  }, [mucAm, bien, cat, cao])

  return <canvas ref={ref} className="song" style={{ height: cao }} />
}

/* ══════════════════════════════════════════════════════════════════════════
   KHỐI XEM TRƯỚC — hai dải + số + nút đi tiếp
   ══════════════════════════════════════════════════════════════════════════ */

function mmss(giay: number): string {
  const g = Math.max(0, Math.round(giay))
  const p = Math.floor(g / 60)
  const s = g % 60
  return `${p}:${String(s).padStart(2, '0')}`
}

/** "1 phút 55 giây" — cỡ chữ to thì nói bằng tiếng người, đừng bắt đọc 115. */
function dai(giay: number): string {
  const g = Math.max(0, Math.round(giay))
  const p = Math.floor(g / 60)
  return p > 0
    ? `${p} ${dich('phút')} ${g % 60} ${dich('giây')}`
    : `${g} ${dich('giây')}`
}

interface PropsXem {
  mucAm: MucAm
  bien: number
  /** Danh sách khoảng sẽ cắt — App tính sẵn bằng `uocVungCat` rồi truyền xuống,
      vì nó còn dùng cho bảng danh sách và ba ô Kết quả. Tính hai lần là hai
      nguồn số cho CÙNG một việc, kiểu gì cũng có lúc lệch nhau. */
  cat: Quang[]
}

/**
 * Hai dải sóng THẬT, đặt trong khung "Xem trước kết quả" của thiết kế mới.
 *
 * ☠️ Nút "CẮT ĐI" đã chuyển RA NGOÀI, xuống chỗ nút chính. Thiết kế 03/08 chỉ
 * có MỘT nút chính cho cả màn hình — để nút thứ hai nằm lẫn giữa nội dung là
 * người dùng phải tìm xem bấm cái nào.
 */
export function XemTruoc({ mucAm, bien, cat }: PropsXem) {
  const tong = mucAm.cua.length * mucAm.buocGiay
  let boDi = 0
  for (const c of cat) boDi += c.den - c.tu
  const conLai = Math.max(0, tong - boDi)
  const tyLe = tong > 0 ? conLai / tong : 1

  return (
    <>
      <div className="trk-hd">
        <span>Bản gốc</span>
        <span className="meta">{mmss(tong)}</span>
      </div>
      <DaiGoc mucAm={mucAm} bien={bien} cat={cat} cao={96} />

      <div className="trk-hd" style={{ marginTop: 'var(--sp-5)' }}>
        <span>Sau khi cắt</span>
        <span className="meta">
          {mmss(conLai)}
          <i>−{mmss(boDi)}</i>
        </span>
      </div>
      {/* Co bề rộng đúng tỉ lệ để hai dải so được với nhau bằng MẮT, và chỗ
          trống bên phải KHÔNG để hở suông — gạch chéo đỏ + con số, đọc ra ngay
          "mất đi bấy nhiêu" mà không cần chú thích. */}
      <div className="sau">
        <div className="sau__giu" style={{ flexBasis: `${(tyLe * 100).toFixed(2)}%` }}>
          <DaiSauCat mucAm={mucAm} bien={bien} cat={cat} cao={96} />
        </div>
        {boDi > 0 && (
          <div className="sau__bo">
            {/* Bỏ được ÍT thì khối này hẹp, nhét chữ vào là chữ tràn đè lên
                gạch chéo. Đo thật 03/08 trên video 26 phút của anh Tiến: bỏ
                0:30 = 1,9% — khối rộng chưa tới 20px. Dưới 15% thì để trống,
                con số đã có sẵn ở nhãn "Sau khi cắt" ngay trên đầu. */}
            {1 - tyLe >= 0.15 && (
              <>
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
                </svg>
                <span className="n">{dai(boDi)}</span>
                <span className="l">đã cắt bỏ</span>
              </>
            )}
          </div>
        )}
      </div>

      <p className="xem__luu">
        Đỏ là chỗ sẽ bỏ · đường cam là ngưỡng, nó <b>nhấp nhô theo nền ồn từng đoạn</b>{' '}
        chứ không phải một mức cứng cho cả file. Bấm ba mức để xem khác nhau chỗ nào.
        {/* ☠️ Câu dưới SUÝT VIẾT NGƯỢC (29/07). Tôi định ghi "bước nghe hiểu sẽ
            giữ lại bớt nên thực tế bỏ ít hơn" — nghe hợp lý mà sai. Đo trên dữ
            liệu thật (mục 17 của `npm run kiem`), video 58 phút:
                Giữ nhịp 141,4s -> 152,3s · Vừa 303,9s -> 315,4s · Cắt sạch 488,6s -> 501,0s
            Máy cắt NHIỀU HƠN hình, vì `vungNoiThat` còn giao thêm với câu Whisper
            nên mấy chỗ có tiếng động ngắn mà không phải lời nói cũng bị bỏ.
            Nói ngược là để người dùng tưởng an toàn hơn thực tế. */}
        <em>
          Đây là ước tính <b>hơi thấp</b> — bước nghe hiểu chạy sau còn bỏ thêm mấy chỗ có
          tiếng động nhưng không phải lời nói, nên thực tế thường ngắn hơn chừng 3–8% nữa.
        </em>
      </p>
    </>
  )
}
