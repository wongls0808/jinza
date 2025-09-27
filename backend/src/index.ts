import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

// 全局异常监听，便于排查进程意外退出
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err);
});

const app = express();

// debug middleware
app.use((req, _res, next) => {
  console.log('[DEBUG INCOMING]', req.method, req.url);
  next();
});

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(logger);

app.use('/api', routes);

app.use((req, res) => {
  console.log('[DEBUG NOT FOUND]', req.method, req.url);
  res.status(404).json({ message: 'Not Found' });
});

app.use(errorHandler);

console.log('[BOOT] CWD=', process.cwd());
console.log('[BOOT] NODE_ENV=', env.NODE_ENV, 'PORT=', env.PORT, 'HAS_DB_URL=', !!process.env.DATABASE_URL);
const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`Backend listening on port ${env.PORT}`);
  console.log('[SERVER_ADDRESS]', server.address());
});

server.on('error', (e) => {
  console.error('[SERVER_ERROR]', e);
});

// heartbeat 方便确认进程是否仍在运行
setInterval(() => {
  console.log('[HEARTBEAT]', new Date().toISOString());
}, 15000).unref();

export { server };
