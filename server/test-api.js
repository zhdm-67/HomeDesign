#!/usr/bin/env node
/**
 * Автотесты для API «Дом по стилю»
 *
 * Запуск:  node test-api.js
 * Требует: Node.js 18+ (нативный fetch), запущенный бэкенд на localhost:5000
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// --- Цветной вывод ---
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

const log = {
  pass: (msg) => console.log(`  ${colors.green}+${colors.reset} ${msg}`),
  fail: (msg) => console.log(`  ${colors.red}-${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
  warn: (msg) => console.log(`  ${colors.yellow}!${colors.reset} ${msg}`),
  group: (msg) => console.log(`\n${colors.bold}${msg}${colors.reset}`),
  dim: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`),
};

// --- Счётчик ---
const stats = { passed: 0, failed: 0, total: 0 };

function assert(condition, message) {
  stats.total++;
  if (condition) {
    stats.passed++;
    log.pass(message);
    return true;
  }
  stats.failed++;
  log.fail(message);
  return false;
}

// --- HTTP-хелпер ---
async function request(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// --- Уникальные данные для теста ---
const ts = Date.now();
const testUser = {
  name: 'Тестовый Пользователь',
  email: `test_${ts}@example.com`,
  password: 'secret123',
};
const testUser2 = {
  name: 'Другой Пользователь',
  email: `test2_${ts}@example.com`,
  password: 'secret456',
};

// --- Глобальное состояние теста ---
let token = null;
let token2 = null;
let projectId = null;
let styleId = null;
let catalogItemId = null;

// =====================================================
// 1. HEALTHCHECK
// =====================================================
async function testHealth() {
  log.group('1. Healthcheck');

  const { status, data } = await request('GET', '/health');
  assert(status === 200, `GET /health → 200 (получено: ${status})`);
  assert(data?.ok === true, 'Ответ содержит ok: true');
}

// =====================================================
// 2. РЕГИСТРАЦИЯ
// =====================================================
async function testRegister() {
  log.group('2. Регистрация');

  // 2.1 Успешная регистрация
  let res = await request('POST', '/auth/register', { body: testUser });
  assert(res.status === 201, `Регистрация → 201 (получено: ${res.status})`);
  assert(!!res.data?.token, 'Возвращён JWT-токен');
  assert(res.data?.user?.email === testUser.email, 'Email совпадает');
  assert(res.data?.user?.name === testUser.name, 'Имя совпадает');
  assert(res.data?.user?.password_hash === undefined, 'Хеш пароля НЕ возвращается');

  token = res.data?.token;

  // 2.2 Регистрация второго пользователя
  res = await request('POST', '/auth/register', { body: testUser2 });
  assert(res.status === 201, 'Регистрация второго пользователя → 201');
  token2 = res.data?.token;

  // 2.3 Дубликат email
  res = await request('POST', '/auth/register', { body: testUser });
  assert(res.status === 409, `Повторный email → 409 (получено: ${res.status})`);

  // 2.4 Невалидный email
  res = await request('POST', '/auth/register', {
    body: { name: 'X', email: 'not-an-email', password: 'secret123' },
  });
  assert(res.status === 400, `Невалидный email → 400 (получено: ${res.status})`);

  // 2.5 Короткий пароль
  res = await request('POST', '/auth/register', {
    body: { name: 'X', email: `x_${ts}@x.ru`, password: '123' },
  });
  assert(res.status === 400, `Короткий пароль → 400 (получено: ${res.status})`);

  // 2.6 Пустое имя
  res = await request('POST', '/auth/register', {
    body: { name: '', email: `y_${ts}@x.ru`, password: 'secret123' },
  });
  assert(res.status === 400, `Пустое имя → 400 (получено: ${res.status})`);
}

// =====================================================
// 3. ЛОГИН
// =====================================================
async function testLogin() {
  log.group('3. Логин');

  // 3.1 Успешный логин
  let res = await request('POST', '/auth/login', {
    body: { email: testUser.email, password: testUser.password },
  });
  assert(res.status === 200, `Логин → 200 (получено: ${res.status})`);
  assert(!!res.data?.token, 'Токен получен');

  // 3.2 Неверный пароль
  res = await request('POST', '/auth/login', {
    body: { email: testUser.email, password: 'wrongpass' },
  });
  assert(res.status === 401, `Неверный пароль → 401 (получено: ${res.status})`);

  // 3.3 Несуществующий email
  res = await request('POST', '/auth/login', {
    body: { email: 'nobody@nowhere.ru', password: 'x' },
  });
  assert(res.status === 401, `Несуществующий email → 401 (получено: ${res.status})`);

  // 3.4 Пустое тело
  res = await request('POST', '/auth/login', { body: {} });
  assert(res.status === 400, `Пустое тело → 400 (получено: ${res.status})`);
}

// =====================================================
// 4. /auth/me
// =====================================================
async function testMe() {
  log.group('4. GET /auth/me');

  let res = await request('GET', '/auth/me', { token });
  assert(res.status === 200, `С валидным токеном → 200 (получено: ${res.status})`);
  assert(res.data?.user?.email === testUser.email, 'Email совпадает');

  // Без токена
  res = await request('GET', '/auth/me');
  assert(res.status === 401, `Без токена → 401 (получено: ${res.status})`);

  // С мусорным токеном
  res = await request('GET', '/auth/me', { token: 'invalid.jwt.token' });
  assert(res.status === 401, `С мусорным токеном → 401 (получено: ${res.status})`);
}

// =====================================================
// 5. СТИЛИ
// =====================================================
async function testStyles() {
  log.group('5. Стили');

  // 5.1 Список стилей
  let res = await request('GET', '/styles');
  assert(res.status === 200, `GET /styles → 200 (получено: ${res.status})`);
  assert(Array.isArray(res.data?.styles), 'Массив styles присутствует');
  assert(res.data.styles.length >= 2, `Минимум 2 стиля (получено: ${res.data.styles.length})`);

  const style = res.data.styles[0];
  assert(!!style.slug, 'У стиля есть slug');
  assert(!!style.name, 'У стиля есть name');
  assert(Array.isArray(style.catalog), 'У стиля есть каталог');
  assert(style.catalog.length > 0, 'Каталог не пуст');
  assert(typeof style.catalog[0].price === 'number', 'Цена — число (не строка)');

  // Запоминаем id для дальнейших тестов
  styleId = style.id;
  catalogItemId = style.catalog[0].id;

  // Проверяем кодировку
  const hasCyrillic = /[А-Яа-яЁё]/.test(style.name);
  assert(hasCyrillic, `Кодировка русских букв работает (name="${style.name}")`);

  // 5.2 Один стиль по slug
  res = await request('GET', `/styles/${style.slug}`);
  assert(res.status === 200, `GET /styles/${style.slug} → 200`);
  assert(res.data?.style?.slug === style.slug, 'Slug совпадает');

  // 5.3 Несуществующий slug
  res = await request('GET', '/styles/nonexistent-style-xyz');
  assert(res.status === 404, `Несуществующий стиль → 404 (получено: ${res.status})`);
}

// =====================================================
// 6. ПРОЕКТЫ — список (пустой)
// =====================================================
async function testEmptyProjects() {
  log.group('6. Список проектов (пустой)');

  let res = await request('GET', '/projects', { token });
  assert(res.status === 200, `GET /projects → 200 (получено: ${res.status})`);
  assert(Array.isArray(res.data?.projects), 'Массив projects присутствует');
  assert(res.data.projects.length === 0, 'Список пуст у нового пользователя');

  // Без токена
  res = await request('GET', '/projects');
  assert(res.status === 401, `Без токена → 401 (получено: ${res.status})`);
}

// =====================================================
// 7. СОЗДАНИЕ ПРОЕКТА
// =====================================================
async function testCreateProject() {
  log.group('7. Создание проекта');

  const payload = {
    name: 'Тестовый проект',
    roomType: 'Гостиная',
    styleId,
    previewImage: 'https://example.com/preview.jpg',
    items: [
      {
        catalogItemId,
        name: 'Диван',
        price: 89000,
        qty: 1,
        image: 'https://example.com/sofa.jpg',
      },
      {
        catalogItemId,
        name: 'Торшер',
        price: 12500,
        qty: 2,
        image: 'https://example.com/lamp.jpg',
      },
    ],
  };

  // 7.1 Успешное создание
  let res = await request('POST', '/projects', { body: payload, token });
  assert(res.status === 201, `Создание → 201 (получено: ${res.status})`);
  assert(typeof res.data?.id === 'number', 'Возвращён числовой ID');
  // 89000*1 + 12500*2 = 114000
  assert(res.data?.totalPrice === 114000, `Сумма = 114000 (получено: ${res.data?.totalPrice})`);
  assert(res.data?.itemsCount === 3, `Количество = 3 (получено: ${res.data?.itemsCount})`);

  projectId = res.data.id;

  // 7.2 Невалидные данные
  res = await request('POST', '/projects', {
    body: { ...payload, name: '' },
    token,
  });
  assert(res.status === 400, `Пустое имя → 400 (получено: ${res.status})`);

  res = await request('POST', '/projects', {
    body: { ...payload, items: [] },
    token,
  });
  assert(res.status === 400, `Пустой items → 400 (получено: ${res.status})`);

  res = await request('POST', '/projects', {
    body: { ...payload, styleId: 99999 },
    token,
  });
  assert(res.status === 400, `Несуществующий styleId → 400 (получено: ${res.status})`);

  res = await request('POST', '/projects', { body: payload });
  assert(res.status === 401, `Без токена → 401 (получено: ${res.status})`);
}

// =====================================================
// 8. ЧТЕНИЕ ПРОЕКТА
// =====================================================
async function testGetProject() {
  log.group('8. Чтение проекта');

  let res = await request('GET', `/projects/${projectId}`, { token });
  assert(res.status === 200, `GET /projects/:id → 200`);
  assert(res.data?.project?.id === projectId, 'ID совпадает');
  assert(res.data?.project?.items?.length === 2, 'В проекте 2 позиции');
  assert(res.data?.project?.totalPrice === 114000, 'Сумма сохранена');

  // 8.2 Другой пользователь НЕ должен видеть чужой проект
  res = await request('GET', `/projects/${projectId}`, { token: token2 });
  assert(res.status === 404, `Чужой проект → 404 (получено: ${res.status})`);

  // 8.3 Несуществующий ID
  res = await request('GET', '/projects/999999', { token });
  assert(res.status === 404, `Несуществующий ID → 404 (получено: ${res.status})`);
}

// =====================================================
// 9. ОБНОВЛЕНИЕ ПРОЕКТА
// =====================================================
async function testUpdateProject() {
  log.group('9. Обновление проекта');

  const payload = {
    name: 'Обновлённое название',
    items: [
      {
        catalogItemId,
        name: 'Диван',
        price: 89000,
        qty: 3,
        image: 'https://example.com/sofa.jpg',
      },
    ],
  };

  // 9.1 Обновление
  let res = await request('PUT', `/projects/${projectId}`, { body: payload, token });
  assert(res.status === 200, `Обновление → 200 (получено: ${res.status})`);
  assert(res.data?.ok === true, 'Ответ содержит ok: true');

  // 9.2 Проверяем, что данные сохранились
  res = await request('GET', `/projects/${projectId}`, { token });
  assert(res.data?.project?.name === 'Обновлённое название', 'Имя обновилось');
  // 89000 * 3 = 267000
  assert(res.data?.project?.totalPrice === 267000, `Новая сумма = 267000 (получено: ${res.data?.project?.totalPrice})`);
  assert(res.data?.project?.itemsCount === 3, 'Количество = 3');

  // 9.3 Чужой токен
  res = await request('PUT', `/projects/${projectId}`, { body: payload, token: token2 });
  assert(res.status === 404, `Чужой проект → 404 (получено: ${res.status})`);
}

// =====================================================
// 10. СПИСОК ПРОЕКТОВ ПОСЛЕ СОЗДАНИЯ
// =====================================================
async function testProjectsList() {
  log.group('10. Список проектов (с данными)');

  const res = await request('GET', '/projects', { token });
  assert(res.status === 200, 'GET /projects → 200');
  assert(res.data.projects.length === 1, 'Один проект в списке');
  assert(res.data.projects[0].id === projectId, 'ID проекта совпадает');
  assert(typeof res.data.projects[0].totalPrice === 'number', 'totalPrice — число');
}

// =====================================================
// 11. УДАЛЕНИЕ ПРОЕКТА
// =====================================================
async function testDeleteProject() {
  log.group('11. Удаление проекта');

  // 11.1 Чужой не может удалить
  let res = await request('DELETE', `/projects/${projectId}`, { token: token2 });
  assert(res.status === 404, `Чужой проект → 404 (получено: ${res.status})`);

  // 11.2 Свой — удаляет
  res = await request('DELETE', `/projects/${projectId}`, { token });
  assert(res.status === 200, `Удаление → 200 (получено: ${res.status})`);
  assert(res.data?.ok === true, 'ok: true');

  // 11.3 Повторное удаление → 404
  res = await request('DELETE', `/projects/${projectId}`, { token });
  assert(res.status === 404, `Повторное удаление → 404 (получено: ${res.status})`);

  // 11.4 Проверка, что список пуст
  res = await request('GET', '/projects', { token });
  assert(res.data.projects.length === 0, 'Список снова пуст');
}

// =====================================================
// 12. 404 для несуществующих маршрутов
// =====================================================
async function testNotFound() {
  log.group('12. Несуществующие маршруты');

  let res = await request('GET', '/nonexistent-endpoint');
  assert(res.status === 404, `GET /nonexistent → 404 (получено: ${res.status})`);

  res = await request('POST', '/wrong/path', { body: {} });
  assert(res.status === 404, `POST /wrong/path → 404 (получено: ${res.status})`);
}

// =====================================================
// 13. CORS
// =====================================================
async function testCors() {
  log.group('13. CORS');

  const res = await fetch(`${BASE_URL}/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
    },
  });
  const allowOrigin = res.headers.get('access-control-allow-origin');
  assert(!!allowOrigin, `CORS-заголовок присутствует (${allowOrigin})`);
}

// =====================================================
// ЗАПУСК
// =====================================================
async function run() {
  console.log(`\n${colors.bold} Запуск тестов API${colors.reset}`);
  log.dim(`   Сервер: ${BASE_URL}`);
  log.dim(`   Время:  ${new Date().toLocaleString('ru-RU')}`);
  log.dim(`   Пользователь: ${testUser.email}`);

  const start = Date.now();

  try {
    await testHealth();
    await testRegister();
    await testLogin();
    await testMe();
    await testStyles();
    await testEmptyProjects();
    await testCreateProject();
    await testGetProject();
    await testUpdateProject();
    await testProjectsList();
    await testDeleteProject();
    await testNotFound();
    await testCors();
  } catch (err) {
    console.log(`\n${colors.red} Фатальная ошибка:${colors.reset}`, err.message);
    console.log(err.stack);
  }

  const duration = Date.now() - start;

  console.log('\n' + '─'.repeat(50));
  console.log(`${colors.bold} Итоги:${colors.reset}`);
  console.log(`   Всего:    ${stats.total}`);
  console.log(`   ${colors.green}Прошло:  ${stats.passed}${colors.reset}`);
  console.log(`   ${colors.red}Упало:   ${stats.failed}${colors.reset}`);
  console.log(`   Время:    ${duration} мс`);
  console.log('─'.repeat(50));

  if (stats.failed > 0) {
    console.log(`\n${colors.red}${colors.bold}- Тесты провалены${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}+ Все тесты прошли!${colors.reset}\n`);
    process.exit(0);
  }
}

run();