# Правила для проектов Hatiksu

У каждого проекта **свой публичный репозиторий** `hatiksu/<имя>` с понятным названием: код в ветке `main`, там же его релизы.
Сайт-портфолио — репозиторий `hatiksu/hatiksu.github.io` — показывает проекты автоматически.

## Новый проект — обязательно

1. **Отдельный публичный репозиторий** `hatiksu/<имя>`, файлы проекта в корне, свой `README.md`.
2. **Профессиональная структура:** React + TypeScript + Vite, компоненты в отдельных папках (`Component.tsx` + `Component.module.css`),
   логика в `src/lib`, хуки в `src/hooks`. Адаптивность и мобильная версия.
3. **Тесты и CI:** Vitest для логики, Playwright для главных сценариев, `.github/workflows/ci.yml` (линтер, типы, сборка, тесты).
4. **`portfolio.json` в корне** — без него проект не появится на сайте:

```json
{
  "title": "Название проекта",
  "description": "1–2 предложения: что это и зачем",
  "tags": ["React", "TypeScript"],
  "highlights": ["Главная фишка", "Ещё одна", "И ещё"],
  "code": "https://github.com/hatiksu/<имя>",
  "mockup": "generic",
  "icon": "🤖",
  "order": 3,
  "en": { "title": "Name", "description": "What it is", "highlights": ["Main feature"] }
}
```

- `mockup`: `finance`, `editor` или `generic` (универсальная карточка с `icon`) — показывается, пока нет скриншотов.
- `order` — место в списке (меньше — выше); без него проекты идут по дате последнего коммита.
- `en` — английские `title`, `description`, `highlights` для английской версии сайта.
- `shot.click` — текст кнопки, которую нажать перед автоскриншотом (например, «Заполнить демо-данными»).
- Сайт встраивает сборку проекта (`DESKTOP=1 npm run build`), поэтому `base: './'` в `vite.config.ts` обязателен.

## Приложения с установщиком для Windows

- Electron + electron-builder (NSIS, x64): `electron/main.cjs`, `electron-builder.yml`, сборка с `DESKTOP=1` без Service Worker.
- `.github/workflows/release.yml`: при пуше в `main` собирает `.exe` и публикует релиз с тегом и названием `v<версия>`,
  если такого ещё нет. Новая версия — поднять `version` в `package.json`.

## Как проекты попадают на сайт

`npm run sync` (в репозитории сайта) обходит основные ветки публичных репозиториев владельца, находит `portfolio.json`,
подтягивает релизы и статистику GitHub и записывает `src/data/*.generated.json`.
`npm run apps` собирает приложения в `public/apps/<slug>` и снимает скриншоты, `npm run og` — картинки превью.
На GitHub Pages всё это делает `.github/workflows/deploy.yml` перед каждой сборкой: при пуше в `main`, раз в день
и по кнопке «Run workflow». Новый проект появится на сайте сам — достаточно `portfolio.json` в его репозитории.
