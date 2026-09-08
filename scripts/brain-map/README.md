# Ban do Brain — song

Ve lai TOAN BO brain thanh mot ban do tron, doc THANG tu file that moi 5 giay.
Khong co du lieu chep tay: dong nao tren man hinh cung lay tu `~/.claude` va
`E:\2026\Production`.

## Chay

```
node "E:\2026\Production\AiO Studio\scripts\brain-map\quet-brain.mjs"
```

Roi mo http://localhost:8097

May chu bind `0.0.0.0` nen **dien thoai / may tinh bang cung mang WiFi** mo duoc
bang `http://<IP-may-tinh>:8097` (lay IP: `ipconfig`).

## No doc gi

| Nut tren ban do | Lay tu |
|---|---|
| NGUYEN TAC | `~/.claude/CLAUDE.md` — cac bai khong bat dau bang so 5 |
| DO LUONG | `~/.claude/CLAUDE.md` — cac bai `5x` |
| SKILL | `~/.claude/skills/*/SKILL.md` |
| THIET KE | `~/.claude/skills/design-lessons/LESSONS.md` — moi muc `##` |
| NGAN NHO | `~/.claude/projects/*/memory/*.md` (doc ca frontmatter) |
| DU AN | moi thu muc co `CLAUDE.md` duoi `E:\2026\Production` (sau toi da 3 tang) |

## Hai loai day noi — day la phan "chung no noi chuyen voi nhau"

- **Day cam (ho hang)**: bai hoc nay trich dan bai hoc kia trong chinh noi dung
  (`cung ho 5k`, `ho hang 5ah`, `luat 5q`...). Co cham chay doc day.
- **Day vang dut net (vap o du an)**: bai hoc do duoc rut ra tu du an nao.

## Thao tac

- Lan chuot / chum hai ngon = phong · keo = di · cham hai lan = phong nhanh
- Bam mot nut = mo bang chi tiet (noi dung that + so dong trong file goc)
- Bam mau o chu giai = an/hien ca cum
- O tim = loc theo ten VA theo noi dung bai hoc

## Cot "Suc khoe brain"

Tu do lay, khong phai danh gia cam tinh:
loi tat brain con song khong · hook `Stop` con khong · lenh `/brain` `/xong` con
khong · du an nao thieu `PROGRESS.md` · ngan nho nao con ket o `G:` · **ma bai hoc
co bi trung khong** · bao nhieu bai chua kem so do.

## Bay da vap khi lam cai nay

1. `new URL(import.meta.url).pathname` giu nguyen `%20` khi duong dan co DAU CACH
   → 404. Phai dung `fileURLToPath`.
2. `setPointerCapture` nem loi thi cuon phang doan lap trang thai chum hai ngon
   nam sau no → dien thoai khong phong duoc. Lap trang thai TRUOC, bat con tro SAU.
3. Quat co dinh 52 do lam cum 41 bai bi nhoi trong khi cum 8 bai bo trong →
   chia goc THEO CAN BAC HAI so con.
4. Nhan xep ngang thi chong nhau o vong ngoai → xoay nhan theo phuong ban kinh.
5. `transform.baseVal[0]` la phep TINH TIEN chu khong phai phep phong — doc nham
   no thi tuong zoom khong chay (thuoc sai, khong phai san pham sai).
