# AiO Auto Podcast - Nhat ky

## [picker-va-hai-lo-hong] - 2026-08-05 21:11 - v0.6.4 / host v0.4.8: PICKER + BIT HAI DUONG LAM MAT CLIP

### Boi canh

Anh Tien: *"em dua cac option nay gon hang thanh option chon nhu sau: video:
enable or disable hoac cut bo; audio co the: tat/mo, cut bo hoac ducking, hoac
giu nguyen audio — dua gon gang thanh cac picker de nguoi dung chon nhanh luon,
click la duoc"*. Kem: *"xoa giup anh 2 dong text du thua nay"* va *"cuoi cung
em xem con van de gi can phai lam thi lam luon di em"*.

### Thay doi 1 - PICKER

O `select` doi thanh **radio that + label** (khong phai div + onclick):

| Nhom | Lua chon |
|---|---|
| **Hinh** | `bat-tat` (mac dinh) · `cut-bo` |
| **Tieng** | `duck` (mac dinh) · `bat-tat` · `cut-bo` · `giu` |

- Duong **`cut-bo` cho TIENG la MOI** (khoi phuc khuon `theo` cu, gio co ten
  dung nghia): chi dat mic nguoi dang noi, nguoi kia khong co clip.
- Bo `cat-chim` (cat roi + chim) cho gon dung 4 duong anh liet ke.
- Quy khuon cu trong localStorage: `theo`→`cut-bo`, `cat-tat`→`bat-tat`,
  `cat-chim`→`duck`, `du-cam`/`1-cam`→`bat-tat`/`cut-bo`. Khong quy thi panel
  mo ra voi picker trong va IM LANG chay sai duong.
- Radio cho khong: Tab vao nhom, mui ten chuyen (quy tac vang #3, #4).
- Xoa 2 dong chia muc "Hinh — cam nao thay ai" / "Tieng — mic rieng cua ai"
  theo yeu cau; giu lai dung duong ke ngan giua nhom V va nhom A.

☠️ **Do UI thi phai MO HOP THOAI RA MOI DO.** Lan do dau moi so ra **0** vi
modal `#ov` dang `hidden` — dung bay quy tac vang #20. Mo ra roi do:

| Do | Ket qua |
|---|---|
| 4 nut Tieng | cung mot hang, khong nut nao bi cat chu |
| Cao nut | 22 px |
| Tuong phan chu nut **DANG CHON** | **3,00 -> TRUOT AA** (chu trang tren nen cam #f86820) |
| Sau khi doi sang chu toi | **6,43 DAT** |
| Tuong phan nut thuong | 10,99 |

Dung bai hoc so thiet ke #25: nen accent cam/vang rat hay truot AA, phai DO
chu dung nhin.

### Thay doi 2 - ☠️☠️ HAI DUONG LAM MAT CLIP VINH VIEN (soat ra, do lai, sua)

Chay mot dot ra soat 5 goc nhin (host / luong panel / bo kiem / tai lieu / san
pham), moi phat hien dang ke bi mot agent khac co gang BAC BO. Hai cai song sot,
va em **do lai bang phep kiem cua minh** truoc khi tin (bai hoc 5r):

**A. THIEU TRACK — clip bay luon, host van tra "OK".**
`pc_sapXepClipsLenTrack` xoa sach moi clip TRUOC roi dat lai. Nhanh dat clip boc
trong `if (tIdx < numTracks)` **khong co else** -> lenh tro vao track ngoai vung
bi nuot IM LANG, `soLoi` khong tang. Panel chi doc `soLoi` nen bao "da khop N
nguoi".
Ca that de gap: keo 6 file cam vao mot sequence (clip don tren V0) roi bam
**Auto Match** — `khop.js` danh so track theo SO NHOM TEN FILE, khong doc so
track that, nen sinh `V,0..V,5` tren sequence chi co 1-3 track.
Do bang app Premiere gia (nap chinh `host/podcast.jsx`, khong mock ham):

```
truoc khi sua:  OK:daDat=1|soLoi=0|loiDau=     <- ma timeline con 0 clip
                OK:daDat=0|soLoi=0             <- audio mat sach 4 clip
sau khi sua:    ERR:THIEU_TRACK|canV=6|coV=1|canA=0|coA=0   timeline con nguyen 6 clip
                ERR:THIEU_TRACK|canV=0|coV=1|canA=5|coA=1   audio con nguyen 4 clip
```

Sua: chan **TRUOC KHI XOA**, cung cho voi chot `THIEU_ITEM`. **KHONG kep ve
track cuoi** nhu `pc_datHinh` — kep la 4 cam de len nhau tren mot track, dung
ky thuat nhung sai san pham. Tu choi va noi ro thieu bao nhieu.
→ Day dung la HO CUA BAN VA v0.6.1: ban do bit duong "thieu ITEM" nhung bo sot
duong "thieu TRACK" — cung ho, cung hau qua, cung tra "OK:".

**B. Cat in/out hong bi nuot -> dat clip DAI SAI de chet clip ben canh.**
`try { setInPoint; setOutPoint } catch (e) {}` — catch RONG roi van chay xuong
`overwriteClip`. Item con mang in/out CU (hoac nguyen do dai media) -> clip dai
sai, va vi la `overwriteClip` nen no de chet cac clip da dat truoc tren cung
track. `daDat` van tang, `soLoi` van 0.
```
truoc khi sua:  OK:daDat=2|soLoi=0   (dat ca clip hong)
sau khi sua:    OK:daDat=1|soLoi=1|loiDau=setInOut V: ...
```
`pc_datHinh` trong CUNG FILE xu ly dung tu dau; cho nay bi bo sot.

**C. Nhan loi `seq_doi` khai bao ma KHONG CHO NAO GOI.** Host tra `ERR:SEQ_DOI`
o 13 cho, panel dan thang MA THO ra man hinh — dung cai anh Tien nhin thay:
`Build failed: ERR:SEQ_DOI|`. Them `cauLoiHost()` dich ma loi thanh cau noi
nguoi dung LAM GI TIEP, noi vao **14 cho** dang dan ma tho.

### File anh huong

- `host/podcast.jsx` — chot THIEU_TRACK, sua 2 catch rong, v0.4.7 -> v0.4.8
- `dist/index.html` — picker + CSS `.pick` + `docPick`/`datPick`/`quyKhuonCu` +
  `cauLoiHost` + duong tieng `cut-bo` + xoa 2 dong chia muc, v0.6.1 -> v0.6.4
- `tests/kiem-host.mjs` — them muc 2a2 (4 phep) va 2a3 (2 phep): **68 -> 74**

### Kiem chung bang so

- `kiem-host` **74/74 DAT** · `kiem-sync` 9/9 · `kiem-khop` 32/32
- Cu phap panel sach; moi `t()` deu co khoa; moi `getElementById` deu co id that
- Don code chet: 3 nhan i18n + bien `giuMic`. ☠️ Bo do code-chet dau tien bat
  nham **5/9** (nhan truyen dang tham so chu khong qua `t()`), phai grep lai
  tung cai — va chinh luc grep moi lo ra lo hong C o tren.
- Chay THAT tren liue 58 phut, to hop `hinh=bat-tat` + `tieng=cut-bo`:
  V0 299 clip (tat 150) · V1 299 clip (tat 149) · **A0 149 clip · A1 150 clip**
  (149+150 = 299 = dung tong so doan) · 0 keyframe · 0 clip khong co file ·
  `pc_doPhuHinh`: **299 moc, 299 bat dung 1 cam, 0 den, 0 chong**

## [du-cam-bat-tat] - 2026-08-05 20:38 - v0.6.3 / host v0.4.7: HINH CUNG BAT/TAT DUOC - 299/299 DUNG

### Boi canh

Anh Tien sau khi duyet 4 duong tieng: *"roi bay gio o phan video anh cung muon
lam theo kieu la cac clip cut co the theo dang la enable hoac disable luon la
dinh cua job em oi"*.

Y nghia voi nguoi dung: thay vi chi dat clip cua cam nguoi dang noi (track kia
de trong), nay **MOI cam co clip o MOI doan**, chi cam nguoi noi duoc BAT. Doi
nhat cat nao thi tat cai dang bat, bat cai kia — **mot phim Shift+E, khong phai
cat lai**.

### Thay doi

**Panel** — them o **"Hinh sau khi cat"** (nam tren o tieng):

| Gia tri | Nghia |
|---|---|
| `du-cam` (mac dinh) | moi cam co clip o moi doan, tat cam khong dung |
| `1-cam` | chi dat clip cua cam nguoi dang noi (khuon cu) |

- `viecHinh` tu 1 dong/doan thanh n dong/doan (n = so cam, ke ca cam chung).
- Buoc moi `trangThaiHinh()` chen giua dat hinh va don tieng.
- `doLai` so `tongHinh` voi `viecHinh.length` (khong con la `doan.length`).

**Host v0.4.7** — them:
- `pc_datTrangThaiHinh(tenSeq, vIdx, dsStr)` — bat/tat clip hinh, khop moc theo
  `PC_GAN` (khop gan nhat, vi luoi khung hinh).
- `pc_doPhuHinh(tenSeq)` — **phep kiem that**: gom clip theo moc thoi gian roi
  dem tai moi moc co MAY clip dang BAT. Phai dung 1.
  ☠️ Day la cho de rot vao bay 5k: dem so clip khong noi len duoc gi. Cau hoi
  dung la *"tai moi thoi diem nguoi xem thay may hinh"* — 0 la man hinh den,
  2 la cam tren che cam duoi. Panel chan ca hai truong hop.

### File anh huong

- `host/podcast.jsx` — 2 ham moi, v0.4.6 -> v0.4.7
- `dist/index.html` — o `cheDoHinh` + nhan VI/EN + `viecHinh`/`ttHinh` +
  `trangThaiHinh()` + kiem `pc_doPhuHinh` trong `doLai`
- `tests/kiem-host.mjs` — them muc 2f (10 phep): **58 -> 68 phep**

### Kiem chung bang so (phan da co)

- `node tests/kiem-host.mjs`: **68/68 DAT**. Trong do:
  - V0 bat-TAT-bat / V1 TAT-bat-TAT dung theo lich cat
  - `pc_doPhuHinh` bao dung `soMoc=3 motBat=3 khongBat=0 nhieuBat=0`
  - **hai cam cung bat -> BAO `nhieuBat`** kem moc nao
  - **khong cam nao bat -> BAO `khongBat`**
  - moc lech 6 ms (luoi khung hinh) van khop dung clip
- Cu phap panel sach (1 khoi script 2.136 dong); id/option/nhan VI+EN du.
- Cai vao ban dev: panel nap host **v0.4.7**, o hien
  "Every cam — disable unused".

### Chay THAT tren liue 58 phut - sequence `Podcast - DU CAM bat-tat + duong am luong`

| Do | Ket qua |
|---|---|
| So moc thoi gian | **299** |
| V1 (cam Will, C4091) | 299 clip — tat 150, bat 149 |
| V2 (cam Trong, C4236) | 299 clip — tat 149, bat 150 |
| Moi moc co du 2 cam | **299 / 299** |
| **Moi moc bat DUNG 1 cam** | **299 dung · 0 man hinh den · 0 chong cam** |
| Duong am luong (di kem) | **299 / 299** · 597 keyframe/mic · quet 3.628 diem: 0 lan ca hai cung to, 0 lan ca hai cung chim |

### ☠️ CONG CU DO SAI LAN THU TU - va lan nay la do chinh thay doi nay

`kiem-am-luong.ps1` bao **TRUOT 299/598**. Nguyen nhan: no dung lich cat bang
cach doc MOI clip video. Truoc day moi doan chi co 1 clip (tren track cua nguoi
noi) nen dung; nay duong `du-cam` dat clip cho CA HAI cam o MOI doan, thanh ra
no doc duoc "598 doan" va nua so do gan nham nguoi.

Dau hieu de nhan ra la thuoc sai chu khong phai san pham sai: phep quet 3.628
diem trong chinh script do van bao **0 lan ca hai cung to, 0 lan ca hai cung
chim** — hai ket qua mau thuan nhau thi mot trong hai la cong cu do.

Sua: chi lay clip **dang BAT** lam lich cat. Doi chieu nguoc tren ban cu (1 cam)
van **299/299 DAT** -> thuoc khong bi noi long cho qua.

→ **Bon lan trong mot ngay** cong cu do bao sai truoc khi san pham sai. Diem
chung: moi lan doi CACH DU LIEU DUOC BAY RA thi thuoc do cu ngam gia dinh cu.

### Do do nang - luat "NHE DE NHANH" cua anh Tien

| Sequence | Clip hinh | Duyet toan bo (trung binh 3 lan) |
|---|---|---|
| `du-cam` | **598** | **189 ms** |
| 1 cam (khuon cu) | 299 | 84 ms |

Ty le 2,25x tren 2x so clip -> **tuyen tinh, khong co hieu ung N²**. File project
1.639 KB.
⚠️ Day la chi phi API, **khong phai** do "keo timeline co muot khong" — cai do
phai tai anh Tien cam nhan. Neu thay i thi doi o "Hinh sau khi cat" ve
`Chi cam nguoi dang noi`.

## [bon-duong-tieng] - 2026-08-05 17:06 - v0.6.2 / host v0.4.6: O CHON 4 DUONG TIENG - DA DO DU CA BON

### Boi canh

Anh Tien xem ban ducking xong: *"ban ducking nay anh kiem tra da on roi em nha
luu lai option nay va lam luon va ben cho panel em hay dua ra 1 su lua chon de
chon em nha"*. Truoc do anh de xuat: *"them 1 option la em cut va enable/disable
clip thi sao em ha?"*.

Tuc: giu duong ducking, LAM THEM duong cat roi, va **dua ca hai vao panel thanh
o chon** thay vi chay bang script ngoai.

### Do truoc khi hua (khong doan API)

- `TrackItem.disabled` la **boolean, ghi duoc va tra lai duoc**. Thu tren 1 clip
  cua ban dung roi tra ve nguyen trang: `false -> true -> false`, 299 clip hinh
  khong suy suyen.
- `sequence.razor` **KHONG ton tai** trong Premiere Beta 26.5 -> khong cat bang
  dao duoc. Khong can: panel dat tung doan bang `overwriteClip` nen clip da roi
  san.

### Thay doi

**Panel** — o `cheDoTieng` doi tu 2 lua chon thanh **4 duong**:

| Gia tri | Nghia | Tieng nguoi khong noi |
|---|---|---|
| `duck` (mac dinh) | 2 clip mic lien mach + VE DUONG AM LUONG | chim -15 dB, muot 150 ms |
| `cat-tat` | cat roi tung doan cho CA HAI mic, TAT clip nguoi kia | im hoan toan (Shift+E bat lai) |
| `cat-chim` | cat roi nhu tren, ha Level thay vi tat | chim -15 dB |
| `giu` | 2 clip lien mach, khong dung toi am luong | de nguyen |

- Them o **muc chim** (-8 / -15 / -24 dB), mac dinh **-15 dB** (muc anh Tien
  duyet). O nay **an di** voi `cat-tat` va `giu` — o do no la cong tac vo nghia
  (bai hoc so thiet ke #11).
- ☠️ `cat-*` dat clip cho **CA HAI nguoi o MOI doan**, khong chi nguoi noi. Do la
  cho khac khuon `theo` cu: co clip thi bat lai duoc, khong phai di tim lai file.
  Gia tri `theo` cu trong localStorage tu dong quy ve `cat-tat`.
- Buoc moi `xuLyTieng()` chen giua dat tieng va do lai; go duong cu truoc khi ve
  (chay lai lan hai khong cong don).

**Host v0.4.5** — them `pc_datTrangThaiTieng` (khop clip theo `start`, tat/dat
Level) va `pc_doTrangThaiTieng` (do lai: so clip tat / bat / muc thap-cao).

### File anh huong

- `host/podcast.jsx` — 2 ham moi, v0.4.4 -> v0.4.5
- `dist/index.html` — o chon 4 duong + o muc chim + `tenCheDoTieng()` +
  `xuLyTieng()`; nhan VI/EN; 2 cho kiem phien ban host
- `tests/kiem-host.mjs` — them muc 2d (11 phep) va 2e (11 phep): **31 -> 53 phep**

### Kiem chung bang so (phan da co)

- `node tests/kiem-host.mjs`: **53/53 DAT**. Trong do doi chieu lai bang dB:
  he so 1 -> giu dung gia tri goc; he so 0,177828 -> dung **-15,0000 dB**.
  Ca "moc khong co clip" cung duoc dem vao `khongThayClip` chu khong im lang.
- Cu phap panel: 1 khoi script 2.046 dong parse sach; 5 id moi va 4 option moi
  deu co that trong DOM.
- Cai vao ban dev, panel nap host **v0.4.5**, o chon hien du 4 duong.

### ☠️ LAN CHAY THAT THU NHAT - TRUOT, VA TRUOT DUNG CHO DA DOAN TRUOC

Chay `cat-tat` tren liue 58 phut. Hinh + tieng dat du (**V=299, A=598**) nhung
buoc dat trang thai bao:

```
daDat=6 | khongThayClip=14 | soLoi=0 | loiDau=khong thay clip @2.3000
```

Nguyen nhan that: host khop clip bang `start.toFixed(2)` — **bang chinh xac,
dung sai 10 ms**. Nhung `overwriteClip` dat clip **theo LUOI KHUNG HINH**:
panel gui **2.3000**, clip that nam o **2.2940** — lech **6 ms**, du de hai
chuoi khac nhau. Truot **14/20 lenh** cua lo dau.

Sua: `PC_GAN = 0.06s` (~2 khung o 29,97 fps) va **khop GAN NHAT** thay vi khop
bang. Van duy nhat vi doan ngan nhat nguoi dung dat >= 1 giay. Doc `start` mot
lan vao mang thuong truoc khi tim — doc `.seconds` trong vong lap long nhau la
bat ExtendScript goi cau hang tram nghin lan.

Them 6 phep kiem dung lai dung ca nay (**53 -> 58 phep, 58/58 DAT**):
- moc lech vai ms van khop dung clip
- lech 500 ms thi **KHONG** duoc khop bua (dung noi nguong cho no qua — 5j)
- hai clip sat nhau 50 ms: phai chon cai **GAN NHAT**, khong phai cai gap truoc

☠️ **Con mot cong cu do sai nua trong chinh phien nay**: script cho "chay xong"
lay moc la `nut.disabled === false`. **Sai** — nut van `disabled=true` ca khi da
dung. Moc dung: nhan nut con dau `…` la dang chay. Dung bai hoc 5f/5j: moc
"xong" phai la tin hieu cua chinh no, va dung chon chi so minh khong kiem soat.

### ☠️ CONG CU DO SAI LAN THU BA TRONG CUNG PHIEN - suyt bao "hong" oan

Do `cat-chim` xong, thuoc bao **TRUOT 299/299**. Mo con so ra doc:

```
lv=0.03162277489901   mong doi=0.0316227763148914
```

Lech **1,4 x 10^-9**. Do la Premiere luu `Level` dang **float 32-bit**. Quy ra
dB: **0,0000004 dB** — khong tai nao nghe duoc. Thuoc cua em so bang so thuc voi
dung sai `1e-9` nen bat oan ca 299 doan.

Sua thuoc: **so bang dB, dung sai 0,05 dB**. Do la chi so nguoi dung cam nhan
duoc, va khong phu thuoc cach Premiere luu so (bai hoc 5 + 5j). Do lai thi ca
`cat-chim` lan `cat-tat` deu **299/299 DAT**.

→ **Ba lan trong mot phien, cong cu do bao sai truoc khi san pham sai**: (1) moc
"xong" lay theo `nut.disabled`; (2) khop clip bang `toFixed(2)`; (3) so `Level`
bang so thuc. Ca ba deu se dan den "di sua mot thu khong hong".

### Kiem chung tren Premiere - chay THAT ca 4 duong tren liue 58 phut

Moi duong chay tu PANEL (bam nut that qua cong 8094), roi do bang script doc
THANG tu Premiere — khong tin bao cao cua panel.

| Duong | Sequence | Hinh | Clip tieng | Doi chieu 299 doan | Rieng |
|---|---|---|---|---|---|
| `duck` | `Podcast - DUONG AM LUONG -15 dB` | 299 | 2 (lien mach) | **299 DAT / 0 truot** | 597 keyframe/mic · quet 3.628 diem: 0 lan ca hai cung to, 0 lan ca hai cung chim |
| `cat-tat` | `Podcast - CAT ROI + TAT clip nguoi kia` | 299 | 598 | **299 DAT / 0 truot** | tat 150 (A1) + 149 (A2) = 299 = dung so doan cua nguoi kia · 0 keyframe |
| `cat-chim` | `Podcast - CAT ROI + chim -15 dB` | 299 | 598 | **299 DAT / 0 truot** | 0 clip tat · muc chim dung -15 dB · 0 keyframe |
| `giu` | `Podcast - GIU NGUYEN 2 mic` | 299 | 2 | — | 0 tat · 0 keyframe · khong dung toi am luong |

Ca bon: **clip khong phai file media = 0/0**.

Bo kiem: `kiem-host` **58/58** · `kiem-sync` **9/9** · `kiem-khop` **32/32**.

### CON NO (khong tu sua trong phien nay, va ly do)

1. ☠️ **`kiem-nao` va `stress` VAN TRUOT 2 phep** — no tu phien truoc, khi nao
   doi ban chat sang duong "nghe tron tung kenh" ma chua sua 2 phep kiem viet
   cho thuat toan CU:
   - `kiem-nao` "bleed -5 dB -> gay an toan": duong moi nghe tung kenh RIENG nen
     khong con khai niem "chenh lech giua hai mic" -> chot cu khong ap dung.
     Chot moi dung phai la **ty le CHONG LAN khoang noi giua cac kenh**.
   - `stress` ca 5 "mic-lech (bleed-20)": 1/10 luot.
   **Vi sao khong sua ngay**: sua la cham vao NAO — thu dang cho ket qua dung
   tren liue that cua anh Tien (299 nhat cat can doi 54,4/45,6). Them mot chot
   an toan sai la tool tu choi dung tren chinh liue do. Muon sua an toan phai
   co bo dap an (anh Tien cham marker) + do lai tren ca liue that lan bo tong
   hop. Khong lam voi trong mot phien dang giao hang.
2. Vi 2 phep do, **van phai CAI BANG TAY** (chep `host/podcast.jsx` +
   `dist/index.html` vao ban da cai) thay vi qua `sign-install.ps1`.
3. Chua xu ly **gain tong** — anh Tien van phai tu keo len moi nghe ro
   (do that: Will mean -42,6 dB, Trong mean -36,4 dB).
4. Van chua co thuoc NGOAI cho "cat dung nguoi".
5. Sequence **`Will - Podcast Cut`** (khong so) la BAN HONG CU: 10 clip hinh +
   10 clip tieng khong co file media. Anh Tien xoa duoc.

## [duong-am-luong] - 2026-08-05 16:17 - host v0.4.4: DUCKING BANG KEYFRAME, 299/299 DUNG

Anh Tien xem ban dung ra luc 15:48 roi bao hai viec:
1. *"anh moi tang 2 audio len 25db thi moi nghe duoc"*
2. *"hien tai em dang de 2 thanh audio de len nhau... cai anh muon la mau tim
   cua Trong thi khi Trong noi audio ma cam doan do duoc an di ton len audio
   cua Trong va nguoc lai"*

Tuc: **ducking** — ai noi thi mic nguoi kia phai chim xuong.

### Anh Tien chon (hoi bang AskUserQuestion, 2 cau)

| Cau | Anh chon |
|---|---|
| Dang tieng | **Ve duong am luong** (giu 2 clip mic lien mach + keyframe Level). Khong cat tieng, khong bake — anh keo lai duoc bang tay |
| Muc chim | **-15 dB** |

### Do truoc khi lam - ba phep, ca ba deu doi huong ke hoach

**1. Muc tieng that.** `volumedetect` tren 2 file mono:
`Will mean -42,6 dB` · `Trong mean -36,4 dB` (max ca hai ~0 dB).
Tieng thu rat nho VA hai mic lech nhau **6,2 dB** — dung la phai keo len moi nghe.

**2. ☠️ THANG GIA TRI CUA `Level` — suyt sai vi tin cong thuc quen thuoc.**
Doc `Volume > Level` cua clip audio: **0.17782793939114**. Cong thuc hay gap
`dB = 20*log10(value)` cho ra **-15 dB** — nghe rat hop ly, va suyt tin.
Do doi chieu: doc Level cua **moi clip audio o moi sequence** (ke ca clip panel
vua dat tu dong, ke ca clip chi co 1 component) deu ra **dung con so do**. Giong
het nhau o moi noi => day la **MAC DINH cua Premiere**, tuc **0 dB**, khong phai
-15 dB. Thang that: `value = 10^((dB-15)/20)`, value 1.0 <-> +15 dB.
→ Cach tranh phu thuoc: `pc_veAmLuong` **khong nhan dB, nhan HE SO NHAN**. Chim
15 dB = nhan 10^(-15/20) vao gia tri DANG CO. Dung du offset thang la bao nhieu,
va **khong pha mat chinh tay cua nguoi dung** (bai hoc 5j).

**3. ☠️ MOC KEYFRAME TINH THEO THOI GIAN TRONG FILE, KHONG PHAI THOI GIAN SEQUENCE.**
Clip mic: `start=0` `in=7,007` `end=3528,4` `out=3535,407`. Neu doan sai goc thoi
gian thi **ca 299 moc lech 7 giay** — nghe ra ngay.
- Phep do tu dong: dat keyframe tai **t=3534**. Moc do **ngoai** vung clip tren
  sequence (3528,4) nhung **trong** vung media (3535,4). Premiere **nhan nguyen
  ven, khong clamp** -> nghieng manh ve media-time.
- Phep do NGOAI (khong tin mot dau hieu, bai hoc 5i/5d): dat mot **ho am luong
  -40 dB dai 20 giay** tai keyframe 300-320 tren **BAN SAO** `THU-AM-LUONG`, roi
  hoi anh Tien ho nam o dau. Anh tra loi **"khoang 4:53"** = 300 - 7,007.
  → **XAC NHAN media-time.** Moi moc = `thoiGianSequence + inPoint`.

☠️ Ca hai phep thu deu chay tren **ban sao** `pc_nhanBanGiuClip` tao ra, khong
dung vao ban dung cua anh (luat 3b).

### Thay doi

- `host/podcast.jsx` v0.4.4, them 4 ham:
  - `pc__propLevel(cl)` — lay property Volume > Level
  - `pc_docAmLuong(tenSeq)` — CHI DOC: Level hien tai, da co keyframe chua, so key
  - `pc_veAmLuong(tenSeq, aIdx, dsStr, goc)` — dat mot LO keyframe, `dsStr` =
    `"t,heSo;..."`, gia tri ghi = `goc * heSo`
  - `pc_xoaAmLuong(tenSeq, aIdx)` — go sach duong de ve lai (hoan tac duoc)
  - `pc_nhanBanGiuClip(tenGoc, tenMoi)` — clone GIU NGUYEN clip, de thu an toan
- Panel: doi moc kiem phien ban host sang v0.4.4 (2 cho).
- Script van hanh (chua vao panel): `scratchpad/ve-am-luong.ps1` +
  `scratchpad/kiem-am-luong.ps1`.

### Kiem chung bang so

Bo kiem host: **31/31 DAT**.

Cach ve: moi ranh giua hai doan dat **2 keyframe** — `(T - 0,15s, muc cu)` va
`(T, muc moi)` -> chuyen muot 150 ms, khong "cup". 299 moc -> **597 keyframe moi
mic**, `soLoi=0`.

Thuoc do KHONG chi dem: doc **toan bo 1.194 keyframe** ve, dung lai duong bac
thang bang noi suy tuyen tinh (dung cach Premiere noi suy), roi doi chieu voi
lich cat:

| Phep | THU-AM-LUONG (ban thu) | Will - Podcast Cut (2) (that) |
|---|---|---|
| Doi chieu tam **299 doan**: mic nguoi noi ~0 dB VA mic kia <= -12 dB | **299 DAT / 0 TRUOT** | **299 DAT / 0 TRUOT** |
| Quet **3.628 diem** deu tren 58 phut: ca hai cung TO | **0** | **0** |
| Cung quet: ca hai cung CHIM | **0** | **0** |

Ban thu `THU-AM-LUONG` da xoa sau khi do xong (4 -> 3 sequence).

### CHUA lam duoc / con no

1. **Chua vao PANEL.** Duong am luong hien ve bang script ngoai qua cong 8094,
   chua co nut/o chon trong giao dien. Phai dua vao `dist/index.html` (cai dat
   "Chim nguoi khong noi: -8 / -15 / -24 dB / tat").
2. **Chua xu ly GAIN tong.** Anh Tien van phai tu keo +25 dB. Level dang o mac
   dinh (0 dB) va em CO Y khong dung toi — anh chinh bang `Clip > Audio Gain`
   thi no nam ngoai Level, ghi de la mat chinh tay cua anh. Bo sau nen chuan hoa
   luc tach file mono (loudnorm ve -16 LUFS) chu khong chinh tren timeline.
3. Van chua co thuoc ngoai cho **"cat dung nguoi"** (rieng goc thoi gian keyframe
   thi da co - chinh la cau tra loi "4:53" cua anh Tien).
4. Van cai BANG TAY: `kiem-nao` + `stress` con truot 2 phep (xem muc duoi).

## [chuoi-con-giet-ban-dung] - 2026-08-05 15:48 - host v0.4.3: RA BAN DUNG THAT DAU TIEN TREN LIEU 58 PHUT CUA ANH TIEN

Anh Tien gui anh chup panel bao **"Verification found a mismatch: hinh 164/299"**
va noi: *"anh khong can biet em sua cai gi... anh can video podcast dang len
chieu nay con lai la viec cua em"*. Phien nay: tim goc, sua, chay ra ban dung,
do lai bang thuoc doc lap.

### Boi canh

Liue that: sequence `Will` - 58:48 (3528,4s), 2 cam (C4091 = Will, C4236 = Trong),
2 mic rieng da qua PluralEyes drift-correct. Ban do: V1 Will, V2 Trong, A1 Will,
A2 Trong. Truoc phien nay project co **9 sequence "Podcast Cut" DEU HONG**.

### Nguyen nhan that - do bang mo phong tren chinh project cua anh

Chay lai dung phep cham diem cua `pc__item` cho duong dan file mic mono:

```
tim: ...\102 Quay Phim Will (2)_drift_corrected+0.084.aio-mono.wav
  diem=1  Quay PV tuyen dung_DRT_1002   <- SEQUENCE, khong co file
  diem=1  Will                          <- SEQUENCE, khong co file
=> CHON: Quay PV tuyen dung_DRT_1002 (diem 1)
```

`pc__item` van con luat **"chuoi con" (diem 1)** lam phuong an cuoi. Anh Tien
dat ten sequence **trung ten THU MUC quay**, ma ten thu muc do nam trong duong
dan cua MOI file trong buoi quay -> moi file chua duoc nhap deu "khop" vao no.

Do domino, do duoc tung buoc:
1. `pc_nhapMono` hoi `pc__item` -> tuong 2 file mono **da co san** -> **nhap 0 file**.
   Do doi chieu: tren dia co **4 file `.aio-mono.wav`** (tao 14:04-14:11 cung
   ngay); trong project co **0 item** mang ten do.
2. Vong kiem ngay sau do dung **chinh ham hong** de kiem -> bao `thay=2`, DAT.
3. `pc_datTieng` dat cai sequence 31 phut do len A1 va A2. Vi no la clip **co ca
   hinh**, Premiere tha hinh xuong V1 va V2: mot clip **0 -> 1877,167s** (31'17")
   tren ca hai track hinh.
4. Clip khong lo do de chet **135/299 nhat cat** dau tap. `pc_doKetQua` bat duoc
   phan hinh (164/299) nhung **bao phan tieng LA DAT (2/2)** - vi no chi DEM so
   clip, khong kiem clip do la FILE NAO (bai hoc 5k).

Do them tren ca 9 sequence hong: **moi cai deu co dung 2 clip hinh + 2 clip
tieng khong co duong dan media, cai dai nhat 1877,2s** - cung mot van tay.

☠️ Loi thu hai cung phien: ban `Will - Podcast Cut (7)` dung do 260 clip vi
`ERR:SEQ_DOI` - anh bam sang tab sequence khac trong luc panel dang dat clip.

### Thay doi

| Cho | Truoc | Sau |
|---|---|---|
| `pc__item` cham diem | 4 / 3 / 2 / 1 (co chuoi con) | **chi 4 (duong dan) va 3 (ten file)** |
| Item khong co media path | van la ung vien | **khong bao gio la ung vien** |
| Cache tra cuu `pc__c` | ghim ket qua theo duong dan | **BO** (anh Tien: "remove cache") - bat nham 1 lan la nham suot phien; nay chi giu de don in/out |
| `pc__seqDangDung` | active lech ten -> `ERR:SEQ_DOI` | **ghim lai** active ve ban dung theo TEN; chi ERR khi ban dung that su bien mat |
| `pc_doKetQua` | dem so clip | dem them **`hinhLa` / `tiengLa` / `tenLa`** = clip khong phai file media |
| Panel `doLai()` | chi so dem | chan luon khi `hinhLa>0` hoac `tiengLa>0` |
| `pc_phienBan` | v0.4.2 | **v0.4.3** (panel kiem 2 cho, da doi theo) |

### File anh huong

- `host/podcast.jsx` - `pc__item`, `pc__seqDangDung`, `pc_doKetQua`, `pc_phienBan`
- `dist/index.html` - 2 cho kiem phien ban host, khoi `doLai()`
- `tests/kiem-host.mjs` - them muc 2b (5 phep) va 2c (4 phep): **22 -> 31 phep**

### Kiem chung bang so

Bo kiem host: **31/31 DAT**. Trong do 2 phep dung lai dung cai bay cua anh:
- `file mono CHUA nhap -> tra null, KHONG bat vao sequence` (truoc: bat nham)
- `sau khi nhap: thay NGAY (khong bi cache ghim ket qua cu)`
- `doi tab giua chung -> van dung viec, da ghim lai active ve ban dung`
- `mat han ban dung -> SEQ_DOI (dung tay)` - chot an toan van con nguyen

Chay that tren panel (bam nut qua cong 8094, 15:44-15:45), do lai bang script
doc THANG tu Premiere - khong tin bao cao cua panel:

| Do | Ban hong (Cut 6) | Ban moi (Cut 2) |
|---|---|---|
| Clip hinh | 164/299 | **299/299** |
| V1 | 82 clip + 1 clip la | **149 clip, 100% C4091.MP4** (cam Will) |
| V2 | 82 clip + 1 clip la | **150 clip, 100% C4236.MP4** (cam Trong) |
| A1 | sequence dat nham | **mic Will mono, lien mach 0 -> 3528,4s** |
| A2 | sequence dat nham | **mic Trong mono, lien mach 0 -> 3528,4s** |
| Clip khong phai file media | hinh 2 · tieng 2 | **hinh 0 · tieng 0** |
| Phu song hinh | 1 vung nhung 31' dau la do la | **1 vung lien, 0 -> 3528,48s, 0 lo den** |
| Nhat ngan nhat | - | 1,04s (dung muc cai dat 1s) |
| Chia thoi luong | - | Will 54,4% / Trong 45,6% |

### CHUA lam duoc / con no - noi ro de phien sau khong tuong da xong

1. ☠️ **VAN CHUA CO THUOC NGOAI cho "cat dung nguoi".** Moi so tren chung minh
   "khong mat clip, dung track, dung cam, dung mic" - KHONG chung minh "cat dung
   cho". Thuat toan cham bang dB, thuoc cung bang dB (bai hoc 5d). Can anh Tien
   cham marker cho mot bo dap an.
2. ☠️ **Cai bang tay, KHONG qua cong `sign-install.ps1`.** Vi `kiem-nao` va
   `stress` dang TRUOT 2 phep - phien truoc doi ban chat nao (duong "nghe tron
   tung kenh", `dist/nao.js` 14:50) ma chua sua 2 phep kiem viet cho thuat toan
   CU. Da chep tay `host/podcast.jsx` + `dist/index.html` vao ban da cai (do lai
   md5 khop). **Viec ke tiep: sua 2 phep kiem do roi cai lai chuan.**
   - `kiem-nao` "bleed -5dB -> gay an toan": duong moi nghe tung kenh rieng nen
     khong con khai niem "chenh lech" -> chot cu khong ap dung. Can chot khac
     (vd: ty le CHONG LAN khoang noi giua cac kenh).
   - `stress` ca 5 "mic-lech (bleed-20)": 1/10 luot.
   Giu nao ban moi la CO Y: tren liue nay ban cu chi ra **1 nhat cat** (100% mot
   cam), ban moi ra 299 nhat can doi.
3. 9 sequence "Podcast Cut" hong anh Tien da tu xoa (con 2 truoc khi chay lai).



Anh Tien: *"anh muon kiem tra va chot ha tool podcast nay"* -> chon muc
**"v0.6.1 va soat toan bo"**. Phien nay KHONG dung toi nguong cat (chua co bo
dap an tai anh), chi soat cau truc va sua cai gay hong.

### Bat dau bang do - va bon bo kiem cu deu "DAT" trong luc bon loi nam trong san pham

| Bo kiem | Ket qua truoc khi soat |
|---|---|
| kiem-nao | 16/16 DAT |
| kiem-sync | 9/9 DAT |
| kiem-khop | 32/32 DAT |
| stress 12 ca | DAT het, ca 60 phut 227/227 luot |
| Ban cai vs ma nguon | 5/5 file khop tung byte |
| Luat tai nguyen | 12/12 khop |

Tat ca mau xanh. Nhung KHONG bo nao cham toi `host/podcast.jsx` - va do dung
la cho bon loi dang nam.

☠️ Ghi lai mot cai bay do: `md5sum` cua Git Bash bao **5/5 file LECH** giua ma
nguon va ban cai. `diff -q` va `Get-FileHash` cua PowerShell deu noi GIONG
tung byte. Cong cu do sai, khong phai san pham sai (bai hoc 5).

### Bon loi soat ra

**A. `pc_sapXepClipsLenTrack` XOA SACH TIMELINE ROI MOI DI TIM ITEM.**
Ham xoa het clip tren moi track video + audio, sau do moi goi `pc__item()`
cho tung duong dan. Tim truot cai nao thi chi `soLoi++` roi `continue` - clip
do BAY LUON khoi timeline that cua nguoi dung, khong tu hoan tac duoc.
Sua: quet kho TRUOC, thieu mot item la tra `ERR:THIEU_ITEM` va khong dung toi
timeline mot dong nao.

**B. PANEL BO QUA GIA TRI HOST TRA VE.** `buocXep.then(function () {...})` -
khong doc tham so, khong kiem `OK:`. Nen xep track that bai xong panel van
chay tiep va bao "da khop N nguoi". Dung bai hoc 5l: khong bao loi khong co
nghia la da ghi. Sua: doc ma loi + `soLoi`, hong thi hien khung loi to, kem
cau bao dung dan (`khop_thieu_item` / `khop_xep_loi`, ca VI lan EN).

**C. `pc__item` KHOP BANG CHUOI CON HAI CHIEU, LAY UNG VIEN GAP DAU TIEN.**
`chuan.indexOf(p) >= 0 || p.indexOf(chuan) >= 0` - item ten "A.wav" an khop
vao ".../mic_data.wav" (vi "data.wav" chua "a.wav") va thang chi vi no nam
truoc trong bin. Dung bai hoc 5i: khop bang mot dau hieu yeu thi bat nham.
Sua: cham diem 4 (duong dan tuyet doi) / 3 (ten file tuyet doi) / 2 (ten item)
/ 1 (chuoi con - phuong an cuoi), duyet HET bin roi lay cao nhat.
Day la ham DUNG CHUNG cua 6 ham khac (bai hoc 5n) nen co y KHONG siet chat -
chi doi tu "gap dau tien" sang "khop nhat", ca dang chay dung van chay dung.

**D. VONG LAP VO HAN.** `tuKhop()` thieu mic -> `tuTimVaSyncMicProject()` ->
callback tra `true` chi can Project Bin co >=1 file mic (khong kiem da du 2
mic chua) -> goi lai `tuKhop()` -> van thieu -> lap mai, **moi vong ghi de
timeline**. Nang hon: neu chua ai duoc gan mic thi `lenh` rong, `pc_datTieng`
khong dat gi, van `cb(true)` - lap vo han ma khong lam gi ca.
Sua: them tham so `daThuPhucHoi`, chi duoc thu phuc hoi DUNG MOT LAN.

### Bo kiem moi `tests/kiem-host.mjs` - 22 phep, dung `app` Premiere gia

Viet de bit dung lo hong tren: chay `host/podcast.jsx` ngoai Premiere bang
mot `app` gia (rootItem/children/getMediaPath/overwriteClip/clips.remove).

**Va da do chinh cai thuoc**: chay bo kiem moi nguoc len ban v0.6.0 dang cai
tren may anh Tien:

| Phep kiem | v0.6.0 (dang cai) | v0.6.1 |
|---|---|---|
| "A.wav" an mat "mic_data.wav" | **TRUOT** - tra ve A.wav | DAT |
| Thieu 1 file -> track video 3 clip | **con 0 clip - MAT SACH** | con nguyen 3 |
| Thieu 1 file -> track audio 2 clip | **con 0 clip - MAT SACH** | con nguyen 2 |
| Host bao gi khi truot | `OK:daDat=1\|soLoi=1` | `ERR:THIEU_ITEM\|so=1\|ds=...` |
| Doi sequence giua chung | - | `ERR:SEQ_DOI`, khong xoa gi |
| Panel kiem host version | v0.4.1 vs cho v0.4.2 | khop |
|  | **16 dat / 6 truot** | **22 dat / 0 truot** |

=> Ban anh dang co tren may: bam Auto Match luc mot file media offline la
XOA TRANG timeline. Do duoc, khong phai suy doan.

Da them `kiem-host.mjs` vao cong gac trong `sign-install.ps1` (nay 5 bo kiem
chan truoc khi cai).

### Do tren PREMIERE THAT sau khi cai

- Host nap trong Premiere: `pc_phienBan()` = **v0.4.2** (khop cho panel kiem -
  khong dinh bay "panel moi noi chuyen host cu").
- Panel v0.6.1 reload sach: 3 nut `Auto Match` / `Auto Sync` / `Auto Podcast`,
  `AiOKhop` nap duoc, hai cau i18n moi co mat, khong loi JS.
- Chot chong lap SONG trong ban dang chay: `tuKhop.length` = **1**,
  `/daThuPhucHoi/` = true, `/tuKhop\(true\)/` = true, `/THIEU_ITEM/` = true.
- Duong thoat som tren Premiere that: goi `pc_sapXepClipsLenTrack` voi ten
  sequence sai -> tra dung `ERR:SEQ_DOI|`, timeline khong bi dung toi.
- Sequence "Will" cua anh sau tat ca phep do: **con nguyen clip** (V0 C4091,
  V1 C4236, dai 7066s).

☠️ **CO Y KHONG DO ca "thieu file" tren Premiere that.** Neu ban sua sai thi
phep do do se xoa trang timeline that cua anh Tien (bai hoc 3b: thu tinh nang
PHA HOAI thi thu tren ban sao). Ca do moi chi chung minh bang stub trong
`kiem-host.mjs`; muon do that thi phai dung mot project rac rieng.

### Con nguyen chua dung toi

Loi so 1 (nhat cat sai nguoi tren lieu that) **khong dong duoc trong phien
nay** - no can bo dap an tu tai anh Tien, chua co thi moi con so deu la thuoc
lam bang cung vat lieu voi cai no do (bai hoc 5d).

## [tu-khop] - 2026-08-05 09:50 - v0.6.0: NUT "TU KHOP CAM <-> MIC" (auto match)

Anh Tien (kem anh chup panel, khoanh do nut "Add mics from files"): *"em xem
va them cho anh mot tinh nang auto match duoc khong em - anh se keo toan bo
source clip vao sequence bam mot nut auto match, em co the thay the nut do
bang nut add mics nha em"*.

### ☠️ DO TRUOC KHI XAY - VA PHEP DO GIET Y TUONG CHINH

Y tuong dau tien (nghe rat hop ly): ghep cam voi mic bang TIENG CAM - cam cua
nguoi nao thi line-in/mic gan may nghe nguoi do ro nhat, tuong quan cheo se
chi ra dung cap. Truoc khi viet dong UI nao, tach audio 6 cam + 4 mic that cua
anh Tien (G:\Quay PV ... _DRT_0902, 2 buoi, moi file 17GB, ffmpeg -vn 24-28s/file)
roi do. Dap an lay tu ten file anh tu dat.

| Ca | r voi mic nguoi A | r voi mic nguoi B | Ket |
|---|---|---|---|
| B1 Cam2_Thien | 0,578 (dung) | 0,635 | **SAI** |
| B1 Cam3_Trong | 0,533 | 0,578 (dung) | dung |
| B2 Cam2_Trong | 0,713 | 0,696 (dung) | **SAI** |
| B2 Cam3_Dilys | 0,691 (dung) | 0,712 | **SAI** |

**3 SAI / 4 CA.** Ly do: moi cam deu thu chung MOT can phong nen moi cap deu
tuong quan cao (r 0,53-0,74); bien do giua cap nhat va cap nhi chi 0,017-0,056
= nhieu, khong phai tin hieu. Cap "thang" gan nhu luon la mic cua NGUOI NOI
NHIEU NHAT (anh Trong dan, thang 3/4 ca) - khong lien quan gi toi cam do quay
ai. Neu tin y tuong nay ma xay tiep thi da giao cho anh mot nut "auto" chinh
xac ngang tung dong xu.

=> Bo hoan toan huong do. Da ghi CAM + so do vao dau `dist/khop.js` de phien
sau khong thu lai (luat 5q: so tay chi co gia tri neu duoc mo ra dung luc).

### Lam bang hai thu DANG TIN
- **CAU TRUC** - track tieng co media TRUNG DUONG DAN voi track hinh thi chac
  chan la tieng di kem cam -> tu dat "Khong dung". Dung 100%, khong suy doan.
- **TEN FILE** - khop token co trong so nghich dao do pho bien (IDF):
  trong so = (chu >=3 ky tu: 3 | con lai: 1) / (so cam chua no x so mic chua no).
  Token hiem ("thien", "dilys", "a") an diem; token ai cung co ("cam", "mic",
  "buoi", "1") tu roi ve gan 0. **KHONG co danh sach tu-vai-tro loai cung** -
  "Cam" la ten nguoi that (Cam), loai cung chu "cam" la bat nham luon nguoi ta.
  Ten khong noi gi -> tra 'thu-tu' va NOI THANG la DOAN.
- Cam CHUNG nhan bang tu khoa ten (toancanh/wide/master/2shot...).
- Ten nguoi lay tu token chung, GIU NGUYEN DAU ("Thien" -> "Thiện") nho
  boDau anh xa 1 ky tu -> 1 ky tu nen cat token tren ban bo dau roi lay dung
  khuc do o ban goc.

### File
- **MOI `dist/khop.js`** (thuan, ~300 dong) + **`tests/kiem-khop.mjs`** (28 phep
  kiem, tat dinh, lieu lay TEN THAT tren o cua anh - khong bia mau cho de dau).
  Da cam vao cong cai `sign-install.ps1`.
- `dist/index.html` v0.6.0: nut `nutKhop` thay cho `nutSync` o chan the.
  **Nut tu sync KHONG mat** - an di, tu hien lai khi DO RA la can: sequence
  chua du 2 mic rieng, hoac mic dang dan dung dau clip cam.
- `tuDongGoiYGan` (chay ngam khi mo sequence la) nay dung chung engine moi -
  truoc do no ghep V/A theo thu tu va dat ten nguoi = ca ten file mic.

### 3 BUG BAT DUOC BANG DO TREN PANEL THAT (khong phai doc code)
1. Ten nguoi ra **"0001"/"0002"** voi file ZOOM0001.WAV (token rieng chi con
   so). Sua: duong du phong chi nhan token MANH, con lai de rong cho panel
   danh "Nguoi 1".
2. Bam truot nhung nut **van xanh "Da khop 2 nguoi"** cua lan truoc (duong
   thoat som khong xoa trang thai). Sua: xoa data-state ngay dau ham.
3. Chu canh bao cam thua noi "chua cat duoc" - **sai su that**, cat van chay.
   Sua: "chua gan ai - ban cat se khong dung toi cam nay".

### Kiem chung (so do, khong phai cam nhan)
- `node tests/kiem-khop.mjs` **28/28**; kiem-nao 16/16, kiem-sync 9/9,
  stress 12/12 van dat (cong cai chay het truoc khi ky).
- **Ban do gia lap 4 kich ban** tren panel that mo bang trinh duyet:
  lieu that buoi 2 (3 cam + 3 tieng cam + 2 mic) -> V1=Trong V2=Dilys
  V0="Trong, Dilys" (wide), A0-A2=Khong dung, A3=Dilys A4=Trong, nut Cat MO,
  khong khung canh bao, nut sync AN. Ten vo nghia -> "Nguoi 1/2" + canh bao
  DOAN. Chua co mic -> chan + hien nut sync. 3 cam 2 mic khong wide -> bao
  cam thua.
- **PANEL THAT trong Premiere 26.5** (cong 8094, sau khi reload): ver v0.6.0,
  bam nut that tren sequence "PodTest Nguon" -> `Matched 2 people`, nguoi
  A/B, V0=A V1=B, A0=Not used A1=A A2=B, nut Cat MO. 1 cu bam, 0 thao tac tay.

### 10:0x - ANH TIEN CHOT LAI 3 NHAN NUT
Nguyen van: *"3 button nay em lam ngan gon text lai cho anh nhe: 1. Auto Match
2. Auto Sync 3. Auto Podcast"*. Da doi, **giu nguyen o CA HAI ngon ngu** (VI va
EN cung mot chu - doc thanh mot ho). Sua kem: cau canh bao "mic dan dau cam"
truoc do goi ten nut cu, nay noi 'bam "Auto Sync"'.
Anh chon dang TEN THUONG HIEU chu khong phai mo ta viec (khac luat "nhan nut
la VIEC no lam") - day la quyet dinh cua anh, dung tu sua lai.
Do lai tren PANEL THAT sau khi cai + reload: `Auto Match` 91px · `Auto Sync`
84px · `Auto Podcast` 169px, cao 28/34px = KHONG xuong dong (nhan cu
"Auto match cams <-> mics" bi wrap 2 dong tren anh chup cua anh), khong tran
ra ngoai chan the (-4px).

### Chua lam / con no
- CHUA bam Cat sau khi tu khop tren panel that (khong muon tu y tao them
  sequence + tu luu project khi anh dang mo may) - `catDuoc=true` moi chung
  minh cong kiem da qua, chua chung minh ban cat dung.
- Cam CHUNG chi nhan ra bang TU KHOA TEN. Cam wide dat ten kieu "C4025" thi
  khong nhan ra -> se roi vao "cam thua", panel co bao.
- Khop bang ten nghia la **phu thuoc ky luat dat ten cua nguoi dung**. Ban
  ban ra nuoc ngoai nen co man hinh day dat ten (Cam_<ten> / Mic_<ten>).

## [ui-studio-console] - 2026-08-04 23:44 - v0.5.0: GIAO DIEN MOI THEO THIET KE ANH TIEN + CAI DAT CAT

Anh Tien chot thiet ke "Studio Console" (AiO Design System/AiO Auto
Podcast/AiO Auto Podcast.html, ban 12:36 04/08) va dan "co mot so cho anh
bi thieu em hay them neu can". Da doc LESSONS.md truoc khi lam (luat UI).

### Thay doi (dist/index.html viet lai toan bo ~1400 dong; ENGINE giu nguyen)
- Skin + layout theo thiet ke: topbar (brand/ver/host/EN/cai dat) · card
  "Ban do track" · combobox sequence tu ve · hang track kieu moi · monitor
  gia lap + DAI NHAT CAT + chu giai mau · nut chinh co thanh tien do %,
  trang thai run/done (xanh la khi xong) · font Inter (dist/fonts).
- MO HINH GAN MOI theo thiet ke: NGUOI MOC TU TEN GO vao track cam (khong
  bay san "Nguoi 1/2"), cam chung = go 2 ten ngan cach phay, mic tu an
  theo cap V/A cung so (tru khi da chot tay). Khong chan so nguoi (den 8+).
  Luu gan khuon moi 'aio-pc-gan2' theo ten sequence.
- HOP "CAI DAT CAT" — moi cai deu AN THAT vao engine:
  cat som lead (lui ranh, chua toi thieu 0,3s cho doan truoc) · o mot cam
  ngan nhat = luotToiThieu cua nao · o mot cam LAU NHAT = qua nguong thi
  chen wide 4s (can cam chung) · nguong chenh auto/6/9 dB = nguongChenh ·
  tieng theo nguoi / giu nguyen moi mic (di tru tu 'aio-pc-tienglien' cu).
- TU LUU PROJECT truoc khi ghi (loi hua in trong hop cai dat — bai hoc
  bay sach buoi chieu 04/08).
- THEM ngoai thiet ke (anh dan thieu thi them): nut tu sync (v0.4.0) ·
  khung bao loi to co tieu de · canh bao mic dinh dau cam · dong chia
  thoi luong tung nguoi duoi monitor.
- BO: nut them/bot track cua thiet ke (API Premiere khong cho panel them
  track — cong tac vo nghia, bai hoc so tay #11) · man huong dan lan dau
  + minh hoa cu (thiet ke thay bang empty state).

### HAI BUG E2E BAT DUOC — deu sua bang phep do co lap
1. ☠️ `app.project.save()` KEO activeSequence ve tab timeline dang mo
   truoc mat nguoi dung -> pc_nhanBan gay SEQ_DOI. Hai lan lien tiep moi
   nghi code minh (dau tien tuong anh doi tab that). Do co lap 1 lenh:
   dat active roi save -> active nhay ve tab cu. Sua: sau save GHIM LAI
   nguon bang pc_chonSeq roi moi dung.
2. Ket qua hien dung 1 giay roi bien: dung xong active = ban cat -> soi
   doi seqDangNhin -> docThongTinSeq xoa KE_HOACH/kqChia/done-state. Sua:
   nho `tenVuaCat`, panel nhin sang chinh ban vua cat thi GIU ket qua.
   Kem: tuDongGoiYGan chi goi y khi track dung 1 clip (khong bia ten vao
   sequence ket qua).

### Kiem chung
- node --check 0 loi (3 lan cai) · gac cong kiem-nao 16/16 + kiem-sync
  9/9 + stress 12/12 moi lan cai.
- Browser pane: dock hep render dung (monitor len tren, empty states).
- Panel that: ban do tu goi y ten tu file mic ("Mic_Trong_Buoi1"...), ne
  tieng cam, ghep cap V1-A1; nut tu KHOA kem ly do that tren 2 sequence
  PV_* cua anh (mic dang 2 clip/track — dung luat MVP).
- E2E cat "PodTest Nguon" qua UI moi: 10 doan hinh, dai cat hien 10 seg
  va DUNG LAI sau 10s, chia "micA 0:40 · micB 0:49" KHOP dap an chuan cu,
  nut ve "Cat lai", 0 loi. Che do tieng 'giu' chay dung nho di tru.

### Con cho
- Anh bam tay tren UI moi (dialog chon file tu sync van chua qua tay that).
- 2 sequence PV_Buoi1/Buoi2: mic 2 clip/track -> don ve 1 clip lien la nut
  tu mo (panel da tu noi ly do ngay tren nut).

## [mau-theo-nguoi] - 2026-08-04 22:47 - v0.4.1: TO MAU NHAN THEO NGUOI SAU MOI LAN CAT

Anh Tien (kem anh chup ban cat buoi 1 anh TU DUNG): "track audio va video
bi deu mau nhau anh nhin vao khong biet duoc ai het — em co the doi mau
theo track giua video va audio duoc khong". Dung nguyen tac anh chot tu
28/07: "nhin MAU la biet, khoi doc so".

### Thay doi
- **Host v0.4.1**: them `pc_toMau(dsStr)` — to NHAN MAU (label 0-15) cho
  projectItem theo duong dan. To o muc PROJECT ITEM nen moi clip cat ra tu
  file do, o MOI sequence, deu mang mau nguoi do — 194 nhat cat chi ton
  3 cu goi. Do truoc khi viet: `setColorLabel/getColorLabel` CO THAT tren
  Premiere Beta 26.5 (typeof = function), skill khong ghi cam (luat 5q).
- **Panel**: sau khi do lai ket qua cat, goi to mau: cam + mic cua CUNG
  NGUOI cung mau, khop bang MAU_NGUOI cua panel — nhan [4,8,10,15,6,12]
  (Cerulean/Purple/Teal/Yellow/Rose/Tan), cam chung = 14 (nau). Khong to
  duoc thi noi mot dong (nguoi dung dang mong mau, im lang tuong hong).
- Nang kiem phien ban host o panel: 2 cho 'v0.3.1' -> 'v0.4.1'.

### Kiem chung
- node --check: panel + host (copy .jsx -> .js) = 0 loi. Gac cong cai
  kiem-nao 16/16 + kiem-sync 9/9 + stress 12/12.
- E2E tren PANEL THAT: cat "PV_Buoi1_Thien_va_Trong" (buoi 1 anh TU sync,
  3 cam + 2 mic + CAM CHUNG) 16 giay -> 194 luot (Nguoi1 70 / Nguoi2 84 /
  wide 40 · 4:12), khong loi. Doc nguoc getColorLabel tren ban cat:
  V1 C4087=4 + A1 mic Trong=4 · V2 C4233=8 + A2 mic Thien=8 · V3 C4025=14
  — TUNG CAP CUNG MAU dung thiet ke.
- Ghi chu that: cu bam E2E roi vao sequence buoi 1 dang active cua anh
  (sequence "AiO Sync" da bi xoa tay truoc do) -> sinh them ban
  "...Podcast Cut (2)". Vo hai (ban goc nguyen) nhung la nhac nho: script
  dieu khien phai KIEM sequence active truoc khi bam ho.
- Quan sat dang gia: anh Tien da TU CHU tron quy trinh — tu sync buoi 1
  (Thien+Trong), tu gan ca cam chung, ban cat 194 luot chay ngon.

## [tu-sync] - 2026-08-04 22:29 - v0.4.0 "THEM MIC TU FILE — TU SYNC": GIAI TRIET DE BAI TOAN DAU VAO

Anh Tien duyet phuong an toi uu ("em lam truoc di em roi minh test sau").
Goc cua moi loi hom nay (sequence chi tieng cam · mic dan dau clip cam ·
chip trong) la MOT: tool can dau vao chuan ma bat nguoi tu chuan bi.
v0.4.0 dua phan chuan bi vao trong tool.

### Thay doi
1. **`dist/sync.js` MOI** — module THUAN nhu nao.js: tuong quan cheo duong
   bao dB (quet tho 0,2s ±20 phut -> tinh chinh 20ms). Chot tin cay bang
   HAI NUA DOC LAP cua file phai cung chi mot moc (lech <= 0,6s) — KHONG
   dung nguong r tuyet doi (bai hoc: r=0,13-0,17 van la moc DUNG, nguong
   r>=0,25 tung loai nham cap dung). `viTriDat` doi offset ra (vi tri,
   cat dau). `p50` chon cam moc, loai cam cam.
2. **`tests/kiem-sync.mjs` MOI** — 9 phep kiem co seed: tim lai offset
   duong/am/0/1,168s (±1 cua so), tu choi 2 nguon khong lien quan, toan
   dat/cat dau (kem ca that 04/08), p50 loai cam chet. Gan vao cong
   sign-install (kiem-nao + kiem-sync + stress).
3. **Panel** (`dist/index.html`):
   - Nut phu "Them mic tu file — tu sync" duoi ban do track. Chon 2-6 file
     -> tach WAV 16k (cache mtime) -> chon cam moc theo p50 (>-65) -> do
     offset tung mic (tu choi neu 2 nua khong khop) -> tach mono chat luong
     goc (.aio-mono.wav canh file goc, khong spill stereo) -> HOST dung
     sequence "AiO Sync" bang TOAN HAM CO SAN (pc_nhanBan + pc_datHinh dat
     lai hinh y vi tri nguoi dung + pc_donTieng + pc_datTieng voi setInPoint
     cat dau + pc_doKetQua) — KHONG sua host, khong bay "panel moi host cu".
   - TU GOI Y GAN theo thu tu track khi sequence CHUA TUNG GAP (het keo le
     gan cu cua seq truoc — chi so track cu tren timeline moi la gan bay).
     Cam giac "mot nut" nhu AutoPod cho ca chuan.
   - CANH BAO (khong chan) "mic dan dinh dau clip cam" — bay 21:43.
4. `scripts/sign-install.ps1`: them cong kiem-sync + doi sync.js phai co.

### Kiem chung bang so
- kiem-sync 9/9 DAT (seed).
- **Lieu that + thuoc ngoai:** sync.js do offset mic vs C4089 ra 1,180s
  (Trong) va 1,160s (Dilys) — PluralEyes noi 1,1678 -> lech **0,29 / 0,19
  frame**, hai nua khop 0,000s, moi phep do 200ms.
- Cu phap: tach script inline ra `node --check` = 0 loi TRUOC khi cai.
- Gac cong cai: kiem-nao 16/16 + kiem-sync 9/9 + stress 12/12.
- **E2E tren panel that** (dialog stub bang 2 duong dan that, moi buoc sau
  do la duong that): nguon AiO-Sequence-TuDong -> tuSync 48 giay -> ra
  sequence "AiO Sync": V1 C4089@1,1678 · V2 C4234@1,5432 (giu nguyen vi
  tri nguon) · A1 Mic-Dilys@0 · A2 Mic-Trong@0 (lech tinh toan 8-12ms,
  duoi 1 frame) -> ban do TU DIEN dung cap (V1=Nguoi1=Dilys) -> canh bao
  an -> bam Cat 32 giay -> **"AiO Sync - Podcast Cut": 103 luot, 51/52,
  27:32/16:41 — khop TUNG SO ban chuan**. Khong mot thao tac dat clip tay.

### Gioi han noi ro
- Cap nguoi<->mic la THEO THU TU CHON FILE (file 1 = Nguoi 1 = V1...).
  May khong biet mat ai tren cam nao — nguoi dung liec lai truoc khi cat.
- Dialog chon file chua qua tay nguoi dung (E2E stub) — anh Tien bam that
  se la phep thu cuoi.
- "test thuc te" cua anh hien co 2-3 clip/track (anh dang thu tay) — tu
  sync doi track HINH dung 1 clip lien; seq do can don lai truoc khi dung.

## [mic-lech-moc] - 2026-08-04 21:43 - BAY MOI: MIC DAN VAO DAU CLIP CAM -> 193 LUOT AO; SUA XONG VE DUNG 103

Toi nay co sequence moi "AiO-Sequence-TuDong" (2 cam + 2 mic mp3 DA nam
trong sequence — dung huong em de nghi) va mot ban "- Podcast Cut" 193
luot. Anh Tien gui giai thich cua Gemini (noi dung khop chan doan cua em,
so 193 khop so that). Nhung do vi tri thi lo BAY MOI:

### Bay: mic DAN VAO DAU CLIP CAM cua nguoi do
- Mic-Dilys dat tai 0 (= dau clip C4089) · Mic-Trong dat tai 0,375s
  (= dau clip C4234). Nhin rat hop ly — "mic cua ai dan vao cam nguoi do".
- SAI vi: dau file cam va dau file mic KHONG phai cung mot khoanh khac
  (do la viec cua sync). Hai file mic thu CUNG MAY, bam CUNG LUC — phai
  nam CUNG MOT MOC. Do thuc te: mic phai bat dau 1,168s TRUOC C4089.
- Hau qua do duoc: tieng tre so voi hinh 1,17-1,54s (lech moi nghe ro),
  va HAI MIC LECH NHAU 0,375s lam nao so sai quanh moi luot chuyen ->
  nhat cat doi tu 103 len 193. So 193 "dep" ma sai (bai hoc 5c).

### Sua (chi dung AiO-Sequence-TuDong — "test thuc te" cua anh van nguyen)
Dat lai 4 clip, GIU sync 9-frame va cach gan cua anh (gan cua anh DUNG:
V1+A1 = Dilys, V2+A2 = Trong, khop frame da soi mat):
- V1 C4089 @ frame 28 (1,1678s) · V2 C4234 @ frame 37 (1,5432s — dung
  9 frame chenh nhu ban sync cua anh)
- A1 Mic-Dilys @ 0 · A2 Mic-Trong @ 0 (cung moc)

### Kiem chung: chay lai tren panel (toggle tieng lien ON)
- 24 giay -> "AiO-Sequence-TuDong - Podcast Cut (2)": **103 luot** —
  V1=51 clip 1655,0s · V2=52 clip 1003,8s · 0 ho · 0 cap canh cung track
  · A1/A2 moi track 1 clip lien 1,543->2655,027s.
- Khop TUNG SO voi ban chuan da kiem 15:44 (103 luot, 51/52, chia 62/38).
- Ban "Podcast Cut" cu (193 luot, tu mic lech) la RAC — can anh xoa tay
  (panel khong xoa duoc sequence).

### Rut ra cho san pham
Nguoi dung tu dat mic SE dan vao dau clip cam — tu nhien nhat ma sai.
-> Cung co them ly do lam nut TU SYNC (Level 3). Truoc mat co the them
canh bao re: 2 track mic duoc gan ma start LECH NHAU thi bao ngay (mic
cung may thu thi phai cung moc) — ghi vao TINH-NANG lam sau.

## [bao-loi-ro] - 2026-08-04 16:11 - ANH TEST "CAN BAN NHAT" KET: BAO LOI PHAI CHI DICH DANH (v0.3.6)

Anh Tien tu sync "test thuc te" bang Premiere Synchronize roi bam — khung
vang "Moi nguoi can dung mot track hinh va mot track tieng" hien ra, anh
ket luan "tool nay that su co van de, test dang can ban nhat cung bi loi".
Anh cung dan: "em khong them hay thay doi bat ki thu gi ben trong sequence
nay cua anh" — tu day moi thao tac chi o PANEL va tai lieu, KHONG dung
sequence, KHONG save project.

### Do duoc gi (read-only)
- Project da bi MO LAI KHONG LUU: chi con 2 sequence, mic em dat 15:44 +
  cac ban Cut + item Mic-*.mp3 BAY SACH. Loi cua em: thay mic xong khong
  nhac save/khong save — viec "da xong" bay hoi khong dau vet.
- Khung vang lan nay la loi GAN: co chip "Nguoi 3" trong (anh bam Them
  nguoi luc nao do) — cau bao chung chung khong noi AI thieu GI.
- Sync cua anh: C4234 sau C4089 dung 9 frame (0,3754s); PluralEyes noi 10
  frame. Lech 1 frame = trong dung sai. SYNC CUA ANH OK — van de la
  sequence KHONG CO MIC (A1/A2 = tieng nhung cua cam, C4234 cam -75,6 dB).

### Sua (v0.3.6 — chi panel, khong dung host)
1. `soatGan` chi DICH DANH: "{ten} chua co {track hinh|track tieng|ca hai}
   — gan cho du, hoac bam x tren chip {ten} de bot nguoi."
2. Loi TRUOC-KHI-CHAY (gan thieu, thieu ffmpeg) doi tieu de khung thanh
   "CHUA CHAY — GAN CHUA DU" (hien() them tham so tieudeKey). Truoc do
   moi loi deu doi mu "TOOL DA CHAY" — sai su that voi loi gan.
3. `mot_luot` day them mot cau day nguoi dung: track tieng dang ghi chu
   "tieng cua cam" thi tool can FILE MIC RIENG nam trong sequence.

### Kiem chung
- Gac cong cai: kiem-nao 16/16 + stress 12/12. Cai + reload panel qua CDP.
- DOM sau reload: 2 chip (Nguoi 3 tu bien — la trang thai tam chua luu),
  gan du 4 track, toggle tieng-lien van ON.

### Dang cho anh Tien chot
Sequence cua anh khong co mic thi tool KHONG THE nghe ai noi (khong phai
loi thuat toan — thieu dau vao). Hai duong, cho anh chon: (a) em dat 2 mic
vao BAN SAO sequence (ban goc khong dung), (b) anh tu Synchronize lai co
kem 2 file mic. File mic ten ASCII nam san o
`file pr for test\podcast-buoi2\Mic-Trong.mp3 / Mic-Dilys.mp3`.

## [tieng-lien] - 2026-08-04 15:51 - TUY CHON "GIU TIENG LIEN MACH" (v0.3.5)

Anh Tien thay step "Dang thay tieng cam bang tieng mic..." va hoi: "anh
khong muon su dung step nay de anh nghe thu duoc khong em". Day la nhu cau
that cua editor: nghe HOI THOAI LIEN MACH (ca tieng dem "u", cuoi... cua
nguoi nghe) de cham nhat cat, thay vi tieng bi bam vun theo nguoi.

### Thay doi (dist/index.html, panel v0.3.5 — host KHONG doi, khoi restart)
- Checkbox "Giu tieng lien mach — chi cat hinh, tieng mic de nguyen" ngay
  tren nut Dung. Song ngu VI/EN. Nho qua localStorage (aio-pc-tienglien).
- Logic: bat thi `viecTieng` = MOT manh nguyen ven moi nguoi phu tron
  [tu0..den0] thay vi manh-theo-doan. Duong dat tieng (pc_datTieng), don
  tieng cam (pc_donTieng), chot DO LAI — tat ca giu nguyen vi viecTieng
  van la danh sach manh nhu cu, chi it manh hon. KHONG dung toi host.

### Kiem chung bang so
- Gac cong cai: kiem-nao 16/16 + stress 12/12 (script sign-install tu chay).
- Reload panel qua CDP (manifest khong doi nen khong can tat Premiere).
- Chay THAT tren "test thuc te" voi toggle BAT: 32 giay, ra
  "test thuc te - Podcast Cut (2)":
  V1 = 51 clip C4089 · V2 = 52 clip C4234 (dung nhu ban cat thuong)
  A1 = **1 clip** Mic-Dilys 1,585->2655,027s · A2 = **1 clip** Mic-Trong
  1,585->2655,027s — tieng lien mach dung thiet ke, khong tieng cam sot.
- Ban cat thuong truoc do ("test thuc te - Podcast Cut", 15:44) van nguyen
  de doi chieu: cung 103 doan hinh, tieng bam theo nguoi.

## [thay-mic-chay-lai] - 2026-08-04 15:44 - THAY MIC THAT VAO "test thuc te" -> TOOL DUNG 103 LUOT / 24 GIAY

Anh Tien: "em thay mic that vao roi chay lai giup anh". Khong sua code —
chi sua DU LIEU sequence roi chay tool qua dung duong nut bam.

### Da lam (moi buoc co so do)
1. Chup frame giua tap tu 2 cam de gan mic dung nguoi (thuoc ngoai bang
   MAT): C4234 = nam vest = Trong · C4089 = nu ao Dream Talent = Dilys.
   Khop voi cach gan cua ban Cut (4) truoc do.
2. Ghi trang thai goc "test thuc te" TRUOC khi dung (bai hoc 3b):
   V1 C4089@0 · V2 C4234@0,417s (offset tuong doi giua 2 cam DUNG san) ·
   A1/A2 = tieng nhung cua cam, in=0 het.
3. Go 4 clip cu, dat lai theo he moc PluralEyes da kiem chung: C4089 @
   frame 28 · C4234 @ frame 38 · Mic-Dilys A1 @ 0 · Mic-Trong A2 @ 0
   (overwriteClip + remove(false,false) — dung pattern host dang dung).
   ☠️ overwriteClip file stereo TRAI clip thua sang track ke (A3 lo 1 clip
   Mic-Trong) — phai don. Khong mat gi: L=R cua file mic (r=1,0000 da do).
4. Lam moi panel bang cach doi activeSequence sang seq khac roi quay lai
   (panel chi docThongTinSeq khi TEN seq doi — nhip soi 1s). Panel nho
   nguyen buoc gan cu (ganTheoSeq/localStorage) va TU khop voi vi tri moi:
   Nguoi 1 = V1+A1 (Dilys) · Nguoi 2 = V2+A2 (Trong).
5. Bam nut qua CDP, cho theo moc NUT HIEN LAI (bai hoc 5f): xong sau
   **24 giay** (WAV cache con tu lan truoc, cat 103 doan theo lo).

### So do ban dung "test thuc te - Podcast Cut"
- V1 = 51 clip C4089 (Dilys) 1655,0s · A1 = 51 clip Mic-Dilys 1655,2s
- V2 = 52 clip C4234 (Trong) 1003,5s · A2 = 52 clip Mic-Trong 1003,4s
  -> hinh-tieng KHOP TUNG CAP (lech 0,1-0,2s = duoi dem chong hut khung).
- 103 doan xen ke hoan hao (0 cap canh nhau cung track), ho = 0, phu tu
  1,585s den 2655,0s. 89 cho chong <=0,08s = duoi dem da ghi trong CLAUDE.
- Chia 62/38 (Dilys/Trong) — khop ban Cut (4) va khop nao chay offline.
- Panel bao: "103 luot · Nguoi 1 51 luot 27:32 · Nguoi 2 52 luot 16:41".

### Con cho tai anh Tien
Thuoc cuoi la TAI: mo "test thuc te - Podcast Cut" nghe 1 phut dau —
cam co nhay dung nguoi dang noi khong, mic co dung nguoi khong (nhan
Trong/Dilys tren file mic la gia dinh, chua ai kiem bang tai).

## [do-tieng-cam] - 2026-08-04 15:33 - DINH LUONG vi sao "test thuc te" bi chan: tieng cam C4234 CAM THAT

Anh Tien bao "tool khong chay" kem anh chup — chinh la khung canh bao
v0.3.4 dang lam viec. Do them de dong ho so nguyen nhan (khong sua code):

- Doc duong dan that tu sequence "test thuc te" (qua CDP, do theo CHI SO
  sequence vi ten tieng Viet meo qua PowerShell): A1 -> Video\Cam 3\
  C4089.MP4, A2 -> Video\Cam 2\C4234.MP4 — ca hai la TIENG NHUNG CUA CAM,
  khong phai mic roi.
- Do envelope 20ms hai duong tieng cam (da can offset PluralEyes 0,417s):
  C4089 p50 = -39,7 dB (thu binh thuong) · C4234 p50 = **-75,6 dB, p90
  -59,9** = gan nhu cam hoan toan (line-in chet, khop chan doan 15:10).
- He qua: C4089 to hon >= 6 dB o **99,5%** cua so co tieng, C4234 thang
  0,0% -> nao thay MOT nguoi noi suot -> chot an toan chan. Khop TUNG SO
  voi dong panel in ra ("Nguoi 1 nghe ro 100.0% · Nguoi 2 nghe ro 0.0%").
- Doi chung tool DUNG DUOC khi tieng la mic that: cung project co san
  "PODCAST BUOI2 da sync - Podcast Cut (4)": V=52+51=103 nhat cat,
  A=Mic-Trong 1003,4s / Mic-Dilys 1655,2s — hinh tieng khop tung track.

Ket luan: khong co loi moi. "test thuc te" muon chay duoc thi tiec la
tieng phai la 2 file mic that (Mic-Trong.mp3 / Mic-Dilys.mp3, da co trong
project) — tieng cam khong cuu duoc voi lieu nay (C4234 cam, va 2 phep
thu line-in 15:1x cung da that bai).

## [that-bai-phai-to] - 2026-08-04 15:26 - "BAM MA KHONG THAY CHAY" = LOI HIEN THI (v0.3.4)

Anh Tien bam "Cat timeline theo nguoi noi" tren "test thuc te" va noi
"anh bam cat ma khong thay tool chay", so sanh voi tool khac "bam la
chay veo veo". Su that: tool CHAY (~10 giay, cache WAV con), dung DUNG
chot an toan "ca tap mot nguoi noi", va in mot dong chu xam nho — nguoi
dung tuong panel do. Loi HIEN THI, khong phai loi logic.

### DA SUA (v0.3.4)
- Khung canh bao noi bat: vien + vach cam canh trai, tieu de tu dong
  **"Tool da chay — dung lai vi"** (CSS ::before, hien qua ham hien()).
- Thong bao chot an toan kem SO DO tung nguoi: goi taNgheThay(thongKe)
  -> "Do duoc: Nguoi 1 nghe ro X% · Nguoi 2 nghe ro Y%".
- Sua loi chu 'mot_luot': noi ro HAU QUA (dung ra chi co mot canh) va
  nguyen nhan thuong gap (mot mic khong thu duoc tieng — day, gain).

### DO THAT tren "test thuc te" cua anh
Bam nut qua CDP: chay 10 giay, khung hien:
  "Nghe ca tap chi thay MOT nguoi noi nen khong dung...
   Do duoc: Nguoi 1 nghe ro 100.0% · Nguoi 2 nghe ro 0.0%."
**"Nguoi 2 nghe ro 0%" = line-in cam Trong cam** — khop chan doan 15:10.
Thong bao gio TU chi ra mic nao hong, khong can em ngoi do nua.

### Tra loi cau "tool khac bam la chay veo veo"
Chung cu dung bua — AutoPod bi che chinh vi the. Minh chon DUNG khi du
lieu khong du de dung dung, nhung tu nay dung phai TO va co so do.

## [sap-premiere] - 2026-08-04 15:18 - ☠️ SPIKE XUAT AUDIO LAM SAP PREMIERE - LOI CUA EM, GHI DE DOI SAU DUNG LAP LAI

Anh Tien muon tool NGHE DUOC nhung gi anh chinh trong sequence (gain,
effect). Huong dung dan: tool tu xuat tung track tieng qua bo xuat cua
Premiere roi nghe ban xuat. Em spike ngay tren Premiere DANG MO PROJECT
THAT cua anh — va lam SAP Premiere.

### Trinh tu su that
1. Probe API: exportAsMediaDirect/setMute/setInPoint/app.encoder DEU la
   function tren Beta 26.5. Tim thay preset WAV cua chinh Premiere.
2. `seq.exportAsMediaDirect(wav, epr, 1)`: tra **"Error: Unknown Error"
   NGAY LAP TUC** (0,0s) — thu ca preset cua Premiere lan frame.io.
   `seq.getExportFileExtension(epr)` tra **undefined voi MOI preset** =>
   duong xuat truc tiep cua Beta 26.5 HONG (API con do nhung chet ruot).
3. Thu duong 2: `app.encoder.launchEncoder()` + `encodeSequence(...)` +
   `startBatch()` => AME (Beta) MO LEN, va **Premiere SAP** (tien trinh
   bien mat, moi cong CDP tat, khong file nao duoc xuat).

### Thiet hai: KHONG MAT GI CUA ANH TIEN (may man, khong phai gioi)
File project luu luc **15:11** — marker cham loi (14:45) va gain anh tang
(~15:10) DEU NAM TRONG BAN LUU. Thu mat sau 15:11 chi la mute/in-out do
chinh spike cua em dat — mat lai hoa sach. AME mo thi tat tay la xong.

### ☠️☠️ SU THAT NANG NHAT: TAI NAN NAY DA DUOC GHI CAM TU 01/08
Mo skill `adobe-cep-panel` ra sau khi sap moi thay: muc "API xuat" da ghi
day du tu 01/08/2026, nguyen van:
- *"`Unknown Error` tuc thoi (0,0s) tu API render = tin hieu DUNG TAY,
  khong phai 'thu preset khac xem sao'"* — em gap dung loi do va van
  thu preset khac.
- *"`app.encoder.encodeSequence` CUNG LAM SAP Premiere Beta 26.5"* —
  em van goi tiep va Premiere sap dung nhu mo ta.
- *"KET LUAN CHO BETA 26.5: TOAN BO HO API XUAT TU SCRIPT
  (`exportAsMediaDirect`, `app.encoder.*`) = CAM."*

Em da lap lai TUNG BUOC cua tai nan da ghi — day chinh la dieu anh Tien
tung phan nan: *"moi lan em lam lai lap lai cac loi tu hoi xua den gio"*.
Nguyen nhan goc: truoc khi do mot ho API moi tren host, em da KHONG grep
skill xem no da duoc do chua.
**Luat co che tu nay: truoc khi cham BAT KY API host nao trong spike —
`grep <ten API> ~/.claude/skills/adobe-cep-panel/SKILL.md` TRUOC. Mat 5
giay, tranh duoc mot lan sap app cua nguoi dung.**

### Ket luan ky thuat cho tinh nang "nghe tu sequence"
- Duong TU DONG xuat qua Premiere/AME: **DONG** tren Beta 26.5.
- Duong thay the:
  (a) NGAY HOM NAY: anh Tien tu Export audio 2 track ra WAV sau khi
      chinh -> tool dung file do (mtime moi -> tu tach lai, khong dinh
      cache). On dinh 100% vi di qua UI chinh chu.
  (b) LAU DAI (se khao sat, CHI DOC nen khong co cua sap): doc gia tri
      gain/volume tung clip qua API roi ap vao phan tich trong tool.
- Nhac lai ky vong: tang gain DEU khong doi ket qua cat (nao so ti le,
  da do 15:10). Muc dich cua tinh nang nay la su DUNG NGHIA (tool nghe
  cai nguoi dung nghe), khong phai de sua loi so 1.

## [thu-linein] - 2026-08-04 15:10 - HAI PHEP THU: LINE-IN VA CHUAN HOA GAIN - CA HAI DEU KHONG CUU DUOC

Anh Tien cho biet: mic cam TRUC TIEP vao line audio cua cam ("video Trong
thi lay mic Trong luon"), nhan file mp3 dung nguoi, "chi co dieu hoi nho".
=> Thu ngay 2 gia thuyet tren cung 12 moc loi.

### PHEP THU 1: dung tieng LINE-IN cua cam lam mic
Tach audio C4234 (cam Trong) + C4089 (cam Dilys), 16k mono:

| Mic line-in | p10 / p50 / p90 (dBFS) |
|---|---|
| Trong (C4234) | -86,1 / **-75,5** / -59,9 — GAN NHU CAM |
| Dilys (C4089) | -46,7 / **-39,7** / -30,6 — rat khoe |

Lech gain **35 dB** giua hai duong thu. Nao so muc tuyet doi -> ra
"1 doan, Dilys 100%". **Line-in cua Trong buoi nay gan nhu khong thu
duoc gi** — duong nay CHET, khong phai do thuat toan.

### PHEP THU 2: CHUAN HOA theo tung mic (keo p90 moi mic ve -20 dB)
- Line-in chuan hoa: van Dilys 97% — keo gain len thi keo ca BLEED len,
  phan "tieng" trong mic Trong chu yeu la giong Dilys vong sang.
- **MP3 chuan hoa: TE HON han** (Trong 87%/Dilys 13%, 0/5 moc mat dung
  — ban tho la 35/60). Gain mp3 von da deu, chuan hoa chi lam meo.
=> **Chuan hoa gain KHONG phai phep mau.** Ghi lai de khoi thu lai lan
nua: da thu 04/08, so do ro rang.

### KET LUAN CUOI VE LOI SO 1 (giu nguyen chan doan 14:57, gio chac hon)
1. "Hoi nho" dung MOT PHAN (72% cua so mu -> doan nhieu).
2. Diem chet that: tai cac moc loi, giong Dilys nam trong MIC TRONG to
   hon trong mic cua CHINH CO AY (6:31: chenh nguoc 10 dB). Vi tri/do
   nhay mic luc thu — khong thuat toan so nang luong nao vuot qua duoc,
   da chung minh bang 2 phep thu o tren.
3. Line-in Trong cam — kiem tra duong tin hieu truoc buoi quay sau.

### VIEC CODE CON LAM DUOC (chua lam)
Nhom A (~2-3 moc): noi luat onset de doi hinh khi nghe ro nguoi kia noi
du tieng ro thua. Co 12 moc lam thuoc + 28 phep kiem cu lam chot hoi quy.

### CHO ANH TIEN QUYET
- Buoi quay sau: mic cai sat mieng hon / tach xa nhau / kiem tra line-in
  Trong; thu to hon (gain cao hon) cung giup giam vung mu.
- Co lam nhom A ngay khong, hay dung o chan doan.

## [dap-an-tai] - 2026-08-04 14:57 - MO 12 MARKER CUA ANH TIEN: TIM RA HAI THU PHAM CUA LOI SO 1

Anh Tien nghe ban dung "AiO-WIDE-TEST - Podcast Cut" va cham 12 marker
(hau het = "nguoi nu dang noi ma hinh nguoi nam"). Day la DAP AN TAI dau
tien. Anh cung hoi: "voice tu file goc khoang -36 den -54 dB, qua be co
phai ly do khong?"

### CACH MO
1. Doc 12 marker + tool dang chieu gi tai moc do (jsx qua panel).
2. Voi tung moc: dem cua so +-1,5s — Trong RO / Dilys RO / MU (nguong
   chenh 6dB, san tu do -54), p50 tung mic.
3. Soi MAT 5 moc dang ngo nhat: rut 6 khung hinh/cam quanh moc tu ca
   2 cam can (crop mat). **Ca 5/5 moc deu la DILYS dang noi** (mieng mo,
   tay vung; Trong ngam mieng) — khop loi anh ta.

### KET QUA — 12 moc chia 3 nhom
| Nhom | So moc | Bang chung dien hinh |
|---|---|---|
| **B. MIC SAI PHIA** — Dilys noi ma mic TRONG to hon chinh mic co ay | ~5 (6:01, 6:31, 8:41, 15:17, 19:06) | 6:31: mat thay Dilys noi, mic Trong p50 -52,7 dB vs mic Dilys **-62,6 dB** (nho hon 10 dB!) |
| **A. NAO NGHE DUNG MA KHONG DOI** — luat onset qua chat | ~2 (4:14, 5:49) | 4:14: Dilys ro 39 cua so vs Trong 1, van giu hinh Trong 2,3s — luat "phai day 15/25" chan cu doi hop le vi tieng ro bi bleed lam thua |
| **C. Vung mu / doi dap nhanh** | ~5 (3:11, 4:53, 8:31, 13:12) | 55-90% cua so mu quanh moc; 8:31 la WIDE dung luc khong ai noi (co the anh danh dau vi khong ung wide?) |

### TRA LOI CAU HOI "AUDIO QUA BE?"
**Mot nua dung.** Thu be (p50 ~-54, sat nen) lam 72% cua so mu -> nao
phai doan. NHUNG tang gain KHONG cuu duoc nhom B: gain tang ca hai mic
nhu nhau, ti le chenh giu nguyen. Nhom B la loi VI TRI/HUONG MIC luc
thu (hoac dan nhan file nguoc?) — giong Dilys vao mic Trong TO HON chinh
mic co ay thi moi thuat toan so nang luong deu thua.

### VIEC TIEP (chua lam trong phien nay)
1. Sua duoc bang code: noi luat onset (nhom A) — dung 12 moc lam thuoc,
   khong duoc pha cac cho khong bi danh dau.
2. Nhom B can anh Tien xac nhan: buoi do dat mic KIEU GI (cai ao hay
   boom dat ban?), va team co CHAC file "Mic-Trong"/"Mic-Dilys" dat ten
   dung nguoi khong. Neu mic boom dat giua thi day la gioi han vat ly
   cua so-nang-luong -> can huong thuat toan khac (khu bleed / tuong
   quan) hoac huong dan thu am.
3. Ca 8:31 goi y: co the can hoi anh co UNG cach ve wide khong.

## [v3-a3-khop] - 2026-08-04 12:28 - V/A KE CUNG MOT CHUYEN + BANG TRANG-THAI.md (v0.3.3)

### 1. Anh Tien: "V3 va A3 no dang khong khop voi nhau"
V3 = C4026 gan "Cam chung", nhung A3 (tieng DINH LIEN cua chinh cay cam
do) van bat gan cho mot "nguoi" — hai hang noi hai chuyen. Panel biet
duong dan media cua tung track nen phai TU NHAN RA quan he nay.

Da lam:
- `videoCungMedia(duongA)`: track tieng nao dung CUNG FILE voi track hinh
  -> hang tieng tu ghi chu xam "· tieng cua cam V1" / "· tieng cua cam
  chung". KHONG chan gan (co setup cam lav vao thang camera — tieng cam
  chinh la mic that), chi noi ro nguon goc.
- Gan mot track hinh lam CAM CHUNG -> tieng dinh lien cua no dang gan cho
  ai thi TU GO (ve "—"), vi cam chung khong thuoc ve ai.

Do that tren "test thuc te" cua anh: 3/3 hang tieng hien dung ghi chu
(A1 "tieng cua cam V1", A2 "cam V2", A3 "cam chung"); gan lai V3 lam wide
-> mic Nguoi 3 tu ve -1, A3 hien "—". Panel v0.3.3.

### 2. Anh Tien: "tao cho anh mot track list cai gi da xong va cai nao"
Tao **`TRANG-THAI.md`** — bang theo doi 3 muc: ✅ XONG (chi khi co so do
trong PROGRESS) · 🔧 CHUA XONG (kem vi sao + can gi) · 🙋 DANG CHO TAI
ANH. Ghi luat cap nhat vao CLAUDE.md cua du an: moi phien sua ma nguon
phai cap nhat bang nay.

## [cam-chung] - 2026-08-04 11:57 - CAM CHUNG DUNG DUOC (v0.3.2)

Anh Tien: quay that co "1 cam chung giua 2 nguoi nhung khi anh chon thi
lai khong su dung duoc". Truoc day anh phai che "Nguoi 3" de co cho gan
-> doi mic rieng -> bi chot an toan chan. Cam chung khong co cho dung.

### DA LAM
- **nao.js**: opts `coWide` (TAT mac dinh) + `wideSauGiay` (mac dinh 2s).
  Luat: im qua 2s -> ve wide (-1); 2s dau van nan nguoi vua noi (nhip
  editor); doan dan chua ai noi -> wide; im ngan <~2s -> nan nuot tron,
  khong nhay wide. So do ung ho: 4/6 khoang hai thuat toan cai nhau roi
  dung luc KHONG AI NOI.
- **Panel**: o chon track HINH them "Cam chung" (gia tri -2, vien xam,
  doc quyen 1 track, khong thuoc ve ai); luu theo sequence dang moi
  {ds, wide} (doc duoc ban cu dang mang); soatGan: wide khong can mic
  nhung phai 1 clip lien; vung phu tinh ca clip wide; doan wide hinh tu
  track wide, TIENG CA HAI MIC cung len (ai track nay — tieng phong tu
  nhien); danh sach tieng tinh TRUOC -> buoc DO LAI so voi so mong doi
  chinh xac; bang ket qua them ngan "Cam chung" xam.
- pc_phienBan giu v0.3.1 (host khong doi cho wide); topbar v0.3.2.

### KIEM CHUNG
- `tests/kiem-wide.mjs` (MOI, 11 phep): tat coWide = hanh vi cu y het;
  bat: doan dan wide, im 8s -> wide sau dung 2s nan (tu=13.00 mong 13),
  ket thuc dung luc B noi (19.00), im 1s KHONG wide oan, ranh vao luot
  noi 3.00/19.00/28.00 khong suy suyen, phu kin, wideSauGiay=4 -> 15.00.
- kiem-nao 16/16 + stress 12/12: KHONG doi hanh vi cu.
- **Chay THAT** (sequence AiO-WIDE-TEST = XML goc co C4026 wide):
  V1=14 C4026 (wide) · V2=58 C4234 · V3=52 C4089 = 124 doan;
  A1=72 mono (58 luot Trong + 14 wide) · A2=66 (52+14) — khop tung so;
  panel: "Nguoi 1 58 luot 15:29 · Nguoi 2 52 luot 26:43 · Cam chung 14
  luot 2:02", **0 canh bao lech**.

### CON LAI
- Noi chong nhau -> wide: CHUA lam (doi dap an tai). Cung shot qua N giay
  -> dao wide: CHUA lam.
- Sequence "test thuc te" cua anh Tien van chi co TIENG CAM (chua sync
  mic rieng vao) — wide khong thay the duoc mic; van can anh sync mic.
- Sequence thu AiO-WIDE-TEST + "AiO-WIDE-TEST - Podcast Cut" de lai cho
  anh nghe; xoa tay khi xong (deleteSequence khong co trong Beta 26.5).

## [chon-sequence] - 2026-08-04 11:35 - O CHON SEQUENCE LAM VIEC (hinh 5 cua anh Tien)

Anh Tien tu tao sequence "test thuc te" (import + sync bang Premiere —
DUNG duong nguoi dung that), roi bao: *"anh khong duoc chon dung sequence
lam viec cua minh"*. Truoc day panel TU BAM activeSequence — mo ca chuc
sequence thi no nhay theo tab dang mo, nguoi dung khong co quyen chon.

### DA LAM (v0.3.1)
- Host: `pc_trangThai` tra them truong 7 = DANH SACH sequence (cach ';;');
  `pc_chonSeq(ten)` doi activeSequence theo ten — moi chot an toan san co
  (SEQ_DOI, pc__seqDangDung) giu nguyen vi van di qua activeSequence.
- Panel: o chon `.den__chon` ngay dong den trang thai. Danh sach tu lam
  moi moi nhip soi (1s); KHONG ve lai khi dropdown dang mo (ve lai la sap
  giua tay nguoi dung); doi xong goi soi() ngay khoi doi 1 giay.
- `pc_phienBan` v0.3.0 -> v0.3.1.

### DO THAT tren panel (11 sequence trong project)
- O chon hien du 11 muc, dang dung o "test thuc te".
- Doi sang "Podcast Cut (4)": seqDangNhin doi theo, ban do ve lai 4 hang,
  activeSequence trong Premiere doi that.
- Doi nguoc ve "test thuc te" (chon theo CHI SO): khopNhau=true — o chon,
  panel, activeSequence khop ca ba; ban do 6 hang.

### ☠️ Thuoc do lai danh lua mot lan
Lan dau thu "doi nguoc ve" bang `sel.value = 'test thực tế'` -> tra ve
"" nhu the panel hong. Khong phai: chuoi TIENG VIET truyen qua PowerShell
bi meo (bay da ghi trong skill windows-scripting) nen khong khop option.
Chon theo selectedIndex thi chay ngay. Panel chua bao gio hong.

### GHI NHAN THEM tu hinh anh Tien gui (CHUA sua trong phien nay)
1. Hinh 1-3: chat luong cat tren lieu that — co doan nguoi nu noi ma
   khong co hinh/tieng, co doan cat nham cam. Dung vung nguong dang cho
   anh Tien cham tai (bang cham + 12 clip nghe kiem). KHONG sua mu.
2. Hinh 4: sequence "test thuc te" cua anh sync bang Premiere chi co
   TIENG CAM (C4089[A]...), chua co mic rieng — tool can mic rieng tung
   nguoi. Can noi ro trong huong dan hoac panel canh bao khi track tieng
   la tieng dinh lien clip hinh.

## [viec-1-stereo] - 2026-08-04 11:17 - XONG: TIENG MIC KHONG CON XE 2 TRACK

Anh Tien chot lam tiep viec 1. Sua GOC: dat tieng bang FILE MONO thay vi
mp3 stereo.

### KET QUA — do tren cung mot lieu, cung mot lan gan
| | Ban cu "Podcast Cut (3)" | **Ban moi "Podcast Cut (4)"** |
|---|---|---|
| A1 | Mic-Trong x52 | **Mic-Trong.aio-mono.wav x52** |
| A2 | Mic-Trong x52 + Mic-Dilys x51 | **Mic-Dilys.aio-mono.wav x51** |
| A3 | Mic-Dilys x51 | — khong con |
| Tong clip tieng | **206** (gap doi) | **103** (dung so luot) |
| Panel bao loi | "tieng 206/103" | **khong bao gi** |

Hinh giu nguyen: V1 = C4234 x52, V2 = C4089 x51.

### CACH SUA
- Panel tach them ban MONO giu nguyen sample rate goc (`-ac 1`, khong doi
  `-ar`) -> `<ten mic>.aio-mono.wav` **DAT CANH FILE GOC**, khong de trong
  %TEMP%: %TEMP% bi don thi project mo lai bao media OFFLINE. Cung quy uoc
  voi bo dem nghe cua Autocut/Transcripts.
- Co CACHE: file mono moi hon file goc thi khong tach lai.
- Host them `pc_nhapMono(dsStr)`: nhap file vao bin rieng "AiO Podcast -
  tieng mono", chi nhap file CHUA co (tranh item trung), roi **DOC LAI**
  xem tim thay du chua — khong tin "khong bao loi" (bai hoc 5l).
- `pc_phienBan` 'v0.2.0' -> **'v0.3.0'**, panel kiem khop moi chay.
- Panel chan tu te neu nhap thieu: chi ro file nao, nhac kiem o dia va
  quyen ghi.

### GIA PHAI TRA — noi ro
Moi mic sinh them mot file WAV **244 MB** cho 44 phut (48 kHz mono 16-bit).
Hai mic = 488 MB nam canh lieu goc. Doi lai: cau truc track dung, khong
mat tieng, khong lech kenh. Neu sau nay thay nang thi huong nhe hon la
FLAC mono (~60% dung luong, Premiere doc duoc) — CHUA THU.

Thoi gian: tach mono 2 mic 44 phut mat ~15 giay; tong ca lan chay
(tach 16k + tach mono + nao + dung 103 doan) **~70 giay**.

### KIEM CHUNG
- `node tests/kiem-nao.mjs`: 16/16 DAT (khong pha gi)
- Cu phap host + panel: hop le (node --check)
- Chay THAT tren panel qua cong 8094: 103 luot, **0 loi**, cau truc track
  dung nhu bang tren
- `ffprobe` ban mono: pcm_s16le · 48000 Hz · **1 kenh** · 2654,976 giay

### CON LAI
Thuoc cuoi cung van la TAI anh Tien: mo "Podcast Cut (4)" nghe thu xem
tieng co dung nguoi, dung nhip khong. May chi noi duoc "cau truc dung".

## [tai-nguyen] - 2026-08-04 10:23 - LUAT 50-70% CHO CA 7 PANEL + DO THAT LAT NGUOC MOT GIA DINH

Anh Tien chot luat CHUNG: CPU/RAM/GPU trong dai 50-70%, ap cho ca bo.
Chi tiet day du: `E:\2026\Production\CLAUDE.md` muc "LUAT TAI NGUYEN".

### KHAO SAT TRUOC (agent quet 7 panel)
| Panel | Truoc 04/08 |
|---|---|
| Asset Manager + Power Bins | turbo 2-8 tien trinh x 2 luong (~50%), nen priority IDLE |
| Autocut + Transcripts | 60% so luong, priority NORMAL |
| **Auto Podcast** | **KHONG `-threads`, KHONG setPriority** |
| **Auto Re-Frames** | **KHONG `-threads`, KHONG setPriority** |
| Guide Frame | khong sinh tien trinh con — khong can |

### DA LAM
- Tao `design-system/tai-nguyen.js` (nguon chan ly) + `dong-bo-tai-nguyen.ps1`
  + `kiem-tai-nguyen.ps1`. Panel KHONG build nap thang; 4 panel CO build giu
  hang so `TRAN_TAI_NGUYEN = 0.70` tai cho (doi cau hinh build cua 4 panel
  dang chay la rui ro lon hon loi ich).
- Podcast + Re-Frames: ghim `-threads` theo `chiaLuong(1)`, `maxBuffer` theo
  `tranDemLog()`.
- Autocut + Transcripts: `0.6` -> `TRAN_TAI_NGUYEN = 0.70`.
- Asset Manager + Power Bins: **GIU turbo o 50% co y** (do cu: nut that la
  dau doc o cung, 16 luong CHAM HON 8) — chi ghim them tran cho che do NEN.
- `kiem-tai-nguyen.ps1`: **12/12 muc kiem DAT** tren ca 7 panel.

### ☠️ DO THAT LAT NGUOC GIA DINH CUA CHINH EM
Em viet comment "khong ghim thi FFmpeg bung het 32 luong". Do that
(encode 4K->720p libopenh264, may 32 luong, do CPU-time/wall-time):

| Cau hinh | Luong that dung | % cua 32 | Thoi gian |
|---|---|---|---|
| **Khong ghim** | **10,5** | 32,8% | 5,2 giay |
| **Ghim 22 (tran 70%)** | 16,0 | 50,0% | **3,6 giay** |
| Ghim 16 (san 50%) | 13,9 | 43,4% | 3,8 giay |
| Ghim 4 (doi chieu) | 4,4 | 13,8% | 9,0 giay |

**Cau do SAI.** FFmpeg tu chon so luong theo codec, thuong chon THAP.
`-threads` la cai TRAN chu khong phai muc ep dung — ghim tran RONG con
nhanh hon 31%, ghim CHAT moi la thu lam cham. Da sua comment o ca 3 panel.

Bay do luong da vap 2 lan trong phien nay, deu la bai hoc cu:
1. Chay 3 cau hinh lien tiep roi so wall-time -> lan dau doc file 4K tu o G
   chua cache nen cham oan. Sua: chay lan lam nong truoc, lay lan 2.
2. `$p.TotalProcessorTime` doc SAU khi tien trinh thoat -> ra **0**. Phai
   poll trong luc no con chay va giu gia tri cuoi.
3. Duong dan `G:\Quay PV tuyen dung...` co dau cach -> `Start-Process
   -ArgumentList` cat thanh "G:\Quay". Sua: trich lieu ra ten ASCII truoc.

### DO TREN PANEL THAT
Cai ban moi, reload panel: `AiOTaiNguyen.moTa()` tra
"CPU 22/32 luong (tran 70%) · RAM tran 45 GB · GPU model turbo";
`chiaLuong(4)` = 4 tien trinh x 5 luong = 20 <= 22. Dat.
Tach WAV tu mp3 do duoc **8,4% CPU** (viec nhe, khong cham tran — dung
nhu ky vong: tran khong phai muc ep dung).

Lan chay 10:15 tren panel that voi nao SAN TU DO: ra **103 luot**
(dung con so ban do offline), tao "Podcast Cut (3)". Van bao dung loi
stereo con ton: "tieng 206/103" = gap doi -> viec 1 chua sua xong.

## [thu-kenh] - 2026-08-04 10:08 - VIEC 1: DA CHUNG MINH WAV MONO LA LOI GIAI

Anh Tien nhuong Premiere. Chay `thu-kenh.jsx` tren sequence THU RIENG
(`AiO-THU-KENH`, clone tu ban goc roi go sach clip) — khong dung sequence
nao cua anh.

| Buoc | trackA | So clip tung track |
|---|---|---|
| Sau khi go sach | 2 | [0, 0] |
| **Dat mp3 STEREO vao A1** | 2 | **[1, 1]** — TRAN sang A2 |
| **Dat WAV MONO vao A2** | 2 | **[1, 2]** — nam gon 1 track |

=> **Xac nhan bang thuc nghiem**: mp3 stereo an 2 track, WAV mono an 1
track. Loi giai la dat tieng bang FILE MONO.

Ghi chu: `sequence.deleteSequence()` KHONG ton tai trong Premiere Beta
26.5 — sequence `AiO-THU-KENH` phai xoa tay. Item WAV thu da go duoc.

### HAI DUONG SUA — chua chon, can do them
- **A. Tach WAV 48k mono roi dat file do.** Chac chan dung (vua chung
  minh). Gia: ~254 MB/mic cho 44 phut, phai import them item vao project
  nguoi dung, va neu de trong %TEMP% thi bi don la media OFFLINE — nen
  phai dat canh file goc (`<ten>.aio-mono.wav`, dung quy uoc Autocut).
- **B. Cu dat mp3 nhu cu roi GO clip o track thua.** Vi mic lav la mono
  that (L=R, do 04/08: ca hai kenh deu -50,6 dB) nen giu 1 kenh la du
  tieng. Nhe, khong ton dia, khong them item. **RUI RO chua do:** clip
  mono con lai co duoc pan CENTER khong, hay bi pan cung sang trai.
  Phai export thu roi do L/R moi biet.
=> Nghieng ve B neu do ra pan center (anh Tien chot "nhe de nhanh"),
lui ve A neu B lam lech tai.

## [autocut-da-podcast] - 2026-08-04 10:02 - ☠️ HAI TOOL TRONG CUNG BO DA NHAU: AUTOCUT XOA MIC, THAY BANG TIENG CAM

Anh Tien chay Autocut "Cat tai cho" tren ban dung cua Podcast roi hoi
"am thanh cua anh bi giam di nhieu khong". **Khong phai giam dB - la DOI
NGUON TIENG.** Do that tren 3 sequence trong project cua anh:

| Sequence | A1 | A2 | A3 | V |
|---|---|---|---|---|
| **Podcast Cut** (tool minh dung) | Mic-Trong x37 | Mic-Trong x37 + Mic-Dilys x37 | Mic-Dilys x37 | V2 C4234 x40 · V3 C4089 x39 |
| **Podcast Cut (2)** sau Autocut | **C4234 x300** | **C4234 x300** | — | **V1 C4234 x300** |
| **... - autocut 0908** | C4234 x317 + C4089 x688 | (nhu tren) | — | (nhu tren) |

=> Autocut **don het ve V1/A1/A2** va dung TIENG GAN LIEN VOI CLIP HINH
(tieng camera), **mic rieng bien mat hoan toan**. Mic-Trong/Mic-Dilys con
0 clip trong ban sau Autocut.

**Vi sao nghe nho han - do bang so:**

| Nguon tieng | mean_volume | max_volume |
|---|---|---|
| Mic lav (Mic-Trong.mp3) | **-50,6 dB** | -23,4 dB |
| Tieng cam (C4234.MP4) | **-66,2 dB** | -41,8 dB |
| **Chenh** | **15,6 dB** | **18,4 dB** |

Mic cai ao vs mic gan tren may quay cach ~2m: chenh 15-18 dB. Dung bang
muc "giam di nhieu" anh nghe thay.

### DAY LA LOI SAN PHAM, KHONG PHAI LOI THAO TAC CUA ANH TIEN
Autocut duoc thiet ke cho video THUONG (1 hinh + tieng cua chinh no). No
khong biet sequence multicam co MIC RIENG tren track khac. Chay noi tiep
Podcast -> Autocut la duong di RAT TU NHIEN cua editor (cat theo nguoi
noi xong thi cat khoang lang), ma di duong do la mat sach mic.

**Chua sua.** Huong: (a) Autocut nhan ra sequence co track tieng khong
gan clip hinh thi giu nguyen anh xa track; (b) hoac Podcast xuat ban
dung o dang Autocut hieu duoc; (c) hoac chan + bao nguoi dung.
=> Phai hoi anh Tien chon, vi no dong den CA HAI panel (bai hoc 5n: loi
dung chung thi dung va rieng mot cho).

### Cung xac nhan lai loi stereo (viec 1) bang so
Ban "Podcast Cut" cho thay ro: Mic-Trong chiem **A1+A2**, Mic-Dilys chiem
**A2+A3** — dung la moi mp3 stereo an 2 track lien tiep. `getAudio
ChannelMapping()` KHONG ton tai trong Premiere Beta 26.5 (da thu, tra
ReferenceError) nen phai sua bang duong khac: dat tieng bang file WAV
MONO thay vi mp3 stereo. Da tach thu `THU-mono48.wav` (60 giay, 48kHz
mono) va viet san `thu-kenh.jsx` — CHUA CHAY vi anh Tien dang thao tac.

## [san-tu-do] - 2026-08-04 09:47 - VIEC 2 XONG: BO SAN -50 dB CUNG, DUNG OTSU TU DO

Anh Tien chot thu tu 1-2-3. Viec 2 lam xong truoc vi viec 1 phai cho
Premiere ranh (anh dang chay Autocut chiem host ExtendScript).

### VIET PHEP DO TRUOC KHI SUA (bai hoc 5h)
Sinh lieu CO DAP AN o 4 MUC AM LUONG x 3 muc bleed. Muc am luong la chieu
ma bo kiem cu KHONG he thu - va do dung la cho vo:

| Cong thuc san | to (-24dBFS) | vua (-40) | **nho (-54 = LIEU THAT)** | rat nho (-60) |
|---|---|---|---|---|
| **cung -50 (dang dung)** | 3/3 100% | 3/3 100% | **0/3 0%** | **0/3 0%** |
| p10gop +6 | 3/3 | 3/3 | 3/3 100% | 3/3 100% |
| p10gop +9 | 3/3 | 3/3 | 3/3 100% | 3/3 99% |
| **otsu** | 3/3 | 3/3 | **3/3 100%** | **3/3 100%** |

=> San cung KHONG PHAI la "chua toi uu", no **hong han** o muc am luong
cua lieu that. Bo kiem cu 16/16 khong bat duoc vi lieu tong hop o -24
dBFS, cach lieu that **30 dB**. Dung bai hoc 2b, chieu bi bo sot lan nay
la BIEN DO chu khong phai so luong.

### CHON OTSU - va kiem ca chot GAY AN TOAN
Chon Otsu vi (a) 100% moi muc, (b) khong co hang so "+6/+9" tu dat,
(c) **cung duong Autocut da di** khi bo nguong im lang -30 dB cung.
Histogram 1 dB/bin tu -90..0, kep san trong [-75, -35].

Kiem rieng ca bleed -5 dB (2 mic gan giong nhau) - **ca 4 cong thuc deu
GAY DUNG** (tra KHONG_PHAN_BIET, tyLeRo 0%), o ca muc to lan nho. San tu
do KHONG lam mat chot an toan.

### KIEM CHUNG SAU KHI SUA
- `node tests/kiem-nao.mjs`: **16/16 DAT**, ranh lech 0 ms
- `node tests/stress.mjs` : **12/12 ca bat buoc DAT**, dung 100% moi ca
  (ty le ro tang ro: 89-98%; ca 60 phut/227 luot van 100%)
- Tren LIEU THAT: san tu do = **-54,0 dB** (thay -50 cung)
  | | luot | tyLeRo | Trong | Dilys |
  |---|---|---|---|---|
  | cu (-50 cung) | 79 | 23,0% | 33% | 67% |
  | moi (tu do) | 103 | **28,1%** | 38% | 62% |

**GIOI HAN (bai hoc 5d):** moi con so tren van do bang chinh dB. Chi duoc
noi "tool NGHE RO hon 23% -> 28,1% thoi luong", KHONG duoc noi "cat dung
hon". Thuoc cuoi cung van la tai anh Tien.

### ☠️ EM DA DAN NHAN NGUOC TRONG BAO CAO 09:15 - da dinh chinh
Bam lai duong dan (`bamTen` voi backslash Windows) moi ra dung:
`m-1bnq3q9.wav` = **Mic-Trong** · `m-kbnyu4.wav` = **Mic-Dilys**.
Ban do 09:15 dat nguoc => bang 6 moc bat dong bi doi ben:
- moc t=417: dung ra la **nao CU dung**, bleed-cancel sai
- moc t=1497: dung ra la **bleed-cancel dung**, nao cu sai
Ket luan tong "1 thang - 1 thua - 4 hoa, chua chung minh duoc" **KHONG
DOI**, nhung chi tiet tung moc thi da bao sai mot lan.
=> Bai hoc: **thu tu file trong thu muc KHONG phai la nhan.** Nhan phai
neo bang bang chung (o day la bam duong dan), giong bai hoc 5j.

### File anh huong
- `dist/nao.js`: them `sanTuDo()` (Otsu), `nguongSan` mac dinh = tu do,
  `thongKe.san` de panel/bo kiem doc lai duoc. Da chep sang panel da cai.

### CON DANG CHO
- Viec 1 (stereo): host ExtendScript BAN (anh Tien chay Autocut) - 3 lenh
  goi vao Premiere deu treo, ke ca lenh nhe nhat. Panel van song (18 tien
  trinh CEP). Day la hanh vi DUNG, khong phai hong (bai hoc 5f).
- Anh Tien bao them 09:44: cat xong bang Podcast roi chay Autocut thi
  "am thanh ve dang cu, tu dong tru rat nhieu dB". Anh gui hinh: track
  A2/A3 co cac clip dan nhan **L** va **R** rieng le -> dung la he qua
  cua loi stereo tach kenh. Chua do duoc muc dB that vi Premiere ban.

## [anh-tien-cham] - 2026-08-04 09:15 - ANH TIEN TEST VA BAO 4 DIEM - DO THAT CA 4, TIM RA THU PHAM CHINH

Anh Tien tu bam thu roi liet ke 4 diem. Phien nay CHI DO, khong sua ma
nguon (chua co dap an thi sua la sua mu).

### 4. "Thu 2 lan ket qua rat giong nhau - bi de data cu?" -> KHONG DE
Do that: project co 4 sequence, trong do HAI ban dung RIENG BIET:
- "PODCAST BUOI2 da sync - Podcast Cut"     V=3:79  A=4:148
- "PODCAST BUOI2 da sync - Podcast Cut (2)" V=3:79  A=3:158
`pc__tenKhongTrung` tu them "(2)" - khong ghi de. Giong nhau vi thuat
toan TAT DINH: cung file + cung nguong -> cung 79 luot. Ra khac moi dang
lo. (Co cache WAV theo bam duong dan trong %TEMP%\aio-podcast - co chu
dich, chi bo qua khi file nguon cu hon ban wav.)

### DOC HET 158 CLIP (bai hoc 5k - dem khong phai la kiem)
Lan truoc em chi doc clip DAU va CUOI roi SUY RA noi dung. Lan nay in het:
- V1=40 C4234x40 (Trong) · V2=39 C4089x39 (Dilys) -> hinh SACH 100%
- A1=40 Mic-Trongx40 · A2=79 = Mic-Trongx40 + Mic-Dilysx39 · A3=39 Mic-Dilysx39
=> Dung chan doan stereo: moi mic stereo dat len track mono bi tach 2 kenh
   sang 2 track. Suy doan lan truoc DUNG, nhung luc do em chua co quyen noi.

### 3. "Chuyen cam va audio van bi sai" -> TIM RA THU PHAM, DO DUOC BANG SO
Ban do offline tren dung 2 WAV panel da tach (44,2 phut):

| Phep do | Ket qua |
|---|---|
| Cua so bi san -50 dB loai THANG | **75.574/132.650 = 57,0%** |
| Muc mic Trong p10/p50/p90 | -65,5 / **-54,6** / -44,5 dBFS |
| Muc mic Dilys p10/p50/p90 | -61,2 / **-54,8** / -45,8 dBFS |
| Trong 43% con lai, chenh >=6 dB | 30.525/57.076 = 53,5% |
| Chenh p10/p50/p90 | 3,0 / **6,2** / 11,1 dB |
| => tyLeRo cuoi cung | **23,0%** |

**THU PHAM: san -50 dB la HANG SO CUNG, ma MUC GIUA cua ca hai mic la
-54,6 / -54,8 dBFS - tuc NAM DUOI SAN.** Hon nua thoi gian co tieng bi coi
la im lang ngay tu buoc dau. Tool chi thuc su QUYET DINH duoc 23% thoi
gian; 77% con lai la GIU NGUOI TRUOC (hysteresis) - tuc la doan.
Day la thu chac chan sai, khong phu thuoc thuat toan nao.

### DA THU BLEED-CANCEL - VA KHONG DUOC PHEP NOI LA TOT HON
Y tuong: mic_A = giong_A + alpha*giong_B. Uoc luong alpha tu cac cua so
mot nguoi ap dao (chenh >=12 dB), tru di roi so lai.
- He so ro ri do duoc: **-13,3 dB** (vao Trong) va **-12,8 dB** (vao Dilys)
- Chenh p50: 6,2 -> **11,3 dB** · ty le chenh >=6 dB: 53,5% -> **87,6%**
- Nhung chia hinh DAO NGUOC: cu 33/67, moi (san -50) **76/24**

=> Con so dep len that, nhung do bang chinh dB (bai hoc 5d - thuoc cung
vat lieu). Nen em dung THUOC THI GIAC: 6 khoang bat dong dai nhat
(14-32 giay), rut 6 khoanh khac moi khoang tu ca 2 cam can, NHIN MIENG:

| Moc | Nao cu | Bleed-cancel | Nhin anh |
|---|---|---|---|
| t=2230 (32s) | Trong | Dilys | ca hai IM (Dilys ngua mat nghi) - hoa |
| t=1963 (18s) | Trong | Dilys | ca hai IM (Dilys che mieng cuoi) - hoa |
| t=417 (15s) | Dilys | Trong | Trong mieng he, dang noi -> **moi dung** |
| t=2003 (15s) | Dilys | Trong | ca hai IM - hoa |
| t=1155 (14s) | Trong | Dilys | ca hai IM - hoa |
| t=1497 (14s) | Dilys | Trong | **Dilys mo mieng ro, thay rang** -> **CU DUNG** |

**1 thang - 1 thua - 4 hoa. KHONG chung minh duoc bleed-cancel tot hon.**
Neu chi doc bang so (87,6% vs 53,5%) thi em da bao cao sai. Moc t=1497
cuu em - va no la moc THU 6, neu chi xem "vai cai dau" thi da trot lot.

**Phat hien phu quan trong:** 4/6 khoang bat dong roi vao luc **KHONG AI
NOI**. Tuc phan lon khac biet giua hai thuat toan nam o vung ca hai deu
dang DOAN, khong phai vung "cat nham nguoi dang noi".

### 1 & 2 - hai cau hoi SAN PHAM (chua co code, da ghi vao TINH-NANG.md)
1. Sap xep folder bang 1 nut: thuoc LEVEL 3 muc 1. Lieu that cho thay
   bin "Cam 3" chua ca C4086 (1:37) + C4087 (40:21, buoi 1) + C4088
   (4:12) + C4089 (44:21, buoi 2) - lan ca file vun lan 2 buoi khac nhau.
   Da co san 2 manh: tuong quan trong buoi r=0,52-0,54 vs cheo buoi
   r~0,02 (tach buoi duoc bang may), va do dai file (loai file vun).
2. Cam quay chung 2 nguoi: HIEN TAI de trong (khong gan) - dung nhu em
   lam voi C4026. Muon dung phai co vai "CAM WIDE" = LEVEL 2 muc 1,
   anh Tien tung chot "v1 chua can". Anh hoi tuc la nay da can.

### KHONG SUA GI TRONG PHIEN NAY
Ba viec cho anh Tien quyet, xem cuoi bao cao. Rieng loi stereo (158 clip)
la bug ro rang, sua duoc ngay khi anh gat.

## [chay-that-lieu-that] - 2026-08-03 19:54 - LAN DAU CHAY TOOL THAT TREN LIEU THAT - HINH DUNG, LO LOI MIC STEREO

Anh Tien: "y anh la em control may anh de em thuc hien thuc te voi tool".
Em dieu khien panel that qua cong 8094, di DUNG duong nguoi dung: kich hoat
sequence -> panel tu nap ban do track -> gan qua o chon tren UI (dispatch
event change) -> bam nut "Cat timeline theo nguoi noi" -> canh nut song lai
(tin hieu xong, bai hoc 5f).

### Buoc gan - biet cam nao cua ai bang MAT
Rut 1 frame/cam (ffmpeg -ss 300): C4026 (V1) = WIDE 2 nguoi -> KHONG gan;
C4234 (V2) = can anh Trong (nam, host); C4089 (V3) = can chi Dilys (nu, ao
Dream Talent). Gan: Nguoi 1 = V2+A1 (Mic-Trong), Nguoi 2 = V3+A2
(Mic-Dilys). soatGan = sach.

### Ket qua chay (lieu 44,25 phut that, 2 nguoi)
- Tach 2 WAV + nao + dung: het ~70 giay tong. Nao ra **79 luot** — TRUNG
  KHIT voi quet offline 15:34 (san -50/chenh 6 -> 79 luot).
- Panel: Nguoi 1 = 40 luot / 14:26 · Nguoi 2 = 39 luot / 29:48 (33/67,
  khop quet offline). Phu 44:13.
- **HINH DUNG 100%:** V1=0 · V2=40 clip C4234 (Trong) · V3=39 clip C4089
  (Dilys) — tong 79/79, dung cam dung nguoi, wide de trong.
- **TIENG LOI — tu do cua tool BAT DUOC va canh bao dung:** "tieng 158/79".
  Do ngoai: a=4 track (goc 2): A1=40 Mic-Trong · A2=79 (40 Trong + 39
  Dilys) · A3=39 Mic-Dilys · A4=0. 40+79+39 = 158.

### Nguyen nhan (da khop so, chua sua)
Mic mp3 la STEREO dual-mono (r=1,0). Sequence goc (tu XML em sinh) co
track audio MONO. `pc_datTieng` dat item stereo len track mono -> Premiere
TACH 2 KENH thanh 2 track item: kenh 1 vao track dich, kenh 2 tran sang
track ke (va tu de ra track moi A3/A4). Trong->A1+A2, Dilys->A2+A3.
- Lieu tong hop truoc gio la WAV MONO nen 10/10 sach — dung bai hoc 2b:
  mau nho/khac chat giau loi.
- Nghe thi VAN DUNG GIONG dung luot (dual-mono giong het nhau), chi bi
  nhan doi lop va sai cau truc track so voi thiet ke "ve dung track goc".
- Huong sua (chua lam, cho anh Tien nghe truoc): pc_nhanBan tao track
  audio theo channel type cua mic item, hoac ep channel mapping mono
  truoc khi dat. Phai kiem ca ca nguoc: sequence user sync tay co track
  standard/stereo thi hanh vi ra sao.

### Gioi han phai noi ro (5d)
79 luot la dung NGUONG HIEN TAI (6dB/-50dB) — nguong nay da do la khong
on dinh tren lieu that (tyLeRo 23% sat mep 20%). "Cat DUNG hay khong"
van phai doi TAI anh Tien nghe sequence "PODCAST BUOI2 da sync - Podcast
Cut" + cham 12 clip nghe kiem.

## [project-rieng] - 2026-08-03 19:43 - TAO PROJECT RIENG CHO BAI PODCAST THEO YEU CAU ANH TIEN

Anh Tien: "tao cho anh mot project moi di". Lam bang `app.newProject` tu
panel (khong dung tay):
- Tao `file pr for test\podcast-buoi2\AiO-Podcast-Test.prproj` -> ok=true,
  active chuyen sang project moi, **Test3 van mo** (projects 1 -> 2).
- Import lai XML vao bin `AiO-PODCAST-TEST-XML` trong project moi:
  root 0->1, sequence 0->1, bin 6 muc. Do ruot sequence: y het lan do
  trong Test3 (3V+2A, 5/5 clip dung vi tri 42/38/28/0/0, online,
  endFrame 63.926).
- `project.save()` co chot ten project truoc khi luu (khong luu nham
  project khac). File tren dia: 14.377 byte, 19:43.
- Luc do thay activeSequence = "Test podcasst" — anh Tien dang tu tao
  sequence tay trong project moi, tuc anh da bat dau nghich. Tot.
- Bin `AiO-PODCAST-TEST-XML` trong Test3 gio thanh thua — CHUA xoa, cho
  anh Tien quyet (xoa bin la sach, khong dung media goc).

## [import-xml] - 2026-08-03 19:39 - IMPORT SEQUENCE TU SYNC VAO PREMIERE THAT: KHOP DAP AN 100%

Anh Tien chot "em import thu roi bao anh" va tu mo panel (cong 8094 song
19:36). Import qua evalScript tu panel that, KHONG dung tay keo tha.
Xoa mon no so 1 cua muc [tu-sync]: XML sinh bang code DA VAO DUOC Premiere.

### Cach lam (3 buoc, bieu thuc JS ghi ra file theo luat windows-scripting)
1. TRUOC: Test3.prproj, 24 muc goc, 16 sequence, active "Test3 Insane -
   Doc 9-16", chua co sequence trung ten.
2. IMPORT `PODCAST-BUOI2-da-sync.xml` vao bin rieng `AiO-PODCAST-TEST-XML`
   bang `app.project.importFiles(..., true, bin, false)` -> ok=true,
   root 24->25 (dung 1 bin), sequence 16->17 (dung 1), bin chua 6 muc
   (1 sequence + 5 media).
3. SAU - do tung track (tick = 10.594.584.000/frame @ 23,976):

| Track | Ky vong | Do duoc |
|---|---|---|
| V1 | C4026 @ frame 42 | C4026.MP4 @ 42f, online |
| V2 | C4234 @ 38 | C4234.MP4 @ 38f, online |
| V3 | C4089 @ 28 | C4089.MP4 @ 28f, online |
| A1 | Mic-Trong @ 0 | Mic-Trong.mp3 @ 0f, online |
| A2 | Mic-Dilys @ 0 | Mic-Dilys.mp3 @ 0f, online |
| Moi track 1 clip lien | 5/5 | 5/5 (thoa rang buoc MVP) |
| endFrame | 63.926 | 63.926 - khop tung frame |
| Media offline | 0 | 0 (ca duong G: co dau tieng Viet) |
| Active sequence | khong doi | van "Test3 Insane - Doc 9-16" |

=> Duong "tu sync -> sinh XML -> import -> sequence san sang cho panel"
THONG SUOT. Level 3 muc 3 (tu dung sequence) co bang chung dau tien;
con lai la goi qua host JSX thay vi bat nguoi dung import tay.

### Ba thuoc do HONG bi bat trong phien (deu truoc khi cham san pham)
1. `curl -s && echo SONG` — exit 0 ke ca HTTP 404 -> bao cong 8090 la CDP
   trong khi do la node server khac. Phai doc BODY tim webSocketDebuggerUrl.
2. Python giai ma pathurl chet vi in tieng Viet ra console Windows -> bao
   "MAT 3 file video" trong khi file nam day du tren G:.
3. `p.sequences.numItems` = undefined — SequenceCollection dem bang
   `numSequences`. Neu khong sua truoc thi buoc SAU bao "khong thay
   sequence" OAN sau khi import thanh cong.

### Don dep
Bin `AiO-PODCAST-TEST-XML` nam trong Test3.prproj cua anh Tien — xoa bin
la sach (khong dung media goc). De lai cho anh mo xem.

### Con no (thu tu moi)
1. Anh Tien mo sequence "PODCAST BUOI2 da sync", nghe thu vai cho xem
   sync tai co khop khong (thuoc ngoai cuoi cung cho tu-sync).
2. Anh cham 12 clip nghe kiem (`podcast-nghe-kiem\_BANG-CHAM.csv`).
3. Nguong 6 dB / san -50 dB — doi dap an tu (2) roi moi sua.

## [level-3] - 2026-08-03 17:43 - ANH TIEN MO TA LEVEL 3 "TRO VAO FOLDER LA XONG" - GHI VAO TINH-NANG.md

Anh Tien nhan tin mo ta 2 level cua san pham:
- Level basic: nguoi dung tu import + tu sync bang Premiere (chon nhieu
  file sync mot lan), qua tab tool gan video/audio cua ai, tool tu cat.
  -> Chinh la LEVEL 0-1 dang chay (v0.3.1).
- Level xin nhat: "tool tro vao folder chua hinh anh va am thanh, tu dong
  lam cac thao tac tren".

Da lam (chi sua TAI LIEU, khong dung ma nguon):
- Them muc **LEVEL 3** vao TINH-NANG.md: 5 dau viec (quet folder + xu ly
  2 bay U+F022/file trung MD5 · tu sync · tu dung sequence · goi y ghep
  cap mic-cam + tach buoi · chuoi mot nut co duong dung tung chang).
- Go dong "KHONG LAM: tu sync" — chinh anh mo lai khi mo ta Level 3.
  Spike tu-sync 15:51 hom nay da do: lech 0,59 frame vs PluralEyes.

Kiem chung them trong phien: nghi ngo dist/ repo lech ban cai (md5sum bao
LECH ca 4 file) -> so lai bang cmp tung byte: GIONG HET ca 4. Thuoc do sai:
md5sum voi duong dan chua `\` in them ky tu thoat `\` truoc ma bam, chuoi
so sanh lech (bai hoc 5: nghi cong cu do truoc). dist/ da an toan trong git
(commit f6c7e70), khop ban cai tung byte.

Con no (khong doi): 3 viec cho anh Tien — import XML buoi 2, cham 12 clip
nghe kiem, roi moi sua nguong 6dB/san -50dB theo dap an.

## [tu-sync] - 2026-08-03 15:51 - CUU dist/ (3 PANEL) + TU DO OFFSET, DUNG SEQUENCE THU

Anh Tien chot 2 viec: (1) chep dist ve repo va commit luon; (2) em tu tao
project rieng, tu do offset — KHONG dung project that cua anh.

### 1. CUU dist/ — nguyen nhan goc la .gitignore, khong phai tai nan
`.gitignore` dong 9 co `dist/` — dung cho panel CO BUILD, nhung 3 panel
KHONG build thi `dist/` chinh LA MA NGUON viet tay. Quy tac chung nuot mat
chung trong im lang.

Do that truoc khi sua:

| Panel | dist tren o | git theo doi | ban da cai |
|---|---|---|---|
| Auto Podcast | MAT SACH | 0 file | con |
| Guide Frame | MAT SACH | 0 file | con |
| Re-Frames | con 3 file | 0 file | con |
| Auto Cut Short | chua co code | 0 | chua cai |

-> Khong va rieng Podcast (bai hoc 5n): sua ca 3. Them ngoai le
`!/​<panel>/dist/` — phai un-ignore CHINH THU MUC vi git khong descend vao
thu muc bi ignore, un-ignore file ben trong khong co tac dung. Da kiem
`git check-ignore`: ca 3 duong dan khong con bi chan.

Chep dist tu ban da cai ve repo cho Podcast + Guide Frame. Re-Frames doi
chieu MD5: 3/3 file giong het ban cai.

Kiem chung (chay tu REPO sau khi chep, khong phai ban sao scratchpad):
- `tests/kiem-nao.mjs`: **16/16 DAT**, ranh lech 0 ms
- `tests/stress.mjs` : **12/12 ca bat buoc DAT**, dung 100% moi ca
- Ca "cuoi-chung 2s" ra 10/10 -> dung ban v0.3.1, khong mat chuc nang.
- Commit `f6c7e70`, 15 file, 5181 dong. 12 file dist nay da nam trong git.

### 2. TU SYNC — do offset bang tuong quan cheo, co THUOC NGOAI cham
Tach tieng 6 file cam 4K (~17 GB/file) -> wav 8kHz mono: **25-28 giay/file**
(ffmpeg seek theo index, khong doc het file). Envelope dB chuan hoa (bo
trung binh, chia do lech chuan) roi tuong quan cheo: quet tho 0,2s +-12
phut, tinh chinh 20ms.

Ket qua (BUOI 2 = C4026/C4234/C4089 + Trong2/Dilys2): r = 0,71-0,75,
offset +1,74 / +1,56 / +1,18 giay.

**THUOC NGOAI:** `PR\Audio.xml` cua anh Tien co "Synced Sequence" do
**PluralEyes** sync — cong cu doc lap hoan toan. Doi chieu:

| Cap | Em do | PluralEyes | Lech |
|---|---|---|---|
| C4026 - C4234 | +0,180s | +0,167s | 0,32 frame |
| C4026 - C4089 | +0,560s | +0,584s | 0,57 frame |
| C4234 - C4089 | +0,380s | +0,417s | 0,89 frame |
| **C4026 <-> mic (tuyet doi)** | **+1,740s** | **+1,752s** | **0,30 frame** |

Lech trung binh **0,59 frame**. Day la lan dau tien cac con so cua du an
duoc cham bang thuoc DUNG NGOAI thuat toan (bai hoc 5d).

**PluralEyes KHONG sync duoc mic Trong(2)** — no vut file do vao dong cuoi
timeline (frame 130753, cung cho voi C4023/C4088 la cac clip vun). Em sync
duoc, va vi tri em tinh ra (66828) TRUNG KHIT voi Dilys(2) ma PluralEyes
dat — dung nhu ky vong (cung may ghi, chia file cung luc).

### ☠️ EM DA KET LUAN SAI MOT LAN — nguong tin cay qua chat
Truoc khi doi chieu, em bao "buoi 1 khong co mic" vi dat nguong r >= 0,25
va cap buoi 1 chi ra r = 0,13-0,17. **Sai.** Doi chieu PluralEyes:

| Cap | Em do (lag) | PluralEyes | |
|---|---|---|---|
| C4025 <-> Thien(1) | -10,4s | -10,34s | khop |
| C4233 <-> Thien(1) | -3,2s | -3,13s | khop |
| C4087 <-> Thien(1) | -3,8s | -3,71s | khop |

**Lag em do dung ca 3, chi co r thap.** Nguong tin cay tu dat da loai nham
cap DUNG. Bai hoc: voi tuong quan cheo, **dinh o dung mot cho qua nhieu cap
doc lap** la bang chung manh hon gia tri r tuyet doi. Neu sau nay lam tinh
nang tu sync, ĐUNG chan bang nguong r cung — hay xet tinh nhat quan giua
cac cap.

### 3. SEQUENCE THU da dung
`file pr for test\podcast-buoi2\PODCAST-BUOI2-da-sync.xml` (7,7 KB) —
FCP7 xmeml theo dung khuon Premiere tu xuat (doc mau tu `PR\Audio.xml`).
- 3 track video (Cam1/2/3) + 2 track audio (mic Trong, mic Dilys)
- **Moi track dung 1 clip lien** -> thoa rang buoc MVP cua tool
- Vi tri frame: 42 / 38 / 28 (lay tu PluralEyes), mic o 0
- Dai 63.926 frame = 44,44 phut @ 23,976 fps
- Mic dung ban copy TEN ASCII (`Mic-Trong.mp3`/`Mic-Dilys.mp3`, MD5 giong
  ban goc) de ne ky tu U+F022 lam Premiere mat link.

Kiem chung: `XmlDocument.Load` -> hop le (well-formed); giai ma pathurl ra
dung 3 duong dan that; dem duoc 3 track video + 2 track audio, moi track 1
clip.

**CHUA KIEM:** chua import thu vao Premiere. Khong tu lam vi Premiere dang
mo project that cua anh Tien, import se tao sequence trong project do.
Buoc nay can anh Tien.

### File anh huong
- `.gitignore` (goc AiO Studio) — them 3 ngoai le
- `AiO Auto Podcast/dist/` · `AiO Auto Guiline Frame/dist/` ·
  `AiO Auto Re-Frames/dist/` — dua vao git
- `file pr for test\podcast-buoi2\` — 2 mp3 ten ASCII + 1 XML sequence
- Ban do trong scratchpad: `tach-tieng-cam.mjs` · `do-offset.mjs` ·
  `soi-buoi1.mjs` · `doi-chieu-offset.mjs` · `sinh-sequence.mjs`

### Con no
1. Anh Tien import XML -> mo panel Auto Podcast -> chay that (chua lam).
2. Anh cham 12 clip nghe kiem (`podcast-nghe-kiem\_BANG-CHAM.csv`).
3. Nguong 6 dB / san -50 dB van chua sua — doi dap an.

## [do-lieu-that] - 2026-08-03 15:34 - DO NAO TREN LIEU PODCAST THAT + PHAT HIEN MAT dist/

Anh Tien dua lieu that: `G:\Quay PV tuyen dung_DRT_0902\Video` (+ folder
`Audio` canh no). Day la mon no ghi trong CLAUDE.md: "CHUA do bleed tren
lieu THAT". KHONG sua mot dong ma nguon nao trong phien nay — chi DO.

### Boi canh: lieu that khong giong gia dinh
Do ra KHONG phai 1 podcast 3 nguoi, ma la **2 buoi phong van rieng, moi
buoi 2 nguoi**, anh Trong dan ca hai buoi:

| | Buoi 1 (video ~40,4 phut) | Buoi 2 (video ~44,3 phut) |
|---|---|---|
| Mic | Trong (1) + Thien (1) | Trong (2) + Dilys (2) |
| Tuong quan envelope trong buoi | r = 0,52 | r = 0,54 |
| Tuong quan CHEO giua 2 buoi | r ~ 0,02 (khac thoi diem) | |

Video: 3 cam x 4K x 24000/1001 fps, moi cam quay ca 2 buoi.
Ca 5 file mp3 deu dung 44,25 phut / 106.199.040 byte — do may ghi tu chia
theo dung luong (320kbps x 2655s), KHONG phai chia theo nguoi.
L va R trong moi file r = 1,0000 -> mono nhan doi, moi file = 1 mic. Dat.

### HAI BAY TRONG CHINH DU LIEU (bat duoc truoc khi no cam vao san pham)
1. **Ky tu U+F022 trong ten file.** `Quay Phim 9<U+F022>2 ...mp3` — do dau `"`
   hop le tren Mac, Windows map sang vung Private Use Area. Truyen ten nay
   qua PowerShell 5.1 sang ffmpeg.exe -> "No such file or directory" o CA 4
   FILE, du Get-ChildItem doc duoc binh thuong. Ne bang cach copy sang ten
   ASCII. 8.3 shortpath KHONG cuu duoc (o G: tat 8dot3name).
   -> Ban ban PHAI xu ly: nguoi dung Mac-sang-Windows se dinh 100%.
2. **File trung y het.** `Dylis (2).mp3` trung TUNG BYTE voi
   `Quay Phim 9"2 Dilys (2).mp3` (cung MD5) — thua 101 MB. Neu gan ca hai
   lam 2 nguoi khac nhau thi chenh luon = 0dB, nao se tra KHONG_PHAN_BIET.

### PHAT HIEN CHAN: thu muc dist/ MAT khoi repo
`dist/nao.js` + `dist/index.html` KHONG con trong repo va **chua bao gio
duoc git theo doi** (`git ls-files` khong co dong nao ve dist) -> khong co
ban lui. Toan bo file repo cung mot moc 2026-08-02 21:22:41 = mot lan chep
de hang loat; dist bi bo lai vi untracked.

Ban duy nhat con lai tren may: panel DA CAI o
`%APPDATA%\Adobe\CEP\extensions\com.aiostudio.podcast\dist\`.

**Do that tren ban sot do (chay trong scratchpad, khong dung ban dang chay):**
- `kiem-nao.mjs`: **16/16 DAT**, ranh lech 0 ms.
- `stress.mjs`: **12/12 ca bat buoc DAT**, dung 100% moi ca.
- Ca 2 "cuoi-chung 2s" ra **10/10** (dung dap an) -> ban sot CO chot chuyen
  nguoi, tuc dung la v0.3.1. Doc code xac nhan: K_ONSET=25, NG_X=15, NG_CUR=5.
- `index.html` co `banDo` 12 lan -> co UI ban do track (v0.3.0).
=> **Khong mat chuc nang nao**, chi can chep nguoc ve repo (CHO ANH TIEN DUYET).

### KET QUA NAO TREN LIEU THAT — bleed nang hon du doan nhieu
Chay nao that (`AiONao.doDb` + `aiDangNoi`) tren 2 cap mic, 44,25 phut/cap:

| Phep do | Buoi 1 | Buoi 2 |
|---|---|---|
| trangThai | OK | OK |
| tyLeRo (nguong gay an toan 20%) | 30,6% | **23,0%** — sat mep |
| So luot / mat do | 120 luot · 2,7 nhat/phut | 79 luot · 1,8 nhat/phut |
| Chia hinh | Trong 21,3% / Thien 78,7% | Trong 32,7% / Dilys 67,3% |
| **Chenh mic to nhat vs mic nhi (p50)** | **7,1 dB** | **6,2 dB** |
| % cua so co tieng chenh DUOI 6 dB | **35,0%** | **46,5%** |
| Thoi gian chay nao | 8 ms | 10 ms |

Lieu tong hop tu truoc gio dung bleed -16 dB (chenh rat ro). Lieu that chi
chenh 6-7 dB -> **nguong 6 dB dang nam dung giua dai du lieu that**, khong
con khoang an toan.

Chot an toan "mic deu" cho qua ca 4 mic (dai p90-p10 = 15,4 den 26,2 dB) —
dung, khong bat oan.

### KET QUA KHONG ON DINH — bang chung
Quet nguong tren buoi 2 (san x chenh):

| san | chenh | tyLeRo | luot | nhat/phut | chia hinh |
|---|---|---|---|---|---|
| -50 | 6 dB | 23,0% | 79 | 1,8 | 33/67 |
| -55 | 6 dB | 29,3% | 105 | 2,4 | 38/62 |
| -60 | 6 dB | 36,0% | **171** | 3,9 | **50/50** |
| -65 | 6 dB | 37,6% | 215 | 4,9 | 57/43 |

Chi ha san 10 dB ma chia hinh nhay 33/67 -> 50/50 va so nhat cat gap doi.
Nhay den muc do thi CHUA duoc tin bat ky gia tri nao. Buoi 1 on dinh hon
(21/79 -> 25/75) nhung cung khong chung minh duoc gi.

**Nghi van huong sua (CHUA sua):** san -50 dB la HANG SO CUNG, ma mic buoi
nay thu nho (p90 chi -44 dB, p50 -54 dB) nen no loai 60-78% so cua so.
San nen tinh theo MUC NEN CUA CHINH FILE, khong phai so co dinh. Nhung
chua co dap an thi sua la sua mu — doi anh Tien cham tai truoc.

### GIOI HAN PHAI NOI RO (bai hoc 5d)
Moi con so tren deu do em dung **chinh nang luong dB** de cham diem mot
thuat toan **cung chay bang dB** — thuoc lam bang cung vat lieu voi cai no
do thi luon tu khen minh. Chi duoc noi "chay ra ket qua trong hop ly",
KHONG duoc noi "cat dung".

Da dung bo NGHE KIEM lam thuoc ngoai:
`file pr for test\podcast-nghe-kiem\` — 12 clip 6 giay (6 moi buoi, chon
bang PRNG co seed 2026/803), moi clip la mot moc tool bao CHUYEN NGUOI,
moc nam o giay thu 3, tron 2 mic + loudnorm de nghe nhu trong phong.
Kem `_BANG-CHAM.csv` de anh Tien danh Dung/Sai.

### File anh huong
- KHONG sua ma nguon nao. Chi them thu muc lieu thu:
  `file pr for test\podcast-nghe-kiem\` (12 mp3 + 1 csv, ~850 KB).
- Ban do trong scratchpad phien nay: `phan-tich.mjs` · `chay-nao-that.mjs` ·
  `quet-nguong.mjs` · `sinh-nghe-kiem.mjs`.

### Con no sau phien nay
1. Chep `dist/` tu ban da cai ve repo — CHO ANH TIEN DUYET (ghi vao repo).
   Va lan nay phai **commit dist vao git**, dung de untracked nua.
2. Anh Tien cham 12 clip nghe kiem -> co dap an moi dong vao nguong.
3. Chua dung thu tren Premiere voi project that (`Quay PV tuyen
   dung_DRT_0902.prproj`) — viec nay CHO ANH DUYET, va neu lam thi chi chay
   tren BAN SAO (bai hoc undo 29/07).

## [0.3.1] - 2026-08-02 20:56 - STRESS TEST 12 CA KHO + SUA NAO "CUOI CHUNG"

(Ghi chu ngay thang: cac muc 0.1.0 -> 0.3.1 deu la viec lam trong PHIEN
02/08. Phien 01/08 chi lam spike nao (muc 0.1.0-spike tro xuong). Truoc do
ghi nham la 01/08 vi suy tu context thay vi chay lenh date — da sua.)

Anh Tien: "tao stress test voi cac tinh huong audio va video kho khan hon".
Viet tests/stress.mjs — 12 ca co dap an theo cua so 20ms, cham DAT/TRUOT:
chong lan 1s · cuoi chung 2s · u-hu 0.35s · bleed nang dan (-12 -> -6.5) ·
mic lech 13dB · nen on -44dB · im lang 12s · doc thoai 90/10 · 3 nguoi chen ·
60 PHUT (~227 luot) · chot "mic deu" (tone/nhac/mic that/mic cam) ·
sample rate lan 44.1k+48k qua FFMPEG THAT.

STRESS BAT DUOC 1 LOI THAT: ca "cuoi chung" ra 12 luot thay vi 10 — hai
nguoi cung to thi vai cua so trung hop am tiet chenh du 6dB, nao nhay cam
sang nguoi cuoi roi nhay ve (dung kieu "cat may moc" nguoi ta che AutoPod).

Sua goc trong nao.js: CHOT CHUYEN NGUOI — muon doi sang X tai mot moc thi
trong 0,5s ke tiep X phai ro >=60% cua so va nguoi dang giu hinh gan nhu im
(<=5/25 cua so ro). Vao luot sach thi cua so dau da dat ngay nen ranh khong
suy suyen (do lai: van 0ms).

Ket qua sau sua (moi con so deu do that):
- kiem-nao: 16/16 DAT, ranh van 0ms — va khong con lech.
- stress: 12/12 ca bat buoc DAT, dung 100% moi ca.
- 60 phut / 227 luot: sinh lieu 2.0s, doDb 160ms, nao 10ms — quy mo that
  khong phai van de voi nao (phan Premiere scale van cho lieu that).
- Diem gay bleed: -6.5dB van an tren lieu nay (bao cao, khong hua) —
  nguong tin cay van la -8dB nhu spike.
- Sample rate lan: 10 luot, lech chuan toi da 0ms.
- phoMic don ve nao.js (mot nguon chan ly, panel + bo kiem dung chung).
- sign-install them CONG STRESS: kiem-nao + stress truot la khong cai.

## [0.3.0] - 2026-08-02 19:30 - LAM LAI UI THEO YEU CAU ANH TIEN

Anh Tien: "UI chua dep va truc quan lam". Ba doi chinh:
1. Buoc GAN doi tu "chon track cho tung nguoi" (dropdown kho, dao nguoc
   tu duy) sang BAN DO TRACK nhu mini-timeline Premiere: moi hang = badge
   track + ten clip + chon "cua ai". Track hinh xep NGUOC chi so (V2 tren
   V1 — dung thu tu Premiere), track tieng xep xuoi. Dung theo chinh cau
   anh mo ta viec: "track nao la cam ai, track nao la mic ai".
2. Moi nguoi mot MAU (xanh duong, tim, teal, vang...) chay xuyen suot:
   chip nguoi -> vien trai hang track -> minh hoa -> thanh ket qua.
   Mau chi lam cham/vien (khong bat ai doc mau), chu luon di kem. Bang mau
   rieng cho DINH DANH, khong dung mau ngu nghia cua he (accent/ok/warn).
3. Ket qua them thanh "AI NOI BAO NHIEU" chia theo thoi luong tung nguoi.

Do that tren panel that (cong 8094):
- Smoke test qua DUONG UI MOI (ganTrack -> dungBan): 10 luot, 1:29,
  thanh chia 44.9%/55.1%, "Nguoi 1 — 5 luot 0:40 / Nguoi 2 — 5 luot 0:49"
  — khop dap an (A 38s loi + nghi ~0:40, B 47s + nghi ~0:49).
- Nho buoc gan theo sequence chay that: ve nguon la ban do tu dien lai
  dung 5 hang (V2=Nguoi 2, V1=Nguoi 1, A1=trong, A2=Nguoi 1, A3=Nguoi 2).
- Hinh hoc: khong tran ngang; select 28 / CTA 34 / chip 24 (dung 3 bac
  token); vien hang dung mau nguoi da gan.
- node --check script truoc khi cai (bai hoc 16:00 — lan nay bat truoc).
- Da don 2 ban dung thu trung; project test con: nguon + 1 ban dung dung.

## [0.2.0] - 2026-08-02 18:30 - DOI DANG DAU RA THEO PHAN HOI ANH TIEN + 2 CHOT AN TOAN

Anh Tien bam thu v0.1.0 va bao "hinh nhu dang bi sai sai": ban dung ra
1 LUOT (Nguoi 1: 1, Nguoi 2: 0) va "timeline cua anh phai duoc CAT theo
ban dung — cam va voice nguoi nao noi thi cut do". Do trang thai panel
qua cong 8094 thi ra HAI tang nguyen nhan, ca hai da sua va do lai:

1. GAN NHAM TIENG CAM LAM MIC (loi UX cua tool, khong phai loi anh):
   anh gan mic Nguoi 1 = A1 — chinh la tieng cua camA (tone keu lien tuc).
   Nao nghe "mot nguoi noi suot" -> 1 luot. Tool con bao THANH CONG em ru
   (dung bai hoc 5g). Sua:
   - Chot an toan 1: do PHO am luong tung mic truoc khi nghe — "mic" co
     p90-p10 < 6dB va p50 > -50dB la am luong deu suot (tieng cam / nhac
     nen) -> CHAN, chi ro ten nguoi + track. DO THAT: tai hien dung thao
     tac cua anh -> panel chan voi cau "Mic cua Nguoi 1 (track A1)...".
   - Chot an toan 2: nao nghe ra <2 luot -> chan va giai thich (ca tap
     mot nguoi noi = gan nhu chac gan sai).
   - Sua kem: ten WAV tam doi tu "mic0/mic1" (theo so thu tu) sang bam
     theo DUONG DAN nguon — truoc do doi buoc gan la tai dung nham tieng
     da tach cua track cu.
2. DANG DAU RA SAI CHUAN NGHE: v0.1 don phang ve V1/A1 cua sequence moi.
   Chuan nghe (AutoPod cut tai cho, giu cau truc track) va y anh: ban
   dung phai NHIN NHU TIMELINE CUA MINH BI CAT. Kien truc moi:
   pc_nhanBan (clone sequence nguon — giu settings/so track/ten track —
   roi go sach clip) -> pc_datHinh (tung doan ve DUNG TRACK GOC cua cam,
   DUNG VI TRI goc, khong don) -> pc_donTieng -> pc_datTieng (mic ve
   dung track goc cua mic). Van la ban SAO — ban goc khong dung toi.

DO THAT tren panel that (cong 8094, moc xong = nut hien lai, bai 5f):
- Bai am tinh: gan tieng cam lam mic -> CHAN dung cau, khong dung gi.
- Bai duong tinh: gan dung -> "Podcast Cut (3)": 10 luot (5+5), 1:29.
  Thuoc ngoai do tung clip: V0 = 5 doan camA dung vi tri dap an, V1 = 5
  doan camB, A1/A2 = mic dung nguoi dung track, ranh khop tung frame,
  duoi dem <=0.08s nhu thiet ke.
- Da xoa 4 sequence thu hong/cu trong project test (2 ban 1-luot, 1 ban
  dang phang v0.1, 1 ban spike trung) — giu nguon + ban dung dung.

Bay moi ghi vao skill adobe-cep-panel:
- ☠️ $.evalFile co the NUOT FILE GIUA CHUNG khong bao loi — ham dinh
  nghia truoc diem dut ton tai, ham sau van la BAN CU. Trieu chung: ham
  moi chay, ham cuoi file tra dinh dang cu. Chan: ham pc_phienBan() dat
  CUOI FILE, panel kiem sau moi lan nap, khop moi chay.
- Sua panel xong PHAI node --check script truoc khi cai — mot lan Edit
  them .then( quen dong ngoac lam chet ca trang (da dinh 16:00).

## [0.1.0] - 2026-08-02 17:00 - PANEL DUNG XONG, DUONG MULTICAM DO THAT TREN PREMIERE

Anh Tien: "roi vao viec di em". Tu mong den ban cai duoc trong mot phien.

Da lam:
- NAO (dist/nao.js — THUAN nhu amluong.ts, khong dung Node/CEP) + bo kiem
  tests/kiem-nao.mjs co SEED: 16/16 DAT. Bleed -16/-8dB: 10/10 luot, ranh
  lech dap an 0ms, cau chen 0,6s bi nuot, 3 mic chay dung. Bleed -5dB:
  gay an toan — tra KHONG_PHAN_BIET, khong doan bay.
- HOST host/podcast.jsx: pc_trangThai / pc_thongTinSeq / pc_batDau /
  pc_themDoan / pc_donTieng / pc_themTieng / pc_doKetQua. Ghi theo LO ~20
  doan de bao tien do; chot kiem SEQ_DOI moi lo (nguoi dung bam sang
  sequence khac giua chung la DUNG NGAY, khong ghi nham cho).
- PANEL dist/index.html: song ngu VI/EN, buoc GAN cam/mic tung nguoi
  (anh chot: nguoi dung tu chon, khong doan theo thu tu track), mot CTA,
  minh hoa quet MOT lan roi dung. Soi 300px khong tran ngang.
- SPIKE #3 DO THAT tren Premiere Beta dang mo — qua cong 8089 cua panel
  anh em ($.evalFile podcast.jsx tu Autocut), KHONG can cai / restart:
  sinh lieu tong hop co dap an (tests/sinh-lieu-media.mjs -> "file pr for
  test/podcast-lieu/": camA do/camB xanh + tone 300/600Hz lam bay,
  micA/micB WAV 89s 10 luot). Ket qua dung 10 doan:
    10/10 clip hinh dung cam dung nguoi, ranh khop dap an tung frame
    don tieng cam 10 -> 0 (hinh nguyen 10/10 — remove khong keo hinh)
    10/10 tieng mic dung nguoi, ranh hinh-tieng khop tuyet doi
    daiThat = 89.000 dung bang lieu goc
- ☠️ BAY MOI TIM RA (suyt thanh loi ban): item WAV luu in/out HUT xuong
  luoi ~0.025s (setOutPoint(8.4) -> luu 8.375; 14.8 -> 14.7814), dat len
  track lai tron XUONG khung hinh -> clip tieng co the HUT 1 khung so voi
  hinh (do duoc: clip dau 8.360 vs 8.400). Sua goc: DEM out +0.05s va dat
  tuan tu tang — clip sau de dung ranh nen duoi dem tu bi cat. Gia con
  lai: clip CUOI du toi da 0.05s duoi tieng phong (do that: 89.040) —
  chon DU thay vi HUT vi hut la mat loi nguoi noi.
- Cai ban dev: scripts/sign-install.ps1 (TU CHAY bo kiem nao truoc khi ky
  — truot la khong cai). Da cai vao CEP extensions. Cong debug 8094.
  Panel hien sau khi TAT HAN Premiere roi mo lai.
- Dung san sequence "PodTest Nguon" trong project test dang mo (V1=camA
  V2=camB A1=tieng-cam A2=micA A3=micB) — restart xong la bam thu duoc.

Chua lam / cho (co y):
- Chua bam thu tren PANEL THAT (cho restart Premiere): duong FFmpeg tach
  WAV trong panel chua do end-to-end (lenh giong het Autocut, rui ro thap).
- Van CAN lieu podcast THAT cua anh Tien de do bleed thuc te (lieu tong
  hop chua co: noi chong nhau, cuoi, u-o dem) — chua do thi chua hua.
- FFmpeg dang MUON cua Transcripts/Autocut (nhu Re-Frames) — ban ban se
  tinh chuyen bundle sau.

## [0.1.0-spike] - 2026-08-01 - NAO "AI DANG NOI" CHAY, cham diem bang dap an

Anh Tien: "em phai lam auto podcast di em" — khong cho lieu that nua. Che
LIEU TONG HOP CO DAP AN: giong Gnostic = A, giong Machine = B, 10 luot xen ke
(5-15s) theo kich ban biet truoc, tron bleed gia mic thu cheo.

Thuat toan: RMS cua so 20ms tung mic -> so chenh dB (nguong 6dB) + hysteresis
+ nuot luot <1s. ~80 dong JS thuan, khong ML.

| Bleed (mic thu cheo) | Ket qua |
|---|---|
| -16dB (phong tot) | 10/10 luot · **100%** cua so dung · lech ranh **0ms** |
| -8dB (mic gan nhau) | 10/10 · 100% · 0ms |
| **-5dB (duoi nguong 6dB)** | **0 luot — GAY AN TOAN**: khong doan bay, tra "khong phan biet duoc" |

Ket luan ky thuat:
- Setup podcast binh thuong (tach mic 10-20dB) -> nao du chinh xac tuyet doi.
- Diem gay = nguong 6dB. Panel PHAI bao "hai mic giong nhau qua — kiem tra
  thu am" thay vi im lang. V2: nguong TU DO theo bleed thuc (do luc solo).
- ☠️ Lieu tong hop chua co: NOI CHONG LOI (2 nguoi noi cung luc), cuoi, u-o.
  Van can lieu THAT cua anh Tien de do truoc khi hua chat luong.

Ke tiep: host pc_thongTinSeq + pc_dungMulticam (duong overwriteClip da chung
minh) + panel buoc GAN track (anh chot: nguoi dung tu gan cam/mic).

## [0.0.0] - 2026-08-01 - DAT MONG, CHUA CO CODE

Anh Tien giao: "tiep theo la podcast tool nha em".

Da lam:
- CLAUDE.md: kien truc du kien — nao "ai dang noi" = so sanh nang luong
  N kenh mic (amluong.ts co san), dung sequence moi bang duong overwriteClip
  da chung minh (rf_ghepDoan 94 doan lech 0,01s). Doi thu: AutoPod $29/thang.
- Danh cho: com.aiostudio.podcast · cong 8094.
- 3 spike phai lam truoc khi xay (do bleed giua mic la cai QUYET DINH kha thi
  — phai co du lieu podcast nhieu mic THAT de do).
- 4 cau hoi san pham gui anh Tien.

## [0.0.1] - 2026-08-01 - ANH TIEN CHOT 4 QUYET DINH

1. Mic RIENG tung nguoi (khong ML).
2. Nguoi dung TU GAN track = cam ai / mic ai (khong doan thu tu).
3. MVP = CAT DUNG truoc, chua can dep: ai noi -> cam nguoi do + AUDIO nguoi
   do. Khong luat wide o v1. Chi giu nguong gop ky thuat ~1s chong nhap nhay.
4. Gia dinh da sync bang Premiere Synchronize.

CHO ANH TIEN: mot sequence podcast THAT da sync (>=2 cam + >=2 mic, vai phut)
de spike do BLEED giua mic — cai quyet dinh kha thi, khong co lieu that thi
khong hua gi.

Chua lam (co y): code — cho vat lieu spike.
