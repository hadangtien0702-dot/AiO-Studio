/**
 * kiem-dong-bo.mjs — bộ tự kiểm cho CẮT ĐỒNG BỘ nhiều track (ac_dongBoChay).
 *
 * ☠️ Vì sao phải có: thuật toán này quyết định hình và tiếng có khớp nhau
 * không. Lệch 1-2 khung hình thì mắt không thấy lúc dựng, nhưng người xem
 * nghe ra ngay — đúng loại lỗi "chạy vẫn ra kết quả trông đúng" mà bài học
 * 5h đã trả giá. Kiểm ngoài Premiere để chạy được hàng chục ca trong 1 giây.
 *
 * Nó nạp CHÍNH FILE THẬT `host/autocut.jsx` (không chép lại logic — chép lại
 * là tự kiểm bản sao, bài học 5d), dựng môi trường ExtendScript giả rồi gọi
 * đúng hai hàm panel sẽ gọi.
 *
 * Chạy:  node tests/kiem-dong-bo.mjs
 * Thoát mã 1 nếu có phép kiểm nào trượt.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const thuMuc = path.dirname(fileURLToPath(import.meta.url))
const nguonHost = path.join(thuMuc, '..', 'host', 'autocut.jsx')

// ── Môi trường ExtendScript giả ──────────────────────────────────────────────
/**
 * @param ds mảng chứa clip — `remove()` phải XOÁ THẬT khỏi mảng.
 *
 * ☠️ Bản đầu tiên viết `remove() { this.__daXoa = true }` — chỉ cắm cờ, clip
 * vẫn nằm nguyên trong mảng. Hậu quả: bộ kiểm báo host còn sót tiếng camera
 * trong khi host xoá đúng, suýt đi sửa đoạn code vốn chạy đúng. Đúng bài học
 * "số đo vô lý thì nghi CÔNG CỤ ĐO trước".
 */
function taoClip(pi, start, dai, inP, ds = null) {
  const c = {
    projectItem: pi,
    start: { seconds: start },
    end: { seconds: start + dai },
    inPoint: { seconds: inP },
    outPoint: { seconds: inP + dai },
    remove() {
      if (!ds) return
      const i = ds.indexOf(c)
      if (i >= 0) ds.splice(i, 1)
    },
  }
  return c
}

/**
 * @param loai 'V' | 'A'
 * @param keoTheo hàm trả về track audio để đổ tiếng kèm theo (chỉ track video)
 *
 * ☠️ `keoTheo` mô phỏng hành vi THẬT của Premiere mà bản kiểm đầu tiên BỎ SÓT:
 * `overwriteClip` lên track HÌNH kéo theo luôn TIẾNG CỦA CHÍNH CLIP ĐÓ xuống
 * track tiếng. Đo trên Premiere thật 04/08 mới lộ ra:
 *     A1 = Mic-Trọng ×52 + C4234 ×23   ← tiếng camera lọt vào
 *     tiengGiay 7785s trong khi hinhGiay 2597s (gấp 3)
 * Bộ kiểm cũ báo 20/20 ĐẠT trong khi bản thật hỏng — vì môi trường giả hiền
 * hơn máy thật. Nay mô phỏng luôn cái kéo theo để lần sau bắt được tại chỗ.
 */
function taoTrack(loai = 'A', keoTheo = null) {
  const ds = []
  return {
    _ds: ds,
    _loai: loai,
    _keoTheo: keoTheo,
    clips: {
      get numItems() { return ds.length },
      // ExtendScript truy cập clips[i] — giả lập bằng Proxy
    },
    overwriteClip(pi, giay) {
      const t = typeof giay === 'number' ? giay : giay.seconds
      const dai = pi.__out - pi.__in
      // overwriteClip GHI ĐÈ phần chồng lấn — mô phỏng đúng để bắt lỗi đặt đè
      const ghiDe = (list) => {
        for (let i = list.length - 1; i >= 0; i--) {
          const c = list[i]
          if (c.start.seconds < t + dai - 1e-9 && c.end.seconds > t + 1e-9) list.splice(i, 1)
        }
      }
      ghiDe(ds)
      ds.push(taoClip(pi, t, dai, pi.__in, ds))
      ds.sort((a, b) => a.start.seconds - b.start.seconds)
      // Đặt lên track HÌNH thì tiếng của chính clip đó rơi xuống track tiếng
      if (this._loai === 'V' && this._keoTheo) {
        const ta = this._keoTheo()
        if (ta) {
          ghiDe(ta._ds)
          const kem = taoClip(pi, t, dai, pi.__in, ta._ds)
          kem.projectItem = { ...pi, ten: pi.ten, __laTiengCam: true }
          ta._ds.push(kem)
          ta._ds.sort((a, b) => a.start.seconds - b.start.seconds)
        }
      }
    },
  }
}

function bocTrack(tr) {
  return new Proxy(tr, {
    get(o, k) {
      if (k === 'clips') {
        return new Proxy({}, {
          get(_, kk) {
            if (kk === 'numItems') return o._ds.length
            const i = Number(kk)
            return Number.isInteger(i) ? o._ds[i] : undefined
          },
        })
      }
      return o[k]
    },
  })
}

function bocDs(list) {
  return new Proxy({}, {
    get(_, k) {
      if (k === 'numTracks') return list.length
      const i = Number(k)
      return Number.isInteger(i) ? bocTrack(list[i]) : undefined
    },
  })
}

function taoPi(ten) {
  return {
    ten, __in: 0, __out: 0,
    setInPoint(v) { this.__in = v },
    setOutPoint(v) { this.__out = v },
  }
}

/** Dựng sequence giả: cấu hình [{loai,ti,pi,start,dai,inP}] */
function taoSeq(ten, soV, soA, dsClip, fps = 24) {
  const at = Array.from({ length: soA }, () => taoTrack('A'))
  // Track hình kéo tiếng của clip xuống track tiếng ĐẦU TIÊN — như Premiere.
  const vt = Array.from({ length: soV }, () => taoTrack('V', () => at[0]))
  for (const c of dsClip) {
    const t = c.loai === 'V' ? vt[c.ti] : at[c.ti]
    t._ds.push(taoClip(c.pi, c.start, c.dai, c.inP ?? 0, t._ds))
  }
  return {
    name: ten,
    videoTracks: bocDs(vt),
    audioTracks: bocDs(at),
    getSettings() { return { videoFrameRate: { seconds: 1 / fps } } },
    _vt: vt, _at: at,
  }
}

function napHost(seq) {
  const ma = fs.readFileSync(nguonHost, 'utf8')
  const moi = {
    $: { global: {}, writeln() {} },
    app: { project: { activeSequence: seq } },
    Time: function () { this.seconds = 0 },
  }
  const fn = new Function('$', 'app', 'Time', ma + '\n;return {ac_dongBoThem, ac_dongBoChay, ac_soTrackCoClip, ac_hopNhat};')
  return fn(moi.$, moi.app, moi.Time)
}

// ── Bộ đếm ──────────────────────────────────────────────────────────────────
let datCa = true
function kiem(ten, dat, chiTiet) {
  console.log((dat ? '  DAT   ' : '  TRUOT ') + ten + (chiTiet ? ' — ' + chiTiet : ''))
  if (!dat) datCa = false
}
function gan(a, b, saiSo = 0.001) { return Math.abs(a - b) <= saiSo }

// ═══ CA 1: podcast 2 cam + 2 mic, bỏ 2 khoảng lặng ═══════════════════════════
console.log('\n── CA 1: 2 cam + 2 mic, cắt 2 khoảng lặng ──')
{
  const camA = taoPi('camA'), camB = taoPi('camB')
  const micA = taoPi('micA'), micB = taoPi('micB')
  // V1: camA 0-10s · V2: camB 10-20s · A1: micA 0-10s · A2: micB 10-20s
  const seq = taoSeq('podcast', 2, 2, [
    { loai: 'V', ti: 0, pi: camA, start: 0, dai: 10, inP: 100 },
    { loai: 'V', ti: 1, pi: camB, start: 10, dai: 10, inP: 200 },
    { loai: 'A', ti: 0, pi: micA, start: 0, dai: 10, inP: 100 },
    { loai: 'A', ti: 1, pi: micB, start: 10, dai: 10, inP: 200 },
  ])
  const H = napHost(seq)

  kiem('nhận ra sequence nhiều track',
    H.ac_soTrackCoClip() === 'OK:trackV=2|trackA=2|daTrack=1', H.ac_soTrackCoClip())

  // Giữ: camA 0-4 và 6-10 (bỏ 4-6) · camB 10-14 và 16-20 (bỏ 14-16)
  // Panel gửi theo mốc MEDIA (inP + offset)
  H.ac_dongBoThem('V,0,0,100.0,104.0;V,0,0,106.0,110.0;A,0,0,100.0,104.0;A,0,0,106.0,110.0', '1')
  H.ac_dongBoThem('V,1,0,200.0,204.0;V,1,0,206.0,210.0;A,1,0,200.0,204.0;A,1,0,206.0,210.0', '0')
  const raw = H.ac_dongBoChay()
  kiem('chạy không lỗi', raw.indexOf('OK:') === 0, raw.slice(0, 120))

  const kv = {}
  raw.slice(3).split('\n').forEach((d) => { const i = d.indexOf('='); if (i > 0) kv[d.slice(0, i)] = d.slice(i + 1) })
  kiem('soLoi = 0', kv.soLoi === '0', 'soLoi=' + kv.soLoi + ' loiDau=' + (kv.loiDau || ''))

  // Tổng giữ = 16s (bỏ 2 khoảng × 2s)
  kiem('tổng thời lượng hình = 16s', gan(parseFloat(kv.hinhGiay), 16), kv.hinhGiay)
  kiem('tổng thời lượng tiếng = 16s', gan(parseFloat(kv.tiengGiay), 16), kv.tiengGiay)
  kiem('điểm cuối hình = tiếng', gan(parseFloat(kv.hinhCuoi), parseFloat(kv.tiengCuoi)),
    'hinh=' + kv.hinhCuoi + ' tieng=' + kv.tiengCuoi)

  // ĐÂY LÀ PHÉP KIỂM QUAN TRỌNG NHẤT: track nào vẫn ở track đó
  const v1 = seq._vt[0]._ds, v2 = seq._vt[1]._ds
  const a1 = seq._at[0]._ds, a2 = seq._at[1]._ds
  kiem('V1 vẫn là camA (không bị dồn sang track khác)',
    v1.length > 0 && v1.every((c) => c.projectItem.ten === 'camA'),
    v1.map((c) => c.projectItem.ten).join(','))
  kiem('V2 vẫn là camB', v2.length > 0 && v2.every((c) => c.projectItem.ten === 'camB'),
    v2.map((c) => c.projectItem.ten).join(','))
  kiem('A1 vẫn là MIC A (không bị thay bằng tiếng cam)',
    a1.length > 0 && a1.every((c) => c.projectItem.ten === 'micA'),
    a1.map((c) => c.projectItem.ten).join(','))
  kiem('A2 vẫn là MIC B', a2.length > 0 && a2.every((c) => c.projectItem.ten === 'micB'),
    a2.map((c) => c.projectItem.ten).join(','))

  // Đồng bộ: mỗi clip hình phải có clip tiếng cùng mốc
  const mocV = [...v1, ...v2].map((c) => c.start.seconds).sort((x, y) => x - y)
  const mocA = [...a1, ...a2].map((c) => c.start.seconds).sort((x, y) => x - y)
  kiem('mốc hình và mốc tiếng TRÙNG KHỚP từng cái',
    mocV.length === mocA.length && mocV.every((v, i) => gan(v, mocA[i])),
    'hinh=[' + mocV.map((x) => x.toFixed(2)) + '] tieng=[' + mocA.map((x) => x.toFixed(2)) + ']')

  // Không hở: các đoạn phải nối liền nhau trên trục chung
  const moiMoc = [...v1, ...v2].sort((x, y) => x.start.seconds - y.start.seconds)
  let lienTuc = gan(moiMoc[0].start.seconds, 0)
  for (let i = 1; i < moiMoc.length; i++) {
    if (!gan(moiMoc[i].start.seconds, moiMoc[i - 1].end.seconds)) lienTuc = false
  }
  kiem('không hở giữa các đoạn (đã dồn liền)', lienTuc,
    moiMoc.map((c) => c.start.seconds.toFixed(2) + '-' + c.end.seconds.toFixed(2)).join(' '))
}

// ═══ CA 2: đúng ca của anh Tiến — mic nằm TRACK RIÊNG, không dính clip hình ═══
console.log('\n── CA 2: mic track riêng (đúng ca vỡ 04/08) ──')
{
  const cam = taoPi('C4234'), mic = taoPi('Mic-Trong')
  // V1 có cam, A2 có mic — A1 TRỐNG (giống sequence sau Podcast)
  const seq = taoSeq('sau-podcast', 1, 2, [
    { loai: 'V', ti: 0, pi: cam, start: 0, dai: 20, inP: 0 },
    { loai: 'A', ti: 1, pi: mic, start: 0, dai: 20, inP: 0 },
  ])
  const H = napHost(seq)
  H.ac_dongBoThem('V,0,0,0.0,8.0;V,0,0,12.0,20.0;A,1,0,0.0,8.0;A,1,0,12.0,20.0', '1')
  const raw = H.ac_dongBoChay()
  kiem('chạy không lỗi', raw.indexOf('OK:') === 0, raw.slice(0, 120))
  const a2 = seq._at[1]._ds
  kiem('MIC còn nguyên trên A2 (đây chính là chỗ bản cũ làm mất)',
    a2.length === 2 && a2.every((c) => c.projectItem.ten === 'Mic-Trong'),
    a2.map((c) => c.projectItem.ten).join(','))
  kiem('A1 vẫn trống (không bị nhét tiếng cam vào)', seq._at[0]._ds.length === 0,
    'A1 có ' + seq._at[0]._ds.length + ' clip')
  const v1 = seq._vt[0]._ds
  kiem('hình và tiếng cùng số đoạn', v1.length === a2.length, v1.length + ' vs ' + a2.length)
  kiem('mốc hình = mốc tiếng',
    v1.every((c, i) => gan(c.start.seconds, a2[i].start.seconds)),
    v1.map((c) => c.start.seconds.toFixed(2)).join(',') + ' | ' +
    a2.map((c) => c.start.seconds.toFixed(2)).join(','))
}

// ═══ CA 3: hợp nhất khoảng giữ chồng lấn ════════════════════════════════════
console.log('\n── CA 3: hợp nhất khoảng chồng lấn ──')
{
  const seq = taoSeq('x', 1, 1, [])
  const H = napHost(seq)
  const r1 = H.ac_hopNhat([{ tu: 0, den: 5 }, { tu: 3, den: 8 }, { tu: 20, den: 25 }], 0.02)
  kiem('gộp 2 khoảng chồng lấn thành 1', r1.length === 2 && gan(r1[0].den, 8),
    JSON.stringify(r1))
  const r2 = H.ac_hopNhat([{ tu: 10, den: 15 }, { tu: 0, den: 5 }], 0.02)
  kiem('sắp xếp lại khi đưa vào lộn xộn', gan(r2[0].tu, 0) && gan(r2[1].tu, 10),
    JSON.stringify(r2))
  const r3 = H.ac_hopNhat([{ tu: 0, den: 5 }, { tu: 5.01, den: 9 }], 0.02)
  kiem('gộp 2 khoảng sát nhau (trong sai số 1 khung)', r3.length === 1 && gan(r3[0].den, 9),
    JSON.stringify(r3))
}

// ═══ CA 4: gãy an toàn ══════════════════════════════════════════════════════
console.log('\n── CA 4: gãy an toàn ──')
{
  const seq = taoSeq('trong', 1, 1, [])
  const H = napHost(seq)
  kiem('chưa gom đoạn nào → báo lỗi, không cắt bừa',
    H.ac_dongBoChay().indexOf('ERR:') === 0, H.ac_dongBoChay())

  const cam = taoPi('cam')
  const seq2 = taoSeq('co-clip', 1, 1, [{ loai: 'V', ti: 0, pi: cam, start: 0, dai: 10, inP: 0 }])
  const H2 = napHost(seq2)
  H2.ac_dongBoThem('V,0,0,50.0,60.0', '1') // đoạn nằm NGOÀI clip
  const r = H2.ac_dongBoChay()
  kiem('đoạn giữ không giao clip nào → báo lỗi thay vì tạo sequence rỗng',
    r.indexOf('ERR:') === 0, r.slice(0, 90))
}

console.log('')
console.log(datCa ? '>>> TAT CA DAT' : '>>> CO PHEP KIEM TRUOT')
process.exit(datCa ? 0 : 1)
