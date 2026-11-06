'use strict'

/* Man Cai dat — mot CTA chinh moi trang thai (bai hoc "4 nut lang nhang"):
   idle:      [keycaps hien tai]              [Doi phim…]
   recording: [Nhan to hop moi… (nhap nhay)]  [Huy]

   ☠️ 31/08: BO trang thai "pending + nut Luu". Anh Tien nhan to hop moi,
   man hinh hien keycaps MOI -> tuong xong, dong cua so — nhung phim chi nam
   trong bien `pending` cua renderer, CHUA he luu. Restart may xong mo ra
   thay "phim cu" -> anh bao "no tu doi phim". Nay nhan to hop la LUU NGAY. */

const t = (k) => window.i18n.t(k)

/* Keo cua so bang thanh tieu de (16/09): mousedown tren #tieu-de (tru vung nut .dieu-khien)
   -> gui delta TUYET DOI tu diem nhan (screenX/Y) -> main setBounds tu neo. */
;(() => {
  const bar = document.getElementById('tieu-de')
  if (!bar) return
  let keo = false, goc = { x: 0, y: 0 }
  bar.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('.dieu-khien')) return
    keo = true; goc = { x: e.screenX, y: e.screenY }
    bar.style.cursor = 'grabbing'
    window.settings.dragStart()
    e.preventDefault()
  })
  window.addEventListener('mousemove', (e) => { if (keo) window.settings.dragTo(e.screenX - goc.x, e.screenY - goc.y) })
  window.addEventListener('mouseup', () => { if (!keo) return; keo = false; bar.style.cursor = ''; window.settings.dragEnd() })
})()

const keysEl = document.getElementById('keys')
const btnDoi = document.getElementById('doi')
const btnHuyGhi = document.getElementById('huy-ghi')
const btnReset = document.getElementById('reset')
const msg = document.getElementById('msg')
const folderTen = document.getElementById('folder-ten')
const folderPath = document.getElementById('folder-path')
const btnPick = document.getElementById('pick-folder')
const btnOpen = document.getElementById('open-folder')
const msgFolder = document.getElementById('msg-folder')
const langBox = document.getElementById('lang')
const btnClose = document.getElementById('close')
const khayBox = document.getElementById('khay-kieu')
const khaySoAnhBox = document.getElementById('khay-so-anh')
const khayTuThuBox = document.getElementById('khay-tu-thu')
const quayBox = { quayMic: document.getElementById('quay-mic'), quayHienChuot: document.getElementById('quay-chuot'), quayHienPhim: document.getElementById('quay-phim') }
const lamMoBox = document.getElementById('lam-mo-kieu')
const thanhNutBox = document.getElementById('thanh-nut')      // 05/11: chon nut hien tren thanh cong cu man chup
const kinhLupBox = document.getElementById('kinh-lup-bat')    // 05/11: kinh lup khi chon vung
const moCungBox = document.getElementById('mo-cung')
const msgMoCung = document.getElementById('msg-mo-cung')
const loaiBox = document.getElementById('anh-loai')
const clBox = document.getElementById('anh-chat-luong')
const hangCL = document.getElementById('hang-chat-luong')
const verEl = document.getElementById('ver')

let isMac = false
let hotkey = ''      // phim dang dung (accelerator)
let state = 'idle'   // 'idle' | 'recording' | 'saving'

function dichGiaoDien() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'))
  })
  // 29/09: chu phu dua vao tooltip (anh: "text phu lam gon lai")
  btnReset.title = btnReset.ariaLabel = t('set.phim.macDinh')
  if (lamMoBox) lamMoBox.title = t('set.lamMo.goiY')
}

/* Tach accelerator thanh mang nhan phim de ve keycap. */
function tachPhim(accel) {
  if (!accel) return []
  return accel.split('+').map((x) => {
    if (x === 'CommandOrControl' || x === 'CmdOrCtrl') return isMac ? '⌘' : 'Ctrl'
    if (x === 'Cmd' || x === 'Command') return '⌘'
    if (x === 'Alt' || x === 'Option') return isMac ? '⌥' : 'Alt'
    if (x === 'Shift') return isMac ? '⇧' : 'Shift'
    if (x === 'Ctrl' || x === 'Control') return 'Ctrl'
    return x
  })
}

/* Ve khu keycaps theo trang thai. */
function veKeys() {
  keysEl.classList.toggle('ghi', state === 'recording')
  keysEl.textContent = ''
  if (state === 'recording') {
    keysEl.textContent = t('set.phim.nhanToHop')
    return
  }
  const phim = tachPhim(hotkey)
  phim.forEach((p, i) => {
    if (i > 0) {
      const cong = document.createElement('span')
      cong.className = 'keycap cong'
      cong.textContent = '+'
      keysEl.appendChild(cong)
    }
    const k = document.createElement('span')
    k.className = 'keycap'
    k.textContent = p
    keysEl.appendChild(k)
  })
}

function veNut() {
  btnDoi.hidden = state !== 'idle'
  btnHuyGhi.hidden = state !== 'recording'
}

function datTrangThai(s) {
  state = s
  veKeys()
  veNut()
}

function datFolder(p) {
  // 29/09: rut gon thu muc nguoi dung thanh ~ (C:\Users\ten\... -> ~\...); title van giu du duong dan
  // ☠️ .tm-duong co direction:rtl (cat DAU chuoi dai) -> '~' la ky tu trung tinh, bi day ra CUOI ("...\shotandsave\~").
  //    Dat dau LRM (U+200E, vo hinh) truoc chuoi de '~' giu dung cho.
  folderPath.textContent = String.fromCharCode(0x200e) + (p || '—').replace(/^([A-Za-z]:)?[\\/](Users|home)[\\/][^\\/]+/i, '~')
  folderPath.title = p || ''
  const ten = (p || '').split(/[\\/]/).filter(Boolean).pop() || '—'
  folderTen.textContent = ten
}

/* Danh dau nut dang chon trong mot nhom pill. */
function chonPill(box, v) {
  box.querySelectorAll('.chon-nut').forEach((b) => b.classList.toggle('chon', b.dataset.v === v))
}

function datAnh(loai, chatLuong) {
  chonPill(loaiBox, loai)
  chonPill(clBox, chatLuong)
  // PNG luon lossless -> lam mo hang chat luong (khong ap dung)
  hangCL.classList.toggle('mo', loai === 'png')
  // 06/11: nhan hang chat luong theo dinh dang (WebP co thang rieng, "Toi da" la lossless)
  const nhan = document.getElementById('nhan-chat-luong')
  if (nhan) nhan.textContent = t(loai === 'webp' ? 'set.anh.chatLuongWebp' : 'set.anh.chatLuong')
  hangCL.title = loai === 'webp' ? t('set.anh.webpLuuY') : ''
}

/* 06/11: tu dat ten file theo noi dung anh (mac dinh TAT) */
const tenTuDatBox = document.getElementById('ten-tu-dat')
const tenMauEl = document.getElementById('ten-mau')
const tenViDuEl = document.getElementById('ten-vi-du')
const hangTenMau = document.getElementById('hang-ten-mau')
function datTen(s) {
  if (!tenTuDatBox) return
  chonPill(tenTuDatBox, s.tuDatTen ? '1' : '0')
  hangTenMau.classList.toggle('mo', !s.tuDatTen)
  if (document.activeElement !== tenMauEl) tenMauEl.value = s.tenMau || ''
  if (s.tenViDu) tenViDuEl.textContent = t('set.ten.xemTruoc') + ': ' + s.tenViDu
}

/* 04/11: ve cong tac Mo cung Windows theo trang thai THAT doc tu Windows. Khong ho tro (ban nguon, Mac) thi an ca nhom. */
function datMoCung(m) {
  if (!moCungBox || !m) return
  document.getElementById('hang-mo-cung').hidden = !m.hoTro // chi an hang nay; nhom Ung dung con hang Cap nhat
  chonPill(moCungBox, m.bat && !m.biChan ? '1' : '0')
  msgMoCung.textContent = m.biChan ? window.i18n.t('set.moCung.biChan') : ''
}

async function load() {
  dichGiaoDien()
  const s = await window.settings.get()
  isMac = s.isMac
  hotkey = s.hotkey
  datFolder(s.saveFolder)
  datAnh(s.anhLoai, s.anhChatLuong)
  datTen(s)
  chonPill(khayBox, s.khayKieu)
  chonPill(khaySoAnhBox, String(typeof s.khaySoAnh === 'number' ? s.khaySoAnh : 5))
  if (khayTuThuBox) chonPill(khayTuThuBox, String(s.khayTuThu === 0 ? 0 : (s.khayTuThu || 5)))   // 0 = Khong thu
  if (lamMoBox) chonPill(lamMoBox, s.lamMoKieu || 'mosaic')
  for (const k of Object.keys(quayBox)) if (quayBox[k]) chonPill(quayBox[k], s[k] ? '1' : '0')
  if (thanhNutBox) thanhNutBox.querySelectorAll('.nut-chip').forEach((b) => b.classList.toggle('chon', !(s.anNut || []).includes(b.dataset.k)))
  if (kinhLupBox) chonPill(kinhLupBox, s.kinhLup === false ? '0' : '1')
  datMoCung(s.moCung)
  if (s.version && verEl) verEl.textContent = 'AiO Shot & Save · v' + s.version
  langBox.querySelectorAll('.lang-nut').forEach((b) => {
    b.classList.toggle('chon', b.dataset.lang === s.lang)
  })
  datTrangThai('idle')
}
load()

/* ── Ngon ngu + dong ──────────────────────────────────────────────────── */
langBox.addEventListener('click', async (e) => {
  const b = e.target.closest('.lang-nut')
  if (!b || b.classList.contains('chon')) return
  await window.settings.setLang(b.dataset.lang) // main reload cua so -> load() lai
})
btnClose.addEventListener('click', () => window.settings.close())

/* ── Dinh dang / chat luong anh ───────────────────────────────────────── */
loaiBox.addEventListener('click', async (e) => {
  const b = e.target.closest('.chon-nut')
  if (!b || b.classList.contains('chon')) return
  const cl = clBox.querySelector('.chon-nut.chon')
  datAnh(b.dataset.v, cl ? cl.dataset.v : 'cao')
  await window.settings.setAnh({ anhLoai: b.dataset.v })
})
clBox.addEventListener('click', async (e) => {
  const b = e.target.closest('.chon-nut')
  if (!b || b.classList.contains('chon')) return
  chonPill(clBox, b.dataset.v)
  await window.settings.setAnh({ anhChatLuong: b.dataset.v })
})

/* ── Ten file tu dat (06/11) ──────────────────────────────────────────── */
if (tenTuDatBox) {
  tenTuDatBox.addEventListener('click', async (e) => {
    const b = e.target.closest('.chon-nut')
    if (!b || b.classList.contains('chon')) return
    datTen(Object.assign(await window.settings.setTen({ tuDatTen: b.dataset.v === '1' }), {}))
  })
  const luuMau = async () => { datTen(await window.settings.setTen({ tenMau: tenMauEl.value })) }
  tenMauEl.addEventListener('change', luuMau)
  tenMauEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tenMauEl.blur() } })
  const nutMD = document.getElementById('ten-mau-mac-dinh')
  nutMD.title = t('set.ten.macDinh')
  nutMD.addEventListener('click', async () => { datTen(await window.settings.setTen({ tenMau: '' })) })
}

/* ── Kieu khay + So anh nap vao khay ─────────────────────────────────── */
khayBox.addEventListener('click', async (e) => {
  const b = e.target.closest('.chon-nut')
  if (!b || b.classList.contains('chon')) return
  chonPill(khayBox, b.dataset.v)
  await window.settings.setKhay(b.dataset.v)
})
khaySoAnhBox.addEventListener('click', async (e) => {
  const b = e.target.closest('.chon-nut')
  if (!b || b.classList.contains('chon')) return
  chonPill(khaySoAnhBox, b.dataset.v)
  await window.settings.setKhaySoAnh(Number(b.dataset.v) || 0)
})
// 01/10: so giay khay cho roi tu thu ve nut tron o goc (5 / 10 / 15)
if (khayTuThuBox) {
  khayTuThuBox.addEventListener('click', async (e) => {
    const b = e.target.closest('.chon-nut')
    if (!b || b.classList.contains('chon')) return
    chonPill(khayTuThuBox, b.dataset.v)
    const g = Number(b.dataset.v)
    await window.settings.setKhayTuThu(Number.isFinite(g) ? g : 5)
  })
}

/* ── Quay video (05/11): micro + hien cu bam chuot / phim ─────────────── */
for (const k of Object.keys(quayBox)) {
  const box = quayBox[k]
  if (!box) continue
  box.addEventListener('click', async (e) => {
    const b = e.target.closest('.chon-nut')
    if (!b || b.classList.contains('chon')) return
    chonPill(box, b.dataset.v)
    await window.settings.setQuay({ [k]: b.dataset.v === '1' })
  })
}

/* ── Kieu lam mo ──────────────────────────────────────────────────────── */
if (lamMoBox) {
  lamMoBox.addEventListener('click', async (e) => {
    const b = e.target.closest('.chon-nut')
    if (!b || b.classList.contains('chon')) return
    chonPill(lamMoBox, b.dataset.v)
    await window.settings.setLamMo(b.dataset.v)
  })
}

/* ── Thanh cong cu: chon nut hien (chip sang = hien, chip toi = an; phim tat van chay) ── */
if (thanhNutBox) {
  thanhNutBox.querySelectorAll('.nut-chip').forEach((b) => { b.title = b.textContent; b.setAttribute('aria-pressed', 'true') })
  thanhNutBox.addEventListener('click', async (e) => {
    const b = e.target.closest('.nut-chip')
    if (!b) return
    b.classList.toggle('chon')
    b.setAttribute('aria-pressed', String(b.classList.contains('chon')))
    const an = [...thanhNutBox.querySelectorAll('.nut-chip:not(.chon)')].map((x) => x.dataset.k)
    await window.settings.setAnNut(an)
  })
}
if (kinhLupBox) {
  kinhLupBox.addEventListener('click', async (e) => {
    const b = e.target.closest('.chon-nut')
    if (!b || b.classList.contains('chon')) return
    chonPill(kinhLupBox, b.dataset.v)
    await window.settings.setKinhLup(b.dataset.v === '1')
  })
}

/* ── Mo cung Windows ──────────────────────────────────────────────────── */
if (moCungBox) {
  moCungBox.addEventListener('click', async (e) => {
    const b = e.target.closest('.chon-nut')
    if (!b || b.classList.contains('chon')) return
    datMoCung(await window.settings.setMoCung(b.dataset.v === '1'))
  })
}

/* ── Ghi phim ─────────────────────────────────────────────────────────── */
const CODE_PUNCT = {
  Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']',
  Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/',
}
function mainKey(e) {
  const c = e.code
  let m
  if ((m = /^Key([A-Z])$/.exec(c))) return m[1]
  if ((m = /^Digit([0-9])$/.exec(c))) return m[1]
  if ((m = /^Numpad([0-9])$/.exec(c))) return 'num' + m[1]
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(c)) return c
  if (c === 'Space') return 'Space'
  if (c === 'PrintScreen') return 'PrintScreen'
  if (CODE_PUNCT[c]) return CODE_PUNCT[c]
  return null
}

btnDoi.addEventListener('click', () => {
  msg.textContent = ''
  msg.className = 'msg'
  datTrangThai('recording')
})

btnHuyGhi.addEventListener('click', () => {
  msg.textContent = ''
  msg.className = 'msg'
  datTrangThai('idle')
})

/* Nhan to hop hop le la LUU NGAY — khong co buoc "Luu" de quen (vap 31/08). */
window.addEventListener('keydown', async (e) => {
  if (state !== 'recording') return
  e.preventDefault()
  const mods = []
  if (e.ctrlKey) mods.push('Ctrl')
  if (e.metaKey && isMac) mods.push('Cmd')
  if (e.altKey) mods.push('Alt')
  if (e.shiftKey) mods.push('Shift')
  const key = mainKey(e)
  if (!key) return // moi bam modifier — doi phim chinh
  if (mods.length === 0) {
    msg.textContent = isMac ? t('set.phim.canModifierMac') : t('set.phim.canModifier')
    msg.className = 'msg err'
    return
  }
  datTrangThai('saving') // chan keydown tiep theo trong luc cho main tra loi
  const r = await window.settings.setHotkey(mods.concat(key).join('+'))
  hotkey = r.hotkey
  datTrangThai('idle')
  baoKetQua(r.ok)
})

btnReset.addEventListener('click', async () => {
  const r = await window.settings.reset()
  hotkey = r.hotkey
  datTrangThai('idle')
  baoKetQua(r.ok)
})

/* Thanh cong thi IM LANG bang chu — keycaps moi da hien roi, chi nhay XANH
   mot nhip cho nhin mau la biet (anh Tien 31/08: bo dong "Saved — ready to
   use"). Chu chi danh cho THAT BAI (phim bi app khac giu). */
function baoKetQua(ok) {
  if (ok) {
    msg.textContent = ''
    msg.className = 'msg'
    keysEl.classList.remove('vua-luu')
    void keysEl.offsetWidth // reset animation neu luu hai lan lien tiep
    keysEl.classList.add('vua-luu')
  } else {
    msg.textContent = t('set.phim.biGiu')
    msg.className = 'msg err'
  }
}

/* ── Thu muc ──────────────────────────────────────────────────────────── */
btnPick.addEventListener('click', async () => {
  const r = await window.settings.pickFolder()
  datFolder(r.folder)
  if (!r.huy) {
    msgFolder.textContent = t('set.thuMuc.daDoi')
    msgFolder.className = 'msg ok'
    msgFolder.style.textAlign = 'left'
  }
})
btnOpen.addEventListener('click', () => window.settings.openFolder())

/* ── Ban quyen (24/09) ────────────────────────────────────────────────────
   Chua kich hoat: o nhap ma + Kich hoat + Mua. Da kich hoat: ma da che + han cap nhat + Huy (bam 2 lan).
   Het dung thu: the vien cam, mo Cai dat la thay ngay (main mo cua so khi bam chup bi khoa). */
;(() => {
  const the = document.getElementById('the-bq')
  const moTa = document.getElementById('bq-mo-ta'), tieuDe = document.getElementById('bq-tieu-de')
  const khoiNhap = document.getElementById('bq-nhap'), khoiCo = document.getElementById('bq-co')
  const o = document.getElementById('bq-ma'), nutKH = document.getElementById('bq-kich-hoat')
  const nutMua = document.getElementById('bq-mua'), nutHuy = document.getElementById('bq-huy'), msg = document.getElementById('bq-msg')
  if (!the || !window.banQuyen) return
  o.placeholder = t(o.dataset.i18nPh)
  const ngay = (iso) => new Date(iso).toLocaleDateString(window.i18n.lang === 'en' ? 'en-US' : 'vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
  const bao = (chu, kieu) => { msg.textContent = chu || ''; msg.className = 'msg' + (kieu ? ' ' + kieu : '') }

  // 29/09 (huong B): dung thu = tieu de "Dung thu" + "Con n / 14 ngay" ben phai + thanh ngay cam; trang thai khac an 2 thu nay
  const ngayEl = document.getElementById('bq-ngay'), tienDo = document.getElementById('bq-tien-do'), tienDoI = document.getElementById('bq-tien-do-i')

  function ve(s) {
    if (!s) { the.hidden = true; return }
    const co = s.loai === 'da-kich-hoat'
    khoiNhap.hidden = co; khoiCo.hidden = !co; nutMua.hidden = co
    the.classList.toggle('het', s.loai === 'het-han-thu')
    const dungThu = !co && !s.biThuHoi && s.lyDoMatMa !== 'may-bi-go' && s.loai === 'dung-thu'
    ngayEl.textContent = dungThu ? t('bq.conNgay').replace('{n}', s.ngayConLai) : ''
    tienDo.hidden = !dungThu
    if (dungThu) tienDoI.style.width = Math.max(0, Math.min(100, (s.ngayConLai / 14) * 100)) + '%'
    if (co) {
      tieuDe.textContent = t('bq.daKichHoat') + ' · ' + s.maHienThi
      // [28/09] gia $14.99 cap nhat TRON DOI: ma KHONG co ngay het han = tron doi (truoc: bao nham 'da het han')
      moTa.textContent = s.hetQuyenCapNhat || s.khongGiuMay ? t('bq.hetCapNhat') : !s.hetHan ? t('bq.tronDoi') : t('bq.capNhatDen').replace('{ngay}', ngay(s.hetHan))
      nutHuy.hidden = !!s.khongGiuMay            // ma het han khong giu cho may nao -> khong co gi de huy
    } else if (s.biThuHoi) {
      tieuDe.textContent = t('bq.thuHoi'); moTa.textContent = t('bq.thuHoiMoTa')
    } else if (s.lyDoMatMa === 'may-bi-go') {
      tieuDe.textContent = t('bq.biGo'); moTa.textContent = t('bq.biGoMoTa')
    } else if (s.loai === 'dung-thu') {
      tieuDe.textContent = t('bq.dungThuTieuDe'); moTa.textContent = '' // o nhap ma ngay duoi da noi viec can lam
    } else {
      tieuDe.textContent = t('bq.hetThu'); moTa.textContent = t('bq.hetThuMoTa')
    }
  }

  async function kichHoat() {
    nutKH.disabled = true; nutKH.textContent = t('bq.dangKichHoat'); bao('')
    try {
      const r = await window.banQuyen.kichHoat(o.value)
      ve(r.trangThai)
      if (r.ok) { o.value = ''; bao(r.canhBao === 'ma-het-han' ? t('bq.okHetHan') : t('bq.ok'), 'ok') }
      else bao(t('bq.loi.' + r.loi), 'err')
    } catch (e) { bao(t('bq.loi.mat-mang'), 'err') }
    nutKH.disabled = false; nutKH.textContent = t('bq.kichHoat')
  }
  nutKH.addEventListener('click', kichHoat)
  o.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); kichHoat() } })
  nutMua.addEventListener('click', () => window.banQuyen.mua())

  // Huy: bam lan 1 doi chu "Bam lan nua de huy" 3 giay (khong hop thoai), bam lan 2 moi huy that
  let choXacNhan = null
  nutHuy.addEventListener('click', async () => {
    if (!choXacNhan) {
      nutHuy.textContent = t('bq.huyXacNhan'); nutHuy.classList.remove('phu')
      choXacNhan = setTimeout(() => { choXacNhan = null; nutHuy.textContent = t('bq.huy'); nutHuy.classList.add('phu') }, 3000)
      return
    }
    clearTimeout(choXacNhan); choXacNhan = null
    nutHuy.disabled = true; nutHuy.textContent = t('bq.dangHuy'); bao('')
    try {
      const r = await window.banQuyen.huy()
      ve(r.trangThai)
      bao(r.ok ? t('bq.daHuy') : t('bq.loi.' + r.loi), r.ok ? 'ok' : 'err')
    } catch (e) { bao(t('bq.loi.mat-mang'), 'err') }
    nutHuy.disabled = false; nutHuy.textContent = t('bq.huy'); nutHuy.classList.add('phu')
  })

  window.banQuyen.get().then((s) => {
    ve(s)
    if (s && s.loai === 'het-han-thu') o.focus()   // vua bi khoa chup -> dat con tro san vao o nhap ma
  })
})()

/* ── Cap nhat phan mem (05/11) ───────────────────────────────────────────
   Tu chay ngam (main.js); o day chi hien dong trang thai + nut Tai ve (khi co ban moi) + Kiem tra ngay.
   Loi mang / JSON hong KHONG hien nhu loi: chi noi 'chua kiem tra duoc' khi nguoi dung tu bam nut. */
;(() => {
  const dong = document.getElementById('cn-dong'), ghiChu = document.getElementById('cn-ghi-chu')
  const nutTai = document.getElementById('cn-tai'), nutKiem = document.getElementById('cn-kiem')
  if (!dong || !window.capNhat) return
  const lop = window.i18n.lang === 'en' ? 'en' : 'vi'
  const ve = (s, thongBao) => {
    if (s && s.coBanMoi) {
      dong.textContent = t('cn.coBanMoi').replace('{v}', s.phienBan)
      ghiChu.textContent = (s.ghiChu && (s.ghiChu[lop] || s.ghiChu[lop === 'en' ? 'vi' : 'en'])) || ''
      nutTai.hidden = !s.link
    } else {
      dong.textContent = thongBao || t('cn.dangDung').replace('{v}', s ? s.hienTai : '')
      ghiChu.textContent = ''
      nutTai.hidden = true
    }
  }
  window.capNhat.get().then((s) => ve(s))
  nutTai.addEventListener('click', () => window.capNhat.taiVe())
  nutKiem.addEventListener('click', async () => {
    nutKiem.disabled = true; dong.textContent = t('cn.dangKiem'); ghiChu.textContent = ''; nutTai.hidden = true
    try {
      const r = await window.capNhat.kiemNgay()
      const s = r.trangThai
      ve(s, r.ketQua === 'moi-nhat' ? t('cn.moiNhat').replace('{v}', s.hienTai) : r.ketQua === 'ban' ? t('cn.dangBan') : r.ketQua === 'loi' ? t('cn.khongKiem') : null)
    } catch (e) { dong.textContent = t('cn.khongKiem') }
    nutKiem.disabled = false
  })
})()
