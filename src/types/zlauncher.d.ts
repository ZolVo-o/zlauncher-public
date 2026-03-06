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
