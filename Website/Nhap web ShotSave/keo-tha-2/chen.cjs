// Ghép 3 mảnh nháp (kt.css, kt.html, kt.js) vào trang web Shot & Save.
// Luôn bắt đầu từ bản trong git (HEAD của thư mục đích) nên chạy lại bao nhiêu lần cũng ra cùng một kết quả.
// Dùng: node chen.cjs "<thư mục gốc repo đích>"   (vd thư mục nháp tách từ origin/main)
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const goc = process.argv[2];
if (!goc) { console.error("Thieu thu muc dich"); process.exit(2); }
const REL = "Website/AiO ShotSave Web/index.html";
const doc = f => fs.readFileSync(path.join(__dirname, f), "utf8").replace(/\r\n/g, "\n");
let s = execFileSync("git", ["show", "HEAD:" + REL], { cwd: goc, maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
const dem = (a) => s.split(a).length - 1;
function thay(neo, moi, ten) {
  const n = dem(neo);
  if (n !== 1) { console.error("NEO '" + ten + "' xuat hien " + n + " lan (can dung 1)"); process.exit(1); }
  s = s.replace(neo, () => moi);
}
const NEO_CSS = '/* 24/09 anh: "animation peak hơn": vòng sóng cam lan ra chỗ ảnh đáp xuống */';
thay(NEO_CSS, doc("kt.css") + NEO_CSS, "css");
const NEO_HTML = '  <section class="sec" id="shelf">\n';
thay(NEO_HTML, '  <section class="sec kt-on" id="shelf">\n' + doc("kt.html"), "html");
const NEO_LANG = "  if (window.ssKhRelang) window.ssKhRelang();";
thay(NEO_LANG, NEO_LANG + "\n  if (window.ssKtRelang) window.ssKtRelang();", "doi ngon ngu");
const NEO_JS = "// ===== Section KHAY: kéo cùng một ảnh từ khay vào Lark";
thay(NEO_JS, doc("kt.js") + "\n" + NEO_JS, "js");
const NEO_VI = 'khTitle:"Kéo thả vào mọi ứng dụng", ';
thay(NEO_VI, NEO_VI + 'ktGoi:"Thử đi: kéo một ảnh thả vào app bất kỳ", ', "chu VI");
fs.writeFileSync(path.join(goc, REL), s);
// Kiểm cú pháp mọi khối script nhúng (bẫy 06/10: một ghi chú giữa dòng làm chết cả khối)
let khoi = 0, loi = 0;
s.replace(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g, (m, thuoc, ma) => {
  if (/type=["'](application\/ld\+json|text\/template|importmap)/.test(thuoc)) return m;
  khoi++;
  try { new Function(ma); } catch (e) { loi++; console.error("LOI CU PHAP khoi " + khoi + ": " + e.message); }
  return m;
});
console.log("da ghep: " + s.length + " ky tu, " + khoi + " khoi script, " + loi + " loi cu phap, CR=" + (s.split("\r").length - 1));
process.exit(loi ? 1 : 0);
