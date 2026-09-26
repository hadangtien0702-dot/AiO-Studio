# Ghep anh guide (1080x1920, RGBA, do panel ve) LEN anh chup man hinh that (1290x2796) theo dung
# cach YouTube Shorts tren iPhone hien video 9:16: PHU KIN chieu cao vung video (0..navTop), cat hai mep.
# Dung: python ghep-shorts.py <guide.png> <ra.png> [navTop]
import sys
from PIL import Image, ImageDraw
S = Image.open(r"<duong-dan-anh-chup>").convert("RGBA")
G = Image.open(sys.argv[1]).convert("RGBA")
ra = sys.argv[2]
W, H = S.size
px = S.load()

def phang(y):
    vals = [sum(px[x, y][:3]) / 3 for x in range(0, W, 4)]
    m = sum(vals) / len(vals); v = (sum((a - m) ** 2 for a in vals) / len(vals)) ** 0.5
    return m < 40 and v < 12
# navTop = hang dau tien cua chuoi >= 10 hang den phang trong khoang 60%..97% chieu cao
navTop = int(sys.argv[3]) if len(sys.argv) > 3 else None
if navTop is None:
    chuoi = 0
    for y in range(int(H * .6), int(H * .97)):
        chuoi = chuoi + 1 if phang(y) else 0
        if chuoi >= 10: navTop = y - 9; break
Hv = navTop
scale = Hv / 1920.0
dispW = int(round(1080 * scale))
xOff = int(round((W - dispW) / 2.0))
G2 = G.resize((dispW, Hv), Image.LANCZOS)
out = S.copy()
out.alpha_composite(G2, (xOff if xOff >= 0 else 0, 0), (0 if xOff >= 0 else -xOff, 0))
d = ImageDraw.Draw(out)
d.line([(0, navTop), (W, navTop)], fill=(0, 255, 0, 255), width=3)
# ghi chu mapping
d.rectangle([0, 0, W, 60], fill=(0, 0, 0, 160))
d.text((16, 14), f"navTop={navTop} ({100*navTop/H:.1f}%)  video 1080x1920 -> {dispW}x{Hv}, cat moi mep {(-xOff)} px ({100*(-xOff)/dispW:.1f}% be rong nguon)", fill=(255, 255, 255, 255))
out.convert("RGB").resize((W // 2, H // 2), Image.LANCZOS).save(ra, quality=90)
print("ra:", ra, "| navTop", navTop, "| scale", round(scale, 4), "| dispW", dispW, "| xOff", xOff, "| crop moi mep px nguon:", round(-xOff / scale, 1))
