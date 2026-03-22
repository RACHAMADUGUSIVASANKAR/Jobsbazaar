import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import connectDB from './config/db.js';
import multipart from '@fastify/multipart';
import cronJobs from './utils/cronJobs.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import jobRoutes, { appRoutes } from './routes/jobRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';

const trimTrailingSlash = (value = '') => String(value || '').replace(/\/+$/, '');
const isProd = process.env.NODE_ENV === 'production';

const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => trimTrailingSlash(origin))
  .filter(Boolean);

const defaultOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5188',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5188'
]
  .map((origin) => trimTrailingSlash(origin))
  .filter(Boolean);

const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);
const allowVercelPreview = process.env.CORS_ALLOW_VERCEL_PREVIEWS !== 'false';
const isVercelOrigin = (origin = '') => /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin);
const isLocalDevOrigin = (origin = '') => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-this')) {
  throw new Error('JWT_SECRET is required in production and must not use the default value.');
}

const fastify = Fastify({ logger: true, trustProxy: true });

// Plugins
await fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }

    const normalizedOrigin = trimTrailingSlash(origin);
    if (allowedOrigins.has(normalizedOrigin)) {
      cb(null, true);
      return;
    }

    if (!isProd && isLocalDevOrigin(normalizedOrigin)) {
      cb(null, true);
      return;
    }

    if (allowVercelPreview && isVercelOrigin(normalizedOrigin)) {
      cb(null, true);
      return;
    }

    cb(new Error(`Origin not allowed by CORS: ${normalizedOrigin}`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});
await fastify.register(formbody);
await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Connect to MongoDB (Maintain for legacy/coexistence)
await connectDB();

// Start Background Jobs
cronJobs.start();

// Routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(jobRoutes, { prefix: '/api/jobs' });
fastify.register(appRoutes, { prefix: '/api/applications' });
fastify.register(assistantRoutes, { prefix: '/api/assistant' });

// Health check
fastify.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Start server
const PORT = Number.parseInt(process.env.PORT || '3002', 10);
try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Server running on port ${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
