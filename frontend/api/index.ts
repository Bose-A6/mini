import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from '../../backend/src/routes/auth.js';
import profileRoutes from '../../backend/src/routes/profile.js';
import verificationRoutes from '../../backend/src/routes/verification.js';
import marketplaceRoutes from '../../backend/src/routes/marketplace.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'marketplace-vercel-serverless', status: 'online', timestamp: new Date().toISOString() });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'marketplace-vercel-serverless', status: 'online', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/marketplace', marketplaceRoutes);

export default app;
