# AiO Autocut 1.6.0 - 2026-08-19

Ban nay CHI CO Autocut, khong phai ca bo 3 panel nhu ban beta 14/08.
Muc dich: anh Tien cai thu sau dot sua lon ngay 19/08.

## Ban nay co gi
- File phat: `AiO-Studio-Autocut-1.6.0-SETUP.zip` (46,0 MB)
  SHA-256 dau: `553c2a752ac9`
- Giai nen -> bam dup `CAI-DAT.bat`. Khong can ZXP Installer, khong can Admin.
- **KEM FFmpeg** trong goi (khac ban beta 14/08 dung kho chung) — de may SACH
  cai la chay duoc ngay, dung thu dang can kiem.

| Panel | Goi | Phien ban |
|---|---|---|
| AiO Autocut | AiO-Studio-Autocut-1.6.0.zxp | **1.6.0** (tu 1.5.0) |

## Diem noi bat cua ban nay
Bon loi anh Tien bat khi test that, deu do va sua tren Premiere:
1. **O "Doan dang chon" dung im** khi bam I/O tren timeline. Panel gio tu hoi
   Premiere moi giay bang mot ham host nhe (1 ms), chi hoi ham nang khi moc doi.
2. **Doi vung giua chung ma van cat theo vung CU** — luong treo o buoc xem truoc
   om nguyen diem cat cu. Nay doi vung thi HUY han, bao "bam lai".
3. **Man xem truoc ve CA FILE** thay vi vung da khoanh. Nay gop dung moi manh
   trong vung, ke ca khi vung gom nhieu clip tu NHIEU FILE khac nhau.
4. **UI man 24 inch**: nguong hai cot 900px -> 700px. Panel 728x1062 truoc day
   roi ve mot cot, nut chinh nam o 82% man hinh; nay 2 cot, nut o 31%.

Kem theo:
- Them **o chon sequence** tren thanh vung (chon la MO sequence do ra, khong
  phai cat tu xa — cat vao thu dang khuat la moi goi tai nan)
- Go dong do "so do khong khop" + khoi "Chi tiet ky thuat" (anh Tien chot)
- "Noi dat ket qua" gon lai thanh thanh 2 nut (199px -> 97px)
- Ba muc cat dich sang EN: **Light / Medium / Aggressive**
- Danh sach xo cua o chon het nen trang (them `color-scheme: dark`)

## Da kiem chung bang so (tren Premiere that, sequence TU DUNG roi tu xoa)
- Chay TRON mot lan cat: 6 nhat cat, vung 30s - 3,3s -> sequence **26,720s**,
  Hinh/Tieng **7/7 clip cung ket 26,720s**, **ho 0 cho**
- Nghe hieu chay THAT (da doi ten bo dem di): 1,5s -> **8,1s**; bo dem moi sinh
  co **md5 giong het** ban goc
- Vung tu HAI FILE khac nhau: Original **30 sec** (= 15+15), ket qua 6 clip /
  28,240s / ho 0. Hai bo dem nghe **809 vs 2974 bytes** => noi dung khac nhau that
- Ban EN: quet text node con **3 chuoi** tieng Viet, ca ba **hop le** (ten
  project 2 cho + tooltip nut ngon ngu co y)
- Noi dung goi: 16 file, **khong** co `.debug`, **co** ffmpeg.exe, **co** giay
  phep LGPL + THIRD-PARTY, manifest ghi **1.6.0**

## CHUA kiem - phai lam truoc khi gui ra ngoai
- [ ] Cai that tren **MAY SACH** bang chinh file zip nay
- [ ] SmartScreen: xac nhan chi hoi mot lan "More info -> Run anyway"
- [x] ~~Chua chung minh duoc tool khong cat mat loi~~ **DA GIAI 19/08**: anh
      Tien tu dung mot bai that roi NGHE LAI, khong mat loi — *"anh thay rat
      okie... khong co gi de che"*. Day chinh la thuoc do TU NGOAI ma muc nay
      doi tu thang 7; hoa ra khong can Silero VAD, chi can de chinh nguoi dung
      dung mot bai that.
      ⚠️ **Pham vi da xac nhan:** talking-head MOT nguoi, giong Viet, thu gan
      mic. CHUA do lai sau khi dat: hai nguoi + mot nguoi ngoi xa mic (tung cat
      mat **249 cau** o ban 0.7.0) · clip co nhac nen · video dai tren 30 phut.
- [ ] Toc do: video 1 gio van ~19 phut (buoc dung an 83%)

## Luat cua ngan Release
Moi ban mot thu muc theo ngay, KHONG BAO GIO ghi de ban cu — tester bao loi
"ban thu Sau" la con file ho cam ra doi chieu duoc.
