export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  console.error('💥 Ошибка:', {
    status,
    message,
    code: err.code,
    sqlMessage: err.sqlMessage,
    sql: err.sql,
    stack: err.stack,
  });

  const body = { error: message };
  if (process.env.NODE_ENV !== 'production') {
    if (err.sqlMessage) body.sqlMessage = err.sqlMessage;
    if (err.code) body.code = err.code;
  }

  res.status(status).json(body);
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Маршрут не найден' });
}