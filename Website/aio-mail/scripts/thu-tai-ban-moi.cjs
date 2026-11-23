// Bai thu cong tai ban moi (api/tai-ban-moi.js) voi Polar GIA, khong mang. Chay: node scripts/thu-tai-ban-moi.cjs
'use strict'
const { taoXuLy, QUYEN_MA } = require('../api/tai-ban-moi.js')
const { Readable } = require('node:stream')
let dat = 0, truot = 0
const kiem = (ten, dk, chiTiet) => { if (dk) dat++; else { truot++; console.log('TRUOT', ten, chiTiet === undefined ? '' : JSON.stringify(chiTiet)) } }

const QUYEN = [...QUYEN_MA][0]
function polarGia(o = {}) {
  const goi = []
  const fetch = async (url, opt = {}) => {
    goi.push({ url, opt })
    const j = (s, b) => ({ status: s, json: async () => b })
    if (url.endsWith('/license-keys/validate')) {
      const b = JSON.parse(opt.body)
      if (o.validateLoi) return j(o.validateLoi, { detail: 'x' })
      if (b.key !== 'AIOSS-THAT') return j(404, { detail: 'not found' })
      if (o.canAct && b.activation_id !== 'act-1') return j(404, { detail: 'activation' })
      return j(200, { status: o.trangThai || 'granted', benefit_id: o.quyen || QUYEN, customer_id: 'cus-1' })
    }
    if (url.endsWith('/customer-sessions/')) {
      if (opt.headers.Authorization !== 'Bearer tok') return j(401, {})
      return j(201, { token: 'phien' })
    }
    if (url.includes('/customer-portal/downloadables/')) {
      if (opt.headers.Authorization !== 'Bearer phien') return j(401, {})
      return j(200, { items: o.files || [
        { file: { name: 'AiO-Shot-and-Save-Setup-0.11.2.exe', size: 96000000, checksum_sha256_hex: 'ab'.repeat(32), last_modified_at: '2026-11-23T05:00:00Z', download: { url: 'https://s3/gia/0.11.2', expires_at: 'x' } } },
        { file: { name: 'AiO-Shot-and-Save-0.11.2.dmg', size: 1, checksum_sha256_hex: 'cd', download: { url: 'https://s3/mac' } } },
      ] })
    }
    return j(500, {})
  }
  return { fetch, goi }
}
function req(method, body) {
  const r = Readable.from(body === undefined ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))])
  r.method = method; r.headers = {}; return r
}
function res() {
  const r = { statusCode: 0, h: {}, setHeader(k, v) { this.h[k] = v }, end(s) { this.body = JSON.parse(s); this.xong() } }
  r.cho = new Promise((ok) => { r.xong = ok }); return r
}
async function chay(o, method, body, env = { POLAR_ACCESS_TOKEN: 'tok' }) {
  const p = polarGia(o); const xl = taoXuLy({ env, fetch: p.fetch, hetGioMs: 500 })
  const rs = res(); await xl(req(method, body), rs); await rs.cho; return { rs, p }
}

;(async () => {
  let r = await chay({}, 'POST', { key: 'AIOSS-THAT', activation_id: 'act-1' })
  kiem('ma that -> 200', r.rs.statusCode === 200, r.rs.body)
  kiem('chon file .exe', r.rs.body.ten === 'AiO-Shot-and-Save-Setup-0.11.2.exe' && r.rs.body.url === 'https://s3/gia/0.11.2' && r.rs.body.sha256 === 'ab'.repeat(32), r.rs.body)
  kiem('khong tra ma ve', !JSON.stringify(r.rs.body).includes('AIOSS'))
  kiem('gui activation_id cho Polar', JSON.parse(r.p.goi[0].opt.body).activation_id === 'act-1')
  kiem('no-store', r.rs.h['Cache-Control'] === 'no-store')

  r = await chay({}, 'POST', { key: 'AIOSS-GIA' }); kiem('ma gia -> 403', r.rs.statusCode === 403 && r.rs.body.loi === 'ma-khong-hop-le', r.rs.body)
  kiem('ma gia khong tao phien', r.p.goi.length === 1)
  r = await chay({ canAct: true }, 'POST', { key: 'AIOSS-THAT', activation_id: 'act-khac' }); kiem('ma that may khac -> 403', r.rs.statusCode === 403)
  r = await chay({ trangThai: 'revoked' }, 'POST', { key: 'AIOSS-THAT' }); kiem('ma bi thu hoi -> 403', r.rs.statusCode === 403)
  r = await chay({ quyen: 'quyen-la' }, 'POST', { key: 'AIOSS-THAT' }); kiem('ma cua san pham khac -> 403', r.rs.statusCode === 403)
  r = await chay({ validateLoi: 503 }, 'POST', { key: 'AIOSS-THAT' }); kiem('Polar 503 -> 502', r.rs.statusCode === 502)
  r = await chay({ files: [] }, 'POST', { key: 'AIOSS-THAT' }); kiem('khong co bo cai -> 404', r.rs.statusCode === 404)
  r = await chay({}, 'POST', { key: 'AIOSS-THAT' }, {}); kiem('thieu token -> 503', r.rs.statusCode === 503 && r.p.goi.length === 0)
  r = await chay({}, 'POST', { key: 'AIOSS-THAT' }, { POLAR_ACCESS_TOKEN: 'sai' }); kiem('token sai -> 502', r.rs.statusCode === 502)
  r = await chay({}, 'GET'); kiem('GET -> 405', r.rs.statusCode === 405)
  r = await chay({}, 'POST', 'khong phai json'); kiem('json hong -> 400', r.rs.statusCode === 400)
  r = await chay({}, 'POST', { key: '' }); kiem('thieu ma -> 400', r.rs.statusCode === 400)
  r = await chay({}, 'POST', 'x'.repeat(5000)); kiem('than qua to -> 400', r.rs.statusCode === 400)
  // doi chung: Polar gia het gio
  const xl = taoXuLy({ env: { POLAR_ACCESS_TOKEN: 'tok' }, hetGioMs: 200, fetch: (u, o) => new Promise((_, rj) => o.signal.addEventListener('abort', () => rj(new Error('abort')))) })
  const rs = res(); await xl(req('POST', { key: 'AIOSS-THAT' }), rs); await rs.cho
  kiem('Polar treo -> 502 sau het gio', rs.statusCode === 502)
  console.log('tai-ban-moi: dat ' + dat + ', truot ' + truot)
  process.exit(truot ? 1 : 0)
})()
