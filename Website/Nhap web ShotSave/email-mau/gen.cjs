// gen.cjs <html> <hash|-> <tien_to> <so_khung> <fps> <dpr> <ra.gif>
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path')
const [, , html, hash, pre, n, fps, dpr, out] = process.argv
const N = +n, here = __dirname.split(String.fromCharCode(92)).join('/')
for (const f of fs.readdirSync(here)) if (f.startsWith(pre + '-') && f.endsWith('.png')) fs.unlinkSync(path.join(here, f))
const shots = []
for (let k = 0; k < N; k++) shots.push({ out: pre + '-' + String(k).padStart(2, '0') + '.png', w: 560, h: 380, dpr: +dpr, js: 'render(' + +(k / +fps).toFixed(3) + ')', wait: 30, clip: '#s' })
fs.writeFileSync(path.join(here, 'shots-' + pre + '.json'), JSON.stringify(shots))
const url = 'file:///' + here + '/' + html + (hash === '-' ? '' : '#' + hash)
const r = execFileSync('node', ['D:/Production/AiO Studio/Website/Nhap web ShotSave/cong-cu/chup.mjs', url, path.join(here, 'shots-' + pre + '.json')], { cwd: here, encoding: 'utf8', maxBuffer: 1 << 26 })
console.log('chup xong, loi console:', /"loi": \[\]/.test(r) ? 'khong' : 'CO')
console.log(execFileSync('python', ['gif-gen.py', pre, String(N), out, String(Math.round(1000 / +fps))], { cwd: here, encoding: 'utf8' }))
