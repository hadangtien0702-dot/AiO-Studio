/*
  tai-ban-moi.js - cong tai bo cai moi cho nut "Cap nhat ngay" trong app Shot & Save (23/11/2026).
  Anh Tien: "khi co ban cap nhat moi... hien chu update now... bam vao chi can cho vai giay la ban moi tu dong update".
  Anh chon: CHI KHACH CO MA moi tai duoc (bo cai nam sau Polar, khong dat cong khai).

  Luong: app POST { key, activation_id } (ma ban quyen dang dung tren may)
     -> hoi Polar ma co that khong: POST /v1/customer-portal/license-keys/validate (cong khai, khong can token)
     -> ma "granted", thuoc mot trong 2 quyen loi ma cua minh -> lay customer_id
     -> tao phien khach bang POLAR_ACCESS_TOKEN: POST /v1/customer-sessions/ (can quyen customer_sessions:write)
     -> doc file khach duoc tai: GET /v1/customer-portal/downloadables/ -> chon file .exe (Windows)
     -> tra { ten, kichThuoc, sha256, url, hetHan }. Link do Polar ky, song ~1 gio.
  Ham KHONG tra ma, khong ghi log ma (chi 6 ky tu cuoi).
  App tu so sha256 voi ban-moi.json tren web (nguon thu hai) truoc khi chay bo cai.

  Ma tra ve: 200 co link · 400 thieu / sai dinh dang · 403 ma khong hop le · 404 khong thay bo cai Windows
             405 khong phai POST · 502 Polar loi / het gio · 503 chua dat POLAR_ACCESS_TOKEN.
  Bien moi truong: POLAR_ACCESS_TOKEN (chung voi polar-webhook.js; them quyen customer_sessions:write), POLAR_ORG_ID (tuy chon).
  Bai thu: node scripts/thu-tai-ban-moi.cjs (Polar gia, khong mang).
*/
'use strict'

const ORG_ID_MAC_DINH = '05f1edf9-2456-4d3f-8ff1-a824e433673e'
const API = 'https://api.polar.sh/v1'
/* Quyen loi "ma ban quyen" cua minh: ban chinh + ban Tester (khach Tester cung co quyen loi bo cai). */
const QUYEN_MA = new Set(['9d99f57c-1895-49bd-9205-e061c86587e1', 'bc7f2f35-4e78-43c2-a76f-be6f5d6a0dbf'])
const TOI_DA_BYTE = 4096

function tra(res, code, obj) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(obj))
}
function doc(req, toiDa) {
  return new Promise((resolve, reject) => {
    const c = []; let n = 0
    req.on('data', (x) => { n += x.length; if (n > toiDa) { reject(new Error('qua-to')); try { req.destroy() } catch (_) {} } else c.push(x) })
    req.on('end', () => resolve(Buffer.concat(c))); req.on('error', reject)
  })
}
const duoi = (k) => String(k || '').slice(-6)

function taoXuLy(tuy = {}) {
  const d = Object.assign({ env: process.env, fetch: (...a) => fetch(...a), hetGioMs: 8000 }, tuy)
  async function goi(url, opt) {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), d.hetGioMs)
    try {
      const r = await d.fetch(url, Object.assign({ signal: ac.signal }, opt))
      let j = null; try { j = await r.json() } catch (_) {}
      return { status: r.status, j }
    } finally { clearTimeout(t) }
  }
  return async function xuLy(req, res) {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return tra(res, 405, { loi: 'chi-nhan-post' }) }
    let body
    try { body = JSON.parse((await doc(req, TOI_DA_BYTE)).toString('utf8')) } catch (_) { return tra(res, 400, { loi: 'json-sai' }) }
    const key = body && typeof body.key === 'string' ? body.key.trim() : ''
    const act = body && typeof body.activation_id === 'string' ? body.activation_id.trim() : ''
    if (!key || key.length > 200 || act.length > 100) return tra(res, 400, { loi: 'thieu-ma' })
    const e = d.env
    if (!e.POLAR_ACCESS_TOKEN) { console.error('thieu POLAR_ACCESS_TOKEN'); return tra(res, 503, { loi: 'chua-cau-hinh' }) }
    const org = e.POLAR_ORG_ID || ORG_ID_MAC_DINH
    try {
      // 1. Ma co that khong (cong khai)
      const v = await goi(API + '/customer-portal/license-keys/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.assign({ key, organization_id: org }, act ? { activation_id: act } : {})),
      })
      if (v.status !== 200 || !v.j) {
        console.log('ma ...' + duoi(key) + ': validate ' + v.status)
        return tra(res, v.status >= 500 ? 502 : 403, { loi: v.status >= 500 ? 'polar-loi' : 'ma-khong-hop-le' })
      }
      if (v.j.status !== 'granted' || !QUYEN_MA.has(v.j.benefit_id) || !v.j.customer_id) {
        console.log('ma ...' + duoi(key) + ': status ' + v.j.status + ' benefit ' + v.j.benefit_id)
        return tra(res, 403, { loi: 'ma-khong-hop-le' })
      }
      // 2. Phien khach
      const s = await goi(API + '/customer-sessions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Bearer ' + e.POLAR_ACCESS_TOKEN },
        body: JSON.stringify({ customer_id: v.j.customer_id }),
      })
      if (s.status !== 201 && s.status !== 200 || !s.j || !s.j.token) { console.error('customer-sessions ' + s.status); return tra(res, 502, { loi: 'polar-loi' }) }
      // 3. File khach duoc tai
      const f = await goi(API + '/customer-portal/downloadables/?limit=50', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + s.j.token } })
      if (f.status !== 200 || !f.j) { console.error('downloadables ' + f.status); return tra(res, 502, { loi: 'polar-loi' }) }
      const ds = (f.j.items || []).map((x) => x && x.file).filter((x) => x && /\.exe$/i.test(x.name || '') && x.download && x.download.url)
      ds.sort((a, b) => String(b.created_at || b.last_modified_at || '').localeCompare(String(a.created_at || a.last_modified_at || '')))
      const file = ds[0]
      if (!file) { console.log('ma ...' + duoi(key) + ': khong thay bo cai Windows'); return tra(res, 404, { loi: 'khong-co-bo-cai' }) }
      console.log('ma ...' + duoi(key) + ': cap link ' + file.name)
      return tra(res, 200, { ten: file.name, kichThuoc: file.size, sha256: file.checksum_sha256_hex || null, url: file.download.url, hetHan: file.download.expires_at || null })
    } catch (err) {
      console.error('ma ...' + duoi(key) + ': loi ' + (err && err.message))
      return tra(res, 502, { loi: 'polar-loi' })
    }
  }
}

module.exports = taoXuLy()
module.exports.taoXuLy = taoXuLy
module.exports.QUYEN_MA = QUYEN_MA
