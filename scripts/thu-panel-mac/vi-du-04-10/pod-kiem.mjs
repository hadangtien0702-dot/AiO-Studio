import { es } from '../lib.mjs';
import fs from 'node:fs'; import os from 'node:os';
const kq = await es(`var ss=app.project.sequences, q=null; for (var i=0;i<ss.numSequences;i++) if (ss[i].name==="CL04 podcast3 - Podcast Cut") q=ss[i]; if(!q) return "KHONG THAY"; var ra=[]; for (var v=0;v<2;v++){ var t=q.videoTracks[v], s="V"+(v+1)+":"; for (var c=0;c<t.clips.numItems;c++){ var k=t.clips[c]; s+=Math.round(k.start.seconds*100)/100+"-"+Math.round(k.end.seconds*100)/100+"-"+(k.disabled?"tat":"bat")+";"; } ra.push(s); } for (var a=0;a<q.audioTracks.numTracks;a++){ var ta=q.audioTracks[a]; for (var j=0;j<ta.clips.numItems;j++){ var kc=ta.clips[j], kf=0; try { for (var m=0;m<kc.components.numItems;m++){ var cm=kc.components[m]; for (var n=0;n<cm.properties.numItems;n++){ var pr=cm.properties[n]; if (pr.displayName==="Level" && pr.isTimeVarying()) { var ks=pr.getKeys(); kf=ks?ks.length:0; } } } } catch(e){ kf=-1; } ra.push("A"+(a+1)+":"+kc.name+"|"+Math.round(kc.start.seconds*100)/100+"-"+Math.round(kc.end.seconds*100)/100+"|keyframe="+kf+"|path="+kc.projectItem.getMediaPath().split("/").pop()); } } return ra.join("\\n");`, 40000);
console.log(kq.split('\n').filter((l) => l.startsWith('A')).join('\n'));
const tr = {}; for (const l of kq.split('\n').filter((x) => x.startsWith('V'))) { tr[l.slice(0, 2)] = l.slice(3).split(';').filter(Boolean).map((x) => { const [a, b, c] = x.split('-'); return { tu: +a, den: +b, bat: c === 'bat' }; }); }
const da = JSON.parse(fs.readFileSync(os.homedir() + '/Production/AiO Studio/Test Media/mac-test-04-10/podcast3/dap-an.json', 'utf8'));
let dung = 0, den = 0, chong = 0; const dong = [];
for (let i = 0; i < tr.V1.length; i++) {
  const a = tr.V1[i], b = tr.V2[i]; const soBat = (a.bat ? 1 : 0) + (b.bat ? 1 : 0);
  if (soBat === 0) den++; if (soBat === 2) chong++;
  const giua = (a.tu + a.den) / 2; const d = da.doan.find((x) => giua >= x.tu && giua < x.den);
  const nguoiTool = a.bat && !b.bat ? 0 : (!a.bat && b.bat ? 1 : -1);
  const ok = d && nguoiTool === d.nguoi; if (ok) dung++;
  const lechDau = d ? (a.tu - d.tu) : NaN;
  dong.push((i + 1) + ': ' + a.tu.toFixed(2) + '-' + a.den.toFixed(2) + ' bat=' + (nguoiTool === 0 ? 'Cam_A' : nguoiTool === 1 ? 'Cam_B' : '??') + ' | dap an nguoi ' + (d ? d.nguoi : '?') + ' | mep dau lech ' + lechDau.toFixed(2) + ' s ' + (ok ? 'DUNG' : 'SAI'));
}
console.log(dong.join('\n'));
console.log('KET QUA: ' + dung + '/' + tr.V1.length + ' doan bat dung cam cua nguoi dang noi | man hinh den ' + den + ' | chong cam ' + chong + ' | so doan dap an ' + da.doan.length);
