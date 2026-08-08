/**
 * Mail Service
 * 
 * Service d'envoi d'emails via Resend avec fallback queue.
 */

import { Environment } from './env';
import { Logger } from './logger';

const logger = new Logger('MailService');

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: MailAttachment[];
  tags?: { name: string; value: string }[];
}

export interface MailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface MailResult {
  id: string;
  success: boolean;
  error?: string;
}

export class MailService {
  private apiKey: string;
  private defaultFrom: string;
  private baseUrl = 'https://api.resend.com';
  
  constructor() {
    const env = Environment.get();
    this.apiKey = env.RESEND_API_KEY;
    this.defaultFrom = env.EMAIL_FROM;
  }
  
  async send(options: MailOptions): Promise<MailResult> {
    const from = options.from || this.defaultFrom;
    
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
          cc: options.cc,
          bcc: options.bcc,
          attachments: options.attachments?.map((att) => ({
            filename: att.filename,
            content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
            content_type: att.contentType,
          })),
          tags: options.tags,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json() as any;
        logger.error('Mail send failed', new Error(error.message || 'Unknown error'), {
          to: options.to,
          subject: options.subject,
        });
        
        return {
          id: '',
          success: false,
          error: error.message || 'Failed to send email',
        };
      }
      
      const data = await response.json() as any;
      
      logger.info('Mail sent successfully', {
        id: data.id,
        to: options.to,
        subject: options.subject,
      });
      
      return {
        id: data.id,
        success: true,
      };
    } catch (error) {
      logger.error('Mail send error', error, {
        to: options.to,
        subject: options.subject,
      });
      
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  async sendTemplate(
    templateName: string,
    to: string | string[],
    data: Record<string, unknown>,
    options?: Partial<MailOptions>
  ): Promise<MailResult> {
    // Templates disponibles
    const templates: Record<string, (data: any) => { subject: string; html: string }> = {
      welcome: (data) => ({
        subject: 'Welcome to Peage! 🚀',
        html: this.welcomeTemplate(data),
      }),
      'verify-email': (data) => ({
        subject: 'Verify your email — Peage',
        html: this.verifyEmailTemplate(data),
      }),
      'reset-password': (data) => ({
        subject: 'Reset your password — Peage',
        html: this.resetPasswordTemplate(data),
      }),
      'withdrawal-request': (data) => ({
        subject: 'Withdrawal Request Received',
        html: this.withdrawalTemplate(data),
      }),
      'payment-received': (data) => ({
        subject: 'Payment Received! 💰',
        html: this.paymentTemplate(data),
      }),
    };
    
    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }
    
    const { subject, html } = template(data);
    
    return this.send({
      to,
      subject,
      html,
      ...options,
    });
  }
  
  // ─── Templates ───────────────────────────────────────
  
  private welcomeTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <div style="width: 60px; height: 60px; background: #6366f1; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 28px; font-weight: bold;">P</span>
          </div>
        </div>
        <h1 style="color: #1f2937; text-align: center;">Welcome to Peage, ${data.username}!</h1>
        <p style="color: #4b5563; font-size: 16px; text-align: center;">
          Your account has been created successfully. Start shortening links and earning money!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardUrl || 'https://shortlink-7qt.pages.dev/dashboard'}" 
             style="background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        ${data.verificationLink ? `
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Please verify your email: <a href="${data.verificationLink}" style="color: #6366f1;">Verify Email</a>
        </p>` : ''}
      </body>
      </html>
    `;
  }
  
  private verifyEmailTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1f2937;">Verify your email</h1>
        <p style="color: #4b5563; font-size: 16px;">
          Click the button below to verify your email address. This link expires in 1 hour.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationLink}" 
             style="background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Verify Email
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">
          If you didn't create this account, please ignore this email.
        </p>
      </body>
      </html>
    `;
  }
  
  private resetPasswordTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1f2937;">Reset your password</h1>
        <p style="color: #4b5563; font-size: 16px;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetLink}" 
             style="background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">
          This link expires in 1 hour. If you didn't request this, please ignore.
        </p>
      </body>
      </html>
    `;
  }
  
  private withdrawalTemplate(data: any): string {
    const statusColors: Record<string, string> = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      completed: '#10b981',
      rejected: '#ef4444',
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1f2937;">Withdrawal ${data.status}</h1>
        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p><strong>Amount:</strong> $${data.amount?.toFixed(2)}</p>
          <p><strong>Method:</strong> ${data.method}</p>
          <p><strong>Status:</strong> 
            <span style="color: ${statusColors[data.status] || '#000'}; font-weight: bold;">
              ${data.status?.toUpperCase()}
            </span>
          </p>
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
      </body>
      </html>
    `;
  }
  
  private paymentTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981;">Payment Received! 🎉</h1>
        <p style="color: #4b5563; font-size: 16px;">
          You just earned <strong>$${data.amount?.toFixed(2)}</strong> from <strong>${data.source}</strong>!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardUrl || 'https://shortlink-7qt.pages.dev/dashboard'}" 
             style="background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            View Dashboard
          </a>
        </div>
      </body>
      </html>
    `;
  }
}

// Singleton
let mailServiceInstance: MailService | null = null;

export function getMailService(): MailService {
  if (!mailServiceInstance) {
    mailServiceInstance = new MailService();
  }
  return mailServiceInstance;
}
