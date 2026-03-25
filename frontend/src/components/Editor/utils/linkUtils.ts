/**
 * URL validation utility for link insertion.
 * Ensures URLs are safe (no javascript:, data:, or invalid URLs) to prevent XSS attacks.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a URL for use in link nodes.
 *
 * @param url - The URL to validate
 * @returns ValidationResult with valid=true if URL is safe, or valid=false with error message
 */
export function validateUrl(url: string): ValidationResult {
  // Reject empty strings
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  // Trim whitespace before validation
  const trimmedUrl = url.trim();

  // Reject URLs with leading/trailing whitespace
  if (url !== trimmedUrl) {
    return { valid: false, error: 'URL cannot have leading or trailing whitespace' };
  }

  // Reject javascript: URLs (case-insensitive check)
  const lowerUrl = trimmedUrl.toLowerCase();
  if (lowerUrl.startsWith('javascript:')) {
    return { valid: false, error: 'JavaScript URLs are not allowed' };
  }

  // Reject data: URLs
  if (lowerUrl.startsWith('data:')) {
    return { valid: false, error: 'Data URLs are not allowed' };
  }

  // Reject URLs without protocol (must start with http:// or https://)
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }

  // Accept valid http/https URLs
  return { valid: true };
}
