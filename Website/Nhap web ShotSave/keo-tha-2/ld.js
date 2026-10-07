// ===== Section LÝ DO (07/10): câu chuyện của anh kể thành 3 câu (anh: "gom lại thành 03 slide", "bán câu chuyện và nỗi đau, không bán hàng").
// 3 câu luôn nằm đủ dưới sân, câu đang kể thì đậm màu + vạch tiến độ chạy; sân diễn theo từng câu.
// Câu 1 (nỗi đau): mỗi ngày một ý tưởng bật lên. Câu 2 (nỗi đau): ý tưởng lần lượt mờ rồi mất, chữ "đi đâu mất" trên tiêu đề mờ theo.
// Câu 3 (cái khay): con trỏ gạt công tắc, khay hiện ra, 5 ý tưởng bay vào khay. Khách tự gạt công tắc được, bấm vào câu nào thì kể lại từ câu đó.
// Không dùng GSAP: trạng thái đổi bằng class + transition CSS; đồng hồ chỉ trôi khi section đang trong màn hình.
document.addEventListener("DOMContentLoaded", () => {
  const khoi = document.getElementById("ld"), san = document.getElementById("ldSan");
  if (!khoi || !san) return;
  khoi.classList.add("ld-on");
  try { khoiDong(); } catch (e) { khoi.classList.remove("ld-on", "cho", "vao", "ld-tinh"); throw e; }
  function khoiDong() {
  const giam = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lay = id => document.getElementById(id);
  const nut = lay("ldNut"), dem = lay("ldDem"), goi = lay("ldGoi"), tro = lay("ldTro"), lop = lay("ldThe");
  const os = [...san.querySelectorAll(".ld-o")], chos = os.map(o => o.querySelector(".ld-cho")), khe = [...lay("ldKl").children];
  const phu = [...lay("ldPhu").querySelectorAll(".ld-cau")], doan = phu.map(q => q.querySelector(".ld-vach"));
  const noiCu = [...lay("ldNoiCu").children];
  const N = os.length;
  const the = os.map((o, i) => { const e = document.createElement("div"); e.className = "ld-y y" + (i + 1); e.style.setProperty("--xoay", (i % 2 ? -4 : 4) + "deg"); lop.append(e); return e; });
  chos.forEach((c, i) => c.style.setProperty("--tre", (i * .07).toFixed(2) + "s"));

  // ---- trạng thái: mỗi ý tưởng là an (chưa có) | sang (đang ở ô ngày) | mat (đã mất) | luu (nằm trong khay) ----
  const tt = the.map(() => "an");
  let bat = false;
  // vị trí một ô so với sân, cộng theo chuỗi offsetParent nên không bị transform (đoạn vào, khay đang trồi) làm lệch
  // (offsetLeft tính từ mép TRONG viền của offsetParent nên phải cộng thêm viền của từng tầng: khay có viền 1 px, đo 07/10 thẻ lệch 1 px)
  const choCua = e => { let x = 0, y = 0, n = e; while (n && n !== san) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; if (n && n !== san) { x += n.clientLeft; y += n.clientTop; } } return { l: x, t: y, w: e.offsetWidth, h: e.offsetHeight }; };
  function xep(i) { const r = choCua(tt[i] === "luu" ? khe[i] : chos[i]), st = the[i].style; st.left = r.l + "px"; st.top = r.t + "px"; st.width = r.w + "px"; st.height = r.h + "px"; }
  function soLai() { dem.textContent = tt.filter(s => s === "luu").length; khoi.style.setProperty("--mat", bat ? 0 : tt.filter(s => s === "mat").length); }
  function dat(i, s) {
    tt[i] = s;
    the[i].classList.toggle("sang", s === "sang" || s === "luu"); the[i].classList.toggle("mat", s === "mat"); the[i].classList.toggle("luu", s === "luu");
    os[i].classList.toggle("co", s !== "an"); os[i].classList.toggle("mat", s === "mat"); os[i].classList.toggle("luu", s === "luu");
    if (noiCu[i]) { noiCu[i].classList.toggle("co", s === "sang"); noiCu[i].classList.toggle("mat", s === "mat"); }   // nơi tạm của ý tưởng đó
    xep(i); soLai();
  }
  function datBat(v) { bat = v; khoi.classList.toggle("bat", v); nut.setAttribute("aria-checked", v ? "true" : "false"); soLai(); }
  const datTro = (x, y) => { tro.style.transform = "translate3d(" + (x - 3) + "px," + (y - 2) + "px,0)"; };
  const troToiNut = () => { const r = choCua(nut); datTro(r.l + r.w * .5, r.t + r.h * .55); };

  // ---- đồng hồ: chỉ trôi khi section trong màn hình; đẩy luôn thanh tiến độ của đoạn đang kể ----
  let thay = false, phien = 0, hen = 0, daVao = giam, doanDang = -1, tong = 1, qua = 0;
  const HUY = {};
  const chay = () => thay && !document.hidden;
  const ngu = (ms, p) => giam ? Promise.resolve() : new Promise((res, rej) => {
    let con = ms, truoc = performance.now();
    const id = setInterval(() => {
      const gio = performance.now(), d = Math.min(gio - truoc, 100); truoc = gio;
      if (p !== phien) { clearInterval(id); rej(HUY); return; }
      if (!chay()) return;
      con -= d; qua += d;
      if (doanDang >= 0) doan[doanDang].style.setProperty("--k", Math.min(1, qua / tong).toFixed(3));
      if (con <= 0) { clearInterval(id); res(); }
    }, 40);
  });
  function vaoDoan(i, ms) { doanDang = i; tong = ms; qua = 0; doan.forEach((b, j) => b.style.setProperty("--k", j < i ? 1 : 0)); phu.forEach((q, j) => q.classList.toggle("on", j === i)); }
  // trạng thái ngay TRƯỚC đoạn `tu` (để bấm vào đoạn nào cũng kể lại được từ đó)
  function nen(tu) {
    datBat(false);
    nut.classList.remove("nhay", "bam"); tro.classList.remove("hien");
    datTro(san.clientWidth * .84, san.clientHeight * .86);
    for (let i = 0; i < N; i++) dat(i, tu <= 0 ? "an" : tu === 1 ? "sang" : "mat");
  }
  async function luuHet(p) {           // bật công tắc: ý tưởng hiện lại ở ô ngày rồi lần lượt bay vào khay (1,85 giây)
    datBat(true);
    for (let i = 0; i < N; i++) { if (tt[i] !== "luu") dat(i, "sang"); await ngu(70, p); }
    await ngu(250, p);
    for (let i = 0; i < N; i++) { dat(i, "luu"); await ngu(150, p); }
    await ngu(500, p);
  }
  async function boHet(p) {            // tắt công tắc: khay biến mất, ý tưởng về ô ngày rồi lần lượt mất
    datBat(false);
    for (let i = 0; i < N; i++) { if (tt[i] !== "mat") dat(i, "sang"); await ngu(70, p); }
    await ngu(400, p);
    for (let i = 0; i < N; i++) { dat(i, "mat"); await ngu(200, p); }
  }
  // 3 cảnh (07/10 anh: "gom lại thành 03 slide"; bản đầu 5 cảnh, 22,6 giây một vòng): 3,2 + 2,8 + 6,5 = 12,5 giây.
  // Cảnh 1 có hình NGAY (ý tưởng bật lên từ 0,25 giây), không còn đoạn "đi tìm" với sân trống.
  const D = [3200, 2800, 6500];
  const KE = [
    async p => { await ngu(250, p); for (let i = 0; i < N; i++) { dat(i, "sang"); await ngu(300, p); } await ngu(1450, p); },
    async p => { await ngu(250, p); for (let i = 0; i < N; i++) { dat(i, "mat"); await ngu(240, p); }
      await ngu(350, p); nut.classList.add("nhay"); tro.classList.add("hien"); troToiNut(); await ngu(1000, p); },
    async p => { nut.classList.remove("nhay"); nut.classList.add("bam"); await ngu(150, p); nut.classList.remove("bam");
      await luuHet(p); await ngu(300, p); tro.classList.remove("hien"); goi.classList.remove("an"); await ngu(4200, p); },
  ];
  async function dien(tu) {
    const p = ++phien; clearTimeout(hen);
    try {
      let d = tu || 0;
      for (;;) { nen(d); for (; d < KE.length; d++) { vaoDoan(d, D[d]); await KE[d](p); } d = 0; }
    } catch (e) { if (e !== HUY) throw e; }
  }
  const henLai = p0 => { if (giam) return; clearTimeout(hen); hen = setTimeout(() => { if (p0 === phien) dien(0); }, 9000); };

  // ---- khách tự gạt công tắc / bấm thanh đoạn ----
  nut.addEventListener("click", () => {
    const p = ++phien, moi = !bat; clearTimeout(hen);
    goi.classList.add("an"); tro.classList.remove("hien"); nut.classList.remove("nhay", "bam");
    doanDang = -1; doan.forEach((b, j) => b.style.setProperty("--k", j < (moi ? 3 : 2) ? 1 : 0)); phu.forEach((q, j) => q.classList.toggle("on", j === (moi ? 2 : 1)));
    (moi ? luuHet(p) : boHet(p)).then(() => henLai(p), e => { if (e !== HUY) throw e; });
  });
  phu.forEach((q, i) => q.addEventListener("click", () => { if (giam) return; goi.classList.add("an"); dien(i); }));

  // ---- khởi động ----
  if (giam) { khoi.classList.add("ld-tinh"); datBat(true); for (let i = 0; i < N; i++) dat(i, "luu"); goi.classList.remove("an"); }
  else { nen(0); khoi.classList.add("cho"); }
  const xepHet = () => { for (let i = 0; i < N; i++) xep(i); };
  new ResizeObserver(xepHet).observe(san);
  window.ssLdRelang = xepHet;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(xepHet);
  // đoạn VÀO: nhãn + tiêu đề trồi lên, sân hiện, 5 ô ngày nổi lần lượt, rồi mới bắt đầu kể
  function vao() {
    if (daVao) return;
    daVao = true;
    const p0 = phien;
    khoi.classList.add("vao");
    void khoi.offsetWidth;
    khoi.classList.remove("cho");
    setTimeout(() => { khoi.classList.remove("vao"); if (p0 === phien) dien(0); }, 1000);
  }
  new IntersectionObserver(es => { thay = es[es.length - 1].isIntersecting; if (thay) vao(); }, { threshold: .25 }).observe(san);
  // tay nắm để đo / thử
  window.ssLd = { ep(v) { thay = v; }, dien, trangThai: () => ({ tt: tt.slice(), bat, phien, doanDang, thay, daVao, dem: dem.textContent, phuDang: phu.findIndex(q => q.classList.contains("on")) }) };
  }
});
