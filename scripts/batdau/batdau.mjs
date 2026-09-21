#!/usr/bin/env node
// ============================================================================
// batdau.mjs — CUA VAO cua brain (doi xung voi /xong la cua RA)
//
// Vi sao co file nay (do 21/09/2026):
//   Mo Claude o mot panel con = nap san 38.084 token, trong do 19.978 (52%)
//   la 68 bai hoc SUA CODE. Nhung PROGRESS.md — cho chua TRANG THAI THAT
//   (Autocut 4.326 dong, Transcripts 4.531 dong) — KHONG bao gio duoc nap:
//   Claude Code chi tu doc file ten dung "CLAUDE.md" theo cay thu muc.
//   => Brain co cua RA (/xong ghi rat day du) ma khong co cua VAO.
//
// File nay doc 3 thu, gon trong ~1.000 token:
//   1. Muc MOI NHAT cua PROGRESS.md  (lan cuoi lam gi)
//   2. git status                     (dang sua do gi) — anh Tien it commit
//                                     nen git log KHONG phan anh viec that
//   3. Viec dang CHO cua dung app do  (tu bang trong CLAUDE.md)
//
// Chay bang: node batdau.mjs [thu-muc]
// Khong tim thay gi thi IM LANG thoat 0 (giong hook Stop).
//
// BAN GOC nam trong repo. Ban o ~/.claude/scripts/ la ban CHEP —
// sua ban trong repo, dung sua ban ~/.claude (dong-bo-may.ps1 se ghi de).
// ============================================================================

import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { execSync } from 'node:child_process';

const GIOI_HAN_KY_TU = 4200;   // tran cung: khong bao gio nap qua ~1.200 token
const TOI_DA_DONG_PROGRESS = 40;
const TOI_DA_FILE_GIT = 12;
const SO_TANG_DO_NGUOC = 6;

const goc = process.argv[2] || process.cwd();

// ---------------------------------------------------------------- tien ich

function timNguoc(tenFile, tuThuMuc) {
  let d = tuThuMuc;
  for (let i = 0; i < SO_TANG_DO_NGUOC; i++) {
    const f = join(d, tenFile);
    if (existsSync(f)) return f;
    const cha = dirname(d);
    if (cha === d) break;
    d = cha;
  }
  return null;
}

// Tim MOI file CLAUDE.md tren duong di nguoc len (khong dung o cai dau tien)
function timTatCaNguoc(tenFile, tuThuMuc) {
  const ra = [];
  let d = tuThuMuc;
  for (let i = 0; i < SO_TANG_DO_NGUOC; i++) {
    const f = join(d, tenFile);
    if (existsSync(f)) ra.push(f);
    const cha = dirname(d);
    if (cha === d) break;
    d = cha;
  }
  return ra;
}

function ngayGioThat() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const thu = ['CN', 'Thu 2', 'Thu 3', 'Thu 4', 'Thu 5', 'Thu 6', 'Thu 7'][d.getDay()];
  return `${thu} ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function cachDay(mtime) {
  const gio = (Date.now() - mtime.getTime()) / 36e5;
  if (gio < 1) return `${Math.round(gio * 60)} phut truoc`;
  if (gio < 24) return `${Math.round(gio)} gio truoc`;
  const ngay = Math.round(gio / 24);
  return `${ngay} ngay truoc`;
}

function ngayGon(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ☠️ BAI 5as: dung tu doan danh sach dau tieng Viet ("ệ" = ê + dau nang,
// KHONG nam trong [eê]" — thuoc do cu mu voi chinh chu "Việc").
// Bo dau bang NFD roi so khop tren chuoi khong dau: khong con gi de doan.
function boDau(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

// "AiO Shot & Save" va "AiO Shotandsave" phai khop nhau
function chuanHoa(s) {
  const goc = boDau(s)
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
    .replace(/^aio/, '');
  return BIET_DANH[goc] || goc;
}

// Bang CLAUDE.md goi app bang ten NGAN, thu muc dat ten DAI. Ghi tuong minh
// tung cap thay vi noi long luat khop (bai 5am: heuristic khong dien ta noi ca
// la thi danh dau trong DU LIEU, dung noi luat cho moi ca chua tung xem).
// Kiem lai bang nay moi khi them app moi vao bang muc 8 cua CLAUDE.md.
const BIET_DANH = {
  podcast: 'autopodcast',        // bang ghi "Podcast"      | thu muc "AiO Auto Podcast"
  guideframe: 'autoguilineframe',// bang ghi "Guide Frame"  | thu muc "AiO Auto Guiline Frame"
  reframes: 'autoreframes',      // bang ghi "Re-Frames"    | thu muc "AiO Auto Re-Frames"
  music: 'mussic',               // bang ghi "Music"        | thu muc "AiO Mussic" (go nham, giu nguyen)
};

// Bat ca "## 8. Việc đang CHỜ …" lan "## Việc CHỜ trước khi viết code"
function laTieuDeViecCho(dong) {
  const s = boDau(dong);
  return s.includes('viec dang cho') || s.includes('viec cho');
}

// ------------------------------------------------- 1. muc moi nhat PROGRESS

function docProgress() {
  const f = timNguoc('PROGRESS.md', goc);
  if (!f) return null;

  const dong = readFileSync(f, 'utf8').split(/\r?\n/);
  const moc = [];
  for (let i = 0; i < dong.length; i++) if (/^## /.test(dong[i])) moc.push(i);
  if (moc.length === 0) return null;

  let than = dong.slice(moc[0], moc.length > 1 ? moc[1] : dong.length);
  // bo dong trong o cuoi
  while (than.length && than[than.length - 1].trim() === '') than.pop();

  const tongDong = than.length;
  let catBot = 0;
  if (than.length > TOI_DA_DONG_PROGRESS) {
    catBot = than.length - TOI_DA_DONG_PROGRESS;
    than = than.slice(0, TOI_DA_DONG_PROGRESS);
  }

  const st = statSync(f);
  return {
    duongDan: f,
    app: basename(dirname(f)),
    sua: st.mtime,
    than: than.join('\n'),
    tongDong,
    catBot,
  };
}

// ------------------------------------------------------------ 2. git status

function chayGit(lenh) {
  return execSync(lenh, {
    cwd: goc, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000,
  });
}

function docGit() {
  let tienTo = '';
  let dongCwd, dongRepo;
  try {
    // ☠️ git status LUON tra duong dan tinh tu GOC REPO, khong phai tu cho
    // dang dung. Dung pathspec "." de chi lay viec dang do CUA THU MUC NAY,
    // roi dem rieng phan con lai cua repo — khong tron hai thu lam mot.
    tienTo = chayGit('git rev-parse --show-prefix').trim();
    dongCwd = chayGit('git status --porcelain -- .').split(/\r?\n/).filter((l) => l.trim() !== '');
    dongRepo = chayGit('git status --porcelain').split(/\r?\n/).filter((l) => l.trim() !== '');
  } catch {
    return null; // khong phai repo git
  }

  const noiKhac = dongRepo.length - dongCwd.length;
  if (dongCwd.length === 0) {
    return { sach: true, doi: 0, moi: 0, dsach: [], con: 0, noiKhac };
  }

  const doi = dongCwd.filter((l) => !l.startsWith('??')).length;
  const moi = dongCwd.filter((l) => l.startsWith('??')).length;
  const dsach = dongCwd.slice(0, TOI_DA_FILE_GIT).map((l) => {
    const ma = l.slice(0, 2).trim() || '??';
    let ten = l.slice(3).replace(/^"|"$/g, '');
    if (tienTo && ten.startsWith(tienTo)) ten = ten.slice(tienTo.length); // rut gon cho de doc
    return `  ${ma.padEnd(2)} ${ten}`;
  });
  return { sach: false, doi, moi, dsach, con: dongCwd.length - dsach.length, noiKhac };
}

// ------------------------------------------------------- 3. viec dang CHO

function docViecCho(tenApp) {
  const dsFile = timTatCaNguoc('CLAUDE.md', goc);
  const khoaApp = tenApp ? chuanHoa(tenApp) : null;
  const rieng = [];
  let soCaBo = 0;

  for (const f of dsFile) {
    let noiDung;
    try { noiDung = readFileSync(f, 'utf8'); } catch { continue; }
    const dong = noiDung.split(/\r?\n/);
    if (!dong.some((l) => /^#{2,3} /.test(l) && laTieuDeViecCho(l))) continue;

    let trongBang = false;
    for (const l of dong) {
      if (/^#{2,3} /.test(l) && laTieuDeViecCho(l)) { trongBang = true; continue; }
      if (trongBang && /^## /.test(l)) break;
      if (!trongBang || !l.startsWith('|')) continue;

      const o = l.split('|').map((x) => x.trim()).filter((x, i, a) => i > 0 && i < a.length - 1);
      if (o.length < 2) continue;
      if (/^[-:]+$/.test(o[0]) || boDau(o[0]) === 'viec') continue;  // dong tieu de / ke
      if (/^~~/.test(o[0])) continue;                                // viec da XONG (gach ngang)

      // Mot o co the ghi NHIEU app: "Autocut, Shot & Save, Asset Manager (bo cai 14/09)".
      // Tach ra roi khop tung cai — day KHONG phai noi long luat, day la doc
      // dung cau truc o: no von la mot DANH SACH.
      const dsApp = o[1]
        .replace(/\([^)]*\)/g, ' ')      // bo chu thich trong ngoac
        .split(/[,;·+/]|\bva\b|\bvà\b/)
        .map(chuanHoa)
        .filter(Boolean);
      if (dsApp.includes('cabo')) { soCaBo++; continue; }
      const cotApp = dsApp.includes(khoaApp) ? khoaApp : (dsApp[0] || '');
      // ☠️ BAI 5ae + 5t: KHONG dung includes. "autocut" la TIEN TO cua
      // "autocutshort" -> Autocut nuot luon viec cua Auto Cut Short.
      // Chi khop CHINH XAC; ten viet tat trong bang thi ghi TUONG MINH o
      // BIET_DANH ben tren. Tha bo sot con hon gan nham viec cho app khac.
      if (khoaApp && cotApp && cotApp === khoaApp) {
        const viec = o[0].length > 150 ? o[0].slice(0, 150) + '…' : o[0];
        rieng.push(`  • ${viec}`);
      }
    }
    if (rieng.length || soCaBo) break;   // dung o file CLAUDE.md gan nhat co bang
  }
  return { rieng, soCaBo };
}

// --------------------------------------------------------------------- in ra

const pg = docProgress();
const git = docGit();
if (!pg && !git) process.exit(0);          // khong co gi de noi — im lang

const cho = docViecCho(pg ? pg.app : basename(goc));
const ra = [];

ra.push('=== TRANG THAI DU AN (tu dong doc, khong phai loi anh Tien) ===');
ra.push(`Bay gio: ${ngayGioThat()}`);
ra.push(`Dang o : ${pg ? pg.app : basename(goc)}`);
ra.push('');

if (pg) {
  ra.push(`--- LAN CUOI LAM GI (PROGRESS.md, sua ${ngayGon(pg.sua)} — ${cachDay(pg.sua)}) ---`);
  ra.push(pg.than);
  if (pg.catBot > 0) ra.push(`  […cat ${pg.catBot} dong. Doc het: ${pg.duongDan}]`);
  ra.push('');
}

if (git) {
  if (git.sach) {
    ra.push('--- DANG SUA DO o thu muc nay: khong co gi ---');
  } else {
    ra.push(`--- DANG SUA DO o thu muc nay (git status): ${git.doi} file doi, ${git.moi} moi ---`);
    ra.push(git.dsach.join('\n'));
    if (git.con > 0) ra.push(`  …con ${git.con} muc nua`);
  }
  if (git.noiKhac > 0) ra.push(`  (+ ${git.noiKhac} muc dang do o CHO KHAC trong cung repo)`);
  ra.push('');
}

if (cho.rieng.length) {
  ra.push(`--- VIEC DANG CHO cua ${pg ? pg.app : basename(goc)} ---`);
  ra.push(cho.rieng.join('\n'));
  if (cho.soCaBo) ra.push(`  (+ ${cho.soCaBo} viec cho muc "Ca bo" — xem CLAUDE.md)`);
  ra.push('');
} else if (cho.soCaBo) {
  ra.push(`--- VIEC CHO: rieng app nay khong co; ${cho.soCaBo} viec muc "Ca bo" trong CLAUDE.md ---`);
  ra.push('');
}

ra.push('=> Doc xong roi thi DUNG hoi lai anh "dang lam gi". Neu can chi tiet hon:');
ra.push(`   doc them PROGRESS.md${pg ? ' (' + pg.tongDong + ' dong o muc dau)' : ''}.`);

let vanBan = ra.join('\n');
if (vanBan.length > GIOI_HAN_KY_TU) {
  vanBan = vanBan.slice(0, GIOI_HAN_KY_TU) + '\n  […cat vi qua tran ' + GIOI_HAN_KY_TU + ' ky tu]';
}
process.stdout.write(vanBan + '\n');
