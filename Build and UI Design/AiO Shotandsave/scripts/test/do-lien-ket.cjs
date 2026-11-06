'use strict'
/* Do DIEU KHIEN BANG LINK aioshot://… (src/lien-ket.js) — chay: npm run test:lienket
   Khong bat cua so, khong can Electron: goi THANG bo xu ly voi chuoi dau vao (nhu link/dong lenh den tu he dieu hanh), thay phan
   "lam viec" bang bo ghi nho cac lan duoc goi. Thu muc anh + file thu nam trong os.tmpdir(), bai nay tao va tu xoa.
   ☠️ Trong nhom [2] cac link la LINK DOC HAI (do mot trang web bat ky mo ra): KHONG lenh nao duoc chay, KHONG file nao ngoai thu muc
   anh duoc cham. DOI CHUNG: cung bai chay tren ban lien-ket.js da bo hai chot chan "ngoai thu muc anh" phai TRUOT. */
process.stdout.on('error', () => {})
process.stderr.on('error', () => {})
process.on('uncaughtException', (e) => { try { console.log('LOI KHONG BAT: ' + (e && e.stack || e)) } catch (x) {} process.exit(2) })

const fs = require('fs')
const os = require('os')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const NGUON = path.join(ROOT, 'src', 'lien-ket.js')
let dat = 0, truot = 0
const kiem = (ten, ok, ct) => { if (ok) { dat++; console.log('  DAT  ' + ten) } else { truot++; console.log('  TRUOT ' + ten + (ct ? '  -> ' + ct : '')) } }
const tamDaTao = []
const mkTam = (t) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-lk-' + t + '-')); tamDaTao.push(d); return d }

/* Thu muc anh gia + mot thu muc "ben ngoai" co file that, de biet file ben ngoai co bi cham toi khong. */
const goc = mkTam('goc')
const anh = path.join(goc, 'anh'); fs.mkdirSync(anh)
const ngoai = path.join(goc, 'ngoai'); fs.mkdirSync(ngoai)
fs.mkdirSync(path.join(anh, 'con'))
fs.writeFileSync(path.join(anh, 'a.png'), 'PNG-A')
fs.writeFileSync(path.join(anh, 'B C.jpg'), 'JPG-B')
fs.writeFileSync(path.join(anh, 'con', 'd.jpeg'), 'JPEG-D')
fs.writeFileSync(path.join(anh, 'ghi-chu.txt'), 'khong phai anh')
fs.writeFileSync(path.join(anh, 'video.mp4'), 'VIDEO')
fs.writeFileSync(path.join(ngoai, 'bi-mat.png'), 'PNG-BI-MAT')
fs.writeFileSync(path.join(ngoai, 'x.txt'), 'x')
let coLienKetThuMuc = true
try { fs.symlinkSync(ngoai, path.join(anh, 'loi-thoat'), 'junction') } catch (e) { coLienKetThuMuc = false }

function dung(duongNguon) {
  delete require.cache[require.resolve(duongNguon)]
  const mod = require(duongNguon)
  const goi = []
  const nhatKy = []
  const dongHo = { t: 1700000000000 }
  const lk = mod.taoLienKet({
    thuMucAnh: () => anh,
    ghiLog: (x) => nhatKy.push(x),
    now: () => dongHo.t,
    lamViec: {
      chup: () => goi.push(['chup']), chupLaiVung: () => goi.push(['chupLaiVung']), canvas: () => goi.push(['canvas']),
      khay: () => goi.push(['khay']), tim: (c) => goi.push(['tim', c]), ghim: (d) => goi.push(['ghim', d]),
    },
  })
  const xuLy = (s) => { const r = lk.xuLy(s); dongHo.t += 7000; return r } // moi lenh cach nhau 7 giay: khong dinh gioi han tan suat (700 ms · 10 lenh / 60 giay)
  return { mod, lk, goi, nhatKy, dongHo, xuLy }
}

;(async () => {
  console.log('[1] Link hop le: dung lenh, dung tham so')
  {
    const m = dung(NGUON)
    for (const [link, ky] of [
      ['aioshot://chup', ['chup']], ['aioshot://chup/', ['chup']], ['AIOSHOT://Chup', ['chup']], ['aioshot:chup', ['chup']],
      ['aioshot://chup-lai-vung', ['chupLaiVung']], ['aioshot://canvas', ['canvas']], ['aioshot://khay', ['khay']],
      ['aioshot://tim?chu=hoa%20don', ['tim', 'hoa don']], ['aioshot://tim', ['tim', '']], ['aioshot://tim?chu=h%E1%BB%A3p%20%C4%91%E1%BB%93ng', ['tim', 'hợp đồng']],
    ]) {
      const truoc = m.goi.length
      const r = m.xuLy(link)
      kiem(link + ' -> ' + ky[0], r.ok === true && m.goi.length === truoc + 1 && JSON.stringify(m.goi[m.goi.length - 1]) === JSON.stringify(ky), JSON.stringify({ r, goi: m.goi[m.goi.length - 1] }))
    }
    // ghim: ten tuong doi + ten co dau cach + thu muc con + duong dan tuyet doi nam trong thu muc anh
    const ghim = []
    for (const f of ['a.png', 'B%20C.jpg', 'con/d.jpeg', encodeURIComponent(path.join(anh, 'a.png'))]) {
      const truoc = m.goi.length
      const r = m.xuLy('aioshot://ghim?file=' + f)
      ghim.push(r.ok && m.goi.length === truoc + 1 && m.goi[m.goi.length - 1][0] === 'ghim')
    }
    kiem('ghim: ten tuong doi, co dau cach, thu muc con, duong dan tuyet doi trong thu muc anh deu ghim duoc', ghim.every(Boolean), JSON.stringify(ghim))
    const cuoi = m.goi[m.goi.length - 1][1]
    kiem('ghim truyen DUONG DAN THAT (da giai lien ket) cho app', path.resolve(cuoi).toLowerCase() === path.join(fs.realpathSync(anh), 'a.png').toLowerCase(), cuoi)
  }

  async function doc(ten, nguon, phaiTruot) {
    console.log('[2] LINK DOC HAI: khong lenh nao chay, khong cham file ngoai thu muc anh' + (phaiTruot ? '  <<< DOI CHUNG (ban bo chot chan: phai TRUOT)' : ''))
    const m = dung(nguon)
    const bi = path.join(ngoai, 'bi-mat.png')
    const doc = [
      'aioshot://ghim?file=' + encodeURIComponent(bi),                                  // tuyet doi, ngoai thu muc
      'aioshot://ghim?file=' + encodeURIComponent('..' + path.sep + 'ngoai' + path.sep + 'bi-mat.png'),
      'aioshot://ghim?file=' + encodeURIComponent('con/../../ngoai/bi-mat.png'),
      'aioshot://ghim?file=' + encodeURIComponent('..%2Fngoai%2Fbi-mat.png'),
      'aioshot://ghim?file=%2e%2e%2fngoai%2fbi-mat.png',
      'aioshot://ghim?file=' + encodeURIComponent('\\\\evil.example\\share\\x.png'),          // UNC (NTLM)
      'aioshot://ghim?file=' + encodeURIComponent('//evil.example/share/x.png'),
      'aioshot://ghim?file=' + encodeURIComponent('\\\\?\\C:\\Windows\\win.ini'),
      'aioshot://ghim?file=' + encodeURIComponent('C:\\Windows\\win.ini'),
      'aioshot://ghim?file=' + encodeURIComponent('C:\\Windows\\System32\\notepad.exe'),
      'aioshot://ghim?file=' + encodeURIComponent(path.join(anh, 'ghi-chu.txt')),         // trong thu muc nhung khong phai anh
      'aioshot://ghim?file=ghi-chu.txt',
      'aioshot://ghim?file=video.mp4',
      'aioshot://ghim?file=' + encodeURIComponent('a.png:luong-phu'),                       // luong du lieu phu NTFS
      'aioshot://ghim?file=' + encodeURIComponent('a.png\u0000.txt'),
      'aioshot://ghim?file=' + encodeURIComponent('a.png\n'),
      'aioshot://ghim?file=con',                                                            // thu muc, khong phai file
      'aioshot://ghim?file=khong-co.png',
      'aioshot://ghim?file=',
      'aioshot://ghim',
      'aioshot://ghim?file=a.png&file=B%20C.jpg',                                           // tham so lap
      'aioshot://ghim?file=a.png&them=1',                                                   // tham so la
      'aioshot://ghim?file=' + 'x'.repeat(5000),
      'aioshot://xoa?file=a.png', 'aioshot://delete', 'aioshot://gui?den=evil', 'aioshot://settings', 'aioshot://hotkey?phim=x',
      'aioshot://cai-dat', 'aioshot://thoat', 'aioshot://mo?url=https://evil.example', 'aioshot://frozen/1/2.jpg', 'aioshot://raw/1/2/0_0_9_9.png',
      'aioshot://dai/1/1.jpg', 'aioshot://cv/6161.jpg',
      'aioshot://chup?x=1', 'aioshot://chup?chu=a', 'aioshot://canvas?file=a.png', 'aioshot://khay#chup', 'aioshot://chup/xoa',
      'aioshot://chup@evil.example', 'aioshot://user:pw@chup', 'aioshot://chup:80', 'aioshot://%63hup', 'aioshot://chup%00',
      'aioshot://tim?chu=' + 'y'.repeat(500), 'aioshot://tim?chu=a%00b', 'aioshot://tim?chu=a%0Ab', 'aioshot://tim?q=x',
      'javascript:alert(1)', 'file:///C:/Windows/win.ini', 'http://evil.example/', 'aioshot', 'aioshot:', 'aioshot://', '', '   ', null, undefined, 42, {}, [],
      'aioshot://chup\nvaoday', 'aioshot://' + 'c'.repeat(3000),
    ]
    if (coLienKetThuMuc) doc.push('aioshot://ghim?file=' + encodeURIComponent('loi-thoat/bi-mat.png'))        // junction tro ra ngoai
    const nguHai = []
    for (const link of doc) {
      const truoc = m.goi.length
      let r
      try { r = m.xuLy(link) } catch (e) { r = { ok: false, loi: 'NEM ' + e.message } }
      if (m.goi.length !== truoc || (r && r.ok)) nguHai.push(String(link).slice(0, 80) + ' => ' + JSON.stringify(m.goi.slice(truoc)))
    }
    if (phaiTruot) { kiem('ban bo chot chan: link doc hai LOT LUOI (' + nguHai.length + ' link lot, vd ' + (nguHai[0] || '').slice(0, 70) + ')', nguHai.length > 0, 'khong link nao lot'); return }
    kiem(doc.length + ' link doc hai: 0 lenh duoc chay', nguHai.length === 0, nguHai.join(' ; '))
    kiem('khong link doc hai nao ra loi "NEM" (moi loi deu duoc nuot gon)', !m.nhatKy.some((x) => /NEM|LOI khi chay/.test(x)))
    kiem(coLienKetThuMuc ? 'junction tro ra ngoai thu muc anh bi chan' : '(bo qua: may nay khong tao duoc junction)', true)
    // file ben ngoai van nguyen ven
    kiem('file ngoai thu muc anh KHONG bi doi', fs.readFileSync(bi, 'utf8') === 'PNG-BI-MAT' && fs.readFileSync(path.join(ngoai, 'x.txt'), 'utf8') === 'x')
    kiem('file trong thu muc anh KHONG bi doi', fs.readFileSync(path.join(anh, 'a.png'), 'utf8') === 'PNG-A' && fs.readdirSync(anh).filter((x) => x !== 'loi-thoat').sort().join('|') === ['B C.jpg', 'a.png', 'con', 'ghi-chu.txt', 'video.mp4'].sort().join('|'), fs.readdirSync(anh).join(','))
  }
  await doc('moi', NGUON, false)

  console.log('[3] Gioi han tan suat: goi don dap thi bo')
  {
    const m = dung(NGUON)
    const kq = []
    for (let i = 0; i < 6; i++) { kq.push(m.lk.xuLy('aioshot://chup')); m.dongHo.t += 100 } // 6 lenh trong 0,5 giay
    kiem('6 lenh cach nhau 100 ms: chi lenh dau chay', kq[0].ok && kq.slice(1).every((r) => !r.ok && r.loi === 'qua-nhanh') && m.goi.length === 1, JSON.stringify(kq.map((r) => r.ok ? 'ok' : r.loi)))
    m.dongHo.t += 800
    kiem('cach 700 ms tro len thi chay lai', m.lk.xuLy('aioshot://canvas').ok)
    let ok = 0, nhieu = 0
    for (let i = 0; i < 30; i++) { m.dongHo.t += 800; const r = m.lk.xuLy('aioshot://khay'); if (r.ok) ok++; else if (r.loi === 'qua-nhieu') nhieu++ }
    kiem('chay deu moi 0,8 giay: toi da 10 lenh / 60 giay, phan con lai bi bo "qua-nhieu"', ok <= 10 && nhieu > 0 && ok + nhieu === 30, JSON.stringify({ ok, nhieu }))
    m.dongHo.t += 61 * 1000
    kiem('qua 60 giay thi nhan lai binh thuong', m.lk.xuLy('aioshot://chup').ok)
    const rac = dung(NGUON)
    for (let i = 0; i < 200; i++) rac.lk.xuLy('aioshot://xoa?x=' + i)
    kiem('200 link rac KHONG chiem suat cua link that (link rac khong tinh vao gioi han)', rac.lk.xuLy('aioshot://chup').ok)
  }

  console.log('[4] Co dong lenh = link (cung hang rao)')
  {
    const m = dung(NGUON)
    const ds = m.mod.tuArgv(['C:\\app.exe', '--chup', '--ghim=a.png', '--tim=hoa don', '--canvas', '--khay', '--chup-lai-vung', '--mo-canvas', '--x', 'aioshot://khay', 'rac', 42, '--chup=1', '--tim'])
    kiem('tuArgv doi co ra link, bo co la / co sai dang', JSON.stringify(ds) === JSON.stringify([
      'aioshot://chup', 'aioshot://ghim?file=a.png', 'aioshot://tim?chu=hoa%20don', 'aioshot://canvas', 'aioshot://khay', 'aioshot://chup-lai-vung', 'aioshot://khay', 'aioshot://tim']), JSON.stringify(ds))
    const r = m.xuLy(m.mod.tuArgv(['x', '--ghim=' + path.join(ngoai, 'bi-mat.png')])[0])
    kiem('--ghim=<file ngoai thu muc anh> cung bi chan (co dong lenh khong lach duoc hang rao)', r.ok === false && r.loi === 'ngoai-thu-muc-anh' && !m.goi.some((g) => g[0] === 'ghim'), JSON.stringify(r))
    const r2 = m.xuLy(m.mod.tuArgv(['x', '--ghim=a.png'])[0])
    kiem('--ghim=a.png (trong thu muc anh) chay', r2.ok === true && m.goi.some((g) => g[0] === 'ghim'))
  }

  console.log('[5] Cac link liet ke trong Cai dat deu hop le')
  {
    const m = dung(NGUON)
    const hong = []
    for (const { lenh } of m.mod.MAU_LIEN_KET) {
      const sach = lenh.replace('ten-anh.png', 'a.png')
      const r = m.xuLy(sach)
      if (!r.ok) hong.push(lenh + ' -> ' + r.loi)
    }
    kiem('6 link mau trong Cai dat deu chay (voi ten anh that)', hong.length === 0 && m.mod.MAU_LIEN_KET.length === 6, hong.join(' ; '))
    const settings = fs.readFileSync(path.join(ROOT, 'src', 'settings', 'settings.js'), 'utf8')
    kiem('(chi kiem chu) Cai dat liet ke du 6 link giong module', m.mod.MAU_LIEN_KET.every((x) => settings.includes("'" + x.lenh + "'")), '')
  }

  console.log('[6] Doi chung: bo hai chot chan "ngoai thu muc anh" trong lien-ket.js thi link doc hai PHAI lot')
  {
    const txt = fs.readFileSync(NGUON, 'utf8')
    const a = txt.replace(/\/\*KIEM-CHA-CHU\*\/ if \(!trongThuMuc\(path\.resolve\(goc\), ung\)\) return \{ loi: 'ngoai-thu-muc-anh' \}/, '')
    const b = a.replace(/\/\*KIEM-CHA-THAT\*\/ if \(!trongThuMuc\(gocThat, that\)\) return \{ loi: 'ngoai-thu-muc-anh' \}/, '')
    kiem('bai tim thay ca hai chot chan de go (neu khong thi bai doi chung vo nghia)', a !== txt && b !== a)
    const tam = mkTam('cu'); const f = path.join(tam, 'lien-ket.js'); fs.writeFileSync(f, b)
    await doc('cu', f, true)
  }

  for (const d of tamDaTao) { try { fs.rmSync(d, { recursive: true, force: true }) } catch (e) {} }
  console.log('\nKET QUA: ' + dat + ' DAT / ' + truot + ' TRUOT')
  process.exit(truot ? 1 : 0)
})()
