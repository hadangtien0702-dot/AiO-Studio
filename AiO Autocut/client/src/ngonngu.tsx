/**
 * ngonngu.tsx — SONG NGỮ VIỆT / ANH cho các panel React của AiO Studio.
 *
 * ☠️ ĐÂY LÀ NGUỒN CHÂN LÝ. Sửa ở `design-system/ngonngu.tsx`, KHÔNG sửa bản
 * copy nằm trong `client/src/` của từng panel — chạy `dong-bo-ngonngu.ps1`
 * để chép sang. Cùng luật với `tokens.css`.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * VÌ SAO CÓ FILE NÀY
 * ══════════════════════════════════════════════════════════════════════════
 * Anh Tiến chốt 13/08/2026: *"các phần tool panel thì hãy thêm cho anh 02 tùy
 * chọn ngôn ngữ là tiếng anh và tiếng việt"*.
 *
 * Nó cũng là một trong bốn thứ CHẶN bản Beta: bán cạnh AutoCut/AutoPod ở thị
 * trường Tây mà UI toàn tiếng Việt thì editor mở panel ra là đóng lại.
 *
 * Panel HTML tĩnh (Podcast, Re-Frames) đã có khuôn `NGON_NGU` / `t()` / `tp()`
 * từ 01/08. File này là bản cho React — CÙNG tên khoá, CÙNG cách gọi, để hai
 * loại panel không lệch nhau.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ localStorage KHÔNG DÙNG CHUNG ĐƯỢC GIỮA CÁC PANEL
 * ══════════════════════════════════════════════════════════════════════════
 * Mỗi panel CEP là một extension riêng, có vùng lưu riêng. Đổi ngôn ngữ ở
 * Autocut thì Asset Manager KHÔNG biết. Mà anh Tiến mua cả bộ, mở 3-4 panel
 * cùng lúc — mỗi panel một thứ tiếng là hỏng.
 *
 * → Nguồn chân lý là MỘT FILE TRÊN ĐĨA, dùng chung cho cả bộ:
 *       %APPDATA%\AiOStudio\ngonngu.json
 *   (cùng thư mục với kho FFmpeg dùng chung, dựng 13/08)
 *
 * localStorage vẫn được ghi song song, làm hai việc:
 *   1. đường lùi khi panel chạy ngoài Premiere (trình duyệt, không có `fs`)
 *   2. tương thích với Podcast/Re-Frames đang đọc khoá `aio-lang`
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ ĐỪNG DÙNG EMOJI QUỐC KỲ — WINDOWS KHÔNG CÓ GLYPH CỜ
 * ══════════════════════════════════════════════════════════════════════════
 * Đo thật 30/07 trên panel, font `Segoe UI Emoji`, cỡ 20px: mỗi lá cờ ra một
 * bề rộng khác nhau (15,2 – 21,3px, chênh 6,1px). Glyph cờ thật thì mọi cờ
 * phải rộng BẰNG NHAU vì cùng là một ô emoji. Chênh nhau nghĩa là font đang vẽ
 * HAI CHỮ CÁI regional indicator — panel hiện ra "VN", "US" chứ không ra cờ.
 * → Vẽ SVG. Hai lá dưới đây mượn từ `Co.tsx` của Transcripts (đã đo, đã chạy).
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type MaNgonNgu = 'vi' | 'en'

/**
 * ☠️ MẶC ĐỊNH LÀ TIẾNG ANH — anh Tiến chốt hướng bán ra nước ngoài.
 * Lý do chọn EN chứ không phải VI: người Việt thấy tiếng Anh thì tự đổi được,
 * còn editor nước ngoài thấy tiếng Việt là đóng panel luôn. Đổi mặc định thì
 * sửa đúng dòng này.
 */
export const MAC_DINH: MaNgonNgu = 'en'

/** Khoá localStorage — GIỐNG HỆT panel HTML tĩnh, đừng đổi tên. */
const KHOA = 'aio-lang'

/**
 * Bảng chữ của một panel.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ KHOÁ CHÍNH LÀ CÂU TIẾNG VIỆT — KHÔNG ĐẶT TÊN KHOÁ KIỂU `nut_cat`
 * ══════════════════════════════════════════════════════════════════════════
 * Quyết định 13/08/2026, sau khi đo: riêng Autocut có **255 chuỗi** phải dịch.
 *
 * Kiểu thường thấy là đặt tên khoá rồi viết hai bảng vi/en. Ở đây KHÔNG làm vậy,
 * ba lý do đo được:
 *
 * 1. **Bớt một nửa việc.** Dùng câu Việt làm khoá thì chỉ phải viết BẢNG EN.
 *    Bảng VI chính là mã nguồn đang có.
 * 2. **Sót thì hỏng NHẸ, không hỏng NẶNG.** Quên dịch một câu: người dùng EN
 *    thấy câu tiếng Việt — xấu nhưng đọc được, và nhìn phát hiện ra ngay.
 *    Còn kiểu đặt tên khoá mà gõ sai tên thì màn hình hiện ra `nut_cat` —
 *    người dùng không hiểu gì, mà mình cũng không thấy khi lướt qua.
 * 3. **Sửa chỗ gọi là việc máy móc.** `'Cắt khoảng lặng'` -> `t('Cắt khoảng lặng')`,
 *    không phải nghĩ tên khoá cho 255 chuỗi (và nghĩ tên là chỗ đẻ ra trùng lặp).
 *
 * Nên bảng chỉ cần một nhánh `en`:
 *     export const CHU: BangChu = { en: { 'Cắt khoảng lặng': 'Cut silences' } }
 *
 * Muốn một nhãn GIỮ NGUYÊN ở cả hai thứ tiếng (tên thương hiệu — anh Tiến chốt
 * 13/08 cho ba mức cắt của Autocut, giống `Auto Match` bên Podcast) thì **đừng
 * cho nó vào bảng** — không có trong bảng nghĩa là trả lại nguyên văn.
 */
export type BangChu = { en: Record<string, string> }

// ═══ ĐỌC / GHI FILE DÙNG CHUNG ════════════════════════════════════════════

function napNode(mod: string): any {
  try {
    const w = window as any
    if (w.cep_node && w.cep_node.require) return w.cep_node.require(mod)
  } catch {
    /* ngoài Premiere thì không có */
  }
  try {
    if (typeof require === 'function') return require(mod)
  } catch {
    /* bỏ qua */
  }
  return null
}

function duongDanChung(): string | null {
  const path = napNode('path')
  if (!path) return null
  const appdata = typeof process !== 'undefined' && process.env ? process.env.APPDATA : null
  if (!appdata) return null
  return path.join(appdata, 'AiOStudio', 'ngonngu.json')
}

function docTuDia(): MaNgonNgu | null {
  const fs = napNode('fs')
  const p = duongDanChung()
  if (!fs || !p) return null
  try {
    if (!fs.existsSync(p)) return null
    const o = JSON.parse(String(fs.readFileSync(p, 'utf8')))
    return o && (o.lang === 'vi' || o.lang === 'en') ? o.lang : null
  } catch {
    return null
  }
}

function ghiRaDia(ma: MaNgonNgu): void {
  const fs = napNode('fs')
  const path = napNode('path')
  const p = duongDanChung()
  if (!fs || !path || !p) return
  try {
    const thuMuc = path.dirname(p)
    if (!fs.existsSync(thuMuc)) fs.mkdirSync(thuMuc, { recursive: true })
    fs.writeFileSync(p, JSON.stringify({ lang: ma }), 'utf8')
  } catch {
    /* ghi không được thì vẫn còn localStorage — không làm hỏng panel vì việc này */
  }
}

/**
 * Thứ tự đọc: FILE CHUNG → localStorage → mặc định.
 * File chung đứng trước vì nó là thứ cả bộ nhìn thấy.
 */
export function docNgonNgu(): MaNgonNgu {
  const tuDia = docTuDia()
  if (tuDia) return tuDia
  try {
    const v = localStorage.getItem(KHOA)
    if (v === 'vi' || v === 'en') return v
  } catch {
    /* bỏ qua */
  }
  return MAC_DINH
}

export function datNgonNgu(ma: MaNgonNgu): void {
  ghiRaDia(ma)
  try {
    localStorage.setItem(KHOA, ma)
  } catch {
    /* bỏ qua */
  }
}

// ═══ CONTEXT + HOOK ═══════════════════════════════════════════════════════

interface GiaTri {
  L: MaNgonNgu
  /**
   * Lấy chữ. `k` CHÍNH LÀ câu tiếng Việt trong mã nguồn.
   * - đang ở VI → trả lại nguyên văn `k`
   * - đang ở EN → tra bảng; **không có trong bảng thì trả lại `k`**
   *   (đó là đường để giữ nguyên tên thương hiệu, và cũng là lưới an toàn
   *   khi quên dịch — xem ghi chú ở `BangChu`)
   */
  t: (k: string) => string
  /** Như `t` nhưng điền chỗ trống: `tp('con_lai', { n: 5 })` cho `'{n} bài'`. */
  tp: (k: string, thay: Record<string, string | number>) => string
  doiNgonNgu: (ma: MaNgonNgu) => void
}

const Ctx = createContext<GiaTri | null>(null)

// ═══ DỊCH NGOÀI REACT ═════════════════════════════════════════════════════
//
// ☠️ VÌ SAO CẦN: phần lớn câu báo lỗi KHÔNG nằm trong component. Chúng nằm ở
// `lib/cep.ts`, `services/whisper.ts`, `services/ffmpeg.ts` — hàm thường, gọi
// `useNgonNgu()` là vi phạm luật hook, React sẽ nổ ngay.
//
// Nên giữ một bản sao ở tầng module, `NhaNgonNgu` cập nhật mỗi lần đổi. Hàm
// `dich()` đọc bản sao đó nên gọi được ở BẤT KỲ đâu.
//
// ⚠️ `dich()` KHÔNG làm React vẽ lại. Component đổi ngôn ngữ được là nhờ
// `NhaNgonNgu` đặt `key` theo mã ngôn ngữ (xem dưới) — đổi key thì React dựng
// lại toàn bộ cây con, mọi `dich()` chạy lại.
let _bang: BangChu | null = null
let _L: MaNgonNgu = MAC_DINH

/** Dịch ở nơi không dùng được hook. Không có trong bảng thì trả nguyên văn. */
export function dich(k: string): string {
  if (_L === 'vi') return k
  const b = _bang && _bang.en ? _bang.en[k] : undefined
  return b !== undefined ? b : k
}

export function NhaNgonNgu({ bang, children }: { bang: BangChu; children: ReactNode }) {
  const [L, setL] = useState<MaNgonNgu>(() => docNgonNgu())

  // Cập nhật bản sao tầng module cho `dich()` dùng. Đặt NGAY TRONG THÂN hàm,
  // không đợi `useEffect`: các hàm ngoài React có thể chạy trước khi effect kịp
  // bắn, lúc đó `dich()` sẽ trả nhầm ngôn ngữ mặc định.
  _bang = bang
  _L = L

  // Panel khác đổi ngôn ngữ thì panel này theo. Không có sự kiện nào bắn qua
  // ranh giới extension nên phải hỏi lại file chung theo nhịp. 2 giây là đủ
  // nhạy cho người dùng mà không tốn gì (đọc một file JSON ~20 byte).
  useEffect(() => {
    const id = setInterval(() => {
      const m = docTuDia()
      if (m && m !== L) setL(m)
    }, 2000)
    return () => clearInterval(id)
  }, [L])

  const t = useCallback(
    (k: string): string => {
      if (L === 'vi') return k
      const b = bang.en && bang.en[k]
      return b !== undefined ? b : k
    },
    [bang, L],
  )

  const tp = useCallback(
    (k: string, thay: Record<string, string | number>): string => {
      let s = t(k)
      Object.keys(thay || {}).forEach((kk) => {
        s = s.split('{' + kk + '}').join(String(thay[kk]))
      })
      return s
    },
    [t],
  )

  const doiNgonNgu = useCallback((ma: MaNgonNgu) => {
    datNgonNgu(ma)
    setL(ma)
  }, [])

  // ☠️ `key={L}` LÀ CỐ Ý — đừng bỏ.
  // Phần lớn chuỗi được dịch bằng `dich()` (hàm thường, xem trên), mà hàm thường
  // thì React không biết là nó đã đổi kết quả. Đổi `key` là cách chắc chắn nhất:
  // React vứt cả cây con rồi dựng lại, nên mọi `dich()` chạy lại với ngôn ngữ mới.
  //
  // Giá phải trả: dựng lại thì state trong cây bị xoá. Chấp nhận được vì đổi
  // ngôn ngữ là việc hiếm (người dùng chọn một lần rồi thôi), và lúc panel đang
  // chạy thì các nút đều đã khoá nên không đổi được giữa chừng.
  return (
    <Ctx.Provider value={{ L, t, tp, doiNgonNgu }}>
      <div key={L} style={{ display: 'contents' }}>
        {children}
      </div>
    </Ctx.Provider>
  )
}

export function useNgonNgu(): GiaTri {
  const v = useContext(Ctx)
  if (!v) throw new Error('useNgonNgu phải nằm trong <NhaNgonNgu>')
  return v
}

// ═══ NÚT ĐỔI NGÔN NGỮ ═════════════════════════════════════════════════════

/**
 * Đổi ngôn ngữ — CHỈ HAI CHỮ `VI` · `EN`, không cờ, không khung nút.
 *
 * ☠️ ĐÃ CÓ CỜ SVG, ANH TIẾN BẢO BỎ 13/08/2026: *"chỗ này chỉ cần để là EN và VI
 * là xong, xóa đi 2 lá cờ và nút đi cho nó gọn"*. Đừng vẽ cờ lại.
 *
 * Ghi chú "đừng dùng emoji quốc kỳ" ở đầu file vẫn giữ nguyên giá trị — nếu sau
 * này ai định thêm cờ lại thì đọc chỗ đó trước, đừng dùng emoji.
 *
 * Và **ngôn ngữ không phải quốc gia**: bỏ cờ đi lại đúng hơn về mặt này, vì
 * tiếng Anh đâu chỉ của một nước.
 *
 * Vẫn dựng bằng `<button role="radio">` trong `role="radiogroup"` — nhìn như
 * chữ thường nhưng đi được bằng Tab + mũi tên, và đọc màn hình vẫn hiểu đây là
 * một lựa chọn hai giá trị.
 */
export function NutDoiNgonNgu({ className }: { className?: string }) {
  const { L, doiNgonNgu } = useNgonNgu()
  const ds: { ma: MaNgonNgu; ten: string }[] = [
    { ma: 'vi', ten: 'VI' },
    { ma: 'en', ten: 'EN' },
  ]
  return (
    <div className={'aio-ngonngu ' + (className || '')} role="radiogroup" aria-label="Language">
      {ds.map(({ ma, ten }, i) => (
        <span key={ma}>
          {i > 0 && <span className="aio-ngonngu__gach">·</span>}
          <button
            type="button"
            role="radio"
            aria-checked={L === ma}
            className={'aio-ngonngu__nut' + (L === ma ? ' la-chon' : '')}
            onClick={() => doiNgonNgu(ma)}
            title={ma === 'vi' ? 'Tiếng Việt' : 'English'}
          >
            {ten}
          </button>
        </span>
      ))}
    </div>
  )
}
