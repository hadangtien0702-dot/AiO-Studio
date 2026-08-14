
/* ══ DATA ══ */
const TRACKS=[
  {id:1,name:'Epic Horizon Rising',tags:['Cinematic','Orchestral'],bpm:120,key:'Cm',dur:'2:34',mood:'cinematic bgm'},
  {id:2,name:'Sunny Morning Chill',tags:['Lo-Fi','Vlog'],bpm:95,key:'G',dur:'1:58',mood:'lofi bgm'},
  {id:3,name:'Tech Future Innovations',tags:['Corporate','Upbeat'],bpm:115,key:'Am',dur:'3:12',mood:'corporate bgm upbeat'},
  {id:4,name:'Dark Tension Build',tags:['Suspense','Cinematic'],bpm:80,key:'Dm',dur:'4:05',mood:'suspense cinematic bgm'},
  {id:5,name:'Summer Roadtrip',tags:['Upbeat','Travel'],bpm:128,key:'F',dur:'2:45',mood:'upbeat bgm'},
  {id:6,name:'Midnight Vibes',tags:['Lo-Fi','Relax'],bpm:88,key:'Dbm',dur:'3:20',mood:'lofi bgm'},
  {id:7,name:'Cinematic Rise 2046',tags:['Trailer','Epic'],bpm:96,key:'Em',dur:'2:10',mood:'cinematic trailer bgm'},
  {id:8,name:'Corporate Inspire',tags:['Corporate','Motivational'],bpm:110,key:'C',dur:'2:55',mood:'corporate bgm'},
  {id:9,name:'Bass Drop Fury',tags:['EDM','Upbeat'],bpm:138,key:'Am',dur:'3:40',mood:'upbeat bgm'},
  {id:10,name:'Piano Reflection',tags:['Cinematic','Emotional'],bpm:72,key:'Dm',dur:'3:15',mood:'cinematic bgm'},
  {id:11,name:'Urban Lo-Fi Beat',tags:['Lo-Fi','Hip-Hop'],bpm:90,key:'Bb',dur:'2:30',mood:'lofi bgm'},
  {id:12,name:'Trailer Power Stomp',tags:['Trailer','Suspense'],bpm:142,key:'Cm',dur:'1:45',mood:'suspense trailer bgm'},
];
const KEY_COMPAT={Cm:['Eb','Gm','Fm','Ab','Bb','Cm'],G:['D','Am','Em','C','Bm','G'],Am:['F','C','G','Dm','E','Am'],Dm:['Am','Gm','F','Bb','C','Dm'],F:['C','Gm','Am','Dm','Bb','F'],Dbm:['E','Ab','Fm','Bb','Gb','Dbm'],Em:['B','Am','C','D','G','Em'],C:['G','Am','Dm','F','Em','C'],Bb:['F','Gm','Cm','Eb','Dm','Bb']};
const MODES_L=['Major','Minor','Dorian','Mixolydian'],NOTES=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
let playingId=null,currentCat='all',tapTimes=[];

/* ══ EQ STATE */
const eqBands={lo:0,lm:0,hm:0,hi:0};


/* ══ FADER CONSOLE LOGIC ══ */
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
    d.innerHTML = `
      <div class="mx-flbl">${f.name}</div>
      <div class="mx-pan" title="Pan / Balance"></div>
      <div class="mx-f-track-wrap">
        <div class="mx-fader-track" id="f-trk-${i}">
          <div class="mx-meter" id="f-met-${i}" style="height:${f.val}%"></div>
          <div class="mx-thumb" id="f-thm-${i}" style="bottom:${f.val}%"></div>
        </div>
      </div>
      <div class="mx-f-btm">${f.sub}</div>
      <div class="mx-rk" title="Send / Gain"></div>
    `;
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


/* ══ LIBRARY */
function renderTracks(list){
  const c=document.getElementById('track-list');
  document.getElementById('view-ct').innerText=list.length+' tracks';
  c.innerHTML='';
  if(!list.length){
    c.innerHTML=`<div class="empty-state"><svg class="ic" style="width:30px;height:30px" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><div class="empty-title">Không tìm thấy nhạc nào</div><div class="empty-desc">Thử thay đổi từ khóa hoặc import thêm thư mục.</div></div>`;
    return;
  }
  list.forEach(t=>{
    const d=document.createElement('div');
    d.className='track-row'+(playingId===t.id?' playing':'');
    d.innerHTML=`
      <div class="tr-play" onclick="togglePlay(${t.id})">
        <button class="play-btn">${playingId===t.id
          ?'<svg viewBox="0 0 24 24" style="width:10px;height:10px;fill:#fff;stroke:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
          :'<svg viewBox="0 0 24 24" style="width:10px;height:10px;fill:#fff;stroke:none"><polygon points="5 3 19 12 5 21 5 3"/></svg>'}</button>
      </div>
      <div class="tr-meta">
        <div class="tr-name">${t.name}</div>
        <div class="tr-tags">
          ${t.tags.map(g=>`<span class="tr-tag">${g}</span>`).join('')}
          <div class="stem-row"><span class="stem-c on" onclick="stemT(this,event)">Mel</span><span class="stem-c on" onclick="stemT(this,event)">Drm</span><span class="stem-c on" onclick="stemT(this,event)">Bass</span></div>
        </div>
      </div>
      <div class="tr-wave" id="wave-${t.id}" onclick="seekWave(this,event)"></div>
      <div class="tr-stats"><span class="sp sp-bpm">${t.bpm} BPM</span><span class="sp sp-key">${t.key}</span><span class="sp sp-dur">${t.dur}</span></div>
      <div class="tr-acts">
        <button class="act-btn act-ins" onclick="insertT('${t.name}')"><svg class="ic" style="width:8px;height:8px" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Chèn</button>
        <button class="act-btn act-fit" onclick="fitT('${t.name}')"><svg class="ic" style="width:8px;height:8px" viewBox="0 0 24 24"><path d="M4 14h6v6M20 10h-6V4"/></svg> Fit</button>
      </div>`;
    document.getElementById('track-list').appendChild(d);
    const w=document.getElementById('wave-'+t.id);
    for(let i=0;i<150;i++){const b=document.createElement('div');b.className='w-bar';b.style.height=Math.max(10,Math.round(Math.sin(Math.PI*i/150)*(0.5+Math.random()*0.5)*78))+'%';w.appendChild(b);}
  });
}
function togglePlay(id){const was=playingId===id;playingId=was?null:id;renderTracks(getFiltered());if(!was)toast2('▶ '+TRACKS.find(t=>t.id===id).name);}
function stemT(el,e){e.stopPropagation();el.classList.toggle('on');toast2('Stem '+el.innerText+': '+(el.classList.contains('on')?'ON':'OFF'));}
function seekWave(w,e){const r=w.getBoundingClientRect(),pct=(e.clientX-r.left)/r.width,bars=w.querySelectorAll('.w-bar'),idx=Math.floor(pct*bars.length);bars.forEach((b,i)=>b.classList.toggle('played',i<=idx));}
function insertT(n){toast2('✓ "'+n+'" → Timeline A2');}
function fitT(n){toast2('✓ Auto-Fit "'+n+'" → 03:45');}

/* ══ FILTER */
function getFiltered(){const q=(document.getElementById('inp-srch')?.value||'').toLowerCase();return TRACKS.filter(t=>(currentCat==='all'||t.mood.includes(currentCat))&&(!q||(t.name+t.tags.join(' ')+t.key+t.bpm).toLowerCase().includes(q)));}
function filterTracks(){renderTracks(getFiltered());}
function setCat(el,cat){document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));el.classList.add('active');currentCat=cat;filterTracks();}

/* ══ MODE SWITCH */
function switchMode(m){
  document.querySelectorAll('.tb-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.mode-pane').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+m).classList.add('active');
  document.getElementById('mode-'+m).classList.add('active');
}

/* ══ KEY */
function buildKeyGrid(){
  const g=document.getElementById('key-grid');g.innerHTML='';
  const active=document.getElementById('key-val').innerText;
  const pcts=[85,70,62,55,90,74,60,80,68,53,78,65];
  NOTES.forEach((note,i)=>{
    const c=document.createElement('div');c.className='key-card'+(note===active?' selected':'');
    c.innerHTML=`<div class="kc-note">${note}</div><div class="kc-mode">${MODES_L[i%4]}</div><div class="kc-bar"><div class="kc-fill" style="width:${pcts[i]}%"></div></div>`;
    c.onclick=()=>{document.querySelectorAll('.key-card').forEach(x=>x.classList.remove('selected'));c.classList.add('selected');document.getElementById('key-val').innerText=note;document.getElementById('key-mode').innerText=MODES_L[i%4];document.getElementById('conf-fill').style.width=pcts[i]+'%';document.getElementById('conf-pct').innerText=pcts[i]+'%';buildCompatKeys(note);toast2('Key: '+note);};
    g.appendChild(c);
  });
  buildCompatKeys(active);
}
function buildCompatKeys(key){
  const w=document.getElementById('compat-keys');w.innerHTML='';
  (KEY_COMPAT[key]||['C','G','Am','F']).forEach((k,i)=>{const d=document.createElement('div');d.className='compat-key'+(i===0?' root':'');d.innerText=k;d.onclick=()=>toast2('Filter: '+k);w.appendChild(d);});
}
function analyzeKey(){const t=TRACKS.find(t=>t.id===playingId)||TRACKS[0];document.getElementById('key-val').innerText='...';document.getElementById('key-mode').innerText='Phân tích...';setTimeout(()=>{const c=75+Math.floor(Math.random()*20);document.getElementById('key-val').innerText=t.key;document.getElementById('key-mode').innerText=MODES_L[Math.floor(Math.random()*4)];document.getElementById('conf-fill').style.width=c+'%';document.getElementById('conf-pct').innerText=c+'%';document.getElementById('compat-keys').innerHTML='';buildCompatKeys(t.key);toast2('✓ Key: '+t.key+' ('+c+'%)');},900);}

/* ══ BPM */
function updateBPMDisplay(bpm){document.getElementById('bpm-val').innerText=Math.round(bpm);document.getElementById('bpm-needle').style.transform='translateX(-50%) rotate('+((bpm-60)/140*140-70)+'deg)';}
function tapTempo(){tapTimes.push(Date.now());if(tapTimes.length>8)tapTimes.shift();if(tapTimes.length<2){document.getElementById('tap-hint').innerText='Tiếp tục gõ... ('+tapTimes.length+'/4)';return;}const avg=tapTimes.slice(1).reduce((s,t,i)=>s+(t-tapTimes[i]),0)/(tapTimes.length-1);const bpm=Math.round(60000/avg);updateBPMDisplay(bpm);document.getElementById('tap-hint').innerText='BPM từ '+tapTimes.length+' lần gõ';document.querySelectorAll('.bpm-range').forEach(r=>r.classList.remove('match'));document.querySelectorAll('.bpm-range').forEach(r=>{const t=r.querySelector('.br-range').innerText.split('–');if(bpm>=+t[0]&&bpm<=+t[1])r.classList.add('match');});toast2('TAP BPM: '+bpm);}
function filterByBPM(el,lo,hi){document.querySelectorAll('.bpm-range').forEach(r=>r.classList.remove('match'));el.classList.add('match');updateBPMDisplay((lo+hi)/2);buildBPMList(lo,hi);toast2('Filter: '+lo+'–'+hi+' BPM');}
function analyzeBPM(){const t=TRACKS.find(t=>t.id===playingId)||TRACKS[0];document.getElementById('bpm-val').innerText='...';setTimeout(()=>{updateBPMDisplay(t.bpm);buildBPMList(t.bpm-15,t.bpm+15);toast2('✓ BPM: '+t.bpm);},900);}
function buildBPMList(lo,hi){const l=document.getElementById('bpm-list');l.innerHTML='';[...TRACKS].sort((a,b)=>Math.abs(a.bpm-(lo+hi)/2)-Math.abs(b.bpm-(lo+hi)/2)).slice(0,6).forEach(t=>{const match=t.bpm>=lo&&t.bpm<=hi,pct=Math.round(100-Math.abs(t.bpm-(lo+hi)/2)/((hi-lo)/2+1)*60);const row=document.createElement('div');row.className='bpm-row'+(match?' match':'');row.innerHTML=`<div class="br-num">${t.bpm}</div><div class="br-bar-w"><div class="br-bar" style="width:${pct}%"></div></div><div class="br-tname">${t.name}</div>`;row.onclick=()=>toast2('Select: '+t.name);l.appendChild(row);});}

/* ══ IMPORT */
function importFolder(){const paths=['~/Desktop/Music Pack','D:/Sounds/SFX','C:/Projects/Audio'];const p=paths[Math.floor(Math.random()*paths.length)];const l=document.getElementById('path-list');const row=document.createElement('div');row.className='path-row';row.innerHTML=`<svg class="ic" style="width:9px;height:9px" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg><span class="path-name">${p}</span><span class="path-ct">${6+Math.floor(Math.random()*30)}</span>`;row.onclick=()=>{document.querySelectorAll('.path-row').forEach(r=>r.classList.remove('active'));row.classList.add('active');toast2('Library: '+p);};l.appendChild(row);toast2('✓ Imported: '+p);}
function switchPath(el,n){document.querySelectorAll('.path-row').forEach(r=>r.classList.remove('active'));el.classList.add('active');toast2('Library: '+n);}

/* ══ TOAST */
function toast2(msg){const el=document.getElementById('toast-el');document.getElementById('toast-msg').innerText=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2400);}

/* ══ INIT */
window.addEventListener('DOMContentLoaded',()=>{
  renderTracks(TRACKS);
  buildKeyGrid();
  buildBPMList(115,145);
  updateBPMDisplay(128);

  renderFaders();
});

window.addEventListener('resize',()=>{

});
