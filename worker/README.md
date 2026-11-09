# Worker формы «Написать мне»

Cloudflare Worker принимает сообщение из формы на сайте и пересылает его в Telegram.
Токен бота хранится в секретах Worker — на статическом сайте его не видно.

Защита: принимаются только запросы с сайта (CORS по `ALLOWED_ORIGINS`), проверка полей
(та же, что в браузере — `src/lib/contact.ts`), скрытое поле-ловушка и минимальное время заполнения,
не больше 3 сообщений с одного адреса за 10 минут. Тесты — `worker/src/handler.test.ts`.

## Настройка (один раз, ~10 минут)

1. **Бот.** В Telegram напиши [@BotFather](https://t.me/BotFather) → `/newbot` → получишь токен вида `123456:ABC…`.
   Открой своего бота и нажми **Start**, иначе он не сможет тебе писать.
2. **Chat ID.** Напиши [@userinfobot](https://t.me/userinfobot) — он ответит твоим `Id` (число).
3. **Cloudflare.** Зарегистрируйся на [dash.cloudflare.com](https://dash.cloudflare.com) (бесплатно).
   - **Account ID** — справа на странице *Workers & Pages*.
   - **API-токен** — *My Profile → API Tokens → Create Token → шаблон «Edit Cloudflare Workers»*.
4. **Секреты в GitHub** — репозиторий сайта → *Settings → Secrets and variables → Actions → New repository secret*:
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
5. **Деплой Worker** — *Actions → Deploy contact worker → Run workflow*. В логе будет адрес вида
   `https://hatiksu-contact.<поддомен>.workers.dev`.
6. **Включить форму** — там же, вкладка *Variables → New repository variable*: `CONTACT_ENDPOINT` = адрес из шага 5.
   Затем *Actions → Deploy to GitHub Pages → Run workflow* — форма появится в разделе «Контакты».

Пока переменной `CONTACT_ENDPOINT` нет, на сайте вместо формы остаются кнопки почты и Telegram.

## Локально

```bash
cd worker
npx wrangler dev                      # Worker на http://localhost:8787
VITE_CONTACT_ENDPOINT=http://localhost:8787 npm run dev   # в корне: сайт с формой
```

Секреты для локального запуска — в `worker/.dev.vars` (файл в .gitignore):

```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```
