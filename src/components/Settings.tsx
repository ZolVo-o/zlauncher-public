import React from 'react';
import { Save, RefreshCw, FolderOpen, BookOpen } from 'lucide-react';
import { useLauncherStore } from '../store/launcherStore';
import { cn } from '../utils/cn';

export function Settings() {
  const { settings, updateSettings } = useLauncherStore();
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [saved, setSaved] = React.useState(false);

  const validationIssues = React.useMemo(() => {
    const issues: string[] = [];
    if (localSettings.minMemory < 512) issues.push('Минимальная память не может быть меньше 512 MB.');
    if (localSettings.maxMemory < localSettings.minMemory) issues.push('Максимальная память должна быть больше или равна минимальной.');
    if (localSettings.maxMemory > 65536) issues.push('Максимальная память не должна превышать 65536 MB.');
    if (localSettings.resolution.width < 640) issues.push('Ширина экрана должна быть не меньше 640.');
    if (localSettings.resolution.height < 480) issues.push('Высота экрана должна быть не меньше 480.');
    if (localSettings.username.trim().length < 3) issues.push('Никнейм должен содержать минимум 3 символа.');
    return issues;
  }, [localSettings]);

  const canSave = validationIssues.length === 0;

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof typeof settings, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const browseJava = async () => {
    const filePath = await window.zlauncher?.pickFile([{ name: 'Java', extensions: ['exe'] }]);
    if (filePath) handleChange('javaPath', filePath);
  };

  const browseGameDir = async () => {
    const filePath = await window.zlauncher?.pickFolder();
    if (filePath) handleChange('gameDir', filePath);
  };

  const handleSave = () => {
    if (!canSave) return;
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Настройки лаунчера</h2>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed',
            saved ? 'bg-green-600 text-white' : 'bg-accent-600 hover:bg-accent-500 text-white'
          )}
        >
          {saved ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>

      {validationIssues.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          <p className="font-semibold mb-1">Проверь настройки перед сохранением:</p>
          <ul className="list-disc pl-5 space-y-1">
            {validationIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6">
        <section className="bg-zinc-900/60 border border-accent-700/30 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-semibold border-b border-white/5 pb-2">Спецрежим доступности</h3>
          <p className="text-sm text-zinc-300">
            Режим для людей с ограниченной подвижностью: крупные кнопки, управление одной рукой и меньше визуальных эффектов.
          </p>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={localSettings.accessibilityMode}
              onChange={(e) => handleChange('accessibilityMode', e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-zinc-950 checked:bg-accent-600 focus:ring-accent-600 transition-colors"
            />
            <span className="group-hover:text-white text-zinc-300 transition-colors">Включить спецрежим доступности</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Сторона управления одной рукой</label>
              <select
                value={localSettings.oneHandedSide}
                onChange={(e) => handleChange('oneHandedSide', e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors"
              >
                <option value="right">Правая сторона</option>
                <option value="left">Левая сторона</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Быстрые действия</label>
              <p className="text-xs text-zinc-500 bg-black/20 border border-white/5 rounded-lg px-3 py-2">
                Пробел: запуск/остановка • F1-F6: переключение разделов
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={localSettings.largeControls}
              onChange={(e) => handleChange('largeControls', e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-zinc-950 checked:bg-accent-600 focus:ring-accent-600 transition-colors"
            />
            <span className="group-hover:text-white text-zinc-300 transition-colors">Крупные кнопки и элементы управления</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={localSettings.reduceEffects}
              onChange={(e) => handleChange('reduceEffects', e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-zinc-950 checked:bg-accent-600 focus:ring-accent-600 transition-colors"
            />
            <span className="group-hover:text-white text-zinc-300 transition-colors">Уменьшить анимации и эффекты</span>
          </label>
        </section>

        <section className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-semibold border-b border-white/5 pb-2">Среда запуска</h3>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Путь к Java (javaw.exe)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localSettings.javaPath}
                onChange={(e) => handleChange('javaPath', e.target.value)}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors font-mono text-sm"
              />
              <button onClick={browseJava} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Обзор
              </button>
            </div>
            <p className="text-xs text-zinc-500">Если оставить пустым, лаунчер может установить Java автоматически.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Предпочтительная версия Java</label>
            <select
              value={localSettings.javaVersionPreference}
              onChange={(e) => handleChange('javaVersionPreference', e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors"
            >
              <option value="auto">Авто (рекомендуется)</option>
              <option value="8">Java 8</option>
              <option value="17">Java 17</option>
              <option value="21">Java 21</option>
            </select>
            <p className="text-xs text-zinc-500">При выборе «Авто» версия подбирается по версии Minecraft.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Папка игры (рабочая директория)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localSettings.gameDir}
                onChange={(e) => handleChange('gameDir', e.target.value)}
                className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors font-mono text-sm"
              />
              <button onClick={browseGameDir} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Обзор
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Никнейм</label>
              <input
                type="text"
                value={localSettings.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Доп. JVM аргументы</label>
              <input
                type="text"
                value={localSettings.jvmArgs}
                onChange={(e) => handleChange('jvmArgs', e.target.value)}
                placeholder="-Dfile.encoding=UTF-8"
                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Доп. аргументы игры</label>
            <input
              type="text"
              value={localSettings.gameArgs}
              onChange={(e) => handleChange('gameArgs', e.target.value)}
              placeholder="--demo"
              className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors font-mono text-sm"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={localSettings.autoInstallDependencies}
              onChange={(e) => handleChange('autoInstallDependencies', e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-zinc-950 checked:bg-accent-600 focus:ring-accent-600 transition-colors"
            />
            <span className="group-hover:text-white text-zinc-300 transition-colors">Автоустановка недостающих зависимостей (Java/runtime)</span>
          </label>
        </section>

        <section className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-semibold border-b border-white/5 pb-2">Память</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Минимум памяти (MB)</label>
              <input
                type="number"
                value={localSettings.minMemory}
                onChange={(e) => handleChange('minMemory', parseInt(e.target.value, 10) || 0)}
                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Максимум памяти (MB)</label>
              <input
                type="number"
                value={localSettings.maxMemory}
                onChange={(e) => handleChange('maxMemory', parseInt(e.target.value, 10) || 0)}
                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </section>

        <section className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-semibold border-b border-white/5 pb-2">Видео</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Ширина</label>
              <input
                type="number"
                value={localSettings.resolution.width}
                onChange={(e) => handleChange('resolution', { ...localSettings.resolution, width: parseInt(e.target.value, 10) || 1920 })}
                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Высота</label>
              <input
                type="number"
                value={localSettings.resolution.height}
                onChange={(e) => handleChange('resolution', { ...localSettings.resolution, height: parseInt(e.target.value, 10) || 1080 })}
                className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={localSettings.fullScreen}
                onChange={(e) => handleChange('fullScreen', e.target.checked)}
                className="w-5 h-5 rounded border-white/10 bg-zinc-950 checked:bg-accent-600 focus:ring-accent-600 transition-colors"
              />
              <span className="group-hover:text-white text-zinc-300 transition-colors">Запускать в полноэкранном режиме</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={localSettings.autoClose}
                onChange={(e) => handleChange('autoClose', e.target.checked)}
                className="w-5 h-5 rounded border-white/10 bg-zinc-950 checked:bg-accent-600 focus:ring-accent-600 transition-colors"
              />
              <span className="group-hover:text-white text-zinc-300 transition-colors">Закрывать лаунчер после запуска игры</span>
            </label>
          </div>
        </section>

        <section className="bg-zinc-900/40 border border-white/5 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-zinc-200">
            <BookOpen className="w-5 h-5 text-accent-500" />
            <h3 className="text-lg font-semibold">Краткая документация по Java</h3>
          </div>
          <div className="text-sm text-zinc-300 space-y-2">
            <p><span className="font-semibold text-zinc-100">Java 8:</span> старые версии Minecraft (до 1.16).</p>
            <p><span className="font-semibold text-zinc-100">Java 17:</span> Minecraft 1.18 - 1.20.4.</p>
            <p><span className="font-semibold text-zinc-100">Java 21:</span> Minecraft 1.20.5+ и 1.21.x.</p>
            <p>Если не хочешь разбираться вручную, оставь <span className="font-semibold text-zinc-100">«Авто»</span> и включи автоустановку.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
