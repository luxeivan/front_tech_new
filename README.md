Быстрый старт
# front_tech_new — как это живёт

Короткий и деловой README: как запуститься, что где лежит и что не ломать. Чуть‑чуть с юмором, но по делу.

**Стек:** Next.js 15 · React 19 · Strapi 5 · Ant Design 5 · Zustand 5  
**Принцип:** все клиентские компоненты — `.js` (не `.jsx`).

---

## Источники и эволюция полей

- Базовый согласованный список полей:  
  https://docs.google.com/spreadsheets/d/1KeyrqD2fmflpakc5gXstgcaLeyKiMT-aUt735OKZGIc/edit?gid=0#gid=0
- Позже МВИТУ прислал обновлённый список (документ — в ЛС).  
  Если есть расхождения — правим **только маппинг** здесь: `src/app/api/modus/route.js`  
  (функция `mapValue()` и сборка payload для Strapi).

---

## TL;DR — поток данных

```
ЖТН/МОДУС
   └─> Strapi ("tn")
        └─(webhook: entry.create / entry.publish)─> POST /api/webhooks
             └─(broadcast)─> SSE GET /api/event
                  └─> zustand store (persist: "dashboard-test-cache")
                       ├─> /dashboardtest — агрегаты
                       └─> /main — детали + фильтры
```

**Кэш:** в `localStorage` под ключом `dashboard-test-cache` хранится массив `uniqueOpen`.  
**Live:** новые уникальные ТН прилетают через SSE → добавляем в начало списка, строка подсвечивается зелёным и играет звук.

> Важно про звук: браузеры блокируют авто‑воспроизведение. После первого клика по странице звук начинает играть стабильно. Файл звука — `public/sounds/sound.mp3`.

---

## Быстрый старт

```bash
# dev
npm run dev

# prod
npm run build
npm run start
```

**Переменные окружения (`.env.local`):**
```dotenv
NEXT_PUBLIC_STRAPI_URL=http://&lt;strapi-host&gt;:&lt;port&gt;
DADATA_TOKEN=&lt;token&gt;
```

---

## Структура и что где лежит

```
src/
  app/
    api/
      event/route.js              # SSE: GET — подписка клиентов; POST — ручной бродкаст; clients: Map
      webhooks/route.js           # Приём вебхуков Strapi; фильтрация по uid и событиям; ретрансляция в SSE
      dadata/route.js             # Прокси к DaData (findById); использует DADATA_TOKEN
      modus/route.js              # Приём данных из МОДУС/ЖТН; mapValue(); создание SocialObjects и ТН в Strapi
    dashboardtest/page.js         # Витрина с агрегатами по массиву uniqueOpen
    main/
      page.js                     # Таблица деталей: пагинация 10/стр, фильтры, разворот, быстрые правки, SSE
      components/
        FiltersBar.js             # Панель фильтров: селекты + сброс; "тупой" UI, без тяжёлой логики
        TnTable.js                # Таблица ТН с пагинацией; rowClassName с подсветкой newGuids; управляемое раскрытие
        TnDetails.js              # Разворот строки: форматирование полей, отображение только нужного, inline‑редактирование
      hooks/
        useSse.js                 # Подписка на SSE (/api/event) и прокидывание payload в store.handleEvent
        useTnFilters.js           # Состояние фильтров + вычисление options и фильтрация списка (через useMemo)
    page.js                       # Обёртка домашней страницы: приветствие + рендер /main
  config/
    auth.js                       # NextAuth Credentials к Strapi; jwt + view_role в session
  stores/
    dashboardTestStore.js         # Zustand store: uniqueOpen, handleEvent(), loadUnique(); persist "dashboard-test-cache"
public/
  sounds/sound.mp3                # Звук при появлении нового ТН (после первого клика пользователя)
```

Коротко по ключевым файлам:

- **`stores/dashboardTestStore.js`** — единый источник правды для обеих страниц.  
  - `loadUnique(token)`: тянет «открыта» с `populate=*`, остальные статусы — только GUID; строит набор `otherGuids` и оставляет уникально открытые.  
  - `handleEvent(payload)`: на события `entry.create/publish` с `uid="api::tn.tn"` добавляет новую запись в начало, подсвечивает, даёт звук.

- **`app/main/page.js`** — таблица (10 строк на страницу), фильтры, разворот, редактирование полей где `edit === "Да"`. Подписка на SSE через `/api/event`.

- **`app/main/components/FiltersBar.js`** — панель управления фильтрами. Принимает: `filters`, `options`, `onChange`, `onReset`. Рендерит селекты и кнопку сброса. Логики «фильтровать данные» внутри нет — только UI.

- **`app/main/components/TnTable.js`** — таблица Ant Design с пагинацией (10/стр) и разворотом строк. Принимает: `data`, `newGuids`, `expandedKeys`, `onExpand`, `onEditStart`. Подсвечивает новые записи по `newGuids`.

- **`app/main/components/TnDetails.js`** — содержимое разворота: форматирование значений, скрытие полей из набора «технических», поддержка inline‑редактирования (иконка карандаша, если `edit === "Да"`).

- **`app/main/hooks/useSse.js`** — хук подписки на SSE (`/api/event`). Инициализирует `EventSource`, пробрасывает события в `store.handleEvent`, корректно закрывает соединение при анмаунте.

- **`app/main/hooks/useTnFilters.js`** — хук состояния фильтров: хранит выбранные значения, строит `options` по данным, отдаёт `filteredData`. Внутри только `useMemo` и простые сравнения — без тяжёлых вычислений.

- **`app/dashboardtest/page.js`** — счётчики и карточки по массиву `uniqueOpen`.

- **`app/api/webhooks/route.js`** — принимает POST от Strapi, валидирует `uid` и тип события, рассылает всем SSE‑клиентам.

- **`app/api/event/route.js`** — держит Map подключений и стримит `text/event-stream`. GET — подписка, POST — ручной бродкаст (удобно для отладки).

- **`app/api/modus/route.js`** — преобразует входящие записи в формат Strapi. Соц‑объекты создаются отдельно и связываются компонентом.

- **`config/auth.js`** — логин в Strapi через Credentials; в `session.user` кладём `jwt` и `view_role`.

---

## Как проверить, что live работает

1. Открой `/main` (останься на странице).
2. В Strapi создай ТН со статусом «открыта» и уникальным `VIOLATION_GUID_STR`.
3. В консоли фронта увидишь логи вебхука → в таблице строка подсветится зелёным.  
   Если успел кликнуть по странице — ещё и звук.

---

## Тонкие места и правила мягкой эксплуатации

- Не меняем публичные роуты `/api/event` и `/api/webhooks` без необходимости.  
- В запросах избегаем повсеместного `populate=*` — он только для «открытых» в `loadUnique()`.  
- Если на /main видишь «старые» данные — проверь `localStorage` ключ `dashboard-test-cache` или просто перезайди (persist сам обновится при следующей загрузке).

---

## Частые вопросы

**На /dashboardtest и /main разное число ТН.**  
Обычно это был битый кэш. Сейчас persist хранит только `uniqueOpen`; при загрузке он пересобирается заново. Хард‑рефреш решает.

**Нет звука при новых ТН.**  
Сделай любой клик/тап на странице — это снимает блокировку автоплея в браузере.

**Хотим лениво догружать детали.**  
Можно: в развороте строки по `documentId` запросить детальные поля при первом открытии.

---

## Чек‑лист перед продом

- `NEXT_PUBLIC_STRAPI_URL` доступен с фронта.
- В Strapi включён вебхук на `/api/webhooks` (события: create/publish).
- Прокси/NGINX не вырезает заголовки SSE: `Content-Type: text/event-stream`, `Cache-Control: no-transform`.
- `public/sounds/sound.mp3` лежит на месте.