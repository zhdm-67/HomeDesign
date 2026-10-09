import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim()) throw new ApiError(400, 'Введите имя');
  if (!email?.includes('@')) throw new ApiError(400, 'Некорректный email');
  if (!password || password.length < 6) throw new ApiError(400, 'Пароль — минимум 6 символов');

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) throw new ApiError(409, 'Этот email уже зарегистрирован');

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name.trim(), email.trim().toLowerCase(), passwordHash]
  );

  const user = { id: result.insertId, name: name.trim(), email: email.trim().toLowerCase() };
  const token = signToken(user);

  res.status(201).json({ token, user });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw new ApiError(400, 'Email и пароль обязательны');

  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );

  if (rows.length === 0) throw new ApiError(401, 'Неверный email или пароль');

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new ApiError(401, 'Неверный email или пароль');

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (rows.length === 0) throw new ApiError(404, 'Пользователь не найден');
  res.json({ user: rows[0] });
});