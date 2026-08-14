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

  // Moi dong: [cau cam, vi sao cam]
  const cam = [
    [/DAVINCI/, "chua co mot dong code nao cho DaVinci (anh Tien chot Win+Pr 14/08)"],
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
  assert.match(page, /PREMIERE PRO · WINDOWS/);
});

test("section Beta 3 tool free con song va tro dung cho", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");

  assert.match(page, /id="beta"/);
  assert.match(page, /Dùng Thử Miễn Phí 3 Tool/);
  // Dung 3 tool free anh Tien chot 13-14/08 — khong hon khong kem
  assert.match(page, /Auto Cut/);
  assert.match(page, /Asset Manager/);
  assert.match(page, /Power Bins/);
  assert.match(page, /Cả ba tool miễn phí kể cả sau beta/);
  // Cut Short chua co code — phai con nhan Coming Soon
  assert.match(page, /Coming Soon/);
});

test("nut gia va nut beta khong duoc chet — moi CTA tien phai co duong di", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");

  // 3 nut gia + 1 nut beta = it nhat 4 mailto (placeholder toi khi co checkout)
  const soMailto = (page.match(/mailto:dreamtalentmarketing@gmail\.com/g) || []).length;
  assert.ok(soMailto >= 4, "chi con " + soMailto + " mailto — nut tien nao do da chet");
  // Khong con <button> tran trong khoi gia (da doi het sang <a>)
  assert.doesNotMatch(page, /<button type="button" className="[^"]*plan-btn[^"]*">/);
});

test("khung suon trang van production-ready (phan con dung tu bo test cu)", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");
  const layout = await readFile(new URL("layout.tsx", appRoot), "utf8");
  const css = await readFile(new URL("globals.css", appRoot), "utf8");

  assert.match(page, /className="skip-link"/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /href="#journey"/);
  assert.match(page, /hoursRecovered/); // ROI calculator con chay
  assert.match(layout, /Trả lại thời gian sáng tạo cho editor/);
  assert.match(css, /@keyframes scissorsCut/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(max-width: 620px\)/);
});
