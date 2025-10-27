import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeHTML,
  sanitizeSQL,
  sanitizeFileName,
  sanitizeJSON,
  emailSchema,
  phoneSchema,
  uuidSchema,
  slugSchema,
  nameSchema,
  vendorSchema,
  productSchema,
  validateBody,
  formatValidationErrors,
} from '@/lib/validation';

describe('Validation Library', () => {
  // ================================================================================
  // SANITIZATION TESTS
  // ================================================================================
  
  describe('sanitizeString', () => {
    it('should remove null bytes', () => {
      const input = 'test\0string';
      const result = sanitizeString(input);
      expect(result).toBe('teststring');
    });
    
    it('should remove control characters', () => {
      const input = 'test\x01\x02string';
      const result = sanitizeString(input);
      expect(result).toBe('teststring');
    });
    
    it('should remove script tags', () => {
      const input = 'test<script>alert("xss")</script>string';
      const result = sanitizeString(input);
      expect(result).toBe('teststring');
    });
    
    it('should remove iframe tags', () => {
      const input = 'test<iframe src="evil.com"></iframe>string';
      const result = sanitizeString(input);
      expect(result).toBe('teststring');
    });
    
    it('should trim whitespace', () => {
      const input = '  test string  ';
      const result = sanitizeString(input);
      expect(result).toBe('test string');
    });
  });
  
  describe('sanitizeHTML', () => {
    it('should allow safe tags', () => {
      const input = '<p>This is <strong>bold</strong> text</p>';
      const result = sanitizeHTML(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });
    
    it('should remove dangerous tags', () => {
      const input = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>');
    });
    
    it('should respect custom allowed tags', () => {
      const input = '<div><p>Test</p></div>';
      const result = sanitizeHTML(input, ['div']);
      expect(result).toContain('<div>');
      expect(result).not.toContain('<p>');
    });
  });
  
  describe('sanitizeSQL', () => {
    it('should escape single quotes', () => {
      const input = "O'Brien";
      const result = sanitizeSQL(input);
      expect(result).toBe("O''Brien");
    });
    
    it('should remove semicolons', () => {
      const input = 'test; DROP TABLE users;';
      const result = sanitizeSQL(input);
      expect(result).not.toContain(';');
    });
    
    it('should remove SQL comments', () => {
      const input = 'test -- comment';
      const result = sanitizeSQL(input);
      expect(result).not.toContain('--');
    });
  });
  
  describe('sanitizeFileName', () => {
    it('should remove path traversal attempts', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFileName(input);
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });
    
    it('should replace special characters with underscores', () => {
      const input = 'my file!@#.pdf';
      const result = sanitizeFileName(input);
      expect(result).toBe('my_file___.pdf');
    });
    
    it('should preserve valid characters', () => {
      const input = 'valid-file_name.txt';
      const result = sanitizeFileName(input);
      expect(result).toBe('valid-file_name.txt');
    });
  });
  
  describe('sanitizeJSON', () => {
    it('should parse valid JSON', () => {
      const input = '{"name": "test", "value": 123}';
      const result = sanitizeJSON(input);
      expect(result).toEqual({ name: 'test', value: 123 });
    });
    
    it('should remove __proto__ to prevent prototype pollution', () => {
      const input = '{"name": "test", "__proto__": {"isAdmin": true}}';
      const result = sanitizeJSON(input);
      expect(result).toHaveProperty('name');
      expect(result).not.toHaveProperty('__proto__');
    });
    
    it('should return null for invalid JSON', () => {
      const input = '{invalid json}';
      const result = sanitizeJSON(input);
      expect(result).toBeNull();
    });
  });
  
  // ================================================================================
  // SCHEMA VALIDATION TESTS
  // ================================================================================
  
  describe('emailSchema', () => {
    it('should validate correct email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });
    
    it('should lowercase and trim email', () => {
      const result = emailSchema.safeParse('  TEST@EXAMPLE.COM  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });
    
    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('not-an-email');
      expect(result.success).toBe(false);
    });
    
    it('should reject empty email', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });
  
  describe('phoneSchema', () => {
    it('should validate international phone number', () => {
      const result = phoneSchema.safeParse('+14155552671');
      expect(result.success).toBe(true);
    });
    
    it('should allow optional phone', () => {
      const result = phoneSchema.safeParse('');
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid phone', () => {
      const result = phoneSchema.safeParse('123');
      expect(result.success).toBe(false);
    });
  });
  
  describe('uuidSchema', () => {
    it('should validate valid UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = uuidSchema.safeParse(uuid);
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid UUID', () => {
      const result = uuidSchema.safeParse('not-a-uuid');
      expect(result.success).toBe(false);
    });
  });
  
  describe('slugSchema', () => {
    it('should validate valid slug', () => {
      const result = slugSchema.safeParse('my-test-slug');
      expect(result.success).toBe(true);
    });
    
    it('should lowercase slug', () => {
      const result = slugSchema.safeParse('My-Test-SLUG');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('my-test-slug');
      }
    });
    
    it('should reject slug with spaces', () => {
      const result = slugSchema.safeParse('my test slug');
      expect(result.success).toBe(false);
    });
    
    it('should reject slug with special characters', () => {
      const result = slugSchema.safeParse('my_test_slug!');
      expect(result.success).toBe(false);
    });
  });
  
  describe('nameSchema', () => {
    it('should validate valid name', () => {
      const result = nameSchema.safeParse('John Doe');
      expect(result.success).toBe(true);
    });
    
    it('should allow hyphens and apostrophes', () => {
      const result = nameSchema.safeParse("Mary-Jane O'Brien");
      expect(result.success).toBe(true);
    });
    
    it('should reject names with dangerous characters', () => {
      const result = nameSchema.safeParse('John<script>');
      expect(result.success).toBe(false);
    });
  });
  
  // ================================================================================
  // BUSINESS ENTITY VALIDATION TESTS
  // ================================================================================
  
  describe('vendorSchema', () => {
    it('should validate complete vendor object', () => {
      const vendor = {
        code: 'VEN-001',
        name: 'Test Vendor',
        email: 'vendor@example.com',
        phone: '+14155552671',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zip_code: '94105',
        status: 'active' as const,
        rating: 4.5,
        payment_terms: 'Net 30',
        metadata: { industry: 'tech' },
      };
      
      const result = vendorSchema.safeParse(vendor);
      expect(result.success).toBe(true);
    });
    
    it('should validate minimal vendor object', () => {
      const vendor = {
        code: 'VEN-002',
        name: 'Minimal Vendor',
        status: 'active' as const,
      };
      
      const result = vendorSchema.safeParse(vendor);
      expect(result.success).toBe(true);
    });
    
    it('should reject vendor with invalid code', () => {
      const vendor = {
        code: 'ven-001', // lowercase not allowed
        name: 'Test Vendor',
        status: 'active' as const,
      };
      
      const result = vendorSchema.safeParse(vendor);
      expect(result.success).toBe(false);
    });
    
    it('should reject vendor with invalid status', () => {
      const vendor = {
        code: 'VEN-001',
        name: 'Test Vendor',
        status: 'invalid-status',
      };
      
      const result = vendorSchema.safeParse(vendor);
      expect(result.success).toBe(false);
    });
  });
  
  describe('productSchema', () => {
    it('should validate complete product object', () => {
      const product = {
        sku: 'PROD-001',
        name: 'Test Product',
        category: 'Electronics',
        description: 'A test product',
        unit_price: 99.99,
        tax_rate: 10,
        status: 'active' as const,
        reorder_level: 10,
        stock_qty: 100,
        metadata: { weight: 1.5 },
      };
      
      const result = productSchema.safeParse(product);
      expect(result.success).toBe(true);
    });
    
    it('should reject product with invalid SKU', () => {
      const product = {
        sku: 'prod-001', // lowercase not allowed
        name: 'Test Product',
        unit_price: 99.99,
        status: 'active' as const,
      };
      
      const result = productSchema.safeParse(product);
      expect(result.success).toBe(false);
    });
    
    it('should reject product with negative price', () => {
      const product = {
        sku: 'PROD-001',
        name: 'Test Product',
        unit_price: -10,
        status: 'active' as const,
      };
      
      const result = productSchema.safeParse(product);
      expect(result.success).toBe(false);
    });
  });
  
  // ================================================================================
  // VALIDATION HELPER TESTS
  // ================================================================================
  
  describe('validateBody', () => {
    it('should return success for valid body', async () => {
      const body = { email: 'test@example.com' };
      const result = await validateBody(body, emailSchema);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });
    
    it('should return errors for invalid body', async () => {
      const body = { email: 'invalid' };
      const result = await validateBody(body, emailSchema);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
      }
    });
  });
  
  describe('formatValidationErrors', () => {
    it('should format Zod errors correctly', async () => {
      const body = {
        code: 'invalid-code',
        name: '',
        status: 'invalid',
      };
      
      const result = vendorSchema.safeParse(body);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const formatted = formatValidationErrors(result.error);
        expect(formatted).toBeDefined();
        expect(Object.keys(formatted).length).toBeGreaterThan(0);
      }
    });
  });
});

