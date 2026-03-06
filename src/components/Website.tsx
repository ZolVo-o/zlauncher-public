import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileDown,
  HelpCircle,
  Monitor,
  Package,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SITE_CONFIG, isPlaceholderLink } from '../config/siteConfig';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Автонастройка',
    text: 'Лаунчер сам проверяет и скачивает зависимости для запуска.',
  },
  {
    icon: ShieldCheck,
    title: 'Стабильный запуск',
    text: 'Подробные логи и понятные сообщения об ошибках на русском языке.',
  },
  {
    icon: Package,
    title: 'Мод доступности',
    text: 'Отдельный мод для режима одной руки в Minecraft 1.21.1 (Fabric).',
  },
];

const CHECKLIST = [
  'Скачайте установщик или портативную версию лаунчера',
  'Запустите лаунчер и создайте сборку нужной версии',
  'Нажмите "Играть" - лаунчер докачает недостающее автоматически',
  'Для спецрежима установите мод zlauncher-access в папку mods',
];

const FAQ = [
  {
    q: 'Почему кнопка загрузки не работает?',
    a: 'Проверьте, что на GitHub есть Release с нужными файлами и именами. Кнопки ведут на assets из Releases.',
  },
  {
    q: 'Какая Java нужна?',
    a: 'Для Minecraft 1.21.1 нужна Java 21. Лаунчер может установить runtime автоматически.',
  },
  {
    q: 'Почему мод не виден?',
    a: 'Нужен Fabric-профиль 1.21.1 и файл мода .jar в папке mods выбранной игры.',
  },
];

function DownloadCard({
  title,
  subtitle,
  url,
}: {
  title: string;
  subtitle: string;
  url: string;
}) {
  const placeholder = isPlaceholderLink(url);
  const classes = placeholder
    ? 'border-amber-500/40 bg-amber-900/20 text-amber-200'
    : 'border-white/10 bg-zinc-900/60 text-zinc-100';

  return (
    <article className={`rounded-2xl border p-5 ${classes}`}>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm opacity-90">{subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-500"
        >
          <Download className="h-4 w-4" />
          Скачать
        </a>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          <ExternalLink className="h-4 w-4" />
          Открыть ссылку
        </a>
      </div>
      {placeholder ? (
        <p className="mt-3 text-xs">
          Внимание: ссылка-заглушка. Замени ее в `siteConfig.ts`.
        </p>
      ) : null}
    </article>
  );
}

export function Website() {
  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-600 font-black">Z</div>
            <div>
              <div className="font-bold tracking-wide">{SITE_CONFIG.appName}</div>
              <div className="text-xs text-zinc-400">v{SITE_CONFIG.latestVersion}</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <a href="#downloads" className="hover:text-white">
              Скачать
            </a>
            <a href="#install" className="hover:text-white">
              Установка
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(220,38,38,0.3),transparent_35%),radial-gradient(circle_at_90%_25%,rgba(245,158,11,0.2),transparent_35%),linear-gradient(180deg,#0b0b0b_0%,#111111_65%,#0a0a0a_100%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent-600/40 bg-accent-900/20 px-4 py-1 text-xs uppercase tracking-[0.2em] text-accent-300">
            <Sparkles className="h-3.5 w-3.5" />
            Полноценная русская версия
          </p>
          <h1
            style={{ fontFamily: "'Unbounded', sans-serif" }}
            className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl"
          >
            Скачать, установить и запустить Minecraft за пару минут
          </h1>
          <p className="mt-6 max-w-2xl text-zinc-300">
            Здесь можно скачать лаунчер и мод доступности через GitHub Releases.
            Это самый надежный способ без ошибок 404 на Pages.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#downloads"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-600 px-6 py-3 font-semibold text-white shadow-[0_0_30px_rgba(220,38,38,0.35)] hover:bg-accent-500"
            >
              <FileDown className="h-5 w-5" />
              Перейти к скачиванию
            </a>
            <a
              href="#install"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-zinc-100 hover:bg-white/10"
            >
              <Monitor className="h-5 w-5" />
              Инструкция по установке
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <section className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
              <item.icon className="h-7 w-7 text-accent-400" />
              <h3 className="mt-4 text-2xl font-bold">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{item.text}</p>
            </article>
          ))}
        </section>

        <section id="downloads" className="mt-12 md:mt-16">
          <h2
            style={{ fontFamily: "'Unbounded', sans-serif" }}
            className="text-3xl font-black tracking-tight md:text-4xl"
          >
            Скачивание
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <DownloadCard
              title="Лаунчер (Windows Setup)"
              subtitle="Рекомендуется для большинства пользователей"
              url={SITE_CONFIG.downloads.windowsInstaller}
            />
            <DownloadCard
              title="Лаунчер (Portable)"
              subtitle="Запуск без установки"
              url={SITE_CONFIG.downloads.windowsPortable}
            />
            <DownloadCard
              title="Мод доступности"
              subtitle="Fabric 1.21.1, файл .jar"
              url={SITE_CONFIG.downloads.accessibilityMod}
            />
          </div>
        </section>

        <section
          id="install"
          className="mt-12 rounded-3xl border border-white/10 bg-zinc-900/50 p-8 md:mt-16 md:p-12"
        >
          <h2
            style={{ fontFamily: "'Unbounded', sans-serif" }}
            className="text-3xl font-black tracking-tight md:text-4xl"
          >
            Установка
          </h2>
          <ol className="mt-6 grid gap-3">
            {CHECKLIST.map((step, idx) => (
              <li key={step} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-600 text-xs font-bold">
                  {idx + 1}
                </div>
                <p className="text-sm text-zinc-200">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={SITE_CONFIG.docs.launcher}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              Документация лаунчера
            </a>
            <a
              href={SITE_CONFIG.docs.mod}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              Документация мода
            </a>
          </div>
        </section>

        <section id="faq" className="mt-12 md:mt-16">
          <h2
            style={{ fontFamily: "'Unbounded', sans-serif" }}
            className="text-3xl font-black tracking-tight md:text-4xl"
          >
            FAQ
          </h2>
          <div className="mt-6 grid gap-4">
            {FAQ.map((item) => (
              <article key={item.q} className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
                <h3 className="flex items-center gap-2 font-bold">
                  <HelpCircle className="h-4 w-4 text-accent-300" />
                  {item.q}
                </h3>
                <p className="mt-2 text-sm text-zinc-300">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-green-500/30 bg-green-900/10 p-5 text-sm text-green-200">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Перед запуском кнопок скачивания загрузи файлы в GitHub Release.
          </p>
        </section>
      </main>
    </div>
  );
}
