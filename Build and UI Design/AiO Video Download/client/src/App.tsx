/**
 * App.tsx — AiO Video Download. MỘT màn hình, MỘT nút chính.
 *
 * Luồng người dùng: dán link → panel tự đọc tiêu đề/thời lượng → chọn chất
 * lượng → bấm "Tải video" → thanh tiến độ → file nằm trong thư mục đã chọn và
 * (nếu bật) trong bin "AiO Video Download" của project đang mở.
 *
 * Luật sản phẩm của anh Tiến áp ở đây:
 * - Nhãn nút là VIỆC nó làm ("Tải video", "Dừng", "Nhập vào Premiere").
 * - Nút chính vừa là nút vừa là đèn: xám khi chưa có link, cam khi sẵn sàng,
 *   thành thanh tiến độ khi chạy, xanh "Đã tải xong" khi xong.
 * - Khi chạy KHÔNG lộ quy trình: chỉ "Đang tải… 43% · 5,8 MB/s · còn 00:12".
 * - Chỉ báo khi thất bại; việc thành công đã thấy file thì im lặng.
 * - Có đường vào (tải) thì có đường ra (Dừng · Mở thư mục).
 * - Tool đồng hành: tên project trên thanh trên đọc lại mỗi 2 giây.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNgonNgu, NutDoiNgonNgu } from './ngonngu'
import { isInHost, hostInfo, thuMucProject, chonThuMuc, nhapVaoProject } from './lib/cep'
import { getFs, getPath, nodeAvailable } from './lib/node'
import {
  laLink, docThongTin, taiVideo, kiemEngine, capNhatEngine, phienBanEngine, moThuMuc,
  dinhDangThoiLuong, dinhDangMB, taoThumb, duongThumb, fileUrl,
} from './services/ytdlp'
import type { ThongTinVideo, TienDo, GiaiDoan, KetQuaTai, LoiTai, ChatLuong, CookieTrinhDuyet } from './services/ytdlp'
import { docCaiDat, ghiCaiDat, thuMucDownloads, docLichSu, ghiLichSu } from './services/caidat'
import type { CaiDat } from './services/caidat'

type TrangThai = 'nghi' | 'dang-doc' | 'san-sang' | 'dang-tai' | 'xong' | 'loi'

interface MucDaTai {
  id: string
  tieuDe: string
  ketQua: KetQuaTai
  daNhap: 'chua' | 'dang' | 'roi' | 'loi'
  loiNhap?: string
  /** id video gốc (để đặt tên ảnh bìa). Mục cũ trước 08/09 chiều không có. */
  videoId?: string
  /** Đường dẫn ảnh bìa trên đĩa; '' = đã thử mà không tách được (MP3). */
  anhBia?: string
}

const CHAT_LUONG: { ma: ChatLuong; nhan: string }[] = [
  { ma: 'tot-nhat', nhan: 'Tốt nhất' },
  { ma: '1080', nhan: '1080p' },
  { ma: '720', nhan: '720p' },
  { ma: '480', nhan: '480p' },
  { ma: 'mp3', nhan: 'Chỉ tiếng (MP3)' },
]

const COOKIES: { ma: CookieTrinhDuyet; nhan: string }[] = [
  { ma: '', nhan: 'Không' },
  { ma: 'edge', nhan: 'Edge' },
  { ma: 'chrome', nhan: 'Chrome' },
  { ma: 'firefox', nhan: 'Firefox' },
]

export default function App() {
  const { t, tp } = useNgonNgu()
  const trongHost = isInHost()

  const [caiDat, setCaiDat] = useState<CaiDat>(() => docCaiDat())
  const [host, setHost] = useState({ appVersion: '', project: '' })
  const [thuMucGoiY, setThuMucGoiY] = useState('')
  const [engine, setEngine] = useState(() => kiemEngine())
  const [phienBan, setPhienBan] = useState('')

  const [url, setUrl] = useState('')
  const [trangThai, setTrangThai] = useState<TrangThai>('nghi')
  const [thongTin, setThongTin] = useState<ThongTinVideo | null>(null)
  const [tienDo, setTienDo] = useState<TienDo | null>(null)
  const [giaiDoan, setGiaiDoan] = useState<GiaiDoan>('lay-thong-tin')
  const [lanThu, setLanThu] = useState(1)
  const [loi, setLoi] = useState<LoiTai | null>(null)
  // Lịch sử đọc từ đĩa lúc mở; mục "đang nhập" dở dang thì hạ về "chưa".
  const [daTai, setDaTai] = useState<MucDaTai[]>(() =>
    docLichSu<MucDaTai>().map((m) => (m.daNhap === 'dang' ? { ...m, daNhap: 'chua' } : m)),
  )
  useEffect(() => {
    ghiLichSu(daTai)
  }, [daTai])

  // Mục nào chưa có ảnh bìa (tải trước khi có tính năng, hoặc tách hỏng) thì
  // tách nền lúc mở panel, từng cái một để không dồn ffmpeg.
  useEffect(() => {
    let dung = false
    ;(async () => {
      for (const m of daTai) {
        if (dung) return
        if (m.anhBia !== undefined) continue
        const vid = m.videoId || (/\[([^\]]+)\]\.\w+$/.exec(m.ketQua.duongDan) || [])[1] || ''
        const anh = vid ? duongThumb(vid) || (await taoThumb(vid, m.ketQua.duongDan)) : ''
        if (dung) return
        setDaTai((ds) => ds.map((x) => (x.id === m.id ? { ...x, videoId: vid, anhBia: anh } : x)))
      }
    })()
    return () => {
      dung = true
    }
    // Chỉ chạy khi số mục đổi — chạy theo cả mảng thì mỗi lần set ảnh lại quét lại.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daTai.length])
  const [dangCapNhat, setDangCapNhat] = useState(false)
  const [thongBaoEngine, setThongBaoEngine] = useState('')

  const huyDoc = useRef<(() => void) | null>(null)
  const huyTai = useRef<(() => void) | null>(null)
  const urlRef = useRef<HTMLInputElement>(null)

  // ── Tool đồng hành: tên project đọc lại mỗi 2 giây ────────────────────
  useEffect(() => {
    if (!trongHost) return
    let dung = false
    const doc = async () => {
      const h = await hostInfo()
      if (!dung) setHost(h)
    }
    doc()
    const id = window.setInterval(doc, 2000)
    return () => {
      dung = true
      window.clearInterval(id)
    }
  }, [trongHost])

  // Thư mục gợi ý: cạnh file project → Downloads. Đọc lại khi đổi project.
  useEffect(() => {
    let dung = false
    ;(async () => {
      let tm = ''
      if (trongHost) tm = await thuMucProject()
      const path = getPath()
      if (tm && path) tm = path.join(tm, 'Video Download')
      if (!tm) tm = thuMucDownloads()
      if (!dung) setThuMucGoiY(tm)
    })()
    return () => {
      dung = true
    }
  }, [trongHost, host.project])

  useEffect(() => {
    phienBanEngine().then(setPhienBan)
  }, [engine])

  const thuMucLuu = caiDat.thuMuc || thuMucGoiY

  const luuCaiDat = useCallback((phan: Partial<CaiDat>) => {
    setCaiDat((cu) => {
      const moi = { ...cu, ...phan }
      ghiCaiDat(moi)
      return moi
    })
  }, [])

  // ── Đọc thông tin khi link đổi (chờ 400ms cho gõ xong) ───────────────
  useEffect(() => {
    if (huyDoc.current) {
      huyDoc.current()
      huyDoc.current = null
    }
    if (trangThai === 'dang-tai') return
    setThongTin(null)
    setLoi(null)
    if (!laLink(url)) {
      // Vừa tải xong thì ô link được xoá — GIỮ đèn xanh "Đã tải xong" cho tới
      // khi người dùng dán link mới (đo 08/09: không giữ thì nút quay về xám
      // ngay, người dùng không biết đã xong hay chưa).
      setTrangThai((cu) => (cu === 'xong' ? 'xong' : 'nghi'))
      return
    }
    setTrangThai('dang-doc')
    const id = window.setTimeout(() => {
      const { huy, xong } = docThongTin(url, caiDat.cookies)
      huyDoc.current = huy
      xong
        .then((tt) => {
          huyDoc.current = null
          setThongTin(tt)
          setTrangThai('san-sang')
        })
        .catch((e: LoiTai) => {
          huyDoc.current = null
          setLoi(e)
          setTrangThai('loi')
        })
    }, 400)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, caiDat.cookies])

  // ── Dán từ clipboard ──────────────────────────────────────────────────
  const dan = async () => {
    try {
      const s = await navigator.clipboard.readText()
      if (s) setUrl(s.trim())
    } catch {
      urlRef.current?.focus()
    }
  }

  // ── Tải ───────────────────────────────────────────────────────────────
  const batDauTai = () => {
    if (trangThai !== 'san-sang' || !thongTin) return
    const fs = getFs()
    try {
      if (fs && thuMucLuu && !fs.existsSync(thuMucLuu)) fs.mkdirSync(thuMucLuu, { recursive: true })
    } catch {}
    setLoi(null)
    setTienDo(null)
    setTrangThai('dang-tai')
    const tt = thongTin
    const { huy, xong } = taiVideo(
      url,
      { chatLuong: caiDat.chatLuong, thuMuc: thuMucLuu, cookies: caiDat.cookies, id: thongTin.id },
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
        const muc: MucDaTai = { id: tt.id + '-' + Date.now(), tieuDe: tt.tieuDe, ketQua: kq, daNhap: 'chua', videoId: tt.id, anhBia }
        setDaTai((ds) => [muc, ...ds])
        setTrangThai('xong')
        setUrl('')
        if (trongHost && caiDat.nhapVaoProject) await nhap(muc)
      })
      .catch((e: LoiTai) => {
        huyTai.current = null
        if (e.ma === 'huy') {
          setTrangThai(laLink(url) ? 'san-sang' : 'nghi')
          return
        }
        setLoi(e)
        setTrangThai('loi')
      })
  }

  const dungTai = () => {
    if (huyTai.current) huyTai.current()
  }

  const nhap = async (muc: MucDaTai) => {
    setDaTai((ds) => ds.map((m) => (m.id === muc.id ? { ...m, daNhap: 'dang' } : m)))
    const r = await nhapVaoProject(muc.ketQua.duongDan)
    setDaTai((ds) =>
      ds.map((m) => (m.id === muc.id ? { ...m, daNhap: r.ok ? 'roi' : 'loi', loiNhap: r.ok ? '' : r.message } : m)),
    )
  }

  const doiThuMuc = async () => {
    const tm = trongHost ? await chonThuMuc(thuMucLuu) : ''
    if (tm) luuCaiDat({ thuMuc: tm })
  }

  const capNhat = async () => {
    setDangCapNhat(true)
    setThongBaoEngine('')
    const r = await capNhatEngine()
    setDangCapNhat(false)
    setThongBaoEngine(r.thongBao)
    setEngine(kiemEngine())
  }

  // ── Chữ cho nút chính ─────────────────────────────────────────────────
  const nutChinh = (() => {
    if (trangThai === 'dang-tai') {
      if (giaiDoan === 'thu-lai') return tp('Trang chặn, đang thử lại ({n}/{m})…', { n: lanThu, m: 3 })
      if (giaiDoan === 'dang-tai' && tienDo) {
        return tp('Đang tải… {p}% · {v} · còn {t}', {
          p: tienDo.phanTram.toFixed(0),
          v: tienDo.tocDo || '—',
          t: tienDo.conLai || '—',
        })
      }
      return t('Đang xử lý…')
    }
    if (trangThai === 'xong') return t('Đã tải xong')
    if (caiDat.chatLuong === 'mp3') return t('Tải tiếng')
    return t('Tải video')
  })()

  const nhanLoi = (e: LoiTai): string => {
    switch (e.ma) {
      case 'khong-phai-link': return t('Đây không phải đường link.')
      case 'khong-ho-tro': return t('Trang này chưa hỗ trợ tải.')
      case 'khong-xem-duoc': return t('Video không xem được (đã xoá, riêng tư, hoặc sai link).')
      case 'can-dang-nhap': return t('Trang này đòi đăng nhập. Chọn "Cookie từ trình duyệt" ở dưới, nơi anh đã đăng nhập, rồi thử lại.')
      case 'bi-chan': return t('Trang từ chối yêu cầu (bị chặn). Thử lại sau, hoặc dùng cookie từ trình duyệt.')
      case 'mat-mang': return t('Không kết nối được. Kiểm tra mạng rồi thử lại.')
      case 'thieu-engine': return tp('Thiếu file {f} trong bộ cài. Cài lại panel.', { f: e.chiTiet })
      default: return e.chiTiet || t('Tải không thành công.')
    }
  }

  const chieuCaoCo = (ma: ChatLuong): boolean => {
    if (!thongTin || ma === 'tot-nhat' || ma === 'mp3') return true
    return thongTin.chieuCao.some((h) => h >= Number(ma))
  }

  const dangChay = trangThai === 'dang-tai'

  return (
    <div className="app">
      <header className="topbar">
        <svg className={'topbar__icon' + (trongHost ? '' : ' topbar__icon--tat')} width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
          <path fill="currentColor" d="M8 1.5a.75.75 0 0 1 .75.75v6.19l2.22-2.22a.75.75 0 1 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 1 1 1.06-1.06l2.22 2.22V2.25A.75.75 0 0 1 8 1.5ZM2.75 11a.75.75 0 0 1 .75.75v1.5h9v-1.5a.75.75 0 0 1 1.5 0v2.25a.75.75 0 0 1-.75.75h-10.5a.75.75 0 0 1-.75-.75v-2.25a.75.75 0 0 1 .75-.75Z" />
        </svg>
        <h1 className="topbar__ten">AiO Video Download</h1>
        <p className="topbar__host" title={host.project}>
          v{__VERSION__}
          {trongHost && host.project ? ' · ' + host.project : trongHost ? '' : ' · ' + t('ngoài Premiere')}
        </p>
        <NutDoiNgonNgu />
      </header>

      <main className="than">
        {!engine.du && (
          <div className="loi" role="alert">
            {tp('Thiếu file {f} trong bộ cài. Cài lại panel.', { f: engine.thieu.join(', ') })}
          </div>
        )}
        {!nodeAvailable() && (
          <div className="loi" role="alert">{t('Panel này chỉ chạy bên trong Premiere.')}</div>
        )}

        {/* ── Ô link ── */}
        <label className="nhan" htmlFor="vd-url">{t('Đường link video')}</label>
        <div className="hang">
          <input
            id="vd-url"
            ref={urlRef}
            className="o-link"
            type="url"
            placeholder="https://…"
            value={url}
            disabled={dangChay}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') batDauTai()
            }}
          />
          <button type="button" className="btn" onClick={dan} disabled={dangChay} title={t('Dán link từ clipboard')}>
            {t('Dán')}
          </button>
        </div>

        {/* ── Thông tin video ── */}
        {trangThai === 'dang-doc' && (
          <div className="doc-link" role="status" aria-live="polite">
            <span className="doc-link__xoay" aria-hidden="true" />
            <span>{t('Đang đọc link…')}</span>
            <span className="doc-link__vach" aria-hidden="true" />
          </div>
        )}
        {thongTin && (
          <div className="the-video">
            {thongTin.anhBia ? (
              <img className="the-video__anh" src={thongTin.anhBia} alt="" />
            ) : (
              <div className="the-video__anh the-video__anh--trong" />
            )}
            <div className="the-video__chu">
              <p className="the-video__tieu-de" title={thongTin.tieuDe}>{thongTin.tieuDe}</p>
              <p className="the-video__meta">
                {[thongTin.kenh, dinhDangThoiLuong(thongTin.thoiLuong), thongTin.trang,
                  thongTin.chieuCao[0] ? tp('tối đa {h}p', { h: thongTin.chieuCao[0] }) : '']
                  .filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* ── Chất lượng ── */}
        <p className="nhan">{t('Chất lượng')}</p>
        <div className="chips" role="radiogroup" aria-label={t('Chất lượng')}>
          {CHAT_LUONG.map((c) => (
            <button
              key={c.ma}
              type="button"
              role="radio"
              aria-checked={caiDat.chatLuong === c.ma}
              className={'chip' + (caiDat.chatLuong === c.ma ? ' chip--chon' : '') + (chieuCaoCo(c.ma) ? '' : ' chip--khong-co')}
              disabled={dangChay}
              title={chieuCaoCo(c.ma) ? '' : t('Video này không có mức đó — sẽ lấy mức cao nhất có sẵn')}
              onClick={() => luuCaiDat({ chatLuong: c.ma })}
            >
              {t(c.nhan)}
            </button>
          ))}
        </div>

        {/* ── Thư mục ── */}
        <p className="nhan">{t('Lưu vào')}</p>
        <div className="hang">
          <button
            type="button"
            className="duong-dan"
            title={thuMucLuu ? t('Bấm để mở thư mục này') + '\n' + thuMucLuu : ''}
            disabled={!thuMucLuu}
            onClick={() => moThuMuc(thuMucLuu, true)}
          >
            {thuMucLuu || t('(chưa chọn)')}
          </button>
          <button type="button" className="btn" onClick={doiThuMuc} disabled={dangChay || !trongHost}>
            {t('Đổi')}
          </button>
        </div>

        {trongHost && (
          <label className="o-chon">
            <input
              type="checkbox"
              checked={caiDat.nhapVaoProject}
              disabled={dangChay}
              onChange={(e) => luuCaiDat({ nhapVaoProject: e.target.checked })}
            />
            <span>{t('Nhập vào project sau khi tải (bin "AiO Video Download")')}</span>
          </label>
        )}

        {/* ── Nút chính / thanh tiến độ ── */}
        <div className="khoi-nut">
          {dangChay ? (
            <div className="tien-do" role="progressbar" aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={giaiDoan === 'dang-tai' && tienDo ? Math.round(tienDo.phanTram) : undefined}>
              <div
                className={'tien-do__day' + (giaiDoan === 'dang-tai' && tienDo ? '' : ' tien-do__day--cho')}
                style={giaiDoan === 'dang-tai' && tienDo ? { width: tienDo.phanTram + '%' } : undefined}
              />
              <span className="tien-do__chu">{nutChinh}</span>
              <button type="button" className="btn tien-do__dung" onClick={dungTai}>{t('Dừng')}</button>
            </div>
          ) : (
            <button
              type="button"
              className={'btn btn--primary btn--lon' + (trangThai === 'xong' ? ' btn--xong' : '')}
              disabled={trangThai !== 'san-sang' || !engine.du}
              onClick={batDauTai}
            >
              {nutChinh}
            </button>
          )}
          {dangChay && tienDo && tienDo.tongCong > 0 && (
            <p className="ghi-chu ghi-chu--giua">
              {dinhDangMB(tienDo.daTai)} / {dinhDangMB(tienDo.tongCong)}
            </p>
          )}
        </div>

        {loi && (
          <div className="loi" role="alert">
            <p className="loi__chinh">{nhanLoi(loi)}</p>
            {loi.chiTiet && loi.ma !== 'khac' && <p className="loi__chi-tiet">{loi.chiTiet}</p>}
            {(loi.ma === 'khac' || loi.ma === 'khong-ho-tro') && (
              <p className="loi__chi-tiet">{t('Nếu link này từng tải được: bấm "Cập nhật engine" ở dưới rồi thử lại.')}</p>
            )}
          </div>
        )}

        {/* ── Đã tải trong phiên ── */}
        {daTai.length > 0 && (
          <section className="da-tai">
            <p className="nhan">{tp('Đã tải ({n})', { n: daTai.length })}</p>
            <ul className="ds">
              {daTai.map((m) => (
                <li key={m.id} className="muc">
                  {m.anhBia ? (
                    <img className="muc__anh" src={fileUrl(m.anhBia)} alt="" />
                  ) : (
                    <div className="muc__anh muc__anh--trong" aria-hidden="true">
                      {m.anhBia === undefined ? '' : '♪'}
                    </div>
                  )}
                  <div className="muc__chu">
                    <p className="muc__tieu-de" title={m.ketQua.duongDan}>{m.tieuDe}</p>
                    <p className="muc__meta">
                      {[
                        m.ketQua.cao ? m.ketQua.cao + 'p' : '',
                        tenCodec(m.ketQua.vcodec, m.ketQua.acodec),
                        dinhDangThoiLuong(m.ketQua.thoiLuong),
                        kichThuocFile(m.ketQua.duongDan),
                      ].filter(Boolean).join(' · ')}
                    </p>
                    {m.daNhap === 'loi' && <p className="muc__loi">{t('Nhập vào Premiere không được:')} {m.loiNhap}</p>}
                    {codecLa(m.ketQua.vcodec) && (
                      <p className="muc__canh-bao">{t('Codec này Premiere có thể không đọc — chọn 1080p/720p để lấy H.264.')}</p>
                    )}
                  </div>
                  <div className="muc__nut">
                    <button
                      type="button"
                      className="btn btn--nho muc__bo"
                      title={t('Bỏ khỏi danh sách (không xoá file)')}
                      aria-label={t('Bỏ khỏi danh sách (không xoá file)')}
                      onClick={() => setDaTai((ds) => ds.filter((x) => x.id !== m.id))}
                    >
                      ×
                    </button>
                    <button type="button" className="btn btn--nho" onClick={() => moThuMuc(m.ketQua.duongDan)}>
                      {t('Mở thư mục')}
                    </button>
                    {trongHost && (
                      <button
                        type="button"
                        className={'btn btn--nho' + (m.daNhap === 'roi' ? ' btn--ok' : '')}
                        disabled={m.daNhap === 'dang' || m.daNhap === 'roi'}
                        onClick={() => nhap(m)}
                      >
                        {m.daNhap === 'roi' ? t('Đã vào project') : m.daNhap === 'dang' ? t('Đang nhập…') : t('Nhập vào Premiere')}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* ── Chân: engine + cookie ── */}
      <footer className="chan">
        <div className="chan__hang">
          <span className="chan__nhan">{t('Cookie từ trình duyệt')}</span>
          <div className="chips chips--nho">
            {COOKIES.map((c) => (
              <button
                key={c.ma || 'khong'}
                type="button"
                className={'chip chip--nho' + (caiDat.cookies === c.ma ? ' chip--chon' : '')}
                disabled={dangChay}
                onClick={() => luuCaiDat({ cookies: c.ma })}
                title={t('Dùng khi trang đòi đăng nhập (Vimeo, video riêng tư). Trình duyệt đó phải đang đăng nhập sẵn.')}
              >
                {t(c.nhan)}
              </button>
            ))}
          </div>
        </div>
        <div className="chan__hang">
          <span className="chan__nhan">{t('Engine')} {phienBan}</span>
          <button type="button" className="btn btn--nho" onClick={capNhat} disabled={dangCapNhat || dangChay}>
            {dangCapNhat ? t('Đang cập nhật…') : t('Cập nhật engine')}
          </button>
          {thongBaoEngine && <span className="chan__ghi-chu" title={thongBaoEngine}>{thongBaoEngine}</span>}
        </div>
      </footer>
    </div>
  )
}

function codecLa(vcodec: string): boolean {
  const v = (vcodec || '').toLowerCase()
  return !!v && v !== 'none' && !v.startsWith('avc1') && !v.startsWith('h264')
}

function tenCodec(v: string, a: string): string {
  const vv = (v || '').toLowerCase()
  if (!vv || vv === 'none') return a && a !== 'none' ? (a.startsWith('mp3') ? 'MP3' : a.toUpperCase()) : ''
  if (vv.startsWith('avc1') || vv.startsWith('h264')) return 'H.264'
  if (vv.startsWith('vp9') || vv.startsWith('vp09')) return 'VP9'
  if (vv.startsWith('av01')) return 'AV1'
  if (vv.startsWith('hev1') || vv.startsWith('hvc1')) return 'H.265'
  return vv.split('.')[0].toUpperCase()
}

function kichThuocFile(duongDan: string): string {
  const fs = getFs()
  try {
    if (fs && fs.existsSync(duongDan)) return dinhDangMB(fs.statSync(duongDan).size)
  } catch {}
  return ''
}
