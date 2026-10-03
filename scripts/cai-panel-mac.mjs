#!/usr/bin/env node
// cai-panel-mac.mjs - cai panel CEP cua AiO Studio vao Premiere tren MAC. Viet 03/10/2026.
// Ban Mac cua cac sign-install.ps1 (Windows). Mac khong ky .zxp: PlayerDebugMode = 1 thi Premiere
// nap thang thu muc trong ~/Library/Application Support/Adobe/CEP/extensions/<id>.
//
// Cach dung (dung o thu muc nao cung duoc):
//   node scripts/cai-panel-mac.mjs autocut            -> build + cai 1 panel
//   node scripts/cai-panel-mac.mjs autocut music      -> nhieu panel
//   node scripts/cai-panel-mac.mjs tat-ca             -> build + cai ca 11 panel
//   node scripts/cai-panel-mac.mjs tat-ca --thu       -> CHI SO ban se cai voi ban dang cai, KHONG ghi gi
//   them --khong-build   -> dung dist dang co, khong build lai
//   them --dich <thu muc> -> cai vao cho khac (de thu script ma khong dung panel that)
//
// KHONG XOA ban dang cai: no duoc DOI CHO sang
//   ~/Library/Application Support/AiO-Studio/ban-cai-truoc/<id>   (chi giu 1 ban ngay truoc do)
// Muon quay lai: bo thu muc <id> trong extensions, keo ban trong ban-cai-truoc ve cho cu.
//
// ☠️ Premiere nap host/*.jsx MOT LAN luc khoi dong: cai xong phai TAT + MO LAI Premiere,
//    reload panel khong du (CLAUDE.md goc muc 4g.1).
// ☠️ FFmpeg / whisper / yt-dlp ban Mac KHONG nam trong panel ma o kho chung
//    ~/Library/Application Support/AiO-Studio/ nen script nay khong chep bin/.
// Them panel moi: them 1 dong vao bang PANEL (id + thu muc khong duoc trung panel khac).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GOC = path.join(REPO, 'Build and UI Design');
const HOTRO = path.join(os.homedir(), 'Library', 'Application Support');
const EXT_MAC = path.join(HOTRO, 'Adobe', 'CEP', 'extensions');
const KHO_BAN_TRUOC = path.join(HOTRO, 'AiO-Studio', 'ban-cai-truoc');

// muc = thu muc / file chep nguyen sang ban cai. build = ten lenh npm trong client/ (panel co build).
// Asset Manager + Power Bins: ban dang chay trong Premiere la build:release (do 03/10: khop tung byte).
const CHUNG = ['CSXS', 'dist', 'host', '.debug'];
const PANEL = [
  { ten: 'hub', id: 'com.aiostudio.hub', thuMuc: 'AiO WELCOME', muc: ['CSXS', 'dist', '.debug'] },
  { ten: 'guideframe', id: 'com.aiostudio.guideframe', thuMuc: 'AiO Auto Guiline Frame', muc: [...CHUNG, 'fonts'] },
  { ten: 'podcast', id: 'com.aiostudio.podcast', thuMuc: 'AiO Auto Podcast', muc: CHUNG },
  { ten: 'reframe', id: 'com.aiostudio.reframe', thuMuc: 'AiO Auto Re-Frames', muc: CHUNG },
  {
    ten: 'music', id: 'com.aiostudio.music', thuMuc: 'AiO Mussic',
    muc: ['CSXS', 'host', '.debug', 'index.html', 'CSInterface.js', 'cau-noi.js', 'nen.js', 'phan-tich.js', 'ung-dung.js'],
  },
  { ten: 'shortviral', id: 'com.aiostudio.shortviral', thuMuc: 'AiO Auto Short Viral', muc: CHUNG, build: 'build' },
  { ten: 'videodownload', id: 'com.aiostudio.videodownload', thuMuc: 'AiO Video Download', muc: CHUNG, build: 'build' },
  { ten: 'autocut', id: 'com.aiostudio.autocut', thuMuc: 'AiO Autocut', muc: CHUNG, build: 'build' },
  // mogrt: chi chep *.mogrt (nhu ban Windows), khong chep file .aep / anh thu trong thu muc do
  { ten: 'transcript', id: 'com.aiostudio.transcript', thuMuc: 'AiO Transcripts', muc: [...CHUNG, 'fonts'], build: 'build', mogrt: true },
  { ten: 'assetmanager', id: 'com.aiostudio.assetmanager', thuMuc: 'AiO Asset Manager', muc: CHUNG, build: 'build:release' },
  { ten: 'powerbin', id: 'com.aiostudio.powerbin', thuMuc: 'AiO Power Bins', muc: CHUNG, build: 'build:release' },
];

// ---------- tham so ----------
const thamSo = process.argv.slice(2);
const THU = thamSo.includes('--thu');
const KHONG_BUILD = thamSo.includes('--khong-build');
const iDich = thamSo.indexOf('--dich');
let DICH = EXT_MAC;
if (iDich >= 0) {
  if (!thamSo[iDich + 1]) { console.log('LOI: --dich can mot thu muc'); process.exit(1); }
  DICH = path.resolve(thamSo[iDich + 1]);
}
const tenChon = thamSo.filter((t, i) => !t.startsWith('--') && !(iDich >= 0 && i === iDich + 1));
const dsTen = PANEL.map((p) => p.ten).join(', ');
if (tenChon.length === 0) {
  console.log('Dung: node scripts/cai-panel-mac.mjs <ten panel | tat-ca> [--thu] [--khong-build] [--dich <thu muc>]');
  console.log('Ten panel: ' + dsTen);
  process.exit(1);
}
// Khop CHINH XAC ten hoac id, khong khop "chua" (autocut khong duoc nuot ten khac).
let chon = [];
if (tenChon.includes('tat-ca')) chon = PANEL;
else {
  for (const t of tenChon) {
    const p = PANEL.find((x) => x.ten === t || x.id === t);
    if (!p) { console.log('LOI: khong co panel "' + t + '". Ten dung: ' + dsTen + ', tat-ca'); process.exit(1); }
    if (!chon.includes(p)) chon.push(p);
  }
}
if (process.platform !== 'darwin' && DICH === EXT_MAC) {
  console.log('LOI: script nay cho Mac. Windows dung scripts/sign-install.ps1 trong thu muc tung panel.');
  process.exit(1);
}

// ---------- ham ----------
const DUOI_CHU = new Set(['', '.html', '.js', '.jsx', '.mjs', '.css', '.json', '.xml', '.txt', '.md', '.svg']);

function lietKe(goc) {
  const kq = new Map(); // khoa NFC -> duong dan tuong doi that (ten co dau tren Mac co the la NFD)
  const di = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.DS_Store') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) di(p);
      else { const rel = path.relative(goc, p); kq.set(rel.normalize('NFC'), rel); }
    }
  };
  if (fs.existsSync(goc)) di(goc);
  return kq;
}

function boCR(buf) {
  return Buffer.from(buf.filter((b) => b !== 13));
}

// So thu muc A (ban se cai) voi B (ban dang cai). Tra ve tung nhom ten file.
function soSanh(a, b) {
  const fa = lietKe(a);
  const fb = lietKe(b);
  const kq = { tong: fa.size, giong: 0, chiLechXuongDong: [], lech: [], thieu: [], thua: [] };
  for (const [khoa, rel] of fa) {
    if (!fb.has(khoa)) { kq.thieu.push(rel); continue; }
    const x = fs.readFileSync(path.join(a, rel));
    const y = fs.readFileSync(path.join(b, fb.get(khoa)));
    if (x.equals(y)) kq.giong++;
    else if (DUOI_CHU.has(path.extname(rel).toLowerCase()) && boCR(x).equals(boCR(y))) kq.chiLechXuongDong.push(rel);
    else kq.lech.push(rel);
  }
  for (const [khoa, rel] of fb) if (!fa.has(khoa)) kq.thua.push(rel);
  return kq;
}

function build(p) {
  const cl = path.join(GOC, p.thuMuc, 'client');
  if (!fs.existsSync(path.join(cl, 'node_modules'))) {
    throw new Error('chua co node_modules, chay truoc: cd "' + cl + '" && npm install');
  }
  const t0 = Date.now();
  const r = spawnSync('npm', ['run', '-s', p.build], { cwd: cl, encoding: 'utf8' });
  if (r.error) throw new Error('khong chay duoc npm: ' + r.error.message);
  if (r.status !== 0) {
    const duoi = ((r.stdout || '') + (r.stderr || '')).split('\n').filter(Boolean).slice(-12).join('\n    ');
    throw new Error('build LOI (npm run ' + p.build + '):\n    ' + duoi);
  }
  return Date.now() - t0;
}

// Dung ban se cai vao mot thu muc tam, dung bo cuc nhu ban trong extensions.
function dung(p) {
  const nguon = path.join(GOC, p.thuMuc);
  if (!fs.existsSync(nguon)) throw new Error('khong thay thu muc ' + nguon);
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-cai-' + p.ten + '-'));
  const boRac = (f) => path.basename(f) !== '.DS_Store';
  for (const m of p.muc) {
    const s = path.join(nguon, m);
    if (!fs.existsSync(s)) {
      if (m === '.debug') continue; // khong co cong go loi thi panel van chay
      throw new Error('thieu "' + m + '" trong ' + p.thuMuc + (m === 'dist' && p.build ? ' (chua build?)' : ''));
    }
    fs.cpSync(s, path.join(tam, m), { recursive: true, filter: boRac });
  }
  if (p.mogrt) {
    const thuMucMogrt = path.join(nguon, 'mogrt');
    const ds = fs.existsSync(thuMucMogrt) ? fs.readdirSync(thuMucMogrt).filter((f) => f.toLowerCase().endsWith('.mogrt')) : [];
    if (ds.length > 0) {
      fs.mkdirSync(path.join(tam, 'mogrt'), { recursive: true });
      for (const f of ds) fs.copyFileSync(path.join(thuMucMogrt, f), path.join(tam, 'mogrt', f));
    }
  }
  return tam;
}

// Ban se cai co du de Premiere mo len khong: dung id, co file giao dien + file host ma manifest tro toi.
function kiemBanSeCai(p, tam) {
  const loi = [];
  const mf = path.join(tam, 'CSXS', 'manifest.xml');
  if (!fs.existsSync(mf)) return { loi: ['thieu CSXS/manifest.xml'], phienBan: '?' };
  const xml = fs.readFileSync(mf, 'utf8');
  const id = (xml.match(/ExtensionBundleId="([^"]+)"/) || [])[1];
  const phienBan = (xml.match(/ExtensionBundleVersion="([^"]+)"/) || [])[1] || '?';
  if (id !== p.id) loi.push('manifest ghi id "' + id + '" nhung bang PANEL ghi "' + p.id + '"');
  let soTro = 0;
  for (const the of ['MainPath', 'ScriptPath']) {
    const re = new RegExp('<' + the + '>([^<]+)</' + the + '>', 'g');
    let m;
    while ((m = re.exec(xml))) {
      soTro++;
      const rel = m[1].trim();
      const f = path.join(tam, rel);
      if (!fs.existsSync(f)) loi.push(the + ' tro toi file KHONG CO: ' + rel);
      else if (fs.statSync(f).size === 0) loi.push(the + ' tro toi file RONG: ' + rel);
    }
  }
  if (soTro === 0) loi.push('manifest khong co MainPath / ScriptPath nao');
  return { loi, phienBan };
}

function premiereDangChay() {
  const r = spawnSync('pgrep', ['-f', 'Adobe Premiere Pro'], { encoding: 'utf8' });
  return r.status === 0 && String(r.stdout || '').trim() !== '';
}

function kiemPlayerDebugMode() {
  const thieu = [];
  for (const n of [9, 10, 11, 12]) {
    const r = spawnSync('defaults', ['read', 'com.adobe.CSXS.' + n, 'PlayerDebugMode'], { encoding: 'utf8' });
    if (r.status !== 0 || String(r.stdout || '').trim() !== '1') thieu.push(n);
  }
  return thieu;
}

// Doi cho ban dang cai sang kho ban-truoc (khong xoa), roi chep ban moi vao.
function cai(p, tam) {
  const dich = path.join(DICH, p.id);
  let luu = null;
  if (fs.existsSync(dich)) {
    const kho = DICH === EXT_MAC ? KHO_BAN_TRUOC : DICH + '-ban-cai-truoc';
    fs.mkdirSync(kho, { recursive: true });
    luu = path.join(kho, p.id);
    fs.rmSync(luu, { recursive: true, force: true }); // chi giu 1 ban ngay truoc do
    try {
      fs.renameSync(dich, luu);
    } catch (e) {
      if (e.code !== 'EXDEV') throw e; // khac o dia thi chep roi moi bo
      fs.cpSync(dich, luu, { recursive: true });
      fs.rmSync(dich, { recursive: true, force: true });
    }
  }
  fs.mkdirSync(DICH, { recursive: true });
  fs.cpSync(tam, dich, { recursive: true });
  return luu;
}

const rutGon = (ds) => (ds.length === 0 ? '' : ' (' + ds.slice(0, 4).join(', ') + (ds.length > 4 ? ', ...' : '') + ')');

// ---------- chay ----------
console.log((THU ? 'CHE DO THU (khong ghi gi)' : 'CAI PANEL') + ' | dich: ' + DICH);
if (!THU && DICH === EXT_MAC) {
  const thieu = kiemPlayerDebugMode();
  if (thieu.length > 0) {
    console.log('CANH BAO: PlayerDebugMode chua bat cho CSXS ' + thieu.join(', ') + ' -> Premiere se KHONG nap panel chua ky.');
    console.log('  Bat (chay 1 lan, moi so mot lenh): defaults write com.adobe.CSXS.<so> PlayerDebugMode 1');
  }
}
const dangChay = !THU && DICH === EXT_MAC && premiereDangChay();

let soLoi = 0;
for (const p of chon) {
  let tam = null;
  try {
    let giayBuild = '';
    if (p.build && !KHONG_BUILD) giayBuild = ' | build ' + (build(p) / 1000).toFixed(1) + ' s';
    tam = dung(p);
    const { loi, phienBan } = kiemBanSeCai(p, tam);
    if (loi.length > 0) throw new Error('ban se cai KHONG DU: ' + loi.join('; '));
    const dich = path.join(DICH, p.id);

    if (THU) {
      if (!fs.existsSync(dich)) { console.log('[thu] ' + p.ten + ' ' + phienBan + giayBuild + ' | CHUA CAI o dich'); continue; }
      const s = soSanh(tam, dich);
      const sach = s.lech.length === 0 && s.thieu.length === 0;
      console.log('[thu] ' + p.ten + ' ' + phienBan + giayBuild + ' | ' + s.tong + ' file | giong ' + s.giong
        + ' | chi lech xuong dong ' + s.chiLechXuongDong.length
        + ' | LECH noi dung ' + s.lech.length + rutGon(s.lech)
        + ' | ban cai thieu ' + s.thieu.length + rutGon(s.thieu)
        + ' | ban cai thua ' + s.thua.length + rutGon(s.thua)
        + (sach ? '' : '  <-- cai se DOI ban dang chay'));
      continue;
    }

    const luu = cai(p, tam);
    const s = soSanh(tam, dich);
    const dat = s.giong === s.tong && s.lech.length === 0 && s.thieu.length === 0 && s.thua.length === 0
      && s.chiLechXuongDong.length === 0;
    if (!dat) {
      throw new Error('cai xong nhung ban trong dich KHONG khop ban vua dung: lech ' + s.lech.length + rutGon(s.lech)
        + ', thieu ' + s.thieu.length + rutGon(s.thieu) + ', thua ' + s.thua.length + rutGon(s.thua));
    }
    console.log('[cai] ' + p.ten + ' ' + phienBan + giayBuild + ' | ' + s.tong + '/' + s.tong + ' file khop'
      + (luu ? ' | ban truoc cat o: ' + luu : ' | cai lan dau'));
  } catch (e) {
    soLoi++;
    console.log('[LOI] ' + p.ten + ': ' + e.message);
  } finally {
    if (tam) fs.rmSync(tam, { recursive: true, force: true }); // thu muc tam do chinh script tao
  }
}

if (!THU && soLoi < chon.length) {
  console.log(dangChay
    ? 'Premiere DANG MO: tat han roi mo lai thi moi nap ban moi (host .jsx chi nap luc khoi dong).'
    : 'Xong. Mo Premiere > Window > Extensions de dung.');
}
if (soLoi > 0) console.log(soLoi + '/' + chon.length + ' panel LOI.');
process.exit(soLoi > 0 ? 1 : 0);
