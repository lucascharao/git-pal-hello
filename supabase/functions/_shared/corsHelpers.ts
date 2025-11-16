// CORS helpers with origin validation

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://glwlvjbiamrizmxjblpi.lovableproject.com',
  'http://localhost:5173',
  'http://localhost:8081',
];

/**
 * Get CORS headers with proper origin validation
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  
  // Check if origin is in allowlist
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

/**
 * Get CORS headers for OPTIONS preflight
 */
export function getPreflightHeaders(request: Request): Record<string, string> {
  return {
    ...getCorsHeaders(request),
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}
