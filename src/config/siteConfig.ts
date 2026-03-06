export const SITE_CONFIG = {
  appName: 'ZLauncher',
  latestVersion: '0.0.0',
  downloads: {
    windowsInstaller: '/downloads/ZLauncher-Setup-0.0.0.exe',
    windowsPortable: '/downloads/ZLauncher-Portable-0.0.0.exe',
    accessibilityMod: '/downloads/zlauncher-access-1.0.0.jar',
  },
  docs: {
    launcher: '/downloads/README-LAUNCHER.txt',
    mod: '/downloads/README-MOD.txt',
  },
};

export function isPlaceholderLink(url: string) {
  return url.includes('REPLACE_ME') || url.trim() === '';
}
