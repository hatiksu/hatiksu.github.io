# Правила для проектов в этом репозитории

Каждый проект живёт в своей ветке от `main` репозитория `hatiksu/Claude-Code` с понятным названием (`feature/<что-это>`)
и в отдельном публичном репозитории `hatiksu/<имя>` (там же его релизы).
Сайт-портфолио — репозиторий `hatiksu/hatiksu.github.io` (и ветка `feature/portfolio-site`) — показывает проекты автоматически.

## Новый проект — обязательно

1. **Отдельная ветка от `main`**, файлы проекта в корне, свой `README.md`.
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
  "mockup": "generic",
  "icon": "🤖",
  "demo": "https://… (необязательно)",
  "order": 3
}
```

- `mockup`: `finance`, `editor` или `generic` (универсальная карточка с `icon`).
- `order` — место в списке (меньше — выше); без него проекты идут по дате последнего коммита.
- `code` можно указать явно; иначе ссылка на ветку появится, только если репозиторий публичный.
- `en` — английские `title`, `description`, `highlights` для английской версии сайта.
- `shot.click` — текст кнопки, которую нажать перед автоскриншотом (например, «Заполнить демо-данными»).
- Сайт встраивает сборку проекта (`DESKTOP=1 npm run build`), поэтому `base: './'` в `vite.config.ts` обязателен.

## Приложения с установщиком для Windows

У каждого приложения есть **отдельный публичный репозиторий с тем же именем** (`hatiksu/<имя>`), в котором лежат его релизы.
Ветка `feature/<имя>` в этом репозитории и `main` того репозитория содержат одно и то же: после коммита пушь в оба места
(`git push origin feature/<имя>` и `git push https://github.com/hatiksu/<имя> feature/<имя>:main`).

- Electron + electron-builder (NSIS, x64): `electron/main.cjs`, `electron-builder.yml`, сборка с `DESKTOP=1` без Service Worker.
- `.github/workflows/release.yml` работает только в репозитории приложения: при пуше в `main` собирает `.exe`
  и публикует релиз с тегом и названием `v<версия>`, если такого ещё нет. Новая версия — поднять `version` в `package.json`.
- В `portfolio.json` указывай `"code": "https://github.com/hatiksu/<имя>"`.

## Как проекты попадают на сайт

`npm run sync` (в репозитории сайта) обходит основные ветки публичных репозиториев владельца и ветки самого сайта,
находит `portfolio.json`, подтягивает релизы и статистику GitHub и записывает `src/data/*.generated.json`.
`npm run apps` собирает приложения в `public/apps/<slug>` и снимает скриншоты, `npm run og` — картинки превью.
На GitHub Pages всё это делает `.github/workflows/deploy.yml` перед каждой сборкой: при пуше в `main`, раз в день
и по кнопке «Run workflow». После изменений сайта пушь в оба места:
`git push origin feature/portfolio-site` и `git push https://github.com/hatiksu/hatiksu.github.io feature/portfolio-site:main`.
