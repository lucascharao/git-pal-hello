// Rate Limiter para Edge Functions
// Previne ataques de força bruta e DDoS

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Limpa entradas antigas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): Promise<void> {
  const now = Date.now();
  const key = identifier;

  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return;
  }

  store[key].count++;

  if (store[key].count > config.maxRequests) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
    throw new RateLimitError(retryAfter);
  }
}

export function getRateLimitHeaders(identifier: string, config: RateLimitConfig): Record<string, string> {
  const entry = store[identifier];
  if (!entry) {
    return {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': config.maxRequests.toString(),
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
  };
}
