import fs from 'node:fs';
import path from 'node:path';

const target = path.join(process.cwd(), 'public', 'downloads');

if (fs.existsSync(target)) {
  fs.rmSync(target, { recursive: true, force: true });
  console.log('[clean-site-downloads] Удалено: public/downloads');
} else {
  console.log('[clean-site-downloads] Нечего удалять');
}
