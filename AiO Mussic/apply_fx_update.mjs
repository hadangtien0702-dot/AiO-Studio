import fs from 'fs';

const htmlPath = 'AiO Mussic/index.html';
let content = fs.readFileSync(htmlPath, 'utf-8');

// 1. Replace CSS
const cssStartMarker = '/* ══════════════════════════════════════════════════\n   FX MIXER — PREMIUM PLUGIN GRADE';
const cssEndMarker = '/* TOAST */';

const newCss = `/* ══════════════════════════════════════════════════
   FX MIXER — 5-CHANNEL CONSOLE
══════════════════════════════════════════════════ */
.fx-panel{flex:1;overflow:hidden;padding:12px;display:flex;flex-direction:column;background:var(--bg-0);gap:12px;}

.mx-board{flex:1;display:flex;gap:12px;overflow:hidden;}
.mx-faders{display:flex;gap:6px;flex:1;}
.mx-fader-col{flex:1;background:linear-gradient(180deg,#13141a,#0d0e12);border:1px solid rgba(255,255,255,0.04);border-radius:10px;display:flex;flex-direction:column;align-items:center;padding:12px 0 16px;gap:10px;box-shadow:0 4px 15px rgba(0,0,0,0.3);}
.mx-flbl{font-size:10px;font-weight:600;color:var(--t2);letter-spacing:0.5px;}

.mx-pan{width:18px;height:18px;border-radius:50%;border:2px solid var(--t4);position:relative;cursor:pointer;}
.mx-pan::after{content:'';position:absolute;top:2px;left:6px;width:2px;height:5px;background:var(--t2);border-radius:1px;}

.mx-f-track-wrap{flex:1;display:flex;padding:10px 0;width:100%;justify-content:center;}
.mx-fader-track{height:100%;width:8px;background:#050508;border-radius:4px;position:relative;border:1px solid rgba(255,255,255,0.06);box-shadow:inset 0 2px 8px rgba(0,0,0,0.8);}
.mx-meter{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(0deg, #10b981, #34d399);border-radius:4px;box-shadow:0 0 10px rgba(52,211,153,0.3);pointer-events:none;}
.mx-thumb{position:absolute;bottom:0;left:-10px;right:-10px;height:22px;background:linear-gradient(180deg, #2a2c36, #1c1d24);border:1px solid #000;border-radius:4px;transform:translateY(50%);cursor:grab;box-shadow:0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15);}
.mx-thumb:active{cursor:grabbing;}
.mx-thumb::after{content:'';position:absolute;top:50%;left:15%;right:15%;height:2px;background:var(--green);transform:translateY(-50%);box-shadow:0 0 4px var(--green);}

.mx-f-btm{font-size:10px;font-weight:600;color:var(--t4);margin-top:auto;}
.mx-rk{width:22px;height:22px;border-radius:50%;background:var(--bg-0);border:1px solid var(--ln-1);position:relative;cursor:pointer;}
.mx-rk::before{content:'';position:absolute;inset:-3px;border-radius:50%;border:2px solid transparent;border-left-color:#f86820;border-bottom-color:#f86820;transform:rotate(45deg);opacity:0.8;}
.mx-rk::after{content:'';position:absolute;top:3px;left:9px;width:2px;height:6px;background:var(--t2);border-radius:1px;}

.mx-side{width:250px;display:flex;flex-direction:column;gap:12px;flex-shrink:0;}
.mx-panel{background:linear-gradient(180deg,#13141a,#0d0e12);border:1px solid rgba(255,255,255,0.04);border-radius:10px;padding:16px;box-shadow:0 4px 15px rgba(0,0,0,0.3);display:flex;flex-direction:column;}
.mx-p-hd{font-size:12px;font-weight:700;color:var(--t1);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;letter-spacing:0.2px;}

.mx-sl-row{display:flex;align-items:center;gap:8px;}
.mx-sl-lbl{font-size:10px;color:var(--t3);width:45px;}
.mx-sl-val{font-size:10px;color:var(--t2);width:26px;text-align:right;}
.mx-range{flex:1;-webkit-appearance:none;height:4px;background:var(--bg-0);border-radius:2px;outline:none;border:1px solid var(--ln-1);}
.mx-range::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--t2);cursor:pointer;}

.mx-duck-viz{height:70px;background:var(--bg-0);border:1px solid var(--ln-0);border-radius:6px;margin-top:14px;display:flex;align-items:center;justify-content:center;}

.mx-eq-knobs{display:flex;justify-content:space-between;margin-bottom:14px;}
.mx-ek-unit{display:flex;flex-direction:column;align-items:center;gap:6px;}
.mx-ek{width:28px;height:28px;border-radius:50%;background:var(--bg-0);border:1px solid var(--ln-1);position:relative;cursor:pointer;}
.mx-ek::after{content:'';position:absolute;top:4px;left:13px;width:2px;height:6px;background:var(--t2);border-radius:1px;}
.mx-ek-unit:last-child .mx-ek::before{content:'';position:absolute;inset:-3px;border-radius:50%;border:2px solid transparent;border-top-color:#4d9ef7;border-right-color:#4d9ef7;transform:rotate(-15deg);opacity:0.8;}
.mx-ek-lbl{font-size:9px;color:var(--t3);font-weight:600;}

.mx-footer{text-align:center;font-size:11px;color:var(--t4);padding:4px 0;}

`;

const cssStartIndex = content.indexOf(cssStartMarker);
const cssEndIndex = content.indexOf(cssEndMarker);
if(cssStartIndex > -1 && cssEndIndex > -1) {
  content = content.substring(0, cssStartIndex) + newCss + content.substring(cssEndIndex);
} else {
  console.log('CSS marker not found');
}

// 2. Replace HTML
const htmlStartMarker = '<!-- ══════════════════════════════════════\n         MODE: FX MIXER — PREMIUM PLUGIN UI';
const htmlEndMarker = '</main>';

const newHtml = `<!-- ══════════════════════════════════════
         MODE: FX MIXER — 5-CHANNEL CONSOLE
    ══════════════════════════════════════ -->
    <div class="mode-pane" id="mode-fx">
      <div class="fx-panel">
        
        <div class="mx-board">
          <!-- ── LEFT: FADERS ── -->
          <div class="mx-faders" id="fader-rack">
            <!-- Rendered by JS -->
          </div>

          <!-- ── RIGHT: PANELS ── -->
          <div class="mx-side">
            <!-- DUCKING -->
            <div class="mx-panel">
              <div class="mx-p-hd">Smart Ducking</div>
              <div class="mx-sl-row">
                <span class="mx-sl-lbl">Amount</span>
                <input type="range" class="mx-range" value="72">
                <span class="mx-sl-val">72%</span>
              </div>
              <div class="mx-duck-viz">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" style="width:100%;height:100%;stroke:#4d9ef7;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;">
                  <path d="M0,15 C15,15 25,35 45,35 C65,35 75,15 100,15"/>
                  <line x1="0" y1="15" x2="100" y2="15" stroke="rgba(255,255,255,0.1)" stroke-width="0.5" stroke-dasharray="2 2"/>
                  <text x="5" y="10" fill="rgba(255,255,255,0.3)" font-size="6" stroke="none">VOX</text>
                  <text x="40" y="30" fill="rgba(255,255,255,0.3)" font-size="6" stroke="none">DUCKED</text>
                </svg>
              </div>
            </div>

            <!-- EQ -->
            <div class="mx-panel">
              <div class="mx-p-hd">EQ 
                <svg class="ic dim" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M9 12l2 2 4-4"/></svg>
              </div>
              <div class="mx-eq-knobs">
                <div class="mx-ek-unit">
                  <div class="mx-ek" style="transform:rotate(-40deg)"></div><div class="mx-ek-lbl">Low</div>
                </div>
                <div class="mx-ek-unit">
                  <div class="mx-ek" style="transform:rotate(10deg)"></div><div class="mx-ek-lbl">Mid</div>
                </div>
                <div class="mx-ek-unit">
                  <div class="mx-ek" style="transform:rotate(35deg)"></div><div class="mx-ek-lbl">High</div>
                </div>
                <div class="mx-ek-unit">
                  <div class="mx-ek" style="transform:rotate(60deg)"></div><div class="mx-ek-lbl">4.2s</div>
                </div>
              </div>
              <div class="mx-sl-row" style="margin-top:6px;">
                <span class="mx-sl-lbl" style="width:35px">Reverb</span>
                <input type="range" class="mx-range" value="40">
              </div>
            </div>
          </div>
        </div>

        <div class="mx-footer">
          Elevate your audio with built-in tools for mixing, ducking, EQ, and professional sound design.
        </div>

      </div>
    </div>

  `;

const htmlStartIndex = content.indexOf(htmlStartMarker);
const htmlEndIndex = content.indexOf(htmlEndMarker);
if(htmlStartIndex > -1 && htmlEndIndex > -1) {
  content = content.substring(0, htmlStartIndex) + newHtml + content.substring(htmlEndIndex);
} else {
  console.log('HTML marker not found');
}

// 3. Replace JS logic for Faders
const jsStartMarker = '/* ══ KNOB LOGIC ══ */';
const jsEndMarker = '/* ══ LIBRARY */';

const newJs = `/* ══ FADER CONSOLE LOGIC ══ */
function renderFaders(){
  const rack = document.getElementById('fader-rack');
  if(!rack) return;
  rack.innerHTML='';
  const faders = [
    {name:'Dialogue', val:85, sub:'Dial'},
    {name:'Music', val:50, sub:'Music'},
    {name:'SFX', val:65, sub:'SFX'},
    {name:'Ambience', val:40, sub:'Amb'},
    {name:'Master', val:75, sub:'Mstr'}
  ];
  faders.forEach((f,i)=>{
    const d = document.createElement('div');
    d.className='mx-fader-col';
    d.innerHTML = \`
      <div class="mx-flbl">\${f.name}</div>
      <div class="mx-pan" title="Pan / Balance"></div>
      <div class="mx-f-track-wrap">
        <div class="mx-fader-track" id="f-trk-\${i}">
          <div class="mx-meter" id="f-met-\${i}" style="height:\${f.val}%"></div>
          <div class="mx-thumb" id="f-thm-\${i}" style="bottom:\${f.val}%"></div>
        </div>
      </div>
      <div class="mx-f-btm">\${f.sub}</div>
      <div class="mx-rk" title="Send / Gain"></div>
    \`;
    rack.appendChild(d);
    
    // Drag logic
    setTimeout(()=>{
      const trk = document.getElementById('f-trk-'+i);
      const thm = document.getElementById('f-thm-'+i);
      const met = document.getElementById('f-met-'+i);
      let isDragging = false;
      
      const updateFader = (e) => {
        const rect = trk.getBoundingClientRect();
        // Calculate percentage from bottom
        let y = rect.bottom - e.clientY;
        let pct = (y / rect.height) * 100;
        if(pct < 0) pct = 0; if(pct > 100) pct = 100;
        thm.style.bottom = pct + '%';
        met.style.height = pct + '%';
      };
      
      thm.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
      });
      document.addEventListener('mousemove', (e) => {
        if(!isDragging) return;
        updateFader(e);
      });
      document.addEventListener('mouseup', () => {
        isDragging = false;
      });
      trk.addEventListener('mousedown', (e) => {
        updateFader(e);
        isDragging = true;
      });
    }, 50);
  });
}

`;

const jsStartIndex = content.indexOf(jsStartMarker);
const jsEndIndex = content.indexOf(jsEndMarker);
if(jsStartIndex > -1 && jsEndIndex > -1) {
  content = content.substring(0, jsStartIndex) + newJs + content.substring(jsEndIndex);
} else {
  console.log('JS marker not found');
  console.log(jsStartIndex, jsEndIndex);
}

// 4. Also remove the old `initEQCanvas` etc calls in `DOMContentLoaded`
const initLinesToReplace = `  // Init all knobs
  document.querySelectorAll('.knob-canvas-wrap').forEach(w=>initKnob(w));

  // Init EQ canvas
  setTimeout(()=>{
    initEQCanvas();
    drawRoomViz();
    initDelayGrid();
  },100);`;

if(content.includes(initLinesToReplace)) {
    content = content.replace(initLinesToReplace, '  renderFaders();');
}

// Also remove resize event handler contents
const resizeLinesToReplace = `  initEQCanvas();
  drawRoomViz();`;
if(content.includes(resizeLinesToReplace)) {
    content = content.replace(resizeLinesToReplace, '');
}

// Write back
fs.writeFileSync(htmlPath, content, 'utf-8');
console.log('Update applied successfully!');

