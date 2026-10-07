// Ghép 3 mảnh nháp (kt.css, kt.html, kt.js) vào trang web Shot & Save.
// Luôn bắt đầu từ bản trong git (HEAD của thư mục đích) nên chạy lại bao nhiêu lần cũng ra cùng một kết quả.
// Dùng: node chen.cjs "<thư mục gốc repo đích>"   (vd thư mục nháp tách từ origin/main)
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const goc = process.argv[2];
if (!goc) { console.error("Thieu thu muc dich"); process.exit(2); }
const REL = "Website/AiO ShotSave Web/index.html";
const doc = f => fs.readFileSync(path.join(__dirname, f), "utf8").replace(/\r\n/g, "\n");
const GOC_GIT = process.argv[3] || "HEAD";
let s = execFileSync("git", ["show", GOC_GIT + ":" + REL], { cwd: goc, maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
const dem = (a) => s.split(a).length - 1;
// Chốt chặn (07/10): từ commit 23d9fa3 trang trên main ĐÃ chứa 6 mảnh này. Ghép lần nữa là chèn trùng.
// Sửa hai phần này từ nay: sửa THẲNG trong index.html (và sửa mảnh ở đây cho khớp), không chạy lại script này trên bản đã ghép.
if (!process.argv[3] && (s.includes('id="ktSan"') || s.includes('id="kgSan"'))) { console.error("DUNG: trang dich da co khoi keo tha / khay co gian ban 2, khong ghep lan nua"); process.exit(3); }
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
// 07/10 anh: "mỗi section ... cần một animation in": các section còn lại dùng cơ chế [data-hien] có sẵn của trang (trồi lên + hiện dần, một lần)
const HIEN = [
  ["      <div class=\"kh-text sb-text\">", "      <div class=\"kh-text sb-text\" data-hien>"],
  ["      <div class=\"kh-right\">\n        <div class=\"kh-mon\"><div class=\"sb-visual\" id=\"sbVisual\">", "      <div class=\"kh-right\" data-hien style=\"--tre:120ms\">\n        <div class=\"kh-mon\"><div class=\"sb-visual\" id=\"sbVisual\">"],
  ["      <div class=\"st-text\">", "      <div class=\"st-text\" data-hien>"],
  ["      <div class=\"st-visual\" id=\"stVisual\" aria-hidden=\"true\">", "      <div class=\"st-visual\" id=\"stVisual\" aria-hidden=\"true\" data-hien style=\"--tre:120ms\">"],
  ["      <div class=\"sec-head\">\n        <h2 data-i=\"priceTitle\">", "      <div class=\"sec-head\" data-hien>\n        <h2 data-i=\"priceTitle\">"],
  ["      <div class=\"sec-head\"><h2 data-i=\"faqTitle\">", "      <div class=\"sec-head\" data-hien><h2 data-i=\"faqTitle\">"],
  ["      <div class=\"faq\">", "      <div class=\"faq\" data-hien style=\"--tre:100ms\">"],
  ["  <section class=\"end\">\n    <div class=\"wrap\">", "  <section class=\"end\">\n    <div class=\"wrap\" data-hien>"],
];
HIEN.forEach((c, i) => thay(c[0], c[1], "data-hien " + i));
// 07/10 anh: câu dưới tiêu đề đầu trang viết lại kiểu "Chụp -> lưu -> gửi. thao tác siêu gọn trong một không gian"
thay('data-i="lede">Press one shortcut, drag a box, and your screenshot is ready to pin on top, mark up, or drag straight into Premiere, Figma, or a chat.</p>',
  'data-i="lede">Capture → Save → Send. One tight flow, all in one place.</p>', "cau dau trang EN");
thay('lede:"Nhấn phím tắt, chọn vùng cần chụp. Ảnh có thể ghim nổi trên màn hình, thêm chú thích, hoặc kéo thẳng vào Premiere, Figma hay khung chat."',
  'lede:"Chụp → Lưu → Gửi. Thao tác siêu gọn trong một không gian."', "cau dau trang VI");
// 07/10 anh chốt định vị "app lưu lại ý tưởng, không phải app chụp hình" và chọn câu "Ý tưởng tiếp theo, đừng để trôi mất" cho tiêu đề cuối trang
thay('data-i-html="endTitle">Your next screenshot<br>can be the fast one.</h2>',
  'data-i-html="endTitle">Your next idea.<br>Don\'t let it slip away.</h2>', "tieu de cuoi trang EN");
thay('endTitle:"Chụp màn hình nhanh hơn,<br>bắt đầu từ hôm nay."',
  'endTitle:"Ý tưởng tiếp theo,<br>đừng để trôi mất."', "tieu de cuoi trang VI");
// 07/10 anh chọn câu "Được làm bởi một editor dựng phim, người lưu hàng trăm ý tưởng mỗi tuần". Chỗ cũ của câu này (dưới tiêu đề phần
// tính năng) đang ẩn khi rạp bật, nên ngoài việc đổi chữ ở chỗ cũ còn đặt thêm một dòng dưới tiêu đề cuối trang (cùng khoá featSub).
thay('data-i="featSub">Built by a video editor who takes hundreds of screenshots a week.</p>',
  'data-i="featSub">Built by a video editor who saves hundreds of ideas a week.</p>', "cau editor EN");
thay('featSub:"Được làm bởi một editor dựng phim, người chụp màn hình hàng trăm lần mỗi tuần."',
  'featSub:"Được làm bởi một editor dựng phim, người lưu hàng trăm ý tưởng mỗi tuần."', "cau editor VI");
thay('Don\'t let it slip away.</h2>\n      <a class="btn btn-main" href="#checkout" data-i="endBtn">',
  'Don\'t let it slip away.</h2>\n      <p class="end-sub" data-i="featSub">Built by a video editor who saves hundreds of ideas a week.</p>\n      <a class="btn btn-main" href="#checkout" data-i="endBtn">', "cau editor o cuoi trang");
thay('.end h2{margin-bottom:24px}',
  '.end h2{margin-bottom:24px}\n.end h2:has(+ .end-sub){margin-bottom:14px}\n.end .end-sub{margin:0 auto 26px;max-width:32em;padding:0 8px;color:var(--ink-2);font-size:17px;line-height:1.5;text-wrap:balance}', "css cau editor");
// 07/10 anh: "một section riêng nêu ra lí do tại sao anh làm cái này ... khai thác nó thành UI kể chuyện": section LÝ DO, đặt giữa đầu trang và rạp
const NEO_FEAT = '  <section class="sec" id="features"';
thay(NEO_FEAT, doc("ld.html") + NEO_FEAT, "html ly do");
thay(NEO_CSS, doc("ld.css") + NEO_CSS, "css ly do");
thay(NEO_JS, doc("ld.js") + "\n" + NEO_JS, "js ly do");
thay(NEO_LANG, NEO_LANG + "\n  if (window.ssLdRelang) window.ssLdRelang();", "doi ngon ngu ly do");
thay(NEO_VI, NEO_VI + 'ldNhan:"Vì sao có Shot & Save", ldT:"Ý tưởng hay,", ldTa:"rồi lại đi đâu mất", ldTb:"giờ ở một nơi duy nhất", ldPj:"Project mới", '
  + 'ldD1:"Thứ 2", ldD2:"Thứ 3", ldD3:"Thứ 4", ldD4:"Thứ 5", ldD5:"Thứ 6", ldY1:"Bảng <wbr>màu", ldY2:"Chuyển <wbr>cảnh", ldY3:"Kiểu <wbr>chữ", ldY4:"Bố <wbr>cục", ldY5:"Đoạn <wbr>code", '
  + 'ldOff:"Không có khay", ldOn:"Có khay", ldTrong:"Chưa có chỗ nào để giữ", ldGoi:"Thử đi: gạt công tắc", '
  + 'ld1:"Mỗi lần có project mới, mình lại đi tìm ý tưởng để thực hiện.", ld2:"Mỗi ngày lại phát hiện ra một ý tưởng hay.", '
  + 'ld3:"Ý tưởng được dùng cho project đang làm, rồi sau đó nó lại “đi đâu mất”.", ld4:"Mỗi ý tưởng là một công tắc kích hoạt não bộ.", '
  + 'ld5:"Mình làm Media Creative hơn 5 năm. Hãy để mình giúp bạn lưu mọi khoảnh khắc, mọi ý tưởng loé lên trên màn hình vào một nơi duy nhất.", ', "chu VI ly do");
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
