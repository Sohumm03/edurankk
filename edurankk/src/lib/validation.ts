// ── Student Validation Rules ──

/**
 * Username must contain only numeric digits (0–9).
 * Alphabets, spaces, special characters, emojis, and punctuation are not allowed.
 */
export const USERNAME_REGEX = /^[0-9]+$/;

export interface ValidationResult {
  isValid: boolean;
  error: string;
}

export function validateUsername(username: string): ValidationResult {
  if (!username || !username.trim()) {
    return { isValid: false, error: "Moodle ID is required." };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { isValid: false, error: "Moodle ID must contain numbers only (0–9)." };
  }
  return { isValid: true, error: "" };
}

/**
 * Password requirements:
 * - At least 8 characters
 * - At least one uppercase letter (A–Z)
 * - At least one lowercase letter (a–z)
 * - At least one number (0–9)
 * - At least one special character (such as @, #, $, or !)
 * Note: Never log or expose raw passwords in errors or console.
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: "Password is required." };
  }
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter (A–Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter (a–z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number (0–9)." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one special character (such as @, #, $, or !)." };
  }
  return { isValid: true, error: "" };
}
