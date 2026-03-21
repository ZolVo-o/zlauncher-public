import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DesktopLauncherEvent } from '../types/zlauncher';

export type InstanceType = 'release' | 'snapshot' | 'modded';
export type TabId = 'home' | 'instances' | 'mods' | 'skins' | 'console' | 'settings';

export interface Instance {
  id: string;
  name: string;
  version: string;
  type: InstanceType;
  loader?: 'vanilla' | 'fabric' | 'forge';
  created: number;
  lastPlayed?: number;
  playTime: number;
  icon?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
}

export interface Settings {
  javaPath: string;
  javaVersionPreference: 'auto' | '8' | '17' | '21';
  minMemory: number;
  maxMemory: number;
  resolution: { width: number; height: number };
  fullScreen: boolean;
  autoClose: boolean;
  autoInstallDependencies: boolean;
  gameDir: string;
  username: string;
  jvmArgs: string;
  gameArgs: string;
  accessibilityMode: boolean;
  oneHandedSide: 'right' | 'left';
  largeControls: boolean;
  reduceEffects: boolean;
}

interface LauncherState {
  instances: Instance[];
  selectedInstanceId: string | null;
  settings: Settings;
  logs: LogEntry[];
  isPlaying: boolean;
  launchProgress: number;
  launchStatus: string;
  activeTab: TabId;
  launchStartedAt: number | null;
  addInstance: (instance: Omit<Instance, 'id' | 'created' | 'playTime'>) => void;
  removeInstance: (id: string) => void;
  selectInstance: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setActiveTab: (tab: TabId) => void;
  startLaunch: () => void;
  stopLaunch: () => void;
  processDesktopEvent: (event: DesktopLauncherEvent) => void;
  addLog: (level: LogEntry['level'], source: string, message: string) => void;
  clearLogs: () => void;
}

const INITIAL_INSTANCES: Instance[] = [
  { id: '1', name: 'Последний релиз', version: '1.20.4', type: 'release', loader: 'vanilla', created: Date.now(), playTime: 120, icon: 'grass' },
  { id: '2', name: 'OptiFine Ultra', version: '1.20.1', type: 'modded', loader: 'forge', created: Date.now(), playTime: 450, icon: 'furnace' },
  { id: '3', name: 'Fabric моды', version: '1.20.2', type: 'modded', loader: 'fabric', created: Date.now(), playTime: 12, icon: 'tnt' },
];

const DEFAULT_SETTINGS: Settings = {
  javaPath: '',
  javaVersionPreference: 'auto',
  minMemory: 1024,
  maxMemory: 4096,
  resolution: { width: 1920, height: 1080 },
  fullScreen: false,
  autoClose: true,
  autoInstallDependencies: true,
  gameDir: '',
  username: 'Player',
  jvmArgs: '',
  gameArgs: '',
  accessibilityMode: false,
  oneHandedSide: 'right',
  largeControls: false,
  reduceEffects: false,
};

let browserLaunchInterval: ReturnType<typeof setInterval> | null = null;

function clearBrowserLaunchInterval() {
  if (!browserLaunchInterval) return;
  clearInterval(browserLaunchInterval);
  browserLaunchInterval = null;
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

export const useLauncherStore = create<LauncherState>()(
  persist(
    (set, get) => ({
      instances: INITIAL_INSTANCES,
      selectedInstanceId: '1',
      settings: DEFAULT_SETTINGS,
      logs: [],
      isPlaying: false,
      launchProgress: 0,
      launchStatus: 'Готово',
      activeTab: 'home',
      launchStartedAt: null,

      addInstance: (data) =>
        set((state) => ({
          instances: [...state.instances, { ...data, id: createId(), created: Date.now(), playTime: 0 }],
        })),

      removeInstance: (id) =>
        set((state) => ({
          instances: state.instances.filter((i) => i.id !== id),
          selectedInstanceId:
            state.selectedInstanceId === id ? state.instances.find((i) => i.id !== id)?.id || null : state.selectedInstanceId,
        })),

      selectInstance: (id) => set({ selectedInstanceId: id }),
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      setActiveTab: (tab) => set({ activeTab: tab }),

      addLog: (level, source, message) =>
        set((state) => {
          const newLog = {
            id: Math.random().toString(36),
            timestamp: new Date().toLocaleTimeString(),
            level,
            source,
            message,
          };
          const newLogs = [...state.logs, newLog];
          if (newLogs.length > 300) newLogs.shift();
          return { logs: newLogs };
        }),

      clearLogs: () => set({ logs: [] }),

      startLaunch: () => {
        const { addLog, selectedInstanceId, instances, settings } = get();
        const instance = instances.find((i) => i.id === selectedInstanceId);

        if (!instance || get().isPlaying) return;

        clearBrowserLaunchInterval();

        set({
          isPlaying: true,
          launchProgress: 0,
          launchStatus: 'Инициализация...',
          activeTab: 'console',
          launchStartedAt: Date.now(),
        });
        get().clearLogs();
        addLog('INFO', 'Launcher', `Начинаю запуск: ${instance.name} (${instance.version})`);
        addLog('INFO', 'Auth', 'Подготовка контекста запуска...');

        if (window.zlauncher?.isDesktop) {
          window.zlauncher
            .startLaunch({ instance, settings })
            .then(() => {
              set({ launchStatus: 'Игровой процесс запущен', launchProgress: 20 });
              if (settings.autoClose) {
                window.zlauncher?.windowClose().catch(() => undefined);
              }
            })
            .catch((error: unknown) => {
              const message = error instanceof Error ? error.message : String(error);
              addLog('ERROR', 'Launcher', message);
              clearBrowserLaunchInterval();
              set({ isPlaying: false, launchStatus: 'Готово', launchProgress: 0, launchStartedAt: null });
            });
          return;
        }

        let progress = 0;
        browserLaunchInterval = setInterval(() => {
          progress += Math.random() * 2 + 0.5;
          if (progress > 100) progress = 100;
          set({ launchProgress: progress });

          if (progress > 5 && progress < 8) set({ launchStatus: 'Скачивание библиотек...' });
          if (progress > 45 && progress < 48) set({ launchStatus: 'Распаковка natives...' });
          if (progress > 60 && progress < 63) set({ launchStatus: 'Проверка ресурсов...' });
          if (progress > 80 && progress < 83) set({ launchStatus: 'Завершение...' });

          if (progress >= 100) {
            clearBrowserLaunchInterval();
            set({ launchStatus: 'Игра запущена' });
            addLog('INFO', 'Client', 'Окно игры создано');
            setTimeout(() => {
              set({ isPlaying: false, launchStatus: 'Готово', launchProgress: 0, launchStartedAt: null });
              addLog('INFO', 'Launcher', 'Игровой процесс завершился с кодом 0');
            }, 5000);
          }
        }, 100);
      },

      stopLaunch: () => {
        clearBrowserLaunchInterval();
        if (window.zlauncher?.isDesktop) {
          window.zlauncher.stopLaunch().catch(() => undefined);
        }
        set({ isPlaying: false, launchProgress: 0, launchStatus: 'Готово', launchStartedAt: null });
      },

      processDesktopEvent: (event) => {
        if (event.type === 'status') {
          set({ launchStatus: event.payload.value });
          return;
        }
        if (event.type === 'progress') {
          const value = Math.max(0, Math.min(100, event.payload.value));
          set({ launchProgress: value });
          return;
        }
        if (event.type === 'error') {
          get().addLog('ERROR', 'Launcher', event.payload.message);
          clearBrowserLaunchInterval();
          set({ isPlaying: false, launchProgress: 0, launchStatus: 'Готово', launchStartedAt: null });
          return;
        }
        if (event.type === 'log') {
          const text = event.payload.message;
          if (!text) return;
          text
            .split(/\r?\n/)
            .filter(Boolean)
            .forEach((line) => {
              get().addLog(event.payload.level, event.payload.source, line);
            });
          return;
        }
        if (event.type === 'exit') {
          clearBrowserLaunchInterval();
          const startedAt = get().launchStartedAt;
          if (startedAt && get().selectedInstanceId) {
            const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
            set((state) => ({
              instances: state.instances.map((item) =>
                item.id === state.selectedInstanceId ? { ...item, playTime: item.playTime + minutes, lastPlayed: Date.now() } : item
              ),
            }));
          }
          set({ isPlaying: false, launchProgress: 0, launchStatus: 'Готово', launchStartedAt: null });
        }
      },
    }),
    {
      name: 'zlauncher-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<LauncherState>;
        return {
          ...currentState,
          ...persisted,
          settings: {
            ...DEFAULT_SETTINGS,
            ...(persisted.settings ?? {}),
            resolution: {
              ...DEFAULT_SETTINGS.resolution,
              ...(persisted.settings?.resolution ?? {}),
            },
          },
        };
      },
      partialize: (state) => ({
        instances: state.instances,
        settings: state.settings,
        selectedInstanceId: state.selectedInstanceId,
      }),
    }
  )
);
