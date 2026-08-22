/**
 * caption-kieu.ts — KIỂU CAPTION HIỆU ỨNG: Hormozi · Beast · Karaoke · Boxed · Clean.
 *
 * Anh Tiến 22/08/2026: *"thêm option hiệu ứng captions giống Alex Hormozi… cho
 * anh 5 kiểu"*, và chốt CÁCH GẮN: caption phải ra dạng **Essential Graphics sửa
 * được trên timeline** (đúng như cách anh đang quét chọn caption rồi nâng lên
 * graphic) — KHÔNG phải overlay render sẵn.
 *
 * Cách làm: mỗi khối caption = MỘT clip Motion Graphics Template
 * (`mogrt/AiO Caption - <Kiểu>.mogrt`, sinh bằng script After Effects
 * `mogrt-src/build-mogrt.jsx`, chạy qua BridgeTalk). Host đặt clip bằng
 * `seq.importMGT` rồi ghi chữ + tham số qua `trackItem.getMGTComponent()`.
 *
 * File này CHỈ lo phần THUẦN TÍNH TOÁN: câu Whisper → danh sách khối
 * `{tu, den, chu, hl, moc}` trên trục SEQUENCE — kiểm được ngoài Premiere
 * (`node tests/kiem-caption-kieu.mjs`).
 *
 * ☠️ ĐO THẬT 22/08 trên Premiere Beta 27.0:
 *   - Slider đưa lên Essential Graphics bị KẸP 0..100 (đặt 420 đọc lại 100)
 *     → `Position Y` là PHẦN TRĂM chiều cao comp, `Highlight Word` là số thứ tự.
 *   - `importMGT` lần đầu ~2,5 s (nạp template), các lần sau ~100 ms/clip.
 *   - Đổi chữ có dấu tiếng Việt qua `textEditValue` chạy đúng.
 *   - Comp MOGRT 1920×1920 VUÔNG, Premiere đặt ở TÂM sequence không scale →
 *     một file dùng cho cả 16:9 lẫn 9:16; khác nhau chỉ ở Position Y và trần
 *     ký tự mỗi dòng (khung dọc chỉ rộng 1080 px).
 */
import {
  catCauDai,
  doRong,
  doiMoc,
  quyDoiCau,
  suaTu,
  xuongDong,
  type Cau,
  type GioiHanPhuDe,
  type KieuKhung,
  type Moc,
  type ThayTu,
} from './srt'

/**
 * Mã kiểu: 6 mã có sẵn, hoặc `tuy:<tên file>` cho kiểu người dùng tự làm bên
 * After Effects và bỏ vào thư mục kiểu caption (xem `quetKieuTuyChinh`).
 */
export type KieuCaption = 'mac-dinh' | 'hormozi' | 'beast' | 'karaoke' | 'boxed' | 'clean' | (string & {})

export interface MoTaKieuCaption {
  ma: KieuCaption
  /** Nhãn nút. Tên kiểu là TÊN RIÊNG, giữ nguyên ở mọi ngôn ngữ (trừ Mặc định). */
  ten: string
  /** Một dòng nói "chọn cái này thì sao". Bọc `dich()` ở chỗ vẽ, không bọc ở đây. */
  mo: string
  /** Tên file `.mogrt` (không đuôi) trong thư mục `mogrt/` của panel. null = caption track thường. */
  mogrt: string | null
  inHoa: boolean
  /** Tô màu TỪ NỔI BẬT (từ dài nhất trong khối). */
  noiBat: boolean
  /** Từng từ sáng lên theo lúc nói — gửi `Word Timing` cho template. */
  karaoke: boolean
  /**
   * Trần ký tự mỗi dòng ĐO THEO FONT của từng kiểu (comp rộng 1920; khung dọc
   * chỉ thấy 1080 px ở giữa). Số ghi kèm cách tính để sau chỉnh mắt khỏi mò:
   *   Montserrat Black 120px chữ hoa ≈ 86 px/ký tự · Bangers 150px ≈ 70 ·
   *   Montserrat ExtraBold 96px ≈ 64 · 100px ≈ 66 · SemiBold 84px ≈ 50.
   */
  gioiHan: Record<KieuKhung, GioiHanPhuDe>
  /**
   * Ước lượng px/ký tự ở cỡ gốc của template — để tính `co` (Text Size %) khi một
   * từ Latin dài hơn dòng: thay vì bẻ từ, CO CỠ CHỮ riêng clip đó cho vừa khung.
   */
  pxMoiKyTu: number
  /** Kiểu người dùng tự thêm: đường dẫn tuyệt đối tới file .mogrt (dấu `/`). */
  mogrtPath?: string
  tuyChinh?: boolean
}

export const KIEU_CAPTION: MoTaKieuCaption[] = [
  {
    ma: 'mac-dinh',
    ten: 'Mặc định',
    mo: 'Caption track thường của Premiere — sửa chữ trong Text panel',
    mogrt: null,
    inHoa: false,
    noiBat: false,
    karaoke: false,
    // Không dùng — kiểu mặc định đi đường `sinhSrt` với `gioiHanTheoKhung`.
    gioiHan: {
      ngang: { kyTuMoiDong: 42, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 1.0 },
      doc: { kyTuMoiDong: 20, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 0.7, tuToiDa: 6 },
    },
    pxMoiKyTu: 0,
  },
  {
    ma: 'hormozi',
    ten: 'Hormozi',
    mo: 'Chữ in hoa, viền đen dày, từ khoá tô vàng, pop khi vào — kiểu Alex Hormozi',
    mogrt: 'AiO Caption - Hormozi',
    inHoa: true,
    noiBat: true,
    karaoke: false,
    gioiHan: {
      ngang: { kyTuMoiDong: 18, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 0.5, tuToiDa: 4 },
      doc: { kyTuMoiDong: 11, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 0.5, tuToiDa: 4 },
    },
    pxMoiKyTu: 86,
  },
  {
    ma: 'beast',
    ten: 'Beast',
    mo: 'Chữ to màu vàng, viền + bóng đậm, pop mạnh — kiểu MrBeast',
    mogrt: 'AiO Caption - Beast',
    inHoa: true,
    noiBat: true,
    karaoke: false,
    gioiHan: {
      ngang: { kyTuMoiDong: 22, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 0.5, tuToiDa: 3 },
      doc: { kyTuMoiDong: 13, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 0.5, tuToiDa: 3 },
    },
    pxMoiKyTu: 70,
  },
  {
    ma: 'karaoke',
    ten: 'Karaoke',
    mo: 'Câu đủ 1–2 dòng, từng từ sáng xanh theo lúc nói',
    mogrt: 'AiO Caption - Karaoke',
    inHoa: false,
    noiBat: false,
    karaoke: true,
    gioiHan: {
      ngang: { kyTuMoiDong: 26, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 0.8, tuToiDa: 8 },
      doc: { kyTuMoiDong: 15, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 0.8, tuToiDa: 6 },
    },
    pxMoiKyTu: 64,
  },
  {
    ma: 'boxed',
    ten: 'Boxed',
    mo: 'Chữ trắng trên hộp đen bo góc — gọn, dễ đọc',
    mogrt: 'AiO Caption - Boxed',
    inHoa: false,
    noiBat: false,
    karaoke: false,
    gioiHan: {
      ngang: { kyTuMoiDong: 24, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 0.6, tuToiDa: 6 },
      doc: { kyTuMoiDong: 14, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 0.6, tuToiDa: 5 },
    },
    pxMoiKyTu: 66,
  },
  {
    ma: 'clean',
    ten: 'Clean',
    mo: 'Chữ mảnh, bóng mềm, không hiệu ứng — cho video dài',
    mogrt: 'AiO Caption - Clean',
    inHoa: false,
    noiBat: false,
    karaoke: false,
    gioiHan: {
      ngang: { kyTuMoiDong: 34, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 1.0 },
      doc: { kyTuMoiDong: 19, soDongToiDa: 2, luonCat: true, giuTuNguyen: true, giayToiThieu: 1.0, tuToiDa: 6 },
    },
    pxMoiKyTu: 50,
  },
]

/** Bề rộng khung (px) mà caption phải nằm lọt — comp 1920 đặt ở tâm sequence. */
const KHUNG_RONG: Record<KieuKhung, number> = { doc: 1080, ngang: 1920 }

/**
 * Cỡ chữ (%) cho một khối: 100 khi mọi dòng vừa khung; nhỏ hơn khi có dòng (từ
 * Latin dài) tràn — co vừa đủ để dòng rộng nhất lọt 94% bề rộng khung. Không
 * bao giờ dưới 55% (chữ nhỏ quá thì thà tràn còn đọc được).
 */
export function coChu(
  dongs: string[],
  kieu: MoTaKieuCaption,
  khung: KieuKhung,
  /** Bề rộng khung THẬT (px) nếu biết; 0 = lấy theo `khung` (1080 dọc / 1920 ngang). */
  rongKhungPx = 0,
): number {
  if (!kieu.pxMoiKyTu) return 100
  let rongNhat = 0
  for (const d of dongs) rongNhat = Math.max(rongNhat, doRong(d))
  const px = rongNhat * kieu.pxMoiKyTu
  // Comp 1920 đặt ở tâm: sequence rộng hơn 1920 thì chữ vẫn chỉ rộng theo comp.
  const rongKhung = rongKhungPx > 0 ? Math.min(rongKhungPx, 1920) : KHUNG_RONG[khung]
  const cho = rongKhung * 0.94
  if (px <= cho) return 100
  return Math.max(55, Math.floor((cho / px) * 100))
}

export function timKieu(ma: KieuCaption, danhSach: MoTaKieuCaption[] = KIEU_CAPTION): MoTaKieuCaption {
  return danhSach.find((k) => k.ma === ma) ?? danhSach[0] ?? KIEU_CAPTION[0]
}

/** Tiền tố tên file của bộ 5 kiểu có sẵn — bỏ đi khi làm nhãn nút cho kiểu tự thêm. */
const TIEN_TO_FILE = 'AiO Caption - '

/**
 * QUÉT KIỂU TỰ THÊM — anh Tiến 22/08: *"kiểu caption anh muốn em sau khi thiết kế
 * bên AE thì có thể chọn trực diện ở bên PR cho tiện"*.
 *
 * Mọi file `.mogrt` trong các thư mục truyền vào mà KHÔNG phải 5 kiểu có sẵn →
 * thành một kiểu mới, mã `tuy:<tên file>`. Template chỉ cần lộ tham số **Text**
 * (Essential Graphics); các tham số Position Y / Highlight Word / Word Timing /
 * Text Size / Pop In có thì host đặt, không có thì bỏ qua (xem `ac_datCaptionMogrt`).
 *
 * Tuỳ chọn: file `<tên>.json` cạnh `.mogrt` ghi đè mô tả, ví dụ
 *   { "ten": "Kênh A", "inHoa": true, "noiBat": true, "pxMoiKyTu": 80,
 *     "gioiHan": { "doc": { "kyTuMoiDong": 12, "soDongToiDa": 2, "giayToiThieu": 0.5, "tuToiDa": 4 } } }
 * Không có JSON thì dùng luật của kiểu Boxed (2 dòng, vừa phải) — an toàn nhất.
 *
 * `fs`/`path` truyền vào (module Node của panel) để hàm này vẫn THUẦN, kiểm được
 * ngoài Premiere.
 */
export function quetKieuTuyChinh(
  fs: { existsSync(p: string): boolean; readdirSync(p: string): string[]; readFileSync(p: string, e: string): string },
  path: { join(...p: string[]): string; basename(p: string, ext?: string): string },
  thuMucs: string[],
  daCo: MoTaKieuCaption[] = KIEU_CAPTION,
): MoTaKieuCaption[] {
  const tenCoSan = new Set(daCo.map((k) => k.mogrt).filter(Boolean) as string[])
  const mau = daCo.find((k) => k.ma === 'boxed') ?? daCo[daCo.length - 1]
  const ra: MoTaKieuCaption[] = []
  const daThay = new Set<string>()
  for (const tm of thuMucs) {
    let ds: string[] = []
    try {
      if (!fs.existsSync(tm)) continue
      ds = fs.readdirSync(tm)
    } catch {
      continue
    }
    for (const f of ds) {
      if (!/\.mogrt$/i.test(f)) continue
      const ten = path.basename(f, f.slice(f.lastIndexOf('.')))
      if (tenCoSan.has(ten) || daThay.has(ten)) continue
      daThay.add(ten)
      const duongDan = path.join(tm, f).replace(/\\/g, '/')
      let ghiDe: Partial<MoTaKieuCaption> = {}
      try {
        const j = path.join(tm, ten + '.json')
        if (fs.existsSync(j)) ghiDe = JSON.parse(fs.readFileSync(j, 'utf8')) as Partial<MoTaKieuCaption>
      } catch {
        /* JSON hỏng thì coi như không có — đừng vì một file phụ mà mất cả kiểu */
      }
      const nhan = ten.indexOf(TIEN_TO_FILE) === 0 ? ten.slice(TIEN_TO_FILE.length) : ten
      ra.push({
        ma: 'tuy:' + ten,
        ten: nhan,
        mo: 'Kiểu riêng — file .mogrt trong thư mục kiểu caption',
        mogrt: ten,
        inHoa: false,
        noiBat: false,
        karaoke: false,
        gioiHan: mau.gioiHan,
        pxMoiKyTu: mau.pxMoiKyTu,
        ...ghiDe,
        mogrtPath: duongDan,
        tuyChinh: true,
      })
    }
  }
  return ra
}

/**
 * Vị trí dọc của caption, tính bằng % chiều cao COMP (1920 px, đặt ở tâm sequence).
 *
 * Dọc 9:16 (1080×1920): comp cao bằng sequence → 75% = 1440/1920, chữ nằm dưới
 * vùng mặt, trên vùng nút TikTok/Reels.
 * Ngang 16:9 (1920×1080): comp thò ra 420 px trên và dưới → 70% comp = 1344
 * → 924/1080 trên sequence ≈ 85%, đúng vị trí phụ đề chuẩn.
 */
export function viTriYTheoKhung(khung: KieuKhung): number {
  return khung === 'doc' ? 75 : 70
}

/** Một khối caption đã sẵn sàng đặt lên sequence. Mốc trên trục SEQUENCE. */
export interface KhoiCaption {
  tu: number
  den: number
  /** Chữ đã xuống dòng bằng `\r` (After Effects dùng CR cho xuống dòng). */
  chu: string
  /** Số thứ tự từ được tô (1-based). 0 = không tô. */
  hl: number
  /** Mốc bắt đầu từng từ, giây tính từ đầu khối, nối bằng dấu phẩy. Rỗng = không karaoke. */
  moc: string
  /** Cỡ chữ % (tham số `Text Size` của template). 100 = cỡ gốc; nhỏ hơn khi có từ dài tràn khung. */
  co: number
}

/** Chữ cái/số của một từ — bỏ dấu câu để đo độ dài "thật". */
function doDaiChu(tu: string): number {
  return tu.replace(/[^\p{L}\p{N}]/gu, '').length
}

/**
 * Từ nổi bật = từ DÀI NHẤT trong khối (hoà thì lấy từ SAU — nhấn thường rơi
 * về cuối). Toàn từ ngắn dưới 3 chữ cái thì không tô — tô "là", "và" nhìn vô lý.
 * Hormozi thật tô theo ý nghĩa; chưa có máy hiểu nghĩa thì độ dài là thước rẻ
 * và đoán trúng danh từ/động từ đủ thường xuyên.
 */
export function chonTuNoiBat(tu: string[]): number {
  let tot = 0
  let dai = 0
  for (let i = 0; i < tu.length; i++) {
    const d = doDaiChu(tu[i])
    if (d >= dai) {
      dai = d
      tot = i + 1
    }
  }
  return dai >= 3 ? tot : 0
}

/**
 * Mốc karaoke: giây bắt đầu từng từ tính từ đầu khối.
 *
 * Có đủ mốc từ thật của Whisper (đúng bằng số từ) thì dùng; không thì chia đều.
 * Mốc đầu luôn 0 (từ đầu sáng ngay khi khối hiện), dãy không giảm.
 */
export function mocKaraoke(
  soTu: number,
  tu: number,
  den: number,
  tuCau?: { giay: number }[],
): string {
  const trong = tuCau ? tuCau.filter((t) => t.giay >= tu - 0.02 && t.giay < den) : []
  let offs: number[]
  if (trong.length === soTu && soTu > 0) {
    offs = trong.map((t) => Math.max(0, t.giay - tu))
    offs[0] = 0
    for (let i = 1; i < offs.length; i++) offs[i] = Math.max(offs[i], offs[i - 1])
  } else {
    const dai = Math.max(0, den - tu)
    offs = Array.from({ length: soTu }, (_, i) => (dai * i) / Math.max(1, soTu))
  }
  return offs.map((x) => x.toFixed(2)).join(',')
}

/**
 * Câu Whisper (mốc FILE GỐC) → khối caption trên trục SEQUENCE theo một kiểu.
 *
 * Đi đúng đường của `sinhSrt`: quy đổi mốc → sửa từ → cắt câu dài theo giới hạn
 * CỦA KIỂU (không phải giới hạn caption track) → xuống dòng cân → in hoa nếu kiểu
 * cần → chọn từ nổi bật / mốc karaoke.
 *
 * ☠️ Khối KHÔNG được đè nhau trên cùng track: `importMGT` đặt clip sau lên chỗ
 * clip trước là hành vi không kiểm soát được. Câu Whisper thỉnh thoảng chồng mép
 * vài chục ms → kẹp `den` của khối trước về `tu` của khối sau.
 */
export function dungKhoiCaption(
  cauGoc: Cau[],
  bang: Moc[],
  bangSua: ThayTu[],
  kieu: MoTaKieuCaption,
  khung: KieuKhung,
  tuTinCay?: { chu: string; giay: number }[],
  rongKhungPx = 0,
): KhoiCaption[] {
  const gh = kieu.gioiHan[khung]
  const ra: KhoiCaption[] = []

  for (const c of cauGoc) {
    const m = quyDoiCau(bang, c)
    if (!m) continue
    const chu = suaTu(c.chu, bangSua).trim()
    if (!chu) continue

    const tuCau = tuTinCay
      ? tuTinCay
          .filter((t) => t.giay >= c.tu - 0.001 && t.giay < c.den)
          .map((t) => ({ giay: doiMoc(bang, t.giay) }))
          .filter((t) => t.giay >= 0)
      : undefined

    const khoi = catCauDai({ tu: m.tu, den: m.den, chu }, gh, tuCau)
    for (const k of khoi) {
      const tuKhoi = k.chu.split(' ').filter(Boolean)
      if (!tuKhoi.length) continue
      const dongs = xuongDong(k.chu, gh)
      let hien = dongs.join('\r')
      if (kieu.inHoa) hien = hien.toUpperCase()
      ra.push({
        tu: k.tu,
        den: Math.max(k.den, k.tu + 0.1),
        chu: hien,
        hl: kieu.noiBat ? chonTuNoiBat(tuKhoi) : 0,
        moc: kieu.karaoke ? mocKaraoke(tuKhoi.length, k.tu, k.den, tuCau) : '',
        co: coChu(dongs, kieu, khung, rongKhungPx),
      })
    }
  }

  // Không để hai khối đè nhau (xem chú thích đầu hàm). KHÔNG VỨT khối nào —
  // bản đầu 22/08 bỏ khối "gần như trùng mốc" và bộ kiểm trên 765 câu thật bắt
  // được ngay: MẤT CHỮ. Đè nhau thì dồn khối sau lùi ra sau khối trước.
  ra.sort((a, b) => a.tu - b.tu)
  for (let i = 1; i < ra.length; i++) {
    const truoc = ra[i - 1]
    const k = ra[i]
    if (k.tu >= truoc.den) continue
    if (k.tu > truoc.tu + 0.1) {
      truoc.den = k.tu // cắt ngắn khối trước
    } else {
      k.tu = truoc.den // khối trước quá ngắn để cắt — đẩy khối sau ra sau nó
      if (k.den < k.tu + 0.1) k.den = k.tu + 0.1
    }
  }
  return ra
}

/** Dấu ngăn cách khi gửi sang host — hai ký tự điều khiển không bao giờ có trong lời nói. */
export const PHAN_CACH_TRUONG = '\u001F'
export const PHAN_CACH_KHOI = '\u001E'

/** Mã hoá một lô khối thành chuỗi cho `ac_datCaptionMogrt`. */
export function maHoaKhoi(khoi: KhoiCaption[]): string {
  return khoi
    .map((k) =>
      [k.tu.toFixed(3), k.den.toFixed(3), k.chu, String(k.hl), k.moc, String(k.co)].join(
        PHAN_CACH_TRUONG,
      ),
    )
    .join(PHAN_CACH_KHOI)
}
