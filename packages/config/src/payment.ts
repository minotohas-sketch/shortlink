export const paymentConfig = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
    mode: (process.env.PAYPAL_MODE || 'sandbox') as 'sandbox' | 'live',
  },
  
  withdrawalMethods: [
    {
      id: 'paypal',
      name: 'PayPal',
      fee: 0,
      feePercent: 0,
      minAmount: 10,
      maxAmount: 5000,
      processingDays: '1-3 business days',
      currency: 'USD',
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      fee: 2,
      feePercent: 0,
      minAmount: 50,
      maxAmount: 10000,
      processingDays: '3-5 business days',
      currency: 'USD',
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency (USDT)',
      fee: 0,
      feePercent: 0,
      minAmount: 25,
      maxAmount: 5000,
      processingDays: '1-2 business days',
      currency: 'USDT',
    },
  ],
  
  currency: 'USD',
  currencySymbol: '$',
  decimalPlaces: 2,
} as const;
