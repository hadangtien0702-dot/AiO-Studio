# BAN GIAO PHASE 2 — AiO Studio Asset Manager

Tai lieu danh cho nguoi/AI tiep quan **Phase 2 (FFmpeg)**.
Muc dich: lam dung ngay tu dau va **khong dung cham** vao phan da hoan thanh o Phase 0/1.

| | |
|---|---|
| Ngay cap nhat | 2026-07-24 13:50 (UTC+7) |
| Phien ban ban giao | 0.4.0-dev.3 |
| Trang thai | Phase 0 va Phase 1 da HOAN TAT, dang chay that trong Premiere Beta 26.5 |

---

## 1. DOC GI TRUOC (theo dung thu tu)

| # | File | Doc de biet dieu gi |
|---|---|---|
| 0 | **`RULES.md`** | **BAT BUOC DOC TRUOC.** Rang buoc duoc/khong duoc lam, danh sach file khoa, **ban do phu thuoc (muc C.4)**, chi tiet ca 8 phase, quy tac giai quyet xung dot |
| 1 | `README.md` | Tong quan, cach cai dat, vong lap phat trien, noi xem log |
| 2 | `PLAN.md` muc 0 va muc 9 | Quyet dinh da chot, trong tam san pham, cac rui ro DA GAP THAT |
| 3 | `PROGRESS.md` muc "TONG KET PHASE 1" va "KE HOACH PHASE 2" | Da lam gi, con gi, vi sao mot so thu bi loai bo |
| 4 | `client/src/types.ts` | Cau truc `Asset` — Phase 2 se them truong vao day |
| 5 | `client/src/lib/node.ts` | Cach truy cap Node.js ben trong CEP (RAT QUAN TRONG) |
| 6 | `client/src/services/mogrtThumb.ts` | **Mau tham chieu tot nhat**: sinh anh + cache, dung Node thuan, lazy + memo |
| 7 | `client/src/services/scanner.ts` | Luong quet va phan loai asset |
| 8 | `client/src/services/mediaServer.ts` | Cach phuc vu file cho `<img>`/`<video>` |
| 9 | `client/src/state/store.ts` | Trang thai toan cuc (zustand), cach ghi file co debounce |
| 10 | `client/src/styles.css` phan `:root` | He token thiet ke (mau, khoang cach, bo goc, chuyen dong) |
| 11 | `scripts/sign-install.ps1` | Quy trinh build + ky + cai (BAT BUOC sau moi thay doi) |

---

## 2. NHUNG DIEU BAT BUOC PHAI BIET

Day la cac bai hoc da tra gia trong Phase 0/1. Khong lam trai, se mat rat nhieu thoi gian.

### 2.1. Extension BAT BUOC phai duoc KY
Premiere Beta 26.5 (CEP 12) **tu choi extension chua ky**. Co `PlayerDebugMode` KHONG con
tac dung bo qua chu ky. Log bao `Signature verification failed`.
- Chung chi self-signed: `certs/aiostudio-dev.p12` (script tu tao neu chua co).
- Sau MOI lan sua ma nguon phai chay lai `scripts/sign-install.ps1`, neu khong Premiere
  van dung ban cu.
- **Them file vao `bin/` cung lam doi chu ky** — phai ky lai. Script da tu dong dong goi
  thu muc `bin/` neu no ton tai.

### 2.2. KHONG dung `file://` de nap tai nguyen
Premiere nap panel qua `file://`, Chromium **chan** trang `file://` doc file khac tren dia.
- Moi anh/video/audio phai di qua may chu media noi bo: `mediaUrl(duongDan)` trong
  `client/src/services/mediaServer.ts`.
- May chu chi lang nghe `127.0.0.1`, co token ngau nhien, ho tro Range request.
- **Anh moi sinh ra o Phase 2 cung phai lay URL bang `mediaUrl()`.**

### 2.3. Truy cap Node dung cach
Trong CEP, **khong dung** `require()` truc tiep (Vite se bien doi sai).
- Luon dung `nodeRequire()` / `getFs()` / `getPath()` trong `client/src/lib/node.ts`.
- Muon module khac: `nodeRequire()?.('child_process')`, `nodeRequire()?.('os')`.

### 2.4. Build phai la MOT file duy nhat
`vite-plugin-singlefile` nhung toan bo JS/CSS vao `dist/index.html`.
- Khong them cau hinh tach chunk / code-splitting.
- **Khong them thu vien can bien dich native** (`better-sqlite3`, `sharp`, `canvas`...):
  Node cua CEP khac Node he thong nen se hong. Day cung la ly do giu JSON thay vi SQLite.

### 2.5. Thu vien rat lon
Nguoi dung that co **15.511 asset**: 1.563 video · 4.156 mogrt · 2.138 audio · 7.346 anh · 308 preset.
- Luoi da **ao hoa** trong `Grid.tsx` — chi render the dang nhin thay.
- Moi tac vu nang phai **chay nen theo hang doi**, khong duoc lam treo UI.
- Khi lap qua hang chuc nghin phan tu, nho `await new Promise(r => setTimeout(r, 0))`
  dinh ky de nhuong luong cho giao dien (xem `scanner.ts` lam mau).

### 2.6. Script PowerShell chi dung ASCII
Windows PowerShell 5.1 doc sai ky tu Unicode trong file `.ps1` va gay loi cu phap.
Moi file trong `scripts/` phai la ASCII thuan (khong dau tieng Viet, khong em-dash).

### 2.7. Quy tac giao dien da ap dung (khong duoc pha)
Da ra soat bang bo quy tac UI/UX. Neu them giao dien moi phai giu:
- Moi mau chu dat tuong phan **toi thieu 4.5:1** (dung bien `--text-1/2/3` trong `styles.css`).
- **Khong dung emoji/ky tu lam icon** — them icon moi vao `components/Icons.tsx` dang SVG.
- Moi nut chi co icon phai co `aria-label`; nut bat/tat phai co `aria-pressed`.
- Da co `:focus-visible` toan cuc va `@media (prefers-reduced-motion: reduce)` — dung go.
- Dung bien khoang cach `--sp-*`, bo goc `--r-*`, chuyen dong `--dur`/`--ease`.

---

## 3. PHAM VI PHASE 2 — CAN LAM GI

Muc tieu: asset chua co anh preview van hien dep, va co du thong tin ky thuat.

| # | Cong viec | Chi tiet | Uu tien |
|---|---|---|---|
| 1 | Bundle FFmpeg | Dat `ffmpeg.exe` + `ffprobe.exe` vao `bin/win64/`. Viet `getFFmpegPath()` / `getFFprobePath()` resolve dung ca luc dev va sau khi cai (dung `extensionPath()` trong `lib/cep.ts`) | Cao |
| 2 | Thumbnail video | Sinh anh tu khung giua clip cho asset `type === 'video'`. Cache ra `<userData>/AiOStudio/thumbs/<id>.jpg` | Cao |
| 3 | Waveform audio | Sinh `waveform.png` cho 2.138 file audio (dang chi hien icon not nhac) | Cao |
| 4 | Hang doi chay nen | Gioi han tien trinh song song theo `os.cpus().length` (toi da khoang 4-6). Hien tien do tren UI | Cao |
| 5 | Doc metadata | Dung `ffprobe` lay thoi luong, do phan giai, codec, bitrate, fps. Luu vao `Asset` | Trung binh |
| 6 | Proxy video nang | Chi tao proxy h264 360p khi file qua nang (vd > 200 MB, hoac ProRes/4K) | Trung binh |
| 7 | Hien thoi luong tren the | Vi du "0:12" o goc duoi khung anh | Thap |

---

## 4. PHAN CHIA QUYEN SUA FILE

### 4.1. Phase 2 DUOC TAO MOI
- `client/src/services/ffmpeg.ts` — resolve duong dan binary, ham spawn dung chung
- `client/src/services/thumbnailer.ts` — sinh thumbnail video
- `client/src/services/waveform.ts` — sinh waveform audio
- `client/src/services/probe.ts` — doc metadata bang ffprobe
- `client/src/services/jobQueue.ts` — hang doi chay nen co gioi han song song
- `bin/win64/` — thu muc chua binary

### 4.2. Phase 2 DUOC SUA (co gioi han)

| File | Duoc lam gi | KHONG duoc lam gi |
|---|---|---|
| `client/src/types.ts` | THEM truong moi vao `Asset`, tat ca deu phai tuy chon (`?`): `duration`, `width`, `height`, `codec`, `fps`, `bitrate`, `thumbPath`, `proxyPath` | Khong doi ten / xoa truong dang co: `id, name, fileName, path, type, ext, fileSize, dateAdded, folder, previewPath, previewKind, favorite` |
| `client/src/state/store.ts` | THEM state va hanh dong cho hang doi sinh anh | Khong sua `init`, `addFolder`, `rescan`, `mergeAssets`, `persist`, `toggleFavorite` |
| `client/src/services/library.ts` | Tang `LIBRARY_VERSION` len **3**, bo sung `migrate()` cho truong moi | Khong doi cau truc file luu (van la `{version, folders, assets}`) |
| `client/src/components/AssetCard.tsx` | Uu tien dung `thumbPath` moi neu co; them nhan thoi luong | Khong bo hover-preview; khong bo nut Import / nut tim; **khong them lai hanh dong bam-vao-the** (nguoi dung da yeu cau bo) |
| `client/src/components/Icons.tsx` | THEM icon SVG moi | Khong sua icon dang co |
| `CSXS/manifest.xml` | Chi khi that su can them tham so CEF | Khong ha `ExtensionManifest Version="7.0"`; khong bo cac co Node/GPU dang co |
| `PROGRESS.md` | Them muc changelog moi o TREN CUNG | Khong sua/xoa muc cu |
| `README.md` | Cap nhat phan tinh nang va gioi han khi Phase 2 xong | — |

### 4.3. Phase 2 KHONG DUOC SUA (da on dinh, sua se hong)
- `client/src/services/mediaServer.ts` — may chu preview
- `client/src/services/mogrtThumb.ts` — bung anh trong goi .mogrt
- `client/src/services/autoReload.ts` — panel tu tai lai
- `client/src/services/scanner.ts` — logic ghep cap preview rat de hong
- `client/src/lib/node.ts`, `lib/cep.ts`, `lib/tree.ts`, `lib/format.ts`
- `client/src/components/Grid.tsx` — logic ao hoa (rat de hong)
- `client/src/components/Sidebar.tsx`, `Toolbar.tsx` — giao dien vua duoc nguoi dung duyet
- `client/src/styles.css` phan `:root` (he token) — chi duoc THEM bien moi, khong sua bien cu
- `host/*.jsx` — cau noi ExtendScript (da xong)
- `scripts/*.ps1`, `certs/`, `client/vite.config.ts`

> Neu bat buoc phai sua file trong nhom 4.3: ghi ro ly do vao `PROGRESS.md` truoc khi sua.

---

## 5. QUY TRINH LAM VIEC

### 5.1. Sau moi lan sua ma nguon
```
cd client
npm run build
```
```
powershell -ExecutionPolicy Bypass -File scripts\sign-install.ps1
```
Panel **tu tai lai sau khoang 1,5 giay** (nho `autoReload.ts`). Khong can restart Premiere,
TRU KHI sua `CSXS/manifest.xml` (luc do phai tat han Premiere roi mo lai).

### 5.2. Xem loi that
| Noi dung | Duong dan |
|---|---|
| Log CEP (loi nap panel) | `%LOCALAPPDATA%\Temp\CEP12-PPRO.log` |
| Du lieu thu vien | `%APPDATA%\AiOStudio\library.json` |
| Cache anh | `%APPDATA%\AiOStudio\thumbs\` |
| Extension da cai | `%APPDATA%\Adobe\CEP\extensions\com.aiostudio.assetmanager` |
| Remote debug (khi panel dang mo) | http://localhost:8088 |

### 5.3. Ghi nhat ky (BAT BUOC)
Moi lan cap nhat ma nguon phai them mot muc vao `PROGRESS.md`, dat o TREN CUNG:
```
## [MAJOR.MINOR.PATCH-dev.N] - YYYY-MM-DD HH:MM (UTC+7)

Loai: Added / Changed / Fixed / Removed / Security
Phase: 2
Trang thai: [HOAN TAT] | [DANG LAM] | [CHO] | [LOI] | [BO]

Boi canh:
Thay doi:
File anh huong:
Kiem chung:
```
Quy uoc: **KHONG dung emoji/icon, KHONG dung dau tieng Viet** trong noi dung.
Lay gio that bang lenh `date "+%Y-%m-%d %H:%M %z"` — khong tu bia gio.
Nho cap nhat khoi "Trang thai hien tai" o dau file.

---

## 6. TIEU CHI NGHIEM THU PHASE 2

1. Moi asset `type === 'video'` co anh thumbnail, khong con phai nap ca video moi thay hinh.
2. Moi asset `type === 'audio'` co anh waveform thay cho icon not nhac.
3. Panel KHONG treo khi sinh anh cho hang nghin file (co tien do, chay nen).
4. Mo lai panel thi anh da cache duoc dung ngay, khong sinh lai.
5. Cac tinh nang Phase 1 van nguyen ven: re chuot xem/nghe, tim kiem, cay danh muc,
   yeu thich, sap xep, doi co o luoi, nut Import chen vao timeline, panel tu tai lai.
6. `npm run build` khong loi TypeScript; `dist/index.html` van la mot file tu chua.
7. Giao dien van dat cac quy tac o muc 2.7 (tuong phan, icon SVG, aria-label, focus ring).

---

## 7. CAC LOI DA GAP (dung lap lai)

| Trieu chung | Nguyen nhan that | Cach xu ly |
|---|---|---|
| Panel trang / khong mo | Extension chua ky | Chay `scripts/sign-install.ps1` |
| Anh/video khong hien | Dung `file://` | Dung `mediaUrl()` cua mediaServer |
| Panel cham, giat | Render het the cung luc | Da co ao hoa trong `Grid.tsx` — dung pha |
| Cot luoi rong hep lon xon | CSS Grid dung `1fr` | Phai dung `minmax(0, 1fr)` |
| Do rong vung cuon = 0 | `useRef` + `useLayoutEffect([])` do khi phan tu chua ton tai | Dung callback ref |
| MOGRT khong co preview | Pack dat ten preview khac nhau, hoac khong kem preview | Da xu ly: ghep cap 2 kieu ten + bung `thumb.png` trong goi ZIP |
| Script `.ps1` loi cu phap | File co ky tu Unicode | Viet ASCII thuan |
| `tsc` bao TS6310 | `tsconfig.node.json` co `noEmit` | Bo `noEmit` o composite project |
| Chu kho doc | Mau chu duoi 4.5:1 | Dung bien `--text-1/2/3` da do san |

---

## 8. THONG TIN MOI TRUONG

- Host: Adobe Premiere Pro **Beta 26.5.0**, CEP 12, Windows 11
- Node.js he thong: v24.18.0 · npm 11.16.0
- Thu muc du an: `E:\2026\Production\AiO Studio\AiO Editing`
- Extension ID: `com.aiostudio.assetmanager`
- Thu vien that cua nguoi dung: `E:/D/Plugins/All in one`

**Luu y quan trong:** thu muc extension da cai la **ban sao da ky**, KHONG phai lien ket
toi thu muc du an. Sua ma nguon trong thu muc du an, roi chay `sign-install.ps1` de cap nhat.

---

## 9. PHU LUC — CAC TRUONG `Asset` HIEN CO

```ts
interface Asset {
  id: string            // hash cua duong dan tuyet doi
  name: string          // ten khong duoi
  fileName: string      // ten day du co duoi
  path: string          // duong dan tuyet doi
  type: 'video' | 'audio' | 'image' | 'mogrt' | 'preset' | 'other'
  ext: string           // duoi file, chu thuong
  fileSize: number      // bytes
  dateAdded: number     // epoch ms
  folder: string        // thu muc goc da them
  previewPath?: string  // file dung de xem truoc
  previewKind?: 'video' | 'image' | 'audio'   // quyet dinh dung <video> hay <img>
  favorite?: boolean
}
```
Phase 2 chi duoc **them** truong tuy chon vao cuoi, khong doi nhung truong tren.
