# gif-gen.py <tien_to_khung> <so_khung> <ra.gif> [ms_moi_khung]  (nen TRANG: o gan trang -> 255,255,255; bo hang cuoi bi lam tron)
from PIL import Image
import os, sys
pre, N, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
ms = int(sys.argv[4]) if len(sys.argv) > 4 else 80
frames = [Image.open('%s-%02d.png' % (pre, k)).convert('RGB') for k in range(N)]
frames = [f.crop((0, 0, f.size[0], f.size[1] - 1)) for f in frames]
w, h = frames[0].size
pick = sorted(set(int(i * (N - 1) / 11) for i in range(12)))
sample = Image.new('RGB', (w * 4, h * 3))
for i, k in enumerate(pick):
    sample.paste(frames[k], ((i % 4) * w, (i // 4) * h))
pal = sample.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
p = pal.getpalette()
q = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
for i in range(256):
    if min(p[i*3:i*3+3]) >= 249: p[i*3:i*3+3] = [255, 255, 255]
for im in q: im.putpalette(p)
q[0].save(out, save_all=True, append_images=q[1:], duration=[ms] * N, loop=0, optimize=False, disposal=1)
g = Image.open(out); tot = 0
for s in range(g.n_frames):
    g.seek(s); tot += g.info.get('duration', 0)
g.seek(0); r = g.convert('RGB')
print(out, os.path.getsize(out) // 1024, 'KB', g.size, 'khung gop', g.n_frames, 'tong', tot, 'ms | goc', r.getpixel((0, 0)), r.getpixel((w - 1, h - 1)))
