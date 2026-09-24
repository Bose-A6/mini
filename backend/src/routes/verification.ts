import { Router } from 'express';
import { z } from 'zod';

import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

const verificationSubmitSchema = z.object({
  skillTags: z.array(z.string()).default([]),
  pitchStatement: z.string().min(20).max(2000),
  externalLinks: z.array(z.string().url()).default([]),
  portfolioFiles: z.array(z.string().url()).default([]),
  certificates: z.array(z.string().url()).default([]),
  idDocumentUrl: z.string().url().optional(),
  selfieUrl: z.string().url().optional(),
  professionalTitle: z.string().optional(),
  fullName: z.string().optional(),
});

const decisionSchema = z.object({
  status: z.enum(['approved', 'rejected', 'under_review']),
  adminComment: z.string().min(1).max(2000),
});

router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  let query = supabaseAdmin.from('freelancer_verifications').select('*');

  if (req.user?.role !== 'admin') {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }

  return res.json({ ok: true, verifications: data ?? [] });
});

router.post('/', authMiddleware, async (req, res) => {
  const parsed = verificationSubmitSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Invalid verification payload', errors: parsed.error.flatten() });
  }

  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  const { data, error } = await supabaseAdmin
    .from('freelancer_verifications')
    .upsert({
      user_id: userId,
      status: 'pending',
      id_document_url: parsed.data.idDocumentUrl ?? null,
      selfie_url: parsed.data.selfieUrl ?? null,
      portfolio_files: parsed.data.portfolioFiles,
      certificates: parsed.data.certificates,
      external_links: parsed.data.externalLinks,
      skill_tags: parsed.data.skillTags,
      pitch_statement: parsed.data.pitchStatement,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error || !data) {
    return res.status(400).json({ ok: false, message: error?.message ?? 'Unable to submit verification' });
  }

  return res.status(201).json({ ok: true, verification: data });
});

router.patch('/:id/decision', authMiddleware, requireRole('admin'), async (req, res) => {
  const parsed = decisionSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Invalid admin decision', errors: parsed.error.flatten() });
  }

  const { status, adminComment } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from('freelancer_verifications')
    .update({
      status,
      admin_comment: adminComment,
      reviewed_by: req.user?.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !data) {
    return res.status(400).json({ ok: false, message: error?.message ?? 'Unable to review verification' });
  }

  return res.json({ ok: true, verification: data });
});

export default router;
