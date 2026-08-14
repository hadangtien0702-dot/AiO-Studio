/**
 * somuc.mjs — bang so sanh BA MUC manh tay tren du lieu THAT.
 *
 * Chay:  cd client && npm run kiem   (bien dich xong)  roi  node ../tests/somuc.mjs
 *
 * Hai co: clip 82 giay (final.mp4) va video 58:37 (IMG_3987.mov). Luon xem CA HAI
 * — bai hoc 2026-07-28: co nho chay hoan hao van che duoc loi lam co lon chet han.
 */
import { readFileSync } from 'node:fs'
import { lapKeHoach } from './js/plan.js'

const LANG_82 = [[3.22921,3.97977],[5.83754,6.30156],[9.1669,9.81527],[10.679,10.9892],[12.3978,12.8691],[15.7792,16.2792],[17.137,17.7699],[18.3691,18.6873],[21.6411,22.0876],[23.402,24.3144],[26.9171,27.4053],[29.1147,30.1253],[34.4146,34.871],[36.2854,37.1629],[41.0132,41.957],[44.2477,44.9034],[45.4127,46.0177],[47.2338,47.5],[49.1755,50.0906],[51.2314,51.9253],[54.6911,55.1176],[56.0053,56.5272],[59.5089,60.1741],[61.3719,61.9186],[63.899,64.3719],[66.2791,67.2762],[68.5169,68.7832],[70.2543,71.4642],[73.7641,74.0211],[76.802,78.1254],[78.826,79.2855],[81.3472,81.7707]].map(([start,end])=>({start,end}))
const LANG_58 = JSON.parse(
  readFileSync(new URL('./du-lieu/lang-58phut.json', import.meta.url), 'utf8'),
).map(([start, end]) => ({ start, end }))

const MUC = [['Giu nhip', 0.6, 0.15], ['Vua', 0.4, 0.08], ['Cat sach', 0.25, 0.04]]
const ph = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

function bang(ten, lang, dai, fps) {
  console.log(`\n${ten}  (${lang.length} khoang lang, ${ph(dai)})`)
  console.log('  Muc       | lang toi thieu | nhat cat | doan giu | rut ngan | con lai')
  console.log('  ----------|----------------|----------|----------|----------|--------')
  for (const [nhan, minSil, pad] of MUC) {
    const ds = lang.filter((s) => s.end - s.start >= minSil)
    const k = lapKeHoach(ds, { srcIn: 0, srcOut: dai, pad, minCut: 0.1, minKeep: 0.1, fps })
    console.log(
      `  ${nhan.padEnd(9)} |     ${minSil.toFixed(2)}s      | ${String(k.cuts.length).padStart(8)} | ` +
      `${String(k.keeps.length).padStart(8)} | ${ph(k.tietKiem).padStart(8)} | ${ph(k.sau)}`,
    )
  }
}

bang('CLIP 82 GIAY (final.mp4, 25 fps)', LANG_82, 81.77, 25)
bang('VIDEO 58 PHUT (IMG_3987.mov, 30 fps)', LANG_58, 3517.5, 30)

console.log('\nGhi chu: cot "lang toi thieu" o day loc lai tu danh sach do o 0,25s.')
console.log('Chay FFmpeg THANG o d=0.4 cho 1.173 nhat / rut 13:45 — lech ~2% so voi bang tren.')
console.log('Ban 0.5.0-0.6.2 (co mat na Whisper) tren video 58 phut: 14 nhat cat, rut 9,8 GIAY.')
