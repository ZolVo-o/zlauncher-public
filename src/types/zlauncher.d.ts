import type { Instance, Settings, LogEntry } from "../store/launcherStore";

export type DesktopLauncherEvent =
  | { type: "log"; payload: Pick<LogEntry, "level" | "source" | "message"> }
  | { type: "status"; payload: { value: string } }
  | { type: "progress"; payload: { value: number } }
  | { type: "error"; payload: { message: string } }
  | { type: "exit"; payload: { code: number | null; signal: string | null } };

export interface DesktopApi {
  isDesktop: boolean;
  startLaunch: (payload: { instance: Instance; settings: Settings }) => Promise<{ ok: boolean }>;
  stopLaunch: () => Promise<{ ok: boolean }>;
  getVersions: () => Promise<Array<{ id: string; type: string; releaseTime: string }>>;
  listMods: (gameDir?: string) => Promise<{
    directory: string;
    items: Array<{ fileName: string; name: string; enabled: boolean; size: number; modifiedAt: number }>;
  }>;
  deleteMod: (gameDir: string | undefined, fileName: string) => Promise<{ ok: boolean; reason?: string }>;
  installMod: (
    gameDir: string | undefined,
    sourcePath: string,
    overwrite?: boolean
  ) => Promise<{ ok: boolean; reason?: string; fileName?: string; replaced?: boolean }>;
  toggleMod: (
    gameDir: string | undefined,
    fileName: string,
    enabled: boolean
  ) => Promise<{ ok: boolean; reason?: string; fileName?: string }>;
  openModsFolder: (gameDir?: string) => Promise<{ ok: boolean; directory: string }>;
  pickFile: (filters?: Array<{ name: string; extensions: string[] }>) => Promise<string | null>;
  pickFolder: () => Promise<string | null>;
  windowMinimize: () => Promise<{ ok: boolean }>;
  windowMaximize: () => Promise<{ ok: boolean }>;
  windowClose: () => Promise<{ ok: boolean }>;
  onLauncherEvent: (handler: (event: DesktopLauncherEvent) => void) => () => void;
}

declare global {
  interface Window {
    zlauncher?: DesktopApi;
  }
}

export {};
