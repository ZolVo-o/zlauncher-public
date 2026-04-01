import { useMemo, useState } from 'react';
import { Download, Square, Terminal, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { LogEntry } from '../../store/launcherStore';

type LogLevelFilter = 'ALL' | LogEntry['level'];

interface ConsoleTabProps {
  logs: LogEntry[];
  clearLogs: () => void;
  stopLaunch: () => void;
  isPlaying: boolean;
}

function toLogLine(log: LogEntry) {
  return `[${log.timestamp}] [${log.source}/${log.level}] ${log.message}`;
}

export function ConsoleTab({ logs, clearLogs, stopLaunch, isPlaying }: ConsoleTabProps) {
  const [levelFilter, setLevelFilter] = useState<LogLevelFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
      if (!query) return true;
      return toLogLine(log).toLowerCase().includes(query);
    });
  }, [logs, levelFilter, searchQuery]);

  const exportLogs = () => {
    if (!filteredLogs.length) return;
    const content = filteredLogs.map(toLogLine).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zlauncher-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div key="console" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full flex flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Terminal className="text-accent-500" />
          Вывод игры
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Поиск по логам"
            className="px-3 py-2 rounded-lg border border-white/10 bg-zinc-950 text-zinc-200 text-sm min-w-52"
          />
          <select
            title="Фильтр уровня логов"
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value as LogLevelFilter)}
            className="px-3 py-2 rounded-lg border border-white/10 bg-zinc-950 text-zinc-200 text-sm"
          >
            <option value="ALL">Все уровни</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="DEBUG">DEBUG</option>
          </select>
          <button onClick={exportLogs} className="px-3 py-2 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/10 text-sm inline-flex items-center gap-2" disabled={!filteredLogs.length}>
            <Download size={14} />
            Экспорт
          </button>
          <button onClick={clearLogs} className="px-3 py-2 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/10 text-sm inline-flex items-center gap-2">
            <Trash2 size={14} />
            Очистить
          </button>
          <button onClick={stopLaunch} disabled={!isPlaying} className="px-3 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-600/20 text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Square size={14} />
            Остановить
          </button>
        </div>
      </div>

      <div className="mb-3 text-xs text-zinc-500">Показано: {filteredLogs.length} / {logs.length}</div>

      <div className="flex-1 bg-[#0c0c0c] border border-white/10 rounded-xl p-4 font-mono text-sm overflow-y-auto text-zinc-400 shadow-inner">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 italic">Логи не найдены для текущего фильтра.</div>
        ) : (
          filteredLogs.map((log) => (
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
  );
}
