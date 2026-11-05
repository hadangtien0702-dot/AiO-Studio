import { es, moPanel, chu, nut, CONG, chup } from './lib.mjs';
const ten = process.argv[2]; const seqId = process.argv[3];
if (seqId) console.log('mo sequence: ' + await es(`var ok = app.project.openSequence(${JSON.stringify(seqId)}); var a = app.project.activeSequence; if (a.sequenceID === ${JSON.stringify(seqId)}) { a.setInPoint(0); a.setOutPoint(Number(a.end) / 254016000000); } return ok + '|' + a.name + '|in=' + a.getInPoint() + '|out=' + a.getOutPoint();`, 15000));
const m = await moPanel(ten);
console.log('panel ' + ten + ': ' + (m.daMoSan ? 'da mo san' : 'mo sau ' + m.ms + ' ms'));
await new Promise((r) => setTimeout(r, 2500));
console.log('CHU: ' + await chu(CONG[ten], 900));
console.log('NUT: ' + await nut(CONG[ten]));
if (process.argv[4]) console.log('anh: ' + await chup(CONG[ten], process.argv[4]));
