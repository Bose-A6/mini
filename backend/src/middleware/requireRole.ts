import type { Request, Response, NextFunction } from 'express';

export function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Unauthorized' });
    }

    const hasRole = user.role && roles.includes(user.role);
    const hasAnyRole = user.roles?.some((value) => roles.includes(value));

    if (!hasRole && !hasAnyRole) {
      return res.status(403).json({ ok: false, message: 'Forbidden: insufficient permissions' });
    }

    next();
  };
}
