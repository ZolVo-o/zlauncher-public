import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderOpen, HardDrive, RefreshCw, Trash2 } from 'lucide-react';
import { useLauncherStore } from '../store/launcherStore';
import { cn } from '../utils/cn';

interface ModItem {
  fileName: string;
  name: string;
  enabled: boolean;
  size: number;
  modifiedAt: number;
}

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function ModsManager() {
  const { settings, addLog } = useLauncherStore();
  const [mods, setMods] = useState<ModItem[]>([]);
  const [modsDir, setModsDir] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const desktopApi = window.zlauncher;
  const isDesktop = Boolean(desktopApi?.isDesktop);

  const loadMods = useCallback(async () => {
    if (!desktopApi?.isDesktop) return;
    setLoading(true);
    setError('');
    try {
      const data = await desktopApi.listMods(settings.gameDir);
      setMods(data.items);
      setModsDir(data.directory);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [desktopApi, settings.gameDir]);

  useEffect(() => {
    loadMods();
  }, [loadMods]);

  const summary = useMemo(() => {
    const totalSize = mods.reduce((acc, item) => acc + item.size, 0);
    return `${mods.length} модов, ${formatSize(totalSize)}`;
  }, [mods]);

  const handleDelete = async (fileName: string) => {
    if (!desktopApi?.isDesktop) return;
    const confirmed = window.confirm(`Удалить мод "${fileName}"?`);
    if (!confirmed) return;

    setDeletingName(fileName);
    setError('');
    try {
      const result = await desktopApi.deleteMod(settings.gameDir, fileName);
      if (!result.ok) {
        throw new Error(result.reason === 'not_found' ? 'Файл уже отсутствует в папке mods.' : 'Не удалось удалить мод.');
      }
      addLog('WARN', 'Mods', `Удален мод: ${fileName}`);
      await loadMods();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      addLog('ERROR', 'Mods', message);
    } finally {
      setDeletingName(null);
    }
  };

  const handleInstall = async () => {
    if (!desktopApi?.isDesktop) return;
    const sourcePath = await desktopApi.pickFile([{ name: 'Minecraft mods', extensions: ['jar'] }]);
    if (!sourcePath) return;

    setError('');
    try {
      let result = await desktopApi.installMod(settings.gameDir, sourcePath, false);
      if (!result.ok && result.reason === 'exists') {
        const shouldReplace = window.confirm('Мод с таким именем уже есть. Перезаписать файл?');
        if (!shouldReplace) return;
        result = await desktopApi.installMod(settings.gameDir, sourcePath, true);
      }
      if (!result.ok) {
        const reasonMap: Record<string, string> = {
          source_not_found: 'Выбранный файл не найден.',
          source_not_file: 'Выбранный путь не является файлом.',
          unsupported_extension: 'Поддерживаются только файлы .jar.',
          exists: 'Файл уже существует в папке mods.',
        };
        throw new Error(reasonMap[result.reason || ''] || 'Не удалось установить мод.');
      }

      addLog('INFO', 'Mods', `Установлен мод: ${result.fileName || sourcePath}`);
      await loadMods();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      addLog('ERROR', 'Mods', message);
    }
  };

  const handleToggle = async (mod: ModItem) => {
    if (!desktopApi?.isDesktop) return;
    setError('');
    try {
      const result = await desktopApi.toggleMod(settings.gameDir, mod.fileName, !mod.enabled);
      if (!result.ok) {
        const reasonMap: Record<string, string> = {
          not_found: 'Файл мода не найден.',
          target_exists: 'Невозможно переключить: целевой файл уже существует.',
          unsupported_extension: 'Неподдерживаемое расширение файла.',
        };
        throw new Error(reasonMap[result.reason || ''] || 'Не удалось изменить состояние мода.');
      }
      addLog('INFO', 'Mods', `${mod.enabled ? 'Отключен' : 'Включен'} мод: ${mod.name}`);
      await loadMods();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      addLog('ERROR', 'Mods', message);
    }
  };

  const handleOpenFolder = async () => {
    if (!desktopApi?.isDesktop) return;
    try {
      await desktopApi.openModsFolder(settings.gameDir);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      addLog('ERROR', 'Mods', message);
    }
  };

  if (!isDesktop) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-lg">
          <HardDrive className="w-16 h-16 text-zinc-700 mx-auto" />
          <h2 className="text-2xl font-bold text-zinc-300">Менеджер модов доступен в desktop-версии</h2>
          <p className="text-zinc-500">В веб-режиме нет доступа к локальной папке `mods`.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Менеджер модов</h2>
          <p className="text-sm text-zinc-400 mt-1">{summary}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-lg border border-accent-500/50 text-accent-200 bg-accent-900/20 hover:bg-accent-900/40 inline-flex items-center gap-2"
          >
            + Установить мод
          </button>
          <button
            onClick={loadMods}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 inline-flex items-center gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Обновить
          </button>
          <button
            onClick={handleOpenFolder}
            className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white inline-flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Открыть папку mods
          </button>
        </div>
      </div>

      <div className="text-xs text-zinc-500 font-mono truncate">{modsDir || 'Путь папки mods определяется...'}</div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/20">
        {mods.length === 0 ? (
          <div className="h-full min-h-[260px] flex items-center justify-center p-6 text-zinc-500 text-center">
            В папке `mods` пока нет `.jar` файлов.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {mods.map((item) => (
              <div key={item.fileName} className="flex items-center gap-4 p-4">
                <HardDrive className="w-5 h-5 text-zinc-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-semibold text-zinc-200 truncate">{item.name}</div>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider', item.enabled ? 'border-emerald-500/40 text-emerald-300 bg-emerald-900/20' : 'border-zinc-500/40 text-zinc-300 bg-zinc-800/30')}>
                      {item.enabled ? 'включен' : 'отключен'}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {formatSize(item.size)} • {new Date(item.modifiedAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(item)}
                  className={cn('px-3 py-2 rounded-lg border inline-flex items-center gap-2', item.enabled ? 'border-amber-500/40 text-amber-300 hover:bg-amber-600/20' : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/20')}
                >
                  {item.enabled ? 'Отключить' : 'Включить'}
                </button>
                <button
                  onClick={() => handleDelete(item.fileName)}
                  disabled={deletingName === item.fileName}
                  className="px-3 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-600/20 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

