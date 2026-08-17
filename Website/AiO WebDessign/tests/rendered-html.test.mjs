import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/**
 * VIET LAI 14/08/2026. Ban cu tim chu cua trang PHIEN BAN TRUOC (truoc khi anh
 * Tien redesign) nen 4/5 bai truot du trang chay tot — thuoc cu do trang moi
 * (bai hoc 5u: doi cach bay du lieu thi thuoc cu bao "san pham hong" chu khong
 * bao "toi hong").
 *
 * Ban nay lam CHOT CHAN cho cac quyet dinh 14/08:
 *  1. Trang KHONG duoc hua qua so do (danh sach cam ben duoi — moi cau tung
 *     nam tren trang va da bi go co chu dich, kem so that thay the).
 *  2. Section Beta + 3 nut gia mailto phai con song.
 * Ai them lai cau cam / lam chet nut la do ngay tai day, truoc khi len mang.
 *
 * Van la kiem TREN MA NGUON (grep), khong phai HTML da render — du de bat
 * chu-bi-them-lai; con "trang co chay khong" thi `npm run build` (chay truoc
 * test trong `npm run test`) da tra loi.
 */

const appRoot = new URL("../app/", import.meta.url);

test("khong hua qua so do — cau da go khong duoc quay lai", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");

  /* ☠️ [17/08] ANH TIEN DAO QUYET DINH 14/08: yeu cau hero ghi "Plugins ho tro
     cho PR - Davinci". Nen BO lenh cam /DAVINCI/ o day.
     NHUNG SU THAT KY THUAT KHONG DOI, ghi lai de phien sau khong hieu nham:
     da grep ca 8 panel ngay 17/08 — 0 dong code nao cho DaVinci Resolve
     (moi ket qua "resolve" deu la `Promise.resolve` cua JavaScript).
     Day la loi hua di TRUOC san pham; neu anh Tien doi y thi sua lai
     `.hero-eyebrow` trong page.tsx va bat lai lenh cam nay. */
  // Moi dong: [cau cam, vi sao cam]
  const cam = [
    [/Tương thích cả Windows & macOS/, "macOS chua ton tai — khach Mac mua la hoan tien"],
    [/142 khoảng lặng/, "so bia; so that tu test 14/08 la 54 nhat / video 6:29"],
    [/0\.8s xử lý/, "so bia; that la 23s cho video 6:29, 19 phut cho video 1 gio"],
    [/reaction shots/, "tinh nang khong ton tai"],
    [/an toàn tuyệt đối/, "khong duoc hua tuyet doi o cho undo — noi co che that"],
    [/60 Phút Audio ➔ 14 Giây/, "14s chi khi co cache; lan dau 143s ≈ 2,4 phut"],
    [/lip-sync drift/, "chua chung minh duoc 'cat dung nguoi' — khong duoc khoe do chinh xac"],
  ];
  for (const [re, viSao] of cam) {
    assert.doesNotMatch(page, re, "Cau bi CAM xuat hien lai: " + re + " — " + viSao);
  }

  // So THAT thay the phai con do
  assert.match(page, /54 khoảng lặng/);
  assert.match(page, /6:29 video ➔ 23s/);
  assert.match(page, /60 Phút Audio ➔ 2,4 Phút/);
  assert.match(page, /588\/588 mốc đúng cam/);
  /* [17/08] Eyebrow doi tu "BO CONG CU NATIVE CHO PREMIERE PRO · WINDOWS"
     sang "Plugins ho tro cho Premiere Pro · DaVinci Resolve" (y anh Tien). */
  assert.match(page, /Plugins hỗ trợ cho Premiere Pro/);
});

/* [16/08] VIET LAI test nay: anh Tien doi bang gia — demo free CHI Asset
   Manager, goi Pro $17/thang du 8 tool, BO Lifetime/goi nam ("chua san sang
   lam one-time"). Test cu khoa "3 tool free" (quyet dinh 13/08) nen phai doi
   thuoc theo quyet dinh moi (bai hoc 5u). */
/* [17/08] Anh Tien go tiep section DEMO va section SO SANH. Demo free gio
   chi con song o card "Demo Pass" trong bang gia — va DUONG TAI phai theo
   sang cung (mailto nam trong section vua go). */
test("demo free = CHI Asset Manager, khong con dau vet gia cu", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");

  assert.match(page, /Demo Pass/);
  assert.match(page, /Asset Manager đầy đủ tính năng/);
  // Cau cua thoi "3 tool free" khong duoc quay lai
  assert.doesNotMatch(page, /Cả ba tool miễn phí/);
  assert.doesNotMatch(page, /Dùng Thử Miễn Phí 3 Tool/);
  // Cut Short chua co code — phai con nhan Coming Soon
  assert.match(page, /Coming Soon/);
});

test("hai section da go 17/08 khong duoc quay lai (ke ca CSS)", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");
  const css = await readFile(new URL("globals.css", appRoot), "utf8");

  const daGo = [
    [/id="beta"/, "section demo mien phi"],
    [/id="comparison"/, "section so sanh 3 card"],
    [/comparison-cards-grid|comp-card|featured-badge/, "khoi so sanh"],
    [/href="#beta"/, "link tro toi section da go"],
  ];
  for (const [re, ten] of daGo) {
    assert.doesNotMatch(page, re, "Da go ma quay lai: " + ten);
  }
  assert.doesNotMatch(css, /comparison-cards-grid|\.comp-card|featured-badge/, "CSS chet quay lai");
  // Nhung class TRUNG TEN o section khac phai con nguyen
  assert.match(css, /pipeline-flow-comparison/);
});

test("bang gia 16/08: 2 goi Demo+Pro $17/thang, CAM lifetime/goi nam quay lai", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");

  // Phai co 2 goi moi
  assert.match(page, /Demo Pass/);
  assert.match(page, /Pro Pass/);
  assert.match(page, /\$17 <small>\/ tháng<\/small>/);
  // Gia/goi da bo KHONG duoc quay lai (anh Tien 16/08: "khong co goi
  // one-time payment, minh chua san sang")
  const cam = [/\$299/, /\$149/, /Lifetime/, /one-time/, /Vĩnh Viễn/i, /TIẾT KIỆM 57/, /hoàn tiền/];
  for (const re of cam) {
    assert.doesNotMatch(page, re, "Gia/loi hua da bo xuat hien lai: " + re);
  }
});

test("nut gia va nut demo khong duoc chet — moi CTA tien phai co duong di", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");

  // 1 nut Pro + 1 nut demo = it nhat 2 mailto (placeholder toi khi co checkout)
  const soMailto = (page.match(/mailto:dreamtalentmarketing@gmail\.com/g) || []).length;
  assert.ok(soMailto >= 2, "chi con " + soMailto + " mailto — nut tien nao do da chet");
  assert.match(page, /subject=AiO%20Studio%20Demo%20-%20Xin%20link%20tai/);
  assert.match(page, /subject=AiO%20Studio%20-%20Goi%20Pro%20%2417%2Fthang/);
  // Khong con <button> tran trong khoi gia (da doi het sang <a>)
  assert.doesNotMatch(page, /<button type="button" className="[^"]*plan-btn[^"]*">/);
});

test("khung suon trang van production-ready (phan con dung tu bo test cu)", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");
  const layout = await readFile(new URL("layout.tsx", appRoot), "utf8");
  const css = await readFile(new URL("globals.css", appRoot), "utf8");

  assert.match(page, /className="skip-link"/);
  /* [17/08] Bo phep kiem aria-live: vung song duy nhat la ket qua ROI, ma
     khoi do da go. Phan dong con lai (tab chon tool) dung role=tab +
     aria-selected — dung chuan, khong can live region. */
  assert.match(page, /role="tab"/);
  assert.match(page, /aria-selected/);
  /* [17/08] BO hai phep kiem "#journey" + "hoursRecovered": anh Tien chot go
     section ROI, dai 3 chi so, nhan cam dau section va khoi CTA cuoi. Thuoc cu
     khoa dung nhung thu vua go nen bao do — doi thuoc theo quyet dinh moi
     (bai hoc 5u), va them chot chan cam chung quay lai. */
  const daGo = [
    [/lesson-number/, "nhan cam dau section"],
    [/confidence-strip/, "dai 3 o chi so"],
    [/roi-calculator|hoursRecovered/, "khoi tinh ROI"],
    [/final-cta/, "khoi CTA cuoi trang"],
    [/href="#journey"/, "link nav toi section da go"],
  ];
  for (const [re, ten] of daGo) {
    assert.doesNotMatch(page, re, "Khoi da go xuat hien lai: " + ten);
    assert.doesNotMatch(css, re, "CSS chet cua khoi da go quay lai: " + ten);
  }
  assert.match(layout, /Trả lại thời gian sáng tạo cho editor/);
  assert.match(css, /@keyframes scissorsCut/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(max-width: 620px\)/);
});
