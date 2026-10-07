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
// Chốt chặn (07/10): từ commit 23d9fa3 trang trên main ĐÃ chứa 6 mảnh này. Ghép lần nữa là chèn trùng.
// Sửa hai phần này từ nay: sửa THẲNG trong index.html (và sửa mảnh ở đây cho khớp), không chạy lại script này trên bản đã ghép.
if (s.includes('id="ktSan"') || s.includes('id="kgSan"')) { console.error("DUNG: trang dich da co khoi keo tha / khay co gian ban 2, khong ghep lan nua"); process.exit(3); }
function thay(neo, moi, ten) {
  const n = dem(neo);
  if (n !== 1) { console.error("NEO '" + ten + "' xuat hien " + n + " lan (can dung 1)"); process.exit(1); }
  s = s.replace(neo, () => moi);
}
const NEO_CSS = '/* 24/09 anh: "animation peak hơn": vòng sóng cam lan ra chỗ ảnh đáp xuống */';
thay(NEO_CSS, doc("kt.css") + doc("kg.css") + NEO_CSS, "css");
// Class kt-on / kg-on do JS gắn lúc dựng xong, KHÔNG ghi sẵn trong HTML (JS hỏng thì trang còn bản 1)
const NEO_HTML = '  <section class="sec" id="shelf">\n';
thay(NEO_HTML, NEO_HTML + doc("kt.html"), "html keo tha");
const NEO_HTML2 = '  <section class="sec" id="resize">\n';
thay(NEO_HTML2, NEO_HTML2 + doc("kg.html"), "html khay co gian");
const NEO_LANG = "  if (window.ssKhRelang) window.ssKhRelang();";
thay(NEO_LANG, NEO_LANG + "\n  if (window.ssKtRelang) window.ssKtRelang();\n  if (window.ssKgRelang) window.ssKgRelang();", "doi ngon ngu");
const NEO_JS = "// ===== Section KHAY: kéo cùng một ảnh từ khay vào Lark";
thay(NEO_JS, doc("kt.js") + "\n" + NEO_JS, "js keo tha");
const NEO_JS2 = "// ===== Section KHAY CO GIÃN: con trỏ kéo góc khay";
thay(NEO_JS2, doc("kg.js") + "\n" + NEO_JS2, "js khay co gian");
const NEO_VI = 'khTitle:"Kéo thả vào mọi ứng dụng", ';
thay(NEO_VI, NEO_VI + 'ktGoi:"Thử đi: kéo một ảnh thả vào app bất kỳ", kgGoi:"Thử đi: kéo một góc của khay", kgAnh:"ảnh", kgTitle:\'Khay <span class="kg-gian">co giãn</span><br class="kg-xd"> theo ý bạn\', ', "chu VI");
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
