# AiO Shot & Save — Ke hoach tinh nang phat trien (Roadmap)

> Tai lieu dinh huong cac tinh nang sang tao danh rieng cho Editor, Filmmaker va Content Creator.
> Bien AiO Shot & Save tu mot cong cu chup man hinh don thuan thanh tro ly visual khong the thieu ben canh Premiere Pro, After Effects va DaVinci Resolve.
> Cap nhat: 2026-09-27 (Gemini) · 2026-10-01 (Claude: muc 0 duoi day).

---

## 0. DANH SACH TINH NANG CO THE LAM TIEP (Claude viet lai 01/10/2026, anh Tien yeu cau)

Nguon: danh gia thi truong 29/09 (PROGRESS.md muc [web] 29/09 13:3x) + muc 2 cua file nay + "Chua lam" trong CLAUDE.md.
Cong suc la UOC LUONG (nho = ~1 buoi, vua = 2-3 buoi, lon = 1 tuan tro len), CHUA do.

DA XONG, khong con trong danh sach: Storyboard quay 3 giay (0.7.4-0.7.8) · Doc chu phim 5 (0.7.9) · Lam mo 2 kieu
(0.6.6) · cong cu chon V + co gian khung (0.5.7-0.6.x).
**01/10 anh chon muc 4 (quay vung man hinh) -> da lam o 0.8.0: MP4 + nut tieng may + khay video rieng (xem CLAUDE.md).
Con lai cua muc 4: xuat GIF (anh chot "lam sau") · thu tieng micro.**

**02/10 14:44 muc 1 (danh so buoc) DA LAM, phim 6, nap vao app dang cai, cho anh bam thu (xem CLAUDE.md + PROGRESS.md).
Anh nhan "thêm tính năng đi em" sau khi em de xuat thu tu 1 -> GIF -> 3 -> 2; anh khong chi dich danh muc nao.**

**06/10 anh chot lam 3 muc trong MOT luot roi moi push: xuat GIF (phan con lai cua muc 4) · muc 2 (but ve tay + da quang,
phim 7 / 8) · muc 5 (chup cuon, phim 9). Ca 3 DA LAM va nap vao app dang cai (10:36 / 10:49 / 10:59), cho anh bam thu; chup
cuon CHUA chay tren man that. Con lai trong danh sach: muc 3 (hut mau), 6, 7, 8; thu tieng micro; app tu cuon khi chup cuon.**

Nhom 1 - re, hop editor, lam ngay duoc:
| # | Tinh nang | Nguoi dung duoc gi | Cong suc + luu y |
|---|---|---|---|
| 1 | Danh so buoc 1-2-3 | Bam len anh la ra huy hieu so tu tang: ghi chu sua cho khach ("1 doi mau, 2 cat ngan"), lam huong dan | Nho. Phim 5 da la Doc chu -> dung phim 6 |
| 2 | But ve tu do + but da quang | Khoanh tay, to sang mot dong chu | Nho. Di chung duong canvas voi khung/mui ten |
| 3 | Hut mau + bang 5 mau chu dao | Bam o mau la chep ma HEX; colorist lay bang mau cua mot canh tham chieu | Nho den vua |

Nhom 2 - lo hong so voi doi thu (ShareX, CleanShot, Snagit deu co):
| # | Tinh nang | Nguoi dung duoc gi | Cong suc + luu y |
|---|---|---|---|
| 4 | Quay vung man hinh ra GIF / MP4 | Gui khach 1 doan chuyen dong thay vi 6 khung tinh | Vua. Nen da co: luong chup chay san + vien quay + dem nguoc cua Storyboard. Ra MP4/GIF can FFmpeg LGPL -> bo cai nang them (chua do) |
| 5 | Chup cuon trang dai | Chup ca trang web / doan chat dai thanh 1 anh | Lon, rui ro cao nhat: ghep nhieu khung khi cuon de lech; Electron khong dieu khien cuon app khac -> nguoi dung tu cuon, app ghep |
| 6 | Khung an toan MXH + luoi 1/3 + ti le 9:16, 2.39:1 | Khoanh vung thay ngay cho bi nut TikTok/Reels che | Vua. PHAI dung chung `safe-zones.json` cua AiO Guide Frame (so da do tu anh app that), khong lam bo so thu hai |
| 7 | Storyboard: ban duyet co o ghi chu duoi moi khung + chon so khung / so giay | Gui dao dien 1 to duyet co cho ghi "sua mau shot nay" | Vua. Lam SAU khi do xong loi khung 1 den tren video |
| 8 | Ban Mac chay that | Ban duoc cho editor dung Mac | Bo cai Mac da dung duoc qua GitHub Actions nhung CHUA chay tren Mac that lan nao (doc chu Apple Vision, quay 3 giay chua do) |

Nhom 3 - Claude khuyen CHUA lam:
| # | Tinh nang | Vi sao chua |
|---|---|---|
| 9 | Link chia se nhanh | Can may chu + tien luu tru hang thang, trai mo hinh ban 14,99 USD mot lan; anh cua khach nam tren may chu minh = trach nhiem rieng tu |
| 10 | Dong dau ngay gio / ten sequence len anh | Ten sequence KHONG lay duoc (app nam ngoai Premiere); ngay gio anh da bo o Storyboard 28/09 |
| 11 | Ky so bo cai, tu cap nhat tren Mac | Anh da chot khong mua chung chi (14/08, 21/09) |

De xuat thu tu cua Claude: 1 -> 4 -> 3. Truoc khi lam cai moi con 2 viec cua ban dang co: anh bam phim 5 tren ban cai
0.7.9, va do loi khung 1 den cua Storyboard tren video. Anh CHUA chot muc nao trong danh sach nay.

### 0m. 07/11/2026 XEM PINTEREST: NGUOI TA TRINH BAY ANH VA UI THE NAO (anh: "research tren pinterest khac show hinh anh va cach lam UI cho dep") — anh CHUA chot huong nao

Nguon: 4 trang tim kiem Pinterest xem khong dang nhap ngay 07/11 (tu khoa: screenshot manager app ui dark · image gallery app ui dark masonry · moodboard app ui design · desktop app landing page product showcase dark), khoang 90 ghim. Chi ghi KIEU trinh bay lap lai nhieu lan, khong chep thiet ke cua ai. Pinterest la anh dung san de khoe, khong phai so lieu nguoi dung.

Lap lai nhieu nhat:
1. San pham dat trong MAY THAT (laptop, man hinh, dien thoai) tren nen toi, co mot quang sang mau thuong hieu phia sau. Khach thay "app nam tren may minh" truoc khi doc chu.
2. Nen toi + MOT mau nhan (cam, tim) + lop sang loang mem sau the. Web Shot & Save da dung nen toi + cam #F86820 nen hop ngay.
3. Luoi bento: the to nho khac nhau, moi the la mot MANH GIAO DIEN THAT cat ra, chu rat it. Khac voi luoi 11 the chu anh da che 29/09 ("vo duyen"): o day hinh la chinh, chu chi 1 dong.
4. Nhieu man hinh xep nghieng (phoi canh), do bong duoi, tao chieu sau.
5. So lon lam diem nhan (+2.5k, 100%, 01 / 04).
6. Thu vien anh: luoi so le (masonry) giu nguyen ti le anh, anh to, vien rat mong, ten va ngay chi hien khi re chuot; nhom theo ngay; anh dang chon phong to, cac anh khac lui toi.

De xuat ap vao (CHO ANH CHON, lam MOT mau truoc theo bai 5bh):
- A. Web: dau trang dat cai khay + mot tam anh ghim trong man hinh laptop toi co quang cam, thay hinh minh hoa phang.
- B. Web: them mot dai bento ngay sau rap, 6-8 o la anh chup that cua app (Tim lai anh cu, Lam dep, Sua video, Tai lieu), moi o 1 dong chu.
- C. App: cua so Tim lai anh cu va Khay doi sang luoi so le giu ti le anh, nhom theo ngay, chu hien khi re chuot.

### 0l. 06/11/2026 RA CHO NGUOI MOI BI KET (Sonnet di het app nhu nguoi moi, chup 40 man hinh; anh hoi "stuck o dau, co de cho nguoi dung khong")

So that tren may anh (run-log 05-06/11): 31 lan luu, 13 tam co ve, 0 lan doc chu / quay / Canvas / hen gio, bam nut thu khay 9 lan. Anh chi dung chup + ve; nhung tinh nang kia chua ai dung tren viec that.

DA SUA 06/11: mo lan dau khong thay gi · khach nuoc ngoai thay tieng Viet · bam Xong khong vao clipboard · goi y bien mat sau khi keo · cong cu giau trong menu re chuot · chu Storyboard sai thu tu · trang trong khong co nut · phim Canvas va chup lai khong doi duoc · QR ghi trong Cai dat khi may khong co.
ANH CHOT 07/11: GIU phim chup Ctrl+Shift+S, khong doi mac dinh, the lan dau noi phim nay trung Luu thanh cua Premiere, Photoshop, AE va chi nut Doi phim (da lam). Cong cu mac dinh sau khoanh vung giu Khung vi 13/31 tam anh co ve, nguoi moi de ve nham khi muon doi khung.
CHUA LAM: Lam dep van chi vao tu anh ghim (khay khong co menu chuot phai) · ghim khong co gian duoc.

### 0k. 06/11/2026 anh: "lam them 10 tinh nang nua, research tren mang, nhung tinh nang dang hay dang hot, va trien khai" — Sonnet tra 15 ung vien, Claude chon 10

Bang chung: hau het la nhat ky cua hang (quang cao). Loi nguoi dung that chi co o muc 1, 2, 3, 4, 8, 11 (Reddit qua ban sao, Product Hunt, dev.to). Cau trich do cong cu doc trang tom tat lai, mo lai kiem truoc khi dua len web.

| # | Tinh nang | Nguoi dung duoc gi | Ai co | Trang thai |
|---|---|---|---|---|
| 1 | Tu dat ten file theo noi dung anh | Het ca dong file "shotandsave-gio" | Mirowl dua vao lo trinh | LAM |
| 2 | Cat bo khuc giua anh | Bo doan thua cua anh chat / timeline dai, khoi chup lai | Snagit Cut Out, ShareX | LAM |
| 3 | Mo lai anh de sua tiep lop ve | Quay lai sua khung, chu, mui ten, khoi ve lai | Snagit .snagx | LAM |
| 4 | Video tu phong to theo con tro | Video huong dan khoi dung tay | CleanShot 5 (01/09/2026), Screen Studio | LAM |
| 5 | Cat dau cuoi video trong khay | Gui dung 8 giay can xem | CleanShot 5, ShareX 22 | LAM |
| 7 | Xuat tai lieu tung buoc tu anh trong khay | Huong dan cho khach trong vai phut | Snagit, Scribe, Tango | LAM (chup tay, khong hook chuot) |
| 9 | Kieu ve tay cho khung, chu, mui ten | Anh y tuong nhu ban phac | Shottr 1.9 | LAM |
| 10 | Nen va khung dep cho video | Video gui khach nhu da dung | CleanShot 5, Screen Studio | LAM |
| 11 | Dieu khien tu ngoai (link aioshot://) | Raycast, script, AI agent goi chup, mo Canvas | Shottr 1.8, CleanShot | LAM |
| 13 | Xuat anh WebP | File nhe gui khach | ShareX 22.2, CleanShot 4.8 | LAM |
| 6 | Tim anh theo nghia, anh giong anh nay | Hop dinh vi "luu y tuong" nhat | Eagle dang lam | CHUA: can do co model WASM va toc do tren 778 anh truoc |
| 8 | Xoa nen anh | Lay chu the ra PNG trong suot | ShareX 21 | CHUA: model nang, chua tra co, trai "nhe de nhanh" neu kem bo cai |
| 12 | Bong bong camera khi quay | Video co nguoi noi | ShareX 22, CleanShot 5 | CHUA: khong tim duoc nguoi dung doi, an khop yeu |
| 14 | Khung dien thoai cho anh app | Anh gioi thieu app | Motionik | CHUA: ngach hep |
| 15 | Dich chu doc tu anh | Doc anh tieng nuoc ngoai | chua ro | CHUA: rui ro cao nhat, bang chung so bo |

Da loai: link chia se + S3 (gui anh len mang), "Analyze image" bang khoa API (ton tien theo luot), hien phim bam + cu bam (can hook native, dang cho anh quyet `uiohook-napi`).
Link nguon: cleanshot.com/changelog · getsharex.com/changelog · shottr.cc/newversion.html · support.techsmith.com (Snagit 2026 Version History) · producthunt.com/p/mirowl/mirowl · dev.to/prom_sereyreaksa (Screen Studio cho Windows) · ban sao Reddit r/software, r/Windows11, r/indiehackers.

### 0j. 05/11/2026 anh hoi "vua app chup hinh thi minh can them tinh nang nao" — Claude tra loi, anh CHUA chot muc nao
So voi doi thu: doc trang tinh nang CleanShot X ngay 05/11 + lich su phien ban Snagit 2026 + bai review Shottr, Xnapper (review la nguon yeu, khong co so lieu nguoi dung uu tien gi). Ma 0.10.1 doc 05/11.
Da ngang hoac hon: khoanh vung, ve, lam mo, danh so, but, ghim, doc chu, chup cuon, quay MP4 + GIF, khay keo tha. Rieng minh: Storyboard, Canvas. Windows chua co app nao ngang CleanShot (CleanShot chi Mac, ShareX manh nhung kho dung).

| # | Tinh nang | Doi thu nao co | Nguoi dung duoc gi | Cong suc (UOC LUONG, chua do) |
|---|---|---|---|---|
| 1 | Tim lai anh cu: lich su + tim theo chu trong anh (= "Tim lai y tuong" o 0d) | CleanShot lich su 1 thang, tim theo noi dung chi tren Cloud; Snagit Library | Go mot chu la ra tam chup tu thang truoc, khong can may chu | Lon, 2-4 buoi; chua do doc chu 778 anh mat bao lau |
| 2 | Sua lai net da ve (khung xoay, keo to, xoa) = #8 o 0i | Co o moi app tra tien | Chup xong sua duoc, khong phai ve lai | Lon, dung overlay + pin |
| 3 | Bam vao cua so la chup dung cua so do; chup kin man mot phim; chup lai vung lan truoc | CleanShot | Bot mot nhat keo moi lan chup | Vua, dung vung keo chon (so loi #8) |
| 4 | Lam dep anh: nen, le, bo goc, ti le cho MXH | CleanShot, Xnapper, Shottr | Anh dang MXH / gui khach dep ngay | Vua |
| 5 | Hut mau + thuoc do pixel (muc 3 cu them thuoc do) | Shottr, mien phi | Designer, dev lay ma mau, do khoang cach | Nho den vua |
| 6 | Che thong minh: bam dong chu la che, che moi cho trung | Snagit Smart Redact | Che email, so dien thoai nhanh, tan dung bo doc chu san co | Vua |
| 7 | Quay: tieng micro, hien cu bam chuot + phim, tu zoom | CleanShot | Quay huong dan co loi noi | Vua den lon |
| 8 | Tu cap nhat = #10 o 0i | Hau het | Khach co ban moi; dieu kien de ban duoc lau dai | Vua, can noi dat bo cai cong khai |
| 9 | Viec nho: doc ma QR, hen gio chup, kinh lup luc chon vung, lam noi mot vung (spotlight) | CleanShot | Moi cai mot tinh huong nho | Moi cai nho |

Khuyen CHUA lam: link chia se + cloud (can may chu, trai gia ban mot lan; muc 9 bang 0) · AI giai thich / dich (#2, #3 o 0i, cho anh quyet ai tra tien).
Thu tu Claude de xuat: dot sua (2) -> 3 -> 1 -> 5 -> 4. Ly do: 2 + 3 la thu dung moi lan chup; 1 la cho doi thu yeu nhat (CleanShot chi co tren Cloud) va dung dinh vi 07/10 "luu y tuong".

**Anh xin "list 10 muc" (05/11), Claude gom bang tren + Canvas 0g + #6 o 0i, theo thu tu nen lam, anh CHUA chot:** 1 sua net da ve · 2 chup dung cua so + chup lai vung cu · 3 tim lai anh cu · 4 Canvas dung hang ngay (0g nhom A) · 5 hut mau + thuoc do · 6 lam dep anh · 7 che thong minh · 8 quay: micro, hien cu bam, tu zoom · 9 tu cap nhat · 10 goi viec nho: QR, hen gio, kinh lup, spotlight, chon icon tren thanh.

### 0i. GOP Y NGUOI DUNG THU 04/11/2026 (anh chuyen tiep, 10 y + 1 dong cua anh) — anh CHUA chot muc nao
Doi chieu voi ma 0.10.1 ngay 04/11. "Mo cung Windows" da lam cung ngay (xem PROGRESS). Con lai:

| # | Gop y | Hien trang trong ma | Co mat gi | De xuat |
|---|---|---|---|---|
| 1 | Chup full man: thanh cong cu day len goc | DUNG, la loi: `datViTriThanhCongCu` overlay.js, vung kin man thi top = 10, left = 10 | Nho | Khong du cho ngoai vung thi dat GIUA, sat day ben trong vung; cho keo thanh cong cu la buoc sau |
| 2 | AI giai thich truc tiep | Chua co. Co doc chu (phim 5) lam dau vao | Ton tien moi lan goi, app ban 1 lan $14.99 | Can anh quyet ai tra tien AI truoc khi lam |
| 3 | Dich sang nhieu thu tieng | Chua co. Noi tiep bang doc chu duoc | Cung cau hoi voi #2 | Gop chung #2 thanh mot nut tren bang chu |
| 4 | Icon nho, can to | Nut 34 px, icon 16 px, cham mau 18 px | Thanh da 15 nut + 7 mau, to len la dai hon | Lam SAU #5 + #9 vi hai muc do thu chieu ngang |
| 5 | But ve + but da xo doc khi re chuot | Dang 2 nut rieng (phim 7, 8) | Vua, dung vung overlay | Gom thanh 1 nut, re chuot xo menu; phim 7, 8 giu nguyen |
| 6 | Chon icon nao hien | Chua co, thanh co dinh | Vua | Them nhom trong Cai dat, an nut nhung phim tat van chay |
| 7 | Undo co Redo, 2 icon xanh + do | Co Undo + Ctrl+Z, chua co Redo, ca overlay lan anh ghim | Vua | Lam Redo. Mau do / xanh trung nghia voi nut Huy (do) va Xong (xanh) ngay canh: de bam nham, can anh chon |
| 8 | Chu, icon, mui ten keo tu do, khung xoay + co gian + xoa | Mot phan: phim V keo duoc, Delete xoa. Chua co khung, co gian, xoay | Lon nhat, dung ca overlay.js lan pin.js | Lam rieng, can mau cho anh xem truoc |
| 9 | Bo mau xo xuong | Dang bay 7 cham mau tren thanh | Nho | 1 cham mau dang chon, bam xo bang mau; tiet kiem ~120 px cho #4 |
| 10 | Cap nhat phan mem | Chua co gi, khach khong biet co ban moi | Vua, can noi dat bo cai cong khai | Windows tu tai + cai duoc khi co GitHub Releases; Mac chi bao + nut tai (quyet dinh 21/09) |

**04/11 21:35 DOT 1 DA LAM + NAP (anh: "goi agent sonnet ra lam va kiem"): #1, #7 phan Redo (mau van trung tinh, cho anh chon), #9, #5, #4. Anh chua dung that. Con lai: #8, #10, #6, #2, #3.**
Thu tu em de xuat: dot 1 = #1, #7 (phan Redo), #9, #5, #4 (mot lan sua thanh cong cu) · dot 2 = #8 · dot 3 = #10, #6 · #2, #3 cho anh quyet chuyen tien AI.

### 0d. 08/10/2026 anh hoi "tiep theo la tinh nang gi" — Claude tra loi, anh CHUA chot muc nao
Con lai trong bang muc 0 (chua lam): 3 hut mau + bang 5 mau · 6 khung an toan MXH · 7 Storyboard ban duyet co o ghi chu ·
thu tieng micro · app tu cuon khi chup cuon · mot khay 3 the (0c) · kieu C cua nut tron. Muc 8 (Mac chay that) da co ban
0.9.1 chay tren Mac cua anh tu 04/10.
De xuat MOI cua Claude (khong co trong bang cu, viet sau khi anh chot dinh vi 07/10 "app luu lai y tuong" va cau chuyen
"y tuong hay roi lai di dau mat", "loay hoay kiem di kiem lai trong cac folder"):
- **TIM LAI Y TUONG**: mot o tim trong khay, go chu la ra anh cu (tim theo chu DOC DUOC TRONG ANH bang bo doc chu san co cua
  phim 5, theo ngay, theo ghi chu ngan nguoi dung go luc luu). Ly do: khay chi nap 5 anh gan nhat luc mo app
  (`khaySoAnh` mac dinh 5), con lai nam trong thu muc — may anh dang co 778 file o do, muon tim lai phai mo thu muc lat tung
  tam = dung noi dau web dang ke. Cong suc: UOC LUONG vua den lon (2-4 buoi), CHUA do: doc chu 778 anh mat bao lau, chay nen
  co lam cham may khong (luat tai nguyen), luu chi muc o dau.
Thu tu Claude de xuat: (1) xong viec ban hang dang do (xac nhan nut tron, dong goi lai Windows 0.9.1, 2 bo cai len web,
mua thu) -> (2) Tim lai y tuong -> (3) muc 3 hut mau (nho, hop designer) -> (4) mot khay 3 the.

### 0e. 12/10/2026 anh hoi lai "tiep theo la them cong cu hay tinh nang gi" — Claude tra loi, anh CHUA chot muc nao
Da xong tu 0d: nut tron da xac nhan + keo duoc + di theo moi desktop (0.9.2, chi macOS), web da co canh keo nut.
Claude de xuat theo thu tu: (1) DONG GOI 0.9.2 (Mac + Windows) va dua nut tai len web, roi mua thu bang ma `THUSYM8FR`: web dang noi
ve tinh nang ma chua bo cai nao co · (2) TIM LAI Y TUONG (o tim trong khay, xem 0d) · (3) bat keo nut tron tren Windows (can do cu bam
that o may cong ty) · (4) hut mau + bang 5 mau · (5) mot khay 3 the. Viec nho con treo cua hom nay: khung chup khi app khac dang toan
man hinh tren Mac (overlay chua khai di theo moi desktop).

### 0f. CANVAS KIEU MIRO, KHUNG = THU MUC CUNG TEN (anh neu 12/10/2026 12:4x, y MOI cua anh, de len thu tu o 0e) — moi co BAN NHAP, cho anh duyet huong
> **12/10 14:13 — DA DUNG BAN DAU VAO APP (0.10.0), nap tai cho tren Mac.** Anh xem nhap 2: *"xau qua creative hon di em"* -> nhap 3 (khung la thu
> muc co tai mau, anh la tam in nam nghieng voi 4 goc cam, y tuong chia ra tu nut tron, ghi chu dan + mui ten) -> anh: *"ok roi them vao website va
> build di em"*. Trong app: `src/canvas-kho.js`, `src/canvas/`, mo tu menu khay he thong. Cau "chuyen han file hay de nguyen" anh chua tra loi -> em
> chon de nguyen anh goc + ban noi trong thu muc khung (doi duoc sau). Chua vao app so voi ban mau: ghi chu dan, mui ten. Chua lam: theo doi thu muc
> tuc thoi, xoa khung, keo ra app khac, Windows, web, khao sat app cung loai. Chi tiet: `PROGRESS.md` muc `[0.10.0]`.
> **SUA 12/10 13:0x — Claude HIEU SAI chu "mirror".** Anh go *"canvas giong mirror"* = app **MIRO** (bang trang gom y tuong), KHONG phai
> "tam guong". Nhap 1 `nhap/canvas-guong.html` (khoi luoi + cot thu muc) lam theo nghia sai; anh nhac *"canvas nhu mirror ma em"*, hoi lai
> mot cau thi anh chon **"Giong app Miro"**. Vi vay lua chon "khoi nhom tu xep luoi" ben duoi KHONG con dung: canvas la BANG TU DO.
> **Nhap 2 dung y: `nhap/canvas-miro.html`** — bang rong co luoi cham, keo nen de di chuyen, Ctrl / Cmd + lan de phong, nut - / + / "Vua man
> hinh"; anh, video, dai Storyboard dat dau cung duoc; KHUNG co ten (keo thanh ten de doi cho ca khung va thu ben trong, keo goc de doi co);
> tha mot o vao khung la no thuoc khung do; cot phai "Thu muc tren may": moi khung = mot thu muc cung ten, doi ten o ben nao ben kia doi theo.
> Do bang Chrome chay ngam (chuot + banh xe gia lap): keo 1 anh vao khung -> goc 3 -> 2, khung 2 -> 3; keo khung 60 px -> anh ben trong di
> theo 60 px; doi ten o khung -> thu muc doi, doi ten o thu muc -> khung doi; phong 0,957 -> 1,292; "Khung moi" them 1 thu muc; 0 loi console;
> khong tran ngang o 1440 va 700 px. CHUA co anh xem bang mat. Phan duoi day (viet luc con hieu la "guong") giu lai de biet duong di; ba he qua
> cua viec CHUYEN FILE va danh sach viec phai co truoc khi viet ma that VAN DUNG.
Anh (go trong bang hoi, nguyen van): *"Canvas hinh anh thu thap va group o canvas folder se group theo va dat ten y chang"* ·
*"canvas giong mirror - mot canvas tong hop y tuong"* · *"tat ca hinh anh chup - video - story se duoc mo trong canvas"*.
Anh CHON trong bang hoi: kieu **khoi nhom tu xep luoi** (khong phai bang tu do nhu Figma) · dong bo **HAI chieu** (sua o canvas hay sua
thu muc trong Finder thi ben kia doi theo).
Claude hieu: mot man Canvas bay MOI thu da thu thap (anh + video + dai Storyboard); moi nhom tren canvas = mot thu muc con cung ten trong
thu muc anh; thu chua xep nam o thu muc goc ("Moi chup, chua xep nhom"). Day cung la huong "mot khay 3 the" (0b / 0c) duoi dang khac.
**Ban nhap bam duoc (KHONG phai ma app, khong dung file that): `nhap/canvas-guong.html`** — keo o giua cac nhom, doi ten nhom, doi ten o cot
"Thu muc tren may" (gia lap Finder), tao nhom / thu muc. Do 12/10 bang Chrome chay ngam: keo 1 o -> so dem hai ben doi (4/3 -> 3/4); doi ten o
canvas -> cot thu muc doi; doi ten o cot thu muc -> canvas doi; ten trung bi tu choi; 0 loi console; khong tran ngang o 1280 va 700 px.
**CHUA chot (anh tra loi sang y khac o cau nay):** keo vao nhom thi file tren dia xu ly the nao. "Guong hai chieu" dung nghia = CHUYEN han
file vao thu muc con. He qua phai noi truoc: (1) anh da keo vao Premiere / Photoshop truoc do se bao mat file (so loi #18, bai 5bi);
(2) video va dai Storyboard co SO rieng (`kho-video.js` danh-sach, so dai) ghi duong dan -> chuyen file phai sua so cung luc, khong thi
"video bien khoi khay" (so loi #16); (3) phai theo doi thu muc (nguoi dung doi ten / xoa / them trong Finder luc app dang mo va luc app tat).
**Viec phai co truoc khi viet ma that (chua lam):** khao sat app cung loai (Eagle, PureRef, Milanote...) theo luat 2d · chot cau "chuyen file
hay ban noi" · chot Canvas la cua so moi hay thay cua so Khay hien co · ban Windows.

### 0g. CANVAS: KET QUA THU DUNG + DOI THU + VIEC NEN LAM TIEP (12/10/2026 15:2x) — anh CHUA chot muc nao

Anh dan 12/10 15:1x: *"khong dong bo cai, khi nao anh keu thi moi lam"*, *"cai tren may Mac xong em hay kiem tra va thao tac xem nguoi dung co de su dung khong"*,
*"trong canvas co can them nhung tinh nang nao khong"*, *"xem cac doi thu nhu CleanShot X ho co dang lam cai nay khong"*, *"tap trung phat trien san pham, khong release"*.

**Thu dung (`npm run thu:canvas -- <so anh>`, app that cua so an, anh 2560x1440, bam / go / keo / lan bang sendInputEvent):**

| Do | 17 anh | 200 anh |
|---|---|---|
| Moi tam hien du anh sau khi mo | duoi 1,8 s | tam dau 2,0 s, du het 13,3 s (56 ms moi anh; 778 anh uoc 44 s, CHUA do) |
| "Vua man hinh" cho ra tam rong bao nhieu tren man 1500 px | 161 px (ti le 0,87) | 30 px (ti le 0,16): khong doc duoc |
| Bam "Khung moi" | khung hien giua man, o ten san sang go, chu duoc chon het | khung de mep 4 tam |
| Go ten roi Enter | thu muc tren dia doi ten theo, khong con thu muc ten cu | nhu ben |
| Keo mot tam vao khung | thu muc co ban noi cua dung anh goc, anh goc con nguyen | nhu ben |
| Ctrl + mot nac lan chuot | TRUOC SUA: 0,87 -> 2,90 (3,3 lan mot nac). DA SUA 0.10.1: 0,87 -> 1,00 (15% mot nac) | |

**Cho nguoi dung se vap (do duoc hoac doc tu ma), xep theo muc anh huong:**
1. Chi mo duoc Canvas tu menu tren thanh menu he thong. Khay va nut tron khong co loi vao, khong co phim tat.
2. Tam tren bang KHONG keo ra app khac duoc (Premiere, Zalo...). Day la loi hua chinh cua ca app ma bang lai thieu.
3. Khong chon duoc nhieu tam (bam mot tam khong co dau "dang chon"); xep 17 tam la keo 17 lan. Backspace, Delete, Cmd+Z, Cmd+A, Space, Esc: khong lam gi.
4. Khong xoa duoc khung, khong doi mau khung. Tao khung moi thi cac tam roi nam duoi no bi day di cho khac (bo cuc nguoi dung vua xep bi doi).
5. Thu vien lon: "vua man hinh" thu nho het ve 30 px; khong co tim, loc theo ngay / loai, khong co "nhay toi tam moi nhat".
6. Tren tam chi co gio hoac ngay, khong co ten file (ten nam trong tooltip). Khong co chu thich.
7. Mo lan dau voi thu vien lon phai cho anh nho (13,3 s cho 200 anh). Chua tao san anh nho luc chup.
8. Khung moi de len dong chu phu cua tieu de lon.
CHUA do duoc bang bai nay: ban di chuot that, do muot khi keo, cua so that tren man that, video, Windows.

**Doi thu (tra 12/10, nguon: trang tinh nang chinh thuc cua CleanShot + ket qua tim kiem; CHUA ra het moi app):**

| App | Co bang / canvas de xep nhieu anh chup? | Cach ho giu va tim lai anh |
|---|---|---|
| CleanShot X (Mac, 29 USD) | KHONG | Capture History giu toi 1 thang, loc theo loai; anh ghim noi; Cloud tim theo noi dung anh + the |
| Snagit | KHONG | Library: the, tim theo ten, loc theo ngay / app nguon / trang web nguon |
| Shottr, Xnapper | KHONG (chi co nen cho MOT anh) | Shottr ghim anh; lich su chua xac nhan duoc tu trang chinh thuc |
| Eagle (quan ly tu lieu) | CO, qua plugin Canvas | thu muc, the, thu muc thong minh theo luat; tu luu URL nguon |
| PureRef (bang tham khao) | CO | keo anh vao, ghi chu, nhom, tu xep luoi, ve len anh, noi tren app khac |
| Milanote (bang y tuong) | CO | the anh co chu thich, ghi chu, mui ten noi, cot |
Khong thay app CHUP MAN HINH nao co bang ma nhom tren bang = thu muc that cung ten. Day la diem rieng, nhung chua ra het App Store / Microsoft Store nen
KHONG viet "dau tien" len web.

**Viec nen lam tiep cho Canvas (em de xuat, anh chon):**
- Nhom A, go cho vap (nho, lam truoc): (A1) nut mo Canvas ngay tren khay + nut tron, them phim tat · (A2) keo tam tu bang ra app khac · (A3) chon nhieu
  tam (keo khoanh vung, Shift bam) + Delete bo khoi khung + Cmd+Z · (A4) xoa khung (thu muc chi con ban noi thi moi xoa) · (A5) mo ra dung o tam moi
  nhat voi co doc duoc, them nut "Moi nhat" · (A6) tao anh nho ngay luc chup.
- Nhom B, tinh nang moi lay tu doi thu: (B1) ghi chu dan + mui ten (Milanote, PureRef; da co trong ban mau anh duyet) · (B2) tim va loc theo ngay /
  loai, sau do tim theo CHU trong anh (CleanShot Cloud, Snagit) · (B3) nut "Xep gon" tu xep luoi (PureRef) · (B4) dan / tha anh tu ngoai vao bang
  (PureRef, Milanote) · (B5) xuat mot khung thanh mot anh hoac PDF de gui khach · (B6) chu thich duoi tung tam (Milanote).
- Con treo tu 0f: chuyen han file vao thu muc hay giu anh goc + ban noi (dang la ban noi); dai Storyboard vao khung chua vao thu muc; Windows chua chay.

### 0h. CANVAS: LAM GIONG MIRO / FIGJAM — bang so sanh (anh neu 12/10/2026 19:2x: "mirro - figjam co gi lam tuong tu di em") — anh CHUA chot muc nao
Danh sach theo hieu biet chung ve FigJam / Miro, CHUA tra lai trang chinh thuc tung app (nguon: Claude, 12/10). Cot Canvas = doc tu ROADMAP 0g + CLAUDE.md app.

| # | FigJam / Miro co | Canvas hien tai | De xuat |
|---|---|---|---|
| 1 | Ghi chu dan (sticky), nhieu mau, go chu nhanh | Chua (0g B1) | LAM dot 1 |
| 2 | O chu tu do tren bang | Chua | LAM dot 1 |
| 3 | Mui ten / duong noi BAM theo vat khi keo | Chua (0g B1) | LAM dot 1 |
| 4 | Chon nhieu: keo khoanh, Shift bam, Cmd+A | Chua (0g A3) | LAM dot 1 |
| 5 | Undo / Redo, Delete, nhan doi, copy / dan | Chua (0g A3) | LAM dot 1 |
| 6 | Dan anh tu clipboard / keo tu ngoai vao bang | Chua (0g B4) | LAM dot 1 |
| 7 | Khung nhom co ten + mau (Section / Frame) | CO (khung = thu muc cung ten); thieu xoa khung, doi mau (0g A4) | Bo sung dot 1 |
| 8 | Keo vat tu bang ra app khac | Chua (0g A2) — loi hua chinh cua app | LAM dot 1 |
| 9 | Xep gon tu dong, duong giong khi keo, can hang | Chua (0g B3) | Dot 2 |
| 10 | Ban do nho (minimap) + "Vua man" + nhay toi tam moi nhat | "Vua man" co, ra 30 px khi 200 anh (0g muc 5) | Dot 2 |
| 11 | Tim kiem tren bang, loc theo ngay / loai | Chua (0g B2) | Dot 2 |
| 12 | Xuat 1 khung ra PNG / PDF | Chua (0g B5) | Dot 2 |
| 13 | But ve tay + da quang tren bang | Co o Anh ghim (phim 7, 8), bang thi chua | Dot 2 |
| 14 | Khoa vat, doi lop truoc / sau | Chua | Dot 3 |
| 15 | Hinh khoi (vuong, tron, thoi) | Chua | Dot 3, hoi anh co can |
| 16 | Dan link thanh the xem truoc | Chua | Dot 3, hoi anh co can |
| 17 | Binh luan, tem cam xuc, con tro nguoi khac, bo phieu, hen gio, mind map, bang bieu, mau co san | Khong co | BO: app 1 nguoi dung, khong co may chu |

Dot 1 = "dung duoc nhu bang that" (muc 1-8). Dot 1 chi them thu KHONG phai anh (ghi chu, chu, mui ten) nen luu vao `canvas/bo-cuc.json`,
KHONG tao file trong thu muc anh (thu muc van chi chua anh + video). Truoc khi viet ma app: lam 1 ban nhap bam duoc `nhap/canvas-miro-2.html`
cho anh xem (luat 5bh: 1 mau, anh gat huong, roi moi nhan ra).

### 0b. GOP KHAY THANH MOT (anh neu 01/10/2026 13:2x: "phan khay minh toi uu hoa thanh 1 khay?") — anh CHUA chot
> 01/10 13:59: anh bao *"gop cho anh xem truoc"* -> huong A DA DUNG va nap vao app dang cai (cua so `src/khay`, 2 the).
> Anh dang xem, chua chot giu hay bo. Chua lam: gop 2 nut tren Khay anh thanh 1; huong B.
> 01/10 15:18 anh mo that tren app (run-log: `khay mo the=dai`, `khay mo the=video`, khong co `khay LOI`), roi hoi
> *"cach nao tien hon nua khong"*.

### 0c. KHAY TU THU VE NUT TRON O GOC MAN HINH (anh neu 01/10/2026 15:2x) — anh CHUA chot chi tiet
Anh: *"khi khong dung toi chup anh khay se tu thu ve thanh mot nut tron o goc man hinh de do ton dien tich ...
animation phai dep"*. Claude tra loi + dua ban thu bam duoc trong chat (3 kieu chuyen dong: co mem / hut anh vao nut /
nhanh gon; nut tron 48 px o goc duoi-phai; tu thu sau 3 giay khong re chuot; bam nut de mo).
- Lam duoc: cua so Khay anh von TRONG SUOT (`main.js ensureShelf`) nen chuyen dong chay ben trong cua so, khong phai
  keo cua so tung khung. Nut tron phai nam trong cua so >= 64 px (Windows khong cho cua so nho hon ~58 px diem anh that,
  so loi #13) -> vong tron ve 44-48 px giua cua so trong suot.
- "Tien hon nua" Claude de xuat: MOT khay noi co 3 the Anh · Video · Storyboard (the Anh = luoi dang co, khong sua),
  thu ve thanh MOT nut tron -> tren man chi con 1 thu; cua so khay gop 13:59 thanh phan than cua 2 the kia.
- Cho anh chon: kieu chuyen dong (1/2/3) · khi nao thu (sau N giay / chi khi bam) · goc nao · mo bang bam hay re chuot
  · co lam "mot khay 3 the" luon hay chi lam nut tron truoc.
- 01/10 15:5x anh che 3 kieu dau: *"3 option animation nay chua du dep va creative"*. => NHAP 2 (chay that, keo khay duoc,
  co "xem cham"): `nhap/khay-nut-tron.html` (KHONG phai ma cua app, khong dong goi). 3 y tuong, moi cai ke mot viec app
  lam: **A Ong kinh** (khay khep nhu man trap, con ong kinh luot ve goc, mo ra co nhay sang) · **B Xap anh** (tung tam bay
  vao nut, nut dem len, luc nghi nut hien anh moi nhat, mo ra chia nhu chia bai) · **C Khoanh vung** (khung cam 4 goc om
  khay, chup lai, thu ve goc; mo ra 4 goc bung truoc). Them cho ca 3: chup anh moi luc khay dang thu thi nut GIAN thanh
  vien thuoc hien anh vua luu ~1,5 giay. Do toc do that: thu ve mat ~1,4 giay (A) — con cham cho viec lap lai ca ngay,
  chot y tuong roi moi ep nhip. Anh CHUA chon.
- **01/10 16:07 ANH CHOT + DA LAM, nap vao app dang cai:** xuat hien kieu A (ong kinh), thu ve kieu B (xap anh), tu thu 5
  giay + Cai dat 5s / 10s / 15s, bam nut de mo. Ma: `src/khay-thu.js`, `src/nut/`, `src/dien/`. Bai do `npm run
  test:khaynut` 30/30 (offscreen). CHUA xem tren man that. Con lai chua lam: kieu C, mot khay 3 the.
- 01/10 15:3x anh hoi: *"khi anh drag cai khay di tum lum cho, khi thu ve no van nam o goc dung khong?"* => anh muon nut
  tron LUON ve goc, khong phu thuoc khay dang nam dau. Claude tra loi: dung; de xuat goc duoi-phai cua MAN khay dang
  nam, bam nut thi khay mo lai DUNG CHO CU. Anh chua xac nhan goc nao + mo lai o dau.
Hien co 3 cho: Khay anh (noi, nho, luon tren cung) · cua so Khay Storyboard · cua so Khay video (sang 01/10 anh chon
"khay rieng" trong bang hoi; Claude luc do de xuat chung Khay anh). Hai cua so sau da dung chung mot khuon CSS
(`storyboard.css`, do 01/10 13:08: 14 luot dat). Claude tra loi anh 2 huong:
- **A. Gop 2 cua so (Storyboard + Video) thanh MOT cua so co 2 the, Khay anh noi giu nguyen.** 3 cho -> 2 cho, tren Khay
  anh 2 nut -> 1 nut. It rui ro: khong dung vao Khay anh (phan da chinh nhieu nhat: cuon, keo to, keo tha).
- **B. Gop ca ba vao Khay anh noi:** anh / video / dai nam chung mot luoi theo thoi gian, co hang loc Tat ca · Anh ·
  Video · Storyboard; video la o co nut phat + thoi luong, dai la o co so khung; bam vao moi mo phan chi tiet (phat, chon
  Co tieng / Khong tieng, bo khung, Luu / Sao chep). Mot cho duy nhat, keo tha thang tu khay. Rui ro: dung vao Khay anh.
- De xuat cua Claude: lam A truoc (cung la phan "chi tiet" ma B can), anh dung thu roi moi lam buoc dua o video / dai
  vao Khay anh. Loai moi sau nay (GIF) khong sinh them khay thu tu.

---

## 1. UU TIEN SO 1 (Phat trien ngay phien 28/09): Multi-Shot Storyboard Strip

### 1.1. Boi canh & Vande thuc te
- Video editor khi dung phim thuong xuyen phai chup nhieu shot tren Timeline (3 den 10 frame lien tiep) de gui dao dien, agency hoac khach hang duyet goc quay, mau sac, bo cuc hoac nhip cat (continuity).
- **Bat tien hien tai**: Phai chup tung anh rieng le roi gui 10 file anh roi rac khien nguoi xem kho hinh dung tong the; hoac phai mo Photoshop/Canva ton 10-15 phut de cat ghep, dan anh va go chu SHOT 1, SHOT 2 thu cong.

### 1.2. Giai phap thiet ke (1-Click Storyboard)
- **Diem cham UI tren khay**:
  - Nut moi `#storyboard` tren thanh tieu de khay anh (`#bar`, ben canh nut thu muc `#folder`).
  - Icon SVG inline kieu film/layout (chuan Studio Console, khong dung emoji).
  - Phim tat nhanh: **`S`** khi dang mo cua so khay anh.
  - Che do chon: Mac dinh lay toan bo cac anh dang co trong khay theo dung thu tu chup (`#1`, `#2`... da danh so o 0.6.2), hoac ho tro click chon 2-8 anh tuy y.

- **3 Che do bo cuc (Layout Templates)**:
  1. **Cinema Filmstrip (Dai ngang cuon phim)**:
     - Xep cac khung hinh theo hang ngang lien mach tren dai nen toi Studio Console (`#090a0d`).
     - Vach ngan cach tinh te 1px giua cac frame.
     - Phia tren hoac goc duoi moi frame co nhan badge nho: `SHOT 01`, `SHOT 02`, `SHOT 03`...
     - Toi uu nhat de xem nhip hanh dong lien tiep (action continuity / cut flow).
  2. **Storyboard Grid (Luoi phan canh 2x2, 3x2, 4x2)**:
     - Tu dong can doi chia cot va hang theo tong so luong shot duoc chon.
     - Vien khung bo goc mượt ma theo ban kinh 8px cua token he thong.
     - Toi uu de xem tong the mot phan doan / TVC tren 1 man hinh duy nhat.
  3. **Director Contact Sheet (Ban duyet dao dien & khach hang)**:
     - Co thanh Header banner sang trong phia tren cung: Logo AiO Studio, ten phan canh / Project, ngay gio xuat, tong so shot.
     - Duoi moi khung hinh co san o ghi chu hanh dong / revision note (vi du: "Sua mau shot nay", "Doi goc cam").

- **Hanh dong xuat ket qua (1-Click Export)**:
  - `Ctrl+C` (hoac nut Copy): Render anh ghep ra Clipboard de paste ngay vao Zalo, Messenger, Slack, Frame.io.
  - `Ctrl+S` (hoac nut Luu): Xuat 1 file anh PNG duy nhat vao thu muc anh chup (tu dong nap lai vao khay).
  - Keo tha truc tiep (Drag & Drop): Nam anh ghep tu modal keo thang vao Premiere Pro / AE de lam visual reference sequence tren timeline.

- **Kien truc ky thuat**:
  - Render bang HTML5 Canvas 2D noi bo (CommonJS, khong phu thuoc thu vien ngoai).
  - Tinh toan ty le va giu do phan giai goc 1:1, khong bi mo hay vo hat.
  - Cac file can thiep: `src/shelf/index.html`, `src/shelf/shelf.css`, `src/shelf/shelf.js`, module `src/storyboard/`, `src/i18n.js`, `src/main.js`.

---

## 2. CAC TINH NANG TIEP THEO TRONG PIPELINE

### 2.1. Color Palette Extractor (Trich xuat bang mau phan canh & Moodboard)
- **Nhu cau**: Editor va Colorist thuong xuyen can tham chieu bang mau cua mot canh quay hoac reference video.
- **Thiet ke**:
  - Bam nut trinh mau (hoac phim tat `C`), he thong tu dong phan tich vung anh chup (dung thuat toan K-means / Color Quantization nhe tren Canvas).
  - Trich xuat ra 5 mau chu dao nhat (Dominant Color Swatches).
  - Hien thi dai mau dep mat ngay chan anh ghim hoac khay anh.
  - Click vao tung o mau de copy ma HEX (`#f86820`) hoac copy toan bo dait mau vao clipboard.

### 2.2. Aspect Ratio & Safe Zone Overlays (Luoi ty le vang & Vung an toan MXH)
- **Nhu cau**: Chup anh tham chieu dung cho video doc (TikTok, Reels, YouTube Shorts) thuong bi che mat boi cac nut UI cua ung dung (nut Tim, Share, Avatar, Caption).
- **Thiet ke**:
  - Khi keo khung chup hoac xem anh ghim, ho tro toggle bat cac lop overlay huong dan:
    + **9:16 Social Safe Zone**: Hien thi vung dem an toan, danh dau vung de bi UI TikTok/Reels de len de editor can chinh chu va chi tiet quan trong.
    + **Cinematic Frames**: Khung 2.39:1 Anamorphic, 16:9, 4:5 Instagram, 1:1 Square.
    + **Rule of Thirds**: Luoi 1/3 ho tro can goc may va tam mat nhan vat.

### 2.3. Auto-Numbering Step Marker (Co danh so buoc 1-2-3 tu tang)
- **Nhu cau**: Editor lam video tutorial, huong dan quy trinh dung phim cho team hoac tai lieu SOP.
- **Thiet ke**:
  - Them cong cu co danh so (phim tat `5` hoac icon con so tren thanh ve).
  - Moi lan click chuot len anh la tu dong dong mot huy hieu badge tron so: `1`, click tiep thanh `2`, `3`, `4`... tu tang dan.
  - Tu dong doi mau theo token cam neon `--acc`, di chuyen hoac xoa duoc bang cong cu chon `V`.

### 2.4. Timeline Timestamp & Sequence Metadata (Dong dau ngu canh Timeline)
- **Nhu cau**: Luu tru nhat ky dung (edit log), de dang truy vet lai khung hinh thuoc ve sequence nao hoac duoc chup vao thoi diem nao.
- **Thiet ke**:
  - Tuy chon bat/tat watermark nho gon tinh te o goc anh: Thoi gian chup, sequence name hoac ghi chu ngan.
  - Font Inter chu nhat, do mo nhe khong che mat chi tiet quan trong cua anh.

---

## 3. NGUYEN TAC THIET KE & TRIEN KHAI (BAT BIEN)

1. **Cam tuyet doi dung emoji trong UI** (Luat 01 trong AGENTS.md):
   - Toan bo icon tren thanh cong cu, modal, khay anh phai la SVG inline (viewBox 0 0 24 24, stroke 1.9, Lucide style).
2. **Dong bo mau theo token Studio Console**:
   - Mau chu dao: Accent cam `--acc: #f86820`.
   - Nen toi chuyen nghiep: `--bg-0: #090a0d`, `--bg-1: #0d0e12`.
   - Chu va icon: `--t1: #eeeef2`, `--t3: #6f7185`.
3. **Trai nghiem 1-Click & Toc do la so 1**:
   - Moi thao tac phai tuc thoi (<50ms), khong lam gián đoạn luong lam viec cua editor.
   - Ho tro day du phim tat va thao tac keo tha (drag and drop) truc tiep vao Premiere Pro / After Effects.
