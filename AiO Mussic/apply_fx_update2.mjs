import fs from 'fs';
const htmlPath = 'AiO Mussic/index.html';
let content = fs.readFileSync(htmlPath, 'utf-8');

const jsStartMarker = '/* ════════════════════════════════════════\n   KNOB ENGINE — Custom rotary SVG canvas';
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
  fs.writeFileSync(htmlPath, content, 'utf-8');
  console.log('JS Replace successful!');
} else {
  console.log('JS marker not found:', jsStartIndex, jsEndIndex);
}
