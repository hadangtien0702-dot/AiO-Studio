# AiO WebDessign — website ban hang (xay moi 100% ngay 17/08/2026)

> Doc `PROGRESS.md` (khoi TRANG THAI HIEN TAI) truoc khi lam gi.
> Lam UI: doc `design-system/aio-studio-website/MASTER.md` TRUOC (da hieu
> chinh brand that — dung tin lai output goc cua tool ui-ux-pro-max).

## Nguoi xai
Trang landing ban bo 8 plugin Premiere: khach xem hero tu dien → bam tung
plugin de THU demo tuong tac ngay tren trang → chon goi Demo $0 (chi Asset
Manager) hoac Pro $17/thang (du 8 tool) → bam nut la mo email xin link tai
(mailto — chua co cong thanh toan).

## Builder — kien truc va luat
- **Xay moi 100% ngay 17/08** — ban cu do Gemini build bi anh Tien che
  *"ngu va xau"*, CAM tai dung y/code (headline, font Barlow/Plex, class cu).
  Lenh cam nam trong `tests/rendered-html.test.mjs`. Ban cu: tag `ban-cu-17-08`.
- `app/page.tsx` = server component (0 JS). Island client DUY NHAT:
  `app/PluginLab.tsx` (demo tuong tac — anh yeu cau). Them island moi phai
  ghi ly do vao PROGRESS.md (test canh).
- Section 8 plugin = **THE TAB DOC**: cot 8 the ben trai (234px) + bang lon
  ben phai, **cach nhau 16px**. Hai luat khong duoc pha:
  ☠️ (1) **KHONG cho the chui xuong duoi bang.** Hinh mau anh gui ban dau co
  kieu do va em da lam 3 lan, lan nao anh cung bat loi — vi **bat cu thu gi
  ve o phan bi che deu bi bang CAT PHANG giua chung**: vien cam cua the chon,
  net bo goc, va ca mang sang luc HOVER. Anh chot 17/08: *"lam gon lai cho
  khung va border no ngan lai — khi hover vao bi loi do em"*. The nay om sat
  chu, vien khep kin 4 canh. Muon lam lai kieu tut thi doc PROGRESS.md truoc.
  (2) lop demo ben trong **khong duoc co nen/vien** — bang lo phan hop roi,
  them nua la hop long hop (anh cung da chup loi nay).
- `app/plugins.ts` = NGUON DUY NHAT ve 8 plugin (PluginLab + card Pro cung
  doc). Them/sua tool o day.
- ☠️ `globals.css`: dong `@import` font PHAI TRUOC `@import "tailwindcss"`
  — dao lai la build tinh VUT font trong im lang (loi "15 PI" 17/08, test canh).
- Font: Space Grotesk (max 700 — khai 800/900 la dam GIA) + Inter +
  JetBrains Mono; ca ba da kiem co tieng Viet.
- Tuong phan da do: trang/cam #FF5714 = 3.17 → nut cam bat buoc chu
  >=19px dam; chu <18px tren nen cam phai TOI.
- Build tinh: `STATIC_EXPORT=1 npx next build` → `out/`. Xem local:
  `npx serve out -l 4173`. Push len `main` = Vercel TU DEPLOY
  (ai-o-studio.vercel.app, `vercel.json` o GOC repo AiO Studio lo viec build).
- Hai cau mo ta anh Tien TU DOC (Asset Manager "ngu dong", Transcripts
  "1 cham") — go/sua phai hoi anh; test dang khoa.
- "DaVinci Resolve" tren hero la loi hua di TRUOC san pham (17/08 chua co
  dong code nao cho DaVinci — anh Tien van chot ghi; xem ghi chu trong test).

## MVP — "xong" nghia la gi
- `node --test tests/rendered-html.test.mjs` 5/5 · build sach · 0 tran ngang
  o 375px · nut cam dat tuong phan · CTA hero nam TRONG man dau (do bottom
  <= viewport).
- CHUA dat: demo tuong tac moi co Auto Cut theo khuon panel+timeline
  (10/10 hanh vi da do); 6 demo con lai CHO anh Tien duyet khuon.
  Chua push ban moi (anh dan lam local truoc — live van la ban Gemini cu).
