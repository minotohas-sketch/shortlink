export const apiConfig = {
  baseUrl: process.env.API_URL || 'https://api.peage.io',
  
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    maxAge: 86400,
    credentials: true,
  },
  
  rateLimit: {
    global: {
      windowMs: 60_000,
      max: parseInt(process.env.RATE_LIMIT_GLOBAL || '1000'),
    },
    auth: {
      windowMs: 60_000,
      max: parseInt(process.env.RATE_LIMIT_AUTH || '10'),
    },
    api: {
      windowMs: 60_000,
      max: parseInt(process.env.RATE_LIMIT_API || '100'),
    },
  },
  
  timeout: 30_000, // 30 secondes
  
  bodyLimit: {
    json: '1mb',
    form: '10mb',
  },
} as const;
