# Сховище — Конструктор кальянних міксів

Веб-додаток для бару "Сховище" (Біла Церква). Гість сканує QR на столику,
збирає кальянний мікс або обирає фірмовий, надсилає замовлення. Кальянщик
отримує сповіщення в Telegram, готує, відмічає статуси.

## Стек

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4 + shadcn/ui (base-ui variant)
- Supabase (Postgres + Auth + Realtime + Storage)
- Zustand (стан конструктора), TanStack Query (серверні дані)
- react-hook-form + zod (форми)
- lucide-react (іконки)
- Telegram Bot API (прямі HTTP-виклики з API routes)

## Початок роботи

```bash
npm install
cp .env.example .env.local   # заповнити Supabase + Telegram ключі
npm run dev                  # http://localhost:3000
```

## Структура

```
app/
  (guest)/         — гостьова частина (каталог, мікс, пресети, замовлення)
  admin/           — адмінка (дашборд, CRUD, статистика)
  api/             — POST /orders, /telegram/webhook, /stats/popular, ...
lib/
  supabase/        — browser + server + service-role клієнти
  telegram/        — sendMessage, format, callback
  stores/          — Zustand mix-store
  utils/           — cn, calculateStrength, generateShortCode
  constants.ts     — статуси замовлень, ліміти
components/ui/     — shadcn компоненти
supabase/migrations/ — SQL міграції (заповнюється на етапі 2)
scripts/           — register-telegram-webhook.ts і т.п.
design-reference/  — handoff bundle з Claude Design (gitignored)
```

## База даних

Міграція — у [`supabase/migrations/20260524000000_initial_schema.sql`](supabase/migrations/20260524000000_initial_schema.sql),
seed — у [`supabase/seed.sql`](supabase/seed.sql).

### Локальний Supabase (Docker)

```bash
brew install supabase/tap/supabase    # одноразово
npm run db:start                       # підіймає Postgres+Studio+Auth+Storage у Docker
npm run db:reset                       # застосовує міграції + seed
npm run db:types                       # генерує lib/supabase/types.ts
```

Local Studio: http://127.0.0.1:54323.
Після `db:start` він покаже `anon` та `service_role` ключі — підстав їх у `.env.local`.

### Віддалений Supabase (Production)

```bash
supabase login
supabase link --project-ref <ref>
npm run db:push                        # застосовує НЕзастосовані міграції
```

Seed дані для production застосовуються вручну через Supabase Studio (SQL editor) —
`db:reset` не використовуємо на production бо він стирає дані.

## Telegram

Сповіщення нових замовлень і управління статусом через Telegram Bot API.

**Один раз** для production:

1. У @BotFather створи бота, скопіюй токен → `TELEGRAM_BOT_TOKEN`
2. Додай бота в груповий чат бару, через [@getidsbot](https://t.me/getidsbot) дізнайся chat_id → `TELEGRAM_NOTIFICATION_CHAT_ID` (буде від'ємне число для груп)
3. Згенеруй випадковий рядок (e.g. `openssl rand -hex 32`) → `TELEGRAM_WEBHOOK_SECRET`
4. Виклади на Vercel з усіма змінними, переконайся що `NEXT_PUBLIC_APP_URL` вказує на production-домен
5. Зареєструй webhook: `npm run tg:webhook:register`
6. Перевір: створи тестове замовлення — у чат прилетить повідомлення з кнопками

Локально webhook не зареєструвати (Telegram не достукається до `localhost`).
Для розробки callback-логіки використовуй [ngrok](https://ngrok.com/) або деплой на preview-гілку.

Видалити webhook: `npm run tg:webhook:delete`.

## Етапи розробки

1. ✅ **Setup** — каркас Next.js, dependencies, shadcn, env, заглушки.
2. ✅ **БД** — міграція + RLS + триггери + seed (потребує `supabase start` або `db push` для застосування).
3. ✅ **Types** — згенеровано з реальної БД.
4. ✅ **Дизайн + гостьовий UI** — головна, каталог, конструктор, фірмові, замовлення.
5. ✅ **API routes** — `POST /api/orders`, `PATCH /api/orders/[id]/status`.
6. ✅ **Telegram** — нотифікації, webhook, форматування, скрипт реєстрації.
7. ⏳ **Адмінка** — login, Kanban, CRUD, stats. (Pages існують як заглушки.)
8. ⏳ **Деплой** — Vercel + домен `hookah.shelterbc.top`.
