# AiO Auto Short Viral - Nhat ky

## [0.1.2-vaphienban] - 2026-09-21 11:22 (UTC+7) - SUA: panel CHAN "Doc noi dung" vi lech phien ban host. DA CAI + DA DO

### Boi canh
Anh Tien bam "Doc noi dung" luc 11:20 (anh chup man hinh): panel bao *"Phan chay trong
Premiere dang la ban 0.1.2, khong khop giao dien..."* va khong chay.

### Nguyen nhan that
Muc 11:05 bump 0.1.2 o 3 cho (manifest, package.json, host `sv_phienBan`) nhung SOT cho
thu 4: `client/src/lib/cep.ts` `PHIEN_BAN_HOST = '0.1.0'`. Host tra 0.1.2 != 0.1.0 ->
`HOST_CU` -> chan. Phep do 11:05 "sv_phienBan() tra 0.1.2" goi THANG host qua CDP nen
khong di qua buoc kiem phien ban cua giao dien -> khong lo (brain 5p: do tren duong
khong phai duong nguoi dung di). Kiem `design-system/version.mjs` chi so 3 cho, mu voi 2
cho con lai.

### Da sua
- `cep.ts` `PHIEN_BAN_HOST` -> '0.1.2'.
- Chot chan moi `tests/kiem-phien-ban.mjs`: 5 cho (2 dong manifest, package.json, host,
  cep.ts) phai bang nhau; chay DAU TIEN trong `npm run build` va `build:release`.
  Doi chung `--doi-chung` (gia lap cep.ts lech) -> in HONG, exit 1. Ban that -> 5/5, exit 0.

### Kiem chung
- `npm run build` sach, dist 567,77 kB, kiem-byte sach · `npm run kiem` 222 DAT / 0 HONG.
- Chep `dist/index.html` vao extension, md5 khop (`0a309f7f...`). Host KHONG doi -> khong
  can tat Premiere; nap lai trang panel qua cong 8100.
- Tren Premiere that, bam "Doc noi dung" qua CDP tren `PodTest 20 phut - thu Short Viral`:
  **khong con bao lech**, ra **37 khoi / 295 cau** (khop 37 khoi do 11:05).

## [0.1.2] - 2026-09-21 11:05 (UTC+7) - DA CAI + DO TREN PREMIERE THAT (pill, tien do gop, tab loi). CHOT SO CUOI PHIEN

### Trang thai hien tai
- **0.1.2 DA CAI** vao `%APPDATA%\Adobe\CEP\extensions\com.aiostudio.shortviral`;
  `sv_phienBan()` doc tu Premiere tra **0.1.2**; dist cai khop md5 voi dist build.
  Bump 3 cho cung luc: CSXS/manifest.xml (2 dong), client/package.json, host sv_phienBan.
- `npm run build` sach (dist 567,77 kB) · `npm run kiem` **222 DAT / 0 HONG**.
- Anh Tien DA dung that: mo panel tren project thu Test3_1 va tren bai RIENG cua anh
  (Sequence 01, IMG_0287.MOV 1:17:11 — panel doc dem co san, KHONG nghe lai).
- Viec ke tiep: **AI offline buoc 1** (chia theo chu de bang do dinh tu vung + tieu de
  cum tu khoa + cham doan dang lam short) — CHO anh gat; ranh gioi voi Auto Cut Short
  van CHUA vach.

### Boi canh
19/09 cai lan dau va do 5 nhom tren Premiere that. 21/09 anh chot GIU kieu THE cho tab
khoi, yeu cau them: tab "Toan bo loi" phai doc duoc chi tiet; mot PILL chon/bo chon tat
ca; va khi gop nhieu khoi vao mot sequence thi phai THAY tung khoi dang duoc dua vao.

### Da do tren PREMIERE THAT (khong phai Premiere gia)
| Viec | So do |
|---|---|
| Doc bo phong van 40 phut (PodTest Nguon, dem v1 co san) | 61 khoi / 579 cau, gan nhu tuc thi |
| Bam khoi -> nhay dau doc | 4/4 khop: 52,00 · 194,20 · 604,76 · 1794,18 s |
| Tao sequence tu 2 khoi | 2 sequence / 3,5 s; doan goc 29,99-40,50 va 40,50-51,97 s |
| in/out 3 clip cam goc sau khi dung | in=0, out=het file — KHONG doi (bai 3a-bis) |
| Dat marker | 1 marker 0,01-10,51 s, CO do dai (truoc day CHUA DO), ghi chu = cau tra loi dau + chu ky `[AiO SV]` |
| Xoa marker | them tay 1 marker "Marker cua anh Tien" -> panel chi xoa marker cua no, marker kia con nguyen |
| Tao sequence 20 phut bang chinh panel | 1.199,99 s (mong muon 1.200) = lech 1 khung; 1 clip hinh + 1 clip tieng; src 59,98-1.259,97 |
| Panel doc sequence 20 phut do | **253 ms -> 37 khoi** |
| PILL chon/bo chon | 0 -> 37 (9 ms) -> bo tay 1 khoi thanh "Chon tat ca (36/37)" mixed -> 37 (6 ms) -> 0 |
| GOP 4 khoi vao 1 sequence | 4,1 s; hien "Dang dua khoi 1/4..4/4", the Q5-Q8 sang theo tung buoc; ket qua "Da dua 4 khoi vao 1 sequence moi - 0:04"; sequence ra 167,00 s / 4 clip; Premiere tu quay ve sequence goc |

### File anh huong (phien nay, ngoai phan 2 muc duoi da ghi)
`CSXS/manifest.xml` (version 0.1.0 -> 0.1.2, 2 dong) · `client/package.json` (version) ·
`host/shortviral.jsx` (sv_phienBan tra 0.1.2).

### Bay da vap lai (ghi de phien sau do mat thoi gian)
- **Bai 5ax tai dien**: viet script CDP bang heredoc, go tay duong dan Windows
  `G:\Quay PV tuyen dung...` -> vo lenh nuot dau gach cheo nguoc, host tra
  `ERR:CLIP_DA_DOI`. Sua: ghi script bang cong cu Write VA lay duong dan TU host
  (`getMediaPath()`), khong tu go.
- Dong bo panel sau khi cai: khong can tat Premiere, chi can nap lai trang panel qua
  cong 8100 (`Page.reload`) — da dung 2 lan trong phien, nhanh hon bat anh dong/mo tay.

### [CHO]
- **Don 3 sequence thu em tao**: `PodTest Nguon - Q1 ...`, `- Q2 ...`,
  `PodTest 20 phut ... - Q5+Q6+Q7`. Giu lai `PodTest 20 phut - thu Short Viral`.
  Ly do dung: cho anh Tien gat.
- **AI offline buoc 1** — cho anh gat (anh chot 20/09: offline, KHONG dung Ollama).
- **Ranh gioi voi Auto Cut Short** — chua vach, anh chua chot.
- **Mac**: panel CEP chay duoc tren Mac nhung whisper/ffmpeg va cac script .ps1 dang
  chi co ban Windows -> luat "phai chay Win + Mac" (31/08) CHUA dat.

## [0.1.2-soat2] - 2026-09-21 10:25 (UTC+7) - SUA LOI SOAT HAI VIEC 21/09 (pill chon tat ca + gop phai THAY dang chay): 3 nen-sua + 5 ghi-chu DA SUA, 2 ghi-chu de lai co ly do. CHUA CAI

### Trang thai hien tai
- `npm run build` sach va di qua chot chan byte: `dist/index.html` **574.188 byte**
  (567,77 kB), **0 byte NUL** (so loi tai dien #9).
- `npm run kiem` **222 DAT / 0 HONG** (truoc khi sua cung 222/0 - khong them phep nao,
  xem "Con no" o duoi).
- Quet khoa dich: **241 khoa duoc goi · 0 thieu ban EN · 0 lech cho trong `{x}`**
  (them 2 khoa moi). Khoa khong ai goi 14 -> 15: them `Dang dung...` vi nhan nut da bo,
  CO Y giu khoa lai.
- Do THAT tren Chrome headless=new, CSS rut tu `dist/index.html` DA BUILD LAI, DOM dung
  lai dung cay cua `DangChay`/`ThanhHanhDong` o kho 300 px, cho `document.fonts.ready`.
  KHONG chay ExtendScript, KHONG cai, KHONG mo/dong Premiere, KHONG dung cong 8100.

### Da sua (3 nen-sua)

**1. Cuon toi khoi dang chay KHONG chay trong ~4 giay dau cua luot** - dung luong nguoi
dung hay di nhat (tich khoi -> bam Tao sequence), tuc 1-3 khoi dau khong duoc cuon toi.
Goc do duoc bang doc ma: chinh cu bam CHON dong dau gio vao `nguoiCuonRef` (pill va o
tich deu nam trong `<main class="than">`, the nay co `onPointerDown={danhDauCuon}`), ma
`taoSeq` khong xoa dau truoc khi vao vong; nut "Tao sequence" nam o `<footer class="thanh-hd">`
NGOAI `main` nen khong dong dau lai -> cua so 4 giay tinh tu cu bam chon cuoi.
Luoi chan `NGHI_BAM_THEO = 4000` viet cho viec may TU bam dau doc, dung nguyen van cho mot
hanh dong nguoi dung VUA BAM la thua huong luat cua tinh huong khac.
**Sua:** `nguoiCuonRef.current = 0` ngay truoc vong `for` (App.tsx ~1704), giu luoi cho cac
vong sau (ai cuon di xem cho khac GIUA luot thi khong bi keo giat ve).
[CHUA DO] Phai do o lan cai dau: cuon xuong day danh sach, tich khoi dau tien, bam Tao
ngay, ghi lai khoi 1/N co duoc cuon toi khong.

**2. Bam Dung giua luot lam CAT DUOI dong dem "Dang dua khoi 12/12"** - nhan nut doi
`Dung` -> `Dang dung...` thi nut phinh 48,9 -> 92 px, cho cho chu tut xuong 127 px trong
khi chu can 145,1 px. Mat dung con so i/n - thu ma ca tinh nang nay sinh ra de hien - va
mat dung luc nguoi dung dang doi xem lenh dung co an. Nut Dung va dong dem LUON xuat hien
cung nhau (`onDung` chi co khi `viec === 'tao'`, `demChay` chi co khi `dua.n > 1`).
**Sua hai buoc, ca hai deu can:**
 - Nhan nut GIU NGUYEN chu `Dung` (be rong khong doi); trang thai "da nhan lenh dung" noi
   bang `disabled` + `.btn:disabled{opacity:.5}` da co san, bo doc man hinh doc la nut
   khong dung duoc nua.
 - Bo dau `...` khi co `nhan` (dong dem): `Dang dua khoi 12/12...` = 145,1 px, bo dau con
   **132,6 px**. Can, vi chi giu nhan nut thi van CAT o dong ho dai: `dongHo()` la m:ss nen
   phut khong chan tren ("100:05" that khi dung 300 khoi).
**So do (36 canh, 3 bien: nhan nut · dong ho 0:05/10:05/100:05 · `--rong-thanh-cuon` 0/11/15 px):**

| Ban | Cho cho chu | Chu can | Ket qua |
|---|---|---|---|
| MOI (nhan `Dung` + bo dau ...) VI | 140-171 px | 132,6 | **18/18 canh VUA**, thua **7,4-38,4 px** |
| MOI EN (`Stop`, `Adding block 12/12`) | 144-175 px | 124,9 | 18/18 VUA, thua 19,1-50,1 px |
| DOI CHUNG - ban CU VI (`Dang dung...` + co dau) | 97-127 px | 145,1 | **CAT 18-48 px o 9/9 canh** |
| DOI CHUNG - ban CU EN (`Stopping...`) | 108-139 px | 137,4 | CAT 6-29 px o 8/9 canh |

Doi chung cho thuoc: ca CAT co `scrollWidth` (145) khac `clientWidth`, ca vua co
`scrollWidth = clientWidth` - tuc 145,1 px cua span thu khop so cua chinh bo dan trang Chrome.
Kiem tren BAN DA DONG GOI (bay 5ak - bundler doi ma luc build): `dist/index.html` nay co
`children: v("Dung")` (khong con ternary theo `dangDung`) va `[t || v("Dang xu ly") + "..."]`
(co `nhan` thi khong them dau) - dung y sua.

**3. Con so trong hai chu thich SAI, bien an toan mong hon nhieu so voi cau da ghi** -
chu thich cu viet `"Dang dua khoi 12/12..." = 138 px, con thua >= 20 px o moi co dong ho`.
Be rong THAT la 145,1 px (thuoc cu la canvas `measureText`, thieu ~7 px = ~5%), va phep do
cu bo sot be rong thanh cuon (`--rong-thanh-cuon` 11-15 px khi danh sach du dai) lan nhan
nut Dung: voi gutter 15 + dong ho 10:05 thi cho thua chi **2,9 px**, khong phai >= 20 px.
**Sua:** viet lai ca hai chu thich (App.tsx ~2073-2092 va `ui/DangChay.tsx` ~36-52) bang so
da do lai, ghi ro cho cho chu la **97-175 px TUY ba bien**, va ghi mot dong "thuoc cu
(canvas) bao thieu ~7 px". Ket luan lon (bo o `N%`, bo cau `Dang tao sequence 12/12`) VAN
DUNG theo ca hai thuoc - chi con so la sai.

### Da sua (5 ghi-chu)

- **Hai duong KHONG thanh cong khong noi cau "Bo qua N khoi khong co media"** - khai
  `cauRong` nam SAU ca hai `return` som (loi, bam Dung), nen chon 12 khoi ma 2 khoi nam
  tron trong khe trong thi nut hua "Tao 12 sequence", dong dem chay "khoi i/10", bam Dung
  ra "tao duoc 3/10" - khoang cach 12 -> 10 khong co chu nao giai thich, dung cho nguoi dung
  dang lo. **Sua:** doi `cauRong` len truoc nhanh loi, ghep vao CA cau loi va cau Dung
  (khong de dong thu hai, giu to vang) - mau so phai giai thich duoc o MOI duong ra (5k-bis).
- **Cach GOP dem THIEU mot khoi khi host tao duoc sequence nhung bao co van de** -
  `ok:false` KEM `id` nghia la sequence DA tao va noi dung da vao (cep.ts `docKetQuaDung`:
  ca 4 loai loi INOUT_CHUA_TRA / DUNG_THIEU / LECH_DO_DAI / THIEU_TIENG deu xay ra SAU khi
  da dung). Loi ngay khoi dau o che do gop thi `seqGop` da gan tu `r.id` TRUOC khi xet
  `!r.ok` -> cau bao ra "Sequence gop moi co 0/12 khoi" cho mot sequence that su dang chua
  khoi 1; nguoi doc "0 khoi" khong di tim cai sequence la do trong bin. Nhanh moi-khoi-mot-
  sequence thi dem dung (co `taoMaLoi`). **Sua:** nhanh gop dung cung cach phan biet -
  co `taoMaLoi` thi dem `xong + 1` + cau "khoi {k} da vao nhung can kiem" (khoa moi + ban EN).
- **Ba con so tren cung man hinh dem theo BA mau so** (5k-bis) - pill noi "Chon tat ca (3)"
  (dem khoi DANG HIEN) trong khi thanh day noi "Da chon 20 khoi" va nut chinh noi "Tao 20
  sequence" (dem ca khoi bi o tim che, vi luot tao lay tu `khoiRef` chu khong phai `khoiHien`).
  Chu "dang hien" truoc day CHI nam trong tooltip `title` cua pill. **Sua:** them mot dong
  ghi-chu cho tab khoi, dung khuon `soAn` cua tab "Toan bo loi":
  `soKhoiAn = khoiChon.length - ttChon.daChon` (cung ham voi cu bam nen khong noi khac viec),
  > 0 thi hien *"Dang chon 20 khoi, trong do 17 khoi khong khop o tim nen dang bi an - nut
  tao sequence van dung ca 20."* Do o kho 300 px tren dist da build: VI va EN deu **3 dong /
  48 px**, `than` scrollW = clientW = 285 -> **0 cuon ngang**. Dat NGOAI thanh cong cu dinh
  (khong lam tang sticky cao them).
- **Khoi bi o tim che thi hai thu anh Tien giao IM LANG** (the sang len · danh sach cuon toi)
  vi `veDangDua`/`cuonToiDangDua` tim `[data-khoi=...]` trong DOM khong thay the nao - chi
  con dong dem nhay so. Dung dong ghi-chu o tren de noi bang SO truoc khi bam, khong de im.
  Khong tu xoa o tim (do la thao tac cua nguoi dung, va lua chon co y GIU khi bi loc - da
  chot 21/09, `tests/kiem-hoidap.mjs` co phep chot hanh vi do).
- **`cuonToiDangDua` thieu dung cua chan giat ma `theoDauDoc` co** - no chi xet "nguoi dung
  vua thao tac trong 4 giay" va "dang mo menu/o sua/hop hoi", KHONG xet "the dang to con
  trong khung nhin khong". Hau qua: dang chay 12 khoi, nguoi dung cuon di xem cho khac roi
  bo tay 4 giay la danh sach bi keo giat ve, va giat lai o MOI khoi sau. **Sua:** gom luat
  thanh MOT ham `conTrongKhung(chon)` dung cho ca hai duong bam (`[data-phat]` cua dau doc
  va `[data-dang-dua]` cua khoi dang dua) - luat giong nhau thi dung viet hai ban;
  `cuonToiDangDua(dangTheo)` nhan cua thu ba, ben goi do `dangTheo` TRUOC khi doi the sang
  (y nhu `apDauDoc`). Khoi dau chua co the nao sang -> true -> van cuon. Sua luon chu thich
  noi qua ("dung dung loi cua dau doc").
  [CHUA DO] Lan cai dau do duoc ngay: bam tao voi >= 5 khoi, cuon xuong day, bo tay, ghi
  `scrollTop` truoc/sau 5 giay.

### De lai, co ly do (2 ghi-chu)

- **Cua so chong lenh host giua nhip tham do va luot tao** - KHONG sua. Doc lai ma: vong
  tham do bi do han khi `chay !== null` (`dangChay` nam trong deps cua effect), moi chang
  deu co chot `if (dung) return`, va vong tao chay TUAN TU (moi lan `await` xong moi goi lan
  sau). Chi con mot cua so: lenh `docVung`/`viTriDauDoc` DA BAY truoc khi effect bi do thi
  chong voi `napLaiHost()` + lan goi host dau tien. CEP xep hang `evalScript` nen hau qua
  thuc te (neu co) chi la cham them mot nhip doc nhe - **CHUA DO**. Neu lan cai dau thay
  luot tao dau tien cham bat thuong: cho nhip dang treo ket thuc truoc khi vao vong (co san
  loi `banRef`) roi do lai thoi gian khoi 1 so voi khoi 2.
- **Pill vua doi NHAN vua doi `aria-pressed`** - KHONG tu doi. Hai nhan la loi anh Tien giao
  nguyen van ("Chon tat ca (31)" / "Bo chon (31)"), con chuan ARIA APG khuyen nut toggle giu
  nhan CO DINH va de `aria-pressed` noi trang thai; bo doc man hinh se doc "Bo chon (20), nut
  bat/tat, DA BAM" - mot trang thai noi hai lan bang hai loi co the hieu nguoc nhau. Day la
  cho **anh chot A/B**: (a) giu nhan doi + bo `aria-pressed`, hay (b) nhan co dinh
  "Chon tat ca (19/20)" + giu `aria-pressed` ca ba muc. Tuyet doi khong lam cach thu ba
  (dat `aria-label` tinh khac chu tren nut) - dieu khien bang giong noi se khong bam duoc.

### Con no
- **Phep kiem thuan cho ham dung cau ket qua** (cauRong / dem gop / taoMaLoi) - CHUA LAM:
  doan do nam trong `App.tsx` va goi `dp`/`dich` cua tang giao dien, tach ra file thuan phai
  chuyen `dp` vao bang tham so. Khong lam trong luot sua loi ngay truoc lan cai - ghi lai de
  lam cung luc tach cac ham dung cau khac.
- Khoa `Dang dung...` trong `chu.ts` nay khong ai goi (14 -> 15 khoa mo). Giu lai vi con la
  cau dung khi nao co cho hien khong an be rong.

## [0.1.1-soat] - 2026-09-21 09:09 (UTC+7) - SUA LOI SOAT TAB LOI: 1 CHAN (byte NUL lam panel mo ra TRANG) + 4 nen-sua + 5 ghi-chu. CHUA CAI

### Trang thai hien tai
- `npm run build` sach VA di qua chot chan moi: `dist/index.html` 563,06 kB, **0 byte NUL**.
- `npm run kiem` **201 DAT / 0 HONG** (truoc 189/0; them 7 phep mau so + 5 phep muc (7i) moi).
- Quet khoa dich: **232/232 khoa co ban EN**, 0 khoa lech cho trong `{x}`.
- Do THAT tren Chrome voi dist DA BUILD (file://) va tren che do `?dem=`. KHONG chay
  ExtendScript, KHONG cai, KHONG mo/dong Premiere (Premiere dang mo bai cua anh).

### ☠️ LOI CHAN: mot byte NUL trong ma nguon = PANEL MO RA TRANG TRON
`client/src/services/xuat.ts` dong 199 co MOT byte NUL (0x00) + mot byte 0x1F nam TRAN
(`/[<NUL>-<0x1F><>:"/\\|?*]+/g` - dinh bay brain 5ax: vo lenh gop mat mot tang thoat).
Regex van chay dung nen `tsc` sach, `vite build` sach, `npm run kiem` 189/0.

Em TAI LAP lai loi bang Chrome tren dist da build (566.266 byte, build 08:23):
- console: `Uncaught SyntaxError: Invalid regular expression: /[?-<>:"/\\|?*]+/g:
  Range out of order in character class` · `<div id="root"></div>` **RONG**.
- Goc co hoc: Vite goi ca bo ma vao MOT khoi `<script>` noi tuyen; bo doc HTML doi
  U+0000 thanh U+FFFD o trang thai "script data" -> lop ky tu thanh KHOANG NGUOC ->
  ca bo ma chet ngay dong dau. `vite dev` khong lo vi file phuc vu dang `.js`.
- Sau khi sua + build lai: `#root` co `<div class="app"><header class="topbar">...`,
  console chi con dong tin "khong nap duoc module path - panel dang chay ngoai Premiere?".
  **Mot byte, hai chieu, cung mot file.**
- Hau qua thu hai da do: `git diff --no-index` truoc khi sua ra `Bin 8574 -> 8574 bytes,
  0 insertions` (git coi la NHI PHAN); sau khi sua ra `1 insertion(+), 1 deletion(-)`.
  `grep -rn "mocSrt" services/` truoc: `Binary file ... matches`; sau: in dung 3 so dong.
  Tuc hai phep kiem bat buoc cua du an (`git grep` ID/cong panel khuon, grep ma mau cung)
  dang cho AM TINH GIA tren chinh file nay.

**Sua:** `const KY_TU_CAM = /[\x00-\x1f<>:"/\\|?*]+/g` (bon ky tu ASCII `\x00`, khong phai
byte NUL). Ghi bang script do cong cu Write sinh ra roi chay file - khong heredoc (5ax).

**Chot chan (luat 5aj) + DOI CHUNG:** `tests/kiem-byte.mjs`, cam vao `npm run build` va
`npm run kiem` muc (7i).
- Ma nguon CUA MINH: cam moi byte < 0x20 ngoai TAB/CR/LF.
- Ban da dong goi: **chi cam NUL**. Vi sao khong cam het: ban DANG CAI VA CHAY THAT hom
  nay (build 19/09, `dist/index.html` 545.031 byte) co **NUL 0 · 2 byte dieu khien khac** -
  do la `const as="\x1f", ss="\x1e"` cua chinh React. Bat ca hai loai la bao do mot ban
  chay tot (brain 5as: dung lay danh sach do MINH tu doan lam thuoc).
- Doi chung trong bo kiem: file co NUL -> BAO DO 1 file · file viet bang `\x00` 4 ky tu ->
  BAO SACH · ban goi co 0x1F/0x1E -> KHONG do · ban goi co NUL -> DO. Chay thu truoc khi
  sua: chot chan bao do dung `dist/index.html` + `tests/js/xuat.js`.

### Da sua tiep (4 nen-sua)
1. **Nut chep de len chip tu khi bung cau** - `.cau__do` neo `top:50%` vao the `.cau`, ma
   `<ol class="ds-tu">` nam TRONG cung the do, nen bung cau ra la nut roi xuong giua vung
   chip. Sua: `top: var(--sp-1)`, bo `transform`. Do tren dist da build, `?dem=` 795 cau,
   thu 336 dong co >= 6 tu, **co DOI CHUNG** (cham lai `top:50%`):
   | | dong co chip bi nut de | nut cach dong chu |
   |---|---|---|
   | ban cu (doi chung) | **1/336** (chip "thấp10:00.8 · 0.92") | trung binh **+74,2 px**, xa nhat **+394,1 px** |
   | ban moi | **0/336** | **-12,3 px** (nam tren dong chu) |
   Dong gap lai: nut cao 20 px, cach dinh dong 4,0 px. Khung do 512 px (Chrome headless
   ep toi thieu ~500 px - bay da ghi trong memory du an); hep hon **CHUA DO**, ma hep hon
   thi chip cham xa hon sang phai nen kha nang de CAO HON, khong thap hon.
2. **Tab "Toan bo loi" khong co dong phim tat** - Shift+bam (thu DUY NHAT gom duoc mot
   khoang cau) va Esc khong co duong nao khac de biet. Them mot dong `.phim-tat` cung
   khuon voi tab khoi. Do: VI "Bấm nhảy tới câu · Shift+bấm chọn cả khoảng · Esc bỏ chọn ·
   → xem từng từ" · EN "Click jump to a sentence · Shift+click select the whole range ·
   Esc deselect · → show every word" · rong 473 px, `scrollW = clientW` -> **0 cuon ngang**
   (`.than` 497 = 497). Tab khoi giu nguyen dong cu.
3. **Chep MOT cau khong bao o cho bam** - den "Da chep" nam o DAU tab (khong dinh), bam
   chep o cau thu 700 thi den hien cach may nghin pixel. Sua: App dat `data-vua-chep`
   THANG len dong vua bam (y nhu `data-phat` / `data-chon`, khong qua props) - nut chep
   doi sang mau `--ok` 1,5 giay. Do: opacity `0 -> 1 -> 0`, vien
   `rgba(255,255,255,0.1) -> rgb(78,201,138) -> rgba(255,255,255,0.1)` (bo thuoc tinh =
   doi chung). Va **tach trang thai**: chep 1 dong KHONG con bat den cua nut "Chep ca bai"
   (truoc day dang chon 321 cau ma bam chep 1 dong thi nhan doi thanh "Da chep 1 cau").
   Bam THAT vao nut chep tren dist da build (che do thu, cu bam gia nen khong co user
   activation -> ca hai duong chep deu truot dung nhu bao cao 08:20): nhan nut dau tab
   **"Chép cả bài" -> "Chép cả bài"** (khong doi, dung y sua), khong bat den tren dong,
   panel bao dung cau huong dan *"Không chép được vào bộ nhớ tạm. Bấm vào một câu, chọn
   chữ rồi nhấn Ctrl+C."*, panel con song (795 dong). Duong THANH CONG chua do duoc ngoai
   Premiere (doi cu bam that cua nguoi dung).
4. **Loi Node tho lot ra man hinh** - `ghiCanhMedia` goi `existsSync`/`writeFileSync`
   NGOAI try, ma luoi cuoi cua `thanhLoi` chi bat `spawn …` / `Command failed` -> ca
   `EPERM: operation not permitted, open 'E:\...'` di thang ra man hinh (tieng Anh tho,
   lo duong dan). Sua: `loiGhi()` doi theo `e.code` (EACCES/EPERM/EROFS · ENOSPC ·
   ENOENT/ENOTDIR · EBUSY · con lai) thanh cau da dich, nguyen van dua vao `chiTiet`
   (tooltip). **CHUA DO that** (can o chi doc / o mang - chi lam duoc trong Premiere);
   da kiem: moi loi fs nam trong try (doc lai file), 5 khoa moi co ban EN.

### Da sua tiep (5 ghi-chu)
- **Mau so cua o "khong chac" sai** (brain 5k-bis): tu so dem tren cau KHONG bia, mau so
  in ra la TONG ke ca bia. Them `soThat = soCau - soBia` vao `SoLieuLoi`, o "khong chac"
  dung `soThat`, o "bia" giu `soCau`. Do tren du lieu that (dem C4091, 795 cau, 22 bia):
  man hinh nay ra **"khong chac 105/773 · bia 22/795"** - truoc la 105/795. Bo kiem them
  7 phep bat bien tren 3 file (Conspiracy la ca duy nhat co soBia > 0: 363 -> 310).
- **.srt ghi moc theo SEQUENCE ma dat canh video + mang ten video** - keo thang vao video
  goc la lech dung bang phan trim, khong dau hieu gi. Da them mot menh de vao cau bao:
  *"Moc trong file tinh theo SEQUENCE - doi chieu tren Timeline, dung keo thang vao video
  goc."* ☠️ **CHO ANH CHOT** (brain 5ay, hai huong ngang nhau): (a) giu truc SEQUENCE nhu
  hien nay, hay (b) xuat theo truc FILE GOC (`srcTu`/`srcDen` da co san trong `CauSeq`)
  de .srt dung duoc thang voi video. Em khong tu chon.
- **CRLF**: duong tai ve (`taiVe`) giu `\n` trong khi duong ghi canh video doi CRLF ->
  moi phep do tren trinh duyet noi ve mot file KHAC file khach nhan. Sua: dung chung ham
  `crlf()` cho ca hai duong (bo Transcripts luon CRLF).
- **Cau canh bao marker** noi "so voi dau khoi" cho CA HAI nguon chon; dat marker tu VUNG
  CAU thi khong co khoi nao -> doi thanh "so voi moc dau da chon" (khoa moi + ban EN).
- **Phim `E`: BO** (chi tiet o so loi tai dien #10 trong `CLAUDE.md`). `E` la phim mac dinh
  *Extend Selected Edit to Playhead* cua Premiere; `preventDefault()` chi chan trinh duyet
  nhung, KHONG chung minh Premiere khong an cung cu phim, ma hom nay khong do duoc. Grep
  skill `adobe-cep-panel` truoc khi quyet (brain 5q): **0 dong** ve phim bi host an. Giu
  `←`/`→` vi xau nhat la dau doc nhich mot khung; bung cau van co chevron.

### QUY MO THAT - lop DOM, cho lan truoc ghi CHUA DO (brain 2b)
Nhan ban dem 795 cau len 3 lan = **2.385 cau / 29.532 tu (177 phut)**, do bang CDP tren
Chrome chay DONG HO THAT, thuoc "toi luc DOM doi xong" (MutationObserver + mot vong tinh
bo cuc):

| Viec | 2.385 dong (31.671 the DOM) |
|---|---|
| Bung 1 cau (22 tu) x5 | 13,4 / 13,4 / 13,8 / **23,8** / 14,9 ms |
| Gap lai x5 | 13,3 / 13,8 / 13,8 / 23,1 / 15,5 ms |
| Bam 1 cau (neo vung chon) | 10,2 ms |
| Shift+bam chon CA BAI (2.385 dong sang) | **9,0 ms** |
| Esc bo chon | 9,0 ms |
| Bung 1 cau khi dang chon ca bai | 15,5 ms |
| DOI CHUNG cho thuoc (doc `offsetTop` ca 2.385 dong) | 3,6 ms |

- Duong VUNG CHON (di qua DOM) **khong phu thuoc so dong chon**: 9,0 ms o 2.385 dong, y
  nhu 2,7 ms o 803 dong hom qua - dung bai hoc "vung chon khong duoc di qua props".
- Bung/gap mot cau la cho DUY NHAT con di qua props (`moCau` la `Set` -> `DsLoi` chay lai
  vong map qua het 2.385 dong): **4/5 lan duoi mot khung hinh (16,7 ms), 1 lan 23,8 ms**.
  Chua vuot nguong den muc phai sua ngay, nhung day la cho dat nhat con lai. Huong sua
  neu can: chia danh sach thanh tung CUM ~200 dong (moi cum mot component memo) hoac dua
  `mo` xuong DOM y nhu `data-chon` - **chua lam, cho anh chot** vi la doi kien truc cua
  mot tinh nang anh vua chot sang nay.
- ☠️ **Hai lan thuoc hong truoc khi ra so nay** (ghi de phien sau khong mat thoi gian):
  (1) Chrome `--virtual-time-budget` lam `performance.now()` chay theo dong ho AO -> ca 5
  phep ra **dung 0,0 ms**, cac so khac deu la boi cua 4 ms. So qua deu = thuoc hong
  (brain 5ao), phai bo virtual time va dieu khien bang CDP. (2) Do "cong dong bo trong cu
  bam" ra 0,1 ms cho viec bung cau trong khi gap lai ra 6 ms - React day viec sang
  microtask nen thuoc BO SOT; hai so lech nhau vo ly = mot trong hai la cong cu do
  (brain 5). Con so dung la thuoc MutationObserver o bang tren.
- Va: thuoc quet khoa dich cua em luc dau bao "thieu 12 khoa EN" - sai, vi bang dich viet
  gia tri bang NHAY KEP khi cau tieng Anh co dau `'`, ma regex cua em chi bat nhay don.
  Sua thuoc: bat ca hai kieu nhay -> **0 khoa thieu**. Danh sach "14 khoa khong ai goi"
  cung la am tinh gia: chung duoc goi qua BANG (`DsKhoi.tsx`, `ThanhHanhDong.tsx`,
  `moc.ts`) chu khong qua `dich('...')` truc tiep.

### File da sua
`client/src/services/xuat.ts` (byte NUL + `soThat`) · `client/src/services/luuRa.ts`
(`crlf` + `loiGhi` + boc fs trong try) · `client/src/ui/DsLoi.tsx` (mau so) ·
`client/src/App.tsx` (den vua-chep qua DOM, tach `daChep`, cau marker, bo phim `E`,
dong phim tat tab loi, menh de moc .srt) · `client/src/styles.css` (`.cau__do` +
`[data-vua-chep]`) · `client/src/chu.ts` (+12 khoa, 1 khoa doi cau) ·
`client/package.json` (build chay chot chan) · `tests/kiem-byte.mjs` (MOI) ·
`tests/kiem-hoidap.mjs` (muc (7i) + 7 phep mau so) · `CLAUDE.md` (so loi #9, #10,
trang thai, quy uoc). **KHONG sua `kieu.ts`, khong sua `moc.ts`, khong sua host,
khong sua panel khac, khong commit.**

### Con no / CHUA DO
- Nhung muc CHUA DO cua ban 08:20 con nguyen (chep vao bo nho tam trong Premiere, ghi
  file canh video trong Premiere, dat marker / tao sequence tu VUNG CAU).
- `loiGhi` chua do that (o chi doc / o mang / file bi khoa).
- Den "vua chep" duong THANH CONG: chua do (chi do duoc duong truot + do thang CSS bang
  cach dat/bo `data-vua-chep`). Lan cai dau: bam nut chep tren mot dong roi xem nut co
  xanh ~1,5 giay va dan ra Notepad co dung cau do khong.
- Phim `←`/`→` trong Premiere: chua do (so loi #10 ghi ro 3 so phai do lan cai dau).
- Truc moc cua file .srt (sequence hay file goc): cho anh chot.
- Bung 1 cau o 2.385 dong: 23,8 ms o lan te nhat - cho anh chot co doi kien truc khong.

## [0.1.1-tab-loi] - 2026-09-21 08:20 (UTC+7) - TAB "TOAN BO LOI" SAU HON: so lieu, tung tu + p, chon vung cau, chep / xuat .txt .srt

### Trang thai hien tai
- `npm run build` sach (dist 560,39 kB; truoc 540,34 kB = +20 kB cho ca phan nay).
- `npm run kiem` **189 DAT / 0 HONG** (truoc 135/0 - giu nguyen 135 phep cu, them 54 phep muc (7)).
- Quet khoa dich: **220/220 khoa co ban EN**, 0 khoa lech cho trong `{x}`.
- Do THAT tren trinh duyet (che do `?dem=` + dem Machine 803 cau). KHONG chay ExtendScript,
  KHONG cai, KHONG mo/dong Premiere (Premiere dang mo bai cua anh).

### Boi canh
Anh Tien chot 21/09: GIU nguyen kieu THE cho tab "Khoi hoi-dap", chi lam sau hon tab
"Toan bo loi" - *"khi full scripts em phai doc va show ra details chi tiet duoc khong em"*.

### Da lam (5 viec anh giao)
1. **Dau tab mot dong so lieu**: so cau · thoi luong NOI · so cau may nghe khong chac · so cau bia.
   Moi ti le ghi kem MAU SO ("khong chac 1/803") - brain 5k-bis. "khong chac" TRU cau bia ra
   de hai con so khong de nhau (5k-ter). "Thoi luong noi" = HOP khoang cac cau khong bia
   (cong don la dem hai lan cho cau chong moc).
2. **Moi dong cau**: moc gio · nhan khoi "Q3" khi la cau mo dau khoi (nhan nay song ca khi
   dang loc, khac vach khoi) · chu · DO DAI cau. Cau bia / tin cay thap giu cach bao cu.
3. **Bung mot cau** (chevron hien san + phim -> / E / <-): hien TUNG TU kem moc "m:ss,d" va
   diem tin cay p (2 so le); tu co p < 0,5 to vang; bam vao tu = dau doc nhay DUNG moc tu do.
4. **Chon nhieu cau lien nhau**: bam cau dau (dau doc nhay theo + lay lam neo), Shift+bam cau
   cuoi -> ca khoang; Esc bo chon. Thanh day hieu CA HAI nguon chon (khoi o tab the, VUNG CAU
   o tab loi): dem doi theo nguon, nut chinh van la MOT nut "Tao sequence" (vung cau -> luon
   1 sequence nen AN nut mui ten chon cach tao), "Dat 1 marker" phu ca vung. Dung `doanDung`
   (khong `doanNguon`) + `lanDung` tinh 1 lan - y nhu duong khoi.
5. **Chep va xuat**: chep 1 cau (nut tren dong) · chep ca bai / chep phan dang chon · xuat .txt
   va .srt. Trong Premiere: ghi CANH file media dong gop nhieu cau nhat, KHONG GHI DE (ten da
   co thi them " (2)"), bao DUONG DAN THAT ra man hinh. Ngoai Premiere: tai ve bang `a[download]`.
   Moc .srt chuan `00:00:00,000`.

### Quyet dinh trong lan nay (kem ly do)
- **File xuat BO cau bia**: giao dien hien cau bia la "khong nghe ro" chu khong hien chu, nen
  xuat nguyen van chu may bia vao .srt la dua rac cho nguoi dung. Tra `soBoBia` de noi ra.
- **KHONG sua chu cau tin cay thap** (khong them "(?)"): do la loi that, chi may khong chac.
- **Khong tu sua moc chong lan**, chi DEM va bao (`soChongLan`) - sua la bop meo moc that.
- **Cue dai 0 giay keo them 1 ms** (`soKeoDai`) vi trinh phat bo qua cue dai 0.
- **Khong ghi de file**: them " (2)" thay vi ghi de - luat 4 (viec kho dao nguoc).
- Xuat / chep ap cho VUNG DANG CHON, chua chon thi ca bai; nhan nut noi ro ("Chep 321 cau" /
  "Chep ca bai") nen khong can them mot dong giai thich.

### Kiem chung bang so (tu do, khong phai suy)
- `npm run kiem` muc (7), 54 phep: id cau = chi so mang (App cat vung chon bang chi so) ·
  tung tu cua cau phu HET nd.tu (28.695/28.695), nam trong [cau.tu, cau.den], p trong [0,1] ·
  `soLieuLoi` doi chieu THUOC DOC LAP (danh dau tung mili-giay): Machine 3.183,8 s = 3.183,8 s,
  Gnostic 2.299,3, Conspiracy 879,9 · `mocSrt` sat mep (59,9996 -> 00:01:00,000; 3.599,9999 ->
  01:00:00,000) · .srt sinh ra roi PHAN TICH LAI: 803 cue, so thu tu lien tuc, moc lech
  **0,00 ms**, khong cue dai 0, khong \r · Conspiracy bo dung 53 cau bia (363 -> 310 cue) ·
  .txt 803 dong, cot moc = mocHienThi, cot chu = nguyen van.
- **Quy mo that (luat 2b)**: 3 clip Machine = **2.409 cau / 28.695 tu (2:44:40)** ->
  `soLieuLoi` 0,6 ms + `xuatSrt` 2,6 ms (237 KB) = **3,3 ms** (yeu cau < 200 ms); cat vung
  500 cau giua bai < 20 ms; slice tu cho ca 2.409 cau 0,2 ms.
- **PHA THU (doi chung)**: dot bien 7 cho trong ban da bien dich `tests/js/xuat.js` (cong don
  thay vi hop khoang · chia giay truoc khi tron ms · dau cham thay dau phay · khong bo cau bia ·
  khong keo cue dai 0 · bo cot moc .txt · khong bo ky tu cam trong ten file) -> **7/7 BI BAT**.
  Lan dau 6/7: dot bien "chia gio/phut/giay truoc" cua em van nho so dung nen KHONG phai
  thuoc mu - viet lai dot bien cho dung thi bat duoc (00:59:59,1000).
- **Trinh duyet (che do thu, 803 cau Machine, bam gio bang MutationObserver)**: tab loi ra
  803 dong / 10.543 the DOM · dong so lieu ban EN dung "Sentences: 803 · speech 53:03 ·
  unsure 1/803 · made up 0/803" (khop bo kiem) · bung 1 cau 8,3 ms (16 tu) · bam 1 tu 15,5 ms ·
  khung hep 285 px: **0 phan tu tran, 0 cuon ngang** · tab khoi KHONG bi anh huong (20 the,
  34 dong cau trong the, 0 chevron, 0 nut chep, 33 nut "Tach tai day" nhu cu).
- **Xuat file (ngoai Premiere, da chan that su tai ve)**: ten file + cau bao dung, blob
  `text/plain;charset=utf-8`, byte dau **EF BB BF** (BOM UTF-8), dong dau "0:00<TAB>This is a microchip."

### Bai hoc do duoc trong lan nay: vung chon KHONG duoc di qua props
Ban dau em truyen `chon` xuong tung dong. Do tren 803 cau: **Shift+bam chon 501 cau = 43,2 ms**,
keo tiep toi 794 cau 28,4 ms, **Esc bo chon 794 cau = 57,2 ms** - moi cu bam dung may 3-4 khung
hinh. Sua: App dat `data-chon` THANG len DOM (`veVungChon`, y nhu `data-phat` cua dau doc) va
tach phan DAU tab ra thanh `DauLoi` de danh sach khong nhan prop nao cua vung chon.
Do lai: **2,7 ms / 1,9 ms / 2,0 ms** (nhanh 16-28 lan). Bam 1 cau 10,9 ms (co ca cu nhay dau doc).
-> Luat cho phien sau: thu gi doi tren HANG NGHIN dong (to sang, tich chon, dau doc) thi di qua
DOM + mot vong `useLayoutEffect`, dung di qua props.

### Bay da tranh: vung chon la KHOANG id lien nhau + dang loc
Shift+bam luc dang loc thi cau KHONG khop nam giua cung vao vung (vi vung la mot khoang id).
Khong de im: co cau an thi hien hang chu "Vung chon gom {n} cau lien nhau, trong do {m} cau
khong khop o tim nen dang bi an."

### Con no / CHUA DO
- **Chep vao bo nho tam trong Premiere: CHUA DO.** Panel CEP nap trang qua `file://`, ma
  `navigator.clipboard` doi "secure context" - da giu DU HAI duong (API moi, roi
  `document.execCommand('copy')` tren o an). Do tren trinh duyet voi cu bam GIA (khong co
  user activation): ca hai duong truot va panel hien dung cau huong dan
  "Khong chep duoc... chon chu roi nhan Ctrl+C" (dung y thiet ke, khong im lang, khong ma tho).
  Lan cai dau: bam that nut "Chep ca bai" roi dan ra Notepad.
- **Ghi file .txt/.srt canh video trong Premiere: CHUA DO** (chi do duong tai-ve ngoai Premiere).
  Can kiem: duong dan co dau tieng Viet / khoang trang, o chi doc, file cung ten da co
  (-> " (2)"), va Premiere co nhan .srt co BOM khong.
- Dat marker / tao sequence tu VUNG CAU: **CHUA chay trong Premiere** (chi di qua cung duong
  `doanDung` + `sv_taoSequence` da chay voi khoi).
- Tu hien "0.50" van co the bi to vang (p that 0,4996 - chip lam tron 2 so le). De nguyen.
- Muc trang thai dau `CLAUDE.md` con ghi "CHUA cai, CHUA chay trong Premiere lan nao" - het
  dung tu lan chay 21/09; nguoi chay Premiere hom nay cap nhat lai (em khong do duoc so do).

### File da sua
`client/src/services/xuat.ts` (MOI, thuan) · `client/src/services/luuRa.ts` (MOI, Node+DOM) ·
`client/src/ui/DsLoi.tsx` (tach `DauLoi` + `DsLoi`) · `client/src/ui/HangCau.tsx` ·
`client/src/ui/ThanhHanhDong.tsx` (hieu 2 nguon chon) · `client/src/ui/chung.tsx`
(`soLe` / `mocTu` / `daiHienThi` + 2 icon) · `client/src/App.tsx` · `client/src/styles.css` ·
`client/src/chu.ts` (+49 khoa EN) · `client/package.json` (them xuat.ts vao `npm run kiem`) ·
`tests/kiem-hoidap.mjs` (muc (7), 54 phep). **KHONG sua `kieu.ts`, khong sua `moc.ts`,
khong sua host, khong commit.**

## [0.1.0-soat] - 2026-09-19 13:37 (UTC+7) - SUA LOI 3 NGUOI SOAT (1 chan, 15 nen-sua, ghi-chu re+an toan). CHUA CAI

### Trang thai hien tai
- `npm run build` sach (dist 540,34 kB). `npm run kiem` **135 DAT / 0 HONG** (truoc 114/0; them muc 3b).
- Premiere GIA (scratchpad `sua-loi/host`, host + cep THAT): **97 DAT / 0 TRUOT**.
- **VAN CHUA cai, CHUA chay trong Premiere.** Buoc cai do agent chinh lam.
- Host doi hop dong goi: `sv_taoSequence(id, ten, ds, coLuu)` / `sv_noiTiep(id, idMoi, ds, coLuu)`;
  `sv_getRangeClips` gui ca clip TIENG. Phien ban host van 0.1.0 (chua cai lan nao).

### Boi canh
Buoc soat sau ghep: 3 nguoi soat (an toan host · dung so · luat giao dien) bao 37 muc co bang
chung. Anh Tien: "lam di em". Moi muc: mo file kiem lai bang chung roi sua goc, hoac ghi ly do bac.

### Loi CHAN (da sua goc)
- **Host co clip HINH thi KHONG gui clip TIENG** -> panel nghe tieng cua file gan voi clip hinh,
  khong nghe thu nguoi xem nghe. Hai ca hay gap hong IM LANG: B-roll cat chen ngay tren V1 khi loi
  phong van o A1 chay lien ben duoi; L-cut/J-cut. Do lai tren dem that C4091 (sequence 240 s, B-roll
  12 s): nguoi xem nghe 726 tu, ban cu doc 683 (mat 43, co ca 1 cau hoi), va doanDung dua host dung
  CHINH doan B-roll giua cau tra loi. Sua: host gui ca V lan A (`sv_getRangeClips`, ca 2 che do);
  `moc.ts chonClipNghe` viet lai: chon LAN HINH bang dung luat cu (nhac nen / mic roi chi-co-tieng
  KHONG duoc thang lan), roi nghe bang clip TIENG lien ket cua doan hinh duoc giu, clip nghe chong
  nhau thi cat dau / bo phan bi phu tron; `dung` doi tieng -> hinh cung cap. Sau sua: 726/726.

### Nen-sua (da sua goc)
- Anh tinh (logo/anh nen/anh bia) bi chon lam lan NGHE (so tong thoi luong) -> loai anh khoi lan nghe.
- `docJson`: cau bi bo (den <= tu) van day TU vao tu[] + token chi dau cach thanh tu rong -> "ban
  nghe bi lech" kep vinh vien (Whisper tat dinh). Sua docJson + nut "Nghe lai" nam NGAY canh cau bao
  loi (truoc: man bat dau khong co nut nao).
- Kiem thieu chot chan loi 2 Transcripts (moc tinh tu dau vung): them fixture vungTu 12,5.
- `sv__catInOut`: in/out goc am / ra <= vao -> dung TRUOC khi ghi (truoc: ghi roi moi bao INOUT_CHUA_TRA).
- `dsSequence` tra [] cho moi loi -> vong tham do bo ban dung va KET "" mai. Nay: loi -> null, bo nhip.
- `moHo` host dem ma panel khong doc -> nay TU CHOI (ma CHON_MO_HO, to vang).
- Chu ky thuat len man hinh: "ban THIEU" (nay NAP_LOI), ten API trong THIEU_API (nay o tooltip),
  loi Node tho "spawn ... ENOENT"/"Command failed: <dong lenh>" (nay boc thanh cau + tooltip).
- Tu cuon theo dau doc giat khi dang thao tac: danh dau ca pointerdown/keydown/focus; khong bam khi
  menu/o sua/hop hoi dang mo; chi bam khi cho dang phat con trong khung nhin.
- To nham cau TRUOC sau khi bam cau (dau doc bat luoi khung): dung sai 1 khung.
- Nut "Dat marker" cung la nut XOA marker cu -> dem lai luc bam, co marker cu thi HOI bang so.
- Host nap hong -> tach khoi "chua mo sequence", noi ra; nap lai vi CHUA_NAP theo gioi han 10 s.
- "Clip dang chon: 52" khi chon > 50 muc (dem tho) -> hien "nhieu".

### Ghi-chu da sua (re + an toan)
moLai=0 bao ra + khong de vong tham do nhay theo · soDiem / lechDau (doc lai moc dau marker) bao
ra · luu project CHI lan goi dau cua luot (truoc: moi khoi 1 lan) · marker nhan theo tien to 'SV '
VA chu ky '[AiO SV]' cuoi ghi chu (truoc: chi tien to = xoa theo mau, bai 5am-ter) · doanDung O(n^2)
+ tinh lai moi khoi -> `lanDung` tinh 1 lan · beforeunload goi huy() + don file tam cu (mau ten
chinh xac, > 6 gio) · cho bam "Doc noi dung" khi thieu bo nghe (du dem thi khong can) + khung thieu
may to vang · "Vung da doi" gia khi bo chon · nut xanh lo cam khi re chuot · mep thanh day lech
15 px · so marker tren nut Xoa lam moi khi re chuot · chu thich hoidap.ts + bang dau "?" CLAUDE.md.

### Kiem chung bang so
- Cat chen (Heygen 330 tu, B-roll [30,40)): chi hinh doc 286 (mat 44) -> ca tieng 330. C4091 that
  726/683 -> 726. L-cut: 122 -> 145 (= so tu src [0,35)). doanDung(20,50) = 1 doan hinh, khong B-roll.
- Anh: logo dai hon 60 s / dai hon 1 khung / anh nen hoa -> nghe phong van; doi chung cung hinh hoc
  doi duoi .mp4 -> lop phu thang (thuoc khong mu).
- Nhac nen dai hon 5 s: nghe phong van (doi chung chi tieng: nhac thang).
- Pha thu (sua 1 cho trong moc.js / host / cep ban CHEP): 5/5 dot bien nao -> HONG; 8/8 dot bien
  host+cep -> TRUOT. Truoc: dot bien "tru vungTu" van 114 DAT (thuoc mu).
- Quy mo 886 clip V+A, 65 khoi: doanDung 11.202 ms -> 7,0 ms (lan tinh san), 101,8 ms (tinh lai moi
  khoi); tu giu 8.879 = 8.879 tinh doc lap.
- To sang (803 cau Machine, ban chep ham App): 29,97 fps cat xuong 802/803 sai -> 0/803; 25 fps
  lam tron 25 -> 0.
- Trinh duyet (che do thu, dist that): mep phai the khoi 953 = ruot thanh day 953 (truoc 968);
  menu mo + dau doc sang khoi cuoi: scrollTop 0, menu con mo (doi chung khong menu: 2.098);
  cuon di cho khac: khong keo ve (doi chung: 2.117); bam checkbox < 4 s: khong keo. Man bat dau
  voi dem lech: cau + nut "Nghe lai"; 300 px VI/EN: 0 phan tu tran.
- execFileAsync THAT: file khong ton tai / chet khong stderr -> cau chung, tooltip "whisper-cli.exe
  code=ENOENT". donTamCu (temp rieng): 5/5 dung ky vong.
- ES3 host (acorn ecmaVersion 3): 0 loi. Ky tu chuong \x07 trong file da sua: 0.

### De lai / bac (ly do)
- In/out TACH hinh-tieng (Mark Split): de lai — getInPoint(1|2) chua do, doan sai la chan nham MOI
  lan dung. Do tren item tu tao co Mark Split lan cai dau.
- Loi lo duong dan C:/AiO-Studio/whisper khi thieu bo nghe: de lai — thu muc dung chung 3 panel, anh quyet.
- "Vung da doi" khi doi sang clip khac CUNG so luong: de lai — can van tay clip tu sv_getRange.
- Tu luu project truoc khi dung (nay 1 lan/luot): can anh Tien gat co cho tu luu khong (luat 4).

### Con no (do lan cai dau, tren sequence TU TAO)
getInPoint/getOutPoint item CHUA danh dau (neu tra so am thi moi lan dung bi tu choi) · chuoi
sv_getRangeClips dai gap doi · chu ky marker (xuong dong trong comments) + lechDau voi timecode
01:00:00:00 · CEP co ban beforeunload khi dong panel khong · gioi han: podcast chi-tieng + 1 clip
hinh (visualizer) -> lan hinh thang (co dem, khong im lang); vung co hinh thi doan CHI-TIENG khong
co hinh ben tren (loi dan tren nen den) khong duoc nghe, nhu ban cu · cac muc "Con no" cua ban
12:32 van nguyen.

## [0.1.0] - 2026-09-19 12:32 (UTC+7) - BAN CODE DAU TIEN: GHEP 5 PHAN + BUILD SACH (CHUA CAI, CHUA CHAY TRONG PREMIERE)

### Trang thai hien tai
- Code du 5 phan (khung CEP · nghe loi · nao chia khoi · host sv_ · giao dien). Build
  `npm run build` sach, `npm run kiem` 114 DAT / 0 HONG.
- **CHUA cai, CHUA mo trong Premiere lan nao.** Moi so ve host o duoi la Premiere GIA
  (Node vm). Buoc cai (`scripts/sign-install.ps1`) do agent chinh lam.
- Viec ke tiep: cai lan dau + do tren sequence TU TAO (luat 3a) theo danh sach "Con no".

### Boi canh
Anh Tien giao 18/09 (xem [0.0.0]); 19/09 anh: "lam di em". 5 agent dung song song
(11:2x-12:2x), roi mot buoc GHEP + BUILD (muc nay). Ban 0.1.0 KHONG lam "gom doan
cung y nghia" — chi chia HOI-DAP.

### Phan da dung (so do do TUNG agent bao cao — buoc ghep KHONG do lai, tru muc "Ghep")
- Khung: manifest `com.aiostudio.shortviral` 0.1.0, cong 8100, vite dev 5179, dock
  420x760 (CHUA DO tren Premiere, dpr 1,5). FFmpeg LGPL N-125829 chep tu Transcripts (md5 khop).
- Nghe (`services/nghe.ts`, `whisper.ts`, `ffmpeg.ts`): video 55 phut nghe 71,0 s,
  803 cau / 9.565 tu, trung tung byte dem Transcripts 30/07; doc 11/11 dem co san;
  nut Dung 7 lan: 6 lan 102-201 ms, 1 lan 1.442 ms (chua ro vi sao).
- Nao (`services/moc.ts`, `hoidap.ts`): hoi quy khop so 18/09 (Machine 19 khoi,
  Gnostic 14, Heygen 1); 5 file phong van tieng Viet tren G: 33-74 khoi/file; x10
  quy mo (9 gio 50 phut) chia khoi 5,5 ms. Do dung chia khoi tieng Viet: CHUA DO bang tai.
- Host (`host/shortviral.jsx`, `lib/cep.ts`): 13 ham `sv_`, ES3 kiem bang acorn,
  82/82 ca tren Premiere GIA. Khong QE, khong API xuat, khong xoa in/out.
- Giao dien (`App.tsx`, `ui/*`, `styles.css`, `chu.ts`): do tren trinh duyet (che do
  `?dem=`) va host GIA. UI do Claude dung tu token — anh CHUA duyet, thu muc thiet ke
  cua anh con trong.

### Ghep — loi bat duoc va da sua (19/09 12:2x)
1. **Hop dong lech giua NAO va HOST (build sach, tsc 0 loi, van hong):** App dua
   `doanNguon(vung, tu, den)` cho host dung sequence. `doanNguon` tra MOI lan (V1 +
   B-roll V2, moi cam multicam) va ghi "host tu gop theo projectItem" — SAI: host
   (`sv__dung`) dat cac doan NOI TIEP nhau tren MOT track. Hau qua neu cai: khoi co
   B-roll ra sequence = loi noi ROI TOI B-roll noi duoi; multicam ra hai lan noi
   dung; phep kiem do dai cua host van DAT vi `mongMuon` cong ca hai -> hong IM LANG.
   Sua goc: them `doanDung()` trong moc.ts — chi lay dung LAN da NGHE (`chonClipNghe`),
   cap V/A lien ket doi sang clip V. App goi `doanDung`. Dong ghi chu tren giao dien
   noi ro clip chong "khong doc va khong dua vao sequence moi".
   Do: khoi [38,53..55) co B-roll phu [40,50]: `doanNguon` 2 doan / 26,47 s (khoi chi
   16,47 s) -> `doanDung` 1 doan / 16,47 s. 20/20 khoi Machine that: moi khoi 1 doan,
   tong = do dai khoi. Doi chung: sua `doanDung` ve hanh vi cu -> 4 HONG; tra lai -> 0.
2. `ffmpeg.ts` viet `TRAN_TAI_NGUYEN = 0.7` -> `0.70`: `kiem-tai-nguyen.ps1` exit 1 -> 0.
3. Chu thich goi ten panel khuon ("Video Download") o ffmpeg.ts x2, cep.ts, styles.css x2,
   chung.tsx -> viet lai "panel tai video cua bo". Grep ten/ID/cong khuon: 6 dong -> 0.
4. `cep.ts` chi tiet ky thuat "extensionPath r(o nga)ng" co dau -> viet ASCII (ban EN lo tieng Viet o tooltip).

### Kiem chung bang so (buoc ghep)
- `tsc -b --force` exit 0 (23 file); `vite build` -> dist/index.html 531,03 kB (gzip 292,04 kB).
- `npm run kiem`: 108 DAT truoc ghep -> 114 DAT / 0 HONG (them 6 phep doanDung); 0 SKIP.
- Bay 5ak: grep `={}` trong 60 ky tu truoc APPDATA/LOCALAPPDATA/USERPROFILE/TEMP/HOME
  tren dist = 0; chu `process.env` = 1 lan, nam TRONG chuoi canh bao cua ngonngu.tsx.
  Doi chung: build 2 dong `process.env.APPDATA` bang cung Vite -> ra `var n={};n.APPDATA`, grep bat 1.
- Grep bat buoc `videodownload|video ?download|8098|5178|\bvd_|__vd|_vd_|\bac_|\brf_`
  (bo *.md, node_modules, bin, dist, tests/js) = 0 dong; doi chung tren Video Download = 112.
  Them: dist = 0; 10 extension ID khac + cong 8087-8099 + tien to tr_/pd_/am_ = 2 dong,
  deu la chu thich (.debug giai thich chon cong, ngonngu.tsx ban chep chung).
- chu.ts: quet bang TypeScript compiler (thuoc rieng, khong dung script agent giao dien):
  175 khoa, co EN 175, thua 0, lech `{x}` 0, EN con chu Viet 0. 6 cho goi `dich(bien)`
  lan tay: deu tu bang literal da co khoa. Doi chung: doi 1 cau -> thuoc bao thieu 1 + thua 1.
- `dong-bo-tokens.ps1 -KiemThoi` 6/6 khop; `dong-bo-ngonngu.ps1 -Kiem` 6/6 khop.

### Con no (chi tiet trong bao cao ghep)
- Do tren Premiere THAT (lan cai dau, sequence tu tao, luu project truoc): setPlayerPosition
  lech/tre · marker co do dai + mau · getSelection co ton tai · createNewSequenceFromClips
  vao bin rieng · tra in/out khi item goc khong co in/out · 3 lenh evalScript/giay co lam
  Premiere giat · phim J/K/M co bi Premiere nuot · podcast 1 gio / 20-40 short lien tiep.
- B-roll / cam phu KHONG theo sang sequence moi (host dung 1 track) — gioi han, da ghi tren UI.
- Podcast mic roi: host co hinh thi bo track tieng -> khong nghe mic; `tiengKhacFile` host
  dem nhung VungLam chua co truong mang ra (de xuat sua kieu.ts).
- `version.mjs` doc tieu de `[100-phan-tram]` cua Autocut la phien ban: chay `--sua` se ghi
  manifest Autocut (dong bang) thanh 100. Chua sua — can anh / agent chinh quyet.

## [0.0.0] - 2026-09-18 19:53 (UTC+7) - CHUAN HOA FOLDER, CHUA CO CODE

### Trang thai hien tai
Chua co dong code nao. Da co folder o du 3 ngan (Build, Design System, Release).
ID `com.aiostudio.shortviral` · cong 8100.
Viec ke tiep: CHO anh chot ranh gioi voi Auto Cut Short, "cung y nghia" chay may hay
qua mang, file podcast that de do (xem CLAUDE.md muc "Viec CHO").

### Boi canh
Anh Tien 18/09 giao 4 y: biet doan nao dang noi gi ngay trong panel · kiem soat noi
dung · tu de xuat doan cung y / tu tach HOI-DAP thanh doan trong sequence hoac
sequence moi · thao tac muot. Hoi gop vao Autocut hay panel moi -> em de xuat panel
rieng, anh dat ten "Auto Short Viral" va yeu cau "chuan hoa Folder truoc khi bat dau".

### Anh chot 18/09 (AskUserQuestion)
- Giu `AiO Auto Cut Short` la san pham RIENG (khong gop vao day). Cut Short giu 8093.
- "Re-frames dau co lien quan gi toi short viral dau em?" -> hai panel doc lap.
- Chi chuan hoa folder Short Viral luc nay, khong dong app cu.
- Web ban hang: de khi co ban chay.

### Thay doi
Tao (ghi ten tung file luc tao, de don dung danh sach — bai 5am-ter):
1. `Build and UI Design/AiO Auto Short Viral/.gitignore` (chep y het Video Download,
   md5 aad426c2... — chan certs/ truoc moi lan build)
2. `Build and UI Design/AiO Auto Short Viral/CLAUDE.md`
3. `Build and UI Design/AiO Auto Short Viral/PROGRESS.md` (file nay)
4. `Build and UI Design/AiO Design System/AiO Auto Short Viral/README.md` (giu cho)
5. `Release/AiO Auto Short Viral/win/CHUA-CO-BAN-WIN.txt`
6. `Release/AiO Auto Short Viral/mac/CHUA-CO-BAN-MAC.txt` (chep tu Video Download)
Kem: sua 9 file `Release/*/win/CHUA-CO-BAN-WIN.txt` cua app khac — ca 9 cung ghi
"tao thu muc <yyyy-mm-dd>-<so ban>/win", trai Release/README.md (bo tang theo ngay
tu commit b4a271c 14/09). Nay ca 10 file cung noi dung dung.

### Kiem chung bang so
- `find` 3 ngan: Build 3 file, Design System 1 file, Release 2 file.
- `git check-ignore`: 4 file giu cho deu TRACK (len git -> may nha pull ve co folder).
- `git check-ignore -v .../certs/aiostudio-dev.p12` -> bi chan boi .gitignore dong 4.
- md5 10 file CHUA-CO-BAN-WIN.txt: 1 gia tri duy nhat (722797c4...), truoc la 9 file sai.
- Cong 8100: 0 file .debug nao dung; 8099 bi `AiO Auto Re-Frames/xem-rieng.mjs` dung
  nen bo qua. Lan grep "8100" chi ra 1 moc thoi gian trong du lieu test Transcripts
  (`"to": 8100`), khong phai cong.
