> ☠️ **LƯU TRỮ — 21/09/2026 anh Tiến gộp Auto Cut Short vào Auto Short Viral** (*"2 cái này là một và giữ cái tên Auto Short Viral là chính"*). File này là ghi chép CŨ của Cut Short (30/07–18/09), chép nguyên văn để giữ các quyết định + số đo. Nguồn chân lý hiện hành: `../CLAUDE.md`. Cổng 8093 + ID `com.aiostudio.short` đã trả lại.

# AiO Auto Cut Short - Nhat ky

## [0.0.4] - 2026-09-18 19:18 (UTC+7) - ANH HOI: GOP VAO AUTOCUT HAY TACH PANEL? + do lai dau "?"

Anh Tien de xuat mo rong: (1) biet doan nao dang noi gi ngay trong panel,
(2) kiem soat noi dung video, (3) tu de xuat doan cung y / tu tach HOI-DAP
thanh doan trong sequence hoac sequence moi, (4) thao tac muot trong panel.
Hoi: gop vao Autocut hay lam panel moi. Chua viet code — CHO ANH CHOT.

**ANH CHOT 18/09 (sau muc nay):** tinh nang do la panel MOI `AiO Auto Short Viral`
(cong 8100) — KHONG lam o day. Anh chon **giu Auto Cut Short la san pham RIENG**
(van giu cong 8093 + 4 quyet dinh 30/07). Ranh gioi hai tool CHUA vach — hoi anh
truoc khi ai do viet nao chia hoi-dap. De xuat "lam o CHO NAY" ben duoi da BI BAC.

Em de xuat: KHONG gop vao Autocut (dong bang 19/08, da qua tai anh; dock 360px
khong chua noi danh sach noi dung; nghien cuu thi truong 10/09 de xuat dua
Autocut vao Free). Lam o CHO NAY (Auto Cut Short) vi y (3) chinh la quyet dinh
30/07 "chia theo cau hoi" — mo rong thanh "ban do noi dung", short la mot dau ra.

Do lai tren 4 ban chep that co san (doc thang .autocut-nghe.json):
- Heygen tieng Viet 1,4 phut: 16 cau, 2 cau "?" (Whisper co cham "?" tieng Viet)
- Conspiracy 26 phut: 363 cau, 3 dau "?" (ca 3 cuoi cau)
- Gnostic 39 phut: 455 cau, **21 dau "?" nhung chi 9 o cuoi cau — 12 nam GIUA cau**
- Machine 55 phut: 803 cau, **28 dau "?", 21 cuoi cau, 7 giua cau**; 35 cau mo
  dau "- " (luot thoai)
-> Khop so 31/07 (3/9/21 cau ket thuc bang "?"), nhung phep dem 31/07 chi bat
   "?" o CUOI cau Whisper -> sot 57% (Gnostic) / 25% (Machine). Nao hoi-dap
   phai tach o muc TU. Ca 4 file la phim tai lieu/thuyet minh, KHONG co file
   phong van host-khach tieng Viet nao da chep — lieu Podcast 40 phut 2 nguoi
   (25/08) la ung vien do dung nhat.

## [0.0.3] - 2026-07-31 15:08 (UTC+7) - DUONG ONG CHAY THONG LAN DAU, co "ngat cau dung"

Anh Tien them yeu cau: *"dac biet la phai ngat cau dung nha em"*. Da chay thong
toan tuyen tren video Machine (54:59) — CHUA co panel, chay bang script:

1. **Nao chon doan (hoi-dap)**: 803 cau -> 21 cau hoi -> 8 doan dat dai 30-90s.
   Chon doan gan 60s nhat: "So where they make the extreme ultraviolet?"
   43:31.92 -> 44:31.86 = **59,9s**, doc mat: tron chu de (tour laser).
2. **NGAT CAU DUNG — chung minh bang so**: diem cat dau/cuoi lech **0,000s**
   so voi moc cau cua Whisper; cau truoc va cau sau diem cat khong bi chem.
3. **Cat thanh sequence**: "Short QA 60s" = 59,93s (setInPoint/Out theo moc cau).
4. **Dung ban doc**: rf_lamDoc cua Re-Frames -> "Short QA 60s - Doc 9-16"
   1080x1920, 1/1 clip gan Auto Reframe, 0 loi.
5. **Bam theo NOI DUNG — do bang so** (exportFramePNG khong ton tai tren Beta
   26.5 nen khong nhin truc tiep duoc tu day):
   - Clip Gnostic 39 phut: Position cua effect co **3.641 keyframe** Sensei ghi.
   - Short 60s: **142 keyframe**, X di tu 0,22 den 0,90 (bien do 1,69, co cu
     nhay theo chuyen canh) -> khung DUOI THEO noi dung, khong dung giua.
   - Scale tu sinh 177,78% = dung cong thuc 1920/1080 phu khung doc.

**CHO MAT ANH TIEN**: mo sequence "Short QA 60s - Doc 9-16" (project Test3,
DA LUU truoc khi thu) bam play — chat luong bam la phep kiem cuoi.

**CON THIEU cua duong ong**: phu de khoi doc gan len short (engine Transcripts
co san, chua noi) · nut xuat nhap 480p (exportAsMediaDirect da lam sap Premiere
31/07 — duong ke tiep la app.encoder day sang AME, CHO ANH GAT DAU) · panel UI.

## [0.0.2] - 2026-07-31 15:0x (UTC+7) - SPIKE 1+3 DAT · SPIKE 2 LAM SAP PREMIERE

### Spike 1 - Whisper cham dau "?" : TIN DUOC (tren tieng Anh)
Do tren 3 ban chep that: 3/9/21 cau "?" theo video. DOC BANG MAT tung mau:
100% cau "?" la cau hoi that. Cac ca "nghi bo sot" hoa ra la cau tran thuat
(thuoc phu WH-regex cua minh bat nham, khong phai Whisper sot). Bonus: video
phong van Whisper con danh dau "- " o luot thoai.
-> Nao "do hoi-dap" dung dau "?" lam tin hieu chinh la DUNG HUONG.
CHUA do tren podcast tieng Viet - can file that.

### Spike 3 - cat lat thanh sequence: DAT
setInPoint(115,4)/setOutPoint(175,4) tren project item + createNewSequence-
FromClips -> sequence "Short Spike" dai 59,98s (muon 60). Da clearInPoint/Out
tra lai item sach.

### Spike 2 - xuat nhap: ☠️ SAP PREMIERE, DUNG LAI THEO GIAO THUC MOI
exportAsMediaDirect + epr cua AME ("02 - Match Source - Low bitrate") tra
"Error: Unknown Error" sau 0,0s. Vai chuc giay sau Premiere sap day chuyen
(panel Asset Manager den truoc - CEF con chet - roi ca app tat).
May: Test3.prproj da luu 16:03 hom truoc, chi mat seq rac "Short Spike".

Bai hoc da ghi vao skill adobe-cep-panel muc 6e-bis:
- API render/xuat: sequence rac KHONG du co lap - no chay CUNG tien trinh
  voi cong viec that cua nguoi dung.
- "Unknown Error" 0,0s tu tang render = DUNG TAY, khong doi preset thu tiep.
- Duong ke tiep (chi thu khi: project rac RIENG + da luu het + BAO anh Tien):
  (a) epr chinh chu Premiere: CEP\extensions\com.adobe.frameio.v4\assets\epr\
      High Quality 480.epr
  (b) an toan han: app.encoder.encodeSequence - day sang hang doi AME,
      render NGOAI tien trinh Premiere.

## [0.0.0] - 2026-07-30 16:10 (UTC+7) - DAT MONG, CHUA CO CODE

Anh Tien giao: "tu tao noi dung short 60s - dang short cho cac nen tang".

Da lam:
- CLAUDE.md: kien truc du kien (GHEP 3 engine da co: Transcripts + Autocut +
  Re-Frames; phan MOI duy nhat la nao "chon doan nao dang lam short")
- Dat cho: com.aiostudio.short, cong debug 8093
- 5 CAU HOI SAN PHAM cho anh Tien chot truoc khi viet code - xem CLAUDE.md.
  Quan trong nhat: tieu chi "doan dang short" theo kinh nghiem editor cua anh,
  va short cuoi la SEQUENCE hay file MP4.

## [0.0.1] - 2026-07-30 16:2x (UTC+7) - ANH TIEN CHOT 4 QUYET DINH SAN PHAM

1. Chia doan theo CAU HOI-DAP cua podcast (khong cham diem "hay/do" mo ho).
   Moi cau hoi + tra loi = mot ung vien short. Dai qua 60s van cut, editor sua.
2. Dau ra: moi ung vien = SEQUENCE moi + nut xuat nhap 480p de check.
3. Do dai: dai 30-90s, uu tien ~60s, cat o ranh gioi cau tron.
4. Phu de: dung nguyen engine khoi doc cua Transcripts. Karaoke lam SAU.

Chi tiet + huong lam nao "do hoi-dap" + 3 viec spike truoc: xem CLAUDE.md.

Chua lam (co y - spike truoc roi moi xay):
- Spike 1: Whisper cham dau "?" tin duoc khong (do tren 3 video Test co san)
- Spike 2: xuat 480p bang exportAsMediaDirect + preset .epr (sequence rac)
- Spike 3: cat vung hoi-dap thanh sequence moi (duong da co, kiem lai)
- Toan bo panel.
