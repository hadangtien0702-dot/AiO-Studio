/**
 * version.mjs — MỘT CHỖ DUY NHẤT quản version của cả 4 panel.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * VÌ SAO PHẢI CÓ — anh Tiến 30/07
 * ══════════════════════════════════════════════════════════════════════════
 *
 * *"em nhớ thêm các kí hiệu version của 4 tool hiện tại em nhé"*.
 *
 * Đo lúc đó thì **cả 4 panel đều lệch** giữa nhật ký và manifest:
 *
 *     Asset Manager   nhật ký 2.0.0-dev.5   manifest 1.3.2
 *     Power Bins      nhật ký 2.0.0-dev.6   manifest 1.3.2
 *     Autocut         nhật ký 1.5.0         manifest 1.4.0
 *     Transcripts     nhật ký 2.3.0         manifest 1.4.0
 *
 * Version trôi âm thầm vì nó nằm ở **ba chỗ** (`manifest.xml` × 2 thuộc tính,
 * `package.json`) mà không chỗ nào kiểm chỗ nào. Và hệ quả thật đã xảy ra hai
 * lần trong hai ngày: panel chạy bản cũ mà không ai biết, phải đo qua cổng
 * debug mới phát hiện.
 *
 * ☠️ Đây là **cơ chế**, không phải lời dặn. Lời dặn thì lần sau vẫn quên.
 *
 * Dùng:
 *   node design-system/version.mjs           # chỉ ĐO, in bảng đối chiếu
 *   node design-system/version.mjs --sua     # ghi đồng bộ theo nhật ký
 *
 * ⚠️ Sửa `manifest.xml` thì **bắt buộc tắt hẳn Premiere rồi mở lại** — Premiere
 * đọc manifest đúng một lần lúc khởi động.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const GOC = new URL('../', import.meta.url)
const PANEL = ['AiO Asset Manager', 'AiO Power Bins', 'AiO Autocut', 'AiO Transcripts']
const SUA = process.argv.includes('--sua')

const duong = (p) => new URL(p, GOC)

/** Version mới nhất trong nhật ký — NGUỒN CHÂN LÝ về "đang ở bản nào". */
function tuNhatKy(ten) {
  const f = duong(`${ten}/PROGRESS.md`)
  if (!existsSync(f)) return ''
  const m = /^## \[([0-9][^\]]*)\]/m.exec(readFileSync(f, 'utf8'))
  return m ? m[1] : ''
}

/**
 * Manifest chỉ nhận version dạng SỐ (Adobe CEP: `x.y.z` hoặc `x.y.z.w`).
 * Nhật ký hay có `-dev.N` để đánh dấu bước nhỏ — cắt bỏ phần đó cho manifest,
 * còn `package.json` thì giữ nguyên (npm cho phép, và nó là thứ hiện lên UI:
 * thấy `-dev` là biết bản chưa chốt).
 */
const choManifest = (v) => v.replace(/-.*$/, '')

function doc(ten) {
  const fm = duong(`${ten}/CSXS/manifest.xml`)
  const fp = duong(`${ten}/client/package.json`)
  const m = existsSync(fm) ? readFileSync(fm, 'utf8') : ''
  const p = existsSync(fp) ? JSON.parse(readFileSync(fp, 'utf8')) : {}
  return {
    ten,
    nhatKy: tuNhatKy(ten),
    bundle: (/ExtensionBundleVersion="([^"]+)"/.exec(m) ?? [])[1] ?? '',
    ext: (/<Extension\s+Id="[^"]*"\s+Version="([^"]+)"/.exec(m) ?? [])[1] ?? '',
    pkg: p.version ?? '',
    _fm: fm,
    _fp: fp,
    _m: m,
    _p: p,
  }
}

const bang = PANEL.map(doc)
let lech = 0

console.log(
  `\n${'Panel'.padEnd(20)}${'Nhat ky'.padEnd(16)}${'manifest bundle'.padEnd(17)}${'manifest ext'.padEnd(15)}package.json`,
)
console.log('-'.repeat(84))
for (const r of bang) {
  const mongManifest = choManifest(r.nhatKy)
  const ok = r.bundle === mongManifest && r.ext === mongManifest && r.pkg === r.nhatKy
  if (!ok) lech++
  console.log(
    r.ten.padEnd(20) +
      (r.nhatKy || '-').padEnd(16) +
      (r.bundle || '-').padEnd(17) +
      (r.ext || '-').padEnd(15) +
      (r.pkg || '-') +
      (ok ? '' : '   <-- LECH'),
  )
}

if (!SUA) {
  console.log(
    lech
      ? `\n${lech}/4 panel LECH version. Chay lai voi --sua de dong bo theo nhat ky.`
      : '\n4/4 panel KHOP version.',
  )
  process.exit(lech ? 1 : 0)
}

/* ── GHI ĐỒNG BỘ ─────────────────────────────────────────────────────────── */
let daSua = 0
for (const r of bang) {
  if (!r.nhatKy) {
    console.log(`\n[${r.ten}] BO QUA: nhat ky khong co version dang so`)
    continue
  }
  const vM = choManifest(r.nhatKy)
  let m = r._m
  const truoc = m
  m = m.replace(/ExtensionBundleVersion="[^"]+"/, `ExtensionBundleVersion="${vM}"`)
  // Chỉ đổi thuộc tính Version của thẻ <Extension>, đừng chạm các Version khác
  // trong manifest (RequiredRuntime, HostList… có nghĩa hoàn toàn khác).
  m = m.replace(
    /(<Extension\s+Id="[^"]*"\s+Version=")[^"]+(")/,
    (_, a, b) => a + vM + b,
  )
  if (m !== truoc) {
    writeFileSync(r._fm, m, 'utf8')
    daSua++
  }
  if (r._p.version !== r.nhatKy) {
    r._p.version = r.nhatKy
    writeFileSync(r._fp, JSON.stringify(r._p, null, 2) + '\n', 'utf8')
    daSua++
  }
  console.log(`[${r.ten}] manifest -> ${vM} · package.json -> ${r.nhatKy}`)
}
console.log(
  `\nDa ghi ${daSua} cho.` +
    (daSua ? '\n⚠️ Sua manifest.xml roi: phai TAT HAN Premiere roi mo lai.' : ''),
)
