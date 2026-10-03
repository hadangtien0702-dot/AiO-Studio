import { esFile } from './lib.mjs';
console.log(await esFile(new URL('./soi.jsx', import.meta.url).pathname, 40000, { '__LOC__': process.argv[2] || '' }));
