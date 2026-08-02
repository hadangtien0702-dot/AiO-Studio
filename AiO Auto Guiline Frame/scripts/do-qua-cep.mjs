// do-qua-cep.mjs — chay JS trong mot panel CEP dang mo (qua cong debug CDP)
// Dung: node scripts/do-qua-cep.mjs <cong> "<bieu thuc JS tra Promise hoac gia tri>"
// Bieu thuc duoc await neu tra Promise. Can Node >= 22 (co WebSocket san).
// Vi sao: do that tren panel dang chay — khong doan, khong build lai.

const [, , congStr, bieuThucRaw] = process.argv;
const cong = parseInt(congStr, 10);
if (!cong || !bieuThucRaw) {
  console.error('Dung: node do-qua-cep.mjs <cong> "<JS>" | node do-qua-cep.mjs <cong> @file.js');
  process.exit(2);
}
// @file: doc bieu thuc tu file — tranh dia nguc escape khi script dai
const bieuThuc = bieuThucRaw.startsWith('@')
  ? (await import('node:fs')).readFileSync(bieuThucRaw.slice(1), 'utf8')
  : bieuThucRaw;

const ds = await (await fetch(`http://127.0.0.1:${cong}/json`)).json();
if (!ds.length) {
  console.error(`CONG ${cong} SONG NHUNG DANH SACH TRANG RONG - panel chua mo.`);
  process.exit(3);
}
const ws = new WebSocket(ds[0].webSocketDebuggerUrl);
const cho = (ms) => new Promise((r) => setTimeout(r, ms));

let idDem = 0;
const doiKetQua = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && doiKetQua.has(m.id)) { doiKetQua.get(m.id)(m); doiKetQua.delete(m.id); }
};
function goi(method, params) {
  return new Promise((res) => {
    const id = ++idDem;
    doiKetQua.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('WS loi')); });
const kq = await goi('Runtime.evaluate', {
  expression: bieuThuc,
  awaitPromise: true,
  returnByValue: true,
  timeout: 30000
});
// ☠️ dung ngay sau khi dong ket noi la cu bam chua kip chay — cho nhe truoc khi close
await cho(300);
ws.close();
if (kq.result && kq.result.exceptionDetails) {
  console.error('LOI TRONG TRANG: ' + JSON.stringify(kq.result.exceptionDetails));
  process.exit(1);
}
console.log(JSON.stringify(kq.result?.result?.value ?? kq.result, null, 0));
process.exit(0);
