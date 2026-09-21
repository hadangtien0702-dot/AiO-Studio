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

/**
 * ☠️☠️ [13/08/2026] ĐỪNG VIẾT `process.env.APPDATA` Ở ĐÂY — BUNDLER XOÁ NÓ
 * ══════════════════════════════════════════════════════════════════════════
 * Triệu chứng đo được trên panel THẬT đang chạy trong Premiere (cổng 8089):
 *
 *     localStorage.getItem('aio-lang')                  ->  "en"    (đúng)
 *     fs.existsSync(%APPDATA%\AiOStudio\ngonngu.json)   ->  false   (SAI)
 *
 * Tức `ghiRaDia()` THẤT BẠI TRONG IM LẶNG, và mất đúng thứ file này sinh ra để
 * làm: đổi ngôn ngữ ở một panel thì cả bộ đổi theo.
 *
 * Bốn nguyên nhân bị nghi lúc đầu — đo trên panel thật thì **SAI CẢ BỐN**:
 *
 *   | Nghi                      | Đo được trên panel đang chạy              |
 *   |---------------------------|-------------------------------------------|
 *   | `napNode('fs')` trả null  | trả object thật; `cep_node.require` = hàm |
 *   | đường dẫn sai             | ...\AiOStudio\ngonngu.json — ĐÚNG         |
 *   | thư mục chưa có           | ĐÃ CÓ (bin · library.json · proxies…)     |
 *   | không có quyền ghi        | ghi thử + đọc lại: ĐẠT                    |
 *
 * Thủ phạm nằm ở **BƯỚC ĐÓNG GÓI**, không nằm ở lúc chạy. Đọc bản đã build
 * (`dist/index.html`) thì thấy Vite thay `process.env` bằng một object **RỖNG**
 * ngay lúc build:
 *
 *     var Ua = {};                                       // Vite sinh ra
 *     const n = typeof process < "u" && Ua ? Ua.APPDATA : null;   // -> undefined
 *
 * Nên `duongDanChung()` trả `null`, và `ghiRaDia()` thoát ngay ở dòng
 * `if (!p) return` — **chưa từng vào tới `try`, nên cũng chưa từng có lỗi để
 * bắt**. Catch rỗng không phải thủ phạm, nhưng nó xoá mất mọi dấu vết.
 *
 * ☠️ Vì sao bảng đo trên nhìn "xanh hết" mà sản phẩm vẫn hỏng: gõ
 * `process.env.APPDATA` vào console thì ĐÚNG (console KHÔNG đi qua Vite), còn
 * mã đã đóng gói thì đọc `{}.APPDATA`. **Đo trên console không chứng minh được
 * mã ĐÃ BUILD chạy đúng** — cùng họ bài học 5ah ("đã push" ≠ "đã ăn").
 *
 * → Luật: lấy biến môi trường bằng **truy cập lúc chạy** (`cep_node.process`,
 *   `require('process')`, `os.homedir()`), đừng viết chữ `process.env` cho
 *   bundler nhìn thấy.
 *
 * ⚠️ CÙNG LỖI NÀY CÒN NẰM Ở `services/ffmpeg.ts` (2 chỗ đọc
 *   `process.env.APPDATA`, build ra `El={}` rồi `El.APPDATA`). Nghĩa là kho
 *   FFmpeg dùng chung `%APPDATA%\AiOStudio\bin\win64` hiện **không bao giờ
 *   được dò tới**; panel vẫn chạy vì bản cài có `bin/` riêng nên ứng viên đầu
 *   danh sách đã thắng. CHƯA sửa ở đây để giữ đúng phạm vi việc này.
 */

/**
 * Ghi lý do thất bại ra console, tiền tố `[AiO ngonngu]` để lần sau chẩn đoán
 * được mà không phải dựng lại bàn đo.
 *
 * ☠️ **Nói MỘT LẦN cho mỗi lý do.** `docTuDia()` bị gọi lại mỗi 2 giây (xem
 * `NhaNgonNgu`), nên warn thẳng tay là ngập console khi panel chạy ngoài
 * Premiere — lúc đó không có `fs` là chuyện BÌNH THƯỜNG, không phải lỗi.
 * Chỉ báo khi THẤT BẠI, không báo lúc thành công.
 */
const _daNoi = new Set<string>()
function canhBao(viec: string, e?: unknown): void {
  const chiTiet = e === undefined ? '' : ': ' + String((e as any)?.message ?? e)
  const msg = viec + chiTiet
  if (_daNoi.has(msg)) return
  _daNoi.add(msg)
  try {
    console.warn('[AiO ngonngu] ' + msg)
  } catch {
    /* không có console thì thôi — đừng để việc ghi log làm hỏng luồng chính */
  }
}

function napNode(mod: string): any {
  try {
    const w = window as any
    if (w.cep_node && w.cep_node.require) return w.cep_node.require(mod)
  } catch (e) {
    canhBao('cep_node.require("' + mod + '") hỏng', e)
  }
  try {
    if (typeof require === 'function') return require(mod)
  } catch (e) {
    canhBao('require("' + mod + '") hỏng', e)
  }
  return null
}

/**
 * Thư mục `%APPDATA%` — lấy bằng ba đường CHẠY LÚC RUNTIME, không đường nào
 * viết chữ `process.env` ra cho bundler thấy (xem ghi chú đầu mục).
 * Đường 1 đã đo trên panel thật 13/08: trả đúng `C:\Users\...\AppData\Roaming`.
 */
function layAppData(): string | null {
  // 1. `process` của Node do CEP gắn sẵn vào `window.cep_node` — truy cập
  //    thuộc tính lúc chạy nên Vite không đụng tới được.
  try {
    const w = window as any
    const pr = w.cep_node && w.cep_node.process
    if (pr && pr.env && pr.env.APPDATA) return String(pr.env.APPDATA)
  } catch (e) {
    canhBao('doc cep_node.process.env.APPDATA hỏng', e)
  }

  // 2. Nạp thẳng module 'process' — dùng khi chạy Node kiểu khác.
  try {
    const pr = napNode('process')
    if (pr && pr.env && pr.env.APPDATA) return String(pr.env.APPDATA)
  } catch (e) {
    canhBao('doc require("process").env.APPDATA hỏng', e)
  }

  // 3. Suy từ thư mục nhà. Đường lùi cuối, chỉ đúng trên Windows — mà panel
  //    CEP của bộ này vốn chỉ chạy Windows.
  try {
    const os = napNode('os')
    const path = napNode('path')
    if (os && path && typeof os.homedir === 'function') {
      const nha = os.homedir()
      if (nha) return path.join(nha, 'AppData', 'Roaming')
    }
  } catch (e) {
    canhBao('suy %APPDATA% tu os.homedir() hỏng', e)
  }

  canhBao('khong tim duoc %APPDATA% — bo qua file chung, chi dung localStorage')
  return null
}

function duongDanChung(): string | null {
  const path = napNode('path')
  if (!path) {
    canhBao('khong nap duoc module `path` — panel dang chay ngoai Premiere?')
    return null
  }
  const appdata = layAppData()
  if (!appdata) return null
  try {
    return path.join(appdata, 'AiOStudio', 'ngonngu.json')
  } catch (e) {
    canhBao('path.join dung duong dan chung hỏng', e)
    return null
  }
}

function docTuDia(): MaNgonNgu | null {
  const fs = napNode('fs')
  const p = duongDanChung()
  if (!fs || !p) return null
  try {
    // Chưa có file là chuyện BÌNH THƯỜNG (lần chạy đầu) — không cảnh báo.
    if (!fs.existsSync(p)) return null
    const o = JSON.parse(String(fs.readFileSync(p, 'utf8')))
    if (o && (o.lang === 'vi' || o.lang === 'en')) return o.lang
    canhBao('file chung co ma ngon ngu la: ' + JSON.stringify(o && o.lang))
    return null
  } catch (e) {
    canhBao('doc file chung ' + p + ' hỏng', e)
    return null
  }
}

/**
 * Ghi lựa chọn ra file dùng chung.
 *
 * ☠️ **ĐỌC LẠI SAU KHI GHI là bắt buộc** (luật của dự án: "không báo lỗi"
 * KHÔNG có nghĩa là "đã ghi"). `writeFileSync` không ném lỗi chỉ chứng minh
 * lệnh chạy trót lọt, không chứng minh đĩa có dữ liệu đúng.
 *
 * Trả `true` khi đã ghi VÀ đọc lại khớp. Người gọi không bắt buộc dùng giá trị
 * này — `datNgonNgu()` vẫn ghi localStorage làm đường lùi.
 */
function ghiRaDia(ma: MaNgonNgu): boolean {
  const fs = napNode('fs')
  const path = napNode('path')
  const p = duongDanChung()
  if (!fs) {
    canhBao('khong nap duoc module `fs` — khong ghi duoc file chung')
    return false
  }
  if (!path || !p) return false

  try {
    // Tạo thư mục TRƯỚC. `recursive: true` không kêu ca nếu đã có sẵn.
    const thuMuc = path.dirname(p)
    if (!fs.existsSync(thuMuc)) fs.mkdirSync(thuMuc, { recursive: true })
    fs.writeFileSync(p, JSON.stringify({ lang: ma }), 'utf8')
  } catch (e) {
    // Ghi không được thì vẫn còn localStorage — không làm hỏng panel vì việc
    // này, nhưng PHẢI nói ra lý do.
    canhBao('ghi file chung ' + p + ' hỏng', e)
    return false
  }

  try {
    const lai = JSON.parse(String(fs.readFileSync(p, 'utf8')))
    if (!lai || lai.lang !== ma) {
      canhBao('ghi xong doc lai KHONG khop — mong "' + ma + '", nhan duoc: ' + JSON.stringify(lai))
      return false
    }
  } catch (e) {
    canhBao('doc lai de xac nhan ' + p + ' hỏng', e)
    return false
  }

  return true
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
  } catch (e) {
    canhBao('doc localStorage hỏng — dung mac dinh "' + MAC_DINH + '"', e)
  }
  return MAC_DINH
}

export function datNgonNgu(ma: MaNgonNgu): void {
  // Ghi hai nơi. `ghiRaDia` trả false thì đã tự nói lý do ra console rồi —
  // ở đây không chặn luồng, vì localStorage vẫn cứu được panel hiện tại.
  ghiRaDia(ma)
  try {
    localStorage.setItem(KHOA, ma)
  } catch (e) {
    // Hỏng chỗ này là mất NỐT đường lùi cuối cùng — phải nói ra.
    canhBao('ghi localStorage hỏng — lua chon se mat khi mo lai panel', e)
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
 * Đổi ngôn ngữ — **MỘT NÚT DUY NHẤT**, bấm một cái là đổi.
 *
 * ☠️ HAI ĐỜI TRƯỚC ĐÃ BỎ, ĐỪNG DỰNG LẠI:
 *   1. Hai lá cờ SVG — anh Tiến 13/08/2026: *"chỗ này chỉ cần để là EN và VI là
 *      xong, xóa đi 2 lá cờ và nút đi cho nó gọn"*.
 *      (Và **ngôn ngữ không phải quốc gia** — tiếng Anh đâu chỉ của một nước.
 *      Ghi chú "đừng dùng emoji quốc kỳ" ở đầu file vẫn còn giá trị nếu sau này
 *      ai định thêm cờ lại.)
 *   2. Hai nút `VI · EN` trong `role="radiogroup"` — anh Tiến 13/08/2026:
 *      *"nút này anh muốn để là 1 button thôi, bấm vào là đổi cho gọn chứ không
 *      phải là 2 phần như thế này"*.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * ☠️ NHÃN LÀ NGÔN NGỮ **ĐANG DÙNG**, KHÔNG PHẢI NGÔN NGỮ SẼ ĐỔI SANG
 * ══════════════════════════════════════════════════════════════════════════
 * Đang tiếng Anh → nút ghi `EN`. Bấm một cái thành `VI`. Bấm nữa về `EN`.
 *
 * Đây đúng mô hình anh Tiến đã chốt cho nút **"Render preview"** bên Asset
 * Manager (28/07/2026): *"chưa render hết thì màu đỏ — render xong là xanh"* —
 * **một nút vừa là NÚT BẤM vừa là ĐÈN BÁO**, nhìn là biết đang ở trạng thái nào,
 * khỏi đọc thêm gì.
 *
 * Nếu ghi ngôn ngữ **sẽ** đổi sang thì hỏng đúng chỗ đó: màn hình đang tiếng
 * Anh mà nút ghi `VI` → người dùng đọc `VI` lại tưởng đang ở tiếng Việt. Nhãn
 * và màn hình chọi nhau, mà nhãn thì luôn thua vì màn hình to hơn.
 *
 * Việc nó LÀM thì nói ở `title` (tooltip) — và nói bằng **thứ tiếng sẽ đổi
 * sang**, để đúng người cần nó đọc được:
 *     đang EN → "Chuyển sang tiếng Việt"
 *     đang VI → "Switch to English"
 *
 * `aria-label` thì ngược lại — viết bằng **thứ tiếng đang hiện**, vì đó là thứ
 * tiếng người đang dùng panel đọc được; và nó phải nói cả TRẠNG THÁI lẫn VIỆC,
 * bởi chữ trên nút chỉ có hai ký tự.
 *
 * Không dùng `role="radio"`/`radiogroup` nữa: đây không còn là lựa chọn nhiều
 * giá trị bày sẵn, mà là MỘT nút bấm. Cũng không dùng `aria-pressed` — nút này
 * không có nghĩa bật/tắt, nó xoay vòng giữa hai thứ tiếng.
 */
export function NutDoiNgonNgu({ className }: { className?: string }) {
  const { L, doiNgonNgu } = useNgonNgu()
  const dangEN = L === 'en'
  return (
    <button
      type="button"
      className={'aio-ngonngu ' + (className || '')}
      onClick={() => doiNgonNgu(dangEN ? 'vi' : 'en')}
      title={dangEN ? 'Chuyển sang tiếng Việt' : 'Switch to English'}
      aria-label={
        dangEN ? 'Language: English — switch to Vietnamese' : 'Ngôn ngữ: Tiếng Việt — chuyển sang tiếng Anh'
      }
    >
      {dangEN ? 'EN' : 'VI'}
    </button>
  )
}
