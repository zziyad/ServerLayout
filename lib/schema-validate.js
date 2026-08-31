'use strict';

const AjvModule = require('ajv');
const addFormats = require('ajv-formats');
const Ajv = AjvModule.default || AjvModule;

class LRUCache {
  constructor(limit = 100) {
    this.limit = limit;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value); // переместить в конец (самый новый)
    return value;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.limit) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
}

let ajvInstance = null;

const getAjvInstance = () => {
  if (!ajvInstance) {
    ajvInstance = new Ajv({
      allErrors: true,
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: true,
      strictSchema: false,
      strictRequired: false,
    });
    addFormats(ajvInstance);
    console.log('✅ AJV JSON Schema validator initialized (LRU + map errors)');
  }
  return ajvInstance;
};

const schemaCache = new LRUCache(100);
const schemaPathCache = new LRUCache(200); // Кэш для путей к схемам (getter functions)

const safeCompile = (ajv, schema) => {
  try {
    return ajv.compile(schema);
  } catch (err) {
    console.error('❌ Schema compilation failed:', err.message);
    throw new Error(`Invalid JSON Schema: ${err.message}`);
  }
};

// -----------------------------------------------------------------------------
// Получение валидатора из кеша (или компиляция)
// -----------------------------------------------------------------------------
const getValidator = (schema) => {
  const ajv = getAjvInstance();
  const key = JSON.stringify(schema);

  const cached = schemaCache.get(key);
  if (cached) return cached;

  const validator = safeCompile(ajv, schema);
  schemaCache.set(key, validator);
  return validator;
};

const formatError = (err) => {
  const field =
    err.instancePath?.slice(1) || err.params.missingProperty || 'data';
  const templates = {
    required: () => `${err.params.missingProperty} is required`,
    pattern: () => `${field} format is invalid`,
    minimum: () => `${field} must be >= ${err.params.limit}`,
    maximum: () => `${field} must be <= ${err.params.limit}`,
    enum: () =>
      `${field} must be one of: ${err.params.allowedValues.join(', ')}`,
    type: () => `${field} must be ${err.params.type}`,
    format: () => `${field} must be valid ${err.params.format}`,
  };
  return templates[err.keyword]?.() || `${field} ${err.message}`;
};

const validateSchema = (data, schema) => {
  const dataToValidate = JSON.parse(JSON.stringify(data)); // защита от ссылок
  const validator = getValidator(schema);

  let valid;
  try {
    valid = validator(dataToValidate);
  } catch (err) {
    console.error('❌ Validation runtime error:', err.message);
    return {
      valid: false,
      errors: [`Schema recursion or invalid data: ${err.message}`],
      data: null,
    };
  }

  if (valid) {
    return { valid: true, errors: [], data: dataToValidate };
  }

  const errors = (validator.errors || []).map(formatError);
  return { valid: false, errors, data: null };
};

// -----------------------------------------------------------------------------
// Валидация эндпоинта с автоматическим получением схемы
// -----------------------------------------------------------------------------
/**
 * Validate endpoint payload using JSON Schema
 * Automatically resolves schema path from entity and action
 * Caches schema getter functions for performance
 *
 * @param {Object} payload - Data to validate
 * @param {string} entity - Entity name (e.g., 'product', 'vapp.review')
 * @param {string} action - Action name (e.g., 'create', 'update', 'list')
 * @param {Object} lib - Library object with schemas (passed from runtime context)
 * @returns {Promise<Object>} Validated data
 * @throws {Error} If validation fails or schema not found
 */
const validateEndpoint = async (payload, entity, action, lib = null) => {
  // Попытка использовать переданный lib или глобальный (если доступен в sandbox)
  const libInstance =
    lib || (typeof global !== 'undefined' && global.lib) || null;

  if (!libInstance || !libInstance.schemas) {
    throw new Error(
      'lib.schemas is required for validateEndpoint. Pass lib as 4th parameter or ensure global.lib is available.',
    );
  }

  const cacheKey = `${entity}.${action}Schema`;

  // Проверяем кэш (LRU автоматически управляет размером)
  let schemaGetter = schemaPathCache.get(cacheKey);

  if (!schemaGetter) {
    // Первый раз - обходим путь к схеме
    const entityPath = entity.split('.');
    let schemaModule = libInstance.schemas;

    // Обходим вложенные пути (например, 'vapp.review' -> lib.schemas.vapp.review)
    for (const part of entityPath) {
      schemaModule = schemaModule[part];
      if (!schemaModule) {
        throw new Error(`Schema entity not found: ${entity}`);
      }
    }

    const schemaName = `${action}Schema`;
    schemaGetter = schemaModule[schemaName];

    if (!schemaGetter || typeof schemaGetter !== 'function') {
      throw new Error(`Schema not found: ${entity}.${schemaName}`);
    }

    // Сохраняем в LRU кэш (автоматически удалит старые при превышении лимита)
    schemaPathCache.set(cacheKey, schemaGetter);
  }

  // Вызываем кэшированный getter для получения схемы
  let schema = await schemaGetter();

  // List endpoints: department_id is optional when list_all is used (admin/super_admin).
  // Force required: [] so validation accepts {} or { list_all: true } even if schema file was outdated.
  if (
    (entity === 'helpdesk.queue' || entity === 'helpdesk.label') &&
    action === 'list'
  ) {
    schema = { ...schema, required: [] };
  }

  // Валидируем данные
  const validation = await validateSchema(payload, schema);

  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
  }

  // Возвращаем валидированные данные (с defaults примененными, лишние поля удалены)
  return validation.data;
};


module.exports = {
  validateSchema,
  validateEndpoint,
  getAjvInstance,
};
