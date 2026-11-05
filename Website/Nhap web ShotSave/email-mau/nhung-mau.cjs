// Nhung 2 mau thu (email/cam-on-mua.v3.{vi,en}.html) thanh aio-mail/api/_mau-thu.js de ham Vercel dung (ham khong doc duoc thu muc email/ luc chay).
// SUA MAU THU -> sua file .html roi CHAY LAI file nay. Chay: node nhung-mau.cjs
const fs = require('fs'), path = require('path')
const web = path.join(__dirname, '..', '..', 'AiO ShotSave Web')
const mail = path.join(__dirname, '..', '..', 'aio-mail')
const lf = s => s.split(String.fromCharCode(13, 10)).join(String.fromCharCode(10))
const out = {}
for (const ng of ['vi', 'en']) out[ng] = lf(fs.readFileSync(path.join(web, 'email', 'cam-on-mua.v3.' + ng + '.html'), 'utf8'))
const js = '// SINH TU DONG boi Website/Nhap web ShotSave/email-mau/nhung-mau.cjs tu email/cam-on-mua.v3.{vi,en}.html. KHONG sua tay.\n' +
  "'use strict'\nmodule.exports = " + JSON.stringify(out, null, 1) + '\n'
fs.writeFileSync(path.join(mail, 'api', '_mau-thu.js'), js)
console.log('ghi aio-mail/api/_mau-thu.js', Math.round(js.length / 1024) + ' KB')
