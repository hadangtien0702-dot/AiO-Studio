# PROGRESS — AiO WebDessign (website ban hang)

> Nhat ky sua doi. Muc moi ghi LEN TREN. Gio lay bang lenh `Get-Date`, khong bia.
> Code goc do anh Tien tu dung (29/07) — sua noi dung/bo cuc phai theo loi anh dan.

---

## 2026-08-17 08:45 — Sua .gitignore goc: luat build/ nuot file nguon cua web

**Boi canh:** cu push dau tien sau khi co vercel.json bi Vercel bao Error.
**Nguyen nhan that:** `.gitignore` GOC repo co luat `build/` khong neo → nuot
`Website/AiO WebDessign/build/sites-vite-plugin.ts` (file nguon that ma
`vite.config.ts` import). Repo GitHub THIEU file nay tu dau — clone ve cung
khong chay duoc, khong rieng gi Vercel. Cung cai bay voi ngoai le `dist/`
da ghi 03/08 ngay trong chinh file .gitignore do.
**Thay doi:** them `!/Website/AiO WebDessign/build/` + ghi chu ☠️ tai cho;
commit `0d6f48c`.
**Kiem chung bang so:**
- `git check-ignore` hai chieu: file nguon HET bi chan; out/ va dist/ VAN bi chan
- Push xong Vercel tu build: **Ready sau 33s** (truoc: Error sau 30s)
- Do live sau auto-build: 200 · co "$17"/"Demo Pass"/logo · 0 vet "$299"
→ Tu gio: **push len main la web tu len song**, khong can deploy tay.

## 2026-08-17 08:36 — Len song Vercel: ai-o-studio.vercel.app (xuat tinh)

**Boi canh:** anh Tien tu noi repo GitHub vao Vercel (project `ai-o-studio`)
va dang nhap vercel CLI, nho em deploy. Ban dashboard build ra **404** vi
build o GOC repo (khong co web) va site von dung vinext/Cloudflare Worker —
khong chay native tren Vercel.

**Nguyen nhan that / cach giai:** landing page la "use client" thuan, khong
can server → xuat HTML TINH bang Next chuan roi phuc vu tinh tren Vercel.
Khong dung vao duong vinext/Cloudflare (dev van chay nhu cu).

**Thay doi:**
- `next.config.ts`: them co `STATIC_EXPORT=1` → `output: "export"` (khong dat
  co thi config y nguyen)
- `vercel.json` MOI o GOC repo: installCommand skip, buildCommand
  `cd "Website/AiO WebDessign" && npm ci && STATIC_EXPORT=1 npx next build`,
  outputDirectory `Website/AiO WebDessign/out` — de moi lan push GitHub,
  Vercel tu build DUNG thu muc (khong co file nay la no build goc → de 404
  len production)
- Deploy tay lan dau: `next build` (3/3 trang tinh, out/ 49 file 7,1 MB)
  → `vercel deploy --prebuilt --prod`

**Kiem chung bang so (tren LIVE, bai hoc 5ah):**
- https://ai-o-studio.vercel.app → HTTP 200, co "$17" + "Demo Pass",
  0 vet "$299" ✓
- `git check-ignore` hai chieu: out/ · .vercel · .env.local deu bi chan,
  khong lot len GitHub ✓

## 2026-08-16 14:00 — Sua not 2 loi treo tu bao cao kiem UI 14/08

**Boi canh:** anh Tien gat "sua luon 2 loi con treo" (nut cam chu trang truot
chuan tuong phan + pill hero loi khoi man 375px).

**Nguyen nhan that:**
- Trang/cam #FF5714 do duoc 3.17 — chu 15px can 4.5 (truot), nhung chu LON
  (>=18.66px dam) chi can 3.0 (dat). Mau cam la lua chon tham my anh chot
  02/08, nen loi giai la NANG CO CHU, khong doi mau.
- `.sim-mode-bar` flex khong wrap: 4 pill can 371px, khung 375px chi co 346px.

**Thay doi:**
- `globals.css`: `.primary-cta` / `.site-nav .nav-cta` / `.skip-link` len
  19px dam (kem comment ly do); `.featured-badge` + `.popular-pill` (10px,
  khong the dat voi chu trang) doi sang chu toi #16181d — do duoc 5.6;
  `.sim-mode-bar` them `flex-wrap: wrap`
- `page.tsx`: bo `fontSize: "14px"` inline o CTA spotlight (no de mat 19px)

**Kiem chung bang so (do tren ban chay cong 3002):**
- Tuong phan: 10/10 phan tu cam DAT (truoc: 8 phan tu truot 3.17/4.5)
- Mobile 375px: 0 phan tu tran (truoc: pill loi toi x=385); pill tu xuong
  2 dong, mep phai xa nhat 361 <= 375; moi CTA nam gon trong man
- Header: nut nav 44px van nam gon trong header 64px
- `node --test`: 5/5 dat

## 2026-08-16 13:56 — Viet lai bo test chot chan theo bang gia moi

**Boi canh:** ngay sau khi doi bang gia (muc duoi), phat hien
`tests/rendered-html.test.mjs` (viet 14/08) dang KHOA CUNG quyet dinh cu:
doi `Dùng Thử Miễn Phí 3 Tool`, `Cả ba tool miễn phí`, >=4 nut mailto.
Khong sua thi lan `npm run test` toi bao do oan (bai hoc 5u: doi quyet dinh
thi phai doi thuoc theo, khong thi thuoc bao "san pham hong").

**Thay doi (`tests/rendered-html.test.mjs`):**
- Test "3 tool free" → "demo free = CHI Asset Manager": doi cau moi, CAM cau cu
  quay lai (`Cả ba tool miễn phí`, `Dùng Thử Miễn Phí 3 Tool`)
- Them test moi "bang gia 16/08": phai co Demo Pass + Pro Pass + `$17 / tháng`;
  CAM `$299 / $149 / Lifetime / one-time / Vĩnh Viễn / TIẾT KIỆM 57 / hoàn tiền`
- Test mailto: >=4 → >=2, kiem dung 2 subject moi (Demo + Goi Pro $17)

**File anh huong kem theo:** `app/page.tsx` — sua 1 comment o khoi bang gia vi
chinh comment do chua chuoi "$299/$149/Lifetime" se lam test cam tu bao dong gia.

**Kiem chung bang so:** `node --test tests/rendered-html.test.mjs` →
**5/5 dat, 0 truot** (truoc khi sua test: 2 bai se truot vi trang da doi).

## 2026-08-16 13:54 — Doi bang gia: 2 goi (Demo free + Pro $17/thang), bo Lifetime

**Boi canh:** anh Tien chot qua /ui-ux-pro-max: *"goi demo mien phi (1 tinh nang
la asset manager) · goi $17 gan nhu full · khong co goi one-time payment"*.
Hoi lai va anh chot: $17 la THEO THANG, goi $17 = du ca 8 tool.
Phu dinh mot phan quyet dinh 13/08 (3 tool free) — da cap nhat brain
(`quyet-dinh-beta-va-goi-free.md`).

**Sua gi (`app/page.tsx`):**
- Hero CTA: "Tai Beta mien phi — 3 tool" → "Tai Demo mien phi — Asset Manager"
- Spotlight CTA: "So Huu Tron Bo 8 Tool" → "Mo Khoa Ca 8 Tool — $17/thang"
- Bang so sanh: gia AiO $299/$149 → "$17/thang — du ca 8 tool"; bo bullet
  "Mua 1 Lan Vinh Vien" (khong con dung) → "Demo Asset Manager mien phi";
  bullet SaaS "khong co Lifetime" (minh cung het co) → "Phai co Internet";
  bullet AutoPod → "Dat hon 70% so voi AiO ($29 vs $17)" (29/17 = 1.70)
- Section #beta: 3 card tool → 1 card Asset Manager (grid `.one-plan` can giua);
  bo con so "(92 MB)" vi la dung luong bo cai 3-tool cu, chua do lai ban 1 tool
- Bang gia: 3 card (Starter $29 / Annual $149 / Lifetime $299) → 2 card
  (Demo Pass $0 / Pro Pass $17/thang, pill "RE HON AUTOPOD 41%" = (29-17)/29);
  bo hua "Support Discord 24/7" (chua co that)
- ROI CTA + CTA cuoi: het "$299", het "hoan tien 30 ngay" (loi hua cua goi cu)
- Mailto subjects doi theo goi moi

**Sua gi (`app/globals.css`):**
- Them `.two-plans` (2 cot, max 780px) va `.one-plan` (1 cot 460px can giua)
- ☠️ VA LOI TON TU 14/08: `.comparison-cards-grid` va `.pricing-cards-grid`
  KHONG co breakpoint → o 375px van ep 3 cot ngang, card AiO (card ban hang!)
  bi day han ra ngoai man hinh ma trang khong cuon ngang duoc (do that:
  content 518px / khung 347px, card 3 bat dau o x=374). Them
  `@media (max-width: 900px)` xep doc, max 560px.
- Xoa CSS chet cua card Lifetime (`.is-lifetime`, `.lifetime-btn`);
  giu `--yellow` vi con 3 cho khac dung

**Kiem chung (do tren ban dang chay cong 3002):**
- Quet chuoi cu: `$299 / $149 / Lifetime / vinh vien / 3 tool / TIET KIEM 57 /
  hoan tien / Starter / Annual` → **0 vet** tren trang (con "$29" duy nhat la
  gia AutoPod trong bang so sanh — dung y)
- Grid 2 goi: `380px 380px` can giua ✓; demo 1 card `460px` ✓
- Mobile 375px: bang so sanh xep doc 1 cot, card AiO right=361 ≤ 375 —
  **het mat card** ✓; console 0 loi ✓
- Con lai (chua sua, cho anh gat): pill hero `sim-mode-btn` van loi ~10px o
  375px; CTA cam chu trang 3.17 (can 4.5) — xem bao cao kiem UI 14/08

## Truoc 16/08

Xem lich su commit git (`git log --oneline`) — cac moc chinh:
- 14/08: redesign "trang la cua so Premiere", sua 15 cau hua qua so do,
  section Tai Beta 3 tool, bo test chot chan quyet dinh 14/08
- 29/07: anh Tien tu dung site (Next.js + Drizzle + Cloudflare Worker)
