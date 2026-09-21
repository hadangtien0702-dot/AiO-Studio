/**
 * dongHanh.ts — TOOL PHẢI ĐỒNG HÀNH (luật anh Tiến 19/08, AiO Studio/CLAUDE.md 4b).
 *
 * Mọi thứ panel nói về THẾ GIỚI BÊN NGOÀI phải là SỐ ĐO mới, không phải cờ lưu:
 *  - project đang mở (đường dẫn — KHÔNG theo tên: hai project cùng tên ở hai
 *    thư mục là chuyện thường);
 *  - file đã tải còn trên đĩa không;
 *  - file đó có đang nằm trong project ĐANG MỞ không.
 *
 * ☠️ Vì sao có file này — 21/09 anh Tiến: *"Nút đã vào Project là Ảo"*. Đo:
 * 5/6 mục mang cờ daNhap:'roi' lưu cứng từ project test AiO-VD-test_1 (08/09)
 * trong khi anh đang mở Test3_1; và 5/6 file đó đã không còn trên đĩa.
 *
 * Cách hỏi (khuôn Autocut 4b): MỘT vòng 2 s hỏi thông tin project + DẤU HIỆU NHẸ
 * (vd_dauHieu ~1 ms); dấu hiệu đổi / panel được focus / danh sách đổi thì hỏi
 * trạng thái đầy đủ (vd_trangThai: findItemsMatchingMediaPath, đo 1 ms/file trên
 * Test3_1). Thêm nhịp soát đầy đủ 10 s: dấu hiệu chỉ đếm bin AiO + gốc, xoá clip
 * đã kéo sang bin KHÁC thì dấu hiệu không đổi (soi 21/09). Còn lệnh host treo
 * (hộp thoại modal) thì BỎ LƯỢT, không chồng thêm.
 * Đo 21/09 trên Premiere thật: xoá clip → nhãn đổi sau 3,9 s; đổi project 0,2 s.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { getFs } from '../lib/node'
import { isInHost, hoiNhip, hostDangCho, hostBan, trangThaiTrongProject } from '../lib/cep'
import type { ThongTinHost } from '../lib/cep'

export interface TinhTrangFile {
  /** true = còn trên đĩa. undefined = chưa đo xong. */
  con?: boolean
  kichThuoc?: number
  /** 0 = không có trong project đang mở · 1 = có · 2 = có nhưng offline · undefined = chưa biết. */
  trongProject?: number
}

const NHIP_MS = 2000
/** Soát đầy đủ mỗi 5 lượt hỏi 2 s ≈ 10 s. */
const SOAT_MOI = 5

/**
 * Thông tin project đang mở + dấu hiệu bin, hỏi lại mỗi 2 giây trong MỘT lệnh.
 * `layTheoDoi()` = các file đang được báo "Trong project" — dấu hiệu gồm cả mã
 * trạng thái của chúng, để xoá clip ở BẤT CỨ bin nào cũng làm dấu hiệu đổi.
 */
export function useHost(layTheoDoi: () => string[]): { host: ThongTinHost; ban: boolean; dauHieu: string; nhip: number } {
  const trongHost = isInHost()
  const [host, setHost] = useState<ThongTinHost>({ appVersion: '', duong: '', ten: '' })
  const [ban, setBan] = useState(false)
  const [dauHieu, setDauHieu] = useState('')
  // Đếm số lượt hỏi ĐÃ TRẢ LỜI — useTinhTrang soát đầy đủ mỗi 5 lượt, NGAY SAU khi
  // lượt này trả (soi 21/09: interval 10 s riêng trùng pha với vòng 2 s → luôn gặp
  // lệnh đang chờ → bỏ lượt).
  const [nhip, setNhip] = useState(0)
  const layRef = useRef(layTheoDoi)
  layRef.current = layTheoDoi
  useEffect(() => {
    if (!trongHost) return
    let dung = false
    const doc = async () => {
      const b = hostBan()
      setBan((cu) => (cu === b ? cu : b))
      if (hostDangCho() > 0) return // còn lệnh treo → không chồng thêm
      const r = await hoiNhip(layRef.current())
      if (dung || !r.host) return
      const h = r.host
      // Chỉ đổi state khi thật sự đổi — object mới mỗi 2 s làm cả panel vẽ lại.
      setHost((cu) => (cu.duong === h.duong && cu.ten === h.ten && cu.appVersion === h.appVersion ? cu : h))
      setDauHieu(r.dauHieu)
      setNhip((n) => n + 1)
    }
    doc()
    const id = window.setInterval(doc, NHIP_MS)
    return () => {
      dung = true
      window.clearInterval(id)
    }
  }, [trongHost])
  return { host, ban, dauHieu, nhip }
}

/** Khi panel được focus lại / hiện lại → gọi `cb`. Người dùng đổi thứ gì ở ngoài thì lúc quay lại là lúc hỏi. */
function useKhiQuayLai(cb: () => void) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    const f = () => ref.current()
    const v = () => {
      if (document.visibilityState === 'visible') ref.current()
    }
    window.addEventListener('focus', f)
    document.addEventListener('visibilitychange', v)
    return () => {
      window.removeEventListener('focus', f)
      document.removeEventListener('visibilitychange', v)
    }
  }, [])
}

/**
 * Tình trạng sống của từng đường dẫn trong danh sách "Đã tải".
 * Trả map đường dẫn → tình trạng, và `hoiLai()` để gọi ngay sau khi nhập.
 */
export function useTinhTrang(
  dsDuong: string[],
  duongProject: string,
  dauHieu: string,
  nhip: number,
): { tt: Record<string, TinhTrangFile>; hoiLai: () => void } {
  const trongHost = isInHost()
  const [tt, setTt] = useState<Record<string, TinhTrangFile>>({})
  const khoa = dsDuong.join('\n')
  const dsRef = useRef(dsDuong)
  dsRef.current = dsDuong
  const dangHoi = useRef(false)
  const luotFile = useRef(0)

  /** Gộp THEO TỪNG đường dẫn; bỏ khoá không còn trong danh sách MỚI NHẤT. */
  const gop = useCallback((phan: Record<string, TinhTrangFile>) => {
    setTt((cu) => {
      const ds = dsRef.current
      const moi: Record<string, TinhTrangFile> = {}
      let doi = Object.keys(cu).length !== ds.length
      for (const p of ds) {
        const c = cu[p] || {}
        const n = phan[p] ? { ...c, ...phan[p] } : c
        if (!doi && (n.con !== c.con || n.kichThuoc !== c.kichThuoc || n.trongProject !== c.trongProject || !cu[p])) doi = true
        moi[p] = n
      }
      return doi ? moi : cu
    })
  }, [])

  // ── File còn trên đĩa: fs.stat BẤT ĐỒNG BỘ (ổ mạng rớt không làm đơ panel) ──
  const doFile = useCallback(async () => {
    const fs = getFs()
    const ds = dsRef.current
    if (!fs || !ds.length) return
    const luot = ++luotFile.current
    const kq: Record<string, TinhTrangFile> = {}
    await Promise.all(
      ds.map(
        (p) =>
          new Promise<void>((r) => {
            fs.stat(p, (e: any, st: any) => {
              kq[p] = e ? { con: false, kichThuoc: 0 } : { con: true, kichThuoc: st.size }
              r()
            })
          }),
      ),
    )
    if (luot !== luotFile.current) return // lượt cũ trả muộn (ổ mạng) — bỏ
    gop(kq)
  }, [gop])

  // ── Có trong project đang mở không ──
  const doProject = useCallback(async () => {
    const ds = dsRef.current
    if (!trongHost || dangHoi.current || !ds.length) return
    if (hostDangCho() > 0) return
    dangHoi.current = true
    try {
      const r = await trangThaiTrongProject(ds)
      const phan: Record<string, TinhTrangFile> = {}
      // Không hỏi được (chưa mở project, host cũ…): XOÁ số cũ — đừng để nhãn của
      // project trước nằm lại cạnh dòng "Chưa mở project".
      ds.forEach((p, i) => {
        phan[p] = { trongProject: r && r.ma.length === ds.length ? r.ma[i] : undefined }
      })
      gop(phan)
    } finally {
      dangHoi.current = false
    }
  }, [gop, trongHost])

  const hoiLai = useCallback(() => {
    doFile()
    doProject()
  }, [doFile, doProject])

  // Danh sách đổi / project đổi / dấu hiệu bin đổi → hỏi ngay.
  useEffect(() => {
    doFile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoa])
  useEffect(() => {
    doProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khoa, duongProject, dauHieu])

  useKhiQuayLai(hoiLai)

  // File: mỗi 4 s.
  useEffect(() => {
    const a = window.setInterval(doFile, NHIP_MS * 2)
    return () => window.clearInterval(a)
  }, [doFile])

  // Project: soát đầy đủ mỗi SOAT_MOI lượt hỏi (~10 s), ngay sau lượt vừa trả lời
  // (tự kéo file vào bin khác — dấu hiệu không bắt được ca này).
  useEffect(() => {
    if (nhip > 0 && nhip % SOAT_MOI === 0) doProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nhip])

  return { tt, hoiLai }
}
