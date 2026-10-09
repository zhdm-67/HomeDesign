import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { testConnection } from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import stylesRoutes from './routes/styles.js';
import projectsRoutes from './routes/projects.js';

dotenv.config();

const app = express();

// --- Глобальные middleware ---
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// --- Healthcheck ---
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// --- API ---
app.use('/api/auth', authRoutes);
app.use('/api/styles', stylesRoutes);
app.use('/api/projects', projectsRoutes);

// --- 404 и обработка ошибок ---
app.use(notFound);
app.use(errorHandler);

// --- Запуск ---
const PORT = process.env.PORT || 5000;

(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Сервер: http://localhost:${PORT}`);
  });
})();