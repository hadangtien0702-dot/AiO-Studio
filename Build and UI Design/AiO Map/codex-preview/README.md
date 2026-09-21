# AiO Map — Codex preview

Independent copy of the Gemini prototype, served at http://localhost:8090/.
The original project and Gemini's port 8089 are not modified.

Purpose: track who has been interviewed and where across all 50 US states.

Run from this folder:

```powershell
python -m http.server 8090 --bind 127.0.0.1
```

The illustrated view uses the three generated PNGs in assets/concepts/usa-isometric-v1.
California and Texas have painted selection variants. Other states use the overview
with a selected marker. Choose any of the 50 states or DC with the state dropdown
or existing search. Filming markers represent states, not exact city coordinates.
The original interactive geometry remains available with the 3D View button.

Interview records are stored in browser localStorage. Because port 8090 is a
different origin, this preview has its own records and starts with demo data;
it does not automatically copy browser records from port 8089.

Generated artwork is a visual reference, not authoritative boundary data.

Design note, 2026-09-21: when replacing a live map with raster artwork, keep a
separate interaction layer, distinguish state anchors from exact filming locations,
and fit the illustration beside the details panel rather than behind it.
