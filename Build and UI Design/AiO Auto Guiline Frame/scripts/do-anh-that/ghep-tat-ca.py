# ghep-tat-ca.py — ghep guide-<id>.png (do harness ve) len anh app that theo manifest.json, ra ghep-<id>.jpg + montage
# Dung: python ghep-tat-ca.py <manifest.json> <thu-muc-guide-png> <thu-muc-ra>
import json, os, sys, subprocess
from PIL import Image
mf, thuGuide, thuRa = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(thuRa, exist_ok=True)
ds = json.load(open(mf, encoding='utf-8'))
ghep = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ghep-app.py')
ra = []
for d in ds:
    g = os.path.join(thuGuide, f"guide-{d['id']}.png")
    if not os.path.exists(g): print('thieu', g); continue
    out = os.path.join(thuRa, f"ghep-{d['id']}.jpg")
    x0, y0, x1, y1 = d['rect']
    r = subprocess.run([sys.executable, ghep, d['anh'], g, out, str(x0), str(y0), str(x1), str(y1), d.get('mapping', 'fill')], capture_output=True, text=True)
    print(d['id'], '->', r.stdout.strip() or r.stderr.strip()[-200:])
    if os.path.exists(out): ra.append((d['id'], out))
# montage: moi anh cao 900 px, xep ngang, 5 anh/hang
if ra:
    cao = 900; ths = []
    for id_, p in ra:
        im = Image.open(p).convert('RGB'); w = int(im.width * cao / im.height); ths.append((id_, im.resize((w, cao))))
    hang = [ths[i:i + 5] for i in range(0, len(ths), 5)]
    W = max(sum(t.width for _, t in h) + 10 * (len(h) - 1) for h in hang); H = cao * len(hang) + 10 * (len(hang) - 1)
    mont = Image.new('RGB', (W, H), (30, 30, 30))
    y = 0
    for h in hang:
        x = 0
        for _, t in h: mont.paste(t, (x, y)); x += t.width + 10
        y += cao + 10
    mp = os.path.join(thuRa, 'montage.jpg'); mont.save(mp, quality=85); print('montage:', mp, mont.size)
