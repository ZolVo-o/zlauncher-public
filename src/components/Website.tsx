import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Layers,
  LifeBuoy,
  Monitor,
  Package,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { SITE_CONFIG } from '../config/siteConfig';
import { createLocalRegistration } from '../utils/registrationToken';

const FEATURES = [
  {
    icon: Rocket,
    title: 'Автонастройка запуска',
    text: 'Лаунчер подбирает Java и готовит окружение под выбранную версию Minecraft.',
  },
  {
    icon: ShieldCheck,
    title: 'Понятные ошибки',
    text: 'Диагностика и логи на русском языке без «молчаливых» падений.',
  },
  {
    icon: Layers,
    title: 'Сборки и профили',
    text: 'Отдельные конфигурации, настройки запуска и быстрый выбор активной сборки.',
  },
  {
    icon: Package,
    title: 'Поддержка модов',
    text: 'Управление модами и отдельный мод доступности для режима одной руки.',
  },
];

const RELEASE_CHANNELS = [
  {
    title: 'Desktop Launcher (Setup)',
    text: 'Установщик для Windows. Основной рекомендованный вариант.',
    tag: 'setup',
  },
  {
    title: 'Desktop Launcher (Portable)',
    text: 'Запуск без установки, если нужен переносимый сценарий.',
    tag: 'portable',
  },
  {
    title: 'zlauncher-access mod',
    text: 'Мод доступности для Fabric-профиля Minecraft.',
    tag: 'mod',
  },
];

const FLOW = [
  'Открой репозиторий проекта на GitHub.',
  'Перейди в нужный раздел (Releases/README) прямо из репозитория.',
  'Запусти лаунчер и создай сборку с нужной версией игры.',
  'При необходимости добавь мод доступности в папку mods.',
];

const FAQ = [
  {
    q: 'Где теперь скачивание?',
    a: 'Сайт переводит в репозиторий GitHub, откуда уже открываются нужные разделы и файлы.',
  },
  {
    q: 'Почему так лучше?',
    a: 'Файлы всегда лежат в одном источнике, проще отслеживать версии и исключить битые локальные ссылки.',
  },
  {
    q: 'Как понять, что релиз актуальный?',
    a: 'Ориентируйся на раздел Releases и номер версии в карточке latest.',
  },
];

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-accent-300">{eyebrow}</p>
      <h2 style={{ fontFamily: "'Unbounded', sans-serif" }} className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-zinc-300 md:text-base">{subtitle}</p>
    </div>
  );
}

function GithubLinkButton({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        primary
          ? 'inline-flex items-center gap-2 rounded-xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-500'
          : 'inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/10'
      }
    >
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

export function Website() {
  const buildId = import.meta.env.VITE_BUILD_ID || 'local-dev';
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [requestId, setRequestId] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const formError = useMemo(() => {
    if (!username.trim()) return 'Укажи никнейм.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Укажи корректный email.';
    if (password.trim().length < 8) return 'Пароль должен быть не короче 8 символов.';
    return '';
  }, [username, email, password]);

  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formError) return;
    const created = createLocalRegistration({ username, email, password });
    setToken(created.token);
    setRequestId(created.payload.requestId);
    setCopySuccess(false);
  };

  const copyToken = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#090909] text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-600 font-black shadow-[0_0_20px_rgba(220,38,38,0.3)]">Z</div>
            <div>
              <p className="font-bold tracking-wide">{SITE_CONFIG.appName}</p>
              <p className="text-xs text-zinc-400">v{SITE_CONFIG.latestVersion}</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              Возможности
            </a>
            <a href="#github" className="transition-colors hover:text-white">
              GitHub
            </a>
            <a href="#faq" className="transition-colors hover:text-white">
              FAQ
            </a>
            <a href="#registration" className="transition-colors hover:text-white">
              Регистрация
            </a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(220,38,38,0.25),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,#0d0d0d_0%,#111111_55%,#090909_100%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.3fr_0.7fr] md:items-end md:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-accent-600/40 bg-accent-900/20 px-4 py-1 text-xs uppercase tracking-[0.2em] text-accent-300">
              <Sparkles className="h-3.5 w-3.5" />
              modern desktop launcher
            </p>

            <h1
              style={{ fontFamily: "'Unbounded', sans-serif" }}
              className="mt-6 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight md:text-6xl"
            >
              Современный лаунчер с чистым GitHub-потоком релизов
            </h1>

            <p className="mt-5 max-w-2xl text-zinc-300 md:text-lg">
              На сайте больше нет прямых файловых ссылок. Все сборки и моды открываются через GitHub Releases, где хранятся исходные assets проекта.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <GithubLinkButton href={SITE_CONFIG.github.repo} label="Открыть GitHub" primary />
              <GithubLinkButton href={SITE_CONFIG.github.repo} label="Открыть репозиторий" />
            </div>
          </div>

          <div className="grid gap-3">
            <article className="rounded-2xl border border-white/10 bg-black/45 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-500/50">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">latest</p>
              <p style={{ fontFamily: "'Unbounded', sans-serif" }} className="mt-2 text-3xl font-black text-white">
                v{SITE_CONFIG.latestVersion}
              </p>
              <p className="mt-2 text-sm text-zinc-300">Актуальная версия публикуется в Releases.</p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/45 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-500/50">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">source of truth</p>
              <p className="mt-2 text-sm text-zinc-200">Единая точка загрузки: GitHub. Без дублей, битых зеркал и рассинхрона версий.</p>
            </article>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <section id="features" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-zinc-900/55 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-500/45"
            >
              <item.icon className="h-6 w-6 text-accent-400" />
              <h3 className="mt-4 text-xl font-bold leading-tight">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{item.text}</p>
            </article>
          ))}
        </section>

        <section id="github" className="mt-14 rounded-3xl border border-white/10 bg-zinc-900/45 p-7 md:mt-18 md:p-10">
          <SectionHeader
            eyebrow="GITHUB FLOW"
            title="Получение файлов"
            subtitle="Все каналы получения лаунчера и мода теперь идут через репозиторий GitHub."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {RELEASE_CHANNELS.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/25 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-500/45"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{item.tag}</p>
                <h3 className="mt-2 text-lg font-bold text-zinc-100">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{item.text}</p>
                <a
                  href={SITE_CONFIG.github.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-300 transition-colors hover:text-accent-200"
                >
                  Открыть GitHub <ArrowRight className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>

          <ol className="mt-8 grid gap-3">
            {FLOW.map((step, idx) => (
              <li key={step} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-600 text-xs font-bold text-white">
                  {idx + 1}
                </div>
                <p className="text-sm text-zinc-200">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="registration" className="mt-14 rounded-3xl border border-white/10 bg-zinc-900/45 p-7 md:mt-18 md:p-10">
          <SectionHeader
            eyebrow="ACCOUNT"
            title="Регистрация для лаунчера"
            subtitle="Локальный поток без серверов: данные и заявки хранятся в localStorage, код подтверждается в приложении."
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <form onSubmit={handleRegister} className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5">
              <div>
                <label htmlFor="reg-username" className="mb-1 block text-sm text-zinc-300">Никнейм</label>
                <input
                  id="reg-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  placeholder="SteveDev"
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="mb-1 block text-sm text-zinc-300">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label htmlFor="reg-password" className="mb-1 block text-sm text-zinc-300">Пароль</label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  placeholder="Минимум 8 символов"
                />
              </div>
              {formError && <div className="rounded-xl border border-amber-500/40 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">{formError}</div>}
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-500">
                Создать код подтверждения
              </button>
            </form>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-5">
              <p className="text-sm text-zinc-300">Шаг 2: открой лаунчер и вставь код в окно подтверждения аккаунта.</p>
              <div className="rounded-xl border border-white/10 bg-zinc-950 p-3">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Request ID</p>
                <p className="mt-1 text-sm text-zinc-200">{requestId || '—'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-zinc-950 p-3">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Код подтверждения</p>
                <p className="mt-1 break-all text-xs text-zinc-200">{token || 'Сначала заполни форму и создай код.'}</p>
              </div>
              <button
                type="button"
                onClick={copyToken}
                disabled={!token}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                {copySuccess ? 'Скопировано' : 'Скопировать код'}
              </button>
            </div>
          </div>
        </section>

        <section id="faq" className="mt-14 md:mt-18">
          <SectionHeader
            eyebrow="SUPPORT"
            title="FAQ"
            subtitle="Короткие ответы по новому сценарию: сайт как витрина, GitHub как источник релизов."
          />

          <div className="mt-6 grid gap-4">
            {FAQ.map((item) => (
              <article
                key={item.q}
                className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 transition-colors hover:border-white/20"
              >
                <h3 className="flex items-center gap-2 font-bold text-zinc-100">
                  <HelpCircle className="h-4 w-4 text-accent-300" />
                  {item.q}
                </h3>
                <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-green-500/35 bg-green-900/10 p-5 text-sm text-green-200">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Сайт не раздает файлы напрямую: переход на загрузку всегда выполняется через GitHub.
          </p>
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-zinc-500">
          <p className="inline-flex items-center gap-1">
            <Monitor className="h-3.5 w-3.5" />
            {SITE_CONFIG.appName} • Desktop launcher for Minecraft
          </p>
          <p className="inline-flex items-center gap-1">
            <LifeBuoy className="h-3.5 w-3.5" />
            build: {buildId}
          </p>
          <p className="inline-flex items-center gap-1">
            <LifeBuoy className="h-3.5 w-3.5" />
            README и документация в GitHub
          </p>
        </footer>
      </main>
    </div>
  );
}

