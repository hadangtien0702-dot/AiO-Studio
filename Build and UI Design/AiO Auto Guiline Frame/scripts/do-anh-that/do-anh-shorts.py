# Do anh chup YouTube Shorts (iPhone 1290x2796) - PIL thuan, khong numpy
# Muc tieu: navTop, videoBottom, hang icon tren, cot icon phai, khoi chu duoi,
# va tra loi: co HINH video ben duoi y=2293 (9:16 vua be rong) khong?
import sys, json
from PIL import Image

PATH = r"C:\Users\DRT-G21\.claude\uploads\22c25863-58eb-46cb-954e-967b3f8484e5\917a4ab8-image.png"
im = Image.open(PATH).convert("RGB")
W, H = im.size
px = im.load()

def is_white(p):
    r, g, b = p
    return min(r, g, b) >= 225 and (max(r, g, b) - min(r, g, b)) <= 30

def is_grey(p):  # icon mo (Phoi lai)
    r, g, b = p
    return 120 <= min(r, g, b) and max(r, g, b) <= 200 and (max(r, g, b) - min(r, g, b)) <= 20

def is_black(p, t=4):
    return max(p) <= t

def is_navbg(p):  # nen thanh dieu huong YouTube dark = #0F0F0F
    return all(13 <= c <= 17 for c in p)

# ---------- 1. Ho so theo HANG: ti le den thuan, so pixel trang ----------
row_black = [0] * H
row_white = [0] * H
row_mean = [0.0] * H
for y in range(H):
    nb = nw = 0
    s = 0
    for x in range(W):
        p = px[x, y]
        s += p[0] + p[1] + p[2]
        if is_navbg(p):
            nb += 1
        elif is_white(p):
            nw += 1
    row_black[y] = nb / W
    row_white[y] = nw
    row_mean[y] = s / (3 * W)

# navTop: tu duoi len, hang dau tien ma ti le den thuan < 0.6 (icon nav van de lai >= 0.75 den)
# => tim doan lien tuc tu day len co black >= 0.6
navTop = H
for y in range(H - 1, -1, -1):
    if row_black[y] >= 0.6:
        navTop = y
    else:
        break
print("navTop (hang dau cua khoi den phang lien tuc toi day):", navTop)
print("Ho so quanh navTop (y, black%, mean, white):")
for y in range(navTop - 12, min(H, navTop + 6)):
    print(f"  {y}: black={row_black[y]:.3f} mean={row_mean[y]:.1f} white={row_white[y]}")

# ---------- 2. videoBottom: hang cuoi cung con HINH video ----------
# Do o dai cot trai x=0..44 (khong co UI: nut 'Chia se video cua ban' bat dau x~49)
def strip_stats(x0, x1, y0, y1):
    vals = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            p = px[x, y]
            vals.append((p[0] + p[1] + p[2]) / 3)
    n = len(vals)
    m = sum(vals) / n
    var = sum((v - m) ** 2 for v in vals) / n
    uniq = len(set(px[x, y] for y in range(y0, y1) for x in range(x0, x1)))
    return {"mean": round(m, 2), "std": round(var ** 0.5, 2), "uniqueColors": uniq, "n": n}

print("\nDai cot trai x=0..44, tung khoang y:")
bands = [(0, 60), (60, 130), (1000, 1100), (2200, 2293), (2293, 2380), (2380, 2480), (2480, 2540), (2540, navTop), (navTop, navTop + 40), (2700, 2790)]
for (a, b) in bands:
    if a >= b or b > H:
        continue
    print(f"  y {a}-{b}: {strip_stats(0, 45, a, b)}")

print("\nDai cot giua nut va cot icon x=1100..1140, tung khoang y:")
for (a, b) in [(2293, 2380), (2380, 2480), (2480, 2540)]:
    print(f"  y {a}-{b}: {strip_stats(1100, 1140, a, b)}")

# videoBottom = hang cuoi (tu tren xuong) o cot trai ma std cua 45 pixel > 1.0 hoac co pixel khong den
videoBottom = None
for y in range(navTop - 1, 2000, -1):
    vals = [px[x, y] for x in range(0, 45)]
    nonblack = sum(1 for p in vals if not is_navbg(p))
    if nonblack >= 10:
        videoBottom = y
        break
print("\nvideoBottom (hang cuoi cot trai x0..44 con >=10 pixel khong den):", videoBottom)
print("Ho so cot trai quanh videoBottom:")
for y in range(navTop - 8, navTop + 2):
    vals = [px[x, y] for x in range(0, 45)]
    nonblack = sum(1 for p in vals if not is_navbg(p))
    mx = max(max(p) for p in vals)
    print(f"  {y}: notNavBg={nonblack}/45 maxCh={mx} sample={vals[0]} {vals[20]} {vals[44]}")

# ---------- 3. Hang cluster trang trong mot vung ----------
def clusters_rows(x0, x1, y0, y1, pred, minCount=3, gap=6):
    rows = []
    for y in range(y0, y1):
        c = sum(1 for x in range(x0, x1) if pred(px[x, y]))
        rows.append((y, c))
    out = []
    cur = None
    lastY = None
    for y, c in rows:
        if c >= minCount:
            if cur is None:
                cur = [y, y]
            elif y - lastY > gap:
                out.append(tuple(cur)); cur = [y, y]
            else:
                cur[1] = y
            lastY = y
    if cur:
        out.append(tuple(cur))
    return out

def xrange_of(x0, x1, y0, y1, pred):
    xs = [x for y in range(y0, y1 + 1) for x in range(x0, x1) if pred(px[x, y])]
    return (min(xs), max(xs)) if xs else None

print("\n--- Thanh tren (y 0..320), pixel trang, toan be rong ---")
top = clusters_rows(0, W, 0, 320, is_white)
for (a, b) in top:
    print(f"  hang {a}-{b}: x {xrange_of(0, W, a, b, is_white)}")
# tach tung icon theo cot trong hang icon thu 2
if len(top) >= 2:
    a, b = top[1]
    cols = [x for x in range(W) if any(is_white(px[x, y]) for y in range(a, b + 1))]
    # gom cot
    grp = []
    for x in cols:
        if grp and x - grp[-1][1] <= 12:
            grp[-1][1] = x
        else:
            grp.append([x, x])
    print("  cac cum cot trong hang icon tren:", grp)

print("\n--- Cot icon phai (x 1100..1290, y 1380..navTop), trang ---")
rail = clusters_rows(1100, W, 1380, navTop, is_white)
for (a, b) in rail:
    print(f"  hang {a}-{b} (cao {b-a+1}): x {xrange_of(1100, W, a, b, is_white)}")
print("--- Cot icon phai, XAM (icon mo) ---")
railg = clusters_rows(1100, W, 1380, navTop, is_grey, minCount=5)
for (a, b) in railg:
    print(f"  hang {a}-{b} (cao {b-a+1}): x {xrange_of(1100, W, a, b, is_grey)}")
xr = xrange_of(1100, W, 1380, navTop, lambda p: is_white(p) or is_grey(p))
print("  x0,x1 toan cot (trang+xam):", xr)

print("\n--- Khoi chu duoi (x 0..1100, y 1900..navTop), trang ---")
bot = clusters_rows(0, 1100, 1900, navTop, is_white)
for (a, b) in bot:
    print(f"  hang {a}-{b} (cao {b-a+1}): x {xrange_of(0, 1100, a, b, is_white)}")
# pill 'So lieu phan tich' + nut 'Chia se video cua ban': nen xam mo -> do bang pixel xam nhat (min>=60, lech<=12, max<=110)
def is_pillbg(p):
    r, g, b = p
    return 55 <= min(r, g, b) and max(r, g, b) <= 120 and (max(r, g, b) - min(r, g, b)) <= 12
print("--- Nen pill/nut (xam 55..120) trong x 0..1100 ---")
pills = clusters_rows(0, 1100, 1900, navTop, is_pillbg, minCount=60)
for (a, b) in pills:
    print(f"  hang {a}-{b} (cao {b-a+1}): x {xrange_of(0, 1100, a, b, is_pillbg)}")

# avatar xanh (teal) o goc trai
def is_teal(p):
    r, g, b = p
    return g > r + 40 and b > r + 20 and g >= 110
print("--- Avatar teal (x 0..200) ---")
av = clusters_rows(0, 200, 1900, navTop, is_teal, minCount=5)
for (a, b) in av:
    print(f"  hang {a}-{b}: x {xrange_of(0, 200, a, b, is_teal)}")

# ---------- 4. Thanh trang thai ----------
print("\n--- Thanh trang thai (y 0..140) ---")
sb = clusters_rows(0, W, 0, 140, is_white)
print("  hang trang:", sb)

# ---------- 5. Quy doi 1080x1920 ----------
print("\n=== QUY DOI ===")
vis_h = navTop  # video hien tu y=0 toi navTop
print("Vung nhin thay: 1290 x", vis_h, "= ti le", round(W / vis_h, 4), "(9:16 =", round(9 / 16, 4), ")")
# Gia thiet A: video 9:16 FILL chieu cao vung nhin thay
sA = vis_h / 1920
wA = 1080 * sA
cropA = (wA - W) / 2
print(f"A fill-height: scale={sA:.4f}, be rong video tren man={wA:.1f}, cat moi ben {cropA:.1f}px man = {cropA/sA:.1f}px/1080")
# Gia thiet B: video 9:16 FIT be rong
sB = W / 1080
hB = 1920 * sB
print(f"B fit-width: scale={sB:.4f}, cao={hB:.1f}, day video o y={hB:.1f} (neu can tren), letterbox {vis_h-hB:.1f}px")
json.dump({"W": W, "H": H, "navTop": navTop, "videoBottom": videoBottom, "top": top, "rail": rail, "railGrey": railg, "bot": bot, "pills": pills, "avatar": av, "statusBar": sb}, open(sys.argv[1] if len(sys.argv) > 1 else "ket-qua.json", "w"), indent=1)
