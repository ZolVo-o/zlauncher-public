# GitHub: приватный код + бесплатный сайт

Цель:
- основной репозиторий с кодом: **private**
- отдельный репозиторий под сайт: **public** (GitHub Pages, бесплатно)

## 1) Подготовь репозитории на GitHub

1. Создай приватный репозиторий, например: `zlauncher-private`.
2. Создай публичный репозиторий, например: `zlauncher-site`.
3. В `zlauncher-site` включи Pages:
   `Settings -> Pages -> Deploy from a branch -> main /(root)`.

## 2) Инициализируй git в этом проекте

```bash
git init
git branch -M main
git add .
git commit -m "Initial private source"
git remote add origin https://github.com/<YOUR_USER>/zlauncher-private.git
git push -u origin main
```

## 3) Настрой секреты в приватном репозитории

В `zlauncher-private -> Settings -> Secrets and variables -> Actions` добавь:

- `PAGES_PUBLIC_REPO` = `<YOUR_USER>/zlauncher-site`
- `PAGES_DEPLOY_PAT` = Personal Access Token (classic) с правом `repo`

## 4) Проверка автодеплоя сайта

После пуша в `main` workflow:
`.github/workflows/deploy-pages-from-private.yml`

собирает сайт (`npm run build:site`) и публикует `dist` в публичный `zlauncher-site`.

## 5) Где менять ссылки и версию

- [src/config/siteConfig.ts](c:/Users/valen/Desktop/create-zlauncher-dark-theme/src/config/siteConfig.ts)

## 6) Локальные команды

- Собрать desktop launcher: `npm run desktop:build`
- Подготовить файлы скачивания для сайта: `npm run site:prepare-downloads`
- Собрать сайт: `npm run build:site`
