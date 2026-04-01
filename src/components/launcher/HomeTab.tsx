import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';

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

export function HomeTab() {
  return (
    <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-8 space-y-8">
      <div className="rounded-2xl overflow-hidden relative h-64 group cursor-pointer border border-white/10 shadow-2xl">
        <img alt="Главный баннер" src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
                <img alt={item.title} src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
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
  );
}
