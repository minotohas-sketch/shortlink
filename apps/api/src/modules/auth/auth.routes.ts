import { Hono } from 'hono';
import { validate } from '../../middleware/validation';
import { requireAuth } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limit';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.types';
import {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
} from './auth.controller';

export const authRoutes = new Hono();

// ─── Public Routes ─────────────────────────────────────
authRoutes.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  register
);

authRoutes.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  login
);

authRoutes.post(
  '/refresh',
  validate({ body: refreshTokenSchema }),
  refreshToken
);

authRoutes.post(
  '/verify-email',
  validate({ body: verifyEmailSchema }),
  verifyEmail
);

authRoutes.post(
  '/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPassword
);

authRoutes.post(
  '/reset-password',
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  resetPassword
);

// ─── Protected Routes ──────────────────────────────────
authRoutes.post(
  '/logout',
  requireAuth,
  logout
);

authRoutes.post(
  '/change-password',
  requireAuth,
  validate({ body: changePasswordSchema }),
  changePassword
);

authRoutes.get(
  '/me',
  requireAuth,
  me
);

// ─── OAuth Routes (à implémenter) ─────────────────────
authRoutes.get('/google', (c) => {
  // TODO: Rediriger vers Google OAuth
  return c.json({ message: 'Google OAuth - to be implemented' });
});

authRoutes.get('/google/callback', (c) => {
  // TODO: Gérer le callback Google OAuth
  return c.json({ message: 'Google callback - to be implemented' });
});

authRoutes.get('/github', (c) => {
  // TODO: Rediriger vers GitHub OAuth
  return c.json({ message: 'GitHub OAuth - to be implemented' });
});

authRoutes.get('/github/callback', (c) => {
  // TODO: Gérer le callback GitHub OAuth
  return c.json({ message: 'GitHub callback - to be implemented' });
});
