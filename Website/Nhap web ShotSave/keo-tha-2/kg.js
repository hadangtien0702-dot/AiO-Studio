// ===== Section KHAY CO GIÃN bản 2 (07/10): lưới 24 ô ảnh cố định, khay là khung phủ lên lưới; khung phủ tới đâu ảnh hiện tới đó.
// Khách kéo 4 góc được (góc đối diện đứng yên, thả tay thì khung hít về mép ô). Tự diễn khi không ai đụng.
// Không có GSAP thì không gắn class kg-on, trang dùng bản 1 ngay bên dưới. "Giảm chuyển động": đứng yên ở cỡ vừa, vẫn kéo được.
document.addEventListener("DOMContentLoaded", () => {
  const sec = document.getElementById("resize"), san = document.getElementById("kgSan");
  if (!sec || !san || !window.gsap) return;
  sec.classList.add("kg-on");
  try { khoiDong(); } catch (e) { sec.classList.remove("kg-on"); throw e; }
  function khoiDong() {
  const T = k => window.ssT ? window.ssT(k) : "";
  const giam = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hep = matchMedia("(max-width:720px)");
  const lay = id => document.getElementById(id);
  const nen = lay("kgNen"), lop = lay("kgAnh"), khay = lay("kgKhay"), dem = lay("kgDem"), nhan = lay("kgNhan"), goi = lay("kgGoi"), tro = lay("kgTro"), che = lay("kgChe");
  // 24 ảnh mẫu khác nhau: lấy lại đúng bộ ảnh bản 1 đã dựng trong #rsList (không lặp ảnh, anh nhắc 22/09)
  const mau = [...document.querySelectorAll("#rsList .kh-thumb")].map(e => { const c = e.cloneNode(true); c.classList.remove("cam", "di"); c.removeAttribute("style"); return c.outerHTML; });

  // ---- lưới ô ----
  let C = 0, R = 0, os = [], X = [], Y = [], g = 10, dau = 30;
  function dungLuoi() {
    C = hep.matches ? 4 : 6; R = hep.matches ? 6 : 4; nen.textContent = ""; lop.textContent = ""; os = [];
    for (let i = 0; i < C * R; i++) {
      nen.append(document.createElement("i"));
      const o = document.createElement("div"); o.className = "kg-o";
      o.innerHTML = '<div class="rs-list kg-rl">' + (mau.length ? mau[i % mau.length] : '<div class="kh-thumb"></div>') + "</div>";
      lop.append(o); os.push(o);
    }
  }
  function doLuoi() {
    const cs = getComputedStyle(san);
    g = parseFloat(cs.getPropertyValue("--g")) || 10; dau = parseFloat(cs.getPropertyValue("--dau")) || 30;
    X = []; Y = [];
    for (let c = 0; c < C; c++) { const e = nen.children[c], l = nen.offsetLeft + e.offsetLeft; X.push({ l, r: l + e.offsetWidth }); }
    for (let r = 0; r < R; r++) { const e = nen.children[r * C], t = nen.offsetTop + e.offsetTop; Y.push({ t, b: t + e.offsetHeight }); }
  }
  const DAU = () => hep.matches ? { c0: 0, c1: 1, r0: 1, r1: 2 } : { c0: 1, c1: 3, r0: 1, r1: 2 };
  const VUA = () => hep.matches ? { c0: 0, c1: 2, r0: 1, r1: 3 } : { c0: 1, c1: 4, r0: 0, r1: 2 };
  const KIEU = ten => hep.matches
    ? (ten === "ngang" ? { c0: 0, c1: 3, r0: 4, r1: 5 } : { c0: 2, c1: 3, r0: 0, r1: 5 })
    : (ten === "ngang" ? { c0: 0, c1: 5, r0: 2, r1: 3 } : { c0: 4, c1: 5, r0: 0, r1: 3 });
  const giong = (a, b) => a.c0 === b.c0 && a.c1 === b.c1 && a.r0 === b.r0 && a.r1 === b.r1;
  // khung khay (mép ngoài) ứng với một vùng ô
  const khungCua = o => ({ l: X[o.c0].l - g, r: X[o.c1].r + g, t: Y[o.r0].t - g - dau, b: Y[o.r1].b + g });

  // ---- vẽ: đặt khung, bật các ô nằm trong khung (lọt 65% là bật, cho cảm giác "hít") ----
  let o = DAU(), hien = o, kh = { l: 0, t: 0, r: 0, b: 0 };
  function ve(k) {
    kh = { l: k.l, t: k.t, r: k.r, b: k.b };
    khay.style.left = kh.l + "px"; khay.style.top = kh.t + "px"; khay.style.width = (kh.r - kh.l) + "px"; khay.style.height = (kh.b - kh.t) + "px";
    const il = kh.l + g, ir = kh.r - g, it = kh.t + g + dau, ib = kh.b - g;
    let n = 0, c0 = C, c1 = -1, r0 = R, r1 = -1;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const tx = (X[c].r - X[c].l) * .35, ty = (Y[r].b - Y[r].t) * .35;
      const bat = X[c].l >= il - tx && X[c].r <= ir + tx && Y[r].t >= it - ty && Y[r].b <= ib + ty;
      os[r * C + c].classList.toggle("bat", bat);
      if (bat) { n++; if (c < c0) c0 = c; if (c > c1) c1 = c; if (r < r0) r0 = r; if (r > r1) r1 = r; }
    }
    hien = n ? { c0, c1, r0, r1 } : null;
    chu();
  }
  // chữ đi theo khay: số ảnh trên thanh khay, nhãn cỡ, chữ "co giãn" trên tiêu đề giãn theo số cột, đèn Ngang / Dọc
  function chu() {
    const h = hien || o, cot = h.c1 - h.c0 + 1, hang = h.r1 - h.r0 + 1, n = cot * hang;
    dem.textContent = n;
    nhan.textContent = cot + " × " + hang + " · " + n + " " + (T("kgAnh") || "shots");
    const gian = sec.querySelector(".kg-gian");
    if (gian) gian.style.letterSpacing = (-.02 + .24 * (cot - 1) / (C - 1)).toFixed(3) + "em";
    che.querySelectorAll("span").forEach(s => s.classList.toggle("on", giong(h, KIEU(s.dataset.che))));
  }
  window.ssKgRelang = chu;

  // ---- chuyển động (tween tự chạy tạm dừng khi section ra khỏi màn hình) ----
  let thay = false, phien = 0, hen = 0;
  const dang = new Set(), dangTay = new Set(), chay = () => thay && !document.hidden;
  const capNhat = () => dang.forEach(t => chay() ? t.resume() : t.pause());
  new IntersectionObserver(es => { thay = es[es.length - 1].isIntersecting; capNhat(); }, { threshold: .25 }).observe(san);
  document.addEventListener("visibilitychange", capNhat);
  // tween 0 giây gọi onComplete NGAY lúc gsap.to chưa trả về: x khai báo trước; luon = true là tween theo tay khách, không tạm dừng
  const tw = (t, v, luon) => new Promise(res => {
    let x = null;
    x = gsap.to(t, Object.assign({}, v, { onComplete() { if (x) { dang.delete(x); dangTay.delete(x); } res(); } }));
    if (x.progress() >= 1) return;
    if (luon) dangTay.add(x);
    else { dang.add(x); if (!chay()) x.pause(); }
  });
  const ngu = s => tw({}, { duration: s });
  const veToi = (k2, giay, ease, luon) => { const a = { l: kh.l, t: kh.t, r: kh.r, b: kh.b }; return tw(a, { l: k2.l, t: k2.t, r: k2.r, b: k2.b, duration: giam ? 0 : giay, ease: ease || "power3.out", onUpdate() { ve(a); } }, luon).then(() => ve(k2)); };
  let tx = 0, ty = 0;
  const datTro = (x, y) => { tx = x; ty = y; tro.style.transform = "translate3d(" + (x - 3) + "px," + (y - 2) + "px,0)"; };
  const diTro = (x, y, giay, ease) => { const x0 = tx, y0 = ty, a = { k: 0 }; return tw(a, { k: 1, duration: giay, ease: ease || "expo.inOut", onUpdate() { datTro(x0 + (x - x0) * a.k, y0 + (y - y0) * a.k); } }); };
  function datNhan(x, y) {
    const w = nhan.offsetWidth, h = nhan.offsetHeight;
    const nx = Math.max(4, Math.min(san.clientWidth - w - 4, x + 14)), ny = Math.max(4, Math.min(san.clientHeight - h - 4, y + 16));
    nhan.style.transform = "translate3d(" + nx + "px," + ny + "px,0)";
  }

  // ---- kéo một góc (dùng chung cho khách và bản tự diễn): góc đối diện là neo ----
  let neo = null, goc = "";
  const diemGoc = (k, gg) => ({ x: gg[1] === "l" ? k.l : k.r, y: gg[0] === "t" ? k.t : k.b });
  function batDauKeo(gg) {
    const k = khungCua(o); goc = gg;
    neo = { x: gg[1] === "l" ? k.r : k.l, y: gg[0] === "t" ? k.b : k.t };
    khay.classList.add("keo"); nhan.classList.add("hien");
  }
  function keoToi(x, y) {
    const bl = X[0].l - g, br = X[C - 1].r + g, bt = Y[0].t - g - dau, bb = Y[R - 1].b + g;
    const nhoW = X[0].r - X[0].l + 2 * g, nhoH = Y[0].b - Y[0].t + 2 * g + dau;
    x = Math.max(bl, Math.min(br, x)); y = Math.max(bt, Math.min(bb, y));
    let l, r, t, b;
    if (goc[1] === "l") { r = neo.x; l = Math.min(x, r - nhoW); } else { l = neo.x; r = Math.max(x, l + nhoW); }
    if (goc[0] === "t") { b = neo.y; t = Math.min(y, b - nhoH); } else { t = neo.y; b = Math.max(y, t + nhoH); }
    ve({ l, t, r, b }); datNhan(x, y);
  }
  function thaKeo(luon) {
    khay.classList.remove("keo"); nhan.classList.remove("hien");
    if (hien) o = hien;
    return veToi(khungCua(o), .24, "power3.out", luon);
  }
  function datKieu(ten, luon) { o = KIEU(ten); return veToi(khungCua(o), .55, "power3.inOut", luon); }

  // ---- tự diễn ----
  const HUY = {};
  async function keoBangTro(c, gg, cot, hang) {
    const d0 = diemGoc(khungCua(o), gg);
    const dich = { x: gg[1] === "l" ? X[cot].l - g : X[cot].r + g, y: gg[0] === "t" ? Y[hang].t - g - dau : Y[hang].b + g };
    tro.classList.add("hien");
    await c(diTro(d0.x, d0.y, .7));
    batDauKeo(gg); datNhan(d0.x, d0.y);
    await c(ngu(.22));
    const a = { k: 0 };
    await c(tw(a, { k: 1, duration: 1.15, ease: "power2.inOut", onUpdate() { const x = d0.x + (dich.x - d0.x) * a.k, y = d0.y + (dich.y - d0.y) * a.k; keoToi(x, y); datTro(x, y); } }));
    await c(ngu(.12));
    await c(thaKeo());
  }
  async function bamChe(c, ten) {
    const s = che.querySelector('[data-che="' + ten + '"]'), r = s.getBoundingClientRect(), q = san.getBoundingClientRect();
    tro.classList.add("hien");
    await c(diTro(r.left - q.left + r.width / 2, r.top - q.top + r.height / 2, .65));
    s.classList.add("bam");
    await c(ngu(.14));
    s.classList.remove("bam");
    await c(datKieu(ten));
  }
  async function dien() {
    const p = ++phien, c = pr => pr.then(() => { if (p !== phien) throw HUY; });
    try {
      for (;;) {
        await c(ngu(.9));
        await c(keoBangTro(c, "br", C - 1, R - 1));
        await c(ngu(.55));
        await c(keoBangTro(c, "tl", 0, 0));
        await c(ngu(1.3));
        await c(bamChe(c, "ngang"));
        await c(ngu(1.1));
        await c(bamChe(c, "doc"));
        await c(ngu(1.2));
        tro.classList.remove("hien");
        o = DAU();
        await c(veToi(khungCua(o), .6, "power3.inOut"));
      }
    } catch (e) { if (e !== HUY) throw e; }
  }
  function dung() {
    phien++; clearTimeout(hen);
    dang.forEach(t => t.kill()); dang.clear();
    dangTay.forEach(t => t.kill()); dangTay.clear();
    che.querySelectorAll(".bam").forEach(e => e.classList.remove("bam"));
    tro.classList.remove("hien"); khay.classList.remove("keo"); nhan.classList.remove("hien");
    if (hien) o = hien;
    ve(khungCua(o));
  }
  const henLai = p0 => { if (giam || p0 !== phien) return; clearTimeout(hen); hen = setTimeout(() => { if (p0 === phien) dien(); }, 7000); };

  // ---- khách TỰ kéo góc (chỉ nút trái / ngón đầu tiên, mỗi lúc một lần kéo; huỷ thì khung hít về như thả) ----
  let tay = false, choDoi = false;
  khay.addEventListener("pointerdown", e => {
    const t = e.target.closest(".kg-goc");
    if (!t || tay || e.button || e.isPrimary === false) return;
    e.preventDefault(); dung(); goi.classList.add("an");
    const p0 = phien, gg = t.dataset.g, q0 = san.getBoundingClientRect(), d0 = diemGoc(khungCua(o), gg);
    const lx = e.clientX - q0.left - d0.x, ly = e.clientY - q0.top - d0.y;
    let xong = false;
    tay = true; batDauKeo(gg); datNhan(d0.x, d0.y);
    const mv = ev => { const q = san.getBoundingClientRect(); keoToi(ev.clientX - q.left - lx, ev.clientY - q.top - ly); };
    const SK = ["pointerup", "pointercancel", "lostpointercapture"];
    const up = () => {
      if (xong) return;
      xong = true;
      t.removeEventListener("pointermove", mv); SK.forEach(k => t.removeEventListener(k, up));
      const hit = thaKeo(true);
      tay = false;
      hit.then(() => henLai(p0));
      if (choDoi) doiCo();
    };
    try { t.setPointerCapture(e.pointerId); } catch (err) {}
    t.addEventListener("pointermove", mv); SK.forEach(k => t.addEventListener(k, up));
  });
  che.addEventListener("click", e => {
    const s = e.target.closest("[data-che]"); if (!s || tay) return;
    dung(); goi.classList.add("an");
    const p0 = phien; datKieu(s.dataset.che, true).then(() => henLai(p0));
  });

  // ---- khởi động + đổi cỡ màn hình ----
  dungLuoi(); doLuoi(); ve(khungCua(o));
  let rongCu = san.clientWidth;
  function doiCo() {
    if (tay) { choDoi = true; return; }
    choDoi = false;
    if (Math.abs(san.clientWidth - rongCu) < 1) return;
    rongCu = san.clientWidth;
    const doiKho = (hep.matches ? 4 : 6) !== C;
    if (doiKho) { dung(); dungLuoi(); o = giam ? VUA() : DAU(); }
    doLuoi(); ve(khungCua(o));
    if (doiKho && !giam) dien();
  }
  new ResizeObserver(doiCo).observe(san);
  if (giam) { o = VUA(); ve(khungCua(o)); }
  else { datTro(san.clientWidth * .5, san.clientHeight * .9); dien(); }
  // tay nắm để đo / thử
  window.ssKg = { ep(v) { thay = v; capNhat(); }, dien, dung, datKieu: t => datKieu(t, true), trangThai: () => ({ o, hien, kh, C, R, tay, phien, thay, dangChay: dang.size, dangTay: dangTay.size, soBat: os.filter(e => e.classList.contains("bat")).length }) };
  }
});
