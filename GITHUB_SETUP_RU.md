# Публичный GitHub + бесплатный GitHub Pages

## 1) Создай публичный репозиторий

Например: `zlauncher-public`.

## 2) Привяжи локальный проект и запушь

```bash
git remote add origin https://github.com/<YOUR_USER>/zlauncher-public.git
git push -u origin main
```

## 3) Включи GitHub Pages

В репозитории:
`Settings -> Pages -> Source: GitHub Actions`

Workflow уже готов:
[deploy-pages.yml](c:/Users/valen/Desktop/create-zlauncher-dark-theme/.github/workflows/deploy-pages.yml)

После каждого пуша в `main` сайт собирается и публикуется автоматически.

## 4) Где взять ссылку на сайт

После первого успешного workflow:
`https://<YOUR_USER>.github.io/zlauncher-public/`

## 5) Команды сборки

- Desktop launcher: `npm run desktop:build`
- Подготовка файлов скачивания для сайта: `npm run site:prepare-downloads`
- Сборка сайта: `npm run build:site`
