/**
 * Input sanitization utilities for form data.
 * Strips HTML tags, XSS vectors, and dangerous patterns.
 * No external dependencies required.
 */

/**
 * Strip HTML tags and common XSS attack vectors from text input.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')             // Strip HTML tags
    .replace(/javascript\s*:/gi, '')     // Strip JavaScript protocol
    .replace(/on\w+\s*=/gi, '')          // Strip inline event handlers (onclick=, onerror=, etc.)
    .replace(/data\s*:/gi, '')           // Strip data: URIs
    .replace(/vbscript\s*:/gi, '')       // Strip VBScript protocol
    .replace(/expression\s*\(/gi, '')    // Strip CSS expressions
    .trim();
}

/**
 * Sanitize all string fields in a data object.
 * Non-string fields are passed through unchanged.
 */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeText(sanitized[key]);
    }
  }
  return sanitized;
}

/**
 * Validate email format (basic check, not exhaustive).
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
