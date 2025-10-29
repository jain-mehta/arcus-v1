/**
 * Password Generator Utility
 * 
 * Generates secure, random passwords that meet Supabase requirements:
 * - Minimum 8 characters
 * - Mix of uppercase, lowercase, numbers, and special characters
 * - No easily guessable patterns
 */

/**
 * Generate a secure random password
 * @param length Password length (default: 16 for strong security)
 * @returns A secure random password
 * 
 * Example: "K7mP$9xQrL2nW@5y"
 */
export function generateSecurePassword(length: number = 16): string {
  // Character sets
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*-_=+';
  
  // Ensure at least one character from each set
  const password: string[] = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  
  // Fill the rest with random characters from all sets
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < length; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  
  // Shuffle the array
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }
  
  return password.join('');
}

/**
 * Validate if a password meets requirements
 * @param password Password to validate
 * @returns { valid: boolean, errors: string[] }
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*-_=+]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*-_=+)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
