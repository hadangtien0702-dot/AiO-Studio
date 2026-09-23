#!/bin/bash
# dong-bo-mac.sh - ban MAC cua dong-bo-may.ps1 (Windows). Viet 21/09/2026.
# Anh Tien co 3 may: cong ty Win (E:), nha Win (D:), nha MAC. Mac khong co
# PowerShell nen 2 script .ps1 (dong-bo-may + dong-bo-brain) khong chay duoc o do.
#
# Cach dung tren Mac (mo Terminal):
#   bash "$HOME/Production/AiO Studio/scripts/dong-bo-mac.sh"             -> keo ve + kiem + bao
#   bash "$HOME/Production/AiO Studio/scripts/dong-bo-mac.sh" --cai-them  -> them: tu npm install cho thieu
#   bash "$HOME/Production/AiO Studio/scripts/dong-bo-mac.sh" --day-brain -> DAY brain len GitHub
#                                                          (thay cho dong-bo-brain.ps1 -Day khi /xong tren Mac)
# Script tu tim repo theo vi tri cua CHINH NO, dat repo o dau cung duoc.
# Viet cho bash 3.2 (ban co san tren macOS): khong dung mang ket hop, khong mapfile.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
CL="$HOME/.claude"
BRAIN="$CL/brain-repo"
NGAY="$(date +%Y%m%d-%H%M)"
CHE_DO="$1"

xanh() { printf '\033[32m%s\033[0m\n' "$*"; }
do_()  { printf '\033[31m%s\033[0m\n' "$*"; }
vang() { printf '\033[33m%s\033[0m\n' "$*"; }

# ---------- CHE DO DAY BRAIN (goi tu /xong buoc 5 khi dang o Mac) ----------
if [ "$CHE_DO" = "--day-brain" ]; then
  [ -d "$BRAIN/.git" ] || { do_ "Chua co $BRAIN - chay script KHONG tham so truoc."; exit 1; }
  git -C "$BRAIN" pull -q origin main
  n=0
  while IFS= read -r f; do
    if [ ! -f "$BRAIN/$f" ] || ! cmp -s "$CL/$f" "$BRAIN/$f"; then
      mkdir -p "$(dirname "$BRAIN/$f")"; cp -p "$CL/$f" "$BRAIN/$f"; n=$((n+1))
    fi
  done < <(cd "$CL" && { [ -f CLAUDE.md ] && echo CLAUDE.md; find skills -type f 2>/dev/null; } | grep -v '\.truoc-dong-bo-')
  # Quyet dinh bang git status, KHONG bang so file vua chep: lan truoc chep xong ma
  # commit hong thi lan nay file da giong nhau (n=0) nhung van CHUA len GitHub.
  git -C "$BRAIN" add -A || { do_ "git add LOI"; exit 1; }
  if [ -n "$(git -C "$BRAIN" status --porcelain)" ]; then
    git -C "$BRAIN" commit -q -m "brain: dong bo tu Mac $(date '+%Y-%m-%d %H:%M')" \
      || { do_ "Commit brain LOI (thieu git user.name/user.email?) - doc thong bao tren."; exit 1; }
  fi
  git -C "$BRAIN" push -q origin main || { do_ "Push brain LOI - doc thong bao tren."; exit 1; }
  # Kiem bang so: sau push, ban tren GitHub phai TRUNG ban may nay
  git -C "$BRAIN" fetch -q origin
  if [ "$(git -C "$BRAIN" rev-parse HEAD)" = "$(git -C "$BRAIN" rev-parse origin/main)" ]; then
    xanh "DAT: brain tren GitHub = may nay ($(git -C "$BRAIN" log -1 --format=%h)), $n file moi chep lan nay."
  else do_ "LECH: GitHub chua co ban cua may nay."; exit 1; fi
  exit 0
fi

echo "Repo: $REPO"

# ---------- 1. KEO CODE MOI VE ----------
vang "[1/5] Keo code moi ve..."
if git -C "$REPO" pull --ff-only; then
  git -C "$REPO" fetch -q origin
  lech="$(git -C "$REPO" rev-list --left-right --count HEAD...origin/main 2>/dev/null)"
  truoc="$(echo "$lech" | awk '{print $1}')"; sau="$(echo "$lech" | awk '{print $2}')"
  if [ "$truoc" = "0" ] && [ "$sau" = "0" ]; then xanh "  DAT: khop GitHub ($(git -C "$REPO" log -1 --format='%h %cd' --date=format:'%d/%m %H:%M'))"
  else do_ "  LECH GitHub: may nay hon $truoc commit, kem $sau commit"; fi
else
  do_ "  git pull LOI - doc thong bao tren (hay gap: sua file chua commit, hoac 'dubious ownership')."
fi

# ---------- 2. KIEM THU MUC KHOP GITHUB ----------
vang "[2/5] Kiem file khop GitHub..."
# git hong thi ls-files ra RONG -> "0 thieu / 0 file" trong nhu DAT. Phai xet ma thoat
# (vap 21/09 luc thu: 'dubious ownership' lam git chet, script van bao DAT 0/0).
if ! ds="$(git -C "$REPO" ls-files 2>/dev/null)" || [ -z "$ds" ]; then
  do_ "  LOI: git khong doc duoc repo - KHONG kiem duoc file"
else
  so_file="$(printf '%s\n' "$ds" | wc -l | tr -d ' ')"
  so_mat="$(git -C "$REPO" ls-files -d | wc -l | tr -d ' ')"
  if [ "$so_mat" = "0" ]; then xanh "  DAT: $so_file/$so_file file co mat"
  else do_ "  THIEU $so_mat/$so_file file (git ls-files -d de xem ten)"; fi
fi

# ---------- 3. KIEM DO CHAY ----------
vang "[3/5] Kiem do chay (node, node_modules)..."
if command -v node >/dev/null 2>&1; then xanh "  DAT: node $(node -v)"
else do_ "  THIEU node - cai tu https://nodejs.org (ban LTS) roi chay lai"; fi
while IFS= read -r pj; do
  d="$(dirname "$pj")"; ten="${d#$REPO/}"
  grep -q '"dependencies"\|"devDependencies"' "$pj" || continue   # vd tests/js chi co {"type":"module"}
  if [ -d "$d/node_modules" ]; then xanh "  DAT: $ten"
  elif [ "$CHE_DO" = "--cai-them" ] && command -v npm >/dev/null 2>&1; then
    vang "  CAI: $ten ..."; (cd "$d" && npm install --no-audit --no-fund >/dev/null 2>&1) && xanh "    xong" || do_ "    LOI npm install"
  else do_ "  THIEU node_modules: $ten (them --cai-them de tu cai)"; fi
done < <(find "$REPO" \( -name node_modules -o -name .next -o -name dist -o -name out -o -name .claude \
           -o -name .wrangler -o -name .git \) -prune -o -name package.json -type f -print)
vang "  LUU Y MAC: FFmpeg + whisper trong bin/ cua cac panel la ban .exe Windows (khong qua git)."
vang "  Autocut, Transcripts, Asset Manager, Power Bins, Podcast, Short Viral, Video Download"
vang "  CHUA chay duoc tren Mac cho toi khi co ban Mac cua cac binary do."

# ---------- 4. LENH /xong /batdau + SCRIPT batdau ----------
vang "[4/5] Dong bo lenh /xong, /batdau, /congty ve may nay..."
mkdir -p "$CL/commands" "$CL/scripts"
for f in "$REPO/.claude/commands/"*.md; do
  [ -f "$f" ] || continue
  dich="$CL/commands/$(basename "$f")"
  if [ -f "$dich" ] && cmp -s "$f" "$dich"; then xanh "  DAT: $(basename "$f")"
  else cp -p "$f" "$dich"; xanh "  DA CHEP: $(basename "$f")"; fi
done
if [ -f "$REPO/scripts/batdau/batdau.mjs" ]; then
  if cmp -s "$REPO/scripts/batdau/batdau.mjs" "$CL/scripts/batdau.mjs" 2>/dev/null; then xanh "  DAT: batdau.mjs"
  else cp -p "$REPO/scripts/batdau/batdau.mjs" "$CL/scripts/batdau.mjs"; xanh "  DA CHEP: batdau.mjs"; fi
fi
if ! grep -q SessionStart "$CL/settings.json" 2>/dev/null; then
  vang "  THIEU hook SessionStart -> dau phien Claude KHONG tu doc PROGRESS.md."
  vang "  Lap 1 lan: mo Claude Code tren Mac, dan cau: 'lap hook SessionStart chay node \$HOME/.claude/scripts/batdau.mjs'"
  vang "  (chi tiet: scripts/batdau/README.md)"
else xanh "  DAT: da co hook SessionStart"; fi

# ---------- 5. NHAN BRAIN TONG ----------
vang "[5/5] Nhan brain tong (repo PRIVATE hadangtien0702-dot/brain)..."
if [ ! -d "$BRAIN/.git" ]; then
  git clone -q https://github.com/hadangtien0702-dot/brain.git "$BRAIN" || { do_ "  Clone brain LOI - dang nhap GitHub tai khoan hadangtien0702-dot roi chay lai"; exit 1; }
else
  git -C "$BRAIN" pull -q origin main || do_ "  Pull brain LOI"
fi
n=0
while IFS= read -r f; do
  nguon="$BRAIN/$f"; dich="$CL/$f"
  if [ -f "$dich" ] && cmp -s "$nguon" "$dich"; then continue; fi
  # file tren may khac ban repo -> SAO LUU truoc khi ghi de, khong bao gio mat chu am tham
  [ -f "$dich" ] && cp -p "$dich" "$dich.truoc-dong-bo-$NGAY"
  mkdir -p "$(dirname "$dich")"; cp -p "$nguon" "$dich"; n=$((n+1))
done < <(cd "$BRAIN" && { [ -f CLAUDE.md ] && echo CLAUDE.md; find skills -type f 2>/dev/null; })
if [ "$n" -eq 0 ]; then xanh "  DAT: brain may nay da khop GitHub"; else xanh "  DA NHAN: $n file brain (ban cu da sao luu duoi .truoc-dong-bo-$NGAY)"; fi

echo; xanh "XONG. Mo Claude Code o thu muc repo la lam tiep duoc."
