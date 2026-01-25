export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  apiTimeout: 30000,
  wsUrl: 'ws://localhost:3000',

  ai: {
    primaryProvider: 'groq',

    groq: {
      enabled: true,
      model: 'llama3-70b-8192',
      maxTokens: 4096,
      temperature: 0.7
    },
    huggingface: {
      enabled: true,
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      maxTokens: 2048,
      temperature: 0.7
    }
  },

  // Feature Flags
  features: {
    aiGeneration: true,
    aiImprovement: true,
    aiSummarization: true,
    aiToneChange: true,
    realTimeCollaboration: true,
    analytics: true,
    comments: true
  },

  aiLimits: {
    maxRequestsPerHour: 30,
    maxRequestsPerDay: 200,
    maxTokensPerRequest: 2048
  },

  // App Settings
  maxDocumentSize: 5242880,
  maxFileUploadSize: 10485760,

  appName: 'ContentHub AI (Dev)',
  appVersion: '1.0.0-dev',


  enableLocalStorage: true,
  tokenKey: 'contenthub_token_dev',
  userKey: 'contenthub_user_dev',


  enableLogging: true,
  enableErrorReporting: false,
  debugMode: true
};
