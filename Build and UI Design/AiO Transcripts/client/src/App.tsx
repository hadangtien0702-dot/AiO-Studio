/**
 * App.tsx — AiO Transcripts.
 *
 * Panel này CHỈ làm một việc: khoanh I/O → chép lời thành phụ đề gắn lên
 * sequence đang mở, kèm marker ở chỗ máy nghe không chắc.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * [2.1.0] DỌN SẠCH MÃ CẮT — 2026-07-29
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Bản tách 2.0.0 giữ nguyên bộ máy cắt của Autocut và chỉ thêm một nhánh
 * `if (chiPhuDe) … return`. Đo lại thì `autoCut(true)` là **lời gọi duy nhất**
 * trong cả file — nên toàn bộ phần sau lệnh `return` đó là **mã chết**:
 * tính điểm cắt, dựng sequence, đối chiếu số đo, nút hoàn tác, ba mức cắt,
 * component `KetQua`. Panel gánh theo mà không bao giờ chạy.
 *
 * Nặng hơn: nhánh phụ đề vẫn **lọc dải giọng nói và đo mức âm cả file** rồi
 * vứt kết quả đi — hai việc đó chỉ phục vụ quyết định CẮT. Trên video dài,
 * `locDaiGiongNoi` phải cho FFmpeg đọc lại toàn bộ WAV.
 *
 * Bản này bỏ hết. Việc còn lại đúng bốn bước: đọc vùng → tách tiếng → nghe
 * hiểu → gắn lên timeline.
 */
import { useEffect, useRef, useState } from 'react'
import {
  isInHost,
  evalScript,
  napLaiHost,
  getRangeClips,
  datMarker,
  ganPhuDe,
  demDoPanelTao,
  tenSequenceDangMo,
  danhSachSequence,
  moSequenceTheoId,
  xoaMarker,
  xoaPhuDe,
  getRange,
  xoaCaptionAiO,
  chonTrackCaption,
  datCaptionMogrt,
  extensionPath,
} from './lib/cep'
import { getFs, getPath, nodeAvailable } from './lib/node'
import { getFFmpegPath } from './services/ffmpeg'
import { mmss, type CauNoi, type Segment } from './services/plan'
import {
  MO_HINH,
  docDem,
  donWav,
  luuDem,
  nghe,
  thieuGi,
  timBoMay,
  trichTieng,
  type MaMoHinh,
} from './services/whisper'
import {
  THAY_TU_MAC_DINH,
  chonChoSoat,
  dungBangTuClip,
  gioiHanTheoKhung,
  sinhSrt,
  type Cau,
  type KieuKhung,
  type Moc,
  type ThayTu,
} from './services/srt'
import {
  KIEU_CAPTION,
  dungKhoiCaption,
  maHoaKhoi,
  quetKieuTuyChinh,
  timKieu,
  viTriYTheoKhung,
  type KieuCaption,
  type MoTaKieuCaption,
} from './services/caption-kieu'
import { nodeRequire } from './lib/node'
import MinhHoa from './MinhHoa'
import { NutDoiNgonNgu, dich } from './ngonngu'

/**
 * Các bước của một lần chạy — để vẽ ra cho người dùng thấy đang ở đâu.
 *
 * Nhãn nói VIỆC nó làm, không nói tên kỹ thuật. Số giây là ĐO THẬT trên video
 * 58 phút ngày 29/07, dùng để người dựng ước được còn phải chờ bao lâu.
 *
 * [2.1.0] Bỏ bước "Đo mức âm": nó chỉ phục vụ việc CẮT (chọn ngưỡng dB), mà
 * panel này không cắt. Bày một bước không dẫn tới đâu là bắt người ta chờ và
 * tưởng máy đang làm gì đó cho mình.
 */
/**
 * Hai khung hình, hai luật cắt câu khác nhau.
 *
 * Anh Tiến 30/07: *"phần transcripts hành cho video dạng 9:16 dạng dọc thì sẽ
 * ít từ hơn đó em… vì nó sẽ bị đè mép biên safe zone hoặc là tràn mép mất
 * chữ"*. Khung dọc chỉ rộng 9/16 = **56%** so với ngang.
 *
 * Đo thật trên 1.028 khối của video 60 phút — cả hai bộ đều **0 vượt chuẩn,
 * 0 mất chữ**. Chi tiết ở `GIOI_HAN_NGANG` / `GIOI_HAN_DOC` trong `srt.ts`.
 */
const KHUNG = [
  {
    ma: 'ngang' as KieuKhung,
    ten: 'Ngang 16:9',
    mo: 'Chuẩn phụ đề quốc tế cho video ngang',
  },
  {
    ma: 'doc' as KieuKhung,
    ten: 'Dọc 9:16',
    mo: 'Câu ngắn hơn — khỏi tràn mép, khỏi đè safe zone',
  },
] as const

const CAC_BUOC = [
  { ten: 'Đọc vùng đã khoanh', uoc: 2 },
  { ten: 'Tách tiếng khỏi video', uoc: 45 },
  { ten: 'Nghe hiểu lời nói', uoc: 177 },
  { ten: 'Gắn phụ đề lên timeline', uoc: 10 },
] as const

/** Kết quả một lần chép lời. */
interface KetPhuDe {
  soCau: number
  soTu: number
  /** Ma ngon ngu Whisper nhan ra (`-l auto`). Rong = khong doc duoc. */
  ngonNgu?: string
  duongDan: string
  ganDuoc: boolean
  /**
   * Marker chỗ Whisper nghe không chắc.
   *
   * ☠️ `soCho` bị TRẦN 60 chặt xuống (lấy 60 chỗ TỆ NHẤT — rải kín timeline
   * thì marker mất tác dụng). `tongCho` là số chỗ dưới ngưỡng THẬT, trước
   * trần. Vấp 30/07/2026: cả 3 video đều hiện "60", anh Tiến hỏi *"có thực
   * tế không hay bị ghi đè?"* — số thật là 107/220/433, panel giấu mà không
   * nói. Trần là cố ý; GIẤU trần mới là lỗi.
   */
  soat?: { soCho: number; temNhat: number; tongCho: number }
  /**
   * [2.5.0] Caption KIỂU HIỆU ỨNG (Hormozi…) đã đặt thành graphic trên timeline.
   * Có thì `ganDuoc` nói về mấy clip này, không phải caption track.
   */
  caption?: { kieu: string; soKhoi: number; soClip: number; track: number }
  buoc?: { ten: string; ket: string; giay: number }[]
  giayTong: number
}

/**
 * ☠️ CÔNG TẮC KHỐI HIỆU ỨNG — anh Tiến chốt 24/08:
 * *"vậy mình tạm thời ẩn phần tạo hiệu ứng này nha em"*.
 *
 * VÌ SAO TẮT (đo được, không phải cảm tính):
 *   1. Anh muốn hiệu ứng làm bằng đường NATIVE của Premiere ("update to graphics").
 *      Đo có đối chứng 24/08: `sequence` 42 method · `app` 34 · `qe.sequence` 63 —
 *      KHÔNG có hàm nào biến caption thành graphic, và `app` không chạy được lệnh
 *      menu. Cộng với đo 22/08: graphic do Premiere tạo thì `Source Text.setValue`
 *      trả `true` nhưng chữ TRỐNG trên hình (Adobe xác nhận API MOGRT chỉ cho AE).
 *   2. Nên đường duy nhất còn lại là MOGRT xuất từ AE — đúng thứ anh không muốn:
 *      *"khi mình làm text bên AE thì PR sẽ cho nó là một file import, sẽ rất nặng
 *      timeline"*.
 *
 * ☠️ ẨN, KHÔNG XOÁ. Toàn bộ đường chạy còn nguyên và vẫn được kiểm:
 * `lamPhuDe('hieuung')` · `ganPhuDeVao` nhánh MOGRT · host `ac_datCaptionMogrt`,
 * `ac_chonTrackCaption`, `ac_xoaCaptionAiO`, `ac_datCaptionDai` · 5 file `.mogrt`
 * trong bộ cài · `npm run kiem:caption`.
 * BẬT LẠI: đổi đúng dòng dưới thành `true`. Không phải dựng lại gì cả.
 */
const HIEN_HIEU_UNG: boolean = false

/** Kiểu caption lưu giữa các phiên — người dựng một kênh thường dùng đúng một kiểu. */
const KHOA_KIEU_CAPTION = 'aio-transcript-kieu-caption'

function docKieuCaption(): KieuCaption {
  try {
    const s = localStorage.getItem(KHOA_KIEU_CAPTION) as KieuCaption | null
    // [2.5.1] Ô này chỉ còn chọn KIỂU HIỆU ỨNG — 'mac-dinh' (caption track) đã
    // thành nút riêng, nên giá trị cũ 'mac-dinh' lưu từ 2.5.0 coi như chưa chọn.
    if (s && KIEU_CAPTION.some((k) => k.ma === s && k.mogrt)) return s
  } catch {
    /* không đọc được thì mặc định */
  }
  return 'hormozi'
}

/** Độ dài vùng đang chọn — "35,2 s" dưới một phút, "1:12" từ một phút trở lên. */
function daiVung(giay: number): string {
  if (giay < 60) return `${giay.toFixed(1)} s`
  return mmss(giay)
}

/**
 * Thư mục KIỂU RIÊNG của người dùng: `%APPDATA%\AiOStudio\caption-styles`.
 * Dùng chung cả bộ AiO (cùng chỗ với `ngonngu.json`). Tạo nếu chưa có.
 *
 * ☠️ Lấy APPDATA qua `require('process')['env'][...]` — viết `process.env.APPDATA`
 * là Vite thay bằng object RỖNG lúc build (vấp 13/08, xem `ngonngu.tsx`).
 */
function thuMucKieuRieng(): string {
  try {
    const req = nodeRequire()
    if (!req) return ''
    const env = req('process')['env'] as Record<string, string | undefined>
    const appdata = env['APPDATA']
    if (!appdata) return ''
    const fs = req('fs')
    const p = appdata.replace(/\\/g, '/') + '/AiOStudio/caption-styles'
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
    return p
  } catch {
    return ''
  }
}

/** Bộ 5 kiểu có sẵn + mọi `.mogrt` trong thư mục panel và thư mục kiểu riêng. */
function quetDsKieu(): MoTaKieuCaption[] {
  const req = nodeRequire()
  if (!req) return KIEU_CAPTION
  try {
    const fs = req('fs')
    const path = req('path')
    const tm = [extensionPath().replace(/\\/g, '/') + '/mogrt', thuMucKieuRieng()].filter(Boolean)
    return [...KIEU_CAPTION, ...quetKieuTuyChinh(fs, path, tm, KIEU_CAPTION)]
  } catch {
    return KIEU_CAPTION
  }
}

/** Mở thư mục kiểu riêng trong Explorer để người dùng thả file .mogrt vào. */
function moThuMucKieuRieng(): void {
  const req = nodeRequire()
  const p = thuMucKieuRieng()
  if (!req || !p) return
  try {
    req('child_process').exec(`explorer "${p.replace(/\//g, '\\')}"`)
  } catch {
    /* không mở được thì thôi — đường dẫn vẫn hiện trong tooltip */
  }
}

/**
 * Mở Explorer TẠI thư mục chứa một file (chọn sẵn file đó).
 * Anh Tiến 24/08: *"chỗ link này okie nè, hãy cho anh đường link kèm nút mở
 * thẳng vào folder chứa nó luôn"*. `/select,` là cờ của Explorer — mở thư mục
 * và bôi sáng đúng file, đỡ phải dò bằng mắt.
 */
function moThuMucChuaFile(duongDan: string): void {
  const req = nodeRequire()
  if (!req || !duongDan) return
  try {
    req('child_process').exec(`explorer /select,"${duongDan.replace(/\//g, '\\')}"`)
  } catch {
    /* không mở được thì thôi — đường dẫn đầy đủ vẫn nằm trong tooltip */
  }
}

/** Bảng sửa từ lưu lại giữa các phiên — càng dùng càng chuẩn. */
const KHOA_THAY_TU = 'aio-autocut-thay-tu'

function docBangSua(): ThayTu[] {
  try {
    const s = localStorage.getItem(KHOA_THAY_TU)
    if (s) return JSON.parse(s) as ThayTu[]
  } catch {
    /* hỏng thì dùng mặc định */
  }
  return THAY_TU_MAC_DINH
}

export default function App() {
  const [host, setHost] = useState(dich('(đang kiểm tra…)'))
  const [dangChay, setDangChay] = useState('')
  /**
   * Đồng hồ chạy suốt lúc làm việc.
   *
   * Anh Tiến 2026-07-28: *"em có chạy hay không em phải thay đổi trạng thái cho
   * anh biết chứ"*. Nhãn đứng im hơn một phút (tách tiếng 45s + nạp mô hình lên
   * GPU 30-60s) thì không phân biệt được ĐANG CHẠY với ĐÃ TREO — anh ấy đã mở
   * Task Manager để tự kiểm hai lần.
   */
  const [giayTroi, setGiayTroi] = useState(0)
  const [canLam, setCanLam] = useState('')
  const [loi, setLoi] = useState('')
  const [ket, setKet] = useState<KetPhuDe | null>(null)

  /** `buocIdx` = đang ở bước thứ mấy · `phanTram` < 0 = chưa đo được. */
  const [buocIdx, setBuocIdx] = useState(-1)
  const [phanTram, setPhanTram] = useState(-1)

  const [maMoHinh, setMaMoHinh] = useState<MaMoHinh>("turbo")
  /** Khung hình quyết định luật cắt câu — xem hằng `KHUNG` ở trên. */
  const [khung, setKhung] = useState<KieuKhung>('ngang')
  /**
   * [2.5.0] Kiểu caption: Mặc định (caption track) hay một trong 5 kiểu hiệu
   * ứng (mỗi khối là một graphic MOGRT sửa được). Xem `caption-kieu.ts`.
   */
  const [kieuCaption, setKieuCaption] = useState<KieuCaption>(docKieuCaption)
  /**
   * Danh sách kiểu = 5 kiểu có sẵn + kiểu người dùng tự làm bên After Effects
   * (file .mogrt trong thư mục kiểu riêng). Quét lúc mở panel, khi panel được
   * focus lại (vừa thả file xong quay lại là thấy), và sau mỗi lượt chạy.
   */
  const [dsKieu, setDsKieu] = useState<MoTaKieuCaption[]>(KIEU_CAPTION)
  const kieuDangChon = timKieu(kieuCaption, dsKieu)
  /** Kiểu cho nút "Làm hiệu ứng" — luôn là một kiểu CÓ .mogrt (kiểu riêng bị xoá
   *  khỏi thư mục thì rơi về kiểu hiệu ứng đầu tiên, không âm thầm ra caption track). */
  const kieuHieuUng = kieuDangChon.mogrt ? kieuDangChon : (dsKieu.find((k) => !!k.mogrt) ?? kieuDangChon)
  useEffect(() => {
    const quet = () => setDsKieu(quetDsKieu())
    quet()
    window.addEventListener('focus', quet)
    return () => window.removeEventListener('focus', quet)
  }, [])
  /**
   * [2.5.0] Vùng I/O đang chọn trên timeline — đọc theo nhịp 1 giây, bám theo
   * người dùng. Anh Tiến 19/08 (luật cả bộ): *"tool mình build ra nó luôn luôn
   * theo dõi thao tác của người dùng… đang đồng hành cùng mình"*. Adobe không
   * bắn sự kiện đổi I/O sang panel; không tự hỏi thì số đứng im và thành nói dối.
   */
  const [vungTin, setVungTin] = useState<{
    tu: number
    dai: number
    fps: number
    w: number
    h: number
  } | null>(null)
  const mocVungRef = useRef('')
  /** Sequence mà khung đã được tự đặt theo — đổi sequence mới tự đặt lại. */
  const seqKhungRef = useRef('')
  /**
   * Bảng sửa từ KHÔNG còn giao diện (anh Tiến chốt 29/07: *"editor sẽ sửa
   * trong phần Properties của Pr luôn"*). Giữ biến để `sinhSrt` vẫn nhận đúng
   * tham số. Đọc từ localStorage phòng khi người dùng đã nhập trước đó; không
   * có thì là bảng RỖNG.
   */
  const [bangSua] = useState<ThayTu[]>(docBangSua)
  /** Đổi số này là hình minh hoạ chạy lại từ đầu (xem `MinhHoa`). */
  const [lanMinhHoa, setLanMinhHoa] = useState(0)
  /**
   * Thứ panel đã tạo trên sequence đang mở — để nút xoá nói HẬU QUẢ BẰNG SỐ
   * THẬT. Bày nút "Xoá" trơ mà không nói xoá bao nhiêu là bắt người ta bấm
   * trong bóng tối.
   */
  const [daTao, setDaTao] = useState<{ marker: number; itemSrt: number } | null>(null)
  const [dangDon, setDangDon] = useState('')
  /**
   * ☠️ Sequence đổi thì SỐ PHẢI ĐỔI THEO — vấp 30/07/2026.
   *
   * Anh Tiến mở 3 sequence, cả 3 đều thấy chung một khối "1.101 câu · 1:50.2"
   * và hỏi *"sao cả 3 sequence này thông số lại giống nhau thế em?"*. Vì khối
   * kết quả là TRÍ NHỚ CỦA PANEL về lần chạy cuối, còn nút "Xoá N marker" đếm
   * từ lúc chạy xong — Premiere không báo cho panel biết người dùng đổi
   * sequence, nên mọi con số đứng im và thành nói dối.
   *
   * `tenSeq` = sequence đang mở (soi theo nhịp) · `tenSeqKet` = sequence của
   * lần chạy cuối. Lệch nhau thì khối kết quả phải NÓI RÕ nó là của ai.
   */
  const [tenSeq, setTenSeq] = useState('')
  const [tenSeqKet, setTenSeqKet] = useState('')
  const tenSeqRef = useRef('')
  /**
   * Ô CHỌN SEQUENCE — anh Tiến 31/07: shorts đẻ nhiều sequence, panel làm
   * việc ngầm trên "cái đang mở" nên *"bị lưu đè và hiển thị không đúng"*.
   * Danh sách theo ID (tên có thể trùng); chọn = kích hoạt trên timeline.
   * `idSeqChay` = sequence bị GHIM suốt một lượt chạy — trước khi gắn phụ
   * đề/marker sẽ kích hoạt lại đúng nó, người dùng có bấm lung tung giữa
   * chừng thì kết quả vẫn về đúng nơi.
   */
  const [dsSeq, setDsSeq] = useState<{ id: string; ten: string; dangMo: boolean }[]>([])
  const idSeqChay = useRef('')
  /**
   * [2.5.2] Sequence NGƯỜI DÙNG ĐANG THẤY trong ô chọn, cập nhật theo vòng thăm dò.
   *
   * ☠️ VẤP THẬT 24/08, đo được vì tình cờ chạy hai lượt liền nhau: panel hiện
   * «AiO-test-E2E», bấm "Làm hiệu ứng" → **37 clip caption rơi sang sequence
   * «test - autocut 1103»** của người dùng, mà panel vẫn báo thành công. Nguyên
   * nhân: lượt chạy tự hỏi lại `app.project.activeSequence` NGAY LÚC BẤM, và
   * Premiere lúc đó trả về sequence khác cái panel đang hiện (activeSequence bám
   * theo tab timeline có tiêu điểm — thay đổi được mà panel không hề hay).
   *
   * Nay: bấm chạy là **ÉP MỞ đúng sequence trong ô chọn** rồi kiểm lại, xong mới
   * đọc vùng. Đúng lời hứa ghi ngay trên ô chọn: "cái nhìn thấy = cái sẽ chạy".
   */
  const idSeqChonRef = useRef('')
  /**
   * Biên lai của TỪNG sequence trong phiên panel này. Anh Tiến 30/07, lần hai:
   * *"anh đổi sequence thì thông tin ở panel cũng phải đổi cho giống chứ em"* —
   * cảnh báo "số liệu này của sequence khác" chỉ là nửa đường; đúng nghĩa là
   * ĐỔI TAB THÌ TRÁO BIÊN LAI. Sequence chưa chạy lần nào trong phiên thì ẩn
   * biên lai (không có gì để khoe thì im lặng, đừng trưng số của người khác).
   */
  const ketTheoSeq = useRef(new Map<string, KetPhuDe>())

  /** Đếm lại sau mỗi thao tác — đừng tin con số cũ trong state. */
  async function demLai() {
    if (!isInHost()) return
    try {
      if (!(await napLaiHost())) return
      setDaTao(await demDoPanelTao())
    } catch {
      /* đếm không được thì ẩn khối dọn dẹp, không phá gì */
    }
  }


  // Đồng hồ: chạy khi có việc, dừng và trả về 0 khi xong.
  useEffect(() => {
    if (!dangChay) {
      setGiayTroi(0)
      return
    }
    const batDau = Date.now()
    const id = window.setInterval(() => setGiayTroi(Math.floor((Date.now() - batDau) / 1000)), 1000)
    return () => window.clearInterval(id)
  }, [dangChay])

  useEffect(() => {
    if (!isInHost()) {
      setHost(dich('KHÔNG chạy trong Premiere (đang mở bằng trình duyệt)'))
      return
    }
    // Nạp lại host TRƯỚC khi hỏi bất cứ điều gì — nếu không, panel mới sẽ nói
    // chuyện với host cũ và mọi hàm mới trả về "EvalScript error.".
    void napLaiHost().then(() =>
      evalScript('getHostInfo()').then((raw) => {
        const phan = raw.split('|')
        const project = phan[phan.length - 1] || '?'
        setHost(`Premiere ${phan[0] || '?'} · ${project}`)
        void demLai()
      }),
    )
  }, [])

  // Soi sequence đang mở theo nhịp — Premiere KHÔNG báo sự kiện đổi sequence.
  // Mỗi nhịp chỉ hỏi TÊN (một evalScript đọc thuộc tính, không nạp host, không
  // duyệt project); chỉ khi tên ĐỔI mới đếm lại thứ panel đã tạo. Dừng soi khi
  // đang chạy để không chen vào giữa lúc nghe hiểu.
  //
  // ☠️ NHỊP PHẢI THEO MẮT NGƯỜI, KHÔNG THEO KỊCH BẢN ĐO — vấp 30/07/2026.
  // Bản đầu đặt 4 giây; phép thử tự động (đổi sequence rồi CHỜ 6s) đạt 5/5,
  // nhưng anh Tiến bấm tab thật thì *"nó không thay đổi thông số"* — người
  // dựng liếc panel trong ~1 giây, 4 giây với UI là "đứng im". Kịch bản đo
  // kiên nhẫn hơn người thật là kịch bản đo sai. Rút còn 1 giây (đọc một
  // thuộc tính, không đáng kể), kèm chốt chặn gọi chồng: lúc Premiere bận
  // (render/xuất), một cú evalScript có thể treo vài giây — không chặn thì
  // các nhịp sau xếp hàng đè lên nhau.
  useEffect(() => {
    if (!isInHost() || dangChay) return
    let dung = false
    let dangSoi = false
    const soi = async () => {
      if (dangSoi) return
      dangSoi = true
      try {
        // Một cú đọc: danh sách + cái đang mở (nuôi cả ô chọn lẫn đèn).
        const ds = await danhSachSequence()
        if (dung) return
        setDsSeq(ds)
        // Người dùng bấm sang tab sequence khác trong Premiere thì ô chọn đi theo —
        // và lượt chạy kế tiếp cũng đi theo (xem `idSeqChonRef`).
        idSeqChonRef.current = ds.find((d) => d.dangMo)?.id ?? idSeqChonRef.current
        // [2.5.0] Vùng I/O đang chọn — hàm host NHẸ (đọc 4 con số, không duyệt
        // clip, đo ~1 ms ở Autocut). So mốc rồi mới setState để không vẽ lại
        // mỗi giây khi người dùng đứng yên. Bỏ khoanh vùng → xoá số cũ.
        const r = await getRange()
        if (dung) return
        const mocMoi = r ? `${r.tu.toFixed(3)}|${r.den.toFixed(3)}` : ''
        if (mocMoi !== mocVungRef.current) {
          mocVungRef.current = mocMoi
          setVungTin(r ? { tu: r.tu, dai: r.den - r.tu, fps: r.fps, w: r.w, h: r.h } : null)
        }
        // ☠️ TỰ NHẬN KHUNG theo kích thước sequence — vấp 22/08: reload panel thì
        // nút Khung về "Ngang" trong khi sequence là 1080×1920 → caption Hormozi
        // tràn hai mép. Chỉ tự đặt khi ĐỔI SANG SEQUENCE KHÁC (hoặc lần đầu), để
        // người dùng vẫn ghi đè được bằng tay trong cùng một sequence.
        if (r && r.w > 0 && r.h > 0 && r.seqName !== seqKhungRef.current) {
          seqKhungRef.current = r.seqName
          setKhung(r.h > r.w ? 'doc' : 'ngang')
        }
        const ten = ds.find((d) => d.dangMo)?.ten ?? ''
        if (!ten) return
        if (tenSeqRef.current && ten !== tenSeqRef.current) {
          void demLai()
          // TRÁO BIÊN LAI theo sequence vừa mở — có thì hiện của nó, chưa chạy
          // lần nào trong phiên thì ẩn. Không trưng số của sequence khác.
          const luu = ketTheoSeq.current.get(ten)
          setKet(luu ?? null)
          setTenSeqKet(luu ? ten : '')
        }
        tenSeqRef.current = ten
        setTenSeq(ten)
      } finally {
        dangSoi = false
      }
    }
    void soi()
    const id = window.setInterval(() => void soi(), 1000)
    return () => {
      dung = true
      window.clearInterval(id)
    }
  }, [dangChay])

  /** Đặt nhãn + bước + phần trăm trong một nhịp, khỏi quên cập nhật thanh. */
  function baoBuoc(nhan: string, buoc: number, pt = -1) {
    setDangChay(nhan)
    setBuocIdx(buoc)
    setPhanTram(pt)
  }

  /**
   * [2.5.1] HAI NÚT (anh Tiến 22/08 đêm): `caption` = caption track C1 chữ mặc
   * định (nút chính); `hieuung` = graphic MOGRT theo kiểu đang chọn (nút phụ).
   * Cùng một đường nghe/quy đổi — khác nhau đúng ở bước gắn lên sequence.
   */
  async function lamPhuDe(cheDo: 'caption' | 'hieuung' = 'caption') {
    baoBuoc(dich('Đang đọc vùng đã khoanh…'), 0)
    setLoi('')
    setCanLam('')
    setKet(null)
    const batDau = Date.now()

    try {
      if (!nodeAvailable())
        throw new Error(dich('Panel không dùng được Node.js — không gọi được bộ xử lý media.'))
      if (!getFFmpegPath())
        throw new Error(dich('Thiếu thành phần xử lý media của panel — cài lại bản mới nhất.'))

      // Nạp lại host mỗi lần bấm: rẻ, và chắc chắn panel nói chuyện với đúng bản
      // code vừa cài chứ không phải bản Premiere giữ từ lúc khởi động.
      if (!(await napLaiHost())) {
        throw new Error(dich('Không nạp được host/index.jsx từ thư mục extension.'))
      }

      // ── 0. ÉP ĐÚNG SEQUENCE ĐANG HIỆN TRONG Ô CHỌN ──
      // ☠️ Vấp 24/08 (số đo ở `idSeqChonRef`): hỏi Premiere "đang mở cái gì" ngay
      // lúc bấm là câu hỏi KHÔNG ĐÁNG TIN — nó trả về tab có tiêu điểm, có thể
      // khác cái panel đang hiện, và caption rơi sang sequence của người dùng mà
      // không báo gì. Ép mở đúng cái ô chọn đang hiện, rồi ĐỌC LẠI để chắc.
      const idChon = idSeqChonRef.current
      if (idChon) {
        await moSequenceTheoId(idChon)
        const idThat = (await danhSachSequence()).find((d) => d.dangMo)?.id ?? ''
        if (idThat !== idChon)
          throw new Error(
            dich('Không mở được sequence đang chọn — bấm vào sequence đó trên timeline rồi chạy lại.'),
          )
      }

      // ── 1. Vùng anh khoanh bằng phím I / O ──
      const { vung, loi: loiVung } = await getRangeClips()
      if (!vung) {
        if (loiVung?.canLam) setCanLam(loiVung.message)
        else setLoi(loiVung?.message ?? dich('Không đọc được vùng đã khoanh'))
        return
      }

      // Biên lai kết quả PHẢI ghi tên sequence nó thuộc về — chộp ngay lúc đọc
      // vùng, vì đây chính là sequence mà toàn bộ số liệu sắp sinh ra nói tới.
      // Và GHIM cả ID: mấy phút nghe hiểu là đủ để người dùng bấm sang
      // sequence khác — trước khi gắn phụ đề/marker sẽ kích hoạt lại đúng nó.
      const tenSeqLanNay = await tenSequenceDangMo()
      idSeqChay.current = idChon || ((await danhSachSequence()).find((d) => d.dangMo)?.id ?? '')
      if (tenSeqLanNay) {
        setTenSeqKet(tenSeqLanNay)
        tenSeqRef.current = tenSeqLanNay
        setTenSeq(tenSeqLanNay)
      }

      const doiToc = vung.clips.filter((c) => Math.abs(c.speed - 1) > 0.01)
      if (doiToc.length) {
        setCanLam(
          // ☠️ Vế đầu có `${}` nên KHÔNG khớp khoá nào nếu để nguyên template
          // literal. Không tách nhỏ ra dịch từng mẩu (mẩu rời không đọc được),
          // mà dùng MỘT khoá chứa cả câu có chỗ trống rồi `.replace()`.
          dich('Trong vùng có {n} clip đã đổi tốc độ ({p}%). ')
            .replace('{n}', String(doiToc.length))
            .replace('{p}', (doiToc[0].speed * 100).toFixed(0)) +
            dich('Panel chưa quy đổi được thời gian cho clip đổi tốc độ — trả về 100% rồi chạy lại.'),
        )
        return
      }

      // ☠️ Nghe hiểu BẮT BUỘC. Không có công tắc tắt — tắt nghe hiểu thì panel
      // này không còn gì để làm.
      const boMay = timBoMay(maMoHinh)
      if (!boMay) {
        setCanLam(dich('Chưa cài bộ nghe hiểu nên chưa chép lời được.\n') + thieuGi())
        return
      }

      const buoc: NonNullable<KetPhuDe['buoc']> = []

      // ── 2+3. Tách tiếng rồi cho Whisper nghe, cho TỪNG file gốc trong vùng ──
      const soFile = new Set(vung.clips.map((x) => x.path)).size
      const daNghe = new Map<
        string,
        {
          cau: CauNoi[]
          tu: { chu: string; giay: number; p: number }[]
          /** Mã ngôn ngữ Whisper nhận ra — quyết định luật cắt dòng. */
          ngonNgu?: string
        }
      >()
      let daXong = 0

      for (const c of vung.clips) {
        if (daNghe.has(c.path)) continue
        daXong++
        const nhan = soFile > 1 ? ` (file ${daXong}/${soFile})` : ''

        // BỘ ĐỆM: chạy Autocut trên đúng file này rồi thì dùng lại, khỏi tốn
        // 3-8 phút. Khoá theo kích thước + giờ sửa của video VÀ theo mô hình,
        // nên file đổi là tự hết hiệu lực.
        //
        // ☠️ Đọc đệm TRƯỚC khi tách tiếng: có đệm thì khỏi phải trích WAV, mà
        // đó mới là bước tốn đĩa nhất (45 giây trên file 9,3 GB). Bản 2.0.0
        // trích xong mới hỏi đệm — làm thừa đúng bước đắt nhất.
        const demCu = docDem(c.path, maMoHinh)
        if (demCu) {
          buoc.push({
            ten: dich('Dùng lại kết quả nghe đã có'),
            ket: dich('{a} câu · {b} từ · không phải nghe lại')
              .replace('{a}', String(demCu.cau.length))
              .replace('{b}', String(demCu.tu.length)),
            giay: 0,
          })
          daNghe.set(c.path, demCu)
          continue
        }

        baoBuoc(dich('Đang tách tiếng khỏi video') + nhan, 1)
        let t0 = Date.now()
        const { wav, duration } = await trichTieng(c.path, (giayXong) =>
          setDangChay(`${dich('Đang tách tiếng khỏi video')}${nhan}… ${dongHo(giayXong)}`),
        )
        const giayTrich = (Date.now() - t0) / 1000
        // Bước này bị ĐĨA quyết định, không phải CPU. In ra tốc độ đọc thật để
        // nhìn phát biết file đang nằm trên HDD hay SSD.
        const co = doDaiFile(c.path)
        const tocDo = co > 0 && giayTrich > 0 ? co / 1048576 / giayTrich : 0
        buoc.push({
          ten: dich('Tách tiếng khỏi video'),
          ket:
            (duration > 0 ? dich('{n}s tiếng').replace('{n}', duration.toFixed(0)) : dich('xong')) +
            (co > 0 ? dich(' · đọc {n} GB').replace('{n}', (co / 1073741824).toFixed(2)) : '') +
            (tocDo > 0 ? ` · ${tocDo.toFixed(0)} MB/s` : ''),
          giay: giayTrich,
        })

        baoBuoc(dich('Đang nghe hiểu lời nói') + nhan, 2)
        t0 = Date.now()
        const ketNghe = await nghe(wav, boMay, (p) =>
          // Bước dài nhất của cả luồng (3-8 phút). p = -1 nghĩa là còn đang nạp
          // mô hình lên GPU, chưa nghe — lúc đó thanh chạy qua lại chứ không
          // đứng ở 0%, vì đứng ở 0% thì nhìn y như treo.
          baoBuoc(
            (p < 0 ? dich('Đang nạp mô hình lên GPU') : dich('Đang nghe hiểu lời nói')) + nhan,
            2,
            p,
          ),
        )
        donWav(wav)
        buoc.push({
          ten: dich('Nghe hiểu lời nói (GPU)'),
          ket:
            dich('{a} câu · {b} từ')
              .replace('{a}', String(ketNghe.cau.length))
              .replace('{b}', String(ketNghe.tu.length)) +
            (ketNghe.ngonNgu
              ? dich(' · nghe ra tiếng {x}').replace('{x}', () => tenNgonNgu(ketNghe.ngonNgu!))
              : ''),
          giay: (Date.now() - t0) / 1000,
        })

        // Ghi lại làm bước đệm cho lần sau (và cho panel Autocut).
        luuDem(c.path, maMoHinh, ketNghe)
        daNghe.set(c.path, ketNghe)
      }

      // ── 4. Quy đổi mốc rồi gắn lên sequence ──
      //
      // ☠️ [2.0.0] TRƯỚC ĐÂY CHỈ LẤY `vung.clips[0]` — và đó là lỗi CÂM.
      // Đo thật 29/07 trên sequence 17 clip do Auto Cut sinh ra: bảng quy đổi
      // chỉ có đoạn [0 → 3,36] của clip đầu, nên 15/16 câu rơi ra ngoài và bị
      // bỏ. File .srt ra đúng 1 câu / 136 byte, KHÔNG báo lỗi gì.
      //
      // Nên bảng quy đổi phải dựng từ MỌI clip trong vùng, dùng vị trí THẬT
      // của từng clip (`seqTu`) chứ không cộng dồn — clip có thể hở nhau.
      baoBuoc(dich('Đang gắn phụ đề lên timeline'), 3)

      // ☠️ GHIM SEQUENCE — vấp thật anh Tiến báo 31/07: trong mấy phút panel
      // nghe hiểu, luồng shorts (hoặc chính người dùng) đổi sequence đang mở
      // → phụ đề gắn lên SAI sequence, "bị lưu đè và hiển thị không đúng".
      // Kích hoạt lại đúng sequence đã ghim theo ID trước khi ghi bất cứ gì.
      if (idSeqChay.current) await moSequenceTheoId(idSeqChay.current)

      // Ưu tiên track hình; sequence chỉ có tiếng thì lấy track tiếng.
      const clipHinh = vung.clips.filter((c) => c.kind === 'V')
      const nguon = clipHinh.length ? clipHinh : vung.clips.filter((c) => c.kind === 'A')

      // Mỗi file gốc có một bản nghe riêng, mà một mốc giây chỉ quy đổi được
      // trong phạm vi MỘT file. Vùng trộn nhiều file thì chọn file chiếm nhiều
      // thời lượng nhất, và NÓI RA phần bị bỏ qua — đừng im lặng.
      const theoFile = new Map<string, typeof nguon>()
      for (const c of nguon) {
        const ds = theoFile.get(c.path) ?? []
        ds.push(c)
        theoFile.set(c.path, ds)
      }
      const xepTheoDoDai = [...theoFile.entries()].sort(
        (a, b) =>
          b[1].reduce((t, c) => t + (c.seqDen - c.seqTu), 0) -
          a[1].reduce((t, c) => t + (c.seqDen - c.seqTu), 0),
      )
      const [pathChinh, clipsChinh] = xepTheoDoDai[0] ?? ['', []]
      const nghedDuoc = pathChinh ? daNghe.get(pathChinh) : undefined
      if (!clipsChinh.length || !nghedDuoc?.cau.length) {
        setCanLam(dich('Không nghe ra câu nào trong vùng này. Kiểm lại xem clip có tiếng không.'))
        return
      }
      if (xepTheoDoDai.length > 1) {
        const boQua = xepTheoDoDai.slice(1).reduce((t, [, ds]) => t + ds.length, 0)
        setCanLam(
          dich(
            'Vùng này có {n} file khác nhau. Mới làm phụ đề cho "{f}" ({c} clip); {b} clip của file khác chưa được chép.',
          )
            .replace('{n}', String(xepTheoDoDai.length))
            // ☠️ Tên file là chữ NGƯỜI DÙNG đặt: `.replace()` với chuỗi thay
            // thế sẽ hiểu `$&` `$'` `` $` `` là ký hiệu, làm méo câu. Truyền
            // HÀM thì chuỗi được lấy nguyên văn. Cùng luật cho mọi chỗ trống
            // nhận chữ tự do (tham số host ở `cep.ts`).
            .replace('{f}', () => String(pathChinh.split(/[\\/]/).pop()))
            .replace('{c}', String(clipsChinh.length))
            .replace('{b}', String(boQua)),
        )
      }

      const xepTheoSeq = clipsChinh.slice().sort((a, b) => a.seqTu - b.seqTu)
      const keepsNguyen: Segment[] = xepTheoSeq.map((c) => ({ start: c.srcTu, end: c.srcDen }))

      // ☠️ MỐC PHẢI LÀ GIỜ TUYỆT ĐỐI TRÊN SEQUENCE — `gocSeq = 0`.
      //
      // Host gọi `seq.createCaptionTrack(pi, 0, …)`: caption track LUÔN đặt tại
      // giây 0 của sequence. Nên mốc trong .srt phải tự mang vị trí thật của
      // clip, không được chuẩn hoá về 0.
      //
      // Lỗi đã thấy tận mắt 29/07: sequence có clip bắt đầu ở giây 38,53 thì
      // phụ đề nằm ở 0:00–1:12 còn clip nằm ở 0:45–2:00 — lệch đúng 38,53 giây.
      const bangMoc = dungBangTuClip(xepTheoSeq, 0)

      const pd = await ganPhuDeVao(
        pathChinh,
        nghedDuoc.cau,
        keepsNguyen,
        bangSua,
        setDangChay,
        bangMoc,
        // ☠️ Luật cắt dòng phụ thuộc NGÔN NGỮ, không chỉ khung hình. Chữ CJK
        // rộng gấp 2,16 lần Latin (đo 30/07) nên trần phải là 32 đơn vị thay vì
        // 42. Ngôn ngữ do chính Whisper trả về sau khi nghe (`-l auto`).
        gioiHanTheoKhung(khung, nghedDuoc.ngonNgu),
        nghedDuoc.tu,
        // [2.5.0] Kiểu caption + khung: kiểu hiệu ứng thì đặt MOGRT thay vì
        // caption track (file .srt vẫn ghi ra làm bản nguồn để sửa/chạy lại).
        // [2.5.1] Nút "Làm phụ đề" LUÔN là caption track; chỉ "Làm hiệu ứng" mới
        // dùng kiểu đang chọn.
        cheDo === 'hieuung' ? kieuHieuUng : timKieu('mac-dinh', dsKieu),
        khung,
        vungTin?.w ?? 0,
      )
      let kpd: KetPhuDe = {
        soCau: pd.soCau,
        soTu: nghedDuoc.tu.length,
        ngonNgu: nghedDuoc.ngonNgu,
        duongDan: pd.duongDan,
        ganDuoc: pd.ganDuoc,
        caption: pd.caption,
        buoc,
        giayTong: (Date.now() - batDau) / 1000,
      }
      setKet(kpd)
      if (tenSeqLanNay) ketTheoSeq.current.set(tenSeqLanNay, kpd)

      // Marker chỗ Whisper nghe không chắc — thứ người dựng cần soát nhất.
      if (nghedDuoc.tu.length) {
        // Đếm TỔNG THẬT trước, rồi mới chặt trần 60 — trần là cố ý (marker rải
        // kín timeline thì mất tác dụng), nhưng GIẤU trần thì con số thành nói
        // dối một nửa. Đo 30/07: 3 video ra 107/220/433 chỗ, cả 3 cùng hiện
        // "60" và anh Tiến hỏi ngay "có thực tế không hay bị ghi đè?".
        const tongCho = chonChoSoat(nghedDuoc.tu, keepsNguyen, 0.6, Number.MAX_SAFE_INTEGER, bangMoc).length
        const cho = chonChoSoat(nghedDuoc.tu, keepsNguyen, 0.6, 60, bangMoc)
        const dong = cho.map((c) => `${c.giay.toFixed(3)}|${c.chu}|${c.p.toFixed(3)}|tu`)
        if (dong.length) {
          setDangChay(dich('Đang đánh dấu {n} chỗ cần soát…').replace('{n}', String(dong.length)))
          // Ghim lại lần nữa — bước gắn phụ đề có thể mất vài giây.
          if (idSeqChay.current) await moSequenceTheoId(idSeqChay.current)
          const { daDat } = await datMarker(dong.join(';'))
          kpd = { ...kpd, soat: { soCho: daDat, temNhat: cho[0]?.p ?? 1, tongCho } }
          setKet(kpd)
          if (tenSeqLanNay) ketTheoSeq.current.set(tenSeqLanNay, kpd)
        }
      }
    } catch (e: any) {
      setLoi(String(e?.message ?? e))
    } finally {
      setDangChay('')
      setBuocIdx(-1)
      setPhanTram(-1)
      void demLai()
    }
  }

  const trongHost = isInHost()

  return (
    <div className="app">
      <header className="topbar">
        <svg
          className={trongHost ? 'topbar__icon' : 'topbar__icon topbar__icon--tat'}
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 11h3M14 11h3M7 15h6M16 15h1" />
        </svg>
        <h1 className="topbar__ten">Transcript</h1>
        {/* Version LAY TU package.json luc build (`__VERSION__`), khong go tay.
            Anh Tien 30/07: *"em nho them cac ki hieu version cua 4 tool"*. Da hai
            lan panel chay ban cu ma khong ai biet, phai do qua cong debug moi thay.
            Kiem 3 cho khop nhau: `node design-system/version.mjs`. */}
        <span className="topbar__ver">v{__VERSION__}</span>
        {/* Nút đổi ngôn ngữ VI/EN. Đặt ở thanh đầu vì nó tác động lên CẢ panel,
            không thuộc riêng bước nào. Đổi ở đây thì mọi panel AiO đổi theo —
            lựa chọn lưu ở `%APPDATA%\AiOStudio\ngonngu.json`, dùng chung cả bộ.
            Đặt TRƯỚC dòng host vì `.topbar__host` giãn hết chỗ còn lại
            (`flex: 1` + `margin-left: auto`), nút đứng sau sẽ bị đẩy ra rìa. */}
        <NutDoiNgonNgu />
        <p className="topbar__host" title={host}>
          {host}
        </p>
      </header>

      <div className="than">
        {/* ══════════════════════════════════════════════════════════════════
            KHỐI 1 — PANEL NÀY LÀM GÌ
            ══════════════════════════════════════════════════════════════════
            Anh Tiến 29/07 chỉ vào panel Asset Manager mở cạnh bên: *"em thấy
            phần Asset Manager nó có 2 phần không em, anh cũng muốn tách ra như
            vậy"*. Khối này trả lời "nó làm gì cho tôi", khối dưới là "chạy đi".

            Lúc đang chạy thì GIẤU: người dùng không cần xem lời giải thích khi
            máy đã bắt đầu làm. */}
        {!dangChay && !ket && (
          <section className="khoi khoi--gioithieu">
            {/* ☠️ MỘT KHUÔN CHUNG cho cả bốn panel — anh Tiến 30/07: *"2 dòng
                text này là hướng dẫn, em làm sao cho nó gọn hàng và giống nhau"*.

                Khuôn: [Khoanh đoạn cần VIỆC bằng I và O.] [Chọn A và B rồi bấm.]
                Hai vế, hai câu, cùng độ dài — đọc lướt là so được ngay.

                Và KHÔNG nói kết quả đi đâu ở đây: mỗi thanh chọn đã có dòng
                `.chon__mo` nói hệ quả của chính nó. Nói ở hai nơi là bắt mắt
                đọc hai lần, mà còn dễ nói dối khi logic đổi. */}
            <p className="chidan">
              {dich('Khoanh đoạn cần')} <b>{dich('chép lời')}</b> {dich('bằng')} <kbd>I</kbd>{' '}
              {dich('và')} <kbd>O</kbd>
              {dich('. Chọn khung và cách chép rồi bấm.')}
            </p>

            <div className="mh">
              <button
                type="button"
                className="mh__nut"
                title={dich('Bấm để xem lại')}
                onClick={() => setLanMinhHoa((n) => n + 1)}
              >
                <MinhHoa lan={lanMinhHoa} />
              </button>
              <p className="mh__chu">
                {dich('Máy nghe hết đoạn → chép thành')} <b>{dich('phụ đề')}</b>{' '}
                {dich('đặt đúng chỗ người ta nói → cắm')} <b>{dich('cờ đỏ')}</b>{' '}
                {dich('ở chỗ nó nghe không chắc.')}
              </p>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            KHỐI 2 — CHỌN CÁCH CHÉP RỒI CHẠY
            ══════════════════════════════════════════════════════════════════ */}
        <section className="khoi khoi--dieukhien">
          {/* ══════════════════════════════════════════════════════════════════
              [2.5.0] ĐOẠN ĐANG CHỌN — bám theo I/O trên timeline, nhịp 1 giây.
              Anh Tiến 22/08: *"có thể chọn được vùng và hiển thị lên tool xác
              định được vùng chọn đó có thời gian bao nhiêu giống như autocut"*.
              Hiện CẢ LÚC ĐANG CHẠY (số đứng yên lúc đó là đúng — vòng thăm dò
              ngưng khi chạy, không chen vào ExtendScript một luồng).
              ══════════════════════════════════════════════════════════════════ */}
          <div className="selbar" aria-live="polite">
            <svg className="selbar__ico" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 4H5v16h4M15 4h4v16h-4" />
            </svg>
            <span className="selbar__nhan">{dich('Đoạn đang chọn')}</span>
            <span className={vungTin ? 'selbar__so' : 'selbar__so selbar__so--trong'}>
              {vungTin ? daiVung(vungTin.dai) : dich('chưa khoanh')}
            </span>
            {vungTin && (
              <span className="selbar__moc">
                {mmss(vungTin.tu)} → {mmss(vungTin.tu + vungTin.dai)}
              </span>
            )}
            <span className="selbar__phim">
              {dich('Đổi vùng bằng phím')} <kbd>I</kbd> <kbd>O</kbd>
            </span>
          </div>

          {!dangChay && (
            <>
              {/* ══════════════════════════════════════════════════════════════
                  1. KHUNG HÌNH — chọn TRƯỚC, vì nó quyết định luật cắt câu
                  ══════════════════════════════════════════════════════════════
                  Anh Tiến 30/07: *"sẽ được chọn được phần khung thì rồi mới
                  chứ đúng không em"* — đúng, khung là quyết định gốc: video dọc
                  thì mỗi khối chỉ được 4-6 từ, khác hẳn ngang. */}
              {/* ══════════════════════════════════════════════════════════════
                  0. SEQUENCE — chọn TƯỜNG MINH, hết cảnh làm ngầm trên "cái
                  đang mở". Anh Tiến 31/07: shorts đẻ nhiều sequence, kết quả
                  "bị lưu đè và hiển thị không đúng". Chọn = mở nó trên
                  timeline (cái nhìn thấy = cái sẽ chạy), và lượt chạy GHIM
                  theo ID nên đổi tab giữa chừng cũng không lạc chỗ. */}
              {dsSeq.length > 0 && (
                <div className="chon">
                  <span className="chon__nhan">Sequence</span>
                  <select
                    className="seqpick"
                    value={dsSeq.find((d) => d.dangMo)?.id ?? ''}
                    onChange={(e) => {
                      // Ghi NGAY vào ref: chọn xong bấm chạy trong vòng một giây thì
                      // vòng thăm dò chưa kịp cập nhật, lượt chạy sẽ lấy nhầm cái cũ.
                      idSeqChonRef.current = e.target.value
                      void moSequenceTheoId(e.target.value).then((ok) => {
                        if (ok) void demLai()
                      })
                    }}
                  >
                    {dsSeq.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.ten}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="chon">
                <span className="chon__nhan">{dich('Khung hình')}</span>
                <div className="seg">
                  {KHUNG.map((k) => (
                    <button
                      key={k.ma}
                      className={k.ma === khung ? 'seg__nut seg__nut--chon' : 'seg__nut'}
                      // ☠️ Bọc `dich()` Ở CHỖ VẼ RA, không bọc trong hằng `KHUNG`.
                      // Hằng nằm ngoài component nên chạy lúc IMPORT — trước khi
                      // React kịp gắn bảng chữ, và không chạy lại khi đổi ngôn ngữ.
                      title={dich(k.mo)}
                      onClick={() => setKhung(k.ma)}
                    >
                      {dich(k.ten)}
                    </button>
                  ))}
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  2. CÁCH CHÉP
                  ══════════════════════════════════════════════════════════════
                  ☠️ Hai nhãn phải nằm trên CÙNG MỘT TRỤC so sánh. Bản trước là
                  "Nhanh" / "Phụ đề câu dài" — một cái nói TỐC ĐỘ, một cái nói
                  ĐỘ DÀI CÂU, đặt cạnh nhau đọc không so được. Anh Tiến 30/07:
                  *"nhìn nó kì, em đổi lại 2 từ của button đó cho nó hiệu quả
                  hơn"*. Nay cả hai đều nói độ dài câu; tốc độ xuống dòng mô tả.

                  Hình minh hoạ ở giữa hai nút cũng gỡ theo — anh Tiến thấy nó
                  chen vào giữa nhìn kì, mà nhãn đúng thì đã tự nói được rồi. */}
              <div className="chon">
                <span className="chon__nhan">{dich('Cách chép')}</span>
                <div className="seg">
                  {MO_HINH.map((m) => (
                    <button
                      key={m.ma}
                      className={m.ma === maMoHinh ? 'seg__nut seg__nut--chon' : 'seg__nut'}
                      title={dich(m.mo)}
                      onClick={() => setMaMoHinh(m.ma)}
                    >
                      {m.ma === 'turbo' ? dich('Câu ngắn') : dich('Câu dài')}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {dangChay ? (
            <DangChay
              nhan={dangChay}
              phanTram={phanTram}
              giay={giayTroi}
              buocIdx={buocIdx}
              cacBuoc={CAC_BUOC}
            />
          ) : (
            <button className="btn btn--primary" onClick={() => void lamPhuDe()}>
              {/* [2.5.5] Icon = việc của panel (phụ đề), cùng khuôn nút Autocut
                  (icon kéo ✂): stroke currentColor, 15px, nằm trước nhãn. Cùng
                  hình với icon thanh trên — panel chỉ có MỘT ẩn dụ hình ảnh. */}
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M7 11h3M14 11h3M7 15h6M16 15h1" />
              </svg>
              {ket ? dich('Chép lại') : dich('Làm phụ đề')}
            </button>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              [2.5.1] HIỆU ỨNG — nút thứ hai (anh Tiến 22/08 đêm: *"chia thành 2
              nút: nút đầu là làm phụ đề, nút thứ hai là làm hiệu ứng"*, và
              *"editor cần sửa thì sửa trên graphics là đủ"*).
              Thay cho lưới "Kiểu caption" 6 ô của 2.5.0. Nút chính vẫn là MỘT.
              ☠️ Đo 22/08: graphic làm từ Premiere KHÔNG nhận chữ qua API (Adobe
              xác nhận API chỉ cho MOGRT từ AE) và không có API "Upgrade caption
              to graphic" → hiệu ứng vẫn là MOGRT AE; nói thẳng giá phải trả
              (nặng hơn caption track) ngay dưới nút, không giấu.
              ☠️ [2.5.4] KHỐI NÀY ĐANG TẮT — xem `HIEN_HIEU_UNG` ở đầu file.
              ══════════════════════════════════════════════════════════════════ */}
          {HIEN_HIEU_UNG && !dangChay && (
            <div className="hieuung">
              <span className="chon__nhan">{dich('Hiệu ứng')}</span>
              <div className="hieuung__hang hieuung__hang--doc">
                <select
                  className="seqpick"
                  value={kieuHieuUng.ma}
                  title={kieuHieuUng.tuyChinh ? kieuHieuUng.mogrtPath : dich(kieuHieuUng.mo)}
                  onChange={(e) => {
                    const ma = e.target.value as KieuCaption
                    setKieuCaption(ma)
                    try {
                      localStorage.setItem(KHOA_KIEU_CAPTION, ma)
                    } catch {
                      /* không lưu được thì thôi */
                    }
                  }}
                >
                  {dsKieu
                    .filter((k) => !!k.mogrt)
                    .map((k) => (
                      <option key={k.ma} value={k.ma}>
                        {k.ten}
                      </option>
                    ))}
                </select>
                {/* ☠️ [2.5.3] NÚT NÀY TỪNG BỊ BỎ SÓT. Anh Tiến 24/08 chọn kiểu Hormozi
                    rồi bấm NÚT CAM (Làm phụ đề) và báo *"anh chưa thấy có hiệu ứng gì
                    hết đó em"* — đo trên timeline của anh: 20 clip hình, 0 clip hiệu
                    ứng, panel báo đúng câu của caption track. Nút cam to và nổi, nút
                    hiệu ứng thì nhỏ nằm cạnh ô xổ → ai cũng bấm nút cam.
                    Nay nút hiệu ứng RỘNG HẾT HÀNG, viền đậm màu nhấn. Vẫn KHÔNG tô đặc
                    màu cam: mỗi màn hình chỉ một nút chính (luật anh Tiến). */}
                <button className="btn btn--hieuung" onClick={() => void lamPhuDe('hieuung')}>
                  {dich('Làm hiệu ứng')}
                </button>
              </div>
              {/* [2.5.3] Anh Tiến 24/08: *"remove mấy câu từ vô nghĩa này ra luôn"*.
                  Câu văn mô tả kiểu đã gỡ — nhãn nút và tên kiểu đã tự nói đủ.
                  GIỮ đúng cái NÚT: đó là đường VÀO duy nhất cho kiểu tự làm
                  (luật "có đường vào thì phải có đường ra" — bỏ là mất tính năng). */}
              <p className="chon__mo">
                {trongHost && (
                  <>
                    <button
                      type="button"
                      className="lien-ket"
                      title={thuMucKieuRieng()}
                      onClick={() => {
                        moThuMucKieuRieng()
                        window.setTimeout(() => setDsKieu(quetDsKieu()), 2500)
                      }}
                    >
                      {dich('Thêm kiểu từ After Effects…')}
                    </button>
                  </>
                )}
              </p>
            </div>
          )}

          {canLam && <p className="canlam">{canLam}</p>}
          {loi && <pre className="loi">{loi}</pre>}
        </section>

        {/* [2.5.0] KẾT QUẢ tách thành khối riêng — để panel RỘNG (≥720px) xếp
            được HAI CỘT: trái = điều khiển, phải = giới thiệu/kết quả/dọn dẹp.
            Anh Tiến 22/08: *"màn hình thực tế của editor không được to, họ mở
            nhiều tab trong Pr cùng lúc… thay đổi lại giao diện cho nó thông
            minh"*. Panel hẹp thì vẫn một cột như cũ (xem `@media` trong
            styles.css). */}
        {ket && (
          <section className="khoi khoi--ketqua">
            <KetQuaPhuDe ket={ket} tenSeqKet={tenSeqKet} tenSeqDangMo={tenSeq} />
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ĐƯỜNG RA — xoá thứ panel đã tạo
            ══════════════════════════════════════════════════════════════════
            Anh Tiến 30/07: *"thêm nút xoá scripts và xoá marker trong
            transcripts nữa"*. Luật đã chốt từ lâu: có đường VÀO thì phải có
            đường RA.

            ☠️ Nút xoá nói HẬU QUẢ BẰNG SỐ THẬT, và chỉ hiện khi thật sự có gì
            để xoá — nút bấm rồi báo "không có gì" là nút nói dối.

            ☠️ NHƯNG ẨN CẢ KHỐI thì người dùng tưởng MẤT TÍNH NĂNG — vấp thật
            01/08: anh Tiến hỏi *"ủa cái nút xoá marker và caption đâu mất rồi
            em?"* trong khi panel chạy đúng (sequence đang mở có 0 marker,
            0 file .srt). Nay: KHỐI luôn hiện, chỉ NÚT là ẩn; không có gì để
            dọn thì nói thẳng bằng một dòng chữ. Tính năng nhìn thấy được,
            mà vẫn không có nút nói dối. */}
        {/* [2.5.3] Anh Tiến 24/08 khoanh đỏ cả khối này khi nó KHÔNG có nút nào —
            lúc đó nó chỉ còn là hai đoạn văn giải thích, tức là rác. Nay: có gì để
            dọn thì hiện (kèm nút), không có thì ẩn hẳn.
            ☠️ Khác với lần vấp 01/08 (*"nút xoá marker và caption đâu mất rồi em?"*):
            lần đó ẩn cả khi CÓ thứ để dọn. Nay chỉ ẩn đúng lúc rỗng. */}
        {!dangChay && daTao && (daTao.marker > 0 || daTao.itemSrt > 0) && (
          <div className="don">
            <span className="don__nhan">{dich('Dọn thứ panel đã tạo')}</span>
            <div className="don__nut">
              {daTao.itemSrt > 0 && (
                <button
                  className="btn btn--phu"
                  disabled={!!dangDon}
                  onClick={() => {
                    void (async () => {
                      setDangDon('phude')
                      setLoi('')
                      setCanLam('')
                      try {
                        if (!(await napLaiHost())) throw new Error(dich('Không nạp được host.'))
                        const r = await xoaPhuDe()
                        // [2.5.3] Chỉ báo khi THẤT BẠI (luật anh Tiến). Gỡ xong thì
                        // chính cái nút biến mất — người dùng đã thấy, nói thêm là thừa.
                        if (r.loi) setCanLam(r.loi.message)
                      } catch (e: any) {
                        setLoi(String(e?.message ?? e))
                      } finally {
                        setDangDon('')
                        void demLai()
                      }
                    })()
                  }}
                >
                  {dangDon === 'phude'
                    ? dich('Đang gỡ…')
                    : dich('Gỡ {n} file phụ đề khỏi project').replace(
                        '{n}',
                        String(daTao.itemSrt),
                      )}
                </button>
              )}
              {daTao.marker > 0 && (
                <button
                  className="btn btn--phu"
                  disabled={!!dangDon}
                  onClick={() => {
                    void (async () => {
                      setDangDon('marker')
                      setLoi('')
                      setCanLam('')
                      try {
                        if (!(await napLaiHost())) throw new Error(dich('Không nạp được host.'))
                        const r = await xoaMarker()
                        if (r.loi) setCanLam(r.loi.message)
                        else
                          setCanLam(
                            dich('Đã xoá {n} marker. Còn lại {m} marker trên sequence.')
                              .replace('{n}', String(r.daXoa))
                              .replace('{m}', String(r.conLai)),
                          )
                      } catch (e: any) {
                        setLoi(String(e?.message ?? e))
                      } finally {
                        setDangDon('')
                        void demLai()
                      }
                    })()
                  }}
                >
                  {dangDon === 'marker'
                    ? dich('Đang xoá…')
                    : dich('Xoá {n} marker').replace('{n}', String(daTao.marker))}
                </button>
              )}
            </div>
            <p className="don__mo">
              {/* [2.5.3] Câu "Chỉ xoá thứ panel tạo ra…" đã gỡ (anh Tiến 24/08) —
                  nhãn nút đã nói rõ xoá cái gì. GIỮ đoạn dưới: nó không phải lời
                  giải thích mà là VIỆC PHẢI LÀM (Premiere không cho tool xoá track). */}
              {/* ☠️ NÓI THẬT GIỚI HẠN — anh Tiến 31/07: "bấm vào xoá thì nó
                  không có tác dụng". Nút gỡ được FILE trong project; còn TRACK
                  caption trên timeline thì Premiere KHÔNG mở API cho tool nào
                  đụng (đo: seq.captionTracks = undefined). Không nói ra thì
                  nút thành nút nói dối. */}
              {daTao.itemSrt > 0 && (
                <>
                  {' '}
                  {dich(
                    'Track caption trên timeline Premiere không cho tool xoá — chuột phải vào đầu track →',
                  )}{' '}
                  {/* `Delete Track` là TÊN MỤC MENU THẬT của Premiere — cố ý
                      KHÔNG có trong bảng dịch, dịch là người dùng không tìm
                      thấy nó trong menu nữa. */}
                  <b>Delete Track</b>.
                </>
              )}
            </p>
          </div>
        )}

        {/* [2.5.3] DẢI CỜ NGÔN NGỮ ĐÃ GỠ — anh Tiến 24/08: *"remove làm sạch UI"*.
            Nó là hình minh hoạ (12+ thứ tiếng), không phải điều khiển: người dùng
            không bấm được gì vào đó, mà panel vẫn tự nhận ngôn ngữ như cũ. */
        }
        {/* ══════════════════════════════════════════════════════════════════
            ☠️ BẢNG "SỬA TỪ NGHE NHẦM" ĐÃ GỠ — anh Tiến chốt 29/07
            ══════════════════════════════════════════════════════════════════
            Nguyên văn: *"editor sẽ sửa trong phần Properties của Pr luôn,
            không cần phải thêm chỗ này"*.

            Đúng: Premiere có sẵn panel Text/Captions, sửa thẳng trên timeline
            thì thấy ngay chữ nằm ở đâu — tiện hơn gõ vào một bảng rời rồi
            chạy lại cả lượt.

            Cái MẤT ĐI, ghi ra để sau này ai cần thì biết: bảng đó sửa TỰ ĐỘNG
            cho mọi lần chạy sau, còn Properties là sửa TAY từng lần. Với người
            làm nhiều video cùng một ngành (thuật ngữ lặp lại), cơ chế tự động
            tiết kiệm hơn. Nếu sau này cần bật lại thì `sinhSrt` vẫn nhận tham
            số `bangSua` — chỉ thiếu phần giao diện.
            ══════════════════════════════════════════════════════════════════ */}
      </div>
    </div>
  )
}

/**
 * Khối ĐANG CHẠY — thay cho cái nút xám ngoét mà anh Tiến gọi là "phèn".
 *
 * Ba thứ nó phải trả lời, không bắt ai đoán:
 *   1. Máy còn sống không  -> thanh chạy, không bao giờ đứng im
 *   2. Đang làm gì         -> nhãn nói VIỆC, kèm % khi đo được
 *   3. Còn bao lâu nữa     -> danh sách bước, bước nào xong thì tích
 */
function DangChay({
  nhan,
  phanTram,
  giay,
  buocIdx,
  cacBuoc,
}: {
  nhan: string
  phanTram: number
  giay: number
  buocIdx: number
  cacBuoc: readonly { readonly ten: string; readonly uoc: number }[]
}) {
  const doDuoc = phanTram >= 0

  // ☠️ GIẤU QUY TRÌNH — [2.5.3] anh Tiến 24/08, nhìn đúng dòng "Đang nạp mô hình
  // lên GPU": *"chỗ này anh cần hệ thống báo là đang loading nha em, không phải
  // là nạp mô hình hay nạp vào hệ thống"*. Đây là LUẬT CŨ anh đã chốt 13/08 và
  // Autocut đã theo từ hôm đó — panel này sót lại, nay bê nguyên khuôn của
  // `AiO Autocut/client/src/App.tsx` sang cho hai panel nói giống nhau.
  //
  // Bỏ HAI thứ:
  //   1. `nhan` — tên việc đang chạy ("Đang tách tiếng khỏi video",
  //      "Đang nạp mô hình lên GPU"…)
  //   2. danh sách 4 bước có dấu ✓ / ● / ○
  // Đọc hai thứ đó là ra nguyên pipeline (tách tiếng → nghe hiểu bằng mô hình
  // trên GPU → gắn lên timeline) — phần giá trị nhất của tool, phơi ra cho
  // người quay màn hình là cho không.
  //
  // ☠️ GIỮ đồng hồ và phần trăm, CÓ CHỦ Ý: bỏ nốt thì người dùng không biết máy
  // còn chạy hay đã treo. Luật của chính anh Tiến — *"nút phải có trạng thái
  // XONG rõ ràng"*. Giấu VIỆC ĐANG LÀM, không giấu TIẾN ĐỘ.
  //
  // `nhan` / `buocIdx` / `cacBuoc` vẫn nhận vào nhưng thôi dùng — bộ đếm bước
  // bên trong vẫn chạy (nuôi phần trăm), bật lại danh sách chỉ là thêm JSX.
  void nhan
  void buocIdx
  void cacBuoc

  return (
    <div className="chay" aria-live="polite">
      <div className={doDuoc ? 'chay__thanh' : 'chay__thanh chay__thanh--troi'}>
        {doDuoc && <div className="chay__day" style={{ width: `${phanTram}%` }} />}
        <span className="chay__chu">
          {dich('Đang xử lý')}…{doDuoc && <b>{phanTram}%</b>}
        </span>
        <span className="chay__gio">{dongHo(giay)}</span>
      </div>
    </div>
  )
}

/**
 * Kết quả — người dựng chỉ cần biết ba điều: chép được bao nhiêu câu, phụ đề
 * nằm đâu, chỗ nào phải soát lại. Số kỹ thuật gấp vào trong.
 *
 * ☠️ Khối này là BIÊN LAI CỦA MỘT LẦN CHẠY, không phải trạng thái của sequence
 * đang mở — nên nó PHẢI ghi tên sequence nó thuộc về. Vấp 30/07/2026: anh Tiến
 * đổi qua 3 sequence, cả 3 đều thấy "1.101 câu" của lần chạy cuối và hỏi
 * *"sao cả 3 sequence này thông số lại giống nhau thế em?"*.
 */
function KetQuaPhuDe({
  ket,
  tenSeqKet,
  tenSeqDangMo,
}: {
  ket: KetPhuDe
  tenSeqKet: string
  tenSeqDangMo: string
}) {
  const khacSeq = !!tenSeqKet && !!tenSeqDangMo && tenSeqKet !== tenSeqDangMo
  return (
    <div className="ketqua">
      {/* Chỉ cảnh khi ĐANG MỞ sequence khác — mở đúng thì im lặng. */}
      {khacSeq && (
        <p className="ketqua__dong">
          <b className="canh">
            {dich('Số liệu dưới đây là của «')}
            {tenSeqKet}»
          </b>{' '}
          {dich('— anh đang mở «')}
          {tenSeqDangMo}
          {dich('». Muốn chép cho sequence này thì khoanh vùng rồi bấm lại.')}
        </p>
      )}
      <div className="ketqua__so">
        <div>
          {/* `'vi-VN'` là MÃ VÙNG của `toLocaleString`, không phải chữ hiện ra —
              đừng bọc `dich()` quanh nó. */}
          <b>{ket.soCau.toLocaleString('vi-VN')}</b>
          <span>{dich('câu đã chép')}</span>
        </div>
        <div>
          <b>{mmss(ket.giayTong)}</b>
          <span>{dich('chạy mất')}</span>
        </div>
        <div>
          <b className={ket.soat?.soCho ? 'canh' : undefined}>{ket.soat?.soCho ?? 0}</b>
          <span>{dich('chỗ cần soát')}</span>
        </div>
      </div>

      <p className="ketqua__dong">
        {ket.caption && ket.ganDuoc ? (
          // [2.5.0] Caption kiểu hiệu ứng: nói rõ MẤY graphic, KIỂU gì, TRACK nào —
          // và nhắc rằng bấm vào là sửa được (đó là lý do chọn MOGRT thay vì overlay).
          <>
            {dich('Đã đặt {n} caption kiểu {k} lên V{t} của sequence')
              .replace('{n}', ket.caption.soKhoi.toLocaleString('vi-VN'))
              .replace('{k}', () => ket.caption!.kieu)
              .replace('{t}', String(ket.caption.track))}{' '}
            {tenSeqKet ? <b>«{tenSeqKet}»</b> : dich('đã chạy')}
            {ket.caption.soClip > ket.caption.soKhoi &&
              ' ' +
                dich('({c} clip — mỗi từ một clip để từ đang nói sáng lên)').replace(
                  '{c}',
                  ket.caption.soClip.toLocaleString('vi-VN'),
                )}
            {/* [2.5.3] Câu "Mỗi caption là một graphic — bấm vào là sửa chữ…" đã gỡ
                (anh Tiến 24/08). Người dựng bấm thử một cái là biết ngay. */}
            .
          </>
        ) : ket.ganDuoc
          ? // [2.5.3] Anh Tiến 24/08 gỡ câu này: ba ô số + đường dẫn đã nói đủ
            // "xong rồi, nằm đây". Tên sequence vẫn được bảo vệ bằng CẢNH BÁO
            // `khacSeq` phía trên — nó chỉ hiện khi biên lai thuộc sequence khác,
            // tức đúng lúc con số có thể bị hiểu nhầm.
            null
          : dich(
              'Đã tạo file phụ đề nhưng chưa gắn được lên timeline — mở tay từ đường dẫn dưới.',
            )}
        {/* [2.5.3] Khối "Nghe ra tiếng ..." ĐÃ GỠ — anh Tiến 24/08 khoanh đỏ.
            ☠️ Đánh đổi phải biết: panel chạy `-l auto`, nghe nhầm thứ tiếng thì cả
            bản chép là rác mà nay không còn chỗ nào báo. Ngôn ngữ vẫn nằm trong
            `ket.ngonNgu` — cần bật lại chỉ là thêm mấy dòng JSX ở đây. */}
      </p>
      {/* ☠️ Chi hien TEN FILE. Anh Tien 30/07: *"ban thuong mai khong de
          nguoi dung biet minh dung gi va lam gi"* — duong dan day du vua dai
          vua bay ra cau truc thu muc. Day du nam trong tooltip, ai can thi re
          chuot. */}
      {/* [2.5.3] Anh Tiến 24/08: *"chỗ link này okie nè, hãy cho anh đường link
          kèm nút mở thẳng vào folder chứa nó luôn"*. Bấm là Explorer mở đúng thư
          mục và bôi sáng sẵn file (`explorer /select,`). */}
      <p className="ketqua__duong" title={ket.duongDan}>
        <span className="ketqua__ten">{ket.duongDan.split(/[\/]/).pop()}</span>
        <button
          type="button"
          className="btn btn--phu ketqua__mo"
          title={ket.duongDan}
          onClick={() => moThuMucChuaFile(ket.duongDan)}
        >
          {dich('Mở thư mục')}
        </button>
      </p>

      {!!ket.soat?.soCho && (
        <p className="ketqua__dong">
          {/* Bị trần chặt thì NÓI RA — "60" khi số thật là 433 là nói dối một
              nửa. Không bị trần thì giữ câu gọn, đừng bắt người ta đọc thêm. */}
          {ket.soat.tongCho > ket.soat.soCho ? (
            <>
              {dich('Máy không chắc ở')}{' '}
              <b>
                {ket.soat.tongCho.toLocaleString('vi-VN')} {dich('chỗ')}
              </b>{' '}
              {dich('— đã cắm marker')}{' '}
              <b>
                {ket.soat.soCho} {dich('chỗ tệ nhất')}
              </b>
              {dich('. Bấm')} <kbd>M</kbd> {dich('để đi tới từng chỗ.')}
            </>
          ) : (
            <>
              <b>{ket.soat.soCho} marker</b> {dich('trên timeline — bấm')} <kbd>M</kbd>{' '}
              {dich('để đi tới từng chỗ máy nghe không chắc.')}
            </>
          )}
        </p>
      )}

      {/* ☠️ KHỐI "MÁY ĐÃ LÀM NHỮNG GÌ" ĐÃ GỠ KHỎI MÀN HÌNH — 29/07.
          Anh Tiến chỉ vào nó trên panel Autocut: *"ở phần autocut anh bảo em
          đã bỏ phần này đi mà em"*. Trước đó anh đã nói một lần: *"ở phần chi
          tiết em có thể ẩn hoặc remove đi vì anh thấy dư thừa, cái đó chủ yếu
          là thuật toán của mình thôi"*. Phiên trước chọn "gấp lại" thay vì bỏ
          — nói hai lần thì đó là quyết định, không phải góp ý.

          `buoc[]` VẪN ĐƯỢC THU THẬP (rẻ, và là thứ duy nhất chứng minh máy
          không bỏ qua bước nào khi cần gỡ lỗi) — chỉ không vẽ ra màn hình.
          Đọc nó qua cổng debug 8091:
              document.querySelector('#root')._reactRootContainer  hoặc
              xem `buoc` trong `PROGRESS.md` của lần chạy tương ứng. */}
    </div>
  )
}

/**
 * Mã ngôn ngữ Whisper -> tên tiếng Việt, để in cho người dựng đọc.
 *
 * Chỉ liệt kê thứ tiếng hay gặp trong nghề dựng phim. Mã lạ thì **trả về chính
 * mã đó** chứ không đoán — người dùng thấy "sw" còn hiểu được là mã ISO, thấy
 * một cái tên bịa thì tưởng panel nhận sai.
 */
const TEN_NGON_NGU: Record<string, string> = {
  vi: 'Việt',
  en: 'Anh',
  zh: 'Trung',
  yue: 'Quảng Đông',
  ja: 'Nhật',
  ko: 'Hàn',
  es: 'Tây Ban Nha',
  pt: 'Bồ Đào Nha',
  fr: 'Pháp',
  de: 'Đức',
  ru: 'Nga',
  it: 'Ý',
  th: 'Thái',
  id: 'Indonesia',
  ms: 'Mã Lai',
  hi: 'Hindi',
  ar: 'Ả Rập',
  tr: 'Thổ Nhĩ Kỳ',
  nl: 'Hà Lan',
  pl: 'Ba Lan',
  uk: 'Ukraina',
  km: 'Khmer',
  lo: 'Lào',
  tl: 'Tagalog',
}

function tenNgonNgu(ma: string): string {
  const m = (ma || '').toLowerCase()
  // Bọc ở đây chứ không bọc trong hằng `TEN_NGON_NGU` (hằng chạy lúc import).
  // Mã lạ thì `dich()` trả lại chính nó — đúng ý bản gốc: thà hiện "sw" còn
  // hơn bịa ra một cái tên.
  return dich(TEN_NGON_NGU[m] ?? m)
}

/** Giây -> "m:ss" cho đồng hồ trên nút. */
function dongHo(giay: number): string {
  const m = Math.floor(giay / 60)
  const s = giay % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

/** Kích thước file trên đĩa (byte), 0 nếu không đọc được. */
function doDaiFile(p: string): number {
  try {
    const fs = getFs()
    return fs ? fs.statSync(p).size : 0
  } catch {
    return 0
  }
}

/**
 * Sinh file .srt rồi gắn lên sequence đang mở.
 *
 * File .srt ghi **cạnh video gốc**, KHÔNG ghi vào `%APPDATA%`: Premiere Beta
 * chạy với AppData bị ảo hoá nên cả Node lẫn ExtendScript đều không thấy file
 * mới tạo ở đó (đo thật 2026-07-28 — xem PROGRESS.md).
 */
async function ganPhuDeVao(
  mediaPath: string,
  cau: CauNoi[],
  keeps: Segment[],
  bangSua: ThayTu[],
  bao: (s: string) => void,
  bangSan?: Moc[],
  gioiHan?: ReturnType<typeof gioiHanTheoKhung>,
  /** [2.4.0] Moc tung TU tren FILE GOC — de dat moc cac mau cat ra dung cho
   *  nguoi ta noi that, thay vi chia deu theo so chu. */
  tuTinCay?: { chu: string; giay: number; p: number }[],
  /** [2.5.0] Kiểu caption. Có `mogrt` thì đặt graphic thay vì caption track. */
  kieu: MoTaKieuCaption = timKieu('mac-dinh'),
  khung: KieuKhung = 'ngang',
  /** Bề rộng khung sequence THẬT (px) — để co chữ đúng; 0 = suy từ `khung`. */
  rongKhungPx = 0,
): Promise<{
  soCau: number
  soBo: number
  duongDan: string
  ganDuoc: boolean
  caption?: { kieu: string; soKhoi: number; soClip: number; track: number }
}> {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path) throw new Error(dich('Panel không dùng được Node.js'))

  bao(dich('Đang quy đổi mốc thời gian…'))
  const { noiDung, soCau, soBo } = sinhSrt(
    cau as Cau[],
    keeps,
    bangSua,
    bangSan,
    gioiHan,
    tuTinCay,
  )
  if (!soCau) throw new Error(dich('Không câu nào rơi vào phần đã giữ lại.'))

  // ══════════════════════════════════════════════════════════════════════════
  // [2.5.0] KIỂU HIỆU ỨNG → mỗi khối một graphic MOGRT, không tạo caption track.
  // File .srt bên dưới VẪN ghi (bản nguồn chữ để sửa rồi chạy lại; và là thứ
  // người dùng mở được bằng mọi trình phát). Chỉ bỏ bước `ganPhuDe`.
  // ══════════════════════════════════════════════════════════════════════════
  if (kieu.mogrt) {
    const khoi = dungKhoiCaption(
      cau as Cau[],
      bangSan ?? [],
      bangSua,
      kieu,
      khung,
      tuTinCay,
      rongKhungPx,
    )
    if (!khoi.length) throw new Error(dich('Không câu nào rơi vào phần đã giữ lại.'))
    const srtPath = ghiSrt(fs, path, mediaPath, noiDung)

    const tu = khoi[0].tu
    const den = khoi[khoi.length - 1].den
    bao(dich('Đang đặt caption lên timeline…'))
    // Chạy lại thì THAY, không chồng hai lớp (luật "có đường vào phải có đường
    // ra"; và caption chồng caption là thứ người dùng không bao giờ muốn).
    await xoaCaptionAiO(tu, den)
    const tr = await chonTrackCaption(tu, den)
    if (tr.vIdx < 0) {
      throw new Error(
        dich('Không còn track video trống trong vùng — thêm một track video rồi chạy lại.') +
          (tr.loi ? ` (${tr.loi.message})` : ''),
      )
    }
    const mogrtPath =
      kieu.mogrtPath ?? extensionPath().replace(/\\/g, '/') + '/mogrt/' + kieu.mogrt + '.mogrt'
    const viTriY = viTriYTheoKhung(khung)

    // Theo LÔ 25 khối: mỗi lô một lượt evalScript (~100 ms/khối sau lần nạp
    // template đầu ~2,5 s) → nhãn tiến độ nhảy đều, Premiere không bị giữ lâu.
    const LO = 25
    let daDat = 0
    let loiDau = ''
    for (let i = 0; i < khoi.length; i += LO) {
      const lo = khoi.slice(i, i + LO)
      const r = await datCaptionMogrt(mogrtPath, tr.vIdx, viTriY, maHoaKhoi(lo))
      if (r.loi) {
        loiDau = r.loi.message
        break
      }
      daDat += r.daDat
      if (!loiDau && r.loiDau) loiDau = r.loiDau
      bao(
        dich('Đang đặt caption {a}/{b}…')
          .replace('{a}', String(Math.min(i + LO, khoi.length)))
          .replace('{b}', String(khoi.length)),
      )
    }
    if (!daDat) {
      throw new Error(
        dich('Không đặt được caption lên timeline: {l}').replace('{l}', () => loiDau || '?'),
      )
    }
    return {
      soCau: khoi.length,
      soBo,
      duongDan: srtPath,
      ganDuoc: true,
      // Karaoke đặt MỖI TỪ một clip (host chẻ khối) nên `daDat` > số khối: báo số
      // KHỐI người đọc hiểu, kèm số clip để khỏi ngạc nhiên khi nhìn timeline.
      caption: { kieu: kieu.ten, soKhoi: khoi.length, soClip: daDat, track: tr.vIdx + 1 },
    }
  }

  // Tên có GIỜ PHÚT GIÂY, không ghi đè file cũ. Hai lý do:
  //   1. Premiere đọc nội dung .srt vào bộ nhớ lúc import; ghi đè file trên đĩa
  //      thì caption đã nằm trên timeline KHÔNG đổi theo — chạy lại lần hai mà
  //      vẫn ra phụ đề cũ, rất khó hiểu cho người dùng.
  //   2. Anh Tiến có thể đã sửa tay file trước; ghi đè là xoá công của người ta.
  const srtPath = ghiSrt(fs, path, mediaPath, noiDung)

  bao(dich('Đang gắn phụ đề lên timeline…'))
  const { ok } = await ganPhuDe(srtPath)

  return { soCau, soBo, duongDan: srtPath, ganDuoc: ok }
}

/** Ghi file .srt cạnh video gốc, tên có giờ phút giây (xem chú thích trong `ganPhuDeVao`). */
function ghiSrt(
  fs: NonNullable<ReturnType<typeof getFs>>,
  path: NonNullable<ReturnType<typeof getPath>>,
  mediaPath: string,
  noiDung: string,
): string {
  const gio = new Date()
  const p2 = (n: number) => String(n).padStart(2, '0')
  const dau = `${p2(gio.getHours())}${p2(gio.getMinutes())}${p2(gio.getSeconds())}`
  const thuMuc = path.dirname(mediaPath)
  const ten = path.basename(mediaPath).replace(/\.[^.]+$/, '')
  const srtPath = path.join(thuMuc, `${ten}-autocut-${dau}.srt`)
  fs.writeFileSync(srtPath, noiDung, 'utf8')
  return srtPath
}
