// Chup khung hinh trang web bang Chrome chay ngam (CDP), nhieu anh trong MOT lan mo Chrome.
// node chup.mjs <url> <shots.json>
//   shots.json = [{ "out": "a.png", "w": 1440, "h": 900, "dpr": 1, "js": "<bieu thuc JS, co the tra Promise>", "wait": 300, "clip": "<css selector tuy chon>" }, ...]
//   Moi anh: dat kich thuoc man -> (nap lai trang neu doi kich thuoc) -> chay js (cho Promise xong) -> cho wait ms -> chup.
// In ra JSON ket qua tung anh (gia tri js tra ve + loi console neu co).
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , URL_, SHOTS] = process.argv;
if (!URL_ || !SHOTS) { console.error("node chup.mjs <url> <shots.json>"); process.exit(2); }
const shots = JSON.parse(readFileSync(SHOTS, "utf8"));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9300 + Math.floor(Math.random() * 600);
const prof = mkdtempSync(join(tmpdir(), "chup-"));
const ch = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "about:blank"], { stdio: "ignore" });
const ngu = ms => new Promise(r => setTimeout(r, ms));

let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await ngu(150);
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = l.find(t => t.type === "page"); if (p) wsUrl = p.webSocketDebuggerUrl; } catch (e) {}
}
if (!wsUrl) { console.error("khong noi duoc Chrome"); ch.kill(); process.exit(1); }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const cho = new Map(), suKien = [];
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && cho.has(m.id)) { cho.get(m.id)(m); cho.delete(m.id); } else if (m.method) suKien.push(m); };
const goi = (method, params = {}) => new Promise(res => { const i = ++id; cho.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const loi = [];
await goi("Page.enable"); await goi("Runtime.enable");
// Windows tat hieu ung (vd dang dieu khien tu xa) -> Chrome bao prefers-reduced-motion:reduce -> trang hien luoi the tinh, khong dung san khau. Ep ve "co chuyen dong" de do.
await goi("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: process.env.GIAM === "1" ? "reduce" : "no-preference" }] });
const choTai = async () => { const t0 = Date.now(); while (Date.now() - t0 < 20000) { const k = suKien.findIndex(e => e.method === "Page.loadEventFired"); if (k >= 0) { suKien.splice(0, k + 1); return; } await ngu(50); } };
const thuLoi = () => { for (const e of suKien.splice(0)) { if (e.method === "Runtime.exceptionThrown") loi.push(e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text); if (e.method === "Runtime.consoleAPICalled" && e.params.type === "error") loi.push(e.params.args.map(a => a.value ?? a.description).join(" ")); } };

let kichCu = "";
const kq = [];
for (const s of shots) {
  const w = s.w || 1440, h = s.h || 900, dpr = s.dpr || 1, kich = `${w}x${h}x${dpr}`;
  if (kich !== kichCu) {
    await goi("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile: w < 768 });
    await goi("Page.navigate", { url: URL_ }); await choTai(); await ngu(s.load ?? 1500); kichCu = kich;
  }
  let val = null;
  if (s.js) {
    const r = await goi("Runtime.evaluate", { expression: `(async()=>{ return await (${s.js}); })()`, awaitPromise: true, returnByValue: true });
    val = r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description ?? null;
  }
  await ngu(s.wait ?? 300);
  let clip;
  if (s.clip) {
    // toa do clip cua CDP tinh theo TRANG (khong theo man hinh): phai cong vi tri cuon, khong thi trang da cuon ra anh trong (soat 01/10 bat duoc)
    const r = await goi("Runtime.evaluate", { expression: `(()=>{const e=document.querySelector(${JSON.stringify(s.clip)}); if(!e) return null; const b=e.getBoundingClientRect(); return {x:b.left+scrollX,y:b.top+scrollY,width:b.width,height:b.height};})()`, returnByValue: true });
    const b = r.result?.result?.value; if (b && b.width > 0) clip = { ...b, scale: 1 };
  }
  const sh = await goi("Page.captureScreenshot", { format: "png", ...(clip ? { clip } : {}) });
  writeFileSync(s.out, Buffer.from(sh.result.data, "base64"));
  thuLoi();
  kq.push({ out: s.out, val });
}
console.log(JSON.stringify({ shots: kq, loi: [...new Set(loi)].slice(0, 20) }, null, 1));
ws.close(); ch.kill();
await ngu(400); try { rmSync(prof, { recursive: true, force: true }); } catch (e) {}
process.exit(0);
