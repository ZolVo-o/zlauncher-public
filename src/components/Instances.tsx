import { useEffect, useMemo, useState } from 'react';
import { useLauncherStore } from '../store/launcherStore';
import { Box, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export function Instances() {
  const { instances, addInstance, removeInstance, selectInstance, selectedInstanceId } = useLauncherStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInstance, setNewInstance] = useState<{ name: string; version: string; type: 'release' | 'snapshot' | 'modded' }>({
    name: '',
    version: '1.20.4',
    type: 'release',
  });
  const [availableVersions, setAvailableVersions] = useState<Array<{ id: string; type: string }>>([]);

  useEffect(() => {
    if (!window.zlauncher?.isDesktop) return;
    window.zlauncher.getVersions()
      .then((versions) => {
        const filtered = versions
          .filter((item) => item.type === 'release' || item.type === 'snapshot')
          .map((item) => ({ id: item.id, type: item.type }));
        setAvailableVersions(filtered);
        if (filtered.length && !filtered.some((item) => item.id === newInstance.version)) {
          setNewInstance((prev) => ({
            ...prev,
            version: filtered[0].id,
            type: filtered[0].type === 'snapshot' ? 'snapshot' : prev.type,
          }));
        }
      })
      .catch(() => undefined);
  }, []);

  const versionOptions = useMemo(() => {
    if (availableVersions.length) return availableVersions;
    return [
      { id: '1.20.4', type: 'release' },
      { id: '1.20.1', type: 'release' },
      { id: '1.19.4', type: 'release' },
      { id: '1.18.2', type: 'release' },
      { id: '1.16.5', type: 'release' },
      { id: '1.12.2', type: 'release' },
      { id: '1.8.9', type: 'release' },
    ];
  }, [availableVersions]);

  const handleAdd = () => {
    if (!newInstance.name || !newInstance.version) return;
    addInstance({
      name: newInstance.name,
      version: newInstance.version,
      type: newInstance.type,
      loader: 'vanilla',
    });
    setShowAddModal(false);
    setNewInstance({ name: '', version: '1.20.4', type: 'release' });
  };

  return (
    <div className="p-8 h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Мои сборки</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-accent-600 hover:bg-accent-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-accent-900/20"
        >
          <Plus size={18} />
          Создать сборку
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-20 pr-2">
        <AnimatePresence>
          {instances.map((instance) => (
            <motion.div
              key={instance.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                'group relative bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-accent-600/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer',
                selectedInstanceId === instance.id && 'border-accent-600 ring-1 ring-accent-600 bg-accent-900/10'
              )}
              onClick={() => selectInstance(instance.id)}
            >
              <div className="h-32 bg-gradient-to-br from-zinc-800 to-zinc-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.minecraft.net/content/dam/games/minecraft/key-art/Minecraft-1-19-Wild-Update-Key-Art.jpg')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-500 scale-110 group-hover:scale-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-black/50 hover:bg-accent-600 rounded-lg text-white transition-colors" title="Настройки">
                    <SettingsIcon size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeInstance(instance.id); }}
                    className="p-2 bg-black/50 hover:bg-red-600 rounded-lg text-white transition-colors"
                    title="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-4 relative">
                <div className="absolute -top-10 left-4 w-16 h-16 bg-zinc-800 rounded-xl border-4 border-zinc-900 shadow-xl flex items-center justify-center">
                  <Box className="w-8 h-8 text-zinc-400 group-hover:text-accent-500 transition-colors" />
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-bold truncate pr-8">{instance.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300 border border-white/5 uppercase tracking-wider font-bold">{instance.version}</span>
                    <span>-</span>
                    <span className="capitalize">{instance.loader || 'ваниль'}</span>
                    <span>-</span>
                    <span>Сыграно: {Math.floor(instance.playTime / 60)}ч {instance.playTime % 60}м</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">Создание сборки</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Название</label>
                <input
                  type="text"
                  value={newInstance.name}
                  onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                  placeholder="Моя сборка"
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Версия игры</label>
                <select
                  value={newInstance.version}
                  onChange={(e) => {
                    const selected = versionOptions.find((item) => item.id === e.target.value);
                    setNewInstance({
                      ...newInstance,
                      version: e.target.value,
                      type: selected?.type === 'snapshot' ? 'snapshot' : newInstance.type,
                    });
                  }}
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2 focus:border-accent-600 focus:outline-none transition-colors appearance-none"
                >
                  <option value="" disabled>Выберите версию</option>
                  {versionOptions.map((item, index) => (
                    <option key={item.id} value={item.id}>
                      {item.id} {index === 0 ? '(последняя)' : ''} [{item.type === 'release' ? 'релиз' : 'снапшот'}]
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Тип</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['release', 'snapshot', 'modded'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewInstance({ ...newInstance, type })}
                      className={cn(
                        'px-2 py-2 rounded-lg text-sm border transition-all capitalize',
                        newInstance.type === type
                          ? 'bg-accent-600/20 border-accent-600 text-accent-500 font-bold'
                          : 'bg-zinc-950 border-white/10 text-zinc-400 hover:bg-zinc-800'
                      )}
                    >
                      {type === 'release' ? 'релиз' : type === 'snapshot' ? 'снапшот' : 'моды'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleAdd}
                className="px-6 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-accent-900/20"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
