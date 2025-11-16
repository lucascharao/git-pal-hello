// Validação e sanitização de inputs
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Remove caracteres potencialmente perigosos
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Valida e sanitiza email
export function validateEmail(email: string): string {
  const sanitized = sanitizeString(email).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new ValidationError('Invalid email format');
  }
  
  if (sanitized.length > 255) {
    throw new ValidationError('Email too long');
  }
  
  return sanitized;
}

// Valida strings com limite de tamanho
export function validateString(
  input: string,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 1000
): string {
  const sanitized = sanitizeString(input);
  
  if (sanitized.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`);
  }
  
  if (sanitized.length > maxLength) {
    throw new ValidationError(`${fieldName} must be less than ${maxLength} characters`);
  }
  
  return sanitized;
}

// Valida números
export function validateNumber(
  input: any,
  fieldName: string,
  min?: number,
  max?: number
): number {
  const num = Number(input);
  
  if (isNaN(num) || !isFinite(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  
  if (min !== undefined && num < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }
  
  if (max !== undefined && num > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }
  
  return num;
}

// Valida UUID
export function validateUUID(input: string, fieldName: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(input)) {
    throw new ValidationError(`${fieldName} must be a valid UUID`);
  }
  
  return input.toLowerCase();
}

// Previne SQL Injection em queries dinâmicas (usar com cuidado, preferir prepared statements)
export function escapeSQL(input: string): string {
  return input.replace(/'/g, "''");
}
