// ===== Section KHAY bản 2 (06/10): một khay ở giữa, 6 app vây quanh; ảnh bay tới từng app rồi toả ra cùng lúc; khách tự kéo được =====
// Không có GSAP (CDN hỏng) thì gỡ class kt-on, trang dùng lại bản 1 ngay bên dưới. "Giảm chuyển động": hiện sẵn 6 app đã nhận ảnh.
document.addEventListener("DOMContentLoaded", () => {
  const sec = document.getElementById("shelf"), san = document.getElementById("ktSan");
  if (!sec || !san) return;
  if (!window.gsap) { sec.classList.remove("kt-on"); return; }
  const T = k => window.ssT ? window.ssT(k) : k;
  const giam = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hep = matchMedia("(max-width:720px)");
  const khay = document.getElementById("ktKhay"), luoi = document.getElementById("ktLuoi"), day = document.getElementById("ktDay");
  const tro = document.getElementById("ktTro"), goi = document.getElementById("ktGoi");

  // ---- 4 ảnh trong khay ----
  const MAU = [
    '<span class="kt-thi"><i style="height:40%"></i><i style="height:75%"></i><i style="height:55%"></i></span>',
    '<b>+18%</b><span class="kt-thi"><i style="height:45%"></i><i style="height:90%"></i><i style="height:60%"></i><i style="height:70%"></i></span>',
    '<span class="kt-thi"><em></em><em></em><em></em></span>',
    '<span class="kt-thi"><u></u><s></s></span>'
  ];
  const anh = n => { const d = document.createElement("div"); d.className = "kt-th t" + (n + 1); d.dataset.n = n; d.innerHTML = MAU[n]; return d; };
  for (let n = 0; n < 4; n++) luoi.append(anh(n));
  const ths = [...luoi.children];
  const anhAn = n => { const a = anh(n); a.classList.add("an"); return a; };

  // ---- 6 app: mỗi app tự biết nhận ảnh theo kiểu của nó ----
  const chat = o => Object.assign(o, {
    lop: "chat",
    html: '<div class="kt-bar"><i></i>' + o.ten + "</div>" + (o.rail ? '<div class="kt-body"><div class="kt-rail"><i></i><i></i><i></i></div><div class="kt-main">' : "") +
      '<div class="kt-top"><span class="kt-ava">' + o.ava + '</span><span><b data-k="' + o.nhom + '"></b><small data-k="khOnline"></small></span></div>' +
      '<div class="kt-msgs"><div class="kt-b trai" data-k="' + o.m1 + '"></div></div>' + (o.rail ? "</div></div>" : ""),
    nhan(inn, n) {
      const m = inn.querySelector(".kt-msgs"), b = document.createElement("div"), a = anhAn(n);
      b.className = "kt-b anh kt-moi"; b.append(a); m.append(b);
      while (m.children.length > 4) m.firstElementChild.remove();
      return { el: a, sau() {
        setTimeout(() => {
          if (!m.isConnected) return;
          const r = document.createElement("div"); r.className = "kt-b trai kt-moi"; r.dataset.k = o.reply; r.textContent = T(o.reply); m.append(r);
          while (m.children.length > 4) m.firstElementChild.remove();
        }, 520);
      } };
    }
  });
  const thietKe = o => Object.assign(o, {
    html: '<div class="kt-bar"><i></i>' + o.ten + '</div><div class="kt-2c"><div class="kt-can"><div class="kt-board"' + (o.frame ? ' data-kten="' + o.frame + '"' : "") + "></div></div>" +
      '<div class="kt-lay">' + o.lops.map(k => '<div><i></i><span data-k="' + k + '"></span></div>').join("") + "</div></div>",
    nhan(inn, n) {
      const a = anhAn(n); inn.querySelector(".kt-board").replaceChildren(a);
      return { el: a, sau() {
        const lay = inn.querySelector(".kt-lay");
        if (lay.querySelector(".moi")) return;
        const d = document.createElement("div"); d.className = "moi kt-moi"; d.innerHTML = '<i></i><span data-k="khLayer">' + T("khLayer") + "</span>"; lay.prepend(d);
      } };
    }
  });
  const APP = [
    chat({ ten: "Zalo", ic: "zalo", chu: "Z", acc: "#0068ff", ava: "K", nhom: "khZName", m1: "khZ1", reply: "khZReply" }),
    chat({ ten: "Lark", ic: "lark", chu: "L", acc: "#245bdb", ava: "E", nhom: "khName", m1: "khM1", reply: "khReply" }),
    chat({ ten: "Microsoft Teams", ic: "teams", chu: "T", acc: "#5b5fc7", ava: "H", nhom: "khTeam", m1: "khT1", reply: "khTReply", rail: true }),
    { ten: "Premiere Pro", ic: "pr", chu: "Pr", lop: "pr", acc: "#9999ff",
      html: '<div class="kt-bar"><i></i>Premiere Pro</div><div class="kt-prm"><span>Program</span></div><div class="kt-prt"><div class="kt-ph"></div>' +
        '<div class="kt-tr"><b>V2</b><span class="kt-lane v2"></span></div>' +
        '<div class="kt-tr"><b>V1</b><span class="kt-lane"><i class="kt-clip v" style="left:0;width:38%"></i><i class="kt-clip v" style="left:40%;width:56%"></i></span></div>' +
        '<div class="kt-tr"><b>A1</b><span class="kt-lane"><i class="kt-clip a" style="left:0;width:38%"></i><i class="kt-clip a" style="left:40%;width:56%"></i></span></div></div>',
      nhan(inn, n) {
        const a = anhAn(n); inn.querySelector(".kt-prm").replaceChildren(a);
        return { el: a, sau() { inn.querySelector(".v2").innerHTML = '<i class="kt-clip g kt-moi" style="left:49%;width:32%" data-k="khClip">' + T("khClip") + "</i>"; } };
      } },
    thietKe({ ten: "Photoshop", ic: "ps", chu: "Ps", lop: "ps", acc: "#31a8ff", lops: ["khPsL1", "khPsL2"] }),
    thietKe({ ten: "Figma", ic: "fig", chu: "F", lop: "fig", acc: "#0d99ff", lops: ["khFigL1", "khFigL2"], frame: "khFigFrame" })
  ];
  const wins = APP.map((o, i) => {
    const w = document.createElement("div"); w.className = "kt-win w" + i;
    w.innerHTML = '<span class="kt-ic ' + o.ic + '">' + o.chu + '</span><div class="kt-in ' + o.lop + '" style="--acc:' + o.acc + '">' + o.html + "</div>" +
      '<span class="kt-ok"><svg viewBox="0 0 12 12"><path d="M2.5 6.4 5 8.8 9.6 3.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    san.insertBefore(w, khay); return w;
  });
  const ins = wins.map(w => w.querySelector(".kt-in"));
  const dich = () => {
    san.querySelectorAll("[data-k]").forEach(e => { e.textContent = T(e.dataset.k); });
    san.querySelectorAll("[data-kten]").forEach(e => { e.dataset.ten = T(e.dataset.kten); });
  };
  dich(); window.ssKtRelang = dich;
  const goc = ins.map(e => e.innerHTML);

  // ---- đo: hop = hình chữ nhật thật trên màn (đã xoay), bo = theo bố cục (chưa xoay) ----
  const hop = el => { const r = el.getBoundingClientRect(), s = san.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
  const bo = el => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  const tam = i => { const d = bo(wins[i]); return { x: d.x + d.w / 2, y: d.y + d.h / 2 }; };
  const lam = v => Math.round(v * 10) / 10;

  // ---- dây nối khay ↔ app ----
  const NS = "http://www.w3.org/2000/svg", dayS = [], dayN = [];
  wins.forEach(() => {
    const a = document.createElementNS(NS, "path"), b = document.createElementNS(NS, "path");
    a.setAttribute("class", "n"); b.setAttribute("class", "s"); day.append(a, b); dayN.push(a); dayS.push(b);
  });
  function veDay() {
    const W = san.clientWidth, H = san.clientHeight, S = hop(khay);
    if (!W || !H) return;
    day.setAttribute("viewBox", "0 0 " + W + " " + H);
    wins.forEach((w, i) => {
      const r = bo(w); let d;
      if (hep.matches) {
        const ax = S.x + S.w * (i < 3 ? .3 : .7), ay = S.y + S.h, bx = r.x + r.w / 2, by = r.y, my = (ay + by) / 2;
        d = "M" + lam(ax) + "," + lam(ay) + " C" + lam(ax) + "," + lam(my) + " " + lam(bx) + "," + lam(my) + " " + lam(bx) + "," + lam(by);
      } else {
        const trai = i < 3, ax = trai ? S.x : S.x + S.w, ay = S.y + S.h * (.28 + .22 * (i % 3)), bx = trai ? r.x + r.w : r.x, by = r.y + r.h / 2, mx = (ax + bx) / 2;
        d = "M" + lam(ax) + "," + lam(ay) + " C" + lam(mx) + "," + lam(ay) + " " + lam(mx) + "," + lam(by) + " " + lam(bx) + "," + lam(by);
      }
      dayN[i].setAttribute("d", d); dayS[i].setAttribute("d", d);
      const L = dayS[i].getTotalLength(); dayS[i].dataset.l = L;
      dayS[i].style.strokeDasharray = L + " " + (L + 2);
      dayS[i].style.strokeDashoffset = w.classList.contains("co") ? 0 : L + 1;
    });
  }
  new ResizeObserver(veDay).observe(san);
  veDay();

  // ---- chuyển động: mọi tween tự chạy đều tạm dừng khi section ra khỏi màn hình ----
  let thay = false, phien = 0, hen = 0;
  const dang = new Set(), chay = () => thay && !document.hidden;
  const capNhat = () => dang.forEach(t => chay() ? t.resume() : t.pause());
  new IntersectionObserver(es => { thay = es[es.length - 1].isIntersecting; capNhat(); }, { threshold: .25 }).observe(san);
  document.addEventListener("visibilitychange", capNhat);
  // luon = true: tween của thao tác do khách kéo, không tạm dừng, không bị huỷ theo phiên tự chạy
  // ☠️ tween 0 giây gọi onComplete NGAY trong lúc gsap.to chưa trả về: x phải khai báo trước, và tween đã xong thì không đưa vào sổ
  const tw = (t, v, luon) => new Promise(res => {
    let x = null;
    x = gsap.to(t, Object.assign({}, v, { onComplete() { if (x) dang.delete(x); res(); } }));
    if (!luon && x.progress() < 1) { dang.add(x); if (!chay()) x.pause(); }
  });
  const ngu = s => tw({}, { duration: s });
  let tx = 0, ty = 0;
  const datTro = (x, y) => { tx = x; ty = y; tro.style.transform = "translate3d(" + x + "px," + y + "px,0)"; };
  const diTro = (x, y, giay) => { const x0 = tx, y0 = ty, o = { k: 0 }; return tw(o, { k: 1, duration: giay, ease: "power2.inOut", onUpdate() { datTro(x0 + (x - x0) * o.k, y0 + (y - y0) * o.k); } }); };
  function bong(n, r) {
    const b = anh(n); b.classList.add("kt-bong");
    b.style.cssText = "left:" + r.x + "px;top:" + r.y + "px;width:" + r.w + "px;height:" + r.h + "px;font-size:" + getComputedStyle(ths[n]).fontSize;
    san.append(b); return b;
  }
  // bay theo đường vồng (cong px) từ ô ảnh r0 tới tâm đích
  function bay(b, r0, den, giay, cong, coTro) {
    const x0 = r0.x + r0.w / 2, y0 = r0.y + r0.h / 2, o = { k: 0 };
    return tw(o, { k: 1, duration: giay, ease: "power2.inOut", onUpdate() {
      const x = x0 + (den.x - x0) * o.k, y = y0 + (den.y - y0) * o.k - cong * Math.sin(Math.PI * o.k);
      b.style.left = (x - r0.w / 2) + "px"; b.style.top = (y - r0.h / 2) + "px";
      if (coTro) datTro(x + r0.w * .12, y + r0.h * .1);
    } });
  }
  function song(x, y) {
    for (let k = 0; k < 2; k++) {
      const r = document.createElement("i"); r.className = "kt-song"; r.style.left = x + "px"; r.style.top = y + "px"; san.append(r);
      gsap.fromTo(r, { scale: .3, opacity: .95 }, { scale: 2.4 + k, opacity: 0, duration: .7 + k * .15, delay: k * .1, ease: "power2.out", onComplete: () => r.remove() });
    }
  }
  // Ảnh đáp vào app i: app tự dựng chỗ nhận, bản sao thu về đúng chỗ đó rồi nhường cho ảnh thật
  async function tha(b, i, n, luon) {
    const k = APP[i].nhan(ins[i], n), r = hop(k.el);
    await tw(b, { left: r.x, top: r.y, width: r.w, height: r.h, rotation: 0, scale: 1, duration: giam ? 0 : .22, ease: "power2.out" }, luon);
    k.el.classList.remove("an"); b.remove(); k.sau();
    if (!giam) song(r.x + r.w / 2, r.y + r.h / 2);
    wins[i].classList.add("co"); wins[i].classList.remove("den");
    gsap.to(dayS[i], { opacity: 1, strokeDashoffset: 0, duration: giam ? 0 : .45, ease: "power2.out" });
  }
  async function xoaHet() {
    await tw(ins, { opacity: .25, duration: .28 });
    ins.forEach((e, i) => { e.innerHTML = goc[i]; wins[i].classList.remove("co", "den"); });
    dich();
    dayS.forEach(s => gsap.set(s, { opacity: 0, strokeDashoffset: +s.dataset.l + 1 }));
    await tw(ins, { opacity: 1, duration: .3 });
  }

  // ---- tự diễn: 2 lần kéo chậm bằng con trỏ cho dễ hiểu, rồi 4 ảnh toả ra cùng lúc ----
  const HUY = {};
  async function keo(c, n, i, nhip) {
    const t = ths[n], r = hop(t);
    tro.classList.add("hien");
    await c(diTro(r.x + r.w * .62, r.y + r.h * .6, .55 * nhip));
    t.classList.add("di");
    const b = bong(n, r); gsap.to(b, { scale: 1.1, rotation: i < 3 ? -5 : 5, duration: .18 });
    await c(ngu(.16));
    wins[i].classList.add("den");
    await c(bay(b, r, tam(i), .95 * nhip, 46, true));
    await c(tha(b, i, n));
    t.classList.remove("di");
  }
  async function phong(c, n, i, tre) {
    await c(ngu(tre));
    const r = hop(ths[n]), b = bong(n, r);
    wins[i].classList.add("den");
    await c(bay(b, r, tam(i), .72, 30 + 14 * (i % 3), false));
    await c(tha(b, i, n));
  }
  async function dien() {
    const p = ++phien, c = pr => pr.then(() => { if (p !== phien) throw HUY; });
    try {
      for (;;) {
        await c(ngu(.7));
        await c(keo(c, 1, 0, 1));
        await c(ngu(.45));
        await c(keo(c, 3, 3, .85));
        await c(ngu(.35));
        tro.classList.remove("hien");
        await c(Promise.all([[0, 1], [2, 2], [1, 4], [0, 5]].map((x, k) => phong(c, x[0], x[1], k * .16))));
        await c(ngu(3.2));
        await c(xoaHet());
      }
    } catch (e) { if (e !== HUY) throw e; }
  }
  function dung() {
    phien++; clearTimeout(hen);
    dang.forEach(t => t.kill()); dang.clear();
    san.querySelectorAll(".kt-bong:not(.tay)").forEach(e => e.remove());
    san.querySelectorAll(".kt-th.an").forEach(e => e.classList.remove("an"));
    ths.forEach(t => t.classList.remove("di"));
    wins.forEach(w => w.classList.remove("den"));
    tro.classList.remove("hien"); gsap.set(ins, { opacity: 1 });
  }

  // ---- khách TỰ kéo: nắm một ảnh trong khay, thả vào app nào cũng được ----
  luoi.addEventListener("pointerdown", e => {
    const t = e.target.closest(".kt-th"); if (!t || t.classList.contains("di")) return;
    e.preventDefault(); dung(); goi.classList.add("an");
    const n = +t.dataset.n, r = hop(t), b = bong(n, r), s0 = san.getBoundingClientRect();
    const lx = e.clientX - s0.left - r.x, ly = e.clientY - s0.top - r.y;
    let dich2 = -1;
    b.classList.add("tay"); t.classList.add("di"); gsap.to(b, { scale: 1.08, rotation: -4, duration: .15 });
    const mv = ev => {
      const s = san.getBoundingClientRect(), px = ev.clientX - s.left, py = ev.clientY - s.top;
      b.style.left = (px - lx) + "px"; b.style.top = (py - ly) + "px";
      let m = -1;
      wins.forEach((w, i) => { const q = bo(w); if (px > q.x - 10 && px < q.x + q.w + 10 && py > q.y - 10 && py < q.y + q.h + 10) m = i; });
      if (m !== dich2) { if (dich2 >= 0) wins[dich2].classList.remove("den"); if (m >= 0) wins[m].classList.add("den"); dich2 = m; }
    };
    const up = async () => {
      t.removeEventListener("pointermove", mv); t.removeEventListener("pointerup", up); t.removeEventListener("pointercancel", up);
      b.classList.remove("tay");
      if (dich2 >= 0) await tha(b, dich2, n, true);
      else { await tw(b, { left: r.x, top: r.y, scale: 1, rotation: 0, duration: giam ? 0 : .28, ease: "power2.out" }, true); b.remove(); }
      t.classList.remove("di");
      if (!giam) { clearTimeout(hen); hen = setTimeout(() => { const p = phien; xoaHet().then(() => { if (p === phien) dien(); }); }, 7000); }
    };
    try { t.setPointerCapture(e.pointerId); } catch (err) {}
    t.addEventListener("pointermove", mv); t.addEventListener("pointerup", up); t.addEventListener("pointercancel", up);
  });

  if (giam) {
    APP.forEach((o, i) => { const k = o.nhan(ins[i], i % 4); k.el.classList.remove("an"); k.sau(); wins[i].classList.add("co"); });
    veDay(); dayS.forEach(s => { s.style.opacity = 1; });
  } else {
    datTro(san.clientWidth * .5, san.clientHeight * .92);
    dien();
  }
  // tay nắm để đo / thử: ép coi như đang trong màn hình, chạy lại, dừng, thả thẳng ảnh n vào app i
  window.ssKt = { ep(v) { thay = v; capNhat(); }, dien, dung, xoaHet, nhan(i, n) { const r = hop(ths[n]); return tha(bong(n, r), i, n, true); }, wins, dang };
});
