import { z } from 'zod';

/**
 * ? Input Validation & Sanitization Library
 * 
 * Provides schemas and utilities for validating and sanitizing user input
 * to prevent XSS, SQL injection, and other security vulnerabilities.
 */

// ================================================================================
// COMMON VALIDATION SCHEMAS
// ================================================================================

/**
 * Email validation with proper format checking
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform((email) => email.toLowerCase().trim());

/**
 * Phone number validation (international format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

/**
 * UUID validation (v4)
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * Slug validation (URL-safe identifiers)
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
  .transform((slug) => slug.toLowerCase().trim());

/**
 * Name validation (prevents XSS)
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name too long')
  .regex(/^[a-zA-Z0-9\s\-'.,()]+$/, 'Name contains invalid characters')
  .transform((name) => sanitizeString(name));

/**
 * Text field validation (prevents XSS)
 */
export const textSchema = z
  .string()
  .max(5000, 'Text too long')
  .transform((text) => sanitizeString(text));

/**
 * Positive integer validation
 */
export const positiveIntSchema = z
  .number()
  .int('Must be an integer')
  .positive('Must be positive');

/**
 * Non-negative integer validation (allows 0)
 */
export const nonNegativeIntSchema = z
  .number()
  .int('Must be an integer')
  .nonnegative('Must be non-negative');

/**
 * Decimal number validation (for prices, amounts)
 */
export const decimalSchema = z
  .number()
  .nonnegative('Must be non-negative')
  .multipleOf(0.01, 'Must have at most 2 decimal places');

/**
 * Date validation (ISO 8601 format)
 */
export const dateSchema = z
  .string()
  .datetime({ message: 'Invalid date format, must be ISO 8601' })
  .or(z.date());

/**
 * Enum validation helper
 */
export function enumSchema<T extends string>(values: readonly T[], name: string) {
  return z.enum(values as [T, ...T[]], {
    errorMap: () => ({ message: `${name} must be one of: ${values.join(', ')}` }),
  });
}

/**
 * Pagination parameters validation
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ================================================================================
// BUSINESS ENTITY SCHEMAS
// ================================================================================

/**
 * Vendor validation schema
 */
export const vendorSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/, 'Vendor code must be uppercase alphanumeric'),
  name: nameSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema,
  address: textSchema.optional(),
  city: nameSchema.optional(),
  state: nameSchema.optional(),
  country: nameSchema.optional(),
  zip_code: z.string().max(20).optional(),
  status: enumSchema(['active', 'inactive', 'suspended'], 'Status'),
  rating: z.number().min(0).max(5).optional(),
  payment_terms: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Product validation schema
 */
export const productSchema = z.object({
  sku: z.string().min(1).max(100).regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric'),
  name: nameSchema,
  category: nameSchema.optional(),
  description: textSchema.optional(),
  unit_price: decimalSchema,
  tax_rate: z.number().min(0).max(100).optional(),
  status: enumSchema(['active', 'inactive', 'discontinued'], 'Status'),
  reorder_level: nonNegativeIntSchema.optional(),
  stock_qty: nonNegativeIntSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Purchase Order validation schema
 */
export const purchaseOrderSchema = z.object({
  po_number: z.string().min(1).max(100),
  vendor_id: uuidSchema,
  po_date: dateSchema,
  expected_delivery: dateSchema.optional(),
  status: enumSchema(['draft', 'pending', 'approved', 'ordered', 'received', 'cancelled'], 'Status'),
  total_amount: decimalSchema,
  tax_amount: decimalSchema.optional(),
  grand_total: decimalSchema,
  notes: textSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Sales Order validation schema
 */
export const salesOrderSchema = z.object({
  so_number: z.string().min(1).max(100),
  customer_name: nameSchema,
  customer_email: emailSchema.optional().or(z.literal('')),
  customer_phone: phoneSchema,
  so_date: dateSchema,
  promised_delivery: dateSchema.optional(),
  status: enumSchema(['draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], 'Status'),
  total_amount: decimalSchema,
  tax_amount: decimalSchema.optional(),
  grand_total: decimalSchema,
  notes: textSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Employee validation schema
 */
export const employeeSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  department: nameSchema.optional(),
  designation: nameSchema.optional(),
  salary: decimalSchema.optional(),
  date_of_joining: dateSchema.optional(),
  status: enumSchema(['active', 'inactive', 'terminated'], 'Status'),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * User validation schema
 */
export const userSchema = z.object({
  email: emailSchema,
  name: nameSchema.optional(),
  role: enumSchema(['admin', 'user', 'viewer'], 'Role').optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ================================================================================
// SANITIZATION UTILITIES
// ================================================================================

/**
 * Sanitize string to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Remove potentially dangerous HTML tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    // Limit length
    .substring(0, 10000);
}

/**
 * Sanitize HTML (allow only safe tags)
 */
export function sanitizeHTML(input: string, allowedTags: string[] = []): string {
  if (!input) return '';
  
  const allowed = new Set(allowedTags.map((tag) => tag.toLowerCase()));
  const defaultAllowed = new Set(['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'a']);
  const finalAllowed = allowedTags.length > 0 ? allowed : defaultAllowed;
  
  // Remove all tags except allowed ones
  let sanitized = input.replace(/<([^>]+)>/g, (match, tag) => {
    const tagName = tag.split(/\s/)[0].toLowerCase().replace('/', '');
    return finalAllowed.has(tagName) ? match : '';
  });
  
  return sanitizeString(sanitized);
}

/**
 * Sanitize SQL input (prevent SQL injection)
 */
export function sanitizeSQL(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, ''); // Remove multi-line comment end
}

/**
 * Validate and sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  return fileName
    .trim()
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/\//g, '')
    .replace(/\\/g, '')
    // Remove special characters except dash, underscore, and dot
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Limit length
    .substring(0, 255);
}

/**
 * Validate JSON input (prevent prototype pollution)
 */
export function sanitizeJSON<T = unknown>(input: string): T | null {
  try {
    const parsed = JSON.parse(input);
    
    // Remove __proto__ and constructor to prevent prototype pollution
    if (typeof parsed === 'object' && parsed !== null) {
      delete (parsed as any).__proto__;
      delete (parsed as any).constructor;
    }
    
    return parsed as T;
  } catch {
    return null;
  }
}

// ================================================================================
// VALIDATION HELPERS
// ================================================================================

/**
 * Validate request body with Zod schema
 */
export async function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  try {
    const data = await schema.parseAsync(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod validation errors for API response
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  
  return formatted;
}

/**
 * Rate limit key sanitization
 */
export function sanitizeRateLimitKey(key: string): string {
  return key
    .replace(/[^a-zA-Z0-9:_-]/g, '_')
    .substring(0, 200);
}

// ================================================================================
// EXPORTS
// ================================================================================

export type VendorInput = z.infer<typeof vendorSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type SalesOrderInput = z.infer<typeof salesOrderSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

