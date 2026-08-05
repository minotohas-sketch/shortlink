import { Environment } from '../../../core/env';
import { Logger } from '../../../core/logger';
import { BadRequestError } from '../../../utils/errors';

const logger = new Logger('StripeProvider');

interface StripePaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export async function createPaymentIntent(
  amount: number,
  currency = 'USD',
  metadata?: Record<string, string>
): Promise<StripePaymentIntent> {
  const secretKey = Environment.get().STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('Stripe secret key not configured');
  }
  
  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: String(Math.round(amount * 100)), // Stripe utilise les cents
      currency,
      ...(metadata ? { 'metadata[order_id]': metadata.orderId || '' } : {}),
    }).toString(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    logger.error('Stripe payment intent creation failed', new Error(JSON.stringify(error)));
    throw new BadRequestError('Payment processing failed', 'STRIPE_ERROR');
  }
  
  const data = await response.json() as any;
  
  return {
    id: data.id,
    clientSecret: data.client_secret,
    amount: data.amount / 100,
    currency: data.currency,
    status: data.status,
  };
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  const webhookSecret = Environment.get().STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    logger.warn('Stripe webhook secret not configured');
    return false;
  }
  
  // TODO: Implémenter la vérification HMAC
  // Stripe utilise HMAC-SHA256 pour les signatures
  return true;
}
