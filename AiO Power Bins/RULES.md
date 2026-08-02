# QUY DINH & RANG BUOC DU AN — AiO Studio Asset Manager

Tai lieu nay la **luat chung** cho moi nguoi/AI tham gia du an, o bat ky phase nao.
Muc dich: tranh xung dot, tranh pha vo phan da chay duoc, va biet ro pham vi cua minh.

|                      |                                                                          |
| -------------------- | ------------------------------------------------------------------------ |
| Ngay tao             | 2026-07-24                                                               |
| Ap dung tu phien ban | 0.4.0                                                                    |
| Tai lieu lien quan   | `README.md` · `PLAN.md` · `PROGRESS.md` · `HANDOFF_PHASE2.md` |

**Thu tu uu tien khi cac tai lieu mau thuan nhau:**
`RULES.md` (file nay) > `HANDOFF_PHASE<N>.md` > `PLAN.md` > `README.md`

---

# PHAN A — NGUYEN TAC VANG

Bay nguyen tac khong duoc vi pham trong moi truong hop.

1. **Chi lam dung pham vi phase cua minh.** Thay viec thuoc phase khac can lam thi
   GHI VAO `PROGRESS.md`, khong tu y lam.
2. **Khong sua file nam trong danh sach KHOA** (Phan C) neu khong khai bao truoc.
3. **Khong xoa/doi ten** truong du lieu, ham, hay file da co. Chi duoc THEM.
4. **Moi thay doi ma nguon phai ghi vao `PROGRESS.md`** ngay trong lan lam viec do.
5. **Phai tu kiem chung truoc khi bao xong.** Build sach + ky + cai thanh cong.
   Khong duoc bao "xong" khi chua chay thu.
6. **Khong them thu vien can bien dich native.** (Chi tiet o Phan B.2)
7. **Khong pha cac tinh nang da nghiem thu** cua phase truoc. Neu bat buoc phai doi,
   ghi ro ly do vao `PROGRESS.md` truoc khi doi.

---

# PHAN B — BANG RANG BUOC: DUOC LAM / KHONG DUOC LAM

## B.1. Kien truc

| DUOC LAM                                                     | KHONG DUOC LAM                                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Them service moi vao`client/src/services/`                 | Doi kien truc 4 lop (UI / Service / Host bridge / Storage)                          |
| Them component moi vao`client/src/components/`             | Gop logic Node vao thang trong component                                            |
| Them ham moi vao`host/ppro.jsx`                            | Doi co che giao tiep panel <-> host (van la`evalScript` + chuoi `OK:`/`ERR:`) |
| Them bien token moi vao`:root` cua `styles/_tokens.scss` | Sua gia tri token dang co (se pha giao dien da duyet)                               |
| Them truong TUY CHON (`?`) vao `Asset`                   | Doi ten / xoa / doi kieu truong dang co                                             |

## B.2. Thu vien va phu thuoc

| DUOC LAM                                                                                    | KHONG DUOC LAM                                                                                |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Dung module co san cua Node:`fs`, `path`, `os`, `zlib`, `http`, `child_process` | Them thu vien can bien dich native:`better-sqlite3`, `sharp`, `canvas`, `node-gyp`... |
| Them thu vien JavaScript thuan, dung luong nho                                              | Them thu vien nang lam`dist/index.html` phinh qua 400 KB                                    |
| Them devDependency phuc vu build                                                            | Doi`vite-plugin-singlefile` hoac bat code-splitting                                         |
| Bundle binary vao`bin/` (vd ffmpeg)                                                       | Tai binary luc chay (runtime download)                                                        |

**Ly do cam native:** phien ban Node ben trong CEP khac Node he thong, module native se
khong nap duoc. Day cung la ly do du an giu JSON thay vi SQLite.

## B.3. Nap tai nguyen (anh, video, audio)

| DUOC LAM                                            | KHONG DUOC LAM                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Dung`mediaUrl(duongDan)` cua `mediaServer.ts`   | Dung`file://` truc tiep trong `src` cua `<img>`/`<video>` |
| Ghi anh sinh ra vao`<userData>/AiOStudio/thumbs/` | Ghi file vao thu muc extension da cai (se pha chu ky)             |
| Doc file bang`getFs()`                            | Goi`require('fs')` truc tiep                                    |

**Ly do:** Premiere nap panel qua `file://`, Chromium chan trang `file://` doc file khac
tren dia. Bo qua quy tac nay se lam moi preview den thui.

## B.4. Giao dien

> **He mau hien tai: DEN + CAM** (`--accent #ff5714`). Chu tren nut cam dac PHAI
> dung `--accent-on` (nau gan den) — mau trang chi dat 3.2:1 tren nen cam, truot
> chuan o co chu 12px. Chi tiet: `design-system/aio-studio/MASTER.md`.

| DUOC LAM                                                | KHONG DUOC LAM                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| Them icon SVG vao`components/Icons.tsx`               | Dung emoji hoac ky tu (`♪`, `▦`, `★`) lam icon               |
| Dung bien mau`--text-1/2/3`, `--accent`, `--bg-*` | Viet ma mau truc tiep trong component                                 |
| Dung`--sp-*`, `--r-*`, `--dur`, `--ease`        | Dat khoang cach / bo goc / thoi luong tuy tien                        |
| Them trang thai hover/active moi                        | Go`:focus-visible` toan cuc                                         |
| Them hieu ung chuyen dong 150-300ms                     | Go`@media (prefers-reduced-motion: reduce)`                         |
| Them nut co`aria-label`                               | Them nut chi co icon ma khong co`aria-label`                        |
| Giu tuong phan chu toi thieu**4.5:1**             | Dung mau chu duoi 4.5:1 tren nen tuong ung                            |
| `<img>` chi tro vao file THAT SU la anh               | Tro`<img>` vao file video (.mp4) — se ra bieu tuong anh vo         |
| Anh trang tri dat`alt=""`                             | Dat`alt={ten file}` — anh loi se in ten ra giua o                  |
| Moi man hinh chi MOT nut primary                        | Hai nut primary canh nhau (mat thu tu uu tien)                        |
| Nut co hau qua lon dat XA nut hay dung                  | Nhet nut "quet lai tat ca" canh nut hay bam                           |
| Chi bao khi that bai                                    | Bao "thanh cong" cho viec nguoi dung da nhin thay                     |
| Mot thong diep chi noi o MOT noi                        | Lap cung mot cau huong dan o 2-3 cho                                  |
| Nhan nut la VIEC no lam ("Render preview")              | Nhan nut la TEN thu no tao ra ("Anh xem truoc")                       |
| Nut xoa noi hau qua bang CON SO that, va bam hai lan    | Mot nut xoa sach gop chung rac voi thu dang dung                      |
| `<img>` chi render khi da co URL that                 | Render`<img src="">` — Chromium coi la chinh trang HTML, ra anh vo |

**Bai hoc 0.16.0 (dat gia, mat 3 ban moi tim ra):** khi giao dien hien sai, phai
hoi "DU LIEU dang noi gi", khong chi sua cho hien thi. Anh vo hang loat khong phai
loi cua the — la do `library.json` con giu duong dan toi file da bi xoa, va chinh
duong dan treo do lam hang doi nen tuong "da xong" nen khong bao gio sinh lai.
Sua hien thi 2 lan van khong het; don du lieu moi het.

## B.5. Hieu nang

| DUOC LAM                                                          | KHONG DUOC LAM                                   |
| ----------------------------------------------------------------- | ------------------------------------------------ |
| Chay tac vu nang trong hang doi nen                               | Chay vong lap dai chan luong chinh               |
| Nhuong luong dinh ky:`await new Promise(r => setTimeout(r, 0))` | Lap qua 15.000 phan tu ma khong nhuong luong     |
| Gioi han tien trinh song song theo so nhan CPU                    | Spawn hang tram tien trinh cung luc              |
| Them`useMemo` cho phep tinh nang tren danh sach lon             | Tinh lai danh sach 15.000 phan tu moi lan render |
| Giu co che ao hoa cua`Grid.tsx`                                 | Render toan bo the cung luc                      |

## B.6. Script va cong cu

| DUOC LAM                                              | KHONG DUOC LAM                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Viet script`.ps1` bang **ASCII thuan**        | Dung dau tieng Viet / em-dash trong file`.ps1`                                                             |
| Them buoc moi vao`sign-install.ps1` neu that su can | Bo buoc ky khoi quy trinh                                                                                    |
| Chay`sign-install.ps1` sau moi lan build            | Coi junction/symlink la cach cai (khong con chay duoc)                                                       |
| Ban PHAT HANH dong goi bang`package-release.ps1`    | Phat hanh ban`npm run build` thuong (con auto-reload + `.debug`)                                         |
| Cai bang cach CHEP DE tung file                       | `Remove-Item -Recurse` ca thu muc extension (FFmpeg dang chay se khoa file, xoa nua chung lam panel trang) |
| Kiem tra ma thoat cua lenh native                     | Dung`2>&1` voi lenh native trong PS 5.1 (moi dong stderr thanh ErrorRecord, script chet oan)               |

## B.7. Tai lieu va nhat ky

| DUOC LAM                                         | KHONG DUOC LAM                   |
| ------------------------------------------------ | -------------------------------- |
| Them muc moi vao DAU`PROGRESS.md`              | Sua/xoa muc changelog cu         |
| Cap nhat khoi "Trang thai hien tai"              | De trang thai lech voi thuc te   |
| Lay gio that:`date "+%Y-%m-%d %H:%M %z"`       | Tu bia ngay gio                  |
| Viet khong dau, khong emoji trong`PROGRESS.md` | Dung emoji/icon trong tai lieu   |
| Cap nhat`README.md` khi tinh nang doi          | De README noi sai so voi thuc te |

---

# PHAN C — DANH SACH FILE KHOA (khong duoc tu y sua)

Cac file duoi day **da on dinh va da duoc nghiem thu**. Sua vao rat de lam hong
nhung thu dang chay duoc.

## C.1. Khoa cung — hau nhu khong bao gio can sua

| File                                   | Vi sao khoa                                            |
| -------------------------------------- | ------------------------------------------------------ |
| `client/src/services/mediaServer.ts` | May chu preview; sua sai la moi anh/video den          |
| `client/src/services/autoReload.ts`  | Co che panel tu tai lai                                |
| `client/src/services/ffmpeg.ts`      | Duong dan va spawn process binary FFmpeg/FFprobe       |
| `client/src/services/jobQueue.ts`    | Hang doi xu ly nen Phase 2 & 4; sua sai gay treo luong |
| `client/src/lib/node.ts`             | Cach truy cap Node trong CEP; sai la sap toan bo       |
| `client/src/lib/cep.ts`              | Cau noi ExtendScript                                   |
| `client/vite.config.ts`              | Cau hinh gop 1 file; sua la panel khong nap duoc       |
| `scripts/*.ps1`                      | Quy trinh ky va cai                                    |
| `certs/`                             | Chung chi ky (chua private key)                        |

## C.2. Khoa mem — chi sua khi that su can, phai khai bao truoc

| File                                                  | Vi sao khoa                                                    | Neu can sua thi                                                                                                                                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/src/components/Grid.tsx`                    | Logic ao hoa rat de hong                                       | Ghi ro ly do vao`PROGRESS.md`, giu nguyen phan tinh toan hang/cot                                                                                                                |
| `client/src/components/PowerBinHub.tsx`             | Menu Brand Kit 2 tang (Brand -> Khay)                          | Chi THEM chuc nang, khong xoa state bin. Khay khong co`brandId` PHAI luon hien o "Khay chung"                                                                                    |
| `client/src/services/timelineImport.ts`             | Doc clip dang chon tren timeline + nhan file keo tha           | Premiere KHONG co API keo tu TIMELINE VAO PANEL. Chieu nguoc lai (PANEL RA TIMELINE) thi LAM DUOC — xem 0.18.1                                                                    |
| `client/src/components/SettingsModal.tsx`           | Hop thoai cai dat & bo nho dem                                 | Kiem tra: so do dung luong dung, "Don rac" chi xoa file khong ai dung, "Xoa tat ca" phai bam hai lan                                                                               |
| `client/src/services/cacheAudit.ts`                 | Bo don duong dan treo — sai la mat sach anh da render         | Chi duoc go duong dan NAM TRONG thu muc cache; khong bao gio dung toi file goc cua nguoi dung                                                                                      |
| `client/src/services/macJunk.ts`                    | **CHO DUY NHAT trong panel duoc dung toi FILE GOC cua nguoi dung** — ngoai le chu du an chot 28/07/2026, chi cho rac macOS | (1) Chi nhan dien bang DUNG hai dau hieu: ten bat dau `._`, hoac nam trong thu muc `__MACOSX` — KHONG suy doan them; (2) LUON chuyen vao **Thung rac Windows**, TUYET DOI khong `unlink`; (3) Nut phai bam HAI LAN, noi ro so file + dung luong; (4) Duong dan truyen qua FILE TAM UTF-8, khong nhet vao dong lenh (ten co dau cach + tieng Viet) |
| `client/src/components/Toast.tsx`                   | Thong bao thong minh goc man hinh                              | Kiem tra auto-dismiss 3.2s                                                                                                                                                         |
| `client/src/components/Launcher.tsx`                | Man hinh chon 2 phan chinh khi mo panel                        | Giu DUNG 2 lua chon (Asset Manager / Power Bins) o cung cap bac. Goi Packs da go han o 0.18.0                                                                                      |
| `client/src/services/thumbnailer.ts`                | Bo sinh thumbnail static .jpg cho video                        | Chi dung !asset.thumbPath; khong check !previewPath                                                                                                                                |
| `client/src/services/waveform.ts`                   | Bo sinh waveform .png cho audio                                | Kiem tra mau chu`--t-audio` va cache path                                                                                                                                        |
| `client/src/services/proxy.ts`                      | Bo sinh proxy 360p cho video nang                              | Kiem tra dieu kien >200MB hoac 4K/ProRes                                                                                                                                           |
| `client/src/services/probe.ts`                      | Bo ffprobe doc metadata audio/video                            | Kiem tra parse JSON stdout ffprobe                                                                                                                                                 |
| `client/src/services/scanner.ts`                    | Logic ghep cap preview phuc tap                                | Chi THEM nhanh xu ly moi, khong doi nhanh cu                                                                                                                                       |
| `client/src/services/mogrtThumb.ts`                 | Bo doc ZIP tu viet                                             | Chi THEM dinh dang moi                                                                                                                                                             |
| `client/src/services/library.ts`                    | Doc/ghi + migrate du lieu                                      | Duoc tang`LIBRARY_VERSION` va THEM buoc migrate                                                                                                                                  |
| `client/src/components/Sidebar.tsx` `Toolbar.tsx` | Giao dien nguoi dung da duyet                                  | Chi THEM muc moi, khong bo cai dang co                                                                                                                                             |
| `client/src/styles/_tokens.scss`                    | He token thiet ke (moi mau chu da do >= 4.5:1 tren nen cua no) | Khai bao truoc khi doi; DO LAI tuong phan bang code, khong doan bang mat                                                                                                           |
| `client/src/styles/_mixins.scss`                    | Khuon dung lai cho moi partial                                 | Sua 1 mixin la doi dang o nhieu khoi cung luc                                                                                                                                      |
| `host/*.jsx`                                        | Cau noi Premiere                                               | Chi THEM ham moi                                                                                                                                                                   |
| `CSXS/manifest.xml`                                 | Doi la phai restart Premiere                                   | Khong ha`Version="7.0"`, khong bo co Node/GPU. Ten panel: **AiO Studio - Asset Manager**. Tang phien ban phai sua CA `ExtensionBundleVersion` VA `<Extension Version>` |

## C.3. Tu do sua

- Moi file MOI do phase hien tai tao ra
- `client/src/components/AssetCard.tsx` (trong gioi han o phan D)
- `client/src/state/store.ts` (chi THEM state/hanh dong moi)
- `client/src/types.ts` (chi THEM truong tuy chon)
- `PROGRESS.md` (chi them muc moi o tren cung)

---

## C.4. BAN DO PHU THUOC — sua cho nay thi hong cho nao

Day la phan QUAN TRONG NHAT de tranh lam hu giua cac phan.
Truoc khi sua bat ky file nao, tra bang nay de biet **phai kiem tra lai nhung gi**.

### Chuoi phu thuoc chinh

```
manifest.xml
   |
   +--> Toan bo panel (sai = panel khong mo duoc)

lib/node.ts  (truy cap Node)
   |
   +--> scanner.ts · library.ts · mediaServer.ts · mogrtThumb.ts · autoReload.ts · ffmpeg.ts
        (hong = TAT CA cac service chet theo)

ffmpeg.ts
   |
   +--> thumbnailer.ts · waveform.ts · proxy.ts · probe.ts
        (hong = khong sinh duoc thumbnail/waveform/proxy)

jobQueue.ts
   |
   +--> thumbnailer.ts · waveform.ts · proxy.ts · probe.ts
        (hong = hang doi nen ngung xu ly)

types.ts (Asset)
   |
   +--> scanner.ts --> store.ts --> Grid.tsx --> AssetCard.tsx
   +--> library.ts (file library.json tren dia)
   +--> tree.ts (cay danh muc)
        (doi truong = hong nhieu noi + du lieu cu khong doc duoc)

mediaServer.ts
   |
   +--> AssetCard.tsx (moi anh/video/audio)
        (hong = moi preview den thui)

store.ts
   |
   +--> Toolbar.tsx · Sidebar.tsx · Grid.tsx · AssetCard.tsx · PowerBinHub.tsx
        (moi component deu doc tu day)

host/ppro.jsx --> lib/cep.ts --> store.sendToTimeline --> nut Import
        (hong = khong chen duoc vao timeline)

styles/_tokens.scss  ·  styles/_mixins.scss
   |
   +--> Toan bo giao dien (moi partial deu @use hai file nay)
```

### Bang tra nhanh

| Neu sua file nay                     | Thi PHAI kiem tra lai                                                       | Rui ro neu quen                                                     |
| ------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `CSXS/manifest.xml`                | Mo lai panel sau khi**tat han Premiere**                              | Panel khong mo duoc, hoac mat quyen Node/GPU                        |
| `types.ts` (truong `Asset`)      | Quet lai thu vien · luoi hien dung · cay danh muc · nut Import           | Du lieu cu khong doc duoc, panel trang                              |
| `library.ts` (`LIBRARY_VERSION`) | Mo panel voi du lieu CU tren may                                            | Mat toan bo thu vien da quet, hoac quet lai vo ich                  |
| `ffmpeg.ts`                        | Duong dan ffmpeg.exe & ffprobe.exe                                          | Toan bo thumbnail, waveform, proxy va export chet                   |
| `jobQueue.ts`                      | Hang doi nen video thumbnail, waveform, proxy, metadata                     | Khong sinh duoc thumbnail/waveform nen                              |
| `thumbnailer.ts`                   | Thư mục thumbs/ & file .jpg sinh ra                                       | Video khong co thumbnail static                                     |
| `waveform.ts`                      | Thư mục thumbs/ & file wf_*.png                                           | Audio khong hien dang song waveform                                 |
| `proxy.ts`                         | Thư mục proxies/ & file .mp4 360p                                         | Video 4K/ProRes giat lag khi preview                                |
| `probe.ts`                         | Metadata duration, resolution, fps, bitrate                                 | Khong hien thoi luong va thong so ky thuat                          |
| `PowerBinHub.tsx`                  | Cay Brand -> Khay · khay khong thuoc brand van hien o "Khay chung"         | Mat khay chua toan cuc, hoac khay cu bien mat khoi menu             |
| `library.ts` (`persistAll`)      | Tao Power Bin/brand roi bam TIM roi MO LAI panel: bin/brand phai con        | Moi lan ghi dia se xoa sach brand + bin + pack (loi da tung xay ra) |
| `SettingsModal.tsx`                | Hop thoai cài đặt & xóa cache 1-click                                   | Xóa nhầm file hoặc không dọn được rác                      |
| `Toast.tsx`                        | Thông báo nổi góc dưới màn hình                                     | Thông báo đứng yên không tự đóng                           |
| `Launcher.tsx`                     | Mở panel có ra màn hình chọn không · vào được cả 2 phần chính | Mở panel là vào thẳng một phần, mất lối sang phần kia      |
| `scanner.ts`                       | MOGRT co preview khong · so luong asset tung loai · thoi gian quet        | Mat preview MOGRT, hoac quet cham/treo                              |
| `mediaServer.ts`                   | Anh · video · audio deu hien va phat duoc                                 | Moi o den thui                                                      |
| `mogrtThumb.ts`                    | MOGRT khong co preview roi van co thumbnail                                 | MOGRT tro lai chi hien icon                                         |
| `store.ts`                         | Tim kiem · loc · sap xep · yeu thich · quet · Import · Power Bins     | Mot trong cac chuc nang tren chet am tham                           |
| `Grid.tsx`                         | Cuon 15.000 asset co muot khong · luoi deu cot khong                       | Panel treo, hoac cot lech nhu truoc day                             |
| `AssetCard.tsx`                    | Re chuot xem/nghe · nut tim · nut Import                                  | Mat tinh nang cot loi cua san pham                                  |
| `Sidebar.tsx` / `Toolbar.tsx`    | Tim kiem · menu loai asset · cac nut tren thanh cong cu                   | Giao dien vo, nut mat chuc nang                                     |
| `styles/_tokens.scss`              | TOAN BO giao dien; DO LAI tuong phan bang code                              | Chu mo khong doc duoc, bo cuc vo                                    |
| `host/ppro.jsx`                    | Nut Import voi ca file thuong VA file MOGRT                                 | Chen sai track, hoac bao loi khi chen                               |
| `lib/cep.ts`                       | Nut Import · chon thu muc · duong dan userData                            | Khong chen duoc, khong them duoc thu muc                            |
| `lib/node.ts`                      | TAT CA — quet, luu, preview, auto-reload                                   | Panel mo ra nhung khong lam duoc gi                                 |
| `scripts/sign-install.ps1`         | Cai lai tu dau va mo panel                                                  | Panel khong nap duoc vi chu ky hong                                 |
| `vite.config.ts`                   | `dist/index.html` con la 1 file duy nhat khong                            | Panel trang (Chromium chan module qua file://)                      |

### Ba thay doi NGUY HIEM NHAT

1. **Doi cau truc `Asset` ma quen `migrate()`**
   -> Nguoi dung mat toan bo thu vien 15.000 asset da quet.
   -> Bat buoc: tang `LIBRARY_VERSION` VA viet `migrate()` cho truong moi.
2. **Sua `mediaServer.ts` hoac dung lai `file://`**
   -> Toan bo preview den thui, san pham mat gia tri cot loi.
   -> Bat buoc: moi tai nguyen di qua `mediaUrl()`.
3. **Sua `Grid.tsx` lam mat ao hoa**
   -> Panel treo cung voi thu vien lon, khong dung duoc.
   -> Bat buoc: sau khi sua phai cuon thu voi 15.000 asset.

### Quy tac vang khi sua file co phu thuoc

> Sua xong mot file, phai mo panel len va thu lai **toan bo chuoi phu thuoc cua no**
> trong bang tren — khong chi thu dung cai vua sua.

---

# PHAN D — CHI TIET TUNG PHASE

Ky hieu trang thai: `[XONG]` `[DANG LAM]` `[KE TIEP]` `[HOAN]` `[MOT PHAN]`

---

## PHASE 0 — SETUP / SCAFFOLD  `[XONG]`

**Muc tieu:** dung khung du an CEP, mo duoc panel trong Premiere.

**Cong viec da lam:**

1. `CSXS/manifest.xml` — khai bao extension PPRO, range rong, bat Node.js, cap quyen file, bat tang toc GPU
2. `.debug` — cau hinh remote debug cong 8088
3. `client/` — khung React + TypeScript + Vite, gop thanh 1 file bang `vite-plugin-singlefile`
4. `client/public/CSInterface.js` — cau noi CEP ban gon
5. `client/src/lib/cep.ts` — goi ExtendScript kieu Promise
6. `host/index.jsx` + `ppro.jsx` + `ae.jsx` — cau noi ExtendScript
7. `scripts/` — bootstrap, sign-install, uninstall-dev
8. Ky self-signed bang ZXPSignCmd

**Tieu chi nghiem thu (da dat):**

- Panel hien trong `Window > Extensions`
- Panel mo ra hien duoc thong tin host (ten app, phien ban, project)
- Nut Ping tra ve `pong` — chung to cau noi ExtendScript thong

**Bai hoc quan trong:** Premiere Beta 26.5 BAT BUOC ky extension; `PlayerDebugMode`
khong con du.

---

## PHASE 1 — LIBRARY CORE  `[XONG]`

**Muc tieu:** quet thu vien, hien luoi asset, xem truoc, chen vao timeline.

**Cong viec da lam:**

*Quet va phan loai*

1. `scanner.ts` — quet de quy, loc theo duoi file
2. Phan loai: video / audio / image / mogrt / preset
3. Ghep cap MOGRT voi file preview roi — ho tro 2 kieu dat ten:
   - `Ten.mogrt` -> `Ten.mp4`
   - `Ten.mogrt` -> `Ten.mogrt.webp`
     Va cac hau to: `_preview`, `-preview`, ` preview`, `_thumb`, `-thumb`
4. Ho tro preview la video (mp4/mov/webm) HOAC anh (webp/gif/png/jpg)
5. `mogrtThumb.ts` — bung `thumb.png` nhung ben trong goi `.mogrt` (file .mogrt la ZIP),
   dung `fs` + `zlib` cua Node, khong thu vien ngoai
6. Toi uu: loc duoi truoc khi `stat`, dung `statSync`, nhuong luong moi 500 file

*Luu tru*
7. `library.ts` — luu/doc `library.json` tai `<userData>/AiOStudio/`
8. Co `LIBRARY_VERSION` + ham `migrate()`; tu quet lai khi cau truc du lieu doi
9. Ghi file co debounce 600ms (file khoang 8 MB)

*Xem truoc*
10. `mediaServer.ts` — may chu HTTP noi bo `127.0.0.1`, token ngau nhien, ho tro Range
11. Re chuot: video tu phat, anh hien ngay, audio nghe thu
12. Nap san video cho the dang nhin thay -> khung hinh dau lam thumbnail
13. Nut bat/tat tieng

*Giao dien*
14. `Grid.tsx` — luoi ao hoa, chi render the trong vung nhin thay + 4 hang du phong
15. Ba co o luoi S / M / L (120 / 170 / 260 px)
16. `Sidebar.tsx` — o tim kiem, cay danh muc theo thu muc, muc Yeu thich, quan ly thu muc
17. `tree.ts` — dung cay danh muc tu duong dan asset
18. `Toolbar.tsx` — quay lai man hinh chon, an/hien menu, tim kiem, them thu muc, quet lai
19. Yeu thich: ghim len dau, loc rieng, luu lai
20. `Icons.tsx` — bo icon SVG thay cho emoji
21. He token thiet ke trong `styles/_tokens.scss`; tuong phan chu dat >= 4.5:1
    (DO BANG CODE, khong doan bang mat); `:focus-visible`; `prefers-reduced-motion`;
    `aria-label`; moi thu bam duoc phai Tab toi duoc

*Cau noi host*
22. `ppro_importToTimeline` — chen file vao sequence tai playhead
23. `ppro_importMogrt` — chen MOGRT bang API `importMGT` cua Premiere
24. Nut Import tren tung the + thong bao ket qua

*Cong cu phat trien*
25. `autoReload.ts` — panel tu tai lai khi co ban build moi

**Tieu chi nghiem thu (da dat):**

- Quet duoc thu vien that 15.511 asset
- Cuon muot, khong treo
- MOGRT / video / anh deu hien preview
- Re chuot xem/nghe duoc
- Nut Import chen duoc vao timeline

**Da quyet dinh KHONG lam (co ly do):**

- **Keo-tha vao timeline:** CEP khong ho tro keo-tha kieu he dieu hanh sang Premiere.
  Cac panel thuong mai (Mister Horse) cung khong lam duoc. Thay bang nut Import.
- **SQLite:** giu JSON vi chay tot voi 15.000 asset va tranh rui ro module native.
  Can nhac lai neu vuot khoang 100.000 asset.
- **Cua so bung to (lightbox):** da lam roi go bo theo yeu cau nguoi dung — chi dung
  re chuot de xem/nghe.

---

## PHASE 2 — FFMPEG  `[KE TIEP]`

**Muc tieu:** asset chua co anh preview van hien dep, va co du thong tin ky thuat.

> Tai lieu chi tiet rieng: **`HANDOFF_PHASE2.md`**

**Cong viec chi tiet:**

1. **Bundle FFmpeg** (uu tien cao)

   - Dat `ffmpeg.exe` va `ffprobe.exe` vao `bin/win64/`
   - Tao `client/src/services/ffmpeg.ts` voi `getFFmpegPath()` / `getFFprobePath()`
   - Phai resolve dung ca luc dev va sau khi cai — dung `extensionPath()` cua `lib/cep.ts`
   - Kiem tra binary ton tai truoc khi goi; bao loi ro rang neu thieu
   - Luu y: them file vao `bin/` lam DOI CHU KY -> phai chay lai `sign-install.ps1`
     (script da tu dong dong goi `bin/` neu co)
2. **Thumbnail video** (uu tien cao)

   - Sinh anh tu khung giua clip cho asset `type === 'video'` chua co `previewPath`
   - Cache ra `<userData>/AiOStudio/thumbs/<id>.jpg`
   - Sinh theo yeu cau (lazy) khi the hien ra, giong cach `mogrtThumb.ts` dang lam
   - Co memo trong phien de khong hoi dia nhieu lan
3. **Waveform audio** (uu tien cao)

   - Sinh `waveform.png` cho 2.138 file audio (dang chi hien icon not nhac)
   - Mau song nen hop tong giao dien (dung bien `--t-audio`)
   - Cache cung cho voi thumbnail
4. **Hang doi chay nen** (uu tien cao)

   - Tao `client/src/services/jobQueue.ts`
   - Gioi han tien trinh song song theo `os.cpus().length`, toi da khoang 4-6
   - Hien tien do tren UI (bao nhieu / tong bao nhieu)
   - Huy duoc khi nguoi dung doi thu muc hoac dong panel
   - TUYET DOI khong lam treo giao dien
5. **Doc metadata** (uu tien trung binh)

   - Tao `client/src/services/probe.ts` dung `ffprobe`
   - Lay: thoi luong, do phan giai (width/height), codec, bitrate, fps
   - Them vao `Asset` dang truong TUY CHON
   - Tang `LIBRARY_VERSION` len 3 + bo sung `migrate()`
6. **Proxy video nang** (uu tien trung binh)

   - Chi tao khi that su can: file > 200 MB, hoac codec ProRes / do phan giai 4K tro len
   - Proxy h264 360p, cache rieng
   - Khi co proxy thi re chuot phat proxy thay vi file goc
7. **Hien thoi luong tren the** (uu tien thap)

   - Vi du "0:12" o goc duoi khung anh
   - Chi hien khi da co metadata

**File duoc tao moi:**
`services/ffmpeg.ts` · `services/thumbnailer.ts` · `services/waveform.ts` ·
`services/probe.ts` · `services/jobQueue.ts` · `bin/win64/`

**File duoc sua (co gioi han):**
`types.ts` (them truong tuy chon) · `store.ts` (them state hang doi) ·
`library.ts` (tang version + migrate) · `AssetCard.tsx` (dung thumb moi, hien thoi luong) ·
`Icons.tsx` (them icon moi)

**Tieu chi nghiem thu:**

1. Moi video co thumbnail, khong con phai nap ca video moi thay hinh
2. Moi audio co waveform
3. Panel khong treo khi sinh anh cho hang nghin file
4. Mo lai panel thi anh cache dung ngay, khong sinh lai
5. Toan bo tinh nang Phase 1 van nguyen ven
6. `npm run build` khong loi; `dist/index.html` van la 1 file tu chua
7. Giao dien van dat quy tac o muc B.4

---

## PHASE 3 — PREVIEW  `[XONG - lam som trong Phase 1]`

**Muc tieu:** xem truoc video/audio/anh muot.

Da hoan thanh som vi day la **trong tam san pham** (xem `PLAN.md` muc 0.2):

- May chu media noi bo ho tro Range (tua/stream)
- Re chuot tu phat, khong can bam
- Nap san video cho the dang nhin thay
- Bat tang toc phan cung cho CEF (GPU giai ma video)

**Con co the lam them o phase sau:**

- Tua theo vi tri chuot (scrub) tren khung anh
- Nho vi tri dang xem khi re ra roi re lai

---

## PHASE 4 — RENDER / EXPORT  `[HOAN]`

**Muc tieu ban dau:** transcode / xuat file bang FFmpeg co thanh tien do.

**Ly do hoan:** khong phuc vu trong tam v1 (quan ly + xem truoc + chen timeline).
Nguoi dung khong yeu cau. Se can nhac lai sau khi Phase 2 va 6 xong.

**Neu lam sau nay, pham vi se gom:**

1. `RenderService` dung `child_process` spawn FFmpeg
2. Doc `stderr` de lay phan tram tien do
3. Preset xuat co ban: dinh dang, do phan giai, codec, bitrate
4. Hang doi nhieu job, render hang loat
5. Chon thu muc dich, bao khi hoan tat

**Rang buoc rieng:** phai dung chung `jobQueue.ts` cua Phase 2, khong tu viet hang doi moi.

---

## PHASE 5 — HOST BRIDGE  `[XONG - lam som trong Phase 1]`

**Muc tieu:** chen asset vao project/timeline Premiere.

Da hoan thanh:

- `ppro_importToProject` — import vao Project panel, tranh import trung
- `ppro_importToTimeline` — chen vao sequence tai playhead, tu chon track video trong
- `ppro_importMogrt` — chen MOGRT bang API `importMGT`
- Tra ve chuoi `OK:` / `ERR:` de panel hien thong bao

**Con co the lam them:**

- Chen nhieu asset cung luc
- Chon track dich cu the
- Chen vao Project panel ma khong chen timeline (da co ham, chua gan nut)
- Ho tro After Effects (`ae.jsx` moi la stub)

**Rang buoc rieng:** ExtendScript khong co JSON — phai tra ve chuoi phan cach, khong
duoc dung `JSON.stringify` trong `host/*.jsx`.

---

## PHASE 6 — POLISH  `[MOT PHAN]`

**Da co:** tim kiem, cay danh muc, yeu thich, sap xep, ba co o luoi, lo bat/tat tieng.

**Con lai — chi tiet:**

1. **Tag (nhan tu dat)**

   - Them truong `tags?: string[]` vao `Asset`
   - Giao dien gan/go tag tren the va trong menu trai
   - Loc theo tag; goi y tag da dung
   - Luu vao `library.json`
2. **Pack (gom asset thanh goi)** — DA HUY 0.18.0 (chu du an chot xoa han)

   - Cau truc `Pack { id, name, cover, description, assetIds[] }`
   - Tao pack tu cac asset dang chon
   - Hien danh sach pack trong menu trai
   - Xuat/nhap pack de chia se giua may
3. **Chon nhieu asset**

   - Ctrl+click, Shift+click, keo chon vung
   - Thao tac hang loat: gan tag, them vao pack, chen tat ca vao timeline
4. **Man hinh cai dat**

   - Duong dan thu vien, thu muc cache
   - Chat luong proxy / thumbnail
   - Bat/tat auto-reload
   - Nut xoa cache
5. **Phim tat**

   - Tim kiem nhanh, chuyen bo loc, chen vao timeline

**Rang buoc rieng:** moi tinh nang moi phai theo quy tac giao dien o muc B.4
(icon SVG, tuong phan 4.5:1, aria-label, focus ring).

---

## PHASE 7 — DONG GOI & PHAT HANH  `[MOT PHAN]`

**Da co:** ky self-signed + script cai dat 1 lenh cho may dev.

**Con lai — chi tiet:**

1. **Chung chi thuong mai**

   - Mua code-signing certificate
   - Ky ZXP bang cert that + timestamp server
   - Khi do nguoi dung cai khong bi canh bao
2. **Installer**

   - Dong goi thanh file cai dat (vd Inno Setup hoac ZXP Installer)
   - Tu dong dat vao thu muc CEP extensions dung chuan
   - Kiem tra phien ban Premiere truoc khi cai
3. **Ho tro macOS**

   - Bundle binary FFmpeg ban macOS vao `bin/darwin/`
   - `getFFmpegPath()` phan nhanh theo he dieu hanh
   - Kiem thu tren macOS
4. **Ho tro After Effects**

   - Hoan thien `host/ae.jsx`
   - Them `AEFT` vao `HostList` trong manifest
   - Cach chen asset vao comp khac Premiere -> viet rieng
5. **Cap nhat tu dong**

   - Kiem tra phien ban moi
   - Tai va cai ban moi
6. **Tai lieu nguoi dung**

   - Huong dan su dung co hinh anh
   - Cau hoi thuong gap

---

# PHAN E — QUY TRINH BAT BUOC

## E.1. Truoc khi bat dau lam

1. Doc `RULES.md` (file nay)
2. Doc `HANDOFF_PHASE<N>.md` cua phase minh lam (neu co)
3. Doc muc "Trang thai hien tai" trong `PROGRESS.md`
4. Xac nhan phase minh lam va pham vi

## E.2. Trong khi lam

1. Chi tao/sua file trong pham vi cho phep
2. Neu can dung file KHOA: ghi ly do vao `PROGRESS.md` TRUOC khi sua
3. Sau moi buoc lon: build thu de bat loi som

## E.3. Sau khi lam xong

```
cd client
npm run build
```

```
powershell -ExecutionPolicy Bypass -File scripts\sign-install.ps1
```

Roi:

1. Kiem tra panel thuc su chay (khong chi build sach)
2. Kiem tra cac tinh nang phase truoc VAN CON hoat dong
3. Ghi muc moi vao dau `PROGRESS.md` (co ngay-gio-phien ban)
4. Cap nhat khoi "Trang thai hien tai"
5. Cap nhat `README.md` neu tinh nang doi

---

# PHAN F — QUY TAC GIAI QUYET XUNG DOT

## F.1. Nguyen tac chung

- **Mot thoi diem chi mot phase duoc lam.** Khong lam song song hai phase tren cung
  ma nguon.
- **Nguoi lam sau phai doc `PROGRESS.md` truoc.** Muc tren cung la trang thai moi nhat.
- **Ai cham file KHOA thi phai khai bao.** Ghi vao `PROGRESS.md` truoc khi sua.

## F.2. Khi phat hien loi thuoc phase khac

KHONG tu sua. Thay vao do:

1. Ghi vao `PROGRESS.md` muc "Van de phat hien" kem: trieu chung, file lien quan,
   nguyen nhan nghi ngo
2. Bao cho chu du an quyet dinh

Ngoai le: neu loi do lam phase hien tai KHONG THE tiep tuc, thi duoc sua, nhung phai
ghi ro ly do va pham vi da sua.

## F.3. Khi hai ben cung sua mot file

- Uu tien ban cua nguoi dang lam phase hien tai
- Ben con lai phai doc lai file truoc khi sua tiep
- Neu khong chac: giu lai ca hai phan, ghi chu bang comment, hoi chu du an

## F.4. Khi ban moi lam hong thu dang chay

Co san ban an toan: `build/aiostudio.zxp` la ban da ky dang chay duoc.
Giai nen file nay de len thu muc
`%APPDATA%\Adobe\CEP\extensions\com.aiostudio.assetmanager` de quay ve trang thai cu.

---

# PHAN G — CHECKLIST TRUOC KHI BAO "XONG"

Danh dau du 10 muc moi duoc bao hoan thanh.

- [ ] Build sach, khong loi TypeScript
- [ ] `dist/index.html` van la MOT file tu chua (khong co thu muc `assets/` roi)
- [ ] Da chay `sign-install.ps1`, cai dat thanh cong
- [ ] Panel THUC SU mo duoc trong Premiere (khong chi build sach)
- [ ] Cac tinh nang phase truoc van hoat dong (re chuot xem/nghe, tim kiem, cay danh
  muc, yeu thich, sap xep, co o luoi, nut Import, auto-reload)
- [ ] Khong dung emoji/ky tu lam icon; icon moi la SVG
- [ ] Mau chu moi dat tuong phan >= 4.5:1
- [ ] Nut chi co icon deu co `aria-label`
- [ ] Da ghi muc moi vao `PROGRESS.md` dung dinh dang, dung gio that
- [ ] Da cap nhat khoi "Trang thai hien tai" trong `PROGRESS.md`
