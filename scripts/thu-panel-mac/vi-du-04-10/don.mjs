import { esFile } from '../lib.mjs';
console.log(await esFile(new URL('./don.jsx', import.meta.url).pathname, 90000, { '__CHE_DO__': process.argv[2] || 'LIET_KE' }));
