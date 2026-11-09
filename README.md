# Сайт-портфолио Hatiksu

Личный сайт-визитка на **React**: кто я, что умею, на чём пишу и что уже сделал.

**Стек:** React 19 · TypeScript · Vite · Motion (анимации) · CSS Modules

## Возможности

- Адаптивная вёрстка, на мобильных — бургер-меню с полноэкранным раскрытием
- Анимации: побуквенное появление заголовка, печатающийся текст, параллакс первого экрана,
  появление блоков при прокрутке, счётчики, 3D-наклон карточек, бегущая лента технологий,
  «магнитные» кнопки, прожектор за курсором, вращающаяся градиентная рамка
- Шапка прячется при прокрутке вниз, активный раздел подсвечивается
- Полоса прогресса прокрутки и кнопка «Наверх»
- Доступность: навигация с клавиатуры, `aria`-атрибуты, учёт настройки «уменьшить движение»

## Команды

```bash
npm install      # установить зависимости
npm run dev      # dev-сервер с горячей перезагрузкой
npm run build    # проверка типов и сборка в dist/
npm run preview  # посмотреть собранную версию
npm run lint     # линтер
npm run sync     # подтянуть проекты с GitHub (portfolio.json)
npm test         # unit-тесты (Vitest)
npm run test:e2e # E2E-тесты на компьютере и телефоне (Playwright)
```

## Структура

```
scripts/sync-projects.ts    синхронизация проектов с GitHub (portfolio.json)
e2e/                        E2E-тесты (Playwright)
src/
├── data/site.ts            ДАННЫЕ: имя, навыки, стек, контакты
├── data/projects.generated.json  проекты — создаётся автоматически, руками не править
├── lib/projects.ts         разбор и проверка portfolio.json
├── types.ts                типы данных
├── App.tsx                 сборка страницы из секций
├── main.tsx                точка входа
├── styles/global.css       переменные темы, сброс стилей
├── hooks/                  useScrollSpy, useScrollState, useTyping, useLockBodyScroll
└── components/
    ├── layout/             Navbar, Burger, MobileMenu, Footer
    ├── sections/           Hero, Stats, Skills, Stack, Projects, Contact
    └── ui/                 Button, Reveal, TiltCard, CountUp, Background, ScrollProgress, …
```

У каждого компонента своя папка: `Component.tsx` + `Component.module.css`.

## Как поменять содержимое

Тексты о себе (имя, навыки, стек, контакты) лежат в `src/data/site.ts`, вёрстку трогать не нужно.

## Проекты подтягиваются автоматически

Вручную список проектов не ведётся. Достаточно положить в корень проекта файл `portfolio.json`:

```json
{
  "title": "Название",
  "description": "Что это и зачем",
  "tags": ["React", "TypeScript"],
  "highlights": ["Главная фишка", "Ещё одна"],
  "mockup": "generic",
  "icon": "🤖"
}
```

Скрипт `scripts/sync-projects.ts` (`npm run sync`) обходит все ветки этого репозитория и основные ветки
публичных репозиториев владельца, находит такие файлы и записывает `src/data/projects.generated.json`.
Проекты без `portfolio.json` (например, лабораторные) на сайт не попадают.

На GitHub Pages синхронизация запускается перед каждой сборкой: при пуше в `main`, раз в день по расписанию
и вручную (Actions → Deploy to GitHub Pages → Run workflow). Если GitHub недоступен, сайт собирается
с прошлой версией списка.

> Ссылка «Код на GitHub» показывается только для публичных репозиториев: на приватный посетители не попадут.

## Тесты

- **Unit (Vitest):** разбор и проверка `portfolio.json` (обязательные поля, только https-ссылки, лимиты),
  объединение одного проекта из разных веток, сортировка.
- **E2E (Playwright, компьютер и iPhone 13):** первый экран, проекты из `portfolio.json`, счётчики,
  бургер-меню (открытие, переход к разделу, Esc), подсветка активного раздела, отсутствие горизонтальной прокрутки.
- **CI:** `.github/workflows/ci.yml` на каждый пуш и PR запускает линтер, проверку типов, сборку и все тесты.

## Деплой

Workflow `.github/workflows/deploy.yml` собирает сайт и публикует его на GitHub Pages
при каждом пуше в `main`. Один раз включите Pages: **Settings → Pages → Source: GitHub Actions**.
