import { Logger } from '../../core/logger';
import { Environment } from '../../core/env';

const logger = new Logger('NotificationsService');

// ─── Types ─────────────────────────────────────────────
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface NotificationPayload {
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  link?: string;
}

// ─── Send Email ────────────────────────────────────────
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const apiKey = Environment.get().RESEND_API_KEY;
    const from = Environment.get().EMAIL_FROM;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: payload.replyTo,
        attachments: payload.attachments,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      logger.error('Failed to send email', new Error(JSON.stringify(error)), {
        to: payload.to,
        subject: payload.subject,
      });
      return false;
    }
    
    logger.info('Email sent', { to: payload.to, subject: payload.subject });
    return true;
  } catch (error) {
    logger.error('Email sending error', error, { to: payload.to });
    return false;
  }
}

// ─── Email Templates ───────────────────────────────────
export function getWelcomeEmail(username: string, verificationLink: string): EmailPayload {
  return {
    to: '',
    subject: 'Welcome to Peage! 🚀',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #6366f1;">Welcome to Peage, ${username}!</h1>
        </div>
        <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 20px 0;">
          <p style="font-size: 16px; color: #374151;">
            Thank you for joining Peage! To get started, please verify your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background: #6366f1; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            This link will expire in 1 hour. If you didn't create an account, you can ignore this email.
          </p>
        </div>
      </body>
      </html>
    `,
  };
}

export function getPasswordResetEmail(username: string, resetLink: string): EmailPayload {
  return {
    to: '',
    subject: 'Reset Your Peage Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6366f1;">Reset Your Password</h1>
        <p>Hi ${username},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: #6366f1; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </body>
      </html>
    `,
  };
}

export function getWithdrawalRequestEmail(
  username: string,
  amount: number,
  method: string,
  status: string
): EmailPayload {
  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    completed: '#10b981',
    rejected: '#ef4444',
  };
  
  return {
    to: '',
    subject: `Withdrawal ${status} - $${amount.toFixed(2)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6366f1;">Withdrawal Update</h1>
        <p>Hi ${username},</p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 20px 0;">
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Method:</strong> ${method}</p>
          <p><strong>Status:</strong> 
            <span style="color: ${statusColors[status] || '#000'}; font-weight: bold;">
              ${status.toUpperCase()}
            </span>
          </p>
        </div>
      </body>
      </html>
    `,
  };
}

export function getPaymentReceivedEmail(
  username: string,
  amount: number,
  source: string
): EmailPayload {
  return {
    to: '',
    subject: `Payment Received - $${amount.toFixed(2)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981;">Payment Received! 🎉</h1>
        <p>Hi ${username},</p>
        <p>You just earned <strong>$${amount.toFixed(2)}</strong> from <strong>${source}</strong>!</p>
        <p>Keep sharing your links to earn more.</p>
      </body>
      </html>
    `,
  };
}

// ─── Queue Email ───────────────────────────────────────
export async function queueEmail(
  queue: Queue,
  payload: EmailPayload
): Promise<void> {
  try {
    await queue.send({
      type: 'email',
      payload,
    });
    logger.info('Email queued', { to: payload.to, subject: payload.subject });
  } catch (error) {
    logger.error('Failed to queue email', error, { to: payload.to });
  }
}

// ─── Send Push Notification ────────────────────────────
export async function sendPushNotification(
  userId: string,
  notification: NotificationPayload
): Promise<void> {
  // TODO: Intégrer Web Push API
  logger.info('Push notification queued', { userId, type: notification.type });
}

// ─── Send In-App Notification ──────────────────────────
export async function sendInAppNotification(
  userId: string,
  notification: NotificationPayload
): Promise<void> {
  // TODO: Sauvegarder dans la table notifications
  logger.info('In-app notification created', { userId, type: notification.type });
}

// ─── Bulk Send ─────────────────────────────────────────
export async function sendBulkEmails(
  queue: Queue,
  recipients: Array<{ email: string; username: string }>,
  subject: string,
  html: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  
  for (const recipient of recipients) {
    try {
      await queueEmail(queue, {
        to: recipient.email,
        subject,
        html,
      });
      sent++;
    } catch {
      failed++;
    }
  }
  
  logger.info('Bulk emails queued', { sent, failed });
  return { sent, failed };
}
