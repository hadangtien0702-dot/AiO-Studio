import { dich } from '../ngonngu'
/**
 * cep.ts — lớp bọc CSInterface (đã nạp global qua <script> trong index.html).
 * Chép cách làm từ AiO Editing — đã chạy thật trong Premiere từ 1.0.0.
 */

declare global {
  interface Window {
    __adobe_cep__?: unknown
    CSInterface?: new () => CSInterfaceLike
    SystemPath?: Record<string, string>
  }
}

interface CSInterfaceLike {
  isInHost(): boolean
  evalScript(script: string, cb: (result: string) => void): void
  getApplicationID(): string | null
  getSystemPath(pathType: string): string
}

let _cs: CSInterfaceLike | null = null

export function cs(): CSInterfaceLike | null {
  if (_cs) return _cs
  if (typeof window === 'undefined' || !window.CSInterface) return null
  _cs = new window.CSInterface()
  return _cs
}

/** Có đang chạy bên trong Premiere không. */
export function isInHost(): boolean {
  const c = cs()
  return !!c && c.isInHost()
}

/** Chạy ExtendScript, trả kết quả dạng Promise<string>. */
export function evalScript(script: string): Promise<string> {
  return new Promise((resolve) => {
    const c = cs()
    if (!c) {
      resolve('')
      return
    }
    c.evalScript(script, (result: string) => resolve(result))
  })
}

export interface HostResult {
  ok: boolean
  message: string
}

/** Phân tích chuỗi "OK:..." / "ERR:..." từ ExtendScript. */
export function parseResult(raw: string): HostResult {
  if (!raw) return { ok: false, message: dich('Không có phản hồi từ Premiere') }
  if (raw.indexOf('OK:') === 0) return { ok: true, message: raw.slice(3) }
  if (raw.indexOf('ERR:') === 0) return { ok: false, message: raw.slice(4) }
  return { ok: false, message: raw }
}

/** Đường dẫn thư mục extension trên đĩa (để tìm bin/ffmpeg.exe). */
export function extensionPath(): string {
  const c = cs()
  if (!c || !window.SystemPath) return ''
  return c.getSystemPath(window.SystemPath.EXTENSION)
}

/**
 * NẠP LẠI file ExtendScript từ đĩa. Gọi trước mọi lệnh host.
 *
 * ☠️ Bẫy đã trả giá 2026-07-28: Premiere nạp `host/index.jsx` ĐÚNG MỘT LẦN lúc
 * extension khởi động. Cài bản mới rồi bấm reload panel thì **giao diện là bản
 * mới nhưng host vẫn là bản cũ** — mọi hàm mới trả về "EvalScript error." và
 * nhìn như panel hỏng toàn tập. Đo được: hàm cũ đã xoá khỏi file vẫn `typeof
 * === 'function'`, hàm mới thì `undefined`.
 *
 * `$.evalFile` đọc thẳng file trên đĩa nên luôn lấy bản mới nhất. Rẻ (vài ms),
 * nên gọi mỗi lần bấm nút thay vì tin là đã nạp.
 *
 * ☠️ BẪY THỨ HAI, mất thêm một vòng đo: **KHÔNG được bọc `$.evalFile` trong một
 * hàm.** `$.evalFile` thực thi nội dung file trong scope của chỗ GỌI nó — bọc
 * `(function(){ $.evalFile(...) })()` thì mọi hàm trong file rơi vào scope hàm
 * ẩn danh đó rồi biến mất cùng nó. Triệu chứng y hệt "file lỗi cú pháp": không
 * ném lỗi, mà cũng chẳng có hàm nào. Phải gọi ở CẤP NGOÀI CÙNG; `try/catch`
 * cấp ngoài cùng thì vẫn giữ nguyên scope toàn cục.
 */
export async function napLaiHost(): Promise<boolean> {
  const ext = extensionPath()
  if (!ext) return false
  const p = ext.replace(/\\/g, '/') + '/host/index.jsx'
  const raw = await evalScript(
    `var __acNap='OK'; try { $.evalFile("${p}") } catch(e) { __acNap='ERR:'+e.toString() } __acNap`,
  )
  return raw.indexOf('OK') === 0
}

/** Đo môi trường — chỉ đọc. Giữ lại để soi khi có gì đó không hiểu nổi. */
export async function probe(): Promise<HostResult> {
  return parseResult(await evalScript('ac_probe()'))
}

// ── Dịch mã lỗi của host ────────────────────────────────────────────────

/**
 * Vì sao cần lớp dịch này: `host/*.jsx` viết ASCII không dấu (quy ước dự án —
 * file ExtendScript hay vỡ font). In thẳng chuỗi đó ra màn hình thì người dùng
 * đọc phải một câu tiếng Việt không dấu, nhìn y như lỗi hệ thống. Host trả MÃ,
 * panel viết CÂU.
 *
 * `canLam` = việc người dùng cần làm, KHÔNG phải hỏng hóc → không tô đỏ.
 * Đây là luật của anh Tiến: chỉ báo động khi THẤT BẠI thật.
 */
export interface HostLoi {
  canLam: boolean
  message: string
}

export function dichLoi(raw: string): HostLoi {
  const vach = raw.indexOf('|')
  const ma = vach >= 0 ? raw.slice(0, vach) : ''
  const tham = vach >= 0 ? raw.slice(vach + 1) : ''

  switch (ma) {
    case 'CHUA_MO_PROJECT':
      return { canLam: true, message: dich('Chưa mở project nào.') }
    case 'CHUA_MO_SEQUENCE':
      return { canLam: true, message: dich('Chưa mở sequence nào.') }
    case 'CHUA_KHOANH_VUNG':
      return {
        canLam: true,
        message:
          'Chưa khoanh vùng cần cắt.\nTrên timeline: đặt điểm vào bằng phím I, điểm ra bằng phím O, rồi bấm lại.',
      }
    case 'VUNG_KHONG_CO_CLIP':
      return {
        canLam: true,
        message: dich('Vùng vừa khoanh không trùm lên clip nào có file gốc. Khoanh lại cho trúng clip.'),
      }
    case 'KHONG_CO_DOAN_GIU':
      return { canLam: true, message: dich('Không còn đoạn nào để giữ — nới ngưỡng im lặng rồi chạy lại.') }
    case 'CLIP_DA_DOI':
      return {
        canLam: true,
        message: `Timeline đã thay đổi giữa chừng (${tham}). Bấm lại để chạy từ đầu.`,
      }
    case 'CON_CLIP_SAU_VUNG':
      return {
        canLam: true,
        message:
          `Sau vùng anh khoanh còn ${tham} clip nữa, nên không cắt tại chỗ được.\n` +
          dich('Cắt tại chỗ làm ngắn phần trong vùng lại, mà Premiere không cho panel dồn ') +
          'phần phía sau lên — sẽ hở một khoảng trống.\n' +
          dich('Cách làm: khoanh tới hết timeline, hoặc đổi sang "Tạo sequence mới".'),
      }
    case 'THIEU_API':
      return { canLam: false, message: `Bản Premiere này không có \`${tham}\`.` }
    case 'TAO_SEQ_LOI':
      return { canLam: false, message: `Tạo sequence mới thất bại: ${tham}` }
    case 'SEQ_MOI_KHONG_CO_TRACK':
      return { canLam: false, message: `Sequence mới không có track ${tham} nào.` }
    case 'MAT_SEQUENCE_GOC':
    case 'MAT_SEQUENCE_MOI':
      return {
        canLam: true,
        message:
          dich('Mất dấu sequence giữa chừng (có thể Premiere đã được khởi động lại). Bấm lại để chạy từ đầu.'),
      }
    case 'SRT_KHONG_DOC_DUOC':
      return {
        canLam: false,
        message:
          `Premiere không đọc được file phụ đề:\n${tham}\n` +
          dich('Nếu file nằm trong %APPDATA% thì Premiere Beta không thấy — phải để cạnh video gốc.'),
      }
    case 'NHAP_SRT_LOI':
      return { canLam: false, message: `Không nhập được file phụ đề vào project: ${tham}` }
    case 'TAO_CAPTION_LOI':
      return { canLam: false, message: `Không tạo được track phụ đề: ${tham}` }
    default:
      return { canLam: false, message: raw }
  }
}

// ── Giai đoạn 2: đọc vùng I–O và dựng lại ───────────────────────────────

/** Bọc một chuỗi để nhét an toàn vào lệnh ExtendScript (đường dẫn có dấu \). */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')
}

/** Tách các dòng "khoá=giá trị" mà host trả về (chỉ lấy dòng đầu mỗi khoá). */
export function parseKV(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const i = line.indexOf('=')
    if (i > 0 && !(line.slice(0, i) in out)) out[line.slice(0, i).trim()] = line.slice(i + 1)
  }
  return out
}

/** Một clip (hoặc phần clip) nằm trong vùng anh khoanh. */
export interface ClipVung {
  kind: 'V' | 'A'
  trackIdx: number
  clipOrd: number
  /** Vị trí trên sequence. */
  seqTu: number
  seqDen: number
  /** Vị trí tương ứng trên FILE GỐC — hai cái lệch nhau khi clip đã bị trim đầu. */
  srcTu: number
  srcDen: number
  speed: number
  path: string
}

export interface VungCat {
  seqName: string
  fps: number
  vungTu: number
  vungDen: number
  clips: ClipVung[]
}

/**
 * Đọc MỖI mốc I–O, không duyệt clip. CHỈ ĐỌC.  (2026-08-18)
 *
 * Dùng cho vòng thăm dò mỗi giây: người dùng bấm I/O trong Premiere thì panel
 * không hề hay biết — không có sự kiện nào bắn sang. Hàm này rẻ nên hỏi liên
 * tục được; `getRangeClips()` bên dưới duyệt mọi clip trên mọi track nên chỉ
 * gọi khi mốc ĐÃ ĐỔI THẬT.
 */
export async function getRange(): Promise<{
  tu: number
  den: number
  fps: number
  seqName: string
} | null> {
  const res = parseResult(await evalScript('ac_getRange()'))
  if (!res.ok) return null
  const kv = parseKV(res.message)
  const tu = Number(kv.in)
  const den = Number(kv.out)
  const fps = Number(kv.fps)
  if (!Number.isFinite(tu) || !Number.isFinite(den) || den <= tu) return null
  // `seqName` đi kèm sẵn trong cùng lời gọi — dùng nó làm dấu hiệu "người dùng
  // đã đổi sang sequence khác", khỏi tốn thêm một lượt hỏi host.
  return {
    tu,
    den,
    fps: Number.isFinite(fps) && fps > 0 ? fps : 30,
    seqName: kv.seqName ?? '',
  }
}

export interface MotSequence {
  id: string
  ten: string
  dangMo: boolean
}

/**
 * Danh sách sequence trong project. CHỈ ĐỌC.
 *
 * ☠️ Định danh bằng `id`, KHÔNG bằng tên — Premiere cho phép hai sequence
 * trùng tên, và trong project của anh Tiến đã có sẵn cảnh đó (`test` và
 * `test - autocut 1103` sinh ra từ cùng một gốc).
 */
export async function dsSequence(): Promise<MotSequence[]> {
  const res = parseResult(await evalScript('ac_dsSequence()'))
  if (!res.ok) return []
  const ra: MotSequence[] = []
  for (const line of res.message.split(/\r?\n/)) {
    if (!line.startsWith('seq=')) continue
    const f = line.slice(4).split('\t')
    if (f.length < 3) continue
    // Tên để CUỐI và ghép lại: nó có thể chứa dấu tab của người dùng.
    ra.push({ id: f[0], dangMo: f[1] === '1', ten: f.slice(2).join('\t') })
  }
  return ra
}

/** Chuyển Premiere sang sequence khác. GHI — nhưng chỉ đổi cái đang mở. */
export async function moSequence(id: string): Promise<boolean> {
  const res = parseResult(await evalScript(`ac_moSequence(${JSON.stringify(id)})`))
  return res.ok
}

/** Đọc vùng I–O đang khoanh và các clip nằm trong đó. CHỈ ĐỌC. */
export async function getRangeClips(): Promise<{ vung: VungCat | null; loi: HostLoi | null }> {
  const res = parseResult(await evalScript('ac_getRangeClips()'))
  if (!res.ok) return { vung: null, loi: dichLoi(res.message) }

  const kv = parseKV(res.message)
  const clips: ClipVung[] = []
  for (const line of res.message.split(/\r?\n/)) {
    if (!line.startsWith('clip=')) continue
    const f = line.slice(5).split(',')
    if (f.length < 9) continue
    clips.push({
      kind: f[0] === 'A' ? 'A' : 'V',
      trackIdx: parseInt(f[1], 10),
      clipOrd: parseInt(f[2], 10),
      seqTu: parseFloat(f[3]),
      seqDen: parseFloat(f[4]),
      srcTu: parseFloat(f[5]),
      srcDen: parseFloat(f[6]),
      speed: parseFloat(f[7]),
      // Đường dẫn để ở cuối dòng vì nó có thể chứa dấu phẩy — ghép lại hết.
      path: f.slice(8).join(','),
    })
  }

  return {
    vung: {
      seqName: kv.seqName ?? '',
      fps: parseFloat(kv.fps ?? '30'),
      vungTu: parseFloat(kv.in ?? '0'),
      vungDen: parseFloat(kv.out ?? '0'),
      clips,
    },
    loi: null,
  }
}

/** Kết quả dựng, đọc từ host. Mọi con số đều là ĐO LẠI trên timeline thật. */
export interface KetQuaDung {
  seqMoi: string
  seqGoc: string
  thongSo: string
  yeuCauDoan: number
  yeuCauGiay: number
  hinhClip: number
  hinhGiay: number
  hinhCuoi: number
  tiengClip: number
  tiengGiay: number
  tiengCuoi: number
  tiengTuTheo: boolean
  soLoi: number
  loiDau: string
}

/**
 * Gắn file .srt lên sequence đang mở thành track phụ đề.
 *
 * File phải nằm NGOÀI `%APPDATA%` (Premiere Beta ảo hoá AppData nên không thấy
 * file mới tạo ở đó) — panel ghi cạnh video gốc của người dùng.
 */
export async function ganPhuDe(srtPath: string): Promise<{ ok: boolean; loi: HostLoi | null }> {
  // Dấu `/` bắt buộc: `\2` trong chuỗi ExtendScript là escape bát phân.
  const p = srtPath.replace(/\\/g, '/')
  const res = parseResult(await evalScript(`ac_ganPhuDe("${esc(p)}")`))
  if (!res.ok) return { ok: false, loi: dichLoi(res.message) }
  return { ok: true, loi: null }
}

/**
 * Đặt marker tại những chỗ máy nghe không chắc, để soát bằng phím M.
 * @param ds "giây|từ|điểm;giây|từ|điểm;..."
 */
export async function datMarker(
  ds: string,
): Promise<{ daDat: number; daXoa: number; loi: HostLoi | null }> {
  const res = parseResult(await evalScript(`ac_datMarker("${esc(ds)}")`))
  if (!res.ok) return { daDat: 0, daXoa: 0, loi: dichLoi(res.message) }
  const kv = parseKV(res.message)
  return {
    daDat: parseInt(kv.daDat ?? '0', 10) || 0,
    daXoa: parseInt(kv.daXoa ?? '0', 10) || 0,
    loi: null,
  }
}

/**
 * Dựng một sequence MỚI chỉ gồm các đoạn cần giữ.
 * @param keeps "kind,trackIdx,clipOrd,srcTu,srcDen;..."
 */
export async function buildKeep(
  keeps: string,
  tenSeq: string,
  taoMoi = true,
): Promise<{ kq: KetQuaDung | null; loi: HostLoi | null }> {
  const raw = await evalScript(
    `ac_buildKeep("${esc(keeps)}", "${esc(tenSeq)}", "${taoMoi ? 1 : 0}")`,
  )
  const res = parseResult(raw)
  if (!res.ok) return { kq: null, loi: dichLoi(res.message) }

  const kv = parseKV(res.message)
  const n = (k: string) => parseFloat(kv[k] ?? '0') || 0
  return {
    kq: {
      seqMoi: kv.seqMoi ?? '',
      seqGoc: kv.seqGoc ?? '',
      thongSo: kv.thongSo ?? '',
      yeuCauDoan: n('yeuCauDoan'),
      yeuCauGiay: n('yeuCauGiay'),
      hinhClip: n('hinhClip'),
      hinhGiay: n('hinhGiay'),
      hinhCuoi: n('hinhCuoi'),
      tiengClip: n('tiengClip'),
      tiengGiay: n('tiengGiay'),
      tiengCuoi: n('tiengCuoi'),
      tiengTuTheo: kv.tiengTuTheo === '1',
      soLoi: n('soLoi'),
      loiDau: kv.loiDau ?? '',
    },
    loi: null,
  }
}

/**
 * Dựng lại vùng vừa bị cắt tại chỗ, về đúng như trước khi cắt.
 *
 * ☠️ KHÔNG dựa vào Ctrl+Z. Cắt tại chỗ chèn N đoạn = **N bước undo riêng**, nên
 * bấm Ctrl+Z một lần chỉ gỡ một đoạn. Đo thật 29/07: anh Tiến cắt 17 đoạn rồi
 * Ctrl+Z → sequence còn **1 clip 3,27 giây**. Chính tôi cũng vấp: undo trong
 * vòng lặp → **0 clip, trống trơn**, redo không cứu được.
 *
 * Premiere Beta 26.5 **không có** API gộp undo (`app.beginUndoGroup` và bản QE
 * đều `undefined` — đã đo), nên không thể làm "một bước undo duy nhất".
 *
 * Cách chắc hơn: panel nhớ sẵn mô tả clip gốc từ lúc đọc vùng, rồi dựng lại từ
 * đó. Không phụ thuộc undo history của Premiere.
 */
export async function hoanTacTaiCho(
  clips: ClipVung[],
): Promise<{ ok: boolean; hinhClip: number; hinhGiay: number; loi: HostLoi | null }> {
  // Đường dẫn để CUỐI mỗi dòng vì nó có thể chứa dấu phẩy.
  const mo = clips
    .map((c) => `${c.kind},${c.trackIdx},${c.seqTu},${c.seqDen},${c.srcTu},${c.srcDen},${c.path}`)
    .join(';')
  const res = parseResult(await evalScript(`ac_hoanTacTaiCho("${esc(mo)}")`))
  if (!res.ok) return { ok: false, hinhClip: 0, hinhGiay: 0, loi: dichLoi(res.message) }
  const kv = parseKV(res.message)
  return {
    ok: (parseFloat(kv.soLoi ?? '0') || 0) === 0,
    hinhClip: parseFloat(kv.hinhClip ?? '0') || 0,
    hinhGiay: parseFloat(kv.hinhGiay ?? '0') || 0,
    loi: null,
  }
}

/**
 * Cắt NGAY TRÊN sequence đang mở, không tạo sequence mới.
 *
 * Anh Tiến 2026-07-29 muốn hai lựa chọn cho người dựng: *"một là import vào
 * sequence đó luôn, hai là tạo sequence mới"*.
 *
 * ☠️ Premiere KHÔNG cho panel làm ripple delete (đo 27/07: razor chạy, nhưng
 * `remove()` chỉ để lại lỗ trống, thử ba cách đóng lỗ đều không được). Nên host
 * làm cách khác: **xoá sạch vùng rồi chèn lại các đoạn giữ từ điểm IN** — kết
 * quả giống hệt mà không đụng QE DOM (thứ đã làm sập Premiere khi gọi sai).
 *
 * Vì vậy nó **từ chối khi còn clip phía sau vùng khoanh** (`CON_CLIP_SAU_VUNG`):
 * chèn đoạn giữ xong sẽ ngắn hơn vùng gốc, mà phần sau không dồn lên được.
 * Thà báo thẳng còn hơn để lại lỗ âm thầm.
 */
export async function catTaiCho(
  keeps: string,
  loDau = true,
): Promise<{ kq: KetQuaDung | null; loi: HostLoi | null }> {
  const raw = await evalScript(`ac_catTaiCho("${esc(keeps)}", "${loDau ? 1 : 0}")`)
  const res = parseResult(raw)
  if (!res.ok) return { kq: null, loi: dichLoi(res.message) }

  const kv = parseKV(res.message)
  const n = (k: string) => parseFloat(kv[k] ?? '0') || 0
  return {
    kq: {
      seqMoi: kv.seqMoi ?? '',
      seqGoc: kv.seqGoc ?? '',
      thongSo: kv.thongSo ?? '',
      yeuCauDoan: n('yeuCauDoan'),
      yeuCauGiay: n('yeuCauGiay'),
      hinhClip: n('hinhClip'),
      hinhGiay: n('hinhGiay'),
      hinhCuoi: n('hinhCuoi'),
      tiengClip: n('tiengClip'),
      tiengGiay: n('tiengGiay'),
      tiengCuoi: n('tiengCuoi'),
      tiengTuTheo: kv.tiengTuTheo === '1',
      soLoi: n('soLoi'),
      loiDau: kv.loiDau ?? '',
    },
    loi: null,
  }
}

/**
 * Sequence đang mở có NHIỀU TRACK không (multicam / mic riêng từng người).
 *
 * ☠️ Phải hỏi trước khi cắt — vấp thật 2026-08-04. Anh Tiến cắt podcast bằng
 * AiO Auto Podcast (ra 2 cam + 3 track mic) rồi chạy Autocut. Đo được:
 *
 *     trước: A1 = Mic-Trọng ×37 · A2 = Mic-Trọng + Mic-Dilys · A3 = Mic-Dilys
 *     sau  : A1 = C4234 ×300   · A2 = C4234 ×300            · A3 = trống
 *
 * Mic biến mất sạch, thay bằng TIẾNG CAMERA — nhỏ hơn 15,6 dB (mic cài áo
 * −50,6 dB vs mic gắn máy quay −66,2 dB). Vì `ac_catTaiCho` xoá mọi track rồi
 * dựng lại chỉ trên V1 + A1: đúng cho video thường, sai hoàn toàn khi tiếng
 * nằm ở track riêng. Đây không phải lỗi thao tác của người dùng — cắt theo
 * người nói xong rồi cắt khoảng lặng là đường đi tự nhiên nhất của editor.
 */
export async function soTrackCoClip(): Promise<{
  trackV: number
  trackA: number
  daTrack: boolean
  loi: HostLoi | null
}> {
  const res = parseResult(await evalScript('ac_soTrackCoClip()'))
  if (!res.ok) return { trackV: 0, trackA: 0, daTrack: false, loi: dichLoi(res.message) }
  const kv = parseKV(res.message)
  return {
    trackV: parseInt(kv.trackV ?? '0', 10) || 0,
    trackA: parseInt(kv.trackA ?? '0', 10) || 0,
    daTrack: kv.daTrack === '1',
    loi: null,
  }
}

/**
 * Gom một lô đoạn giữ cho đường CẮT ĐỒNG BỘ (nhiều track).
 *
 * Khác `catTaiCho`: hợp nhất các khoảng giữ cần BIẾT HẾT trước khi cắt, nên
 * không cắt từng lô được. Panel gom hết bằng hàm này rồi gọi `dongBoChay` một
 * lần duy nhất.
 */
export async function dongBoThem(
  keeps: string,
  loDau = true,
): Promise<{ daGom: number; loi: HostLoi | null }> {
  const res = parseResult(await evalScript(`ac_dongBoThem("${esc(keeps)}", "${loDau ? 1 : 0}")`))
  if (!res.ok) return { daGom: 0, loi: dichLoi(res.message) }
  const kv = parseKV(res.message)
  return { daGom: parseInt(kv.daGom ?? '0', 10) || 0, loi: null }
}

/**
 * Cắt đồng bộ THẬT — mọi track dồn theo CÙNG MỘT trục thời gian nên hình và
 * tiếng không thể lệch nhau, và track nào ở đâu vẫn nguyên đó.
 *
 * Bộ tự kiểm chạy ngoài Premiere: `node tests/kiem-dong-bo.mjs` (20 phép).
 */
export async function dongBoChay(): Promise<{ kq: KetQuaDung | null; loi: HostLoi | null }> {
  const res = parseResult(await evalScript('ac_dongBoChay()'))
  if (!res.ok) return { kq: null, loi: dichLoi(res.message) }
  const kv = parseKV(res.message)
  const n = (k: string) => parseFloat(kv[k] ?? '0') || 0
  return {
    kq: {
      seqMoi: kv.seqMoi ?? '',
      seqGoc: kv.seqGoc ?? '',
      thongSo: kv.thongSo ?? '',
      yeuCauDoan: n('yeuCauDoan'),
      yeuCauGiay: n('yeuCauGiay'),
      hinhClip: n('hinhClip'),
      hinhGiay: n('hinhGiay'),
      hinhCuoi: n('hinhCuoi'),
      tiengClip: n('tiengClip'),
      tiengGiay: n('tiengGiay'),
      tiengCuoi: n('tiengCuoi'),
      tiengTuTheo: kv.tiengTuTheo === '1',
      soLoi: n('soLoi'),
      loiDau: kv.loiDau ?? '',
    },
    loi: null,
  }
}
