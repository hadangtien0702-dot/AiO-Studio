/* =========================================================================
   Do QUAY VIDEO qua DUNG DUONG THAT cua app (01/10) — chay: npm run test:quayapp [-- --tieng]
   Chay `electron . --thu-quay`: batDauGhiHinh -> vien cam + dong ho -> bam nut Dung that -> file MP4 -> so video ->
   Khay video. Sau do SOI: cua so nao cham vung dang quay khong, dong ho co dem khong, file co o dung thu muc khong,
   khay co phat duoc khong, VIEN CAM CO LOT VAO VIDEO KHONG (so loi #13).
   ☠️ HIEN vien cam + dong ho + Khay video len man hinh ~6 giay. Anh dang ngoi may thi HOI TRUOC (so loi #12).
   Thu muc luu + userData RIENG trong .selftest/ (do bai nay tao, xoa dung 2 thu muc do truoc moi lan chay) —
   khong dung toi anh/video cua nguoi dung, khong danh thuc ban dang chay.
   ========================================================================= */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync, execFileSync } from 'node:child_process'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const UD = path.join(ROOT, '.selftest', 'userData-thu-quay')
const LUU = path.join(ROOT, '.selftest', 'thu-quay-app')
const RA = path.join(ROOT, '.selftest', 'thu-quay-ket-qua.json')
const TIENG = process.argv.includes('--tieng')
const TU_DUNG = process.argv.includes('--tu-dung') // do duong TU DUNG khi het tran (ha tran con 2 s bang AIO_QUAY_TOI_DA_MS)
const XOA = process.argv.includes('--xoa') // bam nut Xoa that: file thu vao Thung rac cua may (lam 1 lan khi dung vao duong xoa)
const kq = []
let dat = true
const kiem = (ten, ok, chiTiet = '') => { kq.push((ok ? '  DAT  ' : '  TRUOT ') + ten + (chiTiet ? ' (' + chiTiet + ')' : '')); if (!ok) dat = false }

for (const d of [UD, LUU]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }) }
try { fs.unlinkSync(RA) } catch (e) {}
fs.writeFileSync(path.join(UD, 'cau-hinh.json'), JSON.stringify({ thuMucAnh: LUU, lang: 'vi' }))

const electron = path.join(ROOT, 'node_modules', 'electron', 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron')
const env = Object.assign({}, process.env, { AIO_USERDATA: UD }, TU_DUNG ? { AIO_QUAY_TOI_DA_MS: '2000' } : {})
delete env.ELECTRON_RUN_AS_NODE
// AIO_THU_EXE=<duong dan exe da dong goi>: do BAN DONG GOI (nguon dung chua chac ban dong goi dung)
const EXE = process.env.AIO_THU_EXE || ''
if (EXE) console.log('Do BAN DONG GOI: ' + EXE)
const chay = spawnSync(EXE || electron, (EXE ? [] : [ROOT]).concat(['--thu-quay', RA]).concat(TIENG ? ['--tieng'] : [], XOA ? ['--xoa'] : [], TU_DUNG ? ['--tu-dung'] : []), { env, encoding: 'utf8', timeout: 90000 })
kiem('App chay che do --thu-quay xong, ma thoat 0', chay.status === 0, 'status ' + chay.status)

let r = null
try { r = JSON.parse(fs.readFileSync(RA, 'utf8')) } catch (e) {}
kiem('Co file ket qua', !!r)
if (!r) { console.log(kq.join('\n')); process.exit(1) }
if (r.loi) kiem('Khong co loi nem ra', false, r.loi.slice(0, 300))

const sf = r.man ? r.man.sf : 1
kiem('Luong chup san sang', r.luongSanSang === true)
if (EXE) kiem('Dung la ban dong goi', r.dongGoi === true, 'ban ' + r.ban)
else console.log('Ban nguon ' + r.ban)
kiem('Thu muc luu la thu muc RIENG cua bai do', path.resolve(r.thuMucLuu || '') === path.resolve(LUU), r.thuMucLuu)
kiem('batDauGhiHinh vao trang thai dang quay', r.dangQuay === true)
if (r.luot) {
  const mw = Math.floor(r.rect.w * sf / 2) * 2, mh = Math.floor(r.rect.h * sf / 2) * 2
  kiem('Co video = vung khoanh x he so man (' + sf + ')', Math.abs(r.luot.w - mw) <= 2 && Math.abs(r.luot.h - mh) <= 2, 'mong ' + mw + 'x' + mh + ', ra ' + r.luot.w + 'x' + r.luot.h)
  kiem('Tieng: xin ' + (TIENG ? 'CO' : 'KHONG') + ' -> ' + (r.luot.tieng ? 'co' : 'khong') + ' track tieng', r.luot.tieng === TIENG)
  kiem('Co dong ho + nut Dung (vung giua man con cho)', r.luot.coThuoc === true)
}
const cs = r.cuaSo || []
const vien = cs.filter((c) => /dem\/vien\.html/.test(c.url)), dh = cs.filter((c) => /dem\/quay\.html/.test(c.url))
kiem('4 thanh vien + 1 dong ho dang hien', vien.length === 4 && dh.length === 1, 'vien ' + vien.length + ', dong ho ' + dh.length)
kiem('KHONG cua so nao cham vung dang quay', cs.length > 0 && cs.every((c) => !c.chamVung), cs.filter((c) => c.chamVung).map((c) => c.url + JSON.stringify(c.b)).join(' '))
let dongHo = null
try { dongHo = JSON.parse(r.dongHo) } catch (e) {}
if (TU_DUNG) kiem('TU DUNG khi het tran (2 s): khong ai bam ma van het trang thai quay, so ghi 1,5-3,5 s', r.daDung === true && (r.so || []).length === 1 && r.so[0].ms >= 1500 && r.so[0].ms <= 3500, String(r.dongHo) + ' -> ' + ((r.so || [])[0] || {}).ms + ' ms')
else kiem('Dong ho dang dem (sau ~2,6 s hien 0:02 hoac 0:03), cham do nhay', !!dongHo && dongHo.chay === true && /^0:0[23]$/.test(dongHo.gio), String(r.dongHo))
if (dongHo) {
  kiem('Nut ghi "Dừng" (lay tu i18n), co cau noi ve main', dongHo.nut === 'Dừng' && dongHo.coCau === 'object', dongHo.nut + ' / ' + dongHo.coCau)
  kiem('Icon loa tren dong ho ' + (TIENG ? 'HIEN' : 'AN'), TIENG ? dongHo.loa !== 'none' : dongHo.loa === 'none', dongHo.loa)
}
kiem((TU_DUNG ? 'Het tran' : 'Bam nut Dung') + ' -> het trang thai quay trong 8 s', r.daDung === true)
kiem('Dung xong: vien + dong ho da dong het', r.conVien === 0, 'con ' + r.conVien)
kiem('File .tam da doi ten (khong con file tam)', r.fileConTam === false)

if (XOA) {
  kiem('Xoa lan 1: CHUA xoa, nut doi chu hoi lai', !!r.xoaLan1 && r.xoaLan1.conFile === true && r.xoaLan1.chuNut === 'Bấm lần nữa để xoá', JSON.stringify(r.xoaLan1))
  kiem('Xoa lan 2: file roi thu muc luu (vao Thung rac), so + khay con 0, co thong bao', !!r.xoaLan2 && r.xoaLan2.conFile === false && r.xoaLan2.conTrongSo === 0 && r.xoaLan2.hang === 0 && r.xoaLan2.toast === 'Đã đưa vào Thùng rác', JSON.stringify(r.xoaLan2))
  kiem('Xoa lan 2: ban KHONG TIENG (neu da tao) cung di theo, thu muc luu con 0 file', !!r.xoaLan2 && r.xoaLan2.conFileKhongTieng === false && r.xoaLan2.conTrongThuMuc === 0, JSON.stringify(r.xoaLan2))
}

// 01/10 CHON TIENG trong khay (anh chot: quay luon co tieng, vao khay moi chon Co tieng / Khong tieng)
let t0 = null, t1 = null, t2 = null
try { t0 = JSON.parse(r.tieng0) } catch (e) {}
try { t1 = r.tieng1 && Object.assign({}, r.tieng1, { gd: JSON.parse(r.tieng1.giaoDien) }) } catch (e) {}
try { t2 = r.tieng2 && Object.assign({}, r.tieng2, { gd: JSON.parse(r.tieng2.giaoDien) }) } catch (e) {}
const so0 = (r.so || [])[0]
if (!TIENG) kiem('Video quay KHONG tieng: khay khong hien cum chon tieng', !!t0 && t0.nut.length === 0, String(r.tieng0))
else {
  kiem('Mo khay: 2 nut, dang chon "Có tiếng", trinh phat co tieng', !!t0 && t0.nut.join('|') === 'Có tiếng*|Không tiếng' && t0.muted === false, String(r.tieng0))
  kiem('Bam "Không tiếng": nut doi, trinh phat tat tieng, so ghi boTieng', !!t1 && t1.gd.nut.join('|') === 'Có tiếng|Không tiếng*' && t1.gd.muted === true && t1.boTieng === true, JSON.stringify(t1))
  kiem('Bam "Không tiếng": tao file "-khong-tieng.mp4" canh ban goc, keo tha se lay file do', !!t1 && !!so0 && t1.coFile === true && t1.fileKhongTieng === so0.file.replace(/\.mp4$/, '-khong-tieng.mp4') && t1.keoSeLay === t1.fileKhongTieng, t1 ? t1.keoSeLay : '')
  kiem('Nut Xoa ghi tong dung luong ca 2 file sau khi tao ban khong tieng', !!t0 && !!t1 && t0.xoa !== t1.gd.xoa, (t0 && t0.xoa) + ' -> ' + (t1 && t1.gd.xoa))
  kiem('Bam lai "Có tiếng": nut doi lai, trinh phat co tieng, keo tha lay ban goc, ban khong tieng VAN con tren dia', !!t2 && !!so0 && t2.gd.nut.join('|') === 'Có tiếng*|Không tiếng' && t2.gd.muted === false && t2.boTieng === false && t2.keoSeLay === so0.file && t2.conFileKhongTieng === true, JSON.stringify(t2))
}
const so = r.so || []
kiem('So video co dung 1 muc', so.length === 1, 'co ' + so.length)
const m = so[0]
if (m && XOA) console.log('(--xoa: file da vao Thung rac, bo qua phan soi file)')
if (m && !XOA) {
  kiem('File nam trong thu muc luu, ten shotandsave-video-*.mp4', path.dirname(m.file) === path.resolve(LUU) && /^shotandsave-video-\d{4}-\d{2}-\d{2}-\d{6}-\d{3}\.mp4$/.test(path.basename(m.file)) && fs.existsSync(m.file), m.file)
  kiem('Dung luong trong so = dung luong file', fs.existsSync(m.file) && fs.statSync(m.file).size === m.bytes, m.bytes + ' byte')
  kiem('Thoi luong ghi so ' + (TU_DUNG ? '1,5-3,5' : '2,0-4,5') + ' s', TU_DUNG ? (m.ms >= 1500 && m.ms <= 3500) : (m.ms >= 2000 && m.ms <= 4500), m.ms + ' ms')
  const chiCo = fs.readdirSync(LUU)
  kiem('Thu muc luu chi co DUNG ' + (TIENG ? '2 file (ban goc + ban khong tieng)' : '1 file') + ', khong rac .tam', chiCo.length === (TIENG ? 2 : 1) && !chiCo.some((f) => f.endsWith('.tam')), chiCo.join(', '))

  let khay = null
  try { khay = JSON.parse(r.khay) } catch (e) {}
  const h = khay && khay.hang && khay.hang[0]
  kiem('Khay video mo, 1 hang, dem = 1', !!khay && khay.hang.length === 1 && khay.dem === '1', String(r.khay).slice(0, 200))
  if (h) {
    kiem('Video trong khay nap duoc qua file:// (khong loi, co khung hinh)', h.loi == null && h.ready >= 1 && h.kich === m.w + 'x' + m.h, 'ready ' + h.ready + ', ' + h.kich + ', loi ' + h.loi)
    kiem('Trinh phat doc dung thoi luong (lech <= 0,6 s so voi so)', Math.abs(h.dur - m.ms / 1000) <= 0.6, h.dur + ' s vs ' + m.ms / 1000 + ' s')
    // 01/10 13:xx: thoi luong chi con o nhan tren khung video (.vd-gio), dong thong tin = gio · co · dung luong (khong noi 2 lan)
    kiem('Nhan thoi luong tren khung + dong thong tin co kich thuoc, KHONG lap thoi luong', /^0:0[1-4]$/.test(h.gio) && h.meta.includes(m.w + '×' + m.h) && !h.meta.includes(' · ' + h.gio + ' · '), h.gio + ' | ' + h.meta)
    kiem('Chu tren khay la Inter', /Inter/.test(khay.font), khay.font)
  }
  kiem('Icon keo: khung dau ve duoc ra canvas va gui ve main', r.iconKeo >= 1, 'so icon ' + r.iconKeo)

  // Thuoc NGOAI: ffprobe + soi diem anh bang ffmpeg (bo quay khong tu cham minh)
  const bin = ['AiO Autocut', 'AiO Asset Manager', 'AiO Transcripts', 'AiO Power Bins'].map((p) => path.join(ROOT, '..', p, 'bin', 'win64')).find((d) => fs.existsSync(path.join(d, 'ffprobe.exe')))
  if (bin && fs.existsSync(m.file)) {
    const o = JSON.parse(execFileSync(path.join(bin, 'ffprobe.exe'), ['-v', 'error', '-count_packets', '-show_entries', 'stream=codec_type,codec_name,width,height,nb_read_packets,channels:format=duration', '-of', 'json', m.file], { encoding: 'utf8' }))
    const v = o.streams.find((s) => s.codec_type === 'video'), a = o.streams.find((s) => s.codec_type === 'audio')
    const fps = Number(v.nb_read_packets) / (m.ms / 1000)
    kiem('ffprobe: h264 ' + m.w + 'x' + m.h + ', 24-31 khung/giay', v.codec_name === 'h264' && Number(v.width) === m.w && Number(v.height) === m.h && fps >= 24 && fps <= 31, v.nb_read_packets + ' khung = ' + fps.toFixed(1) + ' fps')
    kiem('ffprobe: ' + (TIENG ? 'co tieng AAC 2 kenh' : 'khong co tieng'), TIENG ? (!!a && a.codec_name === 'aac' && Number(a.channels) === 2) : !a, a ? a.codec_name + ' ' + a.channels + ' kenh' : 'khong tieng')
    if (TIENG && t1 && t1.fileKhongTieng && fs.existsSync(t1.fileKhongTieng)) {
      const o2 = JSON.parse(execFileSync(path.join(bin, 'ffprobe.exe'), ['-v', 'error', '-count_packets', '-show_entries', 'stream=codec_type,nb_read_packets', '-of', 'json', t1.fileKhongTieng], { encoding: 'utf8' }))
      const v2 = o2.streams.filter((s) => s.codec_type === 'video'), a2 = o2.streams.filter((s) => s.codec_type === 'audio')
      kiem('ffprobe ban KHONG TIENG do app tao: 0 duong tieng, so khung hinh = ban goc', a2.length === 0 && v2.length === 1 && v2[0].nb_read_packets === v.nb_read_packets, 'tieng ' + a2.length + ', hinh ' + (v2[0] && v2[0].nb_read_packets) + ' / ' + v.nb_read_packets)
    }
    // VIEN CAM co lot vao video khong: lay 1 khung giua doan, soi 6 hang/cot ngoai cung. Vien lot vao = ca mot hang/cot
    // gan nhu toan cam accent (248,104,32). Mau cam le te cua noi dung man hinh khong lam truot (nguong 50% mot hang/cot).
    const raw = execFileSync(path.join(bin, 'ffmpeg.exe'), ['-v', 'error', '-ss', String(Math.min(1.2, m.ms / 2000)), '-i', m.file, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 })
    const W = m.w, H = m.h
    const cam = (buf, x, y) => { const i = (y * W + x) * 3; return Math.abs(buf[i] - 248) <= 28 && Math.abs(buf[i + 1] - 104) <= 28 && Math.abs(buf[i + 2] - 32) <= 28 }
    const soiVien = (buf) => {
      let xau = 0, tep = ''
      for (let k = 0; k < 6; k++) {
        for (const [ten, n, lay] of [['hang ' + k, W, (i) => cam(buf, i, k)], ['hang ' + (H - 1 - k), W, (i) => cam(buf, i, H - 1 - k)], ['cot ' + k, H, (i) => cam(buf, k, i)], ['cot ' + (W - 1 - k), H, (i) => cam(buf, W - 1 - k, i)]]) {
          let c = 0; for (let i = 0; i < n; i++) if (lay(i)) c++
          if (c / n > xau) { xau = c / n; tep = ten }
        }
      }
      return { xau, tep }
    }
    kiem('Lay duoc 1 khung hinh de soi', raw.length === W * H * 3, raw.length + ' byte, mong ' + W * H * 3)
    if (raw.length === W * H * 3) {
      const s = soiVien(raw)
      kiem('VIEN CAM KHONG lot vao video (hang/cot mep cam nhieu nhat < 50%)', s.xau < 0.5, s.tep + ': ' + (s.xau * 100).toFixed(1) + '%')
      // Doi chung: tu ve 1 vach cam 2 px o mep tren -> thuoc PHAI bat duoc
      const gia = Buffer.from(raw)
      for (let y = 0; y < 2; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; gia[i] = 248; gia[i + 1] = 104; gia[i + 2] = 32 }
      kiem('Doi chung: ve vach cam vao mep -> thuoc bat duoc', soiVien(gia).xau >= 0.99)
    }
  } else console.log('KHONG co ffprobe/ffmpeg tren may -> bo qua phan soi file')
}

console.log('\n' + '='.repeat(60))
console.log(kq.join('\n'))
console.log('='.repeat(60))
console.log(`Ket qua: ${dat ? 'TAT CA DAT (PASS)' : 'CO MUC TRUOT (FAIL)'}`)
if (!dat) process.exit(1)
