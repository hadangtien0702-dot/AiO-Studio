// Chuyen trang nhap 3 (file html day du) thanh file dang len Artifact: noi dang tu boc <html><head><body>, nen chi dua
// <title> + font + <style> + noi dung body. Khong doi noi dung / hieu ung; chi doi 5 cho bat buoc theo khuon noi dang.
// node tao-artifact.cjs <nguon.html> <dich.html> <ban-thu-co-vo.html>
const fs = require("fs");
const [, , SRC, OUT, THU] = process.argv;
let s = fs.readFileSync(SRC, "utf8").replace(/\r\n/g, "\n");
const lay = (a, z, gom) => { const i = s.indexOf(a), j = s.indexOf(z, i + a.length); if (i < 0 || j < 0) throw new Error("khong thay " + a); return gom ? s.slice(i, j + z.length) : s.slice(i + a.length, j); };
const title = lay("<title>", "</title>", true);
const font = s.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/)[0];
const cho = lay('<script>if(!matchMedia', "</script>", true);
let css = lay("<style>", "</style>", true);
let body = lay("<body>", "</body>", false);

const dem = (t, a) => t.split(a).length - 1;
const thay = (t, a, b, ten, n = 1) => { if (dem(t, a) !== n) throw new Error("MOC " + ten + ": " + dem(t, a) + " lan"); return t.split(a).join(b); };

// 1. thanh tren dinh: chua vung tai tho cua dien thoai
css = thay(css, "header{position:sticky;top:0;z-index:40;", "header{position:sticky;top:env(safe-area-inset-top,0px);z-index:40;", "header sticky");
// 2. khung ghim cua san khau: phan dem cho thanh tren cung phai cong vung tai tho
css = thay(css, ".rp-pin{position:relative;height:100vh;height:100svh;padding-top:64px;", ".rp-pin{position:relative;height:100vh;height:100svh;padding-top:calc(64px + env(safe-area-inset-top,0px));", "rp-pin");
// 3. nen toi: o nhap + thanh cuon cua trinh duyet theo mau toi
css = thay(css, ':root:not([data-theme="light"]){\n    --bg:#141210;', ':root:not([data-theme="light"]){\n    color-scheme:dark;\n    --bg:#141210;', "color-scheme media");
css = thay(css, ':root[data-theme="dark"]{\n  --bg:#141210;', ':root[data-theme="dark"]{\n  color-scheme:dark;\n  --bg:#141210;', "color-scheme attr");
// 4. link ra ngoai: dia chi day du (link tuong doi ../ khong co nghia tren noi dang)
body = thay(body, 'href="../"', 'href="https://aio-shotsave.vercel.app/"', "link shot&save");
body = thay(body, 'href="../legal.html#terms"', 'href="https://aio-shotsave.vercel.app/legal.html#terms"', "link terms");
body = thay(body, 'href="../legal.html#privacy"', 'href="https://aio-shotsave.vercel.app/legal.html#privacy"', "link privacy");
// 5. sang / toi: neu noi dang da dat data-theme (nguoi xem tu chon) thi theo no, tru khi nguoi xem bam nut tren trang
body = thay(body, "  const dark = themeChon ? themeChon === \"dark\" : darkMQ.matches;",
  "  const dark = themeChon ? themeChon === \"dark\" : chuNha ? chuNha === \"dark\" : darkMQ.matches;", "apTheme");
body = thay(body, "let themeChon = null;", "let themeChon = null;\nconst chuNha = document.documentElement.dataset.theme || \"\";   // lua chon sang/toi cua noi dang (neu co)", "chuNha");

const out = [title, font, cho, css, body.trim(), ""].join("\n");
fs.writeFileSync(OUT, out);
// ban thu: boc bang vo giong noi dang de kiem tren may truoc khi dang
const vo = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;background:#fbfaf7}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n`;
fs.writeFileSync(THU, vo + out + "</body></html>\n");
console.log("ok", (out.length / 1024).toFixed(1) + " KB |", "con the cam:", ["<!doctype", "<html", "<head", "<body"].filter(t => out.toLowerCase().includes(t)).join(",") || "khong", "| link tuong doi con lai:", dem(out, 'href="../'));
