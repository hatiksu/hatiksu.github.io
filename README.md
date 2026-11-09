# Сайт-портфолио Hatiksu

**https://hatiksu.github.io** — личный сайт: кто я, что умею и что уже сделал. Проекты можно попробовать
прямо на сайте или скачать для Windows.

**Стек:** React 19 · TypeScript · Vite · Motion · WebGL · CSS Modules · Playwright · Vitest

## Возможности

- **Страница у каждого проекта** (`#/project/<slug>`): скриншоты компьютера и телефона, фишки, факты о версии,
  история релизов с заметками, переход к следующему проекту, кнопка «Поделиться».
- **«Играть тут»:** приложения собираются прямо в сайт (`public/apps/<slug>`) и открываются поверх страницы —
  без перехода куда-либо.
- **«Скачать для Windows»:** версия, размер и число скачиваний берутся из последнего релиза репозитория проекта.
- **Автоскриншоты:** Playwright сам открывает каждое приложение и снимает экраны (JPEG + лёгкий WebP).
- **WebGL-фон:** шейдерная «туманность» тянется за курсором и реагирует на наклон телефона; без WebGL — CSS-фон,
  при «уменьшить движение» — статичный кадр, во вкладке на фоне не рисуется.
- **Командная палитра** `Ctrl+K` / `⌘K` / `/`: разделы, проекты, «запустить», «скачать», тема, язык, почта.
- **Активность на GitHub:** карта коммитов за год, лучшая серия, языки в проектах, релизы.
- **RU / EN** (по языку браузера, переключатель запоминается) и **светлая тема** (по системе, с плавной сменой).
- **Превью для ссылок:** своя картинка 1200×630 для сайта и каждого проекта, страницы `p/<slug>/` для мессенджеров,
  `sitemap.xml`, `robots.txt`.
- **Форма «Написать мне»** → сообщение приходит в Telegram через Cloudflare Worker (`worker/`, настройка — `worker/README.md`).
- **Терминал-пасхалка:** клавиша `` ` `` (ё) — консоль с командами `help`, `projects`, `play orbit`, `open`, `download`, `contact`…
- **404 с мини-игрой:** арканоид, где кирпичи выложены цифрами «404» (`404.html` для GitHub Pages и неизвестные адреса внутри сайта).
- Адаптивность и бургер-меню, анимации появления, магнитные кнопки, 3D-наклон, доступность с клавиатуры.

Lighthouse: компьютер — 99 / 100 / 100 / 100, телефон — 87 / 100 / 100 / 100
(производительность / доступность / лучшие практики / SEO).

## Команды

```bash
npm install      # зависимости
npm run dev      # dev-сервер
npm run sync     # проекты, релизы и активность с GitHub → src/data/*.generated.json
npm run apps     # собрать приложения внутрь сайта и снять скриншоты (--force, --no-shots)
npm run og       # картинки превью public/og/*.jpg
npm run build    # проверка типов, сборка, страницы для шаринга и sitemap
npm run lint     # линтер
npm test         # unit-тесты (Vitest)
npm run test:e2e # E2E на компьютере и iPhone (Playwright)
```

## Структура

```
worker/                Cloudflare Worker формы «Написать мне» → Telegram
scripts/
├── sync-projects.ts   portfolio.json, релизы, языки и коммиты с GitHub
├── build-apps.ts      клон → сборка (DESKTOP=1, без Service Worker) → public/apps + скриншоты
├── og.ts              картинки превью
└── share-pages.ts     dist/p/<slug>/index.html и sitemap.xml после сборки
src/
├── App.tsx            оболочка: маршрут, палитра, окно приложения
├── pages/             Home, ProjectPage, NotFound
├── i18n/              ru.ts, en.ts — все тексты сайта
├── context/           язык и тема
├── data/              site.ts + *.generated.json (создаются скриптами, руками не править)
├── lib/               projects, github, router, search, terminal, breakout, contact, markdown, shader, … (+ тесты)
├── hooks/             usePreferences, useRoute, useScrollSpy, useScrollState, useTyping, …
└── components/
    ├── layout/        Navbar, Burger, MobileMenu, Footer
    ├── sections/      Hero, Stats, Skills, Stack, Projects, Activity, Contact
    ├── project/       ProjectShot, DownloadButton, PlayFrame, ReleaseList
    └── ui/            Button, Icon, CommandPalette, Terminal, BreakoutGame, PrefsToggles, Background, Toaster, …
```

У каждого компонента своя папка: `Component.tsx` + `Component.module.css`.

## Как проект попадает на сайт

Вручную список не ведётся. В корне репозитория проекта лежит `portfolio.json`:

```json
{
  "title": "Название",
  "description": "Что это и зачем",
  "tags": ["React", "TypeScript"],
  "highlights": ["Главная фишка", "Ещё одна"],
  "code": "https://github.com/hatiksu/<repo>",
  "mockup": "generic",
  "icon": "🤖",
  "order": 1,
  "shot": { "click": "Текст кнопки, которую нажать перед скриншотом" },
  "en": { "title": "Name", "description": "What it is", "highlights": ["Main feature"] }
}
```

`npm run sync` обходит основные ветки публичных репозиториев владельца (и ветки этого репозитория),
находит такие файлы, подтягивает релизы и статистику. `npm run apps` собирает каждый проект в сайт и снимает скриншоты.

## Деплой

`.github/workflows/deploy.yml` при пуше в `main`, раз в день и по кнопке «Run workflow» делает
`sync → apps → og → build` и публикует сайт на GitHub Pages. Один раз включите
**Settings → Pages → Source: GitHub Actions** — до этого сборка пропускается с подсказкой.

`.github/workflows/worker.yml` публикует Worker формы, когда меняется `worker/` (нужны секреты — см. `worker/README.md`).

`.github/workflows/ci.yml` на каждый пуш и PR: линтер, типы, сборка, unit- и E2E-тесты.
