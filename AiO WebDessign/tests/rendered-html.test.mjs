import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appRoot = new URL("../app/", import.meta.url);
const projectRoot = new URL("../", import.meta.url);

test("page sells the editor outcome before listing features", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");

  assert.match(page, /Đừng dùng giờ sáng tạo cho/);
  assert.match(page, /Không giới hạn thư viện asset/);
  assert.match(page, /Render preview trong tích tắc/);
  assert.match(page, /Kết quả đưa thẳng vào timeline/);
  assert.match(page, /Editor không chậm vì thiếu kỹ năng/);
});

test("all four AiO Studio tools remain separate and understandable", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");

  assert.match(page, /Asset Manager/);
  assert.match(page, /Power Bins/);
  assert.match(page, /Auto Cut/);
  assert.match(page, /Auto Transcripts/);
  assert.match(page, /Từ asset đến timeline/);
  assert.match(page, /Brand Kit ở mọi project/);
  assert.match(page, /Bản nháp gọn trong ít phút/);
  assert.match(page, /Transcript sẵn để chỉnh/);
});

test("complex ideas use replayable, user-triggered animation", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");
  const css = await readFile(new URL("globals.css", appRoot), "utf8");

  assert.match(page, /Xem workflow thực tế/);
  assert.match(page, /Xem lại workflow/);
  assert.match(page, /ToolVisual/);
  assert.match(page, /aria-live="polite"/);
  assert.match(css, /@keyframes moveClipToTimeline/);
  assert.match(css, /@keyframes scissorsCut/);
  assert.match(css, /@keyframes captionWrites/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("ROI calculator uses the editor's own assumptions", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");
  const css = await readFile(new URL("globals.css", appRoot), "utf8");

  assert.match(page, /Số project mỗi tháng/);
  assert.match(page, /Phút có thể tiết kiệm mỗi project/);
  assert.match(page, /hoursRecovered/);
  assert.match(page, /Đây là ước tính do bạn nhập/);
  assert.match(css, /\.roi-calculator/);
  assert.match(css, /\.roi-result/);
});

test("navigation, typography and responsive safeguards remain production ready", async () => {
  const page = await readFile(new URL("page.tsx", appRoot), "utf8");
  const layout = await readFile(new URL("layout.tsx", appRoot), "utf8");
  const css = await readFile(new URL("globals.css", appRoot), "utf8");
  const packageJson = await readFile(new URL("package.json", projectRoot), "utf8");

  assert.match(page, /className="skip-link"/);
  assert.match(page, /role="tablist"/);
  assert.match(page, /href="#basics"/);
  assert.match(page, /href="#lab"/);
  assert.match(page, /href="#journey"/);
  assert.match(layout, /Trả lại thời gian sáng tạo cho editor/);
  assert.match(css, /--font-ui: "SF Pro Text"/);
  assert.match(css, /--font-display: "SF Pro Display"/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
