import { useEffect, useRef, useState } from 'react'
import { NutDoiNgonNgu, dich } from './ngonngu'
// `BangDoan` / `BangMau` THÔI DÙNG 13/08 (anh Tiến bảo gỡ khối "Đoạn sẽ cắt").
// File `BangDoan.tsx` vẫn còn nguyên — muốn bật lại thì import lại ở đây và
// dựng lại khối trong phần JSX (chỗ đã ghi chú rõ).
// `DaiSong.tsx` (canvas sóng dB + đường ngưỡng cam) KHÔNG xoá, chỉ thôi dùng:
// thiết kế 03/08 vẽ timeline kiểu Premiere. Giữ file vì đường ngưỡng nhấp nhô
// theo nền ồn là thứ chứng minh tool không cắt nhầm lời người ngồi xa mic —
// cần trưng ra lại thì có sẵn.
import { TimelineMau, XemTruoc } from './Timeline'
// `MinhHoaNoiDat` KHÔNG xoá file, chỉ thôi dùng: thiết kế 03/08 đưa hình minh
// hoạ vào thẳng hai thẻ "Nơi đặt kết quả" (xem `.dia`/`.bar` trong
// `giao-dien.css`). Giữ file lại vì nó là bản animation đầy đủ hơn — nếu anh
// Tiến thấy hình nhỏ trong thẻ chưa đủ rõ thì lấy lại được ngay.
import type { MucAm } from './services/amluong'
import {
  isInHost,
  evalScript,
  napLaiHost,
  getRange,
  getRangeClips,
  buildKeep,
  catTaiCho,
  hoanTacTaiCho,
  soTrackCoClip,
  dongBoThem,
  dongBoChay,
  type ClipVung,
  type KetQuaDung,
} from './lib/cep'
import { datMarker, ganPhuDe } from './lib/cep'
import { getFs, getPath, nodeAvailable } from './lib/node'
import { detectSilence, getFFmpegPath } from './services/ffmpeg'
import { lapKeHoach, mmss, type CauNoi, type Segment } from './services/plan'
import {
  gopLatMucAm,
  type LatDo,
  doMucAm,
  khoangKhongNoi,
  timKhoangLang,
  uocVungCat,
  vungNgoNgo,
  vungNoiThat,
  type Quang,
} from './services/amluong'
import {
  docDem,
  donWav,
  locDaiGiongNoi,
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
  doiMoc,
  dungBangQuyDoi,
  sinhSrt,
  type Cau,
  type ThayTu,
  type TuTinCay,
} from './services/srt'

/**
 * Màn hình Autocut.
 *
 * Anh Tiến chốt 2026-07-28, nguyên văn:
 *   "Việc của anh là xác định đoạn cần cắt bằng in và out. Nhấn 1 nút - em auto cut."
 *
 * Nên: MỘT nút, chạy hết, không hỏi lại, không nút thủ công nào khác.
 * Không cần bước xác nhận vì kết quả ra một sequence MỚI — sequence gốc còn nguyên,
 * bấm nhầm cũng không mất gì.
 */

/**
 * Ba mức mạnh tay, đo thật ngày 2026-07-28 trên clip 81,77 giây VÀ video 58:37.
 *
 * Cột "còn lại mỗi mối nối" mới là thứ người dựng nhìn thấy trên timeline: đệm
 * giữ hai đầu mỗi khoảng lặng nên mỗi chỗ nối còn đúng `2 × đệm` giây im lặng.
 * Bản đầu để đệm 0,12s → mỗi mối nối còn 0,24s → cộng lại **7 giây im lặng nằm
 * lại** trên timeline. Anh Tiến nhìn ra ngay: "chạy cut rồi mà chưa được sạch".
 *
 * `minSilence` là núm quyết định video nghe DỒN hay THONG THẢ, và cũng quyết
 * định timeline có bao nhiêu đoạn. Đo trên video 58:37 (ngưỡng -25 dB):
 *
 *      0,25s -> 1.852 nhát cắt, rút 15:33      0,60s -> 712 nhát, rút 11:13
 *      0,40s -> 1.173 nhát cắt, rút 13:45      1,00s -> 289 nhát, rút  6:52
 *
 * Nhãn nói VIỆC nó làm, không bắt ai hiểu dB là gì.
 */
const MUC = [
  {
    ten: 'Giữ nhịp',
    noiseDb: -30,
    bien: 2,
    minSilence: 0.6,
    pad: 0.15,
    mo: 'chỉ bỏ chỗ im trên 0,6s · chừa 0,15s hai đầu — thong thả nhất',
  },
  {
    ten: 'Vừa',
    noiseDb: -25,
    bien: 2,
    minSilence: 0.3,
    pad: 0.1,
    mo: 'bỏ chỗ im trên 0,3s · chừa 0,10s hai đầu — cân bằng',
  },
  {
    ten: 'Cắt sạch',
    noiseDb: -22,
    bien: 3,
    minSilence: 0.2,
    pad: 0.06,
    mo: 'bỏ mọi chỗ im trên 0,2s · chừa 0,06s — sát nhất, nhịp dồn',
  },
]

const MAC_DINH = MUC[1]

/**
 * Còn lại bao nhiêu % độ dài, theo từng mức — ĐO THẬT trên video 58:37.
 *
 * Chỉ dùng cho lúc CHƯA phân tích, để ô "Kết quả" có số nói chuyện được ngay
 * khi bấm ba mức. Phân tích xong là thay bằng số thật của chính clip đó.
 * ☠️ Thứ tự phải khớp `MUC`. Đổi `MUC` mà quên đây là ô kết quả nói dối.
 */
const UOC_CON_LAI = [87, 74, 57]

/**
 * Bật lại bảng "Tham số đo" trên màn chính.
 *
 * Để `false` cho người dựng: mấy núm dB/giây là ngôn ngữ của người viết tool.
 * Đổi `true` khi cần dò lại thuật toán — code vẫn còn nguyên bên dưới, không
 * phải viết lại.
 */
const HIEN_THAM_SO = false

/**
 * Các bước của một lần chạy — để vẽ ra cho người dùng thấy đang ở đâu.
 *
 * Nhãn nói VIỆC nó làm, không nói tên kỹ thuật. Số giây là ĐO THẬT trên video
 * 58 phút ngày 29/07, dùng để người dựng ước được còn phải chờ bao lâu.
 */
const CAC_BUOC = [
  { ten: 'Đọc vùng đã khoanh', uoc: 2 },
  { ten: 'Tách tiếng khỏi video', uoc: 45 },
  { ten: 'Đo mức âm', uoc: 3 },
  { ten: 'Nghe hiểu tiếng Việt', uoc: 177 },
  { ten: 'Dựng sequence mới', uoc: 600 },
] as const

/* [2.0.0] CAC_BUOC_PD (bảng bước của phụ đề) đã chuyển sang panel Transcript. */

interface Ket {
  kq: KetQuaDung
  soKhoangLang: number
  giayBo: number
  giayTruoc: number
  giaySau: number
  giayChay: number
  /** Số khoảng lặng bị bỏ vì chừa đệm xong còn ngắn hơn `minCut`. */
  soBoVe: number
  /** Số nhát cắt bị chốt chặn giữ lại vì nuốt trọn một câu nói. */
  soCuu: number
  /** Tool đã quyết định điểm cắt bằng cách nào — in ra cho người dùng soát. */
  cachDo?: string
  /** Có bật nghe hiểu (phụ đề + marker) không. */
  dungAI: boolean
  /** Kết quả phụ đề, rỗng nếu không bật. */
  phuDe?: { soCau: number; soBo: number; giay: number; duongDan: string; ganDuoc: boolean }
  /** Marker đã đặt: tổng số chỗ, điểm tin cậy tệ nhất, và bao nhiêu chỗ máy không chắc. */
  soat?: { soCho: number; temNhat: number; soNgo: number }
  /**
   * Biên bản từng bước: làm gì, ra bao nhiêu, mất mấy giây.
   *
   * Anh Tiến 2026-07-28: *"anh sợ chạy nhanh quá nó chưa kịp phân tích"*.
   * Nghi ngờ đó chính đáng — bấm cái xong ngay thì không có gì chứng minh máy đã
   * làm thật. Nên in ra thứ KHÔNG THỂ có nếu nó bỏ qua bước nào.
   */
  buoc?: { ten: string; ket: string; giay: number }[]
}

/**
 * Kết quả của **Auto Transcript** — kiểu RIÊNG, không dùng chung `Ket`.
 *
 * Vì sao không nới `Ket` cho `kq` thành optional: `Ket` đang gắn chặt với việc
 * dựng (số nhát cắt, giây trước/sau, tên sequence mới). Nới nó ra là mọi chỗ
 * đọc `ket.kq` phải thêm kiểm tra — đụng vào đường cắt vốn đang chạy đúng để
 * phục vụ một tính năng mới. Kiểu riêng rẻ hơn và không phá được gì.
 */
interface KetPhuDe {
  soCau: number
  soTu: number
  giayNghe: number
  duongDan: string
  ganDuoc: boolean
  /** Marker chỗ Whisper nghe không chắc. */
  soat?: { soCho: number; temNhat: number }
  buoc?: { ten: string; ket: string; giay: number }[]
  giayTong: number
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
  /* Gương của `dangChay` cho vòng thăm dò I–O đọc: effect đó chạy MỘT lần
     (deps rỗng) nên đọc thẳng state sẽ mãi thấy giá trị lúc mở panel. */
  const dangChayRef = useRef('')
  useEffect(() => {
    dangChayRef.current = dangChay
  }, [dangChay])
  /**
   * Đồng hồ chạy suốt lúc làm việc.
   *
   * Anh Tiến 2026-07-28: *"em có chạy hay không em phải thay đổi trạng thái cho
   * anh biết chứ"*. Nhãn đứng im hơn một phút (tách tiếng 45s + nạp mô hình lên
   * GPU 30-60s) thì không phân biệt được ĐANG CHẠY với ĐÃ TREO — anh ấy đã mở
   * Task Manager để tự kiểm hai lần.
   *
   * Tiến độ theo % chỉ có ở vài bước; **đồng hồ thì luôn có**. Đây là thứ bảo
   * đảm nút KHÔNG BAO GIỜ đứng im, kể cả ở bước chưa đo được tiến độ.
   */
  const [giayTroi, setGiayTroi] = useState(0)
  const [canLam, setCanLam] = useState('')
  const [loi, setLoi] = useState('')
  const [ket, setKet] = useState<Ket | null>(null)
  const [ketPD, setKetPD] = useState<KetPhuDe | null>(null)

  /**
   * Tiến độ để VẼ, tách khỏi `dangChay` (vốn chỉ là chuỗi để đọc).
   *
   * Anh Tiến 2026-07-29 nhìn nút lúc đang chạy và nói thẳng: *"em nhìn cái này
   * nó phèn chưa"*. Đúng — nút xám ngoét, không gì nhúc nhích, dưới thì trống
   * hoác. Nhìn như treo máy chứ không phải đang làm việc.
   *
   * `buocIdx` = đang ở bước thứ mấy (chỉ số trong `CAC_BUOC`).
   * `phanTram` = -1 nghĩa là chưa đo được (thanh chạy qua lại), 0..100 thì đầy dần.
   */
  const [buocIdx, setBuocIdx] = useState(-1)
  const [phanTram, setPhanTram] = useState(-1)

  const [noiseDb, setNoiseDb] = useState(MAC_DINH.noiseDb)
  const [minSilence, setMinSilence] = useState(MAC_DINH.minSilence)
  const [pad, setPad] = useState(MAC_DINH.pad)
  /** Cao hơn nền ồn CỤC BỘ bao nhiêu dB thì tính là đang nói. Xem `vungNoiThat`. */
  const [bien, setBien] = useState(MAC_DINH.bien)
  const [mucIdx, setMucIdx] = useState(1)

  // ── HAI CÔNG CỤ, MỘT LÕI ───────────────────────────────────────────────
  // Anh Tiến chốt 28/07: *"xong thì riêng — nhưng bây giờ mình phát triển tiếp
  // chung"*. Đây là bước tách đầu tiên, và cũng là hạt giống của lưới thẻ.
  //
  // Auto Transcript = Auto Cut BỎ phần cắt. Chung 80% (tách tiếng 45s + nghe
  // hiểu 177s), khác ở chỗ không dò khoảng lặng, không dựng sequence mới.
  //
  // ☠️ KHÔNG tách được chiều ngược lại: Auto Cut BẮT BUỘC có Whisper. Từ 1.0.0
  // luật cắt là giao hai nguồn; bỏ Whisper là rơi về 0.9.0 — bản đã cắt mất
  // 321 câu. Nên bên 'cat' không được có lựa chọn tắt nghe hiểu.
  // [2.0.0] TÁCH SẢN PHẨM: panel này CHỈ cắt khoảng lặng, không còn biến
  // `congCu` vì không còn gì để chọn. Làm phụ đề nay là panel riêng.

  /**
   * Cắt xong thì đặt kết quả ở đâu. Anh Tiến 2026-07-29: *"có 2 option cho
   * editor lựa em: một là import vào sequence đó luôn, hai là tạo sequence mới"*.
   *
   * Mặc định 'moi' — an toàn, không đụng bản đang dựng. `CLAUDE.md`: *"Đây là
   * công cụ SỬA THẬT vào dự án của người dùng. Cắt nhầm là mất công dựng lại."*
   */
  const [noiCat, setNoiCat] = useState<'moi' | 'taicho'>('moi')

  /**
   * Mô tả clip GỐC của vùng vừa cắt tại chỗ — để dựng lại được.
   *
   * ☠️ Không dựa vào Ctrl+Z: cắt tại chỗ chèn N đoạn = **N bước undo riêng**.
   * Anh Tiến thử 29/07 — cắt 17 đoạn rồi Ctrl+Z, sequence còn **1 clip 3,27
   * giây**. Chính tôi cũng vấp: undo trong vòng lặp → **0 clip, trống trơn**,
   * redo không cứu được. Premiere Beta 26.5 lại **không có** API gộp undo
   * (`app.beginUndoGroup` và bản QE đều undefined — đã đo).
   *
   * Nên panel tự nhớ: file nào, dùng từ giây mấy tới giây mấy, nằm ở đâu trên
   * timeline. Có bấy nhiêu là dựng lại chính xác, không phụ thuộc undo history.
   */
  const [vungGoc, setVungGoc] = useState<ClipVung[] | null>(null)
  const [dangHoanTac, setDangHoanTac] = useState(false)

  /**
   * Vùng I–O đang khoanh — để thanh trên cùng nói được ĐANG CẮT CÁI GÌ.
   *
   * Đọc lúc mở panel và mỗi lần panel được focus lại. Người dựng khoanh I/O
   * bên Premiere rồi mới click sang panel, nên "focus" chính là lúc con số có
   * thể đã cũ. Không dùng hẹn giờ hỏi liên tục: `CLAUDE.md` của dự án cấm
   * tranh CPU với host, mà mỗi lần hỏi là một lượt `evalScript`.
   *
   * `fps` giữ lại để bảng danh sách in được timecode thật (00:00:12:04), thay
   * vì số giây tương đối mà người dựng phải tự cộng vào mốc vùng.
   */
  const [vungTin, setVungTin] = useState<{
    tu: number
    dai: number
    fps: number
    /** Số clip VIDEO trong vùng — timeline xem trước vẽ đúng ngần ấy khe. */
    soClip: number
  } | null>(null)

  /**
   * Những khoảng người dùng bấm **"Giữ lại"** ở bảng xem trước — đừng cắt ở đó.
   *
   * ☠️ Lưu KHOẢNG THỜI GIAN, không lưu chỉ số hàng. Bảng xem trước dựng từ
   * `uocVungCat` (ước lượng nhanh bằng năng lượng), còn lúc cắt thật thì danh
   * sách là giao của Whisper với năng lượng — **hai danh sách khác nhau cả số
   * lượng lẫn thứ tự**. Nhớ theo index là bấm giữ hàng này, chừa nhầm chỗ kia.
   *
   * Đọc qua ref vì luồng cắt là một hàm async chạy dài: đọc thẳng state trong
   * đó là lấy phải giá trị ĐÓNG BĂNG lúc bắt đầu chạy (cùng lý do `thamSoRef`).
   */
  const [giuLai, setGiuLai] = useState<Quang[]>([])
  const giuLaiRef = useRef<Quang[]>([])
  useEffect(() => {
    giuLaiRef.current = giuLai
  }, [giuLai])

  // ── BƯỚC XEM TRƯỚC ──────────────────────────────────────────────────────
  // Tách tiếng + đo mức âm xong (~45 giây) là đã đủ dữ liệu vẽ dải sóng, trong
  // khi Whisper còn chưa chạy. Dừng ở đây cho anh Tiến nhìn rồi chọn mức, xong
  // bấm tiếp mới chạy phần dài (8 phút nghe hiểu + dựng).
  //
  // ☠️ Luồng chạy là một hàm async liên tục, nên các tham số `bien/minSilence/
  // pad` bị ĐÓNG BĂNG trong closure ở thời điểm gọi. Người dùng đổi mức trong
  // lúc chờ mà đọc lại từ state là lấy phải giá trị CŨ — cắt một kiểu, hiện
  // một kiểu. Phải đọc qua ref.
  const [xemTruoc, setXemTruoc] = useState<MucAm | null>(null)
  const tiepTucRef = useRef<(() => void) | null>(null)
  /* Bật lên khi vùng I–O đổi trong lúc luồng đang treo ở bước xem trước —
     báo cho luồng biết là "đừng cắt nữa, số vừa đo thuộc về vùng cũ". */
  const huyXemTruocRef = useRef(false)
  const thamSoRef = useRef({ bien: MAC_DINH.bien, minSilence: MAC_DINH.minSilence, pad: MAC_DINH.pad })
  useEffect(() => {
    thamSoRef.current = { bien, minSilence, pad }
  }, [bien, minSilence, pad])
  // `lamPhuDe` đã BỎ 29/07 — nghe hiểu giờ bắt buộc ở cả hai công cụ, không
  // còn công tắc nào để tắt. Xem khối chú thích chỗ `const dungAI = true`.
  // [2.0.0] Autocut LUÔN dùng mô hình nhanh, không cho chọn: đã đo, hai mô
  // hình cho CÙNG 920 nhát cắt, mà bản chậm lâu hơn 2,7 lần. Việc chọn mô hình
  // chỉ đổi kết quả ở phụ đề -> đã chuyển sang panel Transcript.
  const maMoHinh: MaMoHinh = 'turbo'
  // Chỉ ĐỌC bảng sửa từ (nếu người dùng có panel Transcript và đã dạy máy ở
  // đó). Autocut không sinh chữ nên không có màn hình sửa bảng này.
  const [bangSua] = useState<ThayTu[]>(docBangSua)

  function chonMuc(i: number) {
    setMucIdx(i)
    setNoiseDb(MUC[i].noiseDb)
    setBien(MUC[i].bien)
    setMinSilence(MUC[i].minSilence)
    setPad(MUC[i].pad)
    // Đổi mức là danh sách đoạn dựng lại từ đầu — mốc cũ không còn khớp cái
    // nào, giữ lại thì thành chừa nhầm chỗ. Xoá cho sạch.
    setGiuLai([])
  }

  /** Bấm "Giữ lại" ở một hàng — bật/tắt. Nhớ theo MỐC, không theo số thứ tự. */
  function doiGiu(q: Quang) {
    setGiuLai((cu) =>
      cu.some((g) => g.tu === q.tu && g.den === q.den)
        ? cu.filter((g) => !(g.tu === q.tu && g.den === q.den))
        : [...cu, q],
    )
  }
  /** Chỉnh tay thì bỏ đánh dấu mức — đừng để nhãn nói một đằng số một nẻo. */
  function chinhTay(fn: () => void) {
    fn()
    setMucIdx(-1)
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
      }),
    )
  }, [])

  /**
   * Đọc vùng I–O. CHỈ ĐỌC, không đụng gì tới timeline.
   *
   * Nuốt lỗi im lặng: chưa mở sequence, chưa khoanh vùng, host chưa nạp —
   * toàn là trạng thái BÌNH THƯỜNG lúc mới mở panel. Bày lỗi đỏ ở đó là doạ
   * người dùng vì một việc họ chưa kịp làm. Chỗ nào cần báo thì `autoCut()`
   * đã báo rồi, kèm việc phải làm.
   */
  useEffect(() => {
    if (!isInHost()) return
    let con = true
    // Mốc lần đọc trước — để biết vùng có ĐỔI THẬT không, chứ không hỏi lại
    // hàm nặng mỗi nhịp.
    let mocTruoc = ''
    // Tên sequence lần đọc trước. Đổi sequence / đổi project thì tên này đổi
    // theo, và đó là lúc phải hỏi lại thanh trên.
    let seqTruoc = ''

    /** Hỏi hàm NẶNG (duyệt clip) — chỉ gọi khi mốc đã đổi. */
    const docDayDu = () => {
      void getRangeClips()
        .then(({ vung }) => {
          if (!con || !vung) return
          setVungTin({
            tu: vung.vungTu,
            dai: vung.vungDen - vung.vungTu,
            fps: vung.fps,
            soClip: Math.max(1, vung.clips.filter((c) => c.kind === 'V').length),
          })
        })
        .catch(() => {})
    }

    /** Nhịp thăm dò: chỉ đọc 4 con số, so mốc, đổi mới hỏi tiếp. */
    const nhip = () => {
      // ☠️ ĐANG CHẠY THÌ IM — nhưng "đang chạy" KHÔNG PHẢI là `dangChay` khác
      // rỗng. Ở BƯỚC XEM TRƯỚC `dangChay` vẫn mang nhãn "Chờ anh chọn mức":
      // máy không chạy gì cả, nó đang ĐỢI NGƯỜI DÙNG bấm.
      //
      // Bản đầu (19/08 sáng) viết `if (dangChayRef.current) return` nên vòng
      // thăm dò CHẾT ĐỨNG đúng lúc người dùng hay đổi vùng nhất. Đo được:
      // 0 lời gọi host trong 3,2 giây, panel hiện "2 sec" trong khi Premiere
      // báo vùng 53,68s — anh Tiến bắt được ngay ở lần test đầu tiên.
      // Cùng cái bẫy đã ghi trong file này từ 03/08 (nhánh `dangChay` ăn
      // trước `xemTruoc` làm NÚT CẮT không bao giờ hiện). Lặp lại lần hai.
      //
      // Dấu hiệu "đang đợi người dùng" có sẵn: `tiepTucRef.current` khác null
      // đúng bằng khoảng thời gian luồng treo ở bước xem trước.
      if (dangChayRef.current && !tiepTucRef.current) return
      void getRange()
        .then((r) => {
          if (!con) return
          if (!r) {
            // Bỏ khoanh vùng / đóng sequence → xoá số cũ, đừng để nó nằm đó
            // như thể vẫn đúng.
            if (mocTruoc !== '') {
              mocTruoc = ''
              setVungTin(null)
            }
            return
          }
          // ☠️ THANH TRÊN CŨNG PHẢI THEO NGƯỜI DÙNG.
          // Trước đây tên project/phiên bản Premiere chỉ đọc ĐÚNG MỘT LẦN lúc
          // mở panel (`useEffect` deps rỗng). Anh Tiến đổi sang project khác
          // giữa chừng là nó nói sai tên — cùng loại lỗi với ô "Đoạn đang
          // chọn" đứng im, chỉ chưa ai thấy vì hiếm khi đổi project.
          // `seqName` đã đi kèm sẵn trong lời gọi này nên không tốn gì thêm.
          if (r.seqName !== seqTruoc) {
            seqTruoc = r.seqName
            void evalScript('getHostInfo()')
              .then((raw) => {
                if (!con) return
                const phan = raw.split('|')
                setHost(`Premiere ${phan[0] || '?'} · ${phan[phan.length - 1] || '?'}`)
              })
              .catch(() => {})
          }

          const moc = r.tu.toFixed(3) + '|' + r.den.toFixed(3)
          if (moc === mocTruoc) return
          const doiThat = mocTruoc !== ''
          mocTruoc = moc

          // ══════════════════════════════════════════════════════════════════
          // ☠️ VÙNG ĐỔI GIỮA CHỪNG = MỌI SỐ ĐANG HIỆN THUỘC VỀ VÙNG CŨ
          // ══════════════════════════════════════════════════════════════════
          // Đây là lỗi NGUY HIỂM NHẤT trong đợt này, anh Tiến bắt 19/08: panel
          // hiện "Selected range 2 sec" mà bên cạnh vẫn là "Original 54 sec ·
          // Cắt 16 khoảng lặng · 0:54 → 0:47" của lần đo TRƯỚC.
          //
          // Không chỉ hiển thị sai: lúc đó luồng `autoCut` đang TREO ở bước
          // xem trước, ôm nguyên danh sách điểm cắt của vùng cũ. Bấm nút là nó
          // cắt theo vùng CŨ — trên sequence THẬT của người dùng.
          //
          // Nên vùng đổi thì phải HUỶ hẳn bước xem trước, không phải chỉ cập
          // nhật con số. Thà bắt bấm lại còn hơn cắt nhầm chỗ.
          if (doiThat && tiepTucRef.current) {
            huyXemTruocRef.current = true
            tiepTucRef.current()
          }
          // Cập nhật NGAY độ dài từ số vừa đọc — người dùng thấy con số nhảy
          // trong vòng một nhịp, không phải đợi hàm nặng chạy xong.
          setVungTin((cu) => ({
            tu: r.tu,
            dai: r.den - r.tu,
            fps: r.fps,
            soClip: cu?.soClip ?? 1,
          }))
          docDayDu()
        })
        .catch(() => {})
    }

    // Chờ host nạp xong ở effect trên rồi mới hỏi lần đầu.
    const idDau = window.setTimeout(nhip, 600)
    const idLap = window.setInterval(nhip, 1000)
    window.addEventListener('focus', nhip)
    return () => {
      con = false
      window.clearTimeout(idDau)
      window.clearInterval(idLap)
      window.removeEventListener('focus', nhip)
    }
  }, [])

  /**
   * @param chiPhuDe true = **Auto Transcript**: nghe hiểu, sinh phụ đề, đánh
   *   dấu chỗ cần soát — nhưng KHÔNG cắt, KHÔNG dựng sequence mới.
   */
  /** Đặt nhãn + bước + phần trăm trong một nhịp, khỏi quên cập nhật thanh. */
  function baoBuoc(nhan: string, buoc: number, pt = -1) {
    setDangChay(nhan)
    setBuocIdx(buoc)
    setPhanTram(pt)
  }

  async function autoCut(chiPhuDe = false) {
    baoBuoc(dich('Đang đọc vùng đã khoanh…'), 0)
    setLoi('')
    setCanLam('')
    setKet(null)
    setKetPD(null)
    setVungGoc(null)
    const batDau = Date.now()

    try {
      if (!nodeAvailable()) throw new Error(dich('Panel không dùng được Node.js — không gọi được bộ xử lý media.'))
      if (!getFFmpegPath()) throw new Error(dich('Thiếu thành phần xử lý media của panel — cài lại bản mới nhất.'))

      // Nạp lại host mỗi lần bấm: rẻ, và chắc chắn panel nói chuyện với đúng bản
      // code vừa cài chứ không phải bản Premiere giữ từ lúc khởi động.
      if (!(await napLaiHost())) {
        throw new Error(dich('Không nạp được host/index.jsx từ thư mục extension.'))
      }

      // ── 1. Vùng anh khoanh bằng phím I / O ──
      const { vung, loi: loiVung } = await getRangeClips()
      if (!vung) {
        if (loiVung?.canLam) setCanLam(loiVung.message)
        else setLoi(loiVung?.message ?? dich('Không đọc được vùng đã khoanh'))
        return
      }

      // Nhớ mô tả clip gốc TRƯỚC khi cắt — cắt xong là chỉ số clip đổi hết,
      // không đọc lại được nữa. Chỉ cần cho đường cắt-tại-chỗ (đường tạo
      // sequence mới không đụng gì tới bản gốc nên khỏi phải lùi).
      if (!chiPhuDe && noiCat === 'taicho') setVungGoc(vung.clips.slice())

      const doiToc = vung.clips.filter((c) => Math.abs(c.speed - 1) > 0.01)
      if (doiToc.length) {
        setCanLam(
          `Trong vùng có ${doiToc.length} clip đã đổi tốc độ (${(doiToc[0].speed * 100).toFixed(0)}%). ` +
            dich('Autocut chưa quy đổi được thời gian cho clip đổi tốc độ — trả về 100% rồi chạy lại.'),
        )
        return
      }

      // ── 2+3. PHÂN TÍCH: trích tiếng một lần, rồi CPU và GPU chạy SONG SONG ──
      //
      // Đo trên máy anh Tiến: Whisper ăn GPU 87% nhưng CPU mới 10-18%. Nếu chạy
      // tuần tự thì lúc GPU cày, CPU ngồi không — và ngược lại. Nên:
      //    trích WAV (1 lần đọc file gốc)
      //      ├─ GPU: Whisper nghe hiểu       ┐ cùng lúc
      //      └─ CPU: FFmpeg dò biên độ       ┘
      // Dò biên độ chạy trên WAV đã trích (PCM thô) chứ không mở lại video gốc.
      const soFile = new Set(vung.clips.map((x) => x.path)).size
      const daDo = new Map<
        string,
        {
          silences: { start: number; end: number }[]
          fps: number
          cauNoi?: CauNoi[]
          tuTinCay?: TuTinCay[]
          /** Mô tả cách tool quyết định điểm cắt, để in ra cho người dùng soát. */
          cachDo?: string
          /** Chỗ máy không chắc — đã giữ lại, sẽ đánh dấu. */
          ngoNgo?: { tu: number; den: number }[]
        }
      >()

      // Nghe hiểu BẮT BUỘC ở cả hai công cụ:
      //   - Làm phụ đề: không có nó thì chẳng có gì để chép.
      //   - Auto Cut:   luật cắt 1.0.0 là GIAO HAI NGUỒN. Bỏ Whisper là rơi về
      //                 bản 0.9.0 — cái đã cắt mất 321 câu nói của anh Tiến.
      const dungAI = true
      // Auto Cut luôn dùng bản NHANH: đã đo, hai mô hình cho cùng 920 nhát cắt,
      // mà bản chậm lâu hơn 2,7×. Chỉ Làm phụ đề mới cần chọn, vì ở đó chất
      // lượng chữ mới thật sự khác.
      const maDung: MaMoHinh = chiPhuDe ? maMoHinh : 'turbo'
      const boMay = timBoMay(maDung)
      if (!boMay) {
        // ☠️ KHÔNG lùi về "cắt bằng biên độ" nữa. Đó chính là bản 0.9.0, đã đo:
        // **321 câu bị cắt mất quá nửa lời**. Thà không cắt còn hơn cắt hỏng
        // vào dự án thật của người dùng — cắt nhầm là mất công dựng lại.
        setCanLam(
          dich('Chưa cài bộ nghe hiểu nên chưa cắt được. Autocut bắt buộc phải có nó: ') +
            'cắt chỉ dựa vào độ to đã đo thật là mất 321 câu nói.\n' +
            thieuGi(),
        )
        return
      }

      const buoc: NonNullable<Ket['buoc']> = []

      // ☠️ Bước xem trước phải hỏi ĐÚNG MỘT LẦN. Vòng đo chạy cho TỪNG clip
      // trong vùng — không có cờ này thì vùng ba clip là hỏi ba lần.
      // Tham số chốt sau khi người dùng chọn mức ở màn xem trước. Khai báo ở
      // đây (ngoài vòng lặp) vì bước tính điểm cắt bên dưới cũng cần dùng.
      let tsChot = thamSoRef.current
      // ══════════════════════════════════════════════════════════════════
      // GIAI ĐOẠN A — TRÍCH TIẾNG + ĐO MỨC ÂM CHO **MỌI FILE** TRONG VÙNG
      // ══════════════════════════════════════════════════════════════════
      // ☠️ Vì sao phải tách hẳn ra thành một vòng riêng, chạy TRƯỚC:
      // màn xem trước phải vẽ đủ mọi mảnh trong vùng, mà mỗi FILE có một bản
      // đo riêng (`trichTieng` tách theo từng file). Bản cũ hỏi xem trước ngay
      // giữa vòng — lúc đó mới đo xong file đầu — nên chỉ vẽ được file đầu.
      //
      // Ba đời đã sai ở đúng chỗ này (19/08, anh Tiến bắt cả ba):
      //   1. vẽ CẢ FILE            → vùng 16s hiện "Original 54 sec"
      //   2. cắt theo clip ĐẦU     → vùng 19s hiện "Original 6 sec"
      //   3. gộp mảnh CÙNG file    → đúng khi một file, thiếu khi nhiều file
      //
      // Giá phải trả, biết trước: vùng nhiều file thì phải trích hết mới thấy
      // xem trước, tức chờ lâu hơn trước khi được nhìn. Đổi lại con số hiện ra
      // là con số THẬT của cả vùng. Vùng một file (ca thường gặp) không đổi gì.
      // WAV giữ tới cuối luồng thay vì dọn sớm — ~2 MB mỗi phút tiếng, chấp nhận.
      const daTrich = new Map<
        string,
        {
          wav: string
          wavLoc: string | null
          mucAm: ReturnType<typeof docWav>
          fps: number
          duration: number
        }
      >()
      let daTrichXong = 0
      for (const c of vung.clips) {
        if (daTrich.has(c.path)) continue
        daTrichXong++
        const nhan = soFile > 1 ? ` (file ${daTrichXong}/${soFile})` : ''
        baoBuoc(dich('Đang tách tiếng khỏi video') + nhan, 1)
        let t0 = Date.now()
        const { wav, fps, duration } = await trichTieng(c.path, (giayXong) =>
          setDangChay(`Đang tách tiếng khỏi video${nhan}… ${dongHo(giayXong)}`),
        )
        const giayTrich = (Date.now() - t0) / 1000
        // Bước này bị ĐĨA quyết định, không phải CPU: FFmpeg phải đọc hết file gốc.
        // In ra tốc độ đọc thật để nhìn phát biết file đang nằm trên HDD hay SSD —
        // HDD tuần tự ~150-200 MB/s, SSD NVMe 1.500+ MB/s.
        const co = doDaiFile(c.path)
        const tocDo = co > 0 && giayTrich > 0 ? co / 1048576 / giayTrich : 0
        buoc.push({
          ten: dich('Tách tiếng khỏi video'),
          ket:
            (duration > 0 ? `${duration.toFixed(0)}s tiếng` : 'xong') +
            (co > 0 ? ` · đọc ${(co / 1073741824).toFixed(2)} GB` : '') +
            (tocDo > 0 ? ` · ${tocDo.toFixed(0)} MB/s` : ''),
          giay: giayTrich,
        })

        // ── Đo mức âm THẬT của file, để tự chọn ngưỡng thay vì dùng số đặt sẵn ──
        //
        // Đo trên BẢN ĐÃ LỌC dải giọng nói (300–3400 Hz): tách giọng khỏi nền
        // rộng thêm 3,6 dB. Whisper thì vẫn nghe bản GỐC — xem `locDaiGiongNoi`.
        baoBuoc(dich('Đang đo mức âm') + nhan, 2)
        t0 = Date.now()
        const wavLoc = await locDaiGiongNoi(wav)
        const mucAm = docWav(wavLoc || wav)
        buoc.push({
          ten: dich('Đo mức âm của file'),
          ket: mucAm
            ? `nền ${mucAm.nenOn.toFixed(1)} dB · giọng ${mucAm.mucGiong.toFixed(1)} dB ` +
              `· cách nhau ${(mucAm.mucGiong - mucAm.nenOn).toFixed(1)} dB` +
              (wavLoc ? dich(' · đã lọc dải giọng nói') : '')
            : dich('không đọc được WAV — dùng ngưỡng đặt sẵn'),
          giay: (Date.now() - t0) / 1000,
        })
        const nguongDau = mucAm ? mucAm.nguongOtsu : noiseDb
        void nguongDau
        daTrich.set(c.path, { wav, wavLoc, mucAm, fps, duration })
      }

        // ══════════════════════════════════════════════════════════════════
        // DỪNG LẠI CHO NGƯỜI DỰNG NHÌN — trước khi tốn 8 phút nghe hiểu
        // ══════════════════════════════════════════════════════════════════
        // Giữ nguyên `dangChay` (nhãn khác) để nút AUTO CUT vẫn khoá — bỏ trống
        // là bấm được lần hai, chạy chồng hai luồng lên nhau.
        // Làm phụ đề thì không cắt gì, nên ba mức cắt vô nghĩa — bỏ luôn bước
        // dừng, đỡ bắt người dùng bấm thêm một cái không để làm gì.
        // Gộp MỌI mảnh trong vùng, từ MỌI file — theo đúng thứ tự trên
        // timeline (`vung.clips` đã xếp sẵn theo `seqTu`; `gopLatMucAm` không tự
        // sắp được vì mốc nguồn của hai file khác nhau không so với nhau được).
        // Lọc `kind` để clip tiếng đi kèm không bị đếm thành mảnh thứ hai.
        const kindChinh = vung.clips[0]?.kind
        const latVe: LatDo[] = []
        for (const x of vung.clips) {
          if (x.kind !== kindChinh) continue
          const m = daTrich.get(x.path)?.mucAm
          if (m) latVe.push({ m, tu: x.srcTu, den: x.srcDen })
        }
        const gopVe = latVe.length ? gopLatMucAm(latVe) : null

        if (gopVe && !chiPhuDe) {
          setDangChay(dich('Chờ anh chọn mức'))
          setXemTruoc(gopVe)
          await new Promise<void>((r) => {
            tiepTucRef.current = r
          })
          tiepTucRef.current = null
          setXemTruoc(null)

          // ☠️ Thoát nếu vùng I–O đã đổi trong lúc đang treo ở đây. Mọi số vừa
          // đo (mức âm, điểm cắt) thuộc về vùng CŨ — chạy tiếp là cắt nhầm chỗ
          // trên sequence thật. Xem chú thích dài ở vòng thăm dò I–O.
          // Dừng bằng `return` chứ không `throw`: đây không phải lỗi của máy,
          // mà là người dùng vừa đổi ý — báo bằng dòng "cần làm", không phải
          // vệt đỏ. `finally` vẫn chạy nên `dangChay` được dọn sạch.
          if (huyXemTruocRef.current) {
            huyXemTruocRef.current = false
            setCanLam(dich('Vùng chọn đã đổi — bấm lại để phân tích vùng mới.'))
            return
          }

          // Đọc LẠI tham số: người dùng vừa có cơ hội đổi mức ở màn xem trước.
          tsChot = thamSoRef.current
        }

      let daXong = 0
      for (const c of vung.clips) {
        if (daDo.has(c.path)) continue
        daXong++
        const nhan = soFile > 1 ? ` (file ${daXong}/${soFile})` : ''

        // Bấm giờ riêng cho giai đoạn B (giai đoạn A có mốc riêng của nó).
        let t0 = Date.now()
        const daTrichRoi = daTrich.get(c.path)
        if (!daTrichRoi) continue
        const { wav, wavLoc, mucAm, fps, duration } = daTrichRoi
        void fps
        void duration
        const nguongDau = mucAm ? mucAm.nguongOtsu : noiseDb
        const minSilenceD = tsChot.minSilence
        const bienD = tsChot.bien

        baoBuoc(`Đang nghe hiểu tiếng Việt${nhan}`, 3)
        t0 = Date.now()
        // Nếu đo được mức âm thì tự dò khoảng lặng bằng cửa sổ 20 ms (xem
        // `timKhoangLang`) — chính xác hơn `silencedetect` trên phòng quay ồn, và
        // tức thì nên không cần chạy song song với Whisper nữa.
        // Bấm giờ RIÊNG cho bước dò: hai việc chạy cùng lúc nên nếu dùng chung
        // một mốc thì biên bản sẽ báo bước dò tốn cả trăm giây, trong khi nó
        // chạy tức thì. Biên bản mà nói sai thì hỏng cả tác dụng của biên bản.
        const tDo0 = Date.now()
        // Chỉ làm phụ đề thì khỏi dò khoảng lặng — không ai dùng tới kết quả đó.
        const doNhanh = chiPhuDe
          ? { silences: [] as { start: number; end: number }[], fps: -1 }
          : mucAm
            ? { silences: timKhoangLang(mucAm, nguongDau, minSilenceD), fps: -1 }
            : null
        const giayDo = (Date.now() - tDo0) / 1000

        // BỘ ĐỆM: lần trước chạy Auto Cut trên đúng file này đã nghe rồi thì
        // dùng lại, khỏi tốn 3-8 phút. Khoá theo kích thước + giờ sửa của video
        // và theo mô hình, nên file đổi là tự hết hiệu lực.
        const demCu = boMay ? docDem(c.path, maMoHinh) : null

        const [doBienDo, ketNghe] = await Promise.all([
          doNhanh
            ? Promise.resolve(doNhanh)
            : detectSilence(wav, { noiseDb: nguongDau, minSilence: minSilenceD }),
          demCu
            ? Promise.resolve(demCu)
            : boMay
              ? nghe(wav, boMay, (p) =>
                  // Bước dài nhất của cả luồng (3-8 phút). Không có tiến độ thì
                  // người dùng không phân biệt được đang chạy với đã treo.
                  // p = -1 nghĩa là còn đang nạp mô hình lên GPU, chưa nghe —
                  // lúc đó thanh chạy qua lại chứ không đứng ở 0%.
                  baoBuoc(
                    p < 0 ? `Đang nạp mô hình lên GPU${nhan}` : `Đang nghe hiểu tiếng Việt${nhan}`,
                    3,
                    p,
                  ),
                )
              : Promise.resolve(undefined),
        ])
        const giayNghe = (Date.now() - t0) / 1000
        buoc.push({
          ten: doNhanh ? dich('Dò khoảng lặng') : dich('Đo biên độ'),
          ket: `${doBienDo.silences.length} khoảng im lặng ở ${nguongDau} dB`,
          giay: doNhanh ? giayDo : giayNghe,
        })
        if (ketNghe) {
          // Nghe mới thì ghi lại làm bước đệm cho lần sau (và cho Auto Transcript).
          if (!demCu) luuDem(c.path, maMoHinh, ketNghe)
          buoc.push({
            ten: demCu ? dich('Dùng lại kết quả nghe đã có') : dich('Nghe hiểu tiếng Việt (GPU)'),
            ket:
              `${ketNghe.cau.length} câu · ${ketNghe.tu.length} từ` +
              (demCu ? dich(' · không phải nghe lại') : ''),
            giay: demCu ? 0 : giayNghe,
          })
        }

        const fpsGoc0 = fps > 0 ? fps : doBienDo.fps
        let silences = doBienDo.silences
        let cachDo = `chỉ đo năng lượng, ngưỡng ${nguongDau} dB`
        /** Chỗ máy không chắc — giữ lại và đánh dấu, xem `vungNgoNgo`. */
        let ngoNgo: { tu: number; den: number }[] = []

        // ══════════════════════════════════════════════════════════════════
        // GIAO HAI NGUỒN — chỗ chúng KIỂM TRA CHÉO nhau
        // ══════════════════════════════════════════════════════════════════
        //
        // Whisper trả lời "CÓ AI NÓI KHÔNG", năng lượng trả lời "NÓI Ở CHỖ NÀO".
        // Dùng một mình nguồn nào cũng hỏng, đã trả giá cả hai lần:
        //   - chỉ mốc CÂU (0.5.0–0.6.2): phủ 99,2% -> 58 phút cắt được 9,8 giây
        //   - chỉ năng lượng (0.7.0–0.9.0): **321 câu bị cắt mất quá nửa lời**
        //
        // Giao lại thì cắt = phần bù của vùng nói thật. Đo trên video 58 phút,
        // mức "Vừa": 478 nhát, rút 4:41, **0 câu hỏng**.
        if (mucAm && ketNghe && ketNghe.cau.length) {
          const tGiao = Date.now()
          const dai = duration > 0 ? duration : c.srcDen
          const vung = vungNoiThat(mucAm, ketNghe.cau, bienD)
          silences = khoangKhongNoi(vung, dai)
          const phu = vung.reduce((t, v) => t + (v.den - v.tu), 0)
          cachDo = `giao lời nói với năng lượng · biên +${bienD} dB trên nền cục bộ`
          buoc.push({
            ten: dich('Khoanh vùng đang nói'),
            ket:
              `${vung.length} vùng · phủ ${((phu / dai) * 100).toFixed(1)}% thời lượng · ` +
              `${silences.length} khoảng được phép cắt`,
            giay: (Date.now() - tGiao) / 1000,
          })

          // ── Chỗ MÁY KHÔNG CHẮC: giữ lại, nhưng đánh dấu để anh Tiến tự quyết ──
          ngoNgo = vungNgoNgo(vung, ketNghe.tu.map((t) => t.giay))
          if (ngoNgo.length) {
            buoc.push({
              ten: dich('Chỗ máy không chắc'),
              ket:
                `${ngoNgo.length} chỗ · ${ngoNgo.reduce((t, v) => t + (v.den - v.tu), 0).toFixed(1)}s ` +
                dich(`— nghe có tiếng nhưng không ra chữ, GIỮ lại và đánh dấu`),
              giay: 0,
            })
          }
        }

        // ── NGƯỜI DÙNG BẢO ĐỪNG CẮT CHỖ NÀY ───────────────────────────────
        // Nút "Giữ lại" ở bảng xem trước. Lọc bằng GIAO NHAU về thời gian:
        // nhát nào chạm vào khoảng đã giữ thì bỏ nhát đó.
        // Có đường VÀO (bấm giữ) thì phải có đường RA thật — nút bấm được mà
        // không đổi kết quả cắt là bày một công tắc vô nghĩa.
        const giu = giuLaiRef.current
        if (giu.length) {
          const truoc = silences.length
          silences = silences.filter((s) => !giu.some((g) => s.start < g.den && s.end > g.tu))
          buoc.push({
            ten: dich('Chừa chỗ anh bấm Giữ lại'),
            ket: `${giu.length} chỗ · bỏ ${truoc - silences.length} nhát · còn ${silences.length}`,
            giay: 0,
          })
        }

        donWav(wav)
        if (wavLoc) donWav(wavLoc)
        daDo.set(c.path, {
          silences,
          // fps đọc từ lệnh trích (WAV không có phần hình nên tự nó không biết).
          fps: fpsGoc0,
          cauNoi: ketNghe?.cau,
          tuTinCay: ketNghe?.tu,
          cachDo,
          ngoNgo,
        })
      }

      // ══════════════════════════════════════════════════════════════════
      // AUTO TRANSCRIPT dừng ở đây: nghe xong là đủ, không cắt, không dựng.
      // ══════════════════════════════════════════════════════════════════
      // Bảng quy đổi mốc cho phụ đề là MỘT đoạn chạy suốt vùng — tức mốc giữ
      // nguyên như file gốc, vì có cắt gì đâu mà phải dời.
      if (chiPhuDe) {
        const c0 = vung.clips[0]
        const doDuoc0 = c0 ? daDo.get(c0.path) : undefined
        if (!c0 || !doDuoc0?.cauNoi?.length) {
          setCanLam(dich('Không nghe ra câu nào trong vùng này. Kiểm lại xem clip có tiếng không.'))
          return
        }
        // Bảng quy đổi mốc là MỘT đoạn chạy suốt vùng — mốc giữ nguyên như file
        // gốc, vì không cắt gì thì chẳng có gì phải dời.
        const keepsNguyen: Segment[] = [{ start: c0.srcTu, end: c0.srcDen }]

        const pd = await ganPhuDeVao(c0.path, doDuoc0.cauNoi, keepsNguyen, bangSua, setDangChay)
        let kpd: KetPhuDe = {
          soCau: pd.soCau,
          soTu: doDuoc0.tuTinCay?.length ?? 0,
          giayNghe: pd.giay,
          duongDan: pd.duongDan,
          ganDuoc: pd.ganDuoc,
          buoc,
          giayTong: (Date.now() - batDau) / 1000,
        }
        setKetPD(kpd)

        // Marker vẫn đặt: chỗ Whisper nghe không chắc chính là thứ người dựng
        // cần soát nhất, và nó không dính dáng gì tới việc có cắt hay không.
        if (doDuoc0.tuTinCay?.length) {
          const cho = chonChoSoat(doDuoc0.tuTinCay, keepsNguyen)
          const dong = cho.map((c) => `${c.giay.toFixed(3)}|${c.chu}|${c.p.toFixed(3)}|tu`)
          if (dong.length) {
            setDangChay(`Đang đánh dấu ${dong.length} chỗ cần soát…`)
            const { daDat } = await datMarker(dong.join(';'))
            kpd = { ...kpd, soat: { soCho: daDat, temNhat: cho[0]?.p ?? 1 } }
            setKetPD(kpd)
          }
        }
        return
      }

      // ── 4. Tính các đoạn CẦN GIỮ cho từng clip trong vùng ──
      baoBuoc(dich('Đang tính điểm cắt'), 4)
      const phan: string[] = []
      let soKhoangLang = 0
      let giayTruoc = 0
      let giaySau = 0
      // Các đoạn giữ của clip ĐẦU TIÊN — dùng làm bảng quy đổi mốc cho phụ đề.
      let keepsTheoClip: Segment[] = []
      let soBoVe = 0
      let soCuu = 0
      for (const c of vung.clips) {
        const doDuoc = daDo.get(c.path)
        // Làm tròn theo fps của FILE GỐC, KHÔNG phải fps của sequence đang mở:
        // sequence Autocut dựng ra lấy thông số của clip gốc. Lấy nhầm thì Premiere
        // phải snap lại từng đoạn và cộng dồn thành khe hở (đo được 0,16s / 28 đoạn).
        const fpsGoc = doDuoc && doDuoc.fps > 0 ? doDuoc.fps : vung.fps
        const kh = lapKeHoach(doDuoc?.silences ?? [], {
          srcIn: c.srcTu,
          srcOut: c.srcDen,
          pad: tsChot.pad,
          // `minCut` = `minSilence`: khoảng lặng phải còn đủ dài SAU KHI chừa đệm
          // hai đầu thì mới bõ một nhát cắt. Đây là núm quyết định nhịp.
          minCut: tsChot.minSilence,
          minKeep: 0.1,
          fps: fpsGoc,
          // Chốt chặn cuối: nhát nào nuốt trọn nguyên một câu có chữ thì bỏ.
          cauNoi: doDuoc?.cauNoi,
        })
        soKhoangLang += kh.cuts.length
        giayTruoc += kh.truoc
        giaySau += kh.sau
        soBoVe += kh.soBoViQuaNgan
        soCuu += kh.soCuuBoiCauNoi
        if (!keepsTheoClip.length) keepsTheoClip = kh.keeps
        for (const k of kh.keeps) phan.push(moTaDoan(c, k))
      }

      if (!phan.length) {
        setCanLam(dich('Không còn đoạn nào để giữ — chọn mức nhẹ tay hơn rồi chạy lại.'))
        return
      }
      if (soKhoangLang === 0) {
        setCanLam(dich('Không có khoảng lặng nào đủ dài để cắt trong vùng này. Chưa dựng gì cả.'))
        return
      }

      buoc.push({
        ten: dich('Tính điểm cắt'),
        ket:
          `${soKhoangLang} chỗ cắt` +
          (soCuu > 0 ? ` · GIỮ LẠI ${soCuu} chỗ vì có câu nói trong đó` : '') +
          (soBoVe > 0 ? ` · bỏ ${soBoVe} chỗ vì chừa đệm xong còn quá ngắn` : ''),
        giay: 0,
      })

      // ── 5. Dựng sequence mới, CHIA LÔ ──
      //
      // Video vài tiếng ra hàng nghìn đoạn. Nhồi hết vào một lệnh evalScript là
      // chuỗi vài chục nghìn ký tự — không biết ExtendScript nuốt được bao nhiêu,
      // và người dùng ngồi nhìn "Đang dựng…" đứng im không biết còn bao lâu.
      // Chia lô giải cả hai: lệnh ngắn, và đếm được tiến trình.
      const CO_LO = 150
      const tDung = Date.now()
      const gio = new Date()
      const hh = String(gio.getHours()).padStart(2, '0')
      const mm = String(gio.getMinutes()).padStart(2, '0')
      const tenSeqMoi = `${vung.seqName} - autocut ${hh}${mm}`

      // ── Sequence NHIỀU TRACK đi đường riêng ──
      //
      // ☠️ Vấp thật 04/08: anh Tiến cắt podcast (ra 2 cam + 3 track mic) rồi
      // chạy Autocut "cắt tại chỗ" → mic biến mất sạch, thay bằng tiếng camera
      // (nhỏ hơn 15,6 dB). Vì đường cũ xoá mọi track rồi dựng lại chỉ trên
      // V1 + A1 — đúng cho video thường, sai khi tiếng nằm ở track riêng.
      //
      // Đường mới dồn MỌI track theo cùng một trục thời gian nên hình/tiếng
      // không lệch nhau và track nào ở đâu vẫn nguyên đó.
      const daTrack = noiCat === 'taicho' ? await soTrackCoClip() : null
      const catDongBo = daTrack?.daTrack === true

      let kq: KetQuaDung | null = null
      for (let i = 0; i < phan.length; i += CO_LO) {
        const lo = phan.slice(i, i + CO_LO)
        const den = Math.min(i + CO_LO, phan.length)
        // Đây là bước dài nhất (83% thời gian chạy) — phải có % thật, đứng im
        // là người dùng tưởng treo. `den/phan.length` là tiến độ ĐO ĐƯỢC.
        baoBuoc(
          catDongBo ? `Đang gom ${den}/${phan.length} đoạn` : `Đang dựng ${den}/${phan.length} đoạn`,
          4,
          Math.round((den / phan.length) * (catDongBo ? 70 : 100)),
        )
        if (catDongBo) {
          // Gom hết rồi mới cắt một lần — hợp nhất khoảng giữ cần biết hết
          // trước, không cắt từng lô được.
          const g = await dongBoThem(lo.join(';'), i === 0)
          if (g.loi) {
            if (g.loi.canLam) setCanLam(g.loi.message)
            else setLoi(g.loi.message)
            return
          }
          continue
        }
        const r =
          noiCat === 'taicho'
            ? await catTaiCho(lo.join(';'), i === 0)
            : await buildKeep(lo.join(';'), tenSeqMoi, i === 0)
        if (!r.kq) {
          if (r.loi?.canLam) setCanLam(r.loi.message)
          else setLoi(r.loi?.message ?? dich('Dựng thất bại'))
          return
        }
        kq = r.kq // lô cuối mang số liệu đầy đủ nhất của cả sequence
      }

      if (catDongBo) {
        baoBuoc(
          `Đang cắt đồng bộ ${daTrack?.trackV ?? 0} track hình · ${daTrack?.trackA ?? 0} track tiếng`,
          4,
          85,
        )
        const r = await dongBoChay()
        if (!r.kq) {
          if (r.loi?.canLam) setCanLam(r.loi.message)
          else setLoi(r.loi?.message ?? dich('Cắt đồng bộ thất bại'))
          return
        }
        kq = r.kq
      }
      if (!kq) {
        setLoi(dich('Dựng thất bại — không có lô nào chạy'))
        return
      }
      // Host chỉ biết số của LÔ CUỐI; số "yêu cầu" phải là tổng của cả loạt,
      // nếu không phần đối chiếu sẽ báo lệch oan. (`hinhClip`/`hinhGiay` thì host
      // đọc lại cả track nên đã đúng cho toàn sequence.)
      kq = { ...kq, yeuCauDoan: phan.length, yeuCauGiay: giaySau }

      buoc.push({
        ten: dich('Dựng sequence mới'),
        ket: `${kq.hinhClip} đoạn hình + ${kq.tiengClip} đoạn tiếng`,
        giay: (Date.now() - tDung) / 1000,
      })

      const ketCat: Ket = {
        kq,
        soKhoangLang,
        giayBo: giayTruoc - giaySau,
        giayTruoc,
        giaySau,
        giayChay: (Date.now() - batDau) / 1000,
        soBoVe,
        soCuu,
        cachDo: vung.clips.length ? daDo.get(vung.clips[0].path)?.cachDo : undefined,
        dungAI,
        buoc,
      }
      setKet(ketCat)

      // ══════════════════════════════════════════════════════════════════
      // ☠️ AUTO CUT KHÔNG TẠO PHỤ ĐỀ — anh Tiến chốt 2026-07-29
      // ══════════════════════════════════════════════════════════════════
      // Nguyên văn: *"tính năng cắt tiếng thì không được tạo phụ đề. Nếu như em
      // cần đọc hiểu phụ đề thì chạy ngầm và làm bước đệm cho phần tạo
      // transcripts chứ không đưa nó vào tính năng auto cut silence"*.
      //
      // Whisper VẪN chạy — bỏ nó là rơi về bản 0.9.0 đã cắt mất 321 câu. Nhưng
      // nghe xong nó chỉ QUYẾT ĐỊNH ĐIỂM CẮT rồi thôi. Kết quả nghe được ghi
      // lại cạnh video (`luuDem`) để lúc bấm Làm phụ đề khỏi nghe lại 3-8 phút.
      const doDuocDau = vung.clips.length ? daDo.get(vung.clips[0].path) : undefined
      const ketDay = ketCat

      // ── 6. Marker: chỉ loại VÀNG — chỗ MÁY KHÔNG CHẮC nên đã GIỮ LẠI ──
      //
      // Marker ĐỎ (Whisper nghe không chắc CHỮ) đã bỏ khỏi đây: đó là chuyện của
      // phụ đề, không phải của việc cắt. Người dựng đang cắt khoảng lặng không
      // cần biết máy nghe nhầm chữ nào.
      //
      // Marker VÀNG thì ở lại, vì nó đúng là chuyện của việc cắt: chỗ nghe có
      // tiếng mà không ra chữ, máy đã giữ lại và không tự quyết thay người dùng.
      if (dungAI && keepsTheoClip.length) {
        const dong: string[] = []
        let soNgo = 0
        if (doDuocDau?.ngoNgo?.length) {
          const bang = dungBangQuyDoi(keepsTheoClip)
          for (const v of doDuocDau.ngoNgo) {
            const g = doiMoc(bang, v.tu)
            if (g < 0) continue // rơi vào đoạn đã cắt bỏ -> khỏi đánh dấu
            const dai = v.den - v.tu
            dong.push(`${g.toFixed(3)}|nghe lại ${dai.toFixed(1)}s|${dai.toFixed(2)}|ngo`)
            soNgo++
          }
        }

        if (dong.length) {
          setDangChay(`Đang đánh dấu ${dong.length} chỗ cần nghe lại…`)
          const { daDat } = await datMarker(dong.join(';'))
          setKet({ ...ketDay, soat: { soCho: daDat, temNhat: 1, soNgo } })
        }
      }
    } catch (e: any) {
      setLoi(String(e?.message ?? e))
    } finally {
      setDangChay('')
      setBuocIdx(-1)
      setPhanTram(-1)
    }
  }

  const trongHost = isInHost()

  // ── SỐ LIỆU CHO KHUNG XEM TRƯỚC ────────────────────────────────────────
  // Tính MỘT LẦN ở đây rồi truyền đi. Dải sóng, bảng danh sách và ba ô Kết quả
  // đều nói về CÙNG một việc; để mỗi chỗ tự tính là kiểu gì cũng có lúc lệch
  // nhau, mà lệch ở đây thì người dùng không có cách nào biết bên nào đúng.
  const cat: Quang[] = xemTruoc ? uocVungCat(xemTruoc, bien, minSilence, pad) : []
  /** Thứ THẬT SỰ sẽ cắt = danh sách trừ đi những chỗ người dùng bấm "Giữ lại".
      Bảng vẫn liệt kê ĐỦ (hàng đang giữ tô khác) để bấm lại được, nhưng mọi
      con số — legend, tiêu đề, ba ô Kết quả, nhãn nút — phải nói theo cái này.
      Bày "43 đoạn sẽ cắt" trong khi đã giữ 3 chỗ là nói dối bằng con số. */
  const catThat = giuLai.length
    ? cat.filter((c) => !giuLai.some((g) => g.tu === c.tu && g.den === c.den))
    : cat
  const tongGiay = xemTruoc ? xemTruoc.cua.length * xemTruoc.buocGiay : (vungTin?.dai ?? 0)
  const boGiay = catThat.reduce((a, c) => a + (c.den - c.tu), 0)
  const conGiay = Math.max(0, tongGiay - boGiay)
  const conPhanTram = xemTruoc
    ? tongGiay > 0
      ? Math.round((conGiay / tongGiay) * 100)
      : null
    : mucIdx >= 0
      ? UOC_CON_LAI[mucIdx]
      : null

  /**
   * "26:17" — bỏ phần lẻ 1/10 giây ở ô tổng quan.
   *
   * `mmss` của `plan.ts` trả "26:17.0". Trong ô hẹp, chuỗi "26:17.0 → 26:01.1"
   * rộng 115px mà lòng ô ở cửa sổ 960px chỉ 113px — đo bằng bề rộng CHUỖI
   * thật, không ước bằng mắt. Người dựng nhìn ô tổng quan không cần 1/10 giây;
   * cần chính xác thì đã có bảng timecode từng đoạn bên trái.
   */
  function mmssGon(giay: number): string {
    const g = Math.max(0, Math.round(giay))
    return `${Math.floor(g / 60)}:${String(g % 60).padStart(2, '0')}`
  }

  /** "4 phút 27 giây" — nói bằng tiếng người, không bắt ai đổi 267 giây trong đầu. */
  function dai(giay: number): string {
    const g = Math.round(giay)
    const p = Math.floor(g / 60)
    return p > 0
    ? `${p} ${dich('phút')} ${g % 60} ${dich('giây')}`
    : `${g} ${dich('giây')}`
  }

  /**
   * Timecode THẬT trên sequence — cộng mốc đầu vùng, đếm theo fps của sequence.
   *
   * Không dùng số giây tương đối trong vùng: người dựng đọc xong còn phải tự
   * cộng vào mốc I mới biết chỗ đó nằm đâu trên timeline. Máy làm được thì
   * đừng bắt người làm.
   */
  function tcode(giayTrongVung: number): string {
    const fps = Math.round(vungTin?.fps || 24) || 24
    const f = Math.round((giayTrongVung + (vungTin?.tu ?? 0)) * fps)
    const p2 = (n: number) => String(n).padStart(2, '0')
    return (
      `${p2(Math.floor(f / (3600 * fps)))}:` +
      `${p2(Math.floor(f / (60 * fps)) % 60)}:` +
      `${p2(Math.floor(f / fps) % 60)}:` +
      `${p2(f % fps)}`
    )
  }

  /* ☠️ BA THỨ DƯỚI ĐÂY TẠM THỜI KHÔNG AI GỌI — GIỮ CÓ CHỦ Ý, 13/08/2026.
     Chúng chỉ phục vụ khối "Đoạn sẽ cắt" mà anh Tiến bảo gỡ hôm nay:
       doiGiu      — bấm "Giữ lại" một đoạn để đoạn đó khỏi bị cắt
       tcode       — đổi giây trong vùng thành timecode tuyệt đối HH:MM:SS:FF
       conPhanTram — phần trăm còn lại sau khi cắt
     KHÔNG xoá vì cả ba đều đã đo kỹ và `BangDoan.tsx` vẫn còn nguyên: bật lại
     bảng thì import lại là chạy, khỏi viết lại từ đầu.
     `void` ở đây chỉ để trình biên dịch thôi báo "khai báo mà không dùng" —
     nó không chạy gì cả. Bật lại bảng thì XOÁ dòng này đi. */
  void doiGiu
  void tcode
  void conPhanTram

  return (
    <div className="app">
      <header className="topbar">
        {/* Icon nhận diện KIÊM đèn báo kết nối — cam là đang nói chuyện được
            với Premiere, xám là không. Không thêm chấm tròn riêng: một thông
            điệp chỉ nói ở MỘT nơi. */}
        <svg
          className={trongHost ? 'ico brand-ico' : 'ico brand-ico brand-ico--tat'}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
        </svg>
        <h1 className="brand">Autocut</h1>
        {/* Version LAY TU package.json luc build (`__VERSION__`), khong go tay.
            Anh Tien 30/07: *"em nho them cac ki hieu version cua 4 tool"*. Da hai
            lan panel chay ban cu ma khong ai biet, phai do qua cong debug moi thay.
            Kiem 3 cho khop nhau: `node design-system/version.mjs`. */}
        <span className="ver">v{__VERSION__}</span>
        <span className="spacer" />
        {/* Nút đổi ngôn ngữ VI/EN. Đặt ở thanh đầu vì nó tác động lên CẢ panel,
            không thuộc riêng bước nào. Đổi ở đây thì mọi panel AiO đổi theo —
            lựa chọn lưu ở `%APPDATA%\AiOStudio\ngonngu.json`, dùng chung cả bộ. */}
        <NutDoiNgonNgu />
        <p className="host" title={host}>
          {host}
        </p>
      </header>

      {/* [2.0.0] TÁCH SẢN PHẨM: panel này CHỈ cắt khoảng lặng, nên bỏ hẳn màn
          hình chào 2 thẻ và nút "Chọn công cụ khác". Làm phụ đề nay là panel
          riêng (com.aiostudio.transcript).
          ☠️ Whisper VẪN CHẠY ở đây — luật cắt là giao hai nguồn, bỏ Whisper là
          rơi về bản 0.9.0 đã cắt mất 321 câu. Chỉ bỏ phần SINH phụ đề. */}
      <div className="wrap">

        {/* VÙNG CHỌN — panel phải nói được ĐANG CẮT CÁI GÌ trước khi nói cắt
            thế nào. Con số đọc thật từ vùng I–O, làm mới mỗi lần panel được
            focus (người dựng khoanh bên Premiere rồi mới click sang đây). */}
        <div className="selbar">
          {/* ☠️ THIẾU `viewBox` là SVG vẽ ở toạ độ gốc 1:1 → cái ngoặc "[ ]"
              bị cắt còn mỗi nét trên, nhìn ra chữ "Γ". Panel thật 03/08 hiện
              đúng như vậy. SVG nào cũng phải có viewBox. */}
          <svg
            className="ico ico-sm"
            viewBox="0 0 24 24"
            style={{ color: 'var(--text-3)' }}
            aria-hidden="true"
          >
            <path d="M9 4H5v16h4M15 4h4v16h-4" />
          </svg>
          <span className="lbl">{dich('Đoạn đang chọn')}</span>
          <span className="val">{vungTin ? dai(vungTin.dai) : dich('chưa khoanh')}</span>
          <span className="spacer" />
          <span className="lbl">{dich('Đổi vùng bằng phím')}</span>
          <kbd className="kbd">I</kbd>
          <kbd className="kbd">O</kbd>
        </div>

        {/* ☠️ LƯỚI HAI CỘT, HAI HÀNG — mốc ngang phải THẲNG giữa hai cột.
            Anh Tiến 03/08: *"tỉ lệ cột ở đây chưa đều nhau"*. Đo được: bề rộng
            đúng tỉ lệ 63,9:36,1 và khoảng cách thẻ đều 12px, nhưng chỗ NỐI giữa
            hai thẻ lệch nhau 20px (trái 440/452, phải 420/432).

            Trong thiết kế hai mốc đó chỉ lệch 2px — nhưng đó là ĂN MAY theo nội
            dung, thêm bớt một dòng là lệch lại. Nên ở đây ràng bằng CẤU TẠO:
            grid 2 hàng, cột phải gộp thành hai nhóm, hàng nào cũng kết thúc
            cùng một mốc ở cả hai cột. */}
        <div className="grid">

        {/* XEM TRƯỚC. Chưa phân tích thì vẽ HÌNH TĨNH theo mức — bấm mức là
            thấy ngay cắt thưa hay dày, không phải chờ chạy. Anh Tiến 29/07 đã
            chỉ thẳng: dòng chữ mô tả mức ("bỏ mọi chỗ im trên 0,2s…") người
            dùng KHÔNG đọc. Phân tích xong thì thay bằng dải sóng THẬT. */}
        <section className="card card--xem">
          <div className="card-hd">
            <h2 className="card-t">{dich('Xem trước kết quả')}</h2>
            {xemTruoc && (
              <div className="legend">
                <span>
                  <i className="sw sw--cut" />
                  {dich('Sẽ cắt')} · <b>{catThat.length}</b>&nbsp;{dich('đoạn')}
                </span>
                <span>
                  <i className="sw sw--keep" />
                  {dich('Giữ lại')}
                </span>
              </div>
            )}
          </div>
          {/* Chưa phân tích thì vẽ TIMELINE MẪU — cùng khuôn `.tl` 92px, chỉ
              khác nguồn số. Trước đó chỗ này là `MinhHoa` cao 36px, nên bấm
              chạy xong bố cục nhảy một nhịp; anh Tiến 03/08: *"tỉ lệ vẫn chưa
              đúng"*. Một ô thì phải một khuôn. */}
          {xemTruoc ? (
            <XemTruoc mucAm={xemTruoc} cat={catThat} soClip={vungTin?.soClip ?? 1} />
          ) : (
            <TimelineMau muc={mucIdx} soClip={vungTin?.soClip ?? 3} />
          )}
        </section>

        {/* ☠️ KHỐI "ĐOẠN SẼ CẮT" ĐÃ GỠ 2026-08-13 — anh Tiến: *"xóa luôn cho anh
            chỗ đoạn sẽ cắt đi em, nó dư thừa"*.

            Đảo ngược quyết định 03/08 (*"em có thể tạo 1 bảng mockup giả để
            khách hàng hình dung cũng được"*). Bảng đó chiếm gần nửa chiều cao
            cột trái mà nói lại đúng thứ dải "Xem trước kết quả" ngay trên nó đã
            vẽ ra rồi — một thông điệp nói ở hai nơi.

            CÁI MẤT ĐI, ghi ra để sau này ai cần thì biết đường bật lại:
              - nút "Giữ lại" từng đoạn (chừa một khoảng lặng khỏi bị cắt)
              - mốc thời gian + độ dài + dạng sóng của từng đoạn
            `BangDoan.tsx` GIỮ NGUYÊN trong mã nguồn, chỉ thôi dùng. `giuLai` /
            `doiGiu` vẫn chạy nên bật lại là thấy đúng trạng thái cũ. Cùng lối
            đã làm với `DaiSong.tsx` và `MinhHoaNoiDat.tsx` hồi 03/08. */}

        {/* ══════════════════════════════════════════════════════════════════
            CỘT PHẢI — MỘT NHÓM LIỀN, 2026-08-18
            ══════════════════════════════════════════════════════════════════
            Trước đây cột phải chẻ làm hai nhóm khoá vào hai hàng lưới, để mốc
            nối giữa chúng thẳng với mốc nối bên trái. Ràng buộc đó nay KHÔNG
            CÒN LÝ DO: bảng "Đoạn sẽ cắt" ở ô (trái, hàng 2) đã gỡ 13/08, nên
            bên trái chỉ còn MỘT khối — không còn mốc nào để mà thẳng hàng.

            Cái giá của việc để nguyên lưới 4 ô khi chỉ còn 3: đo trên panel
            thật 18/08 (936x1008) ra **564 x 540px trắng** ở ô trống, trong khi
            cả cột phải phải nhồi vào 318px và đẩy nút "Hoàn tác cắt" vượt đáy
            màn hình 24px.

            Nay: một cột dọc liền, đi đúng THỨ TỰ LÀM VIỆC —
              Mức cắt → Nơi đặt → BẤM → Kết quả hiện ngay dưới nút → Hoàn tác.
            Đo lại: nút chính từ 59% lên 33% màn hình, hết phải cuộn. */}
        <div className="nhom nhom--phai">

        <section className="card card--muc">
          <div className="card-hd">
            <h2 className="card-t">{dich('Mức cắt')}</h2>
          </div>
          <div className="seg" role="radiogroup" aria-label={dich('Mức cắt')}>
            {MUC.map((m, i) => (
              <button
                key={m.ten}
                role="radio"
                aria-checked={i === mucIdx}
                className={i === mucIdx ? 'seg__nut seg__nut--chon' : 'seg__nut'}
                disabled={!!dangChay}
                onClick={() => chonMuc(i)}
              >
                {/* ☠️ ĐẢO NGƯỢC quyết định 14/08. Nhật ký hôm đó ghi ba mức
                    cắt CỐ Ý giữ tiếng Việt ở bản EN, coi là "thương hiệu" —
                    nên chỗ này để `{m.ten}` trần, không qua `dich()`.
                    Anh Tiến 19/08 nhìn bản EN và gọi đó là lỗi: *"phần chuyển
                    đổi giữa tiếng Anh và tiếng Việt nó đang bị còn giữ 3 chữ
                    tiếng Việt"*. Anh chốt bộ chữ Light · Medium · Aggressive
                    (kiểu đặt tên các tool tự động hay dùng, khách quen
                    AutoCut/Descript đọc là hiểu ngay).
                    Sau lần này, bản EN chỉ còn ĐÚNG MỘT chuỗi tiếng Việt là
                    tên project của người dùng — thứ không được phép dịch. */}
                {dich(m.ten)}
              </button>
            ))}
          </div>
        </section>
        {/* NƠI ĐẶT KẾT QUẢ — THANH HAI NÚT, cùng khuôn với "Mức cắt" ngay trên.
            ══════════════════════════════════════════════════════════════════
            Anh Tiến chốt 2026-08-18: *"làm gọn phần này"*, chọn kiểu thanh
            2 nút và dặn *"chỉ để trong khung đỏ"* — tức lấy đúng tiêu đề +
            thanh nút, KHÔNG lấy dòng mô tả bên dưới.
            Đo thật: khối này 199px → 97px, bằng chằn chặn "Mức cắt" (97px),
            nên hai thanh đọc thành một cặp.

            ☠️ ĐẢO NGƯỢC quyết định 30/07 (*"chỗ này hôm qua anh có bảo là tạo
            một animation timeline để giải thích mà sao em không làm?"*) và
            thiết kế 03/08. Hình hai dải đã gỡ. CÁI MẤT ĐI:
              - hình minh hoạ: một dải hay hai dải, tức bản gốc có bị đụng
                không — thứ chữ không nói thay được, phải đọc rồi tưởng tượng
              - chữ "Bản gốc còn nguyên" / "Sửa thẳng sequence này"
            ⇒ NHÃN NÚT NAY PHẢI TỰ NÓI HẾT Ý. "Cắt tại chỗ" là dấu hiệu duy
              nhất còn lại báo sequence gốc sẽ bị sửa thẳng — ĐỪNG đổi nhãn
              này thành thứ gì mơ hồ hơn. Đường lùi vẫn còn: nút "Hoàn tác
              cắt" hiện sau khi cắt.
            Markup cũ (hai thẻ có hình) xem git log phiên 18/08. */}
        <section className="card card--fill">
          <div className="card-hd">
            <h2 className="card-t">{dich('Nơi đặt kết quả')}</h2>
          </div>
          <div className="seg" role="radiogroup" aria-label={dich('Nơi đặt kết quả')}>
            <button
              type="button"
              role="radio"
              aria-checked={noiCat === 'moi'}
              className={noiCat === 'moi' ? 'seg__nut seg__nut--chon' : 'seg__nut'}
              disabled={!!dangChay}
              onClick={() => setNoiCat('moi')}
            >
              {dich('Sequence mới')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={noiCat === 'taicho'}
              className={noiCat === 'taicho' ? 'seg__nut seg__nut--chon' : 'seg__nut'}
              disabled={!!dangChay}
              onClick={() => setNoiCat('taicho')}
            >
              {dich('Cắt tại chỗ')}
            </button>
          </div>
        </section>

        {/* Ô KẾT QUẢ nay nằm NGAY DƯỚI NÚT (xem khối `.cta` bên dưới) —
            bấm ở đâu thì kết quả hiện ở đó, mắt không phải nhảy đi tìm. */}
        {/* Dòng cảnh báo "Sửa thẳng vào sequence đang mở — Ctrl+Z để hoàn tác"
            đã BỎ 29/07. Hai lý do:
              1. Anh Tiến chỉ thẳng là nó thừa.
              2. Nguy hơn: câu đó NÓI SAI. Đo được là Ctrl+Z KHÔNG cứu nổi cắt
                 tại chỗ — chèn N đoạn = N bước undo, bấm một lần chỉ gỡ một
                 đoạn (anh Tiến thử: 17 đoạn → còn 1 clip 3,27 giây).
            Thay bằng thứ thật sự dùng được: nút "Hoàn tác cắt" sau khi cắt xong.
            Có đường VÀO thì phải có đường RA — và đường ra phải chạy thật. */}

        {/* ☠️ Ô TÍCH "NGHE HIỂU" ĐÃ BỎ KHỎI AUTO CUT (29/07).
            `CLAUDE.md` chốt sẵn: *"Auto Cut BẮT BUỘC phải có Whisper. Từ 1.0.0
            luật cắt là giao hai nguồn; bỏ Whisper là rơi về bản 0.9.0 — cái đã
            cắt mất 321 câu. Nên khi tách, Auto Cut không được có lựa chọn tắt
            nghe hiểu."* Bày một cái công tắc mà bật nó lên là hỏng thì đừng bày.

            Chọn mô hình cũng bỏ nốt: đã đo, hai mô hình cho **cùng 920 nhát cắt**
            — với việc CẮT thì chọn gì cũng vậy, mà bản chậm thì lâu hơn 2,7×.
            Auto Cut luôn dùng bản nhanh. [2.0.0] Ô chọn mô hình nay nằm ở panel
            Transcript, chỗ nó thật sự đổi kết quả. */}

        {/* NÚT CHÍNH Ở DƯỚI CÙNG — anh Tiến 29/07: *"button auto cut em hãy đưa
            nó xuống dưới cùng"*. Đúng thứ tự việc: chọn mức, chọn nơi đặt kết
            quả, xem hình mường tượng — rồi mới bấm chạy.

            MỘT nút cho cả màn hình, đổi VIỆC theo bước đang đứng:
              chưa phân tích  → "Cắt khoảng lặng"  (chạy phân tích)
              đã xem trước    → "Cắt N khoảng lặng" (làm thật, có số)
              đang chạy       → khối tiến trình, chính nó là đèn báo
            Ở khổ hẹp nút này ghim đáy (xem `giao-dien.css`) nên không bao giờ
            trôi khỏi màn hình. */}
        <div className="cta">
          {/* Ô QUY TRÌNH CHẠY — thẻ riêng, NẰM TRÊN nút. Anh Tiến 03/08: *"anh
              muốn quy trình chạy sẽ được có một ô riêng của nó ở trên button
              cắt khoảng lặng"*.

              ☠️ KHÔNG hiện ở bước xem trước. Lúc đó `dangChay` vẫn còn giá trị
              ("Chờ anh chọn mức") vì luồng đang dừng đợi người dùng — nhưng
              chính cái nút ngay dưới đã nói rõ phải làm gì rồi. Anh Tiến:
              *"đúng rồi, bỏ cái đó đi em"*. Một thông điệp chỉ nói ở MỘT nơi. */}
          {dangChay && !xemTruoc && (
            <section className="card card--chay">
              <DangChay
                nhan={dangChay}
                phanTram={phanTram}
                giay={giayTroi}
                buocIdx={buocIdx}
                cacBuoc={CAC_BUOC}
              />
            </section>
          )}

          {/* ☠️ Ở BƯỚC XEM TRƯỚC, `dangChay` VẪN CÓ GIÁ TRỊ ("Chờ anh chọn mức")
              — luồng chạy đang dừng lại đợi người dùng, chứ không phải đã xong.
              Bản đầu 03/08 viết `dangChay ? <DangChay/> : xemTruoc ? <nút>`
              nên nhánh tiến trình ăn trước, NÚT CẮT KHÔNG BAO GIỜ HIỆN.
              Đo trên panel thật: `.cta` có **0 nút** — anh Tiến bị kẹt ở màn
              xem trước, tưởng máy đang chạy trong khi nó đang đợi mình bấm.
              ⇒ Nút xem trước phải xét TRƯỚC `dangChay`, và khối tiến trình
              vẫn hiện bên dưới để biết còn mấy bước nữa. */}
          {xemTruoc ? (
            <button
              className="btn btn--primary"
              disabled={catThat.length === 0}
              onClick={() => tiepTucRef.current?.()}
            >
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
              </svg>
              {catThat.length > 0
                ? // ☠️ NUT CHINH, hien suot man xem truoc — khong duoc de
                  // chuoi ghep tieng Viet o day. PROGRESS 14/08 xep ~15 template
                  // literal vao muc [CHO] voi ly do "chi hien thoang luc chay";
                  // rieng cai nay KHONG thoang: no la nhan cua nut chinh.
                  // Anh Tien bat 19/08 khi soi lai ban EN.
                  `${dich('Cắt')} ${catThat.length} ${dich('khoảng lặng')}`
                : dich('Không có đoạn nào để cắt')}
            </button>
          ) : (
            /* Đang chạy thì nút vẫn ở đó nhưng KHOÁ — để ô tiến trình phía
               trên nó có chỗ đứng đúng như anh Tiến khoanh, và người dùng thấy
               ngay "chỗ này sẽ bấm lại được khi xong". Ẩn hẳn nút thì bố cục
               nhảy một nhịp giữa lúc chạy và lúc xong. */
            <button
              className="btn btn--primary"
              disabled={!!dangChay}
              onClick={() => void autoCut(false)}
            >
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
              </svg>
              {dich('Cắt khoảng lặng')}
            </button>
          )}

        {canLam && <p className="canlam">{canLam}</p>}
        {loi && <pre className="loi">{loi}</pre>}

        {/* ══════════════════════════════════════════════════════════════════
            Ô "KẾT QUẢ" — NGAY DƯỚI NÚT, 2026-08-18
            ══════════════════════════════════════════════════════════════════
            Gộp làm một thẻ duy nhất: dòng cũ→mới (anh Tiến chốt 13/08) + ba
            con số. Trước đây hai thứ này nằm hai chỗ khác nhau — dòng cũ→mới ở
            thẻ "Kết quả" TRÊN nút, ba con số ở DƯỚI nút — nên cùng một chuyện
            mà mắt phải đọc hai nơi.

            ☠️ Ô này LUÔN CÓ MẶT, kể cả lúc chưa chạy (hiện một dòng chữ mời
            bấm). Cố ý: nhờ vậy VỊ TRÍ NÚT KHÔNG NHẢY giữa hai trạng thái. Đừng
            "tối ưu" bằng cách ẩn nó khi rỗng — nút sẽ nhích lên rồi tụt xuống
            mỗi lần chạy xong.

            ☠️ ẨN khi đang chạy — nhường chỗ cho ô tiến trình. Đo ở khổ cửa sổ
            thật (1005x682): ô tiến trình cao 247px mà chỗ trống chỉ 51px; để
            cả hai thì nút chính bị đẩy xuống y=849, rơi khỏi màn hình cao 682.
            Lúc đang chạy ô này cũng chưa có số thật, nên ẩn không mất gì. */}
        <section className={dangChay && !xemTruoc ? 'card card--res an' : 'card card--res'}>
          <div className="card-hd">
            <h2 className="card-t">{dich('Kết quả')}</h2>
          </div>
          {/* ☠️ RÚT CÒN MỘT DÒNG 2026-08-13 — anh Tiến: *"chỗ kết quả này anh
              cần đưa ra một thông báo ngắn gọn: tổng thời cũ - tổng thời gian
              mới"*. Ba ô cũ bỏ vì đều NÓI LẠI thứ đã có sẵn trên màn hình
              (luật "một thông điệp chỉ nói ở MỘT nơi"):
                - "Mức đang chọn"  → khối `Mức cắt` ngay trên đã tô sáng
                - "Còn lại %"      → dải `Sau khi cắt` đã ghi `còn 57%`
                - "Đoạn sẽ cắt"    → ô `Nhát cắt` bên dưới đã đếm rồi */}
          <div className="ket-gon">
            {/* ☠️ CHƯA CHẠY THÌ KHÔNG ĐƯỢC HIỆN SỐ. Anh Tiến bắt lỗi 13/08:
                *"chỗ này chưa chạy mà có kết quả hả em"*.
                Bản đầu hiện `mmssGon(tongGiay)` = độ dài vùng đang khoanh. Con
                số ấy ĐÚNG, nhưng nằm dưới nhãn "Kết quả" thì người đọc hiểu là
                ĐÃ CẮT XONG còn ngần đó — sai hoàn toàn. Cùng loại lỗi với việc
                vẽ "4:27 → 4:27" lúc chưa cắt gì: nói dối bằng dấu mũi tên. */}
            {xemTruoc && tongGiay > 0 ? (
              <>
                <span className="ket-gon__cu">{mmssGon(tongGiay)}</span>
                <span className="ket-gon__ar">→</span>
                <span className="ket-gon__moi">{mmssGon(conGiay)}</span>
              </>
            ) : ket ? null : (
              /* ☠️ KHÔNG dùng `.ket-gon__v` cho câu này. Class đó để hiện dấu
                 "—" nên cỡ chữ 26px/600 — đo bản build 18/08: câu mời bấm hiện
                 to như tiêu đề, chiếm hai dòng. Câu chữ thì phải cỡ chữ. */
              <span className="ket-gon__moibam">{dich('Chưa chạy — bấm nút ở trên.')}</span>
            )}
          </div>
          {ket && <KetQua ket={ket} />}
          {ketPD && <KetQuaPhuDe ket={ketPD} />}
        </section>

        {/* ĐƯỜNG RA của cắt tại chỗ. Chỉ hiện khi đã cắt thẳng vào sequence
            đang mở — đường tạo-sequence-mới không đụng bản gốc nên khỏi cần.
            Có đường VÀO thì phải có đường RA, và đường ra phải chạy thật:
            Ctrl+Z KHÔNG cứu nổi (xem chú thích ở `vungGoc`). */}
        {ket && vungGoc && !dangChay && (
          <div className="lui">
            <button
              className="btn btn--phu"
              disabled={dangHoanTac}
              onClick={() => {
                void (async () => {
                  setDangHoanTac(true)
                  setLoi('')
                  setCanLam('')
                  try {
                    if (!(await napLaiHost())) throw new Error(dich('Không nạp được host.'))
                    const r = await hoanTacTaiCho(vungGoc)
                    if (r.loi) {
                      setCanLam(r.loi.message)
                      return
                    }
                    // Đo LẠI trên timeline chứ không tin "không báo lỗi".
                    setCanLam(
                      `Đã dựng lại: ${r.hinhClip} clip · ${r.hinhGiay.toFixed(2)}s. ` +
                        dich('Sequence về như trước khi cắt.'),
                    )
                    setKet(null)
                    setVungGoc(null)
                  } catch (e: any) {
                    setLoi(String(e?.message ?? e))
                  } finally {
                    setDangHoanTac(false)
                  }
                })()
              }}
            >
              {dangHoanTac ? dich('Đang dựng lại…') : dich('↩ Hoàn tác cắt')}
            </button>
            <span>{dich('Dựng lại sequence như trước khi cắt')}</span>
          </div>
        )}
        </div>
        {/* ↑ .cta — nút chính + mọi thứ nói về KẾT QUẢ của lần bấm đó, gom
            cùng một chỗ để mắt không phải nhảy đi tìm. */}

        </div>
        {/* ↑ .nhom--phai — cot phai lien mot cot, KHONG con chia hai hang */}
        </div>
        {/* ↑ .grid */}

      {/* [2.0.0] BẢNG "SỬA TỪ NGHE NHẦM" đã gỡ khỏi Autocut: nó chỉ có nghĩa
          với phụ đề (dạy máy thuật ngữ ngành để lần sau chép đúng chữ). Autocut
          không sinh chữ nào ra cho người dùng, nên bày ở đây là thừa.
          Bảng này nay nằm ở panel Transcript. */}

      {/* "Tham số đo" là CÔNG CỤ KIỂM CHỨNG của giai đoạn xây, không phải thứ
          người dựng cần. Anh Tiến 29/07 chỉ thẳng là thừa -> TẮT hiển thị.

          ☠️ TẮT chứ KHÔNG XOÁ. `CLAUDE.md`: *"Đừng xoá code đo — chỉ giấu khỏi
          màn hình chính. Lần sau sửa thuật toán lại cần."* Đổi `HIEN_THAM_SO`
          thành true là hiện lại ngay, không phải viết lại từ đầu. */}
      {HIEN_THAM_SO && !xemTruoc && (
      <details className="fold">
        <summary>{dich('Tham số đo')}</summary>
        <div className="params">
          <label>
            <span>{dich('Biên trên nền ồn (dB)')}</span>
            <input
              type="number"
              step="1"
              min="0"
              value={bien}
              onChange={(e) => chinhTay(() => setBien(Number(e.target.value)))}
            />
            <em>
              {dich('To hơn nền ồn')} <b>{dich('quanh chỗ đó')}</b> bao nhiêu dB thì tính là đang nói. Nền
              đo theo từng 30 giây, không phải một số cho cả file — video 58 phút của
              anh nền dao động <b>7,9 dB</b> giữa các phút vì nhiều cam. Đo thật, số câu
              bị cắt mất quá nửa lời: +2 dB → <b>0 câu</b> · +3 → 3 · +4 → 9 · +6 → 31.
              Càng to càng cắt nhiều mà càng dễ ăn vào người nói nhỏ.
            </em>
          </label>
          <label>
            <span>{dich('Khoảng lặng tối thiểu (giây)')}</span>
            <input
              type="number"
              step="0.05"
              min="0.05"
              value={minSilence}
              onChange={(e) => chinhTay(() => setMinSilence(Number(e.target.value)))}
            />
            <em>
              Chừa đệm xong còn ngắn hơn ngần này thì không bõ cắt. Đo trên video 58:37
              ở biên +2: 0,20s → 690 nhát (rút 5:32) · 0,30s → 478 nhát (4:41) ·
              0,40s → 314 nhát (3:45) · 0,60s → 128 nhát (2:16).
            </em>
          </label>
          <label>
            <span>{dich('Ngưỡng im lặng (dB) — dự phòng')}</span>
            <input
              type="number"
              step="1"
              value={noiseDb}
              onChange={(e) => chinhTay(() => setNoiseDb(Number(e.target.value)))}
            />
            <em>
              <b>{dich('Chỉ dùng khi TẮT nghe hiểu.')}</b>{' '}
              {dich(
                'Lúc đó không có lời nói để đối chiếu nên tool phải đoán bằng mình độ to — kém chính xác hơn hẳn.',
              )}
            </em>
          </label>
          <label>
            <span>{dich('Đệm giữ lại hai đầu (giây)')}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={pad}
              onChange={(e) => chinhTay(() => setPad(Number(e.target.value)))}
            />
            <em>
              {dich('Chừa')} <b>{pad.toFixed(2)}s</b>{' '}
              {dich('ở hai đầu mỗi khoảng lặng, nên mỗi mối nối còn lại')}{' '}
              <b>{(pad * 2).toFixed(2)}s</b> {dich('im lặng. Sát quá thì cụt hơi.')}
            </em>
          </label>
        </div>
      </details>
      )}
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
 *
 * `phanTram < 0` = chưa đo được (nạp mô hình lên GPU, tách tiếng…) → thanh chạy
 * qua lại. Đứng ở 0% thì nhìn y như treo.
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

  // ☠️ GIẤU QUY TRÌNH 13/08/2026 — anh Tiến: *"khi chạy không được để lộ thông
  // tin là mình đang làm gì, chỉ cần để là loading là được rồi"*, và khi thấy
  // dòng "Đang nạp mô hình lên GPU": *"cái trạng thái này cũng vậy"*.
  //
  // Đã bỏ HAI thứ:
  //   1. `nhan` — tên việc đang chạy ("Đang tách tiếng khỏi video",
  //      "Đang nạp mô hình lên GPU"…)
  //   2. danh sách 5 bước có dấu ✓ / ● / ○
  //
  // Vì sao đúng cho bản bán: hai thứ đó đọc ra là biết nguyên pipeline —
  // tách tiếng → nghe hiểu bằng mô hình trên GPU → dựng sequence. Đó là phần
  // giá trị nhất của tool, phơi ra cho người quay màn hình là cho không.
  //
  // ☠️ GIỮ LẠI đồng hồ và phần trăm, CÓ CHỦ Ý: bỏ nốt thì người dùng không biết
  // máy còn chạy hay đã treo. Luật của chính anh Tiến — *"nút phải có trạng thái
  // XONG rõ ràng"*. Giấu VIỆC ĐANG LÀM, không giấu TIẾN ĐỘ.
  //
  // `buocIdx` / `cacBuoc` vẫn nhận vào nhưng thôi dùng — bộ đếm bước bên trong
  // vẫn chạy, bật lại danh sách chỉ là thêm mấy dòng JSX.
  void nhan
  void buocIdx
  void cacBuoc

  return (
    <div className="chay">
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

/** Giây -> "m:ss" cho đồng hồ trên nút. */
function dongHo(giay: number): string {
  const m = Math.floor(giay / 60)
  const s = giay % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

/** Một đoạn cần giữ, đóng gói để gửi sang ExtendScript. */
function moTaDoan(c: ClipVung, k: Segment): string {
  return `${c.kind},${c.trackIdx},${c.clipOrd},${k.start.toFixed(4)},${k.end.toFixed(4)}`
}

/**
 * Đọc file WAV rồi đo mức âm.
 *
 * `amluong.ts` cố ý viết THUẦN (không đụng Node) để kiểm được ngoài Premiere,
 * nên việc đọc file nằm ở đây.
 */
function docWav(p: string) {
  try {
    const fs = getFs()
    if (!fs) return null
    return doMucAm(fs.readFileSync(p))
  } catch {
    return null
  }
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
 * Sinh file .srt rồi gắn lên sequence vừa dựng.
 *
 * Dùng lại đúng những câu đã nghe ở bước phân tích — KHÔNG nghe lại. Whisper
 * chạy một lần phục vụ cả hai việc: quyết định cắt ở đâu, và làm phụ đề.
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
  // Không bao giờ trả về `undefined` — hoặc ra kết quả, hoặc ném lỗi. Khai
  // đúng như vậy để bên gọi khỏi phải kiểm tra thừa.
): Promise<NonNullable<Ket['phuDe']>> {
  const fs = getFs()
  const path = getPath()
  if (!fs || !path) throw new Error(dich('Panel không dùng được Node.js'))

  const batDau = Date.now()
  bao(dich('Đang quy đổi mốc thời gian…'))
  const { noiDung, soCau, soBo } = sinhSrt(cau as Cau[], keeps, bangSua)
  if (!soCau) throw new Error(dich('Không câu nào rơi vào phần đã giữ lại.'))

  // Ghi cạnh video gốc — chỗ chắc chắn ExtendScript đọc được.
  //
  // Tên có GIỜ PHÚT GIÂY, không ghi đè file cũ. Hai lý do:
  //   1. Premiere đọc nội dung .srt vào bộ nhớ lúc import; ghi đè file trên đĩa
  //      thì caption đã nằm trên timeline KHÔNG đổi theo — chạy lại lần hai mà
  //      vẫn ra phụ đề cũ, rất khó hiểu cho người dùng.
  //   2. Anh Tiến có thể đã sửa tay file trước; ghi đè là xoá công của người ta.
  const gio = new Date()
  const p2 = (n: number) => String(n).padStart(2, '0')
  const dau = `${p2(gio.getHours())}${p2(gio.getMinutes())}${p2(gio.getSeconds())}`
  const thuMuc = path.dirname(mediaPath)
  const ten = path.basename(mediaPath).replace(/\.[^.]+$/, '')
  const srtPath = path.join(thuMuc, `${ten}-autocut-${dau}.srt`)
  fs.writeFileSync(srtPath, noiDung, 'utf8')

  bao(dich('Đang gắn phụ đề lên timeline…'))
  const { ok } = await ganPhuDe(srtPath)

  return {
    soCau,
    soBo,
    giay: (Date.now() - batDau) / 1000,
    duongDan: srtPath,
    ganDuoc: ok,
  }
}

/**
 * Ba ô số + phần đối chiếu.
 *
 * Ba ô trên cùng là thứ anh Tiến muốn thấy đầu tiên (đúng kiểu AutoCut):
 * bỏ bao nhiêu · tiết kiệm bao nhiêu · chạy mất bao lâu.
 * Phần dưới là ĐO LẠI trên timeline thật — không phải "đã gọi lệnh xong".
 */
/**
 * Kết quả **Auto Transcript** — người dựng chỉ cần biết ba điều: chép được bao
 * nhiêu câu, phụ đề nằm đâu, chỗ nào phải soát lại. Không bày số kỹ thuật.
 */
function KetQuaPhuDe({ ket }: { ket: KetPhuDe }) {
  return (
    <div className="ketqua">
      <div className="ketqua__so">
        <div>
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
        {ket.ganDuoc ? (
          <>{dich('Phụ đề đã gắn lên sequence đang mở.')}</>
        ) : (
          <>{dich('Đã tạo file phụ đề nhưng chưa gắn được lên timeline — mở tay từ đường dẫn dưới.')}</>
        )}
      </p>
      <p className="ketqua__duong">{ket.duongDan}</p>

      {!!ket.soat?.soCho && (
        <p className="ketqua__dong">
          <b>{ket.soat.soCho} marker</b> {dich('trên timeline — bấm')} <kbd>M</kbd>{' '}
          {dich('để đi tới từng chỗ máy nghe không chắc.')}
        </p>
      )}

      {/* ☠️ Khối "Máy đã làm những gì" ĐÃ GỠ 29/07 — xem chú thích ở khối
          KetQua bên dưới. `buoc[]` vẫn được thu thập, chỉ không vẽ ra. */}
    </div>
  )
}

function KetQua({ ket }: { ket: Ket }) {
  const { kq } = ket
  // Ngưỡng phải là MỘT KHUNG HÌNH, không phải một con số tròn cho dễ chịu.
  // Bản trước để 0,3s và nó che đúng cái lỗi 0,16s mà nó lẽ ra phải bắt được.
  const khung = 1 / 25
  const lech = Math.abs(kq.hinhGiay - kq.yeuCauGiay)
  const hoHong = Math.abs(kq.hinhCuoi - kq.hinhGiay)
  const coLoTrong = hoHong > khung
  // Sai số TỔNG ĐỘ DÀI thì cộng dồn theo số đoạn (Premiere làm tròn từng clip về
  // lưới khung hình), nên dung sai phải nới theo. Đo thật: 408 đoạn lệch 0,06s mà
  // timeline vẫn LIỀN MẠCH — báo "không khớp" là báo động giả.
  // Phép kiểm chặt vẫn là `coLoTrong` ở trên: nó bắt hở thật, không nới bao giờ.
  const dungSaiTong = khung * Math.max(1, Math.ceil(kq.hinhClip / 100))
  const tiengKhop = kq.tiengClip > 0 && Math.abs(kq.tiengGiay - kq.hinhGiay) < khung
  const dat = kq.hinhClip > 0 && lech < dungSaiTong && !coLoTrong && kq.soLoi === 0

  return (
    <div className="ket">
      <div className="oso">
        <div className="o">
          <span className="o__nhan">{dich('Nhát cắt')}</span>
          <b className="o__so">{ket.soKhoangLang}</b>
        </div>
        <div className="o">
          <span className="o__nhan">{dich('Rút ngắn')}</span>
          <b className="o__so">{mmss(ket.giayBo)}</b>
        </div>
        <div className="o">
          <span className="o__nhan">{dich('Chạy mất')}</span>
          <b className="o__so">{ket.giayChay.toFixed(1)}s</b>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ☠️ DÒNG KẾT LUẬN + KHỐI "CHI TIẾT KỸ THUẬT" ĐÃ GỠ 2026-08-18
          ══════════════════════════════════════════════════════════════════
          Anh Tiến khoanh đỏ đúng hai khối này: *"remove bỏ cho anh cái này
          anh không cần xem nó đó em"*.

          Đây là lần thứ BA cùng một thứ bị chỉ tên (29/07 hai lần cho khối
          "máy đã làm những gì", nay tới lượt phần đối chiếu) — nên gỡ khỏi
          màn hình, không gấp lại nữa.

          ĐO ĐƯỢC LÚC GỠ: `.fold` cao 225px = 52% cả khối kết quả, và chính
          nó đẩy nút "Hoàn tác cắt" xuống y=1004..1032, tức VƯỢT ĐÁY màn hình
          1008px 24px; vùng cuộn chỉ dư 25px nên phải cuộn hết cỡ mới bấm tới.

          ☠️ CÁI MẤT ĐI — ghi ra để không ai tưởng là bỏ quên:
          dòng đỏ đó là THỨ DUY NHẤT báo tool dựng sai. Ngay lần chạy đang
          xem nó bắt được hở 46,046s (yêu cầu 17 đoạn/46.96s mà dựng ra 51
          đoạn/141.02s). Từ nay lỗi kiểu đó IM LẶNG — không có dấu hiệu nào
          trên màn hình.
          Đã nói lại với anh Tiến và anh vẫn chốt gỡ. Muốn bật lại thì bỏ
          `void` bên dưới và trả hai khối JSX về (git log phiên 18/08).

          `dat` / `coLoTrong` / `tiengKhop` GIỮ NGUYÊN phép tính — rẻ, và là
          thứ duy nhất chứng minh máy có tự soát. Chỉ thôi vẽ ra màn hình.
          Cùng lối đã làm với `BangDoan.tsx` (13/08) và khối "máy đã làm
          những gì" (29/07). */}
      {void dat}
      {void coLoTrong}
      {void tiengKhop}

      {/* CHỖ CẦN SOÁT ở NGOÀI — đây là thứ người dựng phải làm tiếp, không
          được giấu trong mục gấp. `CLAUDE.md`: giữ lại đúng ba con số và danh
          sách chỗ cần soát. */}
      {ket.soat && ket.soat.soCho > 0 && (
        <p className="soat">
          <b>
            {ket.soat.soCho} {dich('chỗ cần nghe lại')}
          </b>{' '}
          — bấm <kbd>M</kbd> {dich('trên timeline để đi tới từng chỗ. Máy đã')} <b>GIỮ</b>{' '}
          {dich('nguyên, không tự cắt.')}
        </p>
      )}


      {/* ══════════════════════════════════════════════════════════════════
          ☠️ KHỐI "MÁY ĐÃ LÀM NHỮNG GÌ" ĐÃ GỠ KHỎI MÀN HÌNH — 29/07
          ══════════════════════════════════════════════════════════════════
          Anh Tiến chụp màn hình khoanh đỏ đúng khối này: *"ở phần autocut anh
          bảo em đã bỏ phần này đi mà em"*. Trước đó anh đã nói một lần rồi:
          *"ở phần chi tiết em có thể ẩn hoặc remove đi vì anh thấy dư thừa,
          cái đó chủ yếu là thuật toán của mình thôi"*.

          Phiên trước chọn "gấp lại thay vì xoá", viện dẫn lời dặn *"đừng xoá
          code đo"*. Đọc lại thì lời dặn đó nói **đừng xoá CODE**, không nói
          phải BÀY nó ra màn hình. Hai chuyện khác nhau — và nói tới lần thứ
          hai thì đó là quyết định, không phải góp ý.

          `buoc[]` VẪN được thu thập đầy đủ (rẻ, và là thứ duy nhất chứng minh
          máy không bỏ qua bước nào). Chỉ không vẽ ra nữa. */}
    </div>
  )
}
