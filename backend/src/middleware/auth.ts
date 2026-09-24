import type { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  roles: string[];
  full_name?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Missing bearer token' });
  }

  const token = authHeader.replace('Bearer ', '');

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ ok: false, message: 'Invalid or expired token' });
  }

  let profile: any = null;
  try {
    const { data: dbProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, roles, full_name')
      .eq('id', data.user.id)
      .maybeSingle();

    profile = dbProfile;
  } catch {
    // If profiles table is pending creation, fall back to metadata
  }

  const resolvedRole = profile?.role ?? (data.user.user_metadata?.role as string | undefined) ?? 'client';
  const resolvedFullName = profile?.full_name ?? (data.user.user_metadata?.full_name as string | undefined) ?? data.user.email?.split('@')[0] ?? 'User';

  req.user = {
    id: data.user.id,
    email: data.user.email ?? '',
    role: resolvedRole,
    roles: profile?.roles ?? [resolvedRole],
    full_name: resolvedFullName,
  };

  next();
}

