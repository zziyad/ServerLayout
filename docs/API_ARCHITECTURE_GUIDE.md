# Архитектура для создания новых эндпоинтов (JSON Schema в API)

## Обзор

Данная документация описывает архитектуру для создания новых эндпоинтов, основанную на принципах Clean Architecture и разделении ответственности между слоями. Архитектура подходит для сущностей, где **валидация по JSON Schema выполняется в API слое в самом начале запроса**, без использования отдельной папки business logic.

**Ключевая особенность:** Валидация по JSON Schema происходит в API слое до вызова domain слоя, что обеспечивает раннее обнаружение ошибок и упрощает архитектуру.

**DRY принцип:** Для упрощения валидации используется функция `lib.validation.validateEndpoint()`, которая автоматически получает схему, валидирует данные и возвращает валидированные данные в одной строке. Это устраняет дублирование кода (6 строк → 1 строка) и следует принципу DRY (Don't Repeat Yourself).

## 📁 ПАПОЧНАЯ СТРУКТУРА ПРОЕКТА

### Основная структура:
```
project-root/
├── application/
│   ├── api/                    # API Layer (Интерфейсный слой)
│   │   └── {entity}/           # Папка сущности (user, product, order, report, etc.)
│   │       ├── create.js       # Роут создания
│   │       ├── update.js       # Роут обновления
│   │       ├── delete.js       # Роут удаления
│   │       ├── list.js         # Роут получения списка
│   │       └── {custom}.js     # Кастомные роуты (statistics, approve, etc.)
│   │
│   ├── domain/                 # Domain Layer (Доменный слой)
│   │   └── {entity}/           # Папка сущности
│   │       ├── create.js       # Бизнес-логика создания
│   │       ├── update.js       # Бизнес-логика обновления
│   │       ├── delete.js       # Бизнес-логика удаления
│   │       ├── list.js         # Бизнес-логика получения списка
│   │       ├── {custom}.js     # Кастомная бизнес-логика
│   │       └── {entity}Logic.js # Дополнительная валидация бизнес-правил (опционально)
│   │
│   └── lib/                    # Библиотеки и утилиты
│       ├── schemas/            # JSON Schema валидация
│       │   └── {entity}/       # Папка сущности
│       │       ├── createSchema.js   # JSON Schema для создания
│       │       ├── updateSchema.js   # JSON Schema для обновления
│       │       ├── deleteSchema.js   # JSON Schema для удаления
│       │       ├── listSchema.js     # JSON Schema для списка
│       │       └── {custom}Schema.js # JSON Schema для кастомных роутов
│       │
│       └── repository/         # Repository Layer (Слой репозитория)
│           └── {entity}/       # Папка сущности
│               ├── create.js   # SQL для создания
│               ├── update.js   # SQL для обновления
│               ├── delete.js   # SQL для удаления
│               ├── list.js     # SQL для получения списка
│               └── {custom}.js # SQL для кастомных операций
```

**Важно:** Файлы создаются только при необходимости соответствующего роута/функционала!

### Правила именования папок:
- **Сущности:** `camelCase` (user, product, order, report, category, etc.)
- **Действия:** `camelCase` (create, update, delete, list, statistics, approve)
- **Файлы:** `camelCase.js` (create.js, update.js, delete.js)

### Создание новой сущности:

При создании новой сущности (например, `product`) создаются только папки:

```bash
# Создать папки для новой сущности
mkdir -p application/api/product
mkdir -p application/domain/product
mkdir -p application/lib/schemas/product
mkdir -p application/lib/repository/product
```

**Файлы создаются по мере необходимости** когда нужен соответствующий роут/функционал.

### Роутинг и файлы:

**Файлы = Роуты:** Каждый файл представляет собой отдельный роут/эндпоинт
- `create.js` - роут для создания новой записи
- `update.js` - роут для обновления существующей записи  
- `delete.js` - роут для удаления записи
- `list.js` - роут для получения списка записей
- `{custom}.js` - кастомные роуты (statistics, approve, activate, etc.)

**Создание файлов по необходимости:** Файлы создаются только когда нужен соответствующий роут/функционал

## ⚠️ СТРОГИЕ ПРАВИЛА СИНТАКСИСА

### Обязательные правила для всех файлов:
1. **НЕТ module.exports** - файлы экспортируются как есть
2. **API файлы** - строго в формате объекта в круглых скобках `({...})`
3. **Domain файлы** - строго как асинхронная функция `async (payload, context) => {...}`
4. **Repository файлы** - строго как асинхронная функция `async (data) => {...}`
5. **Schema файлы** - строго как асинхронная функция `async () => ({...})`
6. **Заголовки** - обязательны в формате `// =============================================================================`

## Архитектурные слои

### 1. API Layer (Интерфейсный слой)
**Путь:** `application/api/{entity}/{action}.js`

**Назначение:** Обработка HTTP запросов, валидация доступа, **валидация по JSON Schema в самом начале**, форматирование ответов

**СТРОГАЯ СТРУКТУРА (без module.exports):**

**✅ РЕКОМЕНДУЕМЫЙ ПОДХОД (с validateEndpoint):**
```javascript
({
  access: '{entity}.{action}',  // Права доступа
  method: async (payload) => {
    // 1. JSON SCHEMA VALIDATION: Валидация в самом начале (одна строка!)
    const validatedData = await lib.validation.validateEndpoint(payload, '{entity}', '{action}');
    
    // 2. DOMAIN: Вызов доменной функции с валидированными данными
    try {
      const res = await domain.{entity}.{action}(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('{entity}/{action} error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to {action} {entity}',
      };
    }
  },
});
```

**Альтернативный подход (для обратной совместимости):**
```javascript
({
  access: '{entity}.{action}',  // Права доступа
  method: async (payload) => {
    // 1. JSON SCHEMA VALIDATION: Валидация в самом начале
    const schema = await lib.schemas.{entity}.{action}Schema();
    const validation = await common.validateSchema(payload, schema);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }
    const validatedData = validation.data;
    
    // 2. DOMAIN: Вызов доменной функции с валидированными данными
    try {
      const res = await domain.{entity}.{action}(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('{entity}/{action} error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to {action} {entity}',
      };
    }
  },
});
```

**КРИТИЧЕСКИ ВАЖНО:**
- Файл начинается с `(` и заканчивается `);`
- Объект обернут в круглые скобки
- НЕТ `module.exports =`
- НЕТ `export default`
- **Валидация по JSON Schema выполняется в самом начале метода, до вызова domain слоя**

**ВЫЗОВЫ МОДУЛЕЙ:**

**✅ РЕКОМЕНДУЕМЫЙ СПОСОБ (validateEndpoint):**
- Вызов Validation: `await lib.validation.validateEndpoint(payload, '{entity}', '{action}')`
- Вызов Domain: `await domain.{entity}.{action}(validatedData, context)`
- Примеры:
  - `await lib.validation.validateEndpoint(payload, 'product', 'create')`
  - `await lib.validation.validateEndpoint(payload, 'vapp.review', 'markUnderReview')` (вложенные пути)
  - `await domain.product.create(validatedData, context)`

**Альтернативный способ (для обратной совместимости):**
- Вызов Schema: `await lib.schemas.{entity}.{action}Schema()`
- Вызов Validation: `await common.validateSchema(payload, schema)`
- Вызов Domain: `await domain.{entity}.{action}(validatedData, context)`
- Примеры:
  - `await lib.schemas.product.createSchema()`
  - `await common.validateSchema(payload, schema)`
  - `await domain.product.create(validatedData, context)`

**Преимущества validateEndpoint:**
- ✅ Одна строка вместо 6 строк валидации
- ✅ Автоматическое кэширование путей к схемам (LRU cache)
- ✅ Поддержка вложенных путей (`'vapp.review'`, `'fleet-management.driverSchedule'`)
- ✅ Защита от утечек памяти (LRU cache с лимитом 200)
- ✅ Следует принципу DRY (Don't Repeat Yourself)

**Обязательные элементы:**
- `access` - строка прав доступа в формате `{entity}.{action}`
- `method` - асинхронная функция-обработчик
- **Валидация по JSON Schema в самом начале**
- Обработка ошибок с логированием
- Стандартизированный формат ответа

### 2. Domain Layer (Доменный слой)
**Путь:** `application/domain/{entity}/{action}.js`

**Назначение:** Бизнес-логика, дополнительная валидация бизнес-правил (опционально, через {entity}Logic), оркестрация операций

**СТРОГАЯ СТРУКТУРА (без module.exports):**
```javascript
// =============================================================================
// {ENTITY} {ACTION} - Business Logic
// =============================================================================

async (payload, context) => {
  const user = context?.client?.session?.state || context?.session?.user || {};

  // 1. VALIDATION: Business rules (опционально, если нужна дополнительная валидация)
  // Примечание: Основная валидация уже выполнена в API слое через JSON Schema
  const validation = domain.{entity}.{entity}Logic.validate{Action}(payload);
  
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  const validatedData = validation.data || payload;

  // 2. REPOSITORY: Save to DB
  const {entity} = await lib.repository.{entity}.{action}(validatedData);

  // 3. LOG: Operation logging (опционально)
  console.log(
    `✅ {Entity} {action} by User ${
      user.id || user.email || 'unknown'
    }`,
  );

  // 4. RETURN: Result
  return {entity};
};
```

**КРИТИЧЕСКИ ВАЖНО:**
- Файл начинается с заголовка в формате `// =============================================================================`
- Сразу после заголовка идет `async (payload, context) => {`
- НЕТ `module.exports =`
- НЕТ `export default`
- НЕТ обертки в объект или функцию
- **Валидация по JSON Schema уже выполнена в API слое, здесь только бизнес-правила (опционально)**

**ВЫЗОВЫ МОДУЛЕЙ:**
- Вызов Business Logic: `domain.{entity}.{entity}Logic.validate{Action}(payload)` (опционально)
- Вызов Repository: `await lib.repository.{entity}.{action}(validatedData)`
- Примеры:
  - `domain.product.productLogic.validateCreate(payload)` (опционально)
  - `await lib.repository.product.create(productData)`

**Обязательные элементы:**
- Заголовок с описанием функции
- Дополнительная валидация бизнес-правил (опционально, через {entity}Logic)
- Вызов репозитория
- Возврат результата

### 3. Schema Layer (Слой схем валидации)
**Путь:** `application/lib/schemas/{entity}/{action}Schema.js`

**Назначение:** Определение JSON Schema для валидации входных данных

**СТРОГАЯ СТРУКТУРА (без module.exports):**
```javascript
// =============================================================================
// {ENTITY} {ACTION} SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for {action} {entity}
// Based on {Entity} table structure
//
// Required fields:
// - field1: Description
// - field2: Description
//
// Optional fields:
// - field3: Description
//
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    field1: {
      type: 'string',
      format: 'uuid',
      description: 'Field description',
    },
    field2: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Field description',
    },
    field3: {
      type: ['string', 'null'],
      maxLength: 10000,
      description: 'Optional field description',
    },
  },
  required: ['field1', 'field2'],
});
```

**КРИТИЧЕСКИ ВАЖНО:**
- Файл начинается с заголовка в формате `// =============================================================================`
- Сразу после заголовка идет `async () => ({`
- НЕТ `module.exports =`
- НЕТ `export default`
- Возвращает объект JSON Schema

**Обязательные элементы:**
- Заголовок с описанием схемы
- Тип объекта: `type: 'object'`
- Запрет дополнительных свойств: `additionalProperties: false`
- Определение свойств с типами и валидацией
- Список обязательных полей: `required: [...]`

### 4. Repository Layer (Слой репозитория)
**Путь:** `application/lib/repository/{entity}/{action}.js`

**Назначение:** Работа с базой данных, SQL запросы, кэширование

**СТРОГАЯ СТРУКТУРА (без module.exports):**
```javascript
// =============================================================================
// {ENTITY} REPOSITORY - {Action}
// =============================================================================

async (data) => {
  const {
    field1,
    field2,
    field3,
    // ... остальные поля
  } = data;

  const sql = `
    INSERT INTO "{Entity}" (
      field1, field2, field3, ...
    )
    VALUES ($1, $2, $3, ...)
    RETURNING *
  `;

  const params = [
    field1,
    field2,
    field3,
    // ... остальные параметры
  ];

  const result = await db.pg.query(sql, params);

  // Clear cache (опционально, для операций записи)
  try {
    db.optimized.clearCache();
  } catch {}

  return result.rows[0];
};
```

**КРИТИЧЕСКИ ВАЖНО:**
- Файл начинается с заголовка в формате `// =============================================================================`
- Сразу после заголовка идет `async (data) => {`
- НЕТ `module.exports =`
- НЕТ `export default`
- НЕТ обертки в объект или функцию

**ВЫЗОВЫ МОДУЛЕЙ:**
- Вызов Database: `await db.pg.query(sql, params)`
- Вызов Cache: `await db.optimized.clearCache()` (опционально)
- Примеры:
  - `await db.pg.query(sql, params)`
  - `await db.optimized.clearCache()`

**Обязательные элементы:**
- Заголовок с описанием функции
- SQL запрос с параметризованными значениями
- Очистка кэша после операции записи (опционально)
- Возврат результата из базы данных

## 🔗 ВЫЗОВЫ МОДУЛЕЙ МЕЖДУ СЛОЯМИ

### API Layer → Schema Layer → Validation

**✅ РЕКОМЕНДУЕМЫЙ СПОСОБ (validateEndpoint):**
```javascript
// Валидация в одной строке (автоматически получает схему и валидирует)
const validatedData = await lib.validation.validateEndpoint(payload, '{entity}', '{action}');

// Примеры:
const validatedData = await lib.validation.validateEndpoint(payload, 'product', 'create');
const validatedData = await lib.validation.validateEndpoint(payload, 'vapp.review', 'markUnderReview');
const validatedData = await lib.validation.validateEndpoint(payload, 'fleet-management.driverSchedule', 'create');
```

**Альтернативный способ (для обратной совместимости):**
```javascript
// Получение схемы
const schema = await lib.schemas.{entity}.{action}Schema();

// Валидация данных
const validation = await common.validateSchema(payload, schema);
if (!validation.valid) {
  throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
}
const validatedData = validation.data;

// Примеры:
const schema = await lib.schemas.product.createSchema();
const validation = await common.validateSchema(payload, schema);
```

### API Layer → Domain Layer
```javascript
// Вызов доменной функции с валидированными данными
await domain.{entity}.{action}(validatedData, context)

// Примеры:
await domain.product.create(validatedData, context)
await domain.user.update(validatedData, context)
await domain.order.list(validatedData, context)
await domain.report.remove(validatedData, context)
```

### Domain Layer → Business Logic (опционально)
```javascript
// Дополнительная валидация бизнес-правил
domain.{entity}.{entity}Logic.validate{Action}(payload)

// Примеры:
domain.product.productLogic.validateCreate(payload)
domain.user.userLogic.validateUpdate(payload)
domain.report.reportLogic.validateListFilters(opts)
```

### Domain Layer → Repository Layer
```javascript
// Вызов репозитория
await lib.repository.{entity}.{action}({entity}Data)

// Примеры:
await lib.repository.product.create(productData)
await lib.repository.user.update(userData)
await lib.repository.order.list(filterData)
await lib.repository.report.remove(reportData)
```

### Repository Layer → Database & Cache
```javascript
// Выполнение SQL запроса
await db.pg.query(sql, params)

// Очистка кэша
await db.optimized.clearCache()

// Примеры:
const result = await db.pg.query(sql, params)
try {
  await db.optimized.clearCache()
} catch {}
```

## 🚫 ЗАПРЕЩЕННЫЕ ПАТТЕРНЫ

### ❌ НЕ ДЕЛАЙТЕ ТАК:
```javascript
// НЕПРАВИЛЬНО - API файл без валидации в начале
({
  access: 'product.create',
  method: async (payload) => {
    // Валидация должна быть в начале!
    const res = await domain.product.create(payload, context);
    return { status: 'fulfilled', response: res };
  },
});

// НЕПРАВИЛЬНО - API файл с module.exports
module.exports = {
  access: 'product.create',
  method: async (payload) => { ... }
};

// НЕПРАВИЛЬНО - Domain файл с module.exports
module.exports = async (payload, context) => { ... };

// НЕПРАВИЛЬНО - Schema файл с module.exports
module.exports = async () => ({ ... });

// НЕПРАВИЛЬНО - Repository файл с module.exports
module.exports = async (data) => { ... };
```

### ✅ ПРАВИЛЬНО:
```javascript
// ПРАВИЛЬНО - API файл с валидацией в начале (рекомендуемый подход)
({
  access: 'product.create',
  method: async (payload) => {
    // 1. JSON SCHEMA VALIDATION: Валидация в самом начале (одна строка!)
    const validatedData = await lib.validation.validateEndpoint(payload, 'product', 'create');
    
    try {
      const res = await domain.product.create(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('product/create error:', err);
      return { status: 'rejected', response: err.message || 'Failed to create product' };
    }
  },
});

// ПРАВИЛЬНО - Альтернативный подход (для обратной совместимости)
({
  access: 'product.create',
  method: async (payload) => {
    // 1. JSON SCHEMA VALIDATION: В самом начале
    const schema = await lib.schemas.product.createSchema();
    const validation = await common.validateSchema(payload, schema);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }
    const validatedData = validation.data;
    
    try {
      const res = await domain.product.create(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('product/create error:', err);
      return { status: 'rejected', response: err.message || 'Failed to create product' };
    }
  },
});

// ПРАВИЛЬНО - Domain файл
// =============================================================================
// PRODUCT CREATE - Business Logic
// =============================================================================

async (payload, context) => {
  const user = context?.client?.session?.state || context?.session?.user || {};
  
  // Основная валидация уже выполнена в API слое
  // Здесь только бизнес-правила (если нужны)
  const product = await lib.repository.product.create(payload);
  
  return product;
};

// ПРАВИЛЬНО - Schema файл
// =============================================================================
// PRODUCT CREATE SCHEMA - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: { ... },
  required: [...],
});

// ПРАВИЛЬНО - Repository файл
// =============================================================================
// PRODUCT REPOSITORY - Create
// =============================================================================

async (data) => {
  const sql = `INSERT INTO "Product" (...) VALUES (...) RETURNING *`;
  const result = await db.pg.query(sql, params);
  return result.rows[0];
};
```

## Правила именования

### Файлы
- API: `{action}.js` (create.js, update.js, delete.js, list.js)
- Domain: `{action}.js` (create.js, update.js, delete.js, list.js)
- Schema: `{action}Schema.js` (createSchema.js, updateSchema.js, deleteSchema.js, listSchema.js)
- Repository: `{action}.js` (create.js, update.js, delete.js, list.js)

### Функции и переменные
- Используйте camelCase для переменных и функций
- Используйте PascalCase для имен сущностей в SQL
- Используйте snake_case для полей базы данных

### Права доступа
- Формат: `{entity}.{action}`
- Примеры: `product.create`, `user.update`, `order.delete`, `report.read`

## Стандартные операции

### CREATE (Создание)
1. **API:** Валидация доступа, **валидация по JSON Schema в начале**, обработка ошибок
2. **Domain:** Дополнительная валидация бизнес-правил (опционально), оркестрация
3. **Repository:** INSERT запрос, очистка кэша

### UPDATE (Обновление)
1. **API:** Валидация доступа, **валидация по JSON Schema в начале**, обработка ошибок
2. **Domain:** Дополнительная валидация бизнес-правил (опционально), проверка существования
3. **Repository:** UPDATE запрос, очистка кэша

### DELETE (Удаление)
1. **API:** Валидация доступа, **валидация по JSON Schema в начале**, обработка ошибок
2. **Domain:** Проверка зависимостей, бизнес-правила удаления
3. **Repository:** DELETE запрос (или soft delete), очистка кэша

### LIST (Получение списка)
1. **API:** Валидация доступа, **валидация по JSON Schema в начале**, обработка ошибок
2. **Domain:** Подготовка параметров фильтрации
3. **Repository:** SELECT запрос с пагинацией

## Обработка ошибок

### API Layer
- **Валидация по JSON Schema в самом начале** - ошибки валидации возвращаются немедленно
- Логирование всех ошибок
- Возврат стандартизированного формата: `{ status: 'rejected', response: 'error message' }`
- Не раскрывать внутренние детали ошибок

### Domain Layer
- Дополнительная валидация с детальными сообщениями об ошибках
- Бросание ошибок с понятными сообщениями
- Проверка бизнес-правил

### Repository Layer
- Обработка ошибок базы данных
- Безопасная очистка кэша (try-catch)
- Возврат данных в ожидаемом формате

## Кэширование

- Все операции изменения данных должны очищать кэш
- Используйте `db.optimized.clearCache()` после операций записи
- Оборачивайте очистку кэша в try-catch для безопасности

## Примеры использования

### Создание нового Product

**API:** `application/api/product/create.js`

**✅ РЕКОМЕНДУЕМЫЙ ПОДХОД (с validateEndpoint):**
```javascript
({
  access: 'product.create',
  method: async (payload) => {
    // 1. JSON SCHEMA VALIDATION: Валидация в самом начале (одна строка!)
    const validatedData = await lib.validation.validateEndpoint(payload, 'product', 'create');
    
    // 2. DOMAIN: Вызов доменной функции с валидированными данными
    try {
      const res = await domain.product.create(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('product/create error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to create product',
      };
    }
  },
});
```

**Альтернативный подход (для обратной совместимости):**
```javascript
({
  access: 'product.create',
  method: async (payload) => {
    // 1. JSON SCHEMA VALIDATION: В самом начале
    const schema = await lib.schemas.product.createSchema();
    const validation = await common.validateSchema(payload, schema);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }
    const validatedData = validation.data;
    
    try {
      const res = await domain.product.create(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('product/create error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to create product',
      };
    }
  },
});
```

**Schema:** `application/lib/schemas/product/createSchema.js`
```javascript
// =============================================================================
// PRODUCT CREATE SCHEMA - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Product name',
    },
    price: {
      type: 'number',
      minimum: 0,
      description: 'Product price',
    },
    category_id: {
      type: 'string',
      format: 'uuid',
      description: 'Category ID (UUID)',
    },
    description: {
      type: ['string', 'null'],
      maxLength: 5000,
      description: 'Product description',
    },
  },
  required: ['name', 'price', 'category_id'],
});
```

**Domain:** `application/domain/product/create.js`
```javascript
// =============================================================================
// PRODUCT CREATE - Business Logic
// =============================================================================

async (payload, context) => {
  const user = context?.client?.session?.state || context?.session?.user || {};

  // Основная валидация уже выполнена в API слое через JSON Schema
  // Здесь можно добавить дополнительную бизнес-логику (опционально)

  // 2. REPOSITORY: Create product
  const product = await lib.repository.product.create(payload);

  // 3. LOG: Product creation
  console.log(
    `✅ Product created by User ${user.id || user.email || 'unknown'}`,
  );

  return product;
};
```

**Repository:** `application/lib/repository/product/create.js`
```javascript
// =============================================================================
// PRODUCT REPOSITORY - Create
// =============================================================================

async (data) => {
  const { name, price, category_id, description } = data;

  const sql = `
    INSERT INTO "Product" (
      name, price, category_id, description, created_at
    )
    VALUES ($1, $2, $3, $4, now())
    RETURNING *
  `;

  const params = [name, price, category_id, description];

  const result = await db.pg.query(sql, params);

  // Clear cache
  try {
    db.optimized.clearCache();
  } catch {}

  return result.rows[0];
};
```

## Контрольный список

При создании новой функции проверьте:

### Синтаксис файлов:
- [ ] **API файл:** Начинается с `(` и заканчивается `);`
- [ ] **API файл:** НЕТ `module.exports` или `export`
- [ ] **API файл:** Валидация по JSON Schema в самом начале метода
- [ ] **Schema файл:** Начинается с заголовка `// =============================================================================`
- [ ] **Schema файл:** Сразу после заголовка идет `async () => ({`
- [ ] **Schema файл:** НЕТ `module.exports` или `export`
- [ ] **Domain файл:** Начинается с заголовка `// =============================================================================`
- [ ] **Domain файл:** Сразу после заголовка идет `async (payload, context) => {`
- [ ] **Domain файл:** НЕТ `module.exports` или `export`
- [ ] **Repository файл:** Начинается с заголовка `// =============================================================================`
- [ ] **Repository файл:** Сразу после заголовка идет `async (data) => {`
- [ ] **Repository файл:** НЕТ `module.exports` или `export`

### Папочная структура:
- [ ] **API папка:** Создана папка `application/api/{entity}/`
- [ ] **Domain папка:** Создана папка `application/domain/{entity}/`
- [ ] **Schema папка:** Создана папка `application/lib/schemas/{entity}/`
- [ ] **Repository папка:** Создана папка `application/lib/repository/{entity}/`
- [ ] **Именование папок:** Используется `camelCase` для всех папок
- [ ] **Файлы созданы:** Файлы создаются только при необходимости роута/функционала

### Вызовы модулей:
- [ ] **API → Validation (рекомендуемый):** `await lib.validation.validateEndpoint(payload, '{entity}', '{action}')`
- [ ] **API → Schema (альтернативный):** `await lib.schemas.{entity}.{action}Schema()`
- [ ] **API → Validation (альтернативный):** `await common.validateSchema(payload, schema)`
- [ ] **API → Domain:** `await domain.{entity}.{action}(validatedData, context)`
- [ ] **Domain → Business Logic:** `domain.{entity}.{entity}Logic.validate{Action}(payload)` (опционально)
- [ ] **Domain → Repository:** `await lib.repository.{entity}.{action}({entity}Data)`
- [ ] **Repository → Database:** `await db.pg.query(sql, params)`
- [ ] **Repository → Cache:** `await db.optimized.clearCache()` (для операций записи)

### Функциональность:
- [ ] Права доступа указаны в правильном формате
- [ ] Валидация по JSON Schema выполняется в API слое в самом начале
- [ ] Используется `lib.validation.validateEndpoint()` для валидации (рекомендуемый подход)
- [ ] Обработка ошибок реализована на всех уровнях
- [ ] Кэш очищается после операций записи
- [ ] Именование файлов и функций соответствует стандартам
- [ ] SQL запросы используют параметризованные значения
- [ ] Комментарии добавлены для каждого шага в Domain слое

## Отличия от стандартной архитектуры

### Ключевые отличия:
1. **Валидация по JSON Schema в API слое:** Валидация выполняется в самом начале метода API, до вызова domain слоя
2. **Нет папки business logic:** Вместо отдельной папки `{entity}Logic` с `validate.js` и `prepare.js`, используется файл `{entity}Logic.js` в domain слое для дополнительной валидации бизнес-правил (опционально)
3. **Schema Layer:** Отдельный слой для JSON Schema валидации в `application/lib/schemas/{entity}/`
4. **Упрощенная Domain логика:** Domain слой фокусируется на оркестрации, основная валидация уже выполнена в API

## Связанные документы

- **STATISTICS_ENDPOINTS_GUIDE.md** - Руководство по созданию статистических эндпоинтов для чартов (SQL агрегация в БД)
- **DATABASE_OPTIMIZATION_RULES.md** - Правила оптимизации БД и кэширования

## Заключение

Данная архитектура обеспечивает:
- Четкое разделение ответственности
- Валидацию по JSON Schema в самом начале запроса
- Раннее обнаружение ошибок валидации
- Легкость тестирования
- Масштабируемость
- Безопасность
- Поддерживаемость кода
- **DRY принцип** через `lib.validation.validateEndpoint()` (6 строк → 1 строка)
- **Автоматическое кэширование** путей к схемам (LRU cache, защита от утечек памяти)
- **Поддержку вложенных путей** (`'vapp.review'`, `'fleet-management.driverSchedule'`)

Следуйте этим правилам для создания консистентного и надежного кода для любых новых эндпоинтов.

**Рекомендация:** Используйте `lib.validation.validateEndpoint()` для всех новых эндпоинтов. Это упрощает код, следует принципу DRY и обеспечивает оптимальную производительность через кэширование.
