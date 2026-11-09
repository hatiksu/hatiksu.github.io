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
```

## Структура

```
src/
├── data/site.ts            ДАННЫЕ: имя, навыки, стек, проекты, контакты
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

Все тексты — в `src/data/site.ts`. Вёрстку трогать не нужно.

## Деплой

Workflow `.github/workflows/deploy.yml` собирает сайт и публикует его на GitHub Pages
при каждом пуше в `main`. Один раз включите Pages: **Settings → Pages → Source: GitHub Actions**.
