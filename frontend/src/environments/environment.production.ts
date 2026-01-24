export const environment = {
  production: false,
  apiUrl: 'https://your-production-api.com/api',
  apiTimeout: 30000,
  wsUrl: 'wss://your-production-api.com',



  features: {
    aiGeneration: true,
    realTimeCollaboration: true,
    analytics: true,
    comments: true
  },

  // Limits
  maxDocumentSize: 5242880,
  maxFileUploadSize: 10485760,
  aiCreditsPerMonth: 1000,

  // App Info
  appName: 'ContentHub AI',
  appVersion: '1.0.0',

  // Storage
  enableLocalStorage: true,
  tokenKey: 'contenthub_token',
  userKey: 'contenthub_user',

  // Debug
  enableLogging: false,
  enableErrorReporting: true
};
