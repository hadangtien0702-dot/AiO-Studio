// Quet brain that -> tra ve JSON cho ban do song.
// Chay: node quet-brain.mjs   -> http://localhost:8097
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HOME = os.homedir();
const CLAUDE = path.join(HOME, '.claude');
const PRODUCTION = 'E:/2026/Production';
const PORT = 8097;
// fileURLToPath: duong dan co DAU CACH bi ma hoa %20 neu doc thang .pathname
const THU_MUC = path.dirname(fileURLToPath(import.meta.url));

const doc = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const mtime = (p) => { try { return fs.statSync(p).mtime.toISOString(); } catch { return null; } };
const dong = (s) => (s ? s.split('\n').length : 0);

// ---------- 1. Bai hoc trong CLAUDE.md tong ----------
function quetBaiHoc(file, nguon) {
  const src = doc(file);
  if (!src) return [];
  const lines = src.split('\n');
  const dau = /^\*\*([0-9]+[a-z]*(?:-(?:bis|ter))?)\.\s+(.*)$/;
  const moc = [];
  lines.forEach((l, i) => { const m = l.match(dau); if (m) moc.push({ i, id: m[1], tieuDe: m[2] }); });
  return moc.map((m, k) => {
    const het = k + 1 < moc.length ? moc[k + 1].i : lines.length;
    const than = lines.slice(m.i, het).join('\n');
    const phanTieuDe = than.split('**')[1] || m.tieuDe;
    const tieuDe = phanTieuDe.replace(/^[0-9a-z-]+\.\s*/, '').replace(/\s+/g, ' ').trim();
    const ngay = than.match(/(\d{2}\/\d{2}\/20\d{2})/);
    return {
      id: m.id,
      nguon,
      tieuDe,
      than,
      soDong: het - m.i,
      doNguyHiem: (than.match(/\u2620\ufe0f/g) || []).length,
      ngay: ngay ? ngay[1] : null,
      coSoDo: /\d[\d.,]*\s*(ms|gi\u00e2y|giay|ph\u00fat|phut|%|MB|GB|px|dB|\u00f4|d\u00f2ng|file|l\u01b0\u1ee3t|c\u00e2u)/i.test(than),
      dong: m.i + 1,
    };
  });
}

// ---------- 2. Day noi: bai hoc trich dan nhau ----------
function quetLienKet(baiHoc) {
  const biet = new Map(baiHoc.map((b) => [b.id, b]));
  const canh = [];
  // Dau nhay nguoc quanh ma la TUY CHON: brain gon lai 08/09 boc ma trong `5d`
  // cho dung markdown, thuoc cu chi tim "luat 5d" tran nen mu sach 25 day noi.
  const mau = /(?:c\u00f9ng h\u1ecd|h\u1ecd h\u00e0ng|c\u00f9ng g\u1ed1c|lu\u1eadt|b\u00e0i h\u1ecdc|b\u00e0i|h\u1ec7 qu\u1ea3|xem)\s+`?([0-9]+[a-z]*(?:-(?:bis|ter))?)`?\b/gi;
  // Dong "Cung ho: `5k` · `5af` · `5u`" — mot tu khoa, NHIEU dich. Mau tren chi
  // bat duoc cai dau tien, nen quet rieng ca danh sach.
  const mauDs = /(?:cùng họ|họ hàng)\s*:\s*([^\n]+)/gi;
  for (const b of baiHoc) {
    const thay = new Set();
    for (const m of b.than.matchAll(mau)) {
      const dich = m[1];
      if (dich !== b.id && biet.has(dich)) thay.add(dich);
    }
    for (const m of b.than.matchAll(mauDs)) {
      for (const x of m[1].matchAll(/`([0-9]+[a-z]*(?:-(?:bis|ter))?)`/g)) {
        if (x[1] !== b.id && biet.has(x[1])) thay.add(x[1]);
      }
    }
    for (const d of thay) canh.push({ tu: b.id, den: d, loai: 'ho-hang' });
  }
  return canh;
}

// ---------- 3. Skills ----------
function quetSkill() {
  const goc = path.join(CLAUDE, 'skills');
  let ten = [];
  try { ten = fs.readdirSync(goc); } catch { return []; }
  return ten
    .filter((t) => fs.existsSync(path.join(goc, t, 'SKILL.md')))
    .map((t) => {
      const f = path.join(goc, t, 'SKILL.md');
      const phu = fs.readdirSync(path.join(goc, t)).filter((x) => x.endsWith('.md') && x !== 'SKILL.md');
      return {
        ten: t,
        soDong: dong(doc(f)),
        sua: mtime(f),
        fileKhac: phu,
        soDongKhac: phu.reduce((s, x) => s + dong(doc(path.join(goc, t, x))), 0),
      };
    });
}

// ---------- 4. So bai hoc thiet ke ----------
function quetLessons() {
  const f = path.join(CLAUDE, 'skills', 'design-lessons', 'LESSONS.md');
  const src = doc(f);
  if (!src) return { muc: [], sua: null, soDong: 0 };
  const lines = src.split('\n');
  const muc = [];
  lines.forEach((l, i) => {
    if (/^## /.test(l)) muc.push({ tieuDe: l.slice(3).trim(), dong: i + 1, con: [] });
    else if (/^### /.test(l) && muc.length) muc[muc.length - 1].con.push(l.slice(4).trim());
  });
  return { muc, sua: mtime(f), soDong: lines.length };
}

// ---------- 5. Ngan nho theo du an ----------
function quetNganNho() {
  const goc = path.join(CLAUDE, 'projects');
  let ten = [];
  try { ten = fs.readdirSync(goc); } catch { return []; }
  return ten
    .map((t) => {
      const thuMuc = path.join(goc, t, 'memory');
      let file = [];
      try { file = fs.readdirSync(thuMuc).filter((x) => x.endsWith('.md')); } catch {}
      const ghiNho = file
        .filter((x) => x !== 'MEMORY.md')
        .map((x) => {
          const src = doc(path.join(thuMuc, x)) || '';
          const mo = src.match(/^---([\s\S]*?)---/);
          const fm = mo ? mo[1] : '';
          const lyTen = fm.match(/name:\s*(.+)/);
          const lyMoTa = fm.match(/description:\s*(.+)/);
          const lyLoai = fm.match(/type:\s*(.+)/);
          return {
            file: x,
            ten: (lyTen ? lyTen[1] : x.replace(/\.md$/, '')).trim(),
            moTa: (lyMoTa ? lyMoTa[1] : '').trim(),
            loai: (lyLoai ? lyLoai[1] : '?').trim(),
            soDong: dong(src),
            sua: mtime(path.join(thuMuc, x)),
            lienKetNoi: [...src.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]),
          };
        });
      return {
        slug: t,
        coMemoryMd: file.includes('MEMORY.md'),
        suaMemoryMd: mtime(path.join(thuMuc, 'MEMORY.md')),
        ghiNho,
        oCuKetDinh: /^[gG]--/.test(t),
      };
    })
    .filter((x) => x.ghiNho.length || x.coMemoryMd);
}

// ---------- 6. Du an trong Production ----------
function quetDuAn() {
  const ra = [];
  const bo = new Set(['node_modules', '.git', 'dist', 'bin', 'out', '.next']);
  const di = (thuMuc, sau) => {
    if (sau > 3) return;
    let ds = [];
    try { ds = fs.readdirSync(thuMuc, { withFileTypes: true }); } catch { return; }
    if (ds.some((d) => d.isFile() && d.name === 'CLAUDE.md')) {
      const p = path.join(thuMuc, 'PROGRESS.md');
      ra.push({
        ten: path.basename(thuMuc),
        duongDan: thuMuc.replace(/\\/g, '/'),
        soDongClaude: dong(doc(path.join(thuMuc, 'CLAUDE.md'))),
        suaClaude: mtime(path.join(thuMuc, 'CLAUDE.md')),
        coProgress: fs.existsSync(p),
        suaProgress: mtime(p),
        soDongProgress: dong(doc(p)),
      });
    }
    for (const d of ds) if (d.isDirectory() && !bo.has(d.name)) di(path.join(thuMuc, d.name), sau + 1);
  };
  di(PRODUCTION, 0);
  return ra;
}

// ---------- 7. Co che tu ghi ----------
function quetCoChe() {
  const st = doc(path.join(CLAUDE, 'settings.json'));
  let hookStop = false;
  try { hookStop = !!(JSON.parse(st || '{}').hooks || {}).Stop; } catch {}
  let lenh = [];
  try { lenh = fs.readdirSync(path.join(CLAUDE, 'commands')).filter((x) => x.endsWith('.md')).map((x) => x.replace(/\.md$/, '')); } catch {}
  let lienKet = null;
  try { lienKet = fs.readlinkSync(CLAUDE); } catch {}
  return { hookStop, lenh, lienKet };
}

// ---------- Gop ----------
function quet() {
  const baiHoc = quetBaiHoc(path.join(CLAUDE, 'CLAUDE.md'), 'CLAUDE.md tong');
  const duAn = quetDuAn();
  const canh = quetLienKet(baiHoc);

  // day noi bai hoc -> du an (bai hoc nhac ten du an nao)
  const tenDuAn = [...new Set(duAn.map((d) => d.ten))].filter((t) => t.length > 5);
  for (const b of baiHoc) {
    for (const t of tenDuAn) {
      if (b.than.toLowerCase().includes(t.toLowerCase())) canh.push({ tu: b.id, den: 'da:' + t, loai: 'vap-o' });
    }
  }

  return {
    quetLuc: new Date().toISOString(),
    goc: { CLAUDE, PRODUCTION },
    tong: {
      soDongClaudeMd: dong(doc(path.join(CLAUDE, 'CLAUDE.md'))),
      suaClaudeMd: mtime(path.join(CLAUDE, 'CLAUDE.md')),
      soBaiHoc: baiHoc.length,
      soDayNoi: canh.length,
    },
    baiHoc,
    canh,
    skill: quetSkill(),
    lessons: quetLessons(),
    nganNho: quetNganNho(),
    duAn,
    coChe: quetCoChe(),
  };
}

// ---------- May chu ----------
const may = http.createServer((req, res) => {
  if (req.url.startsWith('/du-lieu')) {
    const t0 = Date.now();
    let d;
    try { d = quet(); } catch (e) { res.writeHead(500); return res.end(String(e)); }
    d.quetMs = Date.now() - t0;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(d));
  }
  // File tinh cung thu muc (brain.svg va logo anh Tien thay sau nay).
  // Chi cho ten file PHANG (khong dau gach cheo, khong dau cham hai) —
  // nen khong the di nguoc ra ngoai thu muc brain-map.
  const LOAI_TINH = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', ico: 'image/x-icon' };
  const ten = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '');
  const duoi = ten.split('.').pop().toLowerCase();
  if (/^[\w-]+\.[a-z0-9]+$/i.test(ten) && LOAI_TINH[duoi]) {
    let buf = null;
    try { buf = fs.readFileSync(path.join(THU_MUC, ten)); } catch {}
    if (buf) {
      res.writeHead(200, { 'Content-Type': LOAI_TINH[duoi], 'Cache-Control': 'no-store' });
      return res.end(buf);
    }
  }

  const html = doc(path.join(THU_MUC, 'index.html'));
  if (!html) { res.writeHead(404); return res.end('thieu index.html'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(html);
});
may.listen(PORT, '0.0.0.0', () => console.log('Ban do brain: http://localhost:' + PORT));
