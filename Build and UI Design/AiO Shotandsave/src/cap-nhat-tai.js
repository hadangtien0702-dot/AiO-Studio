'use strict'
/* Nut "Cap nhat ngay" tren Windows (23/11/2026). Anh Tien: "khi co ban cap nhat moi... hien chu update now... bam vao chi can cho
   vai giay la ban cap nhat moi no se tu dong update ve may", va chon "CHI KHACH CO MA moi tai duoc".

   Luong: ban-moi.json (web, co sha256Win) noi co ban moi -> khach bam Cap nhat ngay ->
     1. gui ma ban quyen dang dung len cong `aio-mail.vercel.app/api/tai-ban-moi` (may chu hoi Polar ma co that, roi xin link
        tai bo cai cua chinh khach do; link Polar ky, song ~1 gio)
     2. ten file phai chua dung so phien ban moi; sha256 Polar bao phai = sha256Win tren web (HAI nguon phai khop)
     3. tai ve thu muc tam, vua tai vua bam sha256, bao % ; xong so sha256 lan nua tren file that
     4. chay bo cai im lang `/S --force-run` (bo cai NSIS mot cu bam cua electron-builder: dong app cu, cai de, mo lai app),
        app tu thoat de bo cai thay file.
   Khong co ma / ban-moi.json thieu sha256Win / Mac -> khong tu cai, nut cu "Tai ve" mo trang khach Polar.
   Anh, video cua khach khong nam trong thu muc cai (tu 0.4.6) nen cai de khong dung toi. Ma ban quyen nam o userData, giu nguyen.
   Module thuan (khong require electron): main.js truyen fetch, fs, chay bo cai, thoat vao de bai do chay voi may chu gia. */

const CONG_TAI = 'https://aio-mail.vercel.app/api/tai-ban-moi'
const TOI_DA_BYTE = 400 * 1024 * 1024
const HET_GIO_CONG_MS = 20 * 1000
const HET_GIO_KHONG_NHAN_MS = 60 * 1000 // tai ma 60 giay khong nhan them byte nao thi bo

/**
 * @param {object} o
 *  fetch(url,opt) -> Response (co body.getReader())   layMa() -> {key, activationId} | null
 *  banMoi() -> {phienBan, sha256Win} | null            thuMuc -> thu muc tam
 *  fs, path, crypto                                    chayBoCai(file) -> chay bo cai tach roi
 *  thoat()                                              tienDo(st) -> bao giao dien    ghiLog(s)
 */
function taoTaiBanMoi(o) {
  const cong = o.cong || CONG_TAI
  const log = (m) => { try { o.ghiLog && o.ghiLog('cap-nhat-tai: ' + m) } catch (e) {} }
  let st = { buoc: 'roi', phanTram: 0, loi: null }
  const bao = (moi) => { st = Object.assign({}, st, moi); try { o.tienDo && o.tienDo(st) } catch (e) {} }
  let dangChay = null

  function coTheTuCai() {
    const b = o.banMoi && o.banMoi()
    return !!(b && /^[0-9a-f]{64}$/.test(b.sha256Win || '') && o.layMa && o.layMa())
  }

  async function voiHetGio(p, ms, ten) {
    let t; const het = new Promise((_, rj) => { t = setTimeout(() => rj(new Error(ten)), ms) })
    try { return await Promise.race([p, het]) } finally { clearTimeout(t) }
  }

  async function chay() {
    const b = o.banMoi && o.banMoi()
    if (!b || !/^[0-9a-f]{64}$/.test(b.sha256Win || '')) throw new Error('khong-tu-cai')
    const ma = o.layMa && o.layMa()
    if (!ma || !ma.key) throw new Error('chua-co-ma')

    bao({ buoc: 'xin-link', phanTram: 0, loi: null })
    const r = await voiHetGio(o.fetch(cong, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, cache: 'no-store',
      body: JSON.stringify(Object.assign({ key: ma.key }, ma.activationId ? { activation_id: ma.activationId } : {})),
    }), o.hetGioCongMs || HET_GIO_CONG_MS, 'het-gio-cong')
    let j = null; try { j = await r.json() } catch (e) {}
    if (r.status === 403) throw new Error('ma-khong-hop-le')
    if (r.status !== 200 || !j || typeof j.url !== 'string' || !/^https:/i.test(j.url)) throw new Error('cong-' + r.status + (j && j.loi ? '-' + j.loi : ''))
    const ten = String(j.ten || '')
    if (!/\.exe$/i.test(ten) || !ten.includes(b.phienBan)) throw new Error('lech-ban') // Polar chua co file cua ban moi
    if (j.sha256 && String(j.sha256).toLowerCase() !== b.sha256Win) throw new Error('lech-ban')
    if (typeof j.kichThuoc === 'number' && j.kichThuoc > TOI_DA_BYTE) throw new Error('qua-to')

    bao({ buoc: 'tai', phanTram: 0 })
    const file = o.path.join(o.thuMuc, 'AiO-Shot-and-Save-Setup-' + b.phienBan + '.exe')
    const tam = file + '.dang-tai'
    try { o.fs.unlinkSync(tam) } catch (e) {}
    const res = await voiHetGio(o.fetch(j.url, { cache: 'no-store' }), HET_GIO_CONG_MS, 'het-gio-tai')
    if (res.status !== 200 || !res.body) throw new Error('tai-' + res.status)
    const tong = Number(res.headers && res.headers.get && res.headers.get('content-length')) || j.kichThuoc || 0
    const hash = o.crypto.createHash('sha256')
    const fd = o.fs.openSync(tam, 'w')
    let da = 0, phanTramTruoc = -1
    try {
      const doc = res.body.getReader()
      for (;;) {
        const { done, value } = await voiHetGio(doc.read(), o.hetGioNhanMs || HET_GIO_KHONG_NHAN_MS, 'tai-dung-giua-chung')
        if (done) break
        const buf = Buffer.from(value.buffer, value.byteOffset, value.byteLength)
        da += buf.length
        if (da > TOI_DA_BYTE) throw new Error('qua-to')
        hash.update(buf); o.fs.writeSync(fd, buf)
        const pt = tong ? Math.min(99, Math.floor(da * 100 / tong)) : 0
        if (pt !== phanTramTruoc) { phanTramTruoc = pt; bao({ phanTram: pt }) }
      }
      o.fs.fsyncSync(fd)
    } finally { o.fs.closeSync(fd) }

    bao({ buoc: 'kiem', phanTram: 100 })
    const sha = hash.digest('hex')
    if (sha !== b.sha256Win) { try { o.fs.unlinkSync(tam) } catch (e) {} throw new Error('file-hong') }
    // bam lai tren file da ghi (khong tin buffer trong RAM): file tren dia moi la thu se duoc chay
    const sha2 = o.crypto.createHash('sha256').update(o.fs.readFileSync(tam)).digest('hex')
    if (sha2 !== b.sha256Win) { try { o.fs.unlinkSync(tam) } catch (e) {} throw new Error('file-hong') }
    try { o.fs.unlinkSync(file) } catch (e) {}
    o.fs.renameSync(tam, file)
    log('tai xong ' + o.path.basename(file) + ' ' + da + ' byte, sha256 khop')

    bao({ buoc: 'cai' })
    o.chayBoCai(file)
    log('da chay bo cai, app thoat de cai')
    o.thoat()
  }

  /** Bat dau (bam nut). Dang chay thi tra ve luot dang chay. Ket qua: {ok:true} | {ok:false, loi} */
  function capNhatNgay() {
    if (dangChay) return dangChay
    dangChay = chay().then(() => ({ ok: true }), (e) => {
      const loi = (e && e.message) || String(e)
      log('dung: ' + loi)
      bao({ buoc: 'loi', loi })
      return { ok: false, loi }
    }).finally(() => { dangChay = null })
    return dangChay
  }

  return { capNhatNgay, coTheTuCai, trangThai: () => st }
}

module.exports = { taoTaiBanMoi, CONG_TAI }
