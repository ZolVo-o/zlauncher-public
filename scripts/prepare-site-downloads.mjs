import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'public', 'downloads');

const files = [
  {
    from: path.join(root, 'release', 'ZLauncher Setup 0.0.0.exe'),
    to: path.join(outDir, 'ZLauncher-Setup-0.0.0.exe'),
  },
  {
    from: path.join(root, 'release', 'win-unpacked', 'ZLauncher.exe'),
    to: path.join(outDir, 'ZLauncher-Portable-0.0.0.exe'),
  },
  {
    from: path.join(
      root,
      'minecraft-mod',
      'zlauncher-access',
      'build',
      'libs',
      'zlauncher-access-1.0.0.jar'
    ),
    to: path.join(outDir, 'zlauncher-access-1.0.0.jar'),
  },
];

const launcherReadme = `ZLauncher
Версия: 0.0.0

Установка:
1. Запустите ZLauncher-Setup-0.0.0.exe
2. Следуйте мастеру установки
3. После установки запустите ZLauncher

Portable:
- ZLauncher-Portable-0.0.0.exe можно запускать без установки.
`;

const modReadme = `ZLauncher Access Mod
Файл: zlauncher-access-1.0.0.jar

Установка:
1. Установите Fabric Loader 1.21.1
2. Поместите zlauncher-access-1.0.0.jar в папку mods
3. Запустите профиль Fabric 1.21.1
`;

fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  if (!fs.existsSync(file.from)) {
    console.warn(`[prepare-site-downloads] Пропуск: файл не найден: ${file.from}`);
    continue;
  }
  fs.copyFileSync(file.from, file.to);
  console.log(`[prepare-site-downloads] OK: ${path.relative(root, file.to)}`);
}

fs.writeFileSync(path.join(outDir, 'README-LAUNCHER.txt'), launcherReadme, 'utf8');
fs.writeFileSync(path.join(outDir, 'README-MOD.txt'), modReadme, 'utf8');
console.log('[prepare-site-downloads] Готово');
