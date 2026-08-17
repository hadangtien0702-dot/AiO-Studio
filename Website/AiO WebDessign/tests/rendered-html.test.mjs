import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/**
 * VIET LAI 17/08/2026 — trang XAY MOI 100% theo lenh anh Tien: "khong duoc
 * lay bat ky y tuong cu hoac code cu (ban Gemini)". Ban cu: tag `ban-cu-17-08`.
 *
 * Chot chan cho cac quyet dinh dang hieu luc:
 *  1. Y TUONG GEMINI khong duoc quay lai (headline cu, font cu, class cu).
 *  2. KHONG hua qua so do (moi cau tung bi go co chu dich).
 *  3. Bang gia 16/08: CHI 2 goi Demo $0 + Pro $17/thang. Cam gia cu.
 *  4. Duong nhan don (mailto) phai song.
 *  5. @import font PHAI TRUOC tailwind (loi rot font 17/08).
 */

const appRoot = new URL("../app/", import.meta.url);

/* [17/08] Noi dung gio nam o 3 file: page.tsx + plugins.ts (du lieu 8
   plugin dung chung) + PluginLab.tsx (section demo tuong tac). Cac phep
   kiem NOI DUNG doc tren tong ca ba. */
async function docNoiDung() {
  const [page, plugins, lab] = await Promise.all([
    readFile(new URL("page.tsx", appRoot), "utf8"),
    readFile(new URL("plugins.ts", appRoot), "utf8"),
    readFile(new URL("PluginLab.tsx", appRoot), "utf8"),
  ]);
  return { page, plugins, lab, tong: page + "\n" + plugins + "\n" + lab };
}

test("y tuong ban Gemini khong duoc quay lai", async () => {
  const { page, plugins, lab } = await docNoiDung();
  const css = await readFile(new URL("globals.css", appRoot), "utf8");
  const layout = await readFile(new URL("layout.tsx", appRoot), "utf8");

  const camGemini = [
    [/Dựng thô 3 giờ/i, "headline cu cua Gemini"],
    [/Còn 15 phút/i, "headline cu cua Gemini"],
    [/−92%|-92%/, "con so dan xuat tu headline cu"],
    [/Trả lại thời gian sáng tạo/, "title cu cua Gemini"],
    [/Barlow|IBM Plex/, "cap font cu cua Gemini"],
    [/dai-cat|hero-console|sim-mode|lesson-|confidence-strip|comp-card|roi-|final-cta/, "class/khoi cua ban cu"],
  ];
  for (const [re, viSao] of camGemini) {
    for (const [ten, src] of [["page", page], ["plugins", plugins], ["PluginLab", lab], ["css", css], ["layout", layout]]) {
      assert.doesNotMatch(src, re, "Y cu quay lai trong " + ten + ": " + viSao);
    }
  }
});

test("khong hua qua so do — cau da go khong duoc quay lai", async () => {
  const { tong: page } = await docNoiDung();

  /* ☠️ "DaVinci Resolve" la loi hua di TRUOC san pham: 17/08 da grep ca 8
     panel — 0 dong code cho DaVinci (moi "resolve" la Promise.resolve cua
     JS). Anh Tien van chot ghi (17/08). Neu doi y, them lenh cam:
     [/DaVinci/i, "chua co code DaVinci"]. */
  const cam = [
    [/Tương thích cả Windows & macOS/, "macOS chua ton tai"],
    [/142 khoảng lặng/, "so bia; so that la 54 nhat / video 6:29"],
    [/0\.8s xử lý/, "so bia; that la 23s"],
    [/reaction shots/, "tinh nang khong ton tai"],
    [/an toàn tuyệt đối/, "khong hua tuyet doi"],
    [/14 Giây/, "14s chi khi co cache; lan dau 2,4 phut"],
    [/lip-sync/, "chua chung minh 'cat dung nguoi'"],
  ];
  for (const [re, viSao] of cam) {
    assert.doesNotMatch(page, re, "Cau bi CAM xuat hien lai: " + re + " — " + viSao);
  }

  // So THAT phai con do — [17/08] anh Tien bao viet cot so "de hieu hon"
  // nen chuoi doi sang loi thuong, con so van la so da do that
  assert.match(page, /cắt video 6 phút trong 23 giây/);
  assert.match(page, /2,4 phút/);
  assert.match(page, /28\.000\+/);
  assert.match(page, /588\/588/);
  assert.match(page, /Plugins cho Premiere Pro/);
  // Hai cau anh Tien tu doc (17/08) — go phai hoi anh
  assert.match(page, /ngủ đông/);
  assert.match(page, /1 chạm tạo phụ đề/);
});

test("bang gia 16/08: 2 goi Demo $0 + Pro $17/thang, CAM gia cu", async () => {
  const { page, tong } = await docNoiDung();

  assert.match(page, /className="tien">\$0/);
  assert.match(page, /\$17 <small>\/ tháng<\/small>/);
  assert.match(page, /Asset Manager trọn bộ/);
  /* [17/08] Anh Tien: "Ca 8 plugin" chung chung — card Pro phai LIET KE
     du 8 ten (render tu PLUGINS qua .goi-plugins) */
  assert.match(page, /className="goi-plugins"/);
  assert.doesNotMatch(page, /Cả 8 plugin/);

  const cam = [/\$299/, /\$149/, /\$29(?!\d)/, /Lifetime/, /one-time/, /Vĩnh Viễn/i, /TIẾT KIỆM/, /hoàn tiền/, /AutoPod/];
  for (const re of cam) {
    assert.doesNotMatch(tong, re, "Gia/loi hua da bo xuat hien lai: " + re);
  }
});

test("duong nhan don khong duoc chet", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");

  const soMailto = (page.match(/MAILTO_DEMO|MAILTO_PRO/g) || []).length;
  assert.ok(soMailto >= 4, "duong mailto bi dut — kiem MAILTO_DEMO/MAILTO_PRO");
  assert.match(page, /AiO%20Studio%20Demo%20-%20Xin%20link%20tai/);
  assert.match(page, /Goi%20Pro%20%2417%2Fthang/);
  for (const [, id] of page.matchAll(/href="#([a-z-]+)"/g)) {
    assert.ok(page.includes(`id="${id}"`), `link #${id} tro toi id khong ton tai`);
  }
});

test("khung suon ban toi gian van production-ready", async () => {
  const { page, tong } = await docNoiDung();
  const layout = await readFile(new URL("layout.tsx", appRoot), "utf8");
  const css = await readFile(new URL("globals.css", appRoot), "utf8");

  assert.match(page, /className="skip-link"/);
  assert.match(page, /aria-label="Điều hướng chính"/);
  assert.match(tong, /SẮP CÓ/); // Cut Short chua co code — phai giu nhan (nam trong plugins.ts)
  assert.match(layout, /8 plugin AI cho Premiere Pro/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /@media \(max-width: 860px\)/);
  assert.match(css, /:not\(\.nut-cam\)/); // chot chan loi nut header 17/08

  /* ☠️ Loi rot font 17/08 khong duoc tai dien */
  const viTriFont = css.indexOf("fonts.googleapis.com");
  const viTriTailwind = css.indexOf('@import "tailwindcss"');
  assert.ok(viTriFont > -1 && viTriTailwind > -1, "thieu mot trong hai dong @import");
  assert.ok(viTriFont < viTriTailwind, "☠️ @import font dang SAU tailwind — build tinh se vut font");

  /* page.tsx van la server component. "use client" CHI duoc phep o
     PluginLab.tsx (island demo tuong tac — anh Tien yeu cau 17/08).
     Them island moi phai ghi ly do vao PROGRESS.md. */
  assert.doesNotMatch(page, /['"]use client['"]/);
  const lab = await readFile(new URL("PluginLab.tsx", appRoot), "utf8");
  assert.match(lab, /^"use client";/, "PluginLab phai la client component");
  /* [17/08 chieu] Bo cuc doi accordion -> THE TAB DOC (anh Tien gui hinh).
     aria-expanded het dung nghia (khong con dong/mo), thay bang bo ba
     chuan cua tablist. Va phim mui ten PHAI chay — tablist khong co ban
     phim la nguoi dung tab-key ket o the dau. */
  assert.match(lab, /role="tablist"/);
  assert.match(lab, /role="tab"/);
  assert.match(lab, /aria-selected=\{/);
  assert.match(lab, /role="tabpanel"/);
  assert.match(lab, /ArrowDown/, "tablist phai chay duoc bang phim mui ten");
  /* Soi cho DUNG THAT (co dau "="), khong soi chu trong ghi chu — luat cu
     viet /aria-expanded/ da bat nham chinh comment giai thich no. */
  assert.doesNotMatch(lab, /aria-expanded=/, "tab thi khong dung aria-expanded");
});
