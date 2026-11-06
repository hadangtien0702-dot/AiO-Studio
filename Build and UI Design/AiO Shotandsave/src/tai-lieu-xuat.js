'use strict'

/* =========================================================================
   tai-lieu-xuat.js — DUNG NOI DUNG TAI LIEU TUNG BUOC (06/11/2026, ROADMAP 0k #7)
   Khong phu thuoc Electron: nhan danh sach buoc (anh da doc san) tra ve chuoi HTML / Markdown. Do duoc bang node thuan:
   npm run test:tailieu.
   Nguoi xai: chon vai anh trong khay, sap thu tu, go mot dong mo ta moi anh -> ra MOT file HTML (anh nhung ben trong, gui khach mo
   duoc ngay), hoac Markdown + thu muc anh, hoac PDF. Vi du doi thuong: huong dan khach cai dat, 6 tam anh + 6 dong chu thay vi
   viet mot email dai.
   Chu do nguoi dung go DEU duoc thoat ky tu (HTML: & < > " '; Markdown: dau dinh dang), khong tin dau vao.
   ========================================================================= */

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }
const duoiTuMime = (m) => (m === 'image/jpeg' ? 'jpg' : m === 'image/webp' ? 'webp' : 'png')

function thoatHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/** Thoat ky tu dinh dang Markdown trong MOT dong chu (khong de dong mo ta bien thanh tieu de / danh sach / link). */
function thoatMd(s) {
  return String(s == null ? '' : s).replace(/\r?\n+/g, ' ').replace(/([\\`*_{}\[\]<>#+!|~])/g, '\\$1').replace(/^(\s*)(\d+)\./, '$1$2\\.').replace(/^(\s*)-/, '$1\\-').trim()
}

const p2 = (n) => String(n).padStart(2, '0')
function ngayChu(d, lang) {
  d = d || new Date()
  return lang === 'en' ? d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) : p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear()
}

/** Ten file an toan tu tieu de: "Cach xuat ban dung!" -> "Cach-xuat-ban-dung" */
function tenFileTuTieuDe(tieuDe, macDinh) {
  const t = String(tieuDe || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  return t || macDinh || 'tai-lieu'
}

const CSS = `
:root{color-scheme:light;--ink:#1d1d1f;--sub:#5a5a62;--line:#e3e3e8;--accent:#f86820}
*{box-sizing:border-box}
body{margin:0;background:#f5f5f7;color:var(--ink);font:16px/1.55 -apple-system,"Segoe UI",Roboto,Inter,Arial,sans-serif}
main{max-width:860px;margin:0 auto;padding:40px 24px 64px}
h1{font-size:30px;line-height:1.2;margin:0 0 6px;letter-spacing:-.3px}
.ngay{color:var(--sub);font-size:13px;margin:0 0 28px}
.buoc{background:#fff;border:1px solid var(--line);border-radius:12px;padding:20px;margin:0 0 20px;break-inside:avoid;page-break-inside:avoid}
.buoc h2{display:flex;align-items:center;gap:12px;font-size:17px;line-height:1.35;margin:0 0 14px}
.so{flex:none;width:30px;height:30px;border-radius:50%;background:var(--accent);color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center}
.buoc img{display:block;width:100%;height:auto;border-radius:8px;border:1px solid var(--line)}
@media print{body{background:#fff}main{padding:0}.buoc{border-color:#ccc}@page{margin:16mm}}
`

/**
 * Tai lieu HTML MOT FILE, anh nhung dang data URI.
 * d = { tieuDe, lang: 'vi'|'en', ngay?: Date, buoc: [{ moTa, mime, base64 }] , nhanBuoc? }
 */
function taoHtml(d) {
  const lang = d.lang === 'en' ? 'en' : 'vi'
  const nhan = d.nhanBuoc || ((n) => (lang === 'en' ? 'Step ' : 'Bước ') + n)
  const tieuDe = String(d.tieuDe || '').trim() || (lang === 'en' ? 'Step by step guide' : 'Hướng dẫn từng bước')
  const ngayTao = (lang === 'en' ? 'Created ' : 'Tạo ngày ') + ngayChu(d.ngay, lang)
  const buoc = (d.buoc || []).map((b, i) => {
    const mo = String(b.moTa || '').trim()
    const alt = thoatHtml(mo || nhan(i + 1))
    return '<section class="buoc"><h2><span class="so">' + (i + 1) + '</span><span>' + (mo ? thoatHtml(mo) : thoatHtml(nhan(i + 1))) + '</span></h2>' +
      '<img alt="' + alt + '" src="data:' + (MIME[duoiTuMime(b.mime)] || 'image/png') + ';base64,' + b.base64 + '"></section>'
  }).join('\n')
  return '<!doctype html>\n<html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + thoatHtml(tieuDe) + '</title><style>' + CSS + '</style></head><body><main>\n<h1>' + thoatHtml(tieuDe) + '</h1><p class="ngay">' + thoatHtml(ngayTao) + '</p>\n' +
    buoc + '\n</main></body></html>\n'
}

/**
 * Markdown + ten thu muc anh. d = { tieuDe, lang, ngay?, thuMucAnh: 'Ten_anh', buoc: [{ moTa, mime }] }.
 * Tra { md, tenAnh: ['buoc-01.png', ...] } (ben goi chep anh that vao thuMucAnh theo tenAnh).
 */
function taoMarkdown(d) {
  const lang = d.lang === 'en' ? 'en' : 'vi'
  const tieuDe = String(d.tieuDe || '').trim() || (lang === 'en' ? 'Step by step guide' : 'Hướng dẫn từng bước')
  const thuMuc = encodeURIComponent(String(d.thuMucAnh || 'anh'))
  const tenAnh = []
  const dong = ['# ' + thoatMd(tieuDe), '', '_' + ((lang === 'en' ? 'Created ' : 'Tạo ngày ') + ngayChu(d.ngay, lang)) + '_', '']
  ;(d.buoc || []).forEach((b, i) => {
    const ten = 'buoc-' + p2(i + 1) + '.' + duoiTuMime(b.mime)
    tenAnh.push(ten)
    const mo = String(b.moTa || '').trim()
    dong.push('## ' + (lang === 'en' ? 'Step ' : 'Bước ') + (i + 1) + (mo ? ': ' + thoatMd(mo) : ''), '', '![' + (lang === 'en' ? 'Step ' : 'Bước ') + (i + 1) + '](' + thuMuc + '/' + ten + ')', '')
  })
  return { md: dong.join('\n'), tenAnh }
}

module.exports = { taoHtml, taoMarkdown, thoatHtml, thoatMd, tenFileTuTieuDe, duoiTuMime, ngayChu }
