# Первая группа ФИЭиГХ — Telegram Mini App + Bot Backend

Полноценный fullstack-проект для командного квеста/конкурса внутри Telegram.

## Что реализовано

- **Telegram Mini App** в тёмной теме с анимациями и нижней навигацией (4 вкладки):
  - Команда
  - Статистика
  - Расписание
  - Магазин
- **Регистрация участника** (обязательная, до доступа к основному функционалу):
  - ФИО
  - Направление
  - Чекбокс «Я староста»
- **Backend API** для:
  - bootstrap данных Mini App
  - регистрации
  - `/start` payload
  - ввода и валидации 6-значных пин-кодов
- **Динамическое начисление баллов за пин-коды**:
  - 1-й ввод кода: 4 балла
  - 2-й: 3 балла
  - 3-й: 2 балла
  - далее: 1 балл
- **PostgreSQL + Drizzle ORM** со схемой под команды, участников, испытания, магазин, историю баллов и пин-коды.

---

## Технологический стек

- **Next.js (App Router)**
- **React + TypeScript**
- **Tailwind CSS**
- **PostgreSQL**
- **Drizzle ORM**

---

## Структура проекта

- `src/app/page.tsx` — основной экран Mini App
- `src/components/mini-app-shell.tsx` — UI и клиентская логика вкладок/регистрации
- `src/app/globals.css` — глобальные стили, тёмная тема, анимации
- `src/db/schema.ts` — схема БД Drizzle
- `src/lib/contest.ts` — бизнес-логика конкурса (seed, регистрация, баллы, пин-коды)
- `src/lib/telegram.ts` — определение `telegramUserId` из query/header

### API роуты

- `GET /api/mini-app/bootstrap` — загрузка состояния Mini App
- `POST /api/mini-app/register` — регистрация участника
- `POST /api/bot/pin-code` — ввод пин-кода (ботовый сценарий)
- `GET /api/bot/start-payload` — payload для команды `/start`
- `GET /api/bot/blueprint` — тех. спецификация сценариев
- `GET /api/health` — healthcheck

### Админ API (система админов)

Права админа проверяются по `telegramUserId` (из query `tgUserId` или заголовка `x-telegram-user-id`) и источникам:

1. `TELEGRAM_ADMIN_IDS` в `.env` (CSV),
2. таблица `admins` в БД.

Роуты:

- `GET /api/admin/overview` — обзор команд и баллов
- `POST /api/admin/points` — ручная корректировка баллов команды
- `POST /api/admin/challenges` — создание испытания
- `POST /api/admin/announcements` — создание напоминания/кружочка/CTA
- `POST /api/admin/users/shop-manager` — назначение ответственного за магазин
- `POST /api/admin/grant` — выдать/обновить админа (требует `x-admin-master-token`)

---

## Направления (доступны в регистрации)

1. Прикладная математика и информатика
2. Строительство · Водоснабжение и водоотведение
3. Строительство · Теплогазоснабжение и вентиляция
4. Информационные системы и технологии
5. Прикладная информатика
6. Теплоэнергетика и теплотехника
7. Электроэнергетика и электротехника
8. Природообустройство и водопользование
9. Землеустройство и кадастры
10. Прикладная геодезия (специалитет)
11. Техносферная безопасность

---

## Быстрый старт

### 1) Установить зависимости

```bash
npm install
```

### 2) Настроить переменные окружения

Файл `.env` должен содержать минимум:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
NEXT_PUBLIC_MINI_APP_URL=https://your-domain.example
NEXT_PUBLIC_ORGANIZER_URL=https://t.me/your_org_contact

# CSV список Telegram ID админов, например: 12345,67890
TELEGRAM_ADMIN_IDS=

# Мастер-токен для endpoint /api/admin/grant
ADMIN_MASTER_TOKEN=
```

### 3) Применить схему БД

```bash
npx drizzle-kit push
```

### 4) Запустить dev

```bash
npm run dev
```

---

## Production-проверки

```bash
npx next typegen
npm exec tsc -- --noEmit --pretty false
npm run build
```

---

## Как подключить реального Telegram-бота

Можно использовать **aiogram (Python)** или **grammY (Node.js)**.

Рекомендуемый сценарий:

1. На `/start` бот запрашивает `GET /api/bot/start-payload` и отправляет:
   - изображение
   - текст конкурса
   - inline-кнопку открытия Mini App
2. При получении 6-значного сообщения от пользователя бот вызывает `POST /api/bot/pin-code`.
3. Из ответа:
   - `messageToUser` — отправляется пользователю
   - `broadcastText` — рассылается в общий канал/чат

---

## Примечания по UX

- Интерфейс выполнен в dark-mode стилистике с акцентами (бирюзовый/фиолетовый/оранжевый).
- Добавлены плавные анимации появления карточек, glow-эффекты, интерактивные hover/press состояния.
- В случае невалидного/пустого ответа API клиент использует безопасный JSON-парсер и показывает понятную ошибку.

---

## Лицензия

Внутренний проект для конкурса «Первая группа ФИЭиГХ».
