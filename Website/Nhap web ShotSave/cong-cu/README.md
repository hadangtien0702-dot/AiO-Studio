# Cong cu chup khung hinh trang /premiere/ (lap 01/10/2026)

- `chup.mjs`: mo Chrome chay ngam (CDP), chup nhieu anh trong mot lan mo.
  `node chup.mjs "<url hoac file:///...>" shots.json`
  shots.json = `[{"out":"a.png","w":1440,"h":900,"dpr":1,"js":"<bieu thuc JS>","wait":300,"clip":"<css selector>"}]`
  Tu ep `prefers-reduced-motion: no-preference` (Windows tat hieu ung thi trang hien luoi the tinh, khong co san khau). `GIAM=1` de thu che do giam.
- `nhay.js`: mot bieu thuc ham `(n, q)`: nhay toi canh n (1..12) o tien do q (0..1) va DONG BANG san khau (tat snap/scrub) de anh dung thoi diem.
  Dung trong truong "js": noi dung file + `(2, 0.5)`. Tieng Viet: `(setLang("vi"), <noi dung>(2, 0.5))`.
- Can `window.__rp` cua trang (co san: st, M, pos, ve, a0, done, total).
