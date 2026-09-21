/**
 * App.tsx — AiO Video Download 0.2.0. Giao diện HƯỚNG A anh Tiến chốt 21/09
 * (canvas "Video Download — 3 hướng giao diện", màn A1 Sẵn sàng + A2 Đang tải):
 * một cột, nút chính ghim ở THANH ĐÁY (khuôn Short Viral).
 *
 * Luật sản phẩm áp ở đây:
 * - Nhãn nút là VIỆC nó làm ("Tải 1080p vào bin", "Dừng", "Nhập vào project").
 * - Nút chính kiêm đèn: xám khi chưa có link, cam khi sẵn sàng, thanh tiến độ
 *   khi chạy, xanh "Đã tải xong" khi xong.
 * - "Trong project" là NHÃN SỐNG (hỏi Premiere theo project đang mở), không
 *   phải cờ lưu, không phải nút xám bị khoá — lỗi "nút ảo" anh bắt 21/09.
 * - Khi chạy KHÔNG lộ quy trình (không tên công cụ, không tên bước).
 * - Có đường vào có đường ra: Dừng · Mở thư mục · Bỏ khỏi danh sách · Dọn mục mất file.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNgonNgu, NutDoiNgonNgu, dich } from './ngonngu'
import { isInHost, chonThuMuc, nhapVaoProject } from './lib/cep'
import { getFs, getPath, nodeAvailable } from './lib/node'
import {
  rutLink, docThongTin, taiVideo, kiemEngine, tuCapNhatEngine, docBanGoi, exeLanCuoi, duongYtDlp, moThuMuc,
  dinhDangThoiLuong, dinhDangMB, taoThumb, duongThumb, fileUrl,
} from './services/ytdlp'
import type { ThongTinVideo, TienDo, GiaiDoan, KetQuaTai, LoiTai, ChatLuong, CookieTrinhDuyet } from './services/ytdlp'
import { docCaiDat, ghiCaiDat, thuMucDownloads, docLichSu, ghiLichSu } from './services/caidat'
import type { CaiDat } from './services/caidat'
import { useHost, useTinhTrang } from './services/dongHanh'
import { Ic } from './ui/Ic'

type TrangThai = 'nghi' | 'dang-doc' | 'san-sang' | 'dang-tai' | 'xong' | 'loi'

/**
 * Một mục "Đã tải". ☠️ KHÔNG còn trường daNhap: "đã vào project" được HỎI
 * Premiere theo project đang mở (dongHanh.ts), không lưu ra đĩa.
 */
interface MucDaTai {
  id: string
  tieuDe: string
  ketQua: KetQuaTai
  /** id video gốc (tên ảnh bìa). */
  videoId?: string
  /** Đường dẫn ảnh bìa; '' = đã thử mà không có hình (MP3). */
  anhBia?: string
  luc?: number
}

/** Thư mục con mặc định cạnh file project (anh Tiến chốt 21/09). */
const TEN_THU_MUC = 'AiO Studio Download'
const TEN_BIN = 'AiO Video Download'

const CHAT_LUONG: { ma: ChatLuong; nhan: string }[] = [
  { ma: 'tot-nhat', nhan: 'Tốt nhất' },
  { ma: '1080', nhan: '1080p' },
  { ma: '720', nhan: '720p' },
  { ma: '480', nhan: '480p' },
  { ma: 'mp3', nhan: 'MP3' },
]

const COOKIES: { ma: CookieTrinhDuyet; nhan: string }[] = [
  { ma: '', nhan: 'Không' },
  { ma: 'edge', nhan: 'Edge' },
  { ma: 'chrome', nhan: 'Chrome' },
  { ma: 'firefox', nhan: 'Firefox' },
]

/** Lỗi nào có nút "Thử lại" — thử lại vô ích thì không mời bấm. */
const THU_LAI_DUOC: LoiTai['ma'][] = ['bi-chan', 'mat-mang', 'khac', 'cookie', 'can-dang-nhap', 'khong-ghi-duoc', 'khong-chay-duoc']

export default function App() {
  const { t, tp, L } = useNgonNgu()
  const trongHost = isInHost()
  const phay = dich(',')
  // index.html khai lang="vi" cứng trong khi mặc định là EN: trình đọc màn hình
  // đọc chữ Anh bằng giọng Việt (soi 21/09). Theo ngôn ngữ đang dùng.
  useEffect(() => {
    document.documentElement.lang = L
  }, [L])

  const [caiDat, setCaiDat] = useState<CaiDat>(() => docCaiDat())
  // Các file đang báo "Trong project" — vòng hỏi 2 s theo dõi riêng chúng (xem useHost).
  const theoDoiRef = useRef<string[]>([])
  const { host, ban, dauHieu, nhip } = useHost(() => theoDoiRef.current)
  const [engine, setEngine] = useState(() => kiemEngine())

  const [url, setUrl] = useState('')
  const link = rutLink(url)
  const [lanDoc, setLanDoc] = useState(0)
  const [trangThai, setTrangThai] = useState<TrangThai>('nghi')
  const trangThaiRef = useRef(trangThai)
  trangThaiRef.current = trangThai
  const [thongTin, setThongTin] = useState<ThongTinVideo | null>(null)
  const [tienDo, setTienDo] = useState<TienDo | null>(null)
  const [giaiDoan, setGiaiDoan] = useState<GiaiDoan>('lay-thong-tin')
  const [lanThu, setLanThu] = useState(1)
  const [loi, setLoi] = useState<LoiTai | null>(null)

  // Lịch sử đọc từ đĩa; bỏ cờ daNhap/loiNhap của bản 0.1.0 (cờ lưu cứng = "nút ảo").
  const [daTai, setDaTai] = useState<MucDaTai[]>(() =>
    docLichSu<any>().map((m) => {
      const { daNhap: _a, loiNhap: _b, ...con } = m || {}
      return con as MucDaTai
    }),
  )
  useEffect(() => {
    ghiLichSu(daTai)
  }, [daTai])

  const [nhapDang, setNhapDang] = useState<Record<string, boolean>>({})
  const [loiNhap, setLoiNhap] = useState<Record<string, string>>({})
  const [vuaMo, setVuaMo] = useState('')
  /**
   * Premiere trả DA_CO (file đã có, tìm bằng cách đi cây không phân biệt hoa/thường)
   * mà phép tìm nhanh vẫn ra 0 → ghi nhớ theo ĐÚNG project đó, để nút "Nhập" không
   * bấm mãi không đổi gì (soi 21/09). Đổi project là tự hết hiệu lực.
   */
  const [daCoTay, setDaCoTay] = useState<Record<string, string>>({})
  const [moCaiDat, setMoCaiDat] = useState(false)
  const [dangChon, setDangChon] = useState(false)

  const dsDuong = daTai.map((m) => m.ketQua.duongDan)
  const { tt, hoiLai } = useTinhTrang(dsDuong, host.duong, dauHieu, nhip)
  theoDoiRef.current = dsDuong.filter((p) => tt[p]?.trongProject === 1 || tt[p]?.trongProject === 2).slice(0, 30)

  // Đổi project → lỗi nhập của project trước không còn nghĩa gì.
  useEffect(() => {
    setLoiNhap({})
  }, [host.duong])

  const huyDoc = useRef<(() => void) | null>(null)
  const huyTai = useRef<(() => void) | null>(null)
  const luotDoc = useRef(0)
  /** Link mà người dùng đã bấm Enter lúc còn đang đọc — chỉ tự tải đúng link đó. */
  const taiKhiDocXong = useRef('')
  const urlRef = useRef<HTMLInputElement>(null)

  // ── Thư mục lưu: mặc định CẠNH FILE PROJECT \ AiO Studio Download ────────
  const path = getPath()
  const thuMucGoiY = path
    ? host.duong
      ? path.join(path.dirname(host.duong), TEN_THU_MUC)
      : path.join(thuMucDownloads(), TEN_THU_MUC)
    : ''
  const thuMucLuu = caiDat.thuMuc || thuMucGoiY

  // Giá trị MỚI NHẤT cho các hàm chạy trong promise (tránh closure cũ).
  const moiNhat = useRef({ caiDat, thuMucLuu, host, link, hoiLai })
  moiNhat.current = { caiDat, thuMucLuu, host, link, hoiLai }

  // Engine TỰ cập nhật ngầm (anh Tiến 21/09 — không còn nút). Chờ 5 s cho panel
  // mở xong; đang tải thì để lần mở sau. (Đọc/tải tự chờ docBanGoi() — xem ytdlp.ts.)
  useEffect(() => {
    const id = window.setTimeout(() => {
      docBanGoi().then(() => {
        if (trangThaiRef.current !== 'dang-tai') tuCapNhatEngine()
      })
    }, 5000)
    return () => window.clearTimeout(id)
  }, [])

  /**
   * Lỗi lạ ('khac') thường là YouTube vừa đổi cơ chế → ép cập nhật engine; có
   * bản mới và người dùng vẫn đang ở ĐÚNG link đó thì tự thử lại, MỘT lần/link.
   */
  const daCuu = useRef('')
  const cuuBangCapNhat = (e: LoiTai, l: string, thu: () => void) => {
    if (e.ma !== 'khac' || !l || daCuu.current === l) return
    daCuu.current = l
    // Engine THẬT SỰ đã chạy lượt lỗi (ghi lúc spawn, không đoán lúc nhận lỗi).
    // Lượt đó chạy lúc đang `-U` thì là bản đóng gói (có thể cũ hơn bản sao tốt)
    // → engine giờ KHÁC cái đã lỗi thì cũng đáng thử lại, dù không có bản mới
    // (Codex soát 21/09, 2 lượt).
    const exeLoi = exeLanCuoi()
    tuCapNhatEngine(true).then((r) => {
      // ☠️ Chỉ thử lại khi panel VẪN đang đứng ở lỗi: người dùng đã tự bấm "Thử
      // lại" thì gọi thêm = HAI lượt tải cùng ghi một file, nút Dừng chỉ giữ được
      // một (Codex soát 21/09).
      const doiEngine = r.moi || (exeLoi !== '' && exeLoi !== duongYtDlp())
      if (doiEngine && moiNhat.current.link === l && trangThaiRef.current === 'loi') {
        setEngine(kiemEngine())
        thu()
      }
    })
  }

  // Mục chưa có ảnh bìa (và file còn) thì tách nền, từng cái một.
  useEffect(() => {
    let dung = false
    const fs = getFs()
    ;(async () => {
      for (const m of daTai) {
        if (dung) return
        if (m.anhBia !== undefined) continue
        try {
          if (!fs || !fs.existsSync(m.ketQua.duongDan)) continue
        } catch {
          continue
        }
        const vid = m.videoId || (/\[([^\]]+)\](?: \d+p| \d+x\d+)?\.\w+$/.exec(m.ketQua.duongDan) || [])[1] || ''
        const anh = vid ? duongThumb(vid) || (await taoThumb(vid, m.ketQua.duongDan)) : ''
        if (dung) return
        setDaTai((ds) => ds.map((x) => (x.id === m.id ? { ...x, videoId: vid, anhBia: anh } : x)))
      }
    })()
    return () => {
      dung = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daTai.length])

  const luuCaiDat = useCallback((phan: Partial<CaiDat>) => {
    setCaiDat((cu) => {
      const moi = { ...cu, ...phan }
      ghiCaiDat(moi)
      return moi
    })
  }, [])

  // ── Đọc thông tin khi link đổi (chờ 400 ms cho gõ xong) ───────────────
  useEffect(() => {
    if (huyDoc.current) {
      huyDoc.current()
      huyDoc.current = null
    }
    if (trangThai === 'dang-tai') return
    setThongTin(null)
    setLoi(null)
    const luot = ++luotDoc.current
    if (!link) {
      // Vừa tải xong thì ô link được xoá — GIỮ đèn xanh cho tới khi dán link mới.
      setTrangThai((cu) => (cu === 'xong' ? 'xong' : 'nghi'))
      return
    }
    setTrangThai('dang-doc')
    const id = window.setTimeout(() => {
      setEngine(kiemEngine())
      const { huy, xong } = docThongTin(link, caiDat.cookies)
      huyDoc.current = huy
      xong
        .then((tt) => {
          if (luot !== luotDoc.current) return // lượt cũ trả muộn — bỏ
          huyDoc.current = null
          setThongTin(tt)
          setLoi(null)
          setTrangThai('san-sang')
          // ☠️ Chỉ tự tải nếu cờ gắn ĐÚNG link vừa đọc (soi 21/09: cờ trần làm link
          // dán sau đó vài phút tự tải + tự nhập mà người dùng không bấm gì).
          if (taiKhiDocXong.current && taiKhiDocXong.current === link) {
            taiKhiDocXong.current = ''
            batDauTai(tt)
          }
        })
        .catch((e: LoiTai) => {
          if (luot !== luotDoc.current || e.ma === 'huy') return
          huyDoc.current = null
          taiKhiDocXong.current = ''
          setLoi(e)
          setTrangThai('loi')
          cuuBangCapNhat(e, link, () => setLanDoc((n) => n + 1))
        })
    }, 400)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link, caiDat.cookies, lanDoc])

  // ── Dán ───────────────────────────────────────────────────────────────
  const dan = async () => {
    try {
      const s = await navigator.clipboard.readText()
      if (s) setUrl(rutLink(s) || s.trim())
    } catch {
      urlRef.current?.focus()
    }
  }

  // ── Tải ───────────────────────────────────────────────────────────────
  const batDauTai = (tt: ThongTinVideo | null) => {
    const { caiDat: cd, thuMucLuu: tm, host: h, link: l } = moiNhat.current
    if (!tt || !l) return
    const eng = kiemEngine()
    setEngine(eng)
    if (!eng.du) return
    const fs = getFs()
    try {
      if (fs && tm && !fs.existsSync(tm)) fs.mkdirSync(tm, { recursive: true })
    } catch (e) {
      setLoi({ ma: 'khong-ghi-duoc', chiTiet: String(e) })
      setTrangThai('loi')
      return
    }
    setLoi(null)
    setTienDo(null)
    setGiaiDoan('lay-thong-tin')
    setLanThu(1)
    setTrangThai('dang-tai')
    // Project LÚC BẤM: tải xong mà anh đã sang project khác thì KHÔNG tự nhập bừa.
    const projectLucBam = h.duong
    const { huy, xong } = taiVideo(
      l,
      { chatLuong: cd.chatLuong, thuMuc: tm, cookies: cd.cookies, id: tt.id },
      setTienDo,
      (g, lan) => {
        setGiaiDoan(g)
        if (lan) setLanThu(lan)
      },
    )
    huyTai.current = huy
    xong
      .then(async (kq) => {
        huyTai.current = null
        const anhBia = await taoThumb(tt.id, kq.duongDan)
        const muc: MucDaTai = { id: tt.id + '-' + Date.now(), tieuDe: tt.tieuDe, ketQua: kq, videoId: tt.id, anhBia, luc: Date.now() }
        // Tải lại đúng file đã có (cùng mức) → thay mục cũ, không nhân đôi.
        setDaTai((ds) => [muc, ...ds.filter((x) => x.ketQua.duongDan !== kq.duongDan)])
        setTrangThai('xong')
        setUrl('')
        const now = moiNhat.current
        // Codec lạ (VP9/AV1) KHÔNG tự nhập: Premiere có thể bung hộp "File Import
        // Failure" — hộp modal chặn mọi panel. Để người dùng tự bấm, có cảnh báo.
        if (trongHost && now.caiDat.nhapVaoProject && !codecLa(kq.vcodec) && now.host.duong && now.host.duong === projectLucBam) {
          await nhap(muc)
        }
      })
      .catch((e: LoiTai) => {
        huyTai.current = null
        if (e.ma === 'huy') {
          setTrangThai(moiNhat.current.link ? 'san-sang' : 'nghi')
          return
        }
        setLoi(e)
        setTrangThai('loi')
        cuuBangCapNhat(e, l, () => batDauTai(tt))
      })
  }

  const dungTai = () => {
    if (huyTai.current) huyTai.current()
  }

  const nhap = async (m: MucDaTai) => {
    const h = moiNhat.current.host
    setNhapDang((s) => ({ ...s, [m.id]: true }))
    setLoiNhap((s) => ({ ...s, [m.id]: '' }))
    const r = await nhapVaoProject(m.ketQua.duongDan, h.duong)
    setNhapDang((s) => {
      const n = { ...s }
      delete n[m.id]
      return n
    })
    if (!r.ok) setLoiNhap((s) => ({ ...s, [m.id]: r.ma }))
    else if (r.ma === 'DA_CO') setDaCoTay((s) => ({ ...s, [m.ketQua.duongDan]: h.duong }))
    moiNhat.current.hoiLai()
  }

  const moMuc = (m: MucDaTai) => {
    setVuaMo(m.id)
    window.setTimeout(() => setVuaMo((v) => (v === m.id ? '' : v)), 1500)
    moThuMuc(m.ketQua.duongDan).then((r) => {
      // Để đo trên panel thật: kết quả kéo cửa sổ lên (LEN / DA_TRUOC / BI_CHAN / KHONG_THAY).
      ;(window as any).__vdMoCuoi = r
      if (r.kq === 'mat') hoiLai()
    })
  }

  const doiThuMuc = async () => {
    setDangChon(true)
    try {
      const tm = await chonThuMuc(thuMucLuu, t('Chọn thư mục lưu video'))
      if (tm) luuCaiDat({ thuMuc: tm })
    } finally {
      setDangChon(false)
    }
  }

  const thuLai = () => {
    if (thongTin) batDauTai(thongTin)
    else setLanDoc((n) => n + 1)
  }

  // ── Chữ ───────────────────────────────────────────────────────────────
  /**
   * Nhãn mức sẽ tải THẬT. Video không có mức đang chọn (tối đa 720p mà chọn
   * 1080p) thì engine lấy mức cao nhất có sẵn → nút phải ghi "720p", không hứa
   * "1080p" (luật "nhãn nút là VIỆC nó làm" — soi 21/09).
   */
  const nhanChatLuong = (ma: ChatLuong) => {
    if (ma === 'tot-nhat') return t('bản tốt nhất')
    if (ma === 'mp3') return 'MP3'
    const cao = thongTin?.chieuCao || []
    if (cao.length && !cao.some((h) => h >= Number(ma))) return cao[0] + 'p'
    return ma + 'p'
  }
  // "vào bin" chỉ khi thật sự sẽ nhập: có Premiere, bật công tắc, project ĐÃ LƯU.
  const vaoBin = trongHost && caiDat.nhapVaoProject && !!host.duong

  const nhanLoi = (e: LoiTai): string => {
    const tenCookie = (COOKIES.find((c) => c.ma === caiDat.cookies) || COOKIES[0]).nhan
    switch (e.ma) {
      case 'khong-phai-link': return t('Đây không phải đường link video.')
      case 'khong-ho-tro': return t('Trang này chưa hỗ trợ tải.')
      case 'khong-xem-duoc': return t('Video không xem được (đã xoá, riêng tư, hoặc sai link).')
      case 'can-dang-nhap': return t('Trang này đòi đăng nhập. Mở Cài đặt, chọn cookie của trình duyệt đã đăng nhập, rồi thử lại.')
      case 'bi-chan': return t('Trang từ chối yêu cầu (bị chặn). Thử lại sau, hoặc dùng cookie trình duyệt trong Cài đặt.')
      case 'mat-mang': return t('Không kết nối được. Kiểm tra mạng rồi thử lại.')
      case 'thieu-engine': return tp('Thiếu file {f} trong bộ cài. Cài lại panel.', { f: e.chiTiet })
      case 'khong-chay-duoc': return t('Windows chặn engine tải (phần mềm diệt virus?). Cho phép trong Windows Security rồi thử lại.')
      case 'cookie': return tp('Không đọc được cookie của {b}. Đóng hẳn {b} (kể cả chạy nền), hoặc chọn Firefox / Không trong Cài đặt.', { b: tenCookie })
      case 'khong-ghi-duoc': return t('Không ghi được vào thư mục lưu (ổ đã rút, hết chỗ hoặc không có quyền). Bấm "Đổi" để chọn chỗ khác.')
      case 'la-playlist':
        return e.chiTiet
          ? tp('Link này là danh sách {n} video. Bản này tải từng video — dán link của đúng video cần tải.', { n: e.chiTiet })
          : t('Link này là danh sách nhiều video. Bản này tải từng video — dán link của đúng video cần tải.')
      default: return t('Tải không thành công.')
    }
  }

  const nhanLoiNhap = (ma: string): string => {
    switch (ma) {
      case 'KHONG_THAY_FILE': return t('File không còn ở chỗ cũ.')
      case 'KHONG_CO_PROJECT': return t('Chưa mở project nào trong Premiere.')
      case 'DOI_PROJECT': return t('Project đang mở đã đổi — bấm lại để nhập vào project này.')
      case 'KHONG_TAO_BIN': return t('Không tạo được bin (project chỉ đọc?).')
      case 'NHAP_LOI': return t('Premiere không nhận file này.')
      case 'HOST_CU': return t('Panel vừa cập nhật — tắt hẳn Premiere rồi mở lại.')
      case 'PHAN_TRAM': return t('Tên file có dấu "%" — Premiere không mở được. Đổi tên file (bỏ dấu %) rồi bấm nhập lại.')
      default: return t('Premiere chưa trả lời — bấm lại.')
    }
  }

  const coLink = !!link
  const dangChay = trangThai === 'dang-tai'
  const chieuCaoCo = (ma: ChatLuong): boolean => {
    if (!thongTin || ma === 'tot-nhat' || ma === 'mp3') return true
    return thongTin.chieuCao.some((h) => h >= Number(ma))
  }
  const tenProject = !trongHost ? t('ngoài Premiere') : host.ten ? host.ten.replace(/\.prproj$/i, '') : host.appVersion ? t('Chưa mở project') : ''
  const soMatFile = daTai.filter((m) => tt[m.ketQua.duongDan]?.con === false).length
  const duongNgan = rutGonDuongDan(thuMucLuu)

  return (
    <div className="app">
      {/* ── Thanh trên ── */}
      <header className="topbar">
        <span className={'topbar__icon' + (trongHost ? '' : ' topbar__icon--tat')} title={trongHost ? t('Đang nối với Premiere') : t('ngoài Premiere')}>
          <Ic ten="download" co={17} />
        </span>
        <h1 className="topbar__ten">Video Download</h1>
        <span className="topbar__ver">v{__VERSION__}</span>
        <span className="topbar__project" title={host.duong || tenProject}>{tenProject}</span>
        <span className="topbar__vach" aria-hidden="true" />
        <div className="menu-neo">
          <button
            type="button"
            className={'nut-ic' + (moCaiDat ? ' nut-ic--dang' : '')}
            aria-label={t('Cài đặt')}
            aria-expanded={moCaiDat}
            title={t('Cài đặt: cookie trình duyệt')}
            onClick={() => setMoCaiDat((v) => !v)}
          >
            <Ic ten="caiDat" />
            {caiDat.cookies && <span className="nut-ic__cham" aria-hidden="true" />}
          </button>
          {moCaiDat && (
            <MenuCaiDat
              dong={() => setMoCaiDat(false)}
              cookies={caiDat.cookies}
              doiCookie={(c) => luuCaiDat({ cookies: c })}
              khoa={dangChay}
            />
          )}
        </div>
        <NutDoiNgonNgu />
      </header>

      <main className="than">
        {/* Cột điều khiển. Dock ≥ 880px thì đứng bên trái, danh sách "Đã tải" sang phải. */}
        <div className="cot-dk">
        {!nodeAvailable() &&<ThongBao loai="loi" chu={t('Panel này chỉ chạy bên trong Premiere.')} />}
        {!engine.du && <ThongBao loai="loi" chu={tp('Thiếu file {f} trong bộ cài. Cài lại panel.', { f: engine.thieu.join(', ') })} />}
        {ban && <ThongBao loai="canh" chu={t('Premiere đang bận hoặc đang mở một hộp thoại — panel chờ Premiere trả lời.')} />}

        {/* ── Ô link ── */}
        <div className={'o-link' + (dangChay ? ' o-link--khoa' : '')}>
          <Ic ten="link" co={14} className="o-link__ic" />
          <input
            id="vd-url"
            ref={urlRef}
            className="o-link__o"
            type="text"
            placeholder={t('Dán link video')}
            title={t('YouTube, Facebook, TikTok… — dán cả câu có link cũng được')}
            aria-label={t('Link video')}
            value={url}
            readOnly={dangChay}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setUrl(e.target.value)}
            onPaste={(e) => {
              // Đang tải: ô chỉ đọc nhưng sự kiện paste vẫn tới → chặn, không thì
              // link đổi mà thẻ vẫn là video cũ (soi 21/09).
              if (dangChay) {
                e.preventDefault()
                return
              }
              const s = e.clipboardData.getData('text')
              const l = rutLink(s)
              if (l && l !== s.trim()) {
                e.preventDefault()
                setUrl(l)
              }
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              if (trangThai === 'san-sang') batDauTai(thongTin)
              else if (trangThai === 'dang-doc') taiKhiDocXong.current = link
            }}
          />
          {!dangChay && url && (
            <button type="button" className="nut-ic nut-ic--nho" aria-label={t('Xoá link')} title={t('Xoá link')} onClick={() => setUrl('')}>
              <Ic ten="x" co={14} />
            </button>
          )}
          {!dangChay && (
            <button type="button" className="nut-ic nut-ic--nho" aria-label={t('Dán link')} title={t('Dán link (Ctrl+V)')} onClick={dan}>
              <Ic ten="dan" co={14} />
            </button>
          )}
        </div>
        {url.trim() && !coLink && <p className="goi-y">{t('Chưa thấy đường link trong chữ vừa dán.')}</p>}
        {caiDat.cookies && (
          <p className="goi-y">
            {tp('Đang dùng cookie của {b}', { b: (COOKIES.find((c) => c.ma === caiDat.cookies) || COOKIES[0]).nhan })}
          </p>
        )}

        {/* ── Thẻ video ── */}
        {trangThai === 'dang-doc' && (
          <article className="the the--doc" role="status" aria-live="polite">
            <div className="the__anh the__anh--doc" />
            <div className="the__chu">
              <span className="doc-link">
                <span className="doc-link__xoay" aria-hidden="true" />
                {t('Đang đọc link…')}
              </span>
            </div>
          </article>
        )}
        {thongTin && (
          <article className={'the' + (dangChay ? ' the--tai' : '')} aria-busy={dangChay}>
            <div className="the__anh">
              {thongTin.anhBia ? <img src={thongTin.anhBia} alt="" /> : <Ic ten="anh" co={28} />}
              {thongTin.thoiLuong > 0 && <span className="the__gio">{dinhDangThoiLuong(thongTin.thoiLuong)}</span>}
            </div>
            <div className="the__chu">
              <h2 className="the__tieu-de" title={thongTin.tieuDe}>{thongTin.tieuDe}</h2>
              {(() => {
                const phu = [thongTin.trang, thongTin.chieuCao[0] ? tp('tối đa {h}p', { h: thongTin.chieuCao[0] }) : ''].filter(Boolean).join(' · ')
                return (
                  <p className="the__meta">
                    {thongTin.kenh && <span className="the__kenh">{thongTin.kenh}</span>}
                    {thongTin.kenh && phu && <span className="the__cham" aria-hidden="true">·</span>}
                    {phu && <span className="the__phu">{phu}</span>}
                  </p>
                )
              })()}
            </div>
          </article>
        )}
        {loi && (
          <ThongBao loai="loi" chu={nhanLoi(loi)} title={loi.chiTiet} />
        )}

        {/* ── Chất lượng ── */}
        <div className={'seg' + (dangChay ? ' seg--khoa' : '')} role="radiogroup" aria-label={t('Chất lượng')}>
          {CHAT_LUONG.map((c) => (
            <button
              key={c.ma}
              type="button"
              role="radio"
              aria-checked={caiDat.chatLuong === c.ma}
              className={'seg__nut' + (caiDat.chatLuong === c.ma ? ' seg__nut--chon' : '') + (chieuCaoCo(c.ma) ? '' : ' seg__nut--khong-co')}
              disabled={dangChay}
              tabIndex={caiDat.chatLuong === c.ma ? 0 : -1}
              onKeyDown={phimRadio(CHAT_LUONG.map((x) => x.ma), caiDat.chatLuong, (ma) => luuCaiDat({ chatLuong: ma }))}
              title={
                chieuCaoCo(c.ma)
                  ? c.ma === 'mp3'
                    ? t('MP3 (chỉ tiếng)')
                    : c.ma === 'tot-nhat' && thongTin?.chieuCao[0]
                      ? tp('Tốt nhất (tối đa {h}p)', { h: thongTin.chieuCao[0] })
                      : ''
                  : t('Video này không có mức đó — sẽ lấy mức cao nhất có sẵn')
              }
              onClick={() => luuCaiDat({ chatLuong: c.ma })}
            >
              {c.ma === 'mp3' && <Ic ten="nhac" co={12} net={2.2} />}
              {t(c.nhan)}
            </button>
          ))}
        </div>

        {/* ── Lưu vào + tự nhập ── */}
        <div className={'khoi' + (dangChay ? ' khoi--khoa' : '')}>
          <div className="khoi__hang">
            <Ic ten="thuMuc" co={14} className="khoi__ic" />
            <span className="khoi__nhan">{t('Lưu vào')}</span>
            {/* Tên thư mục đích luôn thấy; phần cha co lại trước (soi 21/09: ở 300px
                cắt cuối là mất đúng tên thư mục). */}
            <button type="button" className="khoi__duong" title={thuMucLuu + '\n' + t('Bấm để mở thư mục này')} onClick={() => moThuMuc(thuMucLuu, true)}>
              {duongNgan.cha && <span className="khoi__cha">{duongNgan.cha}</span>}
              <span className="khoi__ten">{duongNgan.ten}</span>
            </button>
            {caiDat.thuMuc && (
              <button
                type="button"
                className="nut-ic nut-ic--nho"
                aria-label={t('Về mặc định: cạnh file project')}
                title={t('Về mặc định: cạnh file project')}
                disabled={dangChay}
                onClick={() => luuCaiDat({ thuMuc: '' })}
              >
                <Ic ten="hoanTac" co={14} />
              </button>
            )}
            <button type="button" className="btn btn--nho" disabled={dangChay || dangChon} onClick={doiThuMuc}>
              {dangChon ? t('Đang chọn…') : t('Đổi')}
            </button>
          </div>
          {trongHost && (
            <>
              <div className="khoi__vach" aria-hidden="true" />
              <label className="khoi__hang khoi__hang--nhan">
                <Ic ten="nhap" co={14} className="khoi__ic" />
                <span className="khoi__chu">
                  {t('Tự nhập vào bin')} <b>{TEN_BIN}</b> {t('sau khi tải')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={caiDat.nhapVaoProject}
                  aria-label={tp('Tự nhập vào bin {b} sau khi tải', { b: TEN_BIN })}
                  className={'cong-tac' + (caiDat.nhapVaoProject ? ' cong-tac--bat' : '')}
                  disabled={dangChay}
                  onClick={() => luuCaiDat({ nhapVaoProject: !caiDat.nhapVaoProject })}
                >
                  <span className="cong-tac__nut" aria-hidden="true" />
                </button>
              </label>
            </>
          )}
        </div>
        </div>

        {/* ── Đã tải ── */}
        {daTai.length > 0 && (
          <section className="da-tai">
            <div className="da-tai__dau">
              <h3 className="da-tai__ten">
                {t('Đã tải')} <span className="da-tai__so">({daTai.length})</span>
              </h3>
              {soMatFile > 0 && (
                <button
                  type="button"
                  className="nut-chu"
                  title={t('Chỉ bỏ khỏi danh sách, không xoá gì trên đĩa')}
                  onClick={() => setDaTai((ds) => ds.filter((m) => tt[m.ketQua.duongDan]?.con !== false))}
                >
                  {tp('Dọn {n} mục mất file', { n: soMatFile })}
                </button>
              )}
            </div>
            <ul className="ds">
              {daTai.map((m) => {
                const s = tt[m.ketQua.duongDan] || {}
                const mat = s.con === false
                const la = codecLa(m.ketQua.vcodec)
                const amThanh = !m.ketQua.vcodec || m.ketQua.vcodec === 'none'
                const meta = [
                  m.ketQua.cao ? (m.ketQua.rong && m.ketQua.rong < m.ketQua.cao ? m.ketQua.rong + '×' + m.ketQua.cao : m.ketQua.cao + 'p') : '',
                  la ? '' : tenCodec(m.ketQua.vcodec, m.ketQua.acodec),
                  dinhDangThoiLuong(m.ketQua.thoiLuong),
                  !mat && s.kichThuoc ? dinhDangMB(s.kichThuoc, phay) : '',
                ].filter(Boolean).join(' · ')
                return (
                  <li key={m.id} className={'hang' + (mat ? ' hang--mat' : '')}>
                    {m.anhBia ? (
                      <img className="hang__anh" src={fileUrl(m.anhBia)} alt="" />
                    ) : (
                      <span className="hang__anh hang__anh--trong" aria-hidden="true">
                        <Ic ten={amThanh ? 'nhac' : 'anh'} co={14} />
                      </span>
                    )}
                    <div className="hang__chu">
                      <div className="hang__dong">
                        <span className="hang__tieu-de" title={m.tieuDe + '\n' + m.ketQua.duongDan}>{m.tieuDe}</span>
                        {/* Dock rất hẹp (≤ 340px): nhãn chỉ còn icon, chữ vào title/aria-label. */}
                        {mat ? (
                          <span className="nhan-tt nhan-tt--loi" title={t('File không còn trên đĩa')} aria-label={t('File không còn trên đĩa')}>
                            <Ic ten="fileX" co={11} net={2.2} />
                            <span className="nhan-tt__chu">{t('File không còn trên đĩa')}</span>
                          </span>
                        ) : !trongHost ? null : nhapDang[m.id] ? (
                          <span className="nhan-tt nhan-tt--thuong">{t('Đang nhập…')}</span>
                        ) : s.trongProject === 1 || (s.trongProject === 0 && host.duong && daCoTay[m.ketQua.duongDan] === host.duong) ? (
                          <span className="nhan-tt nhan-tt--ok" title={t('File này đang nằm trong project đang mở')} aria-label={t('Trong project')}>
                            <Ic ten="check" co={11} net={2.4} />
                            <span className="nhan-tt__chu">{t('Trong project')}</span>
                          </span>
                        ) : s.trongProject === 2 ? (
                          <span className="nhan-tt nhan-tt--canh" title={t('Có trong project nhưng Premiere báo offline')} aria-label={t('Offline trong project')}>
                            <Ic ten="canhBao" co={11} net={2.2} />
                            <span className="nhan-tt__chu">{t('Offline trong project')}</span>
                          </span>
                        ) : s.trongProject === 0 && s.con ? (
                          <button type="button" className="nut-canh" onClick={() => nhap(m)} disabled={!host.duong} title={t('Nhập vào project')} aria-label={t('Nhập vào project')}>
                            <Ic ten="nhap" co={12} net={2.2} />
                            <span className="nhan-tt__chu">{t('Nhập vào project')}</span>
                          </button>
                        ) : null}
                      </div>
                      <div className="hang__dong">
                        <span className="hang__meta">{meta}</span>
                        <span className="hang__nut">
                          {!mat && (
                            <button
                              type="button"
                              className={'nut-ic nut-ic--nho' + (vuaMo === m.id ? ' nut-ic--ok' : '')}
                              aria-label={t('Mở thư mục')}
                              title={t('Mở thư mục')}
                              onClick={() => moMuc(m)}
                            >
                              <Ic ten={vuaMo === m.id ? 'check' : 'thuMuc'} co={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="nut-ic nut-ic--nho"
                            aria-label={t('Bỏ khỏi danh sách')}
                            title={t('Bỏ khỏi danh sách (không xoá file)')}
                            onClick={() => setDaTai((ds) => ds.filter((x) => x.id !== m.id))}
                          >
                            <Ic ten="x" co={14} />
                          </button>
                        </span>
                      </div>
                      {!mat && la && (
                        <p className="hang__canh">
                          <Ic ten="canhBao" co={12} net={2.2} />
                          <span>{tp('{c} — Premiere có thể không đọc được', { c: tenCodec(m.ketQua.vcodec, m.ketQua.acodec) })}</span>
                        </p>
                      )}
                      {loiNhap[m.id] && !mat && s.trongProject !== 1 && (
                        <p className="hang__loi" title={loiNhap[m.id]}>{nhanLoiNhap(loiNhap[m.id])}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </main>

      {/* ── Thanh đáy: nút chính / tiến độ ── */}
      <footer className="thanh-day">
        {dangChay ? (
          <>
            <div className={'chay' + (giaiDoan === 'dang-tai' && tienDo ? '' : ' chay--troi')}>
              <div className="chay__day" style={{ width: (giaiDoan === 'dang-xu-ly' ? 100 : tienDo ? tienDo.phanTram : 0) + '%' }} />
              {/* role nằm ở phần chữ, KHÔNG bọc nút Dừng: progressbar làm phẳng con của
                  nó với trình đọc màn hình (soi 21/09). Số (%, n/m) ở span riêng
                  flex:none — ở 300px chỉ chữ bị co, số không bao giờ bị cắt. */}
              <span
                className="chay__chu"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={giaiDoan === 'dang-tai' && tienDo ? Math.round(tienDo.phanTram) : undefined}
                aria-label={t('Đang tải')}
              >
                {giaiDoan === 'thu-lai' ? (
                  <>
                    <span className="chay__nhan">{t('Trang chặn, đang thử lại…')}</span>
                    <b>{lanThu}/3</b>
                  </>
                ) : giaiDoan === 'dang-xu-ly' ? (
                  <span className="chay__nhan">{t('Đang xử lý…')}</span>
                ) : giaiDoan === 'dang-tai' && tienDo ? (
                  <>
                    <span className="chay__nhan">{t('Đang tải…')}</span>
                    <b>{Math.floor(tienDo.phanTram)}%</b>
                  </>
                ) : (
                  <span className="chay__nhan">{t('Đang chuẩn bị…')}</span>
                )}
              </span>
              {giaiDoan === 'dang-tai' && tienDo?.conLai && <span className="chay__gio">{tp('còn {t}', { t: tienDo.conLai })}</span>}
              <button type="button" className="btn btn--nho chay__dung" onClick={dungTai}>
                <Ic ten="dung" co={12} net={2.2} />
                {t('Dừng')}
              </button>
            </div>
            <div className="chay__phu">
              <span>{tienDo && tienDo.tongCong > 0 ? dinhDangMB(tienDo.daTai, phay) + ' / ' + dinhDangMB(tienDo.tongCong, phay) : ''}</span>
              <span>{giaiDoan === 'dang-tai' && tienDo ? dinhDangTocDo(tienDo.tocDo, phay) : ''}</span>
            </div>
          </>
        ) : trangThai === 'xong' ? (
          <button type="button" className="btn btn--chinh btn--lon btn--xong" disabled>
            <Ic ten="check" co={16} net={2.4} />
            {t('Đã tải xong')}
          </button>
        ) : trangThai === 'loi' && loi && THU_LAI_DUOC.indexOf(loi.ma) >= 0 && coLink ? (
          <button type="button" className="btn btn--chinh btn--lon" onClick={thuLai}>
            <Ic ten="lamMoi" co={16} net={2.2} />
            {t('Thử lại')}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--chinh btn--lon"
            disabled={trangThai !== 'san-sang' || !engine.du}
            onClick={() => batDauTai(thongTin)}
          >
            <Ic ten="download" co={16} net={2.2} />
            {/* Đang đọc link: KHÔNG lặp câu "Đang đọc link…" của thẻ (một thông điệp một nơi). */}
            {trangThai !== 'san-sang'
                ? t('Tải video')
                : vaoBin
                  ? tp('Tải {q} vào bin', { q: nhanChatLuong(caiDat.chatLuong) })
                  : tp('Tải {q}', { q: nhanChatLuong(caiDat.chatLuong) })}
          </button>
        )}
      </footer>
    </div>
  )
}

// ── Mảnh nhỏ ─────────────────────────────────────────────────────────────

function ThongBao({ loai, chu, phu, title }: { loai: 'loi' | 'canh'; chu: string; phu?: string; title?: string }) {
  return (
    <div className={'thong-bao thong-bao--' + loai} role={loai === 'loi' ? 'alert' : 'status'} title={title || undefined}>
      <Ic ten="canhBao" co={14} net={2.1} className="thong-bao__ic" />
      <div className="thong-bao__chu">
        <p>{chu}</p>
        {phu && <p className="thong-bao__phu">{phu}</p>}
      </div>
    </div>
  )
}

function MenuCaiDat(p: {
  dong: () => void
  cookies: CookieTrinhDuyet
  doiCookie: (c: CookieTrinhDuyet) => void
  khoa: boolean
}) {
  const { t } = useNgonNgu()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const ngoai = (e: MouseEvent) => {
      const neo = ref.current && ref.current.parentElement
      if (neo && !neo.contains(e.target as Node)) p.dong()
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') p.dong()
    }
    document.addEventListener('mousedown', ngoai)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', ngoai)
      document.removeEventListener('keydown', esc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="menu" ref={ref} role="dialog" aria-label={t('Cài đặt')}>
      <p className="menu__nhan">{t('Cookie trình duyệt')}</p>
      <p className="menu__ghi">{t('Chỉ cần khi trang đòi đăng nhập (Vimeo, video riêng tư). Trình duyệt đó phải đang đăng nhập sẵn.')}</p>
      <div className="seg seg--nho" role="radiogroup" aria-label={t('Cookie trình duyệt')}>
        {COOKIES.map((c) => (
          <button
            key={c.ma || 'khong'}
            type="button"
            role="radio"
            aria-checked={p.cookies === c.ma}
            className={'seg__nut' + (p.cookies === c.ma ? ' seg__nut--chon' : '')}
            disabled={p.khoa}
            tabIndex={p.cookies === c.ma ? 0 : -1}
            onKeyDown={phimRadio(COOKIES.map((x) => x.ma), p.cookies, p.doiCookie)}
            onClick={() => p.doiCookie(c.ma)}
          >
            {t(c.nhan)}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Tiện ích ─────────────────────────────────────────────────────────────

/**
 * Codec Premiere ĐÃ BIẾT là khó đọc: VP8/VP9/AV1 (webm của YouTube ≥1440p).
 * ☠️ Danh sách ĐEN, không phải "mọi thứ không phải H.264" (soi 21/09): 'NA'
 * (yt-dlp không biết codec — link mp4 trực tiếp, Facebook progressive) và H.265
 * (TikTok) trước đây bị chặn tự nhập + cảnh báo sai.
 */
function codecLa(vcodec: string): boolean {
  const v = (vcodec || '').toLowerCase()
  return v.startsWith('vp8') || v.startsWith('vp9') || v.startsWith('vp09') || v.startsWith('av01') || v.startsWith('av1')
}

function tenCodec(v: string, a: string): string {
  const vv = (v || '').toLowerCase()
  if (!vv || vv === 'none') return a && a !== 'none' ? (a.startsWith('mp3') ? 'MP3' : a.split('.')[0].toUpperCase()) : ''
  if (vv.startsWith('avc1') || vv.startsWith('h264')) return 'H.264'
  if (vv.startsWith('vp9') || vv.startsWith('vp09')) return 'VP9'
  if (vv.startsWith('av01')) return 'AV1'
  if (vv.startsWith('hev1') || vv.startsWith('hvc1')) return 'H.265'
  return vv.split('.')[0].toUpperCase()
}

/** "9.68MiB/s" → "9,7 MB/s" (dấu thập phân theo ngôn ngữ). */
function dinhDangTocDo(s: string, phay: string): string {
  const m = /([\d.]+)\s*([KMG])i?B\/s/i.exec(s || '')
  if (!m) return ''
  return parseFloat(m[1]).toFixed(1).replace('.', phay) + ' ' + m[2].toUpperCase() + 'B/s'
}

/** Tách đường dẫn: phần cha rút gọn ("…\file pr for test\") + tên thư mục cuối. */
function rutGonDuongDan(p: string): { cha: string; ten: string } {
  if (!p) return { cha: '', ten: dich('(chưa chọn)') }
  const ds = p.split(/[\\/]+/).filter(Boolean)
  const ten = ds.pop() || p
  const cha = ds.length > 2 ? '…\\' + ds[ds.length - 1] + '\\' : ds.length ? ds.join('\\') + '\\' : ''
  return { cha, ten }
}

/** Nhóm radio theo mẫu ARIA: ←/→/Home/End chọn và dời focus (soi 21/09). */
function phimRadio<T extends string>(ds: T[], dang: T, chon: (m: T) => void) {
  return (e: { key: string; preventDefault: () => void; currentTarget: HTMLElement }) => {
    const i = ds.indexOf(dang)
    let j = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % ds.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + ds.length) % ds.length
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = ds.length - 1
    if (j < 0) return
    e.preventDefault()
    chon(ds[j])
    const nut = e.currentTarget.parentElement?.children[j] as HTMLElement | undefined
    nut?.focus()
  }
}
