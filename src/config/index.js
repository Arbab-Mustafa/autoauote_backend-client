/**
 * Configuration for Redis cache
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  ttl: 600 // Cache TTL in seconds (10 minutes)
};

/**
 * Configuration for provider APIs
 */
const providerConfig = {
  // Default timeout for provider API requests in milliseconds
  requestTimeout: 5000,
  
  // Default provider configurations
  providers: {
    providerA: {
      name: 'Provider A',
      baseUrl: process.env.PROVIDER_A_URL || 'https://api.provider-a.example.com',
      apiKey: process.env.PROVIDER_A_KEY || 'demo_key',
      products: ['vsc', 'gap'],
      markup: 1.2, // 20% markup
      priority: 1
    },
    providerB: {
      name: 'Provider B',
      baseUrl: process.env.PROVIDER_B_URL || 'https://api.provider-b.example.com',
      apiKey: process.env.PROVIDER_B_KEY || 'demo_key',
      products: ['vsc', 'tire', 'dent'],
      markup: 1.15, // 15% markup
      priority: 2
    },
    providerC: {
      name: 'Provider C',
      baseUrl: process.env.PROVIDER_C_URL || 'https://api.provider-c.example.com',
      apiKey: process.env.PROVIDER_C_KEY || 'demo_key',
      products: ['gap'],
      markup: 1.25, // 25% markup
      priority: 3
    },
    providerD: {
      name: 'Provider D',
      baseUrl: process.env.PROVIDER_D_URL || 'https://api.provider-d.example.com',
      apiKey: process.env.PROVIDER_D_KEY || 'demo_key',
      products: ['tire', 'dent'],
      markup: 1.3, // 30% markup
      priority: 4
    }
  }
};

/**
 * Configuration for state restrictions
 */
const stateRestrictions = {
  gap: ['NY', 'CA'], // States where GAP is restricted
  vsc: [] // No state restrictions for VSC
};

/**
 * Configuration for API rate limits
 */
const rateLimits = {
  quotes: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per 15 minutes
  },
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50 // 50 requests per 15 minutes
  }
};

module.exports = {
  redisConfig,
  providerConfig,
  stateRestrictions,
  rateLimits
};
