import { dongPanel } from './lib.mjs';
for (const t of process.argv.slice(2)) console.log('dong ' + t + ': ' + (await dongPanel(t) ? 'da dong' : 'CHUA dong'));
