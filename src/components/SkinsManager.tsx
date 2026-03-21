import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Trash2, UserRound } from 'lucide-react';
import { useLauncherStore } from '../store/launcherStore';
import { cn } from '../utils/cn';

interface SkinItem {
  id: string;
  name: string;
  preview: string;
  kind: 'preset' | 'local';
  sourcePath?: string;
}

const PRESET_SKINS: SkinItem[] = [
  {
    id: 'preset-steve',
    name: 'Steve (classic)',
    preview: 'https://mc-heads.net/body/Steve/left',
    kind: 'preset',
  },
  {
    id: 'preset-alex',
    name: 'Alex (slim)',
    preview: 'https://mc-heads.net/body/Alex/left',
    kind: 'preset',
  },
  {
    id: 'preset-notch',
    name: 'Notch',
    preview: 'https://mc-heads.net/body/Notch/left',
    kind: 'preset',
  },
];

const LOCAL_SKINS_STORAGE_KEY = 'zollauncher-local-skins';
const SELECTED_SKIN_STORAGE_KEY = 'zollauncher-selected-skin';

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

function toFileUrl(filePath: string) {
  const normalized = filePath.replace(/\\/g, '/');
  return encodeURI(`file:///${normalized}`);
}

export function SkinsManager() {
  const { addLog } = useLauncherStore();
  const [localSkins, setLocalSkins] = useState<SkinItem[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState(PRESET_SKINS[0]?.id ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDesktop = Boolean(window.zlauncher?.isDesktop);

  useEffect(() => {
    try {
      const rawLocal = localStorage.getItem(LOCAL_SKINS_STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal) as SkinItem[];
        if (Array.isArray(parsed)) {
          setLocalSkins(
            parsed.filter(
              (item) =>
                item &&
                typeof item.id === 'string' &&
                typeof item.name === 'string' &&
                typeof item.preview === 'string' &&
                item.kind === 'local'
            )
          );
        }
      }

      const savedSelected = localStorage.getItem(SELECTED_SKIN_STORAGE_KEY);
      if (savedSelected) {
        setSelectedSkinId(savedSelected);
      }
    } catch (_err) {
      // ignore invalid persisted data
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_SKINS_STORAGE_KEY, JSON.stringify(localSkins));
  }, [localSkins]);

  useEffect(() => {
    if (!selectedSkinId) return;
    localStorage.setItem(SELECTED_SKIN_STORAGE_KEY, selectedSkinId);
  }, [selectedSkinId]);

  const allSkins = useMemo(() => [...PRESET_SKINS, ...localSkins], [localSkins]);
  const selectedSkin = allSkins.find((skin) => skin.id === selectedSkinId) ?? allSkins[0] ?? null;

  useEffect(() => {
    if (!selectedSkin && allSkins.length > 0) {
      setSelectedSkinId(allSkins[0].id);
    }
  }, [allSkins, selectedSkin]);

  const selectSkin = (skin: SkinItem) => {
    setSelectedSkinId(skin.id);
    addLog('INFO', 'Skins', `Выбран скин: ${skin.name}`);
  };

  const addLocalSkin = (name: string, preview: string, sourcePath?: string) => {
    const item: SkinItem = {
      id: createId(),
      name,
      preview,
      kind: 'local',
      sourcePath,
    };
    setLocalSkins((prev) => [item, ...prev]);
    setSelectedSkinId(item.id);
    addLog('INFO', 'Skins', `Импортирован скин: ${name}`);
  };

  const importDesktopSkin = async () => {
    if (!window.zlauncher?.isDesktop) return;
    const filePath = await window.zlauncher.pickFile([{ name: 'Minecraft skins', extensions: ['png'] }]);
    if (!filePath) return;

    const fileName = filePath.split(/[/\\]/).pop() || 'skin.png';
    addLocalSkin(fileName, toFileUrl(filePath), filePath);
  };

  const importWebSkin = () => {
    fileInputRef.current?.click();
  };

  const onWebFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const preview = typeof reader.result === 'string' ? reader.result : '';
      if (!preview) return;
      addLocalSkin(file.name, preview);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const removeSkin = (skinId: string) => {
    const target = localSkins.find((item) => item.id === skinId);
    if (!target) return;

    setLocalSkins((prev) => prev.filter((item) => item.id !== skinId));
    if (selectedSkinId === skinId) {
      setSelectedSkinId(PRESET_SKINS[0]?.id ?? '');
    }
    addLog('WARN', 'Skins', `Удален скин: ${target.name}`);
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Скины</h2>
          <p className="text-sm text-zinc-400 mt-1">Выбери пресет или импортируй свой PNG-скин.</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            aria-label="Импорт PNG-скина"
            className="hidden"
            onChange={onWebFileSelected}
          />
          <button
            onClick={isDesktop ? importDesktopSkin : importWebSkin}
            className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white inline-flex items-center gap-2"
          >
            <ImagePlus className="w-4 h-4" />
            Импорт PNG
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4 flex items-center gap-4">
        <div className="w-24 h-24 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
          {selectedSkin ? (
            <img src={selectedSkin.preview} alt={selectedSkin.name} className="w-full h-full object-cover" />
          ) : (
            <UserRound className="w-8 h-8 text-zinc-600" />
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Активный скин</p>
          <p className="text-xl font-bold text-zinc-100 mt-1">{selectedSkin?.name || 'Не выбран'}</p>
          <p className="text-sm text-zinc-400 mt-1">
            Скин сохраняется в лаунчере как пресет. Для онлайн-профиля Mojang загрузи его отдельно.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {allSkins.map((skin) => (
            <div
              key={skin.id}
              role="button"
              tabIndex={0}
              onClick={() => selectSkin(skin)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  selectSkin(skin);
                }
              }}
              className={cn(
                'group relative rounded-xl border bg-zinc-900/50 p-3 text-left transition-colors cursor-pointer',
                selectedSkinId === skin.id
                  ? 'border-accent-500 shadow-[0_0_0_1px_rgba(239,68,68,0.35)]'
                  : 'border-white/10 hover:border-white/25'
              )}
            >
              <div className="rounded-lg bg-zinc-950 border border-white/10 overflow-hidden aspect-square flex items-center justify-center">
                <img src={skin.preview} alt={skin.name} className="w-full h-full object-cover" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{skin.name}</p>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{skin.kind === 'preset' ? 'preset' : 'local'}</p>
                </div>
                {selectedSkinId === skin.id ? <CheckCircle2 className="w-4 h-4 text-accent-400 shrink-0" /> : null}
              </div>

              {skin.kind === 'local' ? (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    removeSkin(skin.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-md bg-black/50 border border-white/10 text-zinc-300 hover:text-red-300 hover:border-red-500/40"
                  title="Удалить скин"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

