// Headers de segurança conforme OWASP (sem CSP — gerenciado no frontend)
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export function addSecurityHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    ...headers,
  };
}
