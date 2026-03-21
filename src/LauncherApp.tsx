import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Settings as SettingsIcon,
  Box,
  Newspaper,
  User,
  LogOut,
  HardDrive,
  Palette,
  ChevronDown,
  Terminal,
  X,
  Minus,
  Maximize2,
  Trash2,
  Square,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils/cn';
import { useLauncherStore } from './store/launcherStore';
import { Settings } from './components/Settings';
import { Instances } from './components/Instances';
import { ModsManager } from './components/ModsManager';
import { SkinsManager } from './components/SkinsManager';

const NEWS_ITEMS = [
  {
    id: 1,
    title: 'Релиз-кандидат 1.20.4',
    description: 'Вышел новый релиз-кандидат Java Edition с исправлением критичных багов.',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000&auto=format&fit=crop',
    date: '2 часа назад',
  },
  {
    id: 2,
    title: 'Плановые работы на серверах',
    description: 'Официальные сервисы zollauncher будут недоступны в воскресенье ночью.',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop',
    date: '1 день назад',
  },
  {
    id: 3,
    title: 'Конкурс скинов',
    description: 'Загрузи тематический скин и получи шанс выиграть эксклюзивный плащ.',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
    date: '3 дня назад',
  },
];

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden',
      active ? 'text-white bg-gradient-to-r from-accent-900/50 to-transparent border-l-4 border-accent-600' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
    )}
  >
    <Icon className={cn('w-5 h-5 transition-transform group-hover:scale-110', active && 'text-accent-500')} />
    <span className="font-medium tracking-wide">{label}</span>
    {active && (
      <motion.div
        layoutId="sidebar-glow"
        className="absolute inset-0 bg-accent-600/10 blur-md -z-10"
        transition={{ duration: 0.2 }}
      />
    )}
  </button>
);

const ProgressBar = ({ progress, status }: { progress: number; status: string }) => (
  <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
    <div className="w-full max-w-md space-y-4">
      <div className="flex justify-between text-sm text-zinc-300">
        <span className="font-mono">{status}</span>
        <span className="font-mono">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-accent-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'linear' }}
        />
      </div>
      <div className="text-xs text-zinc-500 font-mono truncate">{progress < 100 ? 'Идёт загрузка файлов игры...' : 'Запуск игры...'}</div>
    </div>
  </div>
);

export default function LauncherApp() {
  const {
    activeTab,
    setActiveTab,
    instances,
    selectedInstanceId,
    selectInstance,
    isPlaying,
    launchProgress,
    launchStatus,
    startLaunch,
    stopLaunch,
    processDesktopEvent,
    logs,
    clearLogs,
    settings,
  } = useLauncherStore();

  const [showVersionSelector, setShowVersionSelector] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const selectedInstance = instances.find((i) => i.id === selectedInstanceId) || instances[0];
  const accessibility = settings.accessibilityMode;
  const isRightHandMode = accessibility && settings.oneHandedSide === 'right';
  const isLeftHandMode = accessibility && settings.oneHandedSide === 'left';
  const largeUi = accessibility && settings.largeControls;

  const formatLoader = (loader?: string) => {
    if (!loader || loader === 'vanilla') return 'ваниль';
    return loader;
  };

  useEffect(() => {
    if (activeTab === 'console' && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  useEffect(() => {
    if (!window.zlauncher?.isDesktop) return;
    const unsubscribe = window.zlauncher.onLauncherEvent((event) => processDesktopEvent(event));
    return unsubscribe;
  }, [processDesktopEvent]);

  useEffect(() => {
    if (!accessibility) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || (target?.isContentEditable ?? false);
      if (typing) return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (isPlaying) stopLaunch();
        else startLaunch();
      }
      if (event.code === 'F1') setActiveTab('home');
      if (event.code === 'F2') setActiveTab('instances');
      if (event.code === 'F3') setActiveTab('console');
      if (event.code === 'F4') setActiveTab('settings');
      if (event.code === 'F5') setActiveTab('mods');
      if (event.code === 'F6') setActiveTab('skins');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [accessibility, isPlaying, setActiveTab, startLaunch, stopLaunch]);

  return (
    <div className={cn("flex h-screen w-screen bg-[#111] text-white overflow-hidden relative selection:bg-accent-900 selection:text-white font-sans pt-10", largeUi && "text-[1.05rem]")}>
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <img src="https://images.unsplash.com/photo-1627556592933-ffe99c1cd9eb?q=80&w=2000&auto=format&fit=crop" alt="Фон" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
      </div>

      <div className="absolute top-0 left-0 right-0 h-10 z-50 app-drag border-b border-white/10 bg-[#0f0f0f]/80 backdrop-blur-md flex items-center justify-between">
        <div className="px-4 text-xs uppercase tracking-widest text-zinc-500">zollauncher</div>
        <div className="flex h-full app-no-drag">
          <button onClick={() => window.zlauncher?.windowMinimize()} className="w-12 h-full flex items-center justify-center text-zinc-400 hover:bg-white/10"><Minus size={14} /></button>
          <button onClick={() => window.zlauncher?.windowMaximize()} className="w-12 h-full flex items-center justify-center text-zinc-400 hover:bg-white/10"><Maximize2 size={14} /></button>
          <button onClick={() => window.zlauncher?.windowClose()} className="w-12 h-full flex items-center justify-center text-zinc-300 hover:bg-red-600 hover:text-white transition-colors"><X size={14} /></button>
        </div>
      </div>

      <div className={cn("w-72 relative z-20 flex flex-col bg-zinc-950/50 backdrop-blur-xl", isRightHandMode ? "order-last border-l border-white/5" : "order-first border-r border-white/5", largeUi && "w-80")}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <span className="font-bold text-xl">Z</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">zollauncher</h1>
            <p className="text-xs text-zinc-500 font-mono">v3.1.0</p>
          </div>
        </div>

        <div className="flex-1 px-3 space-y-1 mt-4">
          <SidebarItem icon={Newspaper} label="Новости" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <SidebarItem icon={Box} label="Сборки" active={activeTab === 'instances'} onClick={() => setActiveTab('instances')} />
          <SidebarItem icon={HardDrive} label="Моды" active={activeTab === 'mods'} onClick={() => setActiveTab('mods')} />
          <SidebarItem icon={Palette} label="Скины" active={activeTab === 'skins'} onClick={() => setActiveTab('skins')} />
          <SidebarItem icon={Terminal} label="Консоль" active={activeTab === 'console'} onClick={() => setActiveTab('console')} />
        </div>

        <div className="p-3 border-t border-white/5 space-y-1">
          <SidebarItem icon={SettingsIcon} label="Настройки" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-950/30 text-zinc-400 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Выйти</span>
          </button>
        </div>
      </div>

      <div className={cn("flex-1 relative z-10 flex flex-col h-full", isRightHandMode && "order-first", isLeftHandMode && "order-last")}>
        <div className="flex-1 overflow-y-auto pb-32 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-8 space-y-8">
                <div className="rounded-2xl overflow-hidden relative h-64 group cursor-pointer border border-white/10 shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-8">
                    <span className="inline-block px-3 py-1 bg-accent-600 text-white text-xs font-bold rounded-full mb-3 w-fit">ГЛАВНОЕ</span>
                    <h2 className="text-3xl font-bold mb-2">Обновлённый запуск без ручной настройки</h2>
                    <p className="text-zinc-300 max-w-2xl">Лаунчер сам подготовит окружение и скачает недостающие файлы для выбранной сборки.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-accent-500" />
                    Последние новости
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {NEWS_ITEMS.map((item) => (
                      <div key={item.id} className="bg-zinc-900/60 border border-white/5 rounded-xl overflow-hidden hover:border-accent-600/50 transition-colors group cursor-pointer">
                        <div className="h-40 overflow-hidden">
                          <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        </div>
                        <div className="p-4">
                          <div className="text-xs text-accent-400 mb-2">{item.date}</div>
                          <h4 className="font-bold text-lg mb-2 leading-tight group-hover:text-accent-400 transition-colors">{item.title}</h4>
                          <p className="text-sm text-zinc-400 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'instances' && (
              <motion.div key="instances" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                <Instances />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full overflow-y-auto">
                <Settings />
              </motion.div>
            )}

            {activeTab === 'console' && (
              <motion.div key="console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full flex flex-col">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Terminal className="text-accent-500" />
                    Вывод игры
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={clearLogs} className="px-3 py-2 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/10 text-sm inline-flex items-center gap-2">
                      <Trash2 size={14} />
                      Очистить лог
                    </button>
                    <button onClick={stopLaunch} disabled={!isPlaying} className="px-3 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-600/20 text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Square size={14} />
                      Остановить
                    </button>
                  </div>
                </div>
                <div ref={logContainerRef} className="flex-1 bg-[#0c0c0c] border border-white/10 rounded-xl p-4 font-mono text-sm overflow-y-auto text-zinc-400 shadow-inner">
                  {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-600 italic">Логи пока пустые. Нажми «Играть», чтобы увидеть запуск.</div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="hover:bg-white/5 px-2 py-0.5 rounded">
                        <span className="text-zinc-600">[{log.timestamp}]</span>{' '}
                        <span className={cn('font-bold', log.level === 'INFO' && 'text-blue-400', log.level === 'WARN' && 'text-yellow-500', log.level === 'ERROR' && 'text-red-500', log.level === 'DEBUG' && 'text-zinc-500')}>
                          [{log.source}/{log.level}]:
                        </span>{' '}
                        <span className="text-zinc-300">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'mods' && (
              <motion.div key="mods" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                <ModsManager />
              </motion.div>
            )}

            {activeTab === 'skins' && (
              <motion.div key="skins" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                <SkinsManager />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={cn("absolute bottom-0 left-0 right-0 h-24 bg-[#111]/80 backdrop-blur-md border-t border-white/10 flex items-center px-8 gap-6 z-50", largeUi && "h-28")}>
          <div className="flex items-center gap-3 w-64">
            <div className="w-10 h-10 rounded bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center relative">
              <User className="w-5 h-5 text-zinc-400" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111]" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">SteveDev</div>
              <div className="text-xs text-zinc-500">Локальный аккаунт</div>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="flex-1 max-w-xl relative">
            <button
              onClick={() => setShowVersionSelector(!showVersionSelector)}
              disabled={isPlaying}
              className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors disabled:opacity-50"
            >
              <div className="flex flex-col items-start">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Выбранная сборка</span>
                <span className="font-medium text-zinc-200">{selectedInstance?.name || 'Выберите сборку'}</span>
              </div>
              <ChevronDown className={cn('text-zinc-500 transition-transform', showVersionSelector && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {showVersionSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
                >
                  {instances.map((inst) => (
                    <button key={inst.id} onClick={() => { selectInstance(inst.id); setShowVersionSelector(false); }} className="w-full px-4 py-3 text-left hover:bg-zinc-800 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0">
                      <Box className="w-4 h-4 text-zinc-500" />
                      <div className="flex-1">
                        <div className={cn('text-sm font-bold', selectedInstanceId === inst.id && 'text-accent-500')}>{inst.name}</div>
                        <div className="text-xs text-zinc-500">{inst.version} - {formatLoader(inst.loader)}</div>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setActiveTab('instances');
                      setShowVersionSelector(false);
                    }}
                    className="w-full px-4 py-2 bg-zinc-950 text-center text-xs text-accent-500 hover:text-accent-400 font-bold uppercase tracking-wider sticky bottom-0 border-t border-white/10"
                  >
                    Управление сборками
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={startLaunch}
            disabled={isPlaying || !selectedInstance}
            className={cn("flex-1 max-w-xs h-14 bg-accent-600 hover:bg-accent-500 active:bg-accent-700 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden relative disabled:hover:scale-100 disabled:shadow-none", largeUi && "h-16 text-lg max-w-sm")}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-shimmer" />
            {isPlaying ? (
              <span className="font-bold text-xl tracking-wide animate-pulse">ЗАПУСК...</span>
            ) : (
              <>
                <span className="font-bold text-xl tracking-wide">ИГРАТЬ</span>
                <Play className="w-6 h-6 fill-current" />
              </>
            )}
          </button>
        </div>
      </div>

      {isPlaying && <ProgressBar progress={launchProgress} status={launchStatus} />}

      {accessibility && (
        <div className={cn("absolute bottom-32 z-[60] flex flex-col gap-3 app-no-drag", isRightHandMode ? "right-6" : "left-6")}>
          <button
            onClick={startLaunch}
            disabled={isPlaying || !selectedInstance}
            className="h-14 min-w-[180px] rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-bold shadow-lg disabled:opacity-50"
          >
            Играть
          </button>
          <button
            onClick={stopLaunch}
            disabled={!isPlaying}
            className="h-12 min-w-[180px] rounded-xl border border-red-500/50 bg-red-950/30 hover:bg-red-900/40 text-red-200 font-semibold disabled:opacity-40"
          >
            Остановить
          </button>
        </div>
      )}
    </div>
  );
}
