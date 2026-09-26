# Ghep anh guide (1080x1920 RGBA do panel ve) LEN anh chup app that — dung chung cho MOI app.
# Dung: python ghep-app.py <anh-chup> <guide.png> <ra.jpg> <x0> <y0> <x1> <y1> <mapping>
#   x0,y0,x1,y1 = hinh chu nhat VUNG VIDEO tren anh chup (px), do bang script do-anh cua app do
#   mapping = fill  (video 9:16 phu kin CHIEU CAO vung, cat 2 mep — YouTube Shorts iPhone)
#           | fit   (video vua BE RONG vung, letterbox tren/duoi)
#           | khit  (video vua khit vung, co the meo nhe)
# In ra ti le + offset de doi chieu, luu anh ghep thu nho 1/2.
import sys
from PIL import Image, ImageDraw
anh, guide, ra = sys.argv[1], sys.argv[2], sys.argv[3]
x0, y0, x1, y1 = [int(float(v)) for v in sys.argv[4:8]]
mapping = sys.argv[8] if len(sys.argv) > 8 else 'fill'
S = Image.open(anh).convert("RGBA"); G = Image.open(guide).convert("RGBA")
W, H = S.size; vw, vh = x1 - x0, y1 - y0
if mapping == 'fill':
    k = vh / 1920.0; dw, dh = int(round(1080 * k)), vh; ox, oy = x0 + int(round((vw - dw) / 2.0)), y0
elif mapping == 'fit':
    k = vw / 1080.0; dw, dh = vw, int(round(1920 * k)); ox, oy = x0, y0 + int(round((vh - dh) / 2.0))
else:
    dw, dh = vw, vh; ox, oy = x0, y0; k = vh / 1920.0
G2 = G.resize((dw, dh), Image.LANCZOS)
out = S.copy()
# dan co cat: phan guide nam ngoai anh thi bo
sx, sy = (0 if ox >= 0 else -ox), (0 if oy >= 0 else -oy)
out.alpha_composite(G2, (max(ox, 0), max(oy, 0)), (sx, sy))
d = ImageDraw.Draw(out)
d.rectangle([x0, y0, x1 - 1, y1 - 1], outline=(0, 255, 0, 255), width=3)
d.rectangle([0, 0, W, 54], fill=(0, 0, 0, 170))
d.text((12, 12), f"vung video ({x0},{y0})-({x1},{y1}) {vw}x{vh} | mapping {mapping} | guide -> {dw}x{dh} tai ({ox},{oy}) | k={k:.4f} px man/px nguon", fill=(255, 255, 255, 255))
out.convert("RGB").resize((max(1, W // 2), max(1, H // 2)), Image.LANCZOS).save(ra, quality=90)
print("ra:", ra, "| k", round(k, 4), "| guide", dw, "x", dh, "tai", ox, oy, "| cat moi mep px nguon:", round(max(0, -(ox - x0)) / k, 1) if mapping == 'fill' else 0)
