export const SITE_CONFIG = {
  appName: 'ZLauncher',
  latestVersion: '0.0.0',
  downloads: {
    windowsInstaller:
      'https://github.com/ZolVo-o/zlauncher-public/releases/latest/download/ZLauncher-Setup-0.0.0.exe',
    windowsPortable:
      'https://github.com/ZolVo-o/zlauncher-public/releases/latest/download/ZLauncher-Portable-0.0.0.exe',
    accessibilityMod:
      'https://github.com/ZolVo-o/zlauncher-public/releases/latest/download/zlauncher-access-1.0.0.jar',
  },
  docs: {
    launcher:
      'https://github.com/ZolVo-o/zlauncher-public/blob/main/README.md',
    mod:
      'https://github.com/ZolVo-o/zlauncher-public/blob/main/minecraft-mod/zlauncher-access/README.md',
  },
};

export function isPlaceholderLink(url: string) {
  return url.includes('REPLACE_ME') || url.trim() === '';
}
