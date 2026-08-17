/**
 * Centralized Form & Profile Validation Rules
 */

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const sanitized = phone.replace(/[\s-]/g, '');
  // Digits with optional leading +, length 10 to 15
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(sanitized);
}

export function validateAmount(amount: string | number): boolean {
  if (amount === undefined || amount === null || amount === '') return false;
  const num = Number(amount);
  return !isNaN(num) && num > 0;
}

export function validateDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const parsed = Date.parse(dateStr);
  return !isNaN(parsed);
}

export function validateRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateField(key: string, label: string, value: unknown, rules?: { required?: boolean; type?: string }): string | null {
  const strVal = String(value || '').trim();
  if (rules?.required && !validateRequired(value)) {
    return `${label} is required.`;
  }
  if (!strVal) return null; // empty and optional

  if (rules?.type === 'email' || key.toLowerCase().includes('email')) {
    if (!validateEmail(strVal)) return `${label} must be a valid email address.`;
  }
  if (rules?.type === 'tel' || key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) {
    if (!validatePhone(strVal)) return `${label} must be digits only (10 to 15 digits).`;
  }
  if (rules?.type === 'number' || key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') || key.toLowerCase().includes('rent')) {
    if (!validateAmount(strVal)) return `${label} must be a valid positive number.`;
  }
  if (rules?.type === 'date' || key.toLowerCase().includes('date')) {
    if (!validateDate(strVal)) return `${label} must be a valid date.`;
  }

  return null;
}
