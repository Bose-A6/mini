import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import verificationRoutes from './routes/verification.js';
import marketplaceRoutes from './routes/marketplace.js';

dotenv.config();

export const app = express();

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const allowedOrigins = Array.from(new Set([
  ...(process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []),
  ...defaultAllowedOrigins,
]));

app.use(cors({
  origin: (origin, callback) => {
    // In Netlify or same-origin / server-to-server requests, origin may be undefined
    if (!origin || allowedOrigins.includes(origin) || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'marketplace-backend', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'marketplace-backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/marketplace', marketplaceRoutes);

app.get('/api/me', authMiddleware, async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  return res.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles,
      fullName: user.full_name,
    },
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ ok: false, message: 'Internal server error' });
});
