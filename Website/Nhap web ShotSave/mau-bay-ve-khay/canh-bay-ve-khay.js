      // 5. Khay (07/11 MẪU "ý tưởng bay về khay", anh chọn khung C): ảnh, bảng màu, chữ trôi ở nhiều độ sâu; lần lượt theo vệt sáng
      //    cam bay về khay, khay đếm lên; cuối cùng bấm một ô là nhấc lên ghim. Chú thích dưới sân giữ nguyên (f6t / f6p).
      () => {
        const tl = gsap.timeline(), w = W(), h = H(), doc = w < h * .9;
        const MAU = ["#2b2f5e", "#7b5bd6", "#f6a76e", "#f86820", "#e9d6a8"];
        const ve = (p, loai) => {
          if (loai === "anh") video(p, "left:0;top:0;width:100%;height:100%;border-radius:0", .62);
          else if (loai === "mau") { p.classList.add("bv-mau"); p.innerHTML = MAU.map(c => '<span style="background:' + c + '"></span>').join(""); }
          else if (loai === "aa") { p.classList.add("bv-aa"); p.textContent = "Aa"; }
          else p.classList.add("bv-bien");
        };
        // tiêu đề: trái trên (máy tính) / trên cùng (điện thoại)
        const td = el(san, "bv-tieu", doc ? `left:${w * .05}px;top:${h * .04}px;font-size:calc(var(--u)*7)` : `left:${w * .05}px;top:${h * .1}px`, L("bvT1") + "<br><em>" + L("bvT2") + "</em>");
        const tdr = R(td);
        if (!doc) el(san, "bv-phu", `left:${w * .05}px;top:${tdr.y + tdr.h + h * .04}px;width:${Math.min(w * .3, 380)}px`, L("bvPhu"));
        // khay thật của app: thanh + hàng 3 ô
        const kw = doc ? w * .86 : Math.min(w * .34, 430), kx = (w - kw) / 2;
        el(san, "bv-sang", `left:${w * .5 - kw}px;top:${h * .55}px;width:${kw * 2}px;height:${h * .6}px`);
        const K = el(san, "bv-khay", `left:${kx}px;width:${kw}px`, '<div class="kb">' + LOGO + "<b>" + L("khay") + '</b><em><span class="sl">21</span> ' + L("anh") + '</em></div><div class="hang"></div>');
        const hang = K.querySelector(".hang"), sl = K.querySelector(".sl");
        const o = ["anh", "mau", "bien"].map((l, i) => { const x = el(hang, "bv-o"); const n = el(x, "bv-n"); ve(n, l); el(x, "so", null, "#" + (19 + i)); return x; });
        K.style.top = (h - K.offsetHeight - h * .05) + "px";
        const kr = R(K), dich = { x: kr.x + kr.w / 2, y: kr.y };
        const diem = el(san, "bv-diem", `left:${dich.x}px;top:${dich.y}px;opacity:0`);
        tl.to(diem, { opacity: 1, duration: .5 }, 1.2);
        // các tấm trôi: [loại, x, y, rộng (theo w), độ sâu 0 gần .. 1 xa, xoay, có bay về không (thứ tự)]
        const DS = doc
          ? [["anh", .52, .2, .34, 0, -4, 3], ["mau", .1, .24, .28, .45, 6, 0], ["aa", .4, .4, .22, .1, 5, 2], ["bien", .06, .42, .3, .3, -8, 1], ["mau", .7, .45, .24, .2, -6, 0], ["bien", .64, .3, .3, .1, 4, 4], ["anh", .28, .28, .18, .85, 10, 0]]
          : [["anh", .54, .08, .2, 0, -4, 3], ["mau", .78, .16, .14, .5, -8, 0], ["aa", .66, .36, .12, .12, 5, 2], ["bien", .42, .38, .15, .35, -8, 1], ["mau", .8, .44, .13, .2, 6, 0], ["bien", .73, .6, .13, .08, 4, 4], ["anh", .4, .22, .09, .85, 10, 0], ["aa", .9, .04, .08, .9, -12, 0]];
        const bay = [];
        DS.forEach(([loai, fx, fy, fw, d, xoay, thu], i) => {
          const cw = w * fw, ch = loai === "aa" ? cw * .7 : cw * .62, x = w * fx, y = h * fy;
          const t = el(san, "bv-the", `left:${x}px;top:${y}px;width:${cw}px;height:${ch}px;z-index:${10 - Math.round(d * 6)}`);
          ve(t, loai);
          if (loai === "aa") t.style.fontSize = ch * .5 + "px";
          const k = 1 - d * .45;
          gsap.set(t, { transformOrigin: "0 0", scale: k, rotation: xoay, filter: "blur(" + (d * 5).toFixed(1) + "px)", opacity: 0 });
          tl.to(t, { opacity: 1 - d * .4, duration: .5, ease: "power2.out" }, .25 + i * .07);
          tl.to(t, { y: (i % 2 ? -1 : 1) * h * .015, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: 2 }, .3);   // trôi nhẹ
          // vệt sáng từ tấm về khay
          const cx = x + cw / 2, cy = y + ch / 2, dx = dich.x - cx, dy = dich.y - cy, dai = Math.hypot(dx, dy);
          const tia = el(san, "bv-tia", `left:${cx}px;top:${cy}px;width:${dai}px;opacity:${.55 - d * .35}`);
          gsap.set(tia, { rotation: Math.atan2(dy, dx) * 180 / Math.PI, scaleX: 0, transformOrigin: "0 50%" });   // gsap giu goc xoay (dat bang transform inline thi scaleX(0) lam mat goc)
          tl.to(tia, { scaleX: 1, duration: .8, ease: "power2.out" }, .7 + i * .06);   // 07/11 anh khoanh: moi vet phai cham CUNG mot diem tren mep khay, khong dung lo lung
          if (thu) bay[thu - 1] = { t, tia, loai, cw, x, y, xoay };
        });
        // bốn tấm lần lượt bay về khay; ô mới vào bên phải, các ô cũ dồn sang trái
        bay.forEach((b, i) => {
          const at = 1.5 + i * .85;
          tl.to(b.tia, { opacity: .95, duration: .3, ease: "power2.in" }, at);
          tl.add(() => {
            const r = R(o[2]), k = r.w / b.cw;
            gsap.to(b.t, { x: r.x - b.x, y: r.y - b.y, overwrite: "auto", scale: k, rotation: 0, filter: "blur(0px)", opacity: 1, duration: .55, ease: "power3.in" });
          }, at + .25);
          tl.add(() => {
            b.t.style.visibility = "hidden";
            const cu = o.map(x => x.querySelector(".bv-n").outerHTML);
            o[0].querySelector(".bv-n").outerHTML = cu[1]; o[1].querySelector(".bv-n").outerHTML = cu[2];
            const moi = document.createElement("div"); moi.className = "bv-n"; ve(moi, b.loai); o[2].querySelector(".bv-n").replaceWith(moi);
            o.forEach((x, j) => { x.querySelector(".so").textContent = "#" + (20 + i + j); });
            sl.textContent = 22 + i;
            gsap.fromTo(diem, { scale: 2.4 }, { scale: 1, duration: .5, ease: "power2.out" });
            gsap.fromTo(o, { x: 14 }, { x: 0, duration: .3, ease: "power2.out", stagger: .03 });
            gsap.fromTo(K, { boxShadow: "0 0 0 1px rgb(255 255 255/9%),0 40px 80px -30px #000,0 0 160px -10px rgb(248 104 32/85%)" }, { boxShadow: "0 0 0 1px rgb(255 255 255/9%),0 40px 80px -30px #000,0 0 120px -30px rgb(248 104 32/45%)", duration: .6 });
          }, at + .82);
          tl.to(b.tia, { opacity: 0, duration: .35 }, at + .82);
        });
        // bấm một ô: nhấc lên thành ảnh ghim
        const c = conTro(w * .9, h * .9); gsap.set(c, { opacity: 0 });
        tl.to(c, { opacity: 1, duration: .2 }, 5);
        tl.add(() => { const r = R(o[1]); gsap.to(c, { x: r.x + r.w / 2, y: r.y + r.h / 2, duration: .5, ease: "power2.inOut" }); }, 5.05);
        bam(tl, c, 5.6);
        tl.add(() => {
          o[1].classList.add("ghim-on"); el(o[1], "pi", null, PIN);
          gsap.to(o[1], { y: -h * .06, scale: 1.18, duration: .45, ease: "back.out(2)" });
        }, 5.65);
        tl.to(c, { opacity: 0, duration: .2 }, 6.1);
        nhan(tl, L("bvNh"), 6.15, doc ? "top:auto;bottom:" + (h - kr.y + 10) + "px" : "top:auto;bottom:" + (h - kr.y + 14) + "px");
        return tl.to({}, { duration: 1.6 }, 6.25);
      },
