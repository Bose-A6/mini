import { Router } from 'express';
import { z } from 'zod';

import { requireSupabaseConfig, supabase, supabaseAdmin } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  role: z.enum(['client', 'freelancer', 'admin']).default('client'),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/signup - Strong Signup Flow
router.post('/signup', async (req, res) => {
  try {
    requireSupabaseConfig();
  } catch (error) {
    return res.status(503).json({ ok: false, message: error instanceof Error ? error.message : 'Supabase is not configured' });
  }

  const parsed = signUpSchema.safeParse(req.body);

  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    return res.status(400).json({ ok: false, message: errorMsg || 'Invalid signup payload', errors: parsed.error.flatten() });
  }

  const { email, password, fullName, role } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();
  const cleanFullName = (fullName ?? '').trim() || cleanEmail.split('@')[0];

  try {
    // 1. Check if user already exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existing = userList?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (existing) {
      return res.status(400).json({
        ok: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    // 2. Create the user in Supabase Auth (pre-confirmed to ensure instant access)
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanFullName,
        role,
      },
    });

    if (adminError || !adminData.user) {
      return res.status(400).json({
        ok: false,
        message: adminError?.message || 'Failed to create user account.',
      });
    }

    const createdUser = adminData.user;

    // 3. Upsert profile into public.profiles if table exists
    try {
      await supabaseAdmin.from('profiles').upsert(
        {
          id: createdUser.id,
          email: cleanEmail,
          full_name: cleanFullName,
          role,
          roles: [role],
          is_verified: role === 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {
      // Graceful fallback if profiles table hasn't been migrated yet
    }

    // 4. Authenticate and retrieve active session JWT
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    return res.status(201).json({
      ok: true,
      message: 'Account created successfully.',
      user: {
        id: createdUser.id,
        email: cleanEmail,
        fullName: cleanFullName,
        role,
        roles: [role],
      },
      session: signInData?.session ?? null,
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({
      ok: false,
      message: err?.message || 'An unexpected error occurred during signup.',
    });
  }
});

// POST /api/auth/login - Strict Authentication
router.post('/login', async (req, res) => {
  try {
    requireSupabaseConfig();
  } catch (error) {
    return res.status(503).json({ ok: false, message: error instanceof Error ? error.message : 'Supabase is not configured' });
  }

  const parsed = signInSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Please provide a valid email and password.', errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Strict password login verification via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data?.user) {
      // Check if user even exists to provide clear feedback
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = userList?.users?.some((u) => u.email?.toLowerCase() === cleanEmail);

      if (!userExists) {
        return res.status(401).json({
          ok: false,
          message: 'No account found with this email. Please sign up to create an account.',
        });
      }

      return res.status(401).json({
        ok: false,
        message: 'Invalid password. Please check your credentials and try again.',
      });
    }

    const authUser = data.user;
    const resolvedRole = (authUser.user_metadata?.role as string | undefined) ?? 'client';
    const resolvedFullName = authUser.user_metadata?.full_name ?? authUser.email?.split('@')[0] ?? 'User';

    // 2. Fetch or sync profile if table exists
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!profile) {
        await supabaseAdmin.from('profiles').upsert(
          {
            id: authUser.id,
            email: cleanEmail,
            full_name: resolvedFullName,
            role: resolvedRole,
            roles: [resolvedRole],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
    } catch {
      // Graceful fallback if profiles table hasn't been migrated yet
    }

    return res.json({
      ok: true,
      message: 'Login successful.',
      user: {
        id: authUser.id,
        email: authUser.email ?? cleanEmail,
        fullName: resolvedFullName,
        role: resolvedRole,
        roles: [resolvedRole],
      },
      session: data.session,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      ok: false,
      message: err?.message || 'An unexpected error occurred during login.',
    });
  }
});

// POST /api/auth/admin-login - Master Admin Passcode Access
const adminPasscodeSchema = z.object({
  passcode: z.string().min(1, 'Passcode is required'),
});

const MASTER_ADMIN_PASSCODE = process.env.ADMIN_MASTER_PASSCODE || 'admin@426';

router.post('/admin-login', async (req, res) => {
  const parsed = adminPasscodeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Please provide the master admin passcode.' });
  }

  const { passcode } = parsed.data;

  if (passcode.trim() !== MASTER_ADMIN_PASSCODE) {
    return res.status(401).json({
      ok: false,
      message: 'Invalid Admin Master Passcode. Access denied.',
    });
  }

  // Ensure Admin profile in Supabase
  const adminEmail = 'admin@freelancestack.io';
  const adminName = 'System Administrator';

  let adminUser: any = null;
  try {
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    adminUser = userList?.users?.find((u) => u.email?.toLowerCase() === adminEmail);

    if (!adminUser) {
      const { data: created } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: MASTER_ADMIN_PASSCODE,
        email_confirm: true,
        user_metadata: {
          full_name: adminName,
          role: 'admin',
        },
      });
      adminUser = created?.user;
    }
  } catch (err) {
    console.warn('Admin Supabase setup notice:', err);
  }

  const adminId = adminUser?.id || 'admin-master-node';

  return res.json({
    ok: true,
    message: 'Admin access authorized.',
    user: {
      id: adminId,
      email: adminEmail,
      fullName: adminName,
      role: 'admin',
      roles: ['admin'],
    },
  });
});

// POST /api/auth/logout - Real Logout
router.post('/logout', authMiddleware, async (_req, res) => {
  try {
    requireSupabaseConfig();
  } catch (error) {
    return res.status(503).json({ ok: false, message: error instanceof Error ? error.message : 'Supabase is not configured' });
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(400).json({ ok: false, message: error.message });
  }

  return res.json({ ok: true, message: 'Logged out successfully' });
});

export default router;


