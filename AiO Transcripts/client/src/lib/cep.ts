import { dich } from '../ngonngu'

/**
 * cep.ts — lớp bọc CSInterface (đã nạp global qua <script> trong index.html).
 * Chép cách làm từ AiO Editing — đã chạy thật trong Premiere từ 1.0.0.
 *
 * Câu báo lỗi ở đây dùng `dich()` chứ KHÔNG dùng `useNgonNgu()`: đây là hàm
 * thường, không phải component — gọi hook trong này là vi phạm luật hook.
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

/**
 * Tên sequence đang mở — đọc thẳng, KHÔNG cần nạp host (không gọi hàm `ac_*`
 * nào nên không phụ thuộc `$.evalFile`).
 *
 * Vì sao cần: panel KHÔNG có sự kiện "người dùng đổi sequence" từ Premiere.
 * Vấp 30/07/2026 — anh Tiến mở 3 sequence, cả 3 đều thấy chung một khối kết
 * quả "1.101 câu" của lần chạy cuối, và nút "Xoá 60 marker" đếm trên sequence
 * cũ. Cách duy nhất để biết sequence đổi là hỏi lại tên nó theo nhịp.
 */
export async function tenSequenceDangMo(): Promise<string> {
  const raw = await evalScript(
    '(function(){try{var s=app.project.activeSequence;return s?String(s.name):""}catch(e){return ""}})()',
  )
  return !raw || raw.indexOf('EvalScript error') >= 0 ? '' : raw
}

/**
 * Danh sách MỌI sequence trong project + cái nào đang mở — cho ô chọn sequence.
 *
 * Vì sao có (anh Tiến 31/07): panel làm việc NGẦM trên "sequence đang mở",
 * mà luồng shorts của Re-Frames đổi sequence liên tục → phụ đề/marker rơi lên
 * sai chỗ, *"chúng nó bị lưu đè và hiển thị không đúng"*. Chọn tường minh +
 * ghim theo ID (không theo tên — tên có thể trùng) là sửa gốc.
 */
export async function danhSachSequence(): Promise<{ id: string; ten: string; dangMo: boolean }[]> {
  const raw = await evalScript(
    '(function(){try{var a=app.project;if(!a)return "";var act=a.activeSequence?String(a.activeSequence.sequenceID):"";var out=[act];for(var i=0;i<a.sequences.numSequences;i++){var s=a.sequences[i];out.push(String(s.sequenceID)+"|~|"+String(s.name))}return out.join("|~~|")}catch(e){return ""}})()',
  )
  if (!raw || raw.indexOf('EvalScript error') >= 0) return []
  const phan = raw.split('|~~|')
  const act = phan[0]
  return phan.slice(1).map((d) => {
    const i = d.indexOf('|~|')
    const id = d.slice(0, i)
    return { id, ten: d.slice(i + 3), dangMo: id === act }
  })
}

/** Mở (kích hoạt) sequence theo ID. Dùng cho ô chọn VÀ để GHIM lại đúng
 *  sequence trước khi gắn phụ đề/marker — người dùng có thể đã bấm sang
 *  sequence khác trong mấy phút panel đang nghe. */
export async function moSequenceTheoId(id: string): Promise<boolean> {
  const raw = await evalScript(
    '(function(){try{for(var i=0;i<app.project.sequences.numSequences;i++){var s=app.project.sequences[i];if(String(s.sequenceID)==="' +
      esc(id) +
      '"){app.project.activeSequence=s;return "OK"}}return "KHONG"}catch(e){return "LOI"}})()',
  )
  return raw === 'OK'
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
        message: dich(
          'Chưa khoanh vùng cần cắt.\nTrên timeline: đặt điểm vào bằng phím I, điểm ra bằng phím O, rồi bấm lại.',
        ),
      }
    case 'VUNG_KHONG_CO_CLIP':
      return {
        canLam: true,
        message: dich(
          'Vùng vừa khoanh không trùm lên clip nào có file gốc. Khoanh lại cho trúng clip.',
        ),
      }
    case 'KHONG_CO_DOAN_GIU':
      return {
        canLam: true,
        message: dich('Không còn đoạn nào để giữ — nới ngưỡng im lặng rồi chạy lại.'),
      }
    case 'CLIP_DA_DOI':
      return {
        canLam: true,
        message: `Timeline đã thay đổi giữa chừng (${tham}). Bấm lại để chạy từ đầu.`,
      }
    case 'CON_CLIP_SAU_VUNG':
      return {
        canLam: true,
        message:
          // ⚠️ Câu đầu có `${}` nên không khớp khoá nào — còn nguyên tiếng Việt.
          `Sau vùng anh khoanh còn ${tham} clip nữa, nên không cắt tại chỗ được.\n` +
          dich('Cắt tại chỗ làm ngắn phần trong vùng lại, mà Premiere không cho panel dồn ') +
          dich('phần phía sau lên — sẽ hở một khoảng trống.\n') +
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
        message: dich(
          'Mất dấu sequence giữa chừng (có thể Premiere đã được khởi động lại). Bấm lại để chạy từ đầu.',
        ),
      }
    case 'SRT_KHONG_DOC_DUOC':
      return {
        canLam: false,
        message:
          // ⚠️ Câu đầu có `${}` nên không khớp khoá nào — còn nguyên tiếng Việt.
          `Premiere không đọc được file phụ đề:\n${tham}\n` +
          dich(
            'Nếu file nằm trong %APPDATA% thì Premiere Beta không thấy — phải để cạnh video gốc.',
          ),
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

/**
 * Tách các dòng "khoá=giá trị" mà host trả về (chỉ lấy dòng đầu mỗi khoá).
 *
 * ☠️ ĐỌC KẾT QUẢ HOST THÌ DÙNG HÀM NÀY — đừng tự dựng regex từ template
 * literal. Vấp 30/07/2026: ba hàm của khối dọn dẹp dựng regex bằng template
 * literal với lớp ký tự "\d". Trong chuỗi JS đó không phải escape hợp lệ nên
 * dấu gạch chéo rụng mất, pattern thành "(-?d+)" — đi tìm chữ "d" nghĩa đen.
 * Host trả `marker=60` mà panel đọc ra **0**, nên nút "Xoá 60 marker" không bao
 * giờ hiện dù sequence có đủ 60 marker. Không ném lỗi, không log gì: hỏng câm.
 * Tách theo dòng thì không có tầng escape nào để sai.
 */
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

/* ══════════════════════════════════════════════════════════════════════════
   ĐƯỜNG RA — xoá thứ panel đã tạo
   ══════════════════════════════════════════════════════════════════════════
   Anh Tiến 30/07: *"thêm nút xoá scripts và xoá marker trong transcripts nữa"*.
   Luật đã chốt từ lâu: **có đường VÀO thì phải có đường RA**. */

/**
 * Đếm thứ panel đã tạo trên sequence đang mở.
 *
 * Nút xoá phải nói **hậu quả bằng con số thật** trước khi bấm — bày một nút
 * "Xoá" trơ mà không nói xoá bao nhiêu là bắt người ta bấm trong bóng tối.
 */
export async function demDoPanelTao(): Promise<{ marker: number; itemSrt: number }> {
  const res = parseResult(await evalScript('ac_demDoPanelTao()'))
  if (!res.ok) return { marker: 0, itemSrt: 0 }
  const kv = parseKV(res.message)
  const so = (k: string) => parseInt(kv[k] ?? '0', 10) || 0
  return { marker: so('marker'), itemSrt: so('itemSrt') }
}

/** Xoá marker do panel đặt. Marker người dùng tự đặt KHÔNG bị chạm. */
export async function xoaMarker(): Promise<{ daXoa: number; conLai: number; loi: HostLoi | null }> {
  const res = parseResult(await evalScript('ac_xoaMarker()'))
  if (!res.ok) return { daXoa: 0, conLai: 0, loi: dichLoi(res.message) }
  const kv = parseKV(res.message)
  const so = (k: string) => parseInt(kv[k] ?? '0', 10) || 0
  return { daXoa: so('daXoa'), conLai: so('conLai'), loi: null }
}

/**
 * Gỡ phụ đề do panel tạo khỏi project.
 *
 * ⚠️ File `.srt` trên đĩa GIỮ NGUYÊN — cố ý. Người dùng có thể đã sửa tay, và
 * xoá file của người ta là việc panel không được tự làm.
 */
export async function xoaPhuDe(): Promise<{ daXoa: number; conLai: number; loi: HostLoi | null }> {
  const res = parseResult(await evalScript('ac_xoaPhuDe()'))
  if (!res.ok) return { daXoa: 0, conLai: 0, loi: dichLoi(res.message) }
  const kv = parseKV(res.message)
  const so = (k: string) => parseInt(kv[k] ?? '0', 10) || 0
  return { daXoa: so('daXoa'), conLai: so('conLai'), loi: null }
}
