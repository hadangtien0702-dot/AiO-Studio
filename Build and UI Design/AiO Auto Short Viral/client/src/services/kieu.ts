/**
 * AiO Auto Short Viral — HỢP ĐỒNG DỮ LIỆU CHUNG (18–19/09/2026).
 *
 * File này THUẦN: không import Node, không import CEP, không import React.
 * Mọi file khác (host, nghe, não, giao diện) nói chuyện với nhau qua các kiểu ở
 * đây. Đổi một kiểu = đổi hợp đồng của mọi nơi dùng nó → grep hết rồi mới đổi.
 *
 * Hai trục thời gian — nhầm là lệch mốc (Transcripts đã trả giá 2 lần 29/07):
 *   - FILE GỐC : giây tính từ đầu file media (Whisper nghe trên file gốc).
 *   - SEQUENCE : giây TUYỆT ĐỐI trên timeline (0 = đầu sequence, không phải đầu vùng).
 * Tên trường có tiền tố `src` = file gốc; không tiền tố hoặc `seq` = sequence.
 */

// ───────────── Nghe lời: đệm `<tên>.autocut-nghe.json` cạnh video ─────────────

/** Một câu Whisper. Mốc trên FILE GỐC. */
export interface Cau {
  tu: number
  den: number
  chu: string
}

/** Một từ. Mốc trên FILE GỐC. Đệm CHỈ có mốc ĐẦU từ (không có mốc cuối). */
export interface TuTinCay {
  chu: string
  giay: number
  /** 0..1 — Whisper tự chấm nó tin bao nhiêu vào từ này. */
  p: number
}

export interface KetQuaNghe {
  cau: Cau[]
  tu: TuTinCay[]
  /** Mã ngôn ngữ Whisper nhận ra (vi, en…). Đệm v1 không có → coi là 'vi'. */
  ngonNgu?: string
}

/**
 * Bản nghe lấy từ đâu — giao diện phải nói thật với người dùng:
 *  - 'dem-v2'   : đệm do Transcripts / Short Viral ghi (`-l auto`, có ngonNgu)
 *  - 'dem-v1'   : đệm cũ do Autocut ghi (luôn `-l vi`) — video không phải tiếng
 *                 Việt thì nội dung có thể là rác (đo: Conspiracy 93/363 câu Việt
 *                 trên video tiếng Anh) → hiện cờ + nút "Nghe lại".
 *  - 'vua-nghe' : panel này vừa chạy Whisper.
 */
export type NguonNghe = 'dem-v2' | 'dem-v1' | 'vua-nghe'

export interface BanNghe {
  /** Đường dẫn file gốc (dấu `/`). */
  path: string
  ket: KetQuaNghe
  nguon: NguonNghe
  /** Mô hình THẬT đã nghe ('turbo' | 'v3'), không phải mô hình đã xin. */
  moHinh: string
}

// ───────────── Vùng làm việc trên sequence (đọc từ host) ─────────────

/** 'chon' = clip đang chọn trên timeline · 'io' = vùng In/Out. */
export type CheDoVung = 'chon' | 'io'

/** Một clip (hoặc phần clip) nằm trong vùng. */
export interface ClipVung {
  kind: 'V' | 'A'
  trackIdx: number
  /** Chỉ số clip TRONG track (track.clips[clipOrd]) — host dùng để lấy lại trackItem.projectItem. */
  clipOrd: number
  seqTu: number
  seqDen: number
  srcTu: number
  srcDen: number
  speed: number
  path: string
}

export interface VungLam {
  seqId: string
  seqName: string
  fps: number
  cheDo: CheDoVung
  /** Giây trên SEQUENCE. */
  vungTu: number
  vungDen: number
  clips: ClipVung[]
  /** Clip đang TẮT (disabled) bị bỏ qua. */
  soTat: number
  /** Số cặp clip chồng thời gian trên các track khác nhau (multicam xếp chồng). */
  chongLan: number
}

// ───────────── Nội dung đã quy về trục SEQUENCE ─────────────

/** Một từ trên trục SEQUENCE. `den` = mốc đầu từ kế tiếp (hoặc cuối câu). */
export interface TuSeq {
  chu: string
  tu: number
  den: number
  p: number
  /** Chỉ số câu (vào NoiDung.cau) chứa từ này. */
  cau: number
}

export interface CauSeq {
  /** = chỉ số trong NoiDung.cau. */
  id: number
  /** Giây trên SEQUENCE. */
  tu: number
  den: number
  chu: string
  /** Chỉ số từ đầu / cuối+1 của câu trong NoiDung.tu. */
  tuDau: number
  tuCuoi: number
  /** File gốc + mốc gốc — để quay về media khi cần. */
  path: string
  srcTu: number
  srcDen: number
  /** Câu Whisper BỊA ("Hãy subscribe…", "Cảm ơn các bạn đã theo dõi", chuỗi lặp) → hiện "không nghe rõ". */
  bia: boolean
  /** ≥ 50% số từ có p < 0,5. */
  tinCayThap: boolean
}

export interface NoiDung {
  cau: CauSeq[]
  tu: TuSeq[]
  ngonNgu: string
  /** Có file nào đọc từ đệm v1 không (để hiện cờ). */
  coDemV1: boolean
  /** Clip bị bỏ vì chồng thời gian với track được chọn (multicam). */
  soClipBoQua: number
}

// ───────────── Khối (hỏi–đáp) ─────────────

export type CoKhoi =
  | 'mo-dau' // phần trước câu hỏi đầu tiên
  | 'dai' // > 180 s — nên xem lại, máy không tự chia
  | 'ranh-gioi-can-nghe' // câu hỏi bắt đầu GIỮA câu Whisper: mốc = mốc đầu từ, chưa nghe kiểm
  | 'khong-ro-dau-cau' // lùi tìm đầu câu hỏi chạm trần 30 từ
  | 'sua-tay' // người dùng đã gộp/tách/đổi tên

export interface Khoi {
  /** Chỉ số từ ĐẦU khối trong NoiDung.tu — cũng là KHOÁ ổn định của khối. */
  dau: number
  /** Chỉ số từ cuối khối + 1. */
  cuoi: number
  /** Giây trên SEQUENCE. */
  tu: number
  den: number
  /** Nguyên văn câu hỏi mở khối ('' với khối Mở đầu). */
  cauHoi: string
  /** Câu trả lời đầu tiên — để người dựng quyết nhanh. */
  traLoiDau: string
  /** Mặc định = cauHoi (hoặc "Mở đầu"); người dùng sửa được. */
  tieuDe: string
  co: CoKhoi[]
  /** Người dùng bỏ khối này (không đặt marker, không tạo sequence). */
  bo: boolean
}

/** Trạng thái chia khối — nguồn chân lý để gộp/tách/hoàn tác. */
export interface ChiaKhoi {
  /** Chỉ số từ bắt đầu mỗi khối, tăng dần, luôn có 0. */
  ranhGioi: number[]
  /** Sửa tay theo khoá `dau`. */
  tieuDeTay: Record<number, string>
  boTay: Record<number, boolean>
}

// ───────────── Đoạn gốc để dựng sequence mới ─────────────

/** Một đoạn media lấy từ một clip trên timeline — host dựng sequence từ danh sách này. */
export interface DoanNguon {
  kind: 'V' | 'A'
  trackIdx: number
  clipOrd: number
  path: string
  srcTu: number
  srcDen: number
}
