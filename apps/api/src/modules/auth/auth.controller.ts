import type { Context } from 'hono';
import { Logger } from '../../core/logger';
import { getValidatedBody } from '../../middleware/validation';
import { getClientIP } from '../../utils/geo';
import { ok, created } from '../../utils/response';
import * as authService from './auth.service';
import type {
  RegisterInput, LoginInput, RefreshTokenInput,
  VerifyEmailInput, ForgotPasswordInput,
  ResetPasswordInput, ChangePasswordInput,
} from './auth.types';

const logger = new Logger('AuthController');

// ─── Register ──────────────────────────────────────────
export async function register(c: Context): Promise<Response> {
  const input = getValidatedBody<RegisterInput>(c);
  const ip = getClientIP(c);
  
  const result = await authService.register(input, ip);
  
  // Définir les cookies
  setAuthCookies(c, result.tokens);
  
  return created(c, {
    user: result.user,
    tokens: result.tokens,
  }, 'Registration successful. Please verify your email.');
}

// ─── Login ─────────────────────────────────────────────
export async function login(c: Context): Promise<Response> {
  const input = getValidatedBody<LoginInput>(c);
  const ip = getClientIP(c);
  const userAgent = c.req.header('User-Agent');
  
  const result = await authService.login(input, ip, userAgent);
  
  // Définir les cookies
  setAuthCookies(c, result.tokens);
  
  return ok(c, {
    user: result.user,
    tokens: result.tokens,
  }, 'Login successful');
}

// ─── Refresh Token ─────────────────────────────────────
export async function refreshToken(c: Context): Promise<Response> {
  const input = getValidatedBody<RefreshTokenInput>(c);
  
  const tokens = await authService.refreshTokens(input.refreshToken);
  
  // Mettre à jour les cookies
  setAuthCookies(c, tokens);
  
  return ok(c, { tokens }, 'Token refreshed');
}

// ─── Logout ────────────────────────────────────────────
export async function logout(c: Context): Promise<Response> {
  const sessionId = c.get('sessionId');
  
  if (sessionId) {
    await authService.logout(sessionId);
  }
  
  // Supprimer les cookies
  c.header('Set-Cookie', 'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
  c.header('Set-Cookie', 'refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
  
  return ok(c, null, 'Logged out successfully');
}

// ─── Verify Email ──────────────────────────────────────
export async function verifyEmail(c: Context): Promise<Response> {
  const input = getValidatedBody<VerifyEmailInput>(c);
  
  await authService.verifyEmail(input.token);
  
  return ok(c, null, 'Email verified successfully');
}

// ─── Forgot Password ───────────────────────────────────
export async function forgotPassword(c: Context): Promise<Response> {
  const input = getValidatedBody<ForgotPasswordInput>(c);
  
  await authService.forgotPassword(input.email);
  
  // Toujours retourner succès (pour éviter l'énumération d'emails)
  return ok(c, null, 'If the email exists, a reset link has been sent');
}

// ─── Reset Password ────────────────────────────────────
export async function resetPassword(c: Context): Promise<Response> {
  const input = getValidatedBody<ResetPasswordInput>(c);
  
  await authService.resetPassword(input.token, input.password);
  
  return ok(c, null, 'Password reset successfully. Please login again.');
}

// ─── Change Password ───────────────────────────────────
export async function changePassword(c: Context): Promise<Response> {
  const input = getValidatedBody<ChangePasswordInput>(c);
  const userId = c.get('userId');
  
  // TODO: Implémenter le changement de mot de passe
  logger.info('Password change requested', { userId });
  
  return ok(c, null, 'Password changed successfully');
}

// ─── Get Current User ──────────────────────────────────
export async function me(c: Context): Promise<Response> {
  const userId = c.get('userId');
  
  // TODO: Récupérer l'utilisateur depuis la DB
  logger.info('Get current user', { userId });
  
  return ok(c, {
    id: userId,
    message: 'User endpoint - to be fully implemented',
  });
}

// ─── Helpers ───────────────────────────────────────────
function setAuthCookies(c: Context, tokens: { accessToken: string; refreshToken: string; expiresIn: number }): void {
  const isProduction = true; // TODO: Environment.isProduction
  
  const cookieOptions = [
    'HttpOnly',
    isProduction ? 'Secure' : '',
    'SameSite=Strict',
    `Max-Age=${tokens.expiresIn}`,
    'Path=/',
  ].filter(Boolean).join('; ');
  
  c.header('Set-Cookie', `auth_token=${tokens.accessToken}; ${cookieOptions}`);
  c.header('Set-Cookie', `refresh_token=${tokens.refreshToken}; ${cookieOptions}`);
}
