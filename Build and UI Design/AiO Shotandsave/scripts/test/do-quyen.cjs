'use strict'
/* Do hop thoai THIEU QUYEN GHI MAN HINH tren macOS (src/quyen-man-hinh.js) — chay: npm run test:quyen
   Node thuan, khong can Electron, khong bat cua so: systemPreferences / dialog / shell deu la do GIA.
   04/10: anh bam Option+1 tren Mac, overlay chop roi mat, khong co gi bao (35 lan `Failed to get sources`). */
const path = require('path')
const ROOT = path.resolve(__dirname, '..', '..')
const { taoKiemQuyen, URL_QUYEN } = require(path.join(ROOT, 'src', 'quyen-man-hinh.js'))
const i18n = require(path.join(ROOT, 'src', 'i18n.js'))

let dat = 0, truot = 0
const kiem = (ten, ok, ct) => { if (ok) { dat++; console.log('  DAT  ' + ten) } else { truot++; console.log('  TRUOT ' + ten + (ct ? '  -> ' + ct : '')) } }

/** May gia: quyen = gia tri getMediaAccessStatus tra (hoac 'NEM' = nem loi); bam = nut nguoi dung bam trong hop thoai. */
function may({ platform = 'darwin', quyen = 'denied', bam = 0, treo = false } = {}) {
  const m = { hopThoai: [], mo: [], log: [], tha: null }
  m.k = taoKiemQuyen({
    platform,
    systemPreferences: { getMediaAccessStatus: (loai) => { m.loai = loai; if (quyen === 'NEM') throw new Error('x'); return quyen } },
    dialog: { showMessageBox: (o) => { m.hopThoai.push(o); return treo ? new Promise((r) => { m.tha = () => r({ response: bam }) }) : Promise.resolve({ response: bam }) } },
    shell: { openExternal: async (u) => { m.mo.push(u) } },
    T: (k) => i18n.t('vi', k), ghiLog: (x) => m.log.push(x),
  })
  return m
}

;(async () => {
  console.log('\n[1] Windows: khong bao gio chan, khong hien gi')
  {
    const m = may({ platform: 'win32', quyen: 'denied' })
    kiem('khong chan truoc khi chup', m.k.chanTruocKhiChup() === false)
    kiem('chup hong: tra false (de thong bao cu lo)', m.k.baoKhiChupHong() === false)
    kiem('0 hop thoai, khong hoi macOS', m.hopThoai.length === 0 && m.loai === undefined)
  }

  console.log('\n[2] Mac DA co quyen (doi chung)')
  {
    const m = may({ quyen: 'granted' })
    kiem('khong chan', m.k.chanTruocKhiChup() === false)
    kiem('chup hong vi ly do khac: tra false, 0 hop thoai', m.k.baoKhiChupHong() === false && m.hopThoai.length === 0)
    kiem('hoi dung loai quyen "screen"', m.loai === 'screen')
  }

  console.log('\n[3] Mac BI TU CHOI quyen (ca cua anh 04/10)')
  for (const q of ['denied', 'restricted']) {
    const m = may({ quyen: q, bam: 0 })
    const chan = m.k.chanTruocKhiChup()
    await m.k.dangHoi()
    kiem(q + ': CHAN luot chup (khong chop overlay nua)', chan === true)
    kiem(q + ': hien dung 1 hop thoai, co tieu de + noi dung + 2 nut', m.hopThoai.length === 1 && !!m.hopThoai[0].message && !!m.hopThoai[0].detail && m.hopThoai[0].buttons.length === 2, JSON.stringify(m.hopThoai[0]))
    kiem(q + ': bam nut dau -> mo dung trang quyen Ghi man hinh', m.mo.length === 1 && m.mo[0] === URL_QUYEN && m.mo[0].includes('Privacy_ScreenCapture'), JSON.stringify(m.mo))
    kiem(q + ': co dong nhat ky', m.log.some((x) => x.includes('CHUA CO')), JSON.stringify(m.log))
  }
  {
    const m = may({ quyen: 'denied', bam: 1 })
    m.k.chanTruocKhiChup(); await m.k.dangHoi()
    kiem('bam "De sau": KHONG mo Cai dat he thong', m.hopThoai.length === 1 && m.mo.length === 0)
  }

  console.log('\n[4] Mac chua hoi quyen lan nao / khong doc duoc trang thai')
  for (const q of ['not-determined', 'unknown', 'NEM']) {
    const m = may({ quyen: q })
    kiem(q + ': KHONG chan truoc (de macOS tu hoi lan dau)', m.k.chanTruocKhiChup() === false && m.hopThoai.length === 0)
    const r = m.k.baoKhiChupHong(); await m.k.dangHoi()
    kiem(q + ': chup HONG thi hien hop thoai (khong im lang)', r === true && m.hopThoai.length === 1)
  }

  console.log('\n[5] Bam chup lien tuc khi hop thoai dang mo: chi 1 hop thoai')
  {
    const m = may({ quyen: 'denied', treo: true })
    for (let i = 0; i < 12; i++) { m.k.chanTruocKhiChup(); m.k.baoKhiChupHong() }
    kiem('24 lan goi -> 1 hop thoai', m.hopThoai.length === 1, String(m.hopThoai.length))
    m.tha(); await m.k.dangHoi(); await null
    m.k.chanTruocKhiChup()
    kiem('dong hop thoai roi bam lai -> hop thoai moi', m.hopThoai.length === 2, String(m.hopThoai.length))
    m.tha(); await m.k.dangHoi()
  }

  console.log('\n[6] Hop thoai nem loi: khong vang, lan sau van bao duoc')
  {
    const m = may({ quyen: 'denied' })
    let lan = 0
    const k = taoKiemQuyen({ platform: 'darwin', systemPreferences: { getMediaAccessStatus: () => 'denied' }, dialog: { showMessageBox: async () => { lan++; if (lan === 1) throw new Error('no window') ; return { response: 1 } } }, shell: { openExternal: async () => {} }, T: (x) => x, ghiLog: (x) => m.log.push(x) })
    k.chanTruocKhiChup(); await k.dangHoi()
    k.chanTruocKhiChup(); await k.dangHoi()
    kiem('lan 1 loi co ghi nhat ky, lan 2 van hien', lan === 2 && m.log.some((x) => x.includes('LOI hop thoai')), JSON.stringify(m.log))
  }

  console.log('\n[7] Chu nguoi dung thay: du VI + EN, khong gach ngang dai')
  for (const key of ['quyen.tieuDe', 'quyen.noiDung', 'quyen.moCaiDat', 'quyen.deSau']) {
    const vi = i18n.t('vi', key), en = i18n.t('en', key)
    const gach = String.fromCharCode(0x2014)
    kiem(key + ': co ca 2 ngon ngu, khac nhau, khong co gach dai', !!vi && !!en && vi !== key && en !== key && vi !== en && !vi.includes(gach) && !en.includes(gach), JSON.stringify({ vi, en }))
  }

  console.log(`\nKET QUA: ${dat} DAT / ${truot} TRUOT`)
  process.exit(truot ? 1 : 0)
})()
