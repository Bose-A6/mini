import { Router } from 'express';
import { z } from 'zod';

import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  professionalTitle: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  availability: z.boolean().optional(),
  role: z.enum(['client', 'freelancer', 'admin']).optional(),
});

router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return res.status(404).json({ ok: false, message: 'Profile not found' });
  }

  return res.json({ ok: true, profile: data });
});

router.patch('/me', authMiddleware, async (req, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Invalid profile update payload', errors: parsed.error.flatten() });
  }

  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  const updates = {
    full_name: parsed.data.fullName ?? undefined,
    professional_title: parsed.data.professionalTitle ?? undefined,
    bio: parsed.data.bio ?? undefined,
    avatar_url: parsed.data.avatarUrl ?? undefined,
    availability: parsed.data.availability ?? undefined,
    role: parsed.data.role ?? undefined,
    roles: parsed.data.role ? [parsed.data.role] : undefined,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    return res.status(400).json({ ok: false, message: error?.message ?? 'Profile update failed' });
  }

  return res.json({ ok: true, profile: data });
});

export default router;
