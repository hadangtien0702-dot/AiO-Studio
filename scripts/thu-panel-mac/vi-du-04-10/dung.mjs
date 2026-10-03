import { esFile } from '../lib.mjs';
import os from 'node:os';
const kq = await esFile(new URL('./dung.jsx', import.meta.url).pathname, 120000, { '__THU_MUC__': os.homedir() + '/Production/AiO Studio/Test Media/mac-test-04-10' });
console.log(kq);
