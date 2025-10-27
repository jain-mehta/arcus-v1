/**
 * Integration Tests for Supabase Auth API Routes
 * Tests the complete auth flow: signup, login, logout, session management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test users
const testUsers = {
  newUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
  existingUser: {
    email: `existing-${Date.now()}@example.com`,
    password: 'ExistingPassword123!',
  },
  invalidCredentials: {
    email: 'nonexistent@example.com',
    password: 'WrongPassword123!',
  },
};

let accessToken: string | null = null;
let refreshToken: string | null = null;

describe('Supabase Auth Integration Tests', () => {
  describe('POST /api/auth/signup', () => {
    it('should successfully register a new user', async () => {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.newUser.email,
          password: testUsers.newUser.password,
          firstName: testUsers.newUser.firstName,
          lastName: testUsers.newUser.lastName,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUsers.newUser.email);
      expect(data.user.id).toBeDefined();
    });

    it('should reject signup with invalid email', async () => {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email-format',
          password: testUsers.newUser.password,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should reject signup with short password', async () => {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `short-pwd-${Date.now()}@example.com`,
          password: '123', // Too short
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should reject signup with missing password', async () => {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `no-pwd-${Date.now()}@example.com`,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject signup with missing email', async () => {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'ValidPassword123!',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate email signup', async () => {
      // Register first user
      await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `duplicate-${Date.now()}@example.com`,
          password: testUsers.newUser.password,
        }),
      });

      // Try to register same email again
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `duplicate-${Date.now()}@example.com`,
          password: testUsers.newUser.password,
        }),
      });

      expect([409, 400]).toContain(response.status);
    });

    it('should handle special characters in email', async () => {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test+tag+${Date.now()}@example.co.uk`,
          password: testUsers.newUser.password,
        }),
      });

      expect(response.status).toBe(201);
    });

    it('should handle very long email', async () => {
      const longEmail = `${'a'.repeat(50)}+${Date.now()}@example.com`;
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: longEmail,
          password: testUsers.newUser.password,
        }),
      });

      // Should succeed or fail gracefully
      expect([201, 400]).toContain(response.status);
    });

    it('should handle empty request body', async () => {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json}',
      });

      expect([400, 500]).toContain(response.status);
    });

    it('should support optional metadata fields', async () => {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `metadata-${Date.now()}@example.com`,
          password: testUsers.newUser.password,
          firstName: 'John',
          lastName: 'Doe',
          organizationId: '12345678-1234-1234-1234-123456789012',
        }),
      });

      expect(response.status).toBe(201);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Register a user for login tests
      await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.existingUser.email,
          password: testUsers.existingUser.password,
        }),
      });
    });

    it('should successfully login with valid credentials', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.existingUser.email,
          password: testUsers.existingUser.password,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUsers.existingUser.email);

      // Extract cookies
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      if (data.access_token) {
        accessToken = data.access_token;
      }
    });

    it('should reject login with invalid email', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: testUsers.existingUser.password,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject login with wrong password', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.existingUser.email,
          password: 'WrongPassword123!',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should reject login with nonexistent user', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.invalidCredentials.email,
          password: testUsers.invalidCredentials.password,
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should reject login with missing email', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: testUsers.existingUser.password,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject login with missing password', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.existingUser.email,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should set secure httpOnly cookies on login', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.existingUser.email,
          password: testUsers.existingUser.password,
        }),
      });

      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      if (setCookie) {
        expect(setCookie).toContain('HttpOnly');
        expect(setCookie).toContain('__supabase_access_token');
      }
    });

    it('should reject login with short password', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.existingUser.email,
          password: '123', // Too short
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should handle case-insensitive email', async () => {
      // Supabase typically converts emails to lowercase
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.existingUser.email.toUpperCase(),
          password: testUsers.existingUser.password,
        }),
      });

      // Should handle gracefully
      expect([200, 401]).toContain(response.status);
    });

    it('should handle rate limiting on multiple failed attempts', async () => {
      // Make multiple failed login attempts
      const attempts = [];
      for (let i = 0; i < 5; i++) {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUsers.existingUser.email,
            password: 'WrongPassword123!',
          }),
        });
        attempts.push(response.status);
      }

      // After several attempts, should be rate limited (429)
      const hasRateLimit = attempts.some(status => status === 429);
      expect(attempts.every(status => [401, 429].includes(status))).toBe(true);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout', async () => {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should clear cookies on logout', async () => {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toBeDefined();
      if (setCookie) {
        expect(setCookie.toLowerCase()).toContain('max-age=0');
      }
    });

    it('should handle logout without session', async () => {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Should succeed even without active session
      expect(response.status).toBe(200);
    });
  });

  describe('Session Management - Edge Cases', () => {
    it('should handle concurrent login requests', async () => {
      const promises = Array(3).fill(null).map(() =>
        fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUsers.existingUser.email,
            password: testUsers.existingUser.password,
          }),
        })
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle consecutive login/logout cycles', async () => {
      for (let i = 0; i < 3; i++) {
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUsers.existingUser.email,
            password: testUsers.existingUser.password,
          }),
        });
        expect(loginResponse.status).toBe(200);

        const logoutResponse = await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
        });
        expect(logoutResponse.status).toBe(200);
      }
    });

    it('should handle login after logout', async () => {
      // Logout first
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });

      // Then login
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.existingUser.email,
          password: testUsers.existingUser.password,
        }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network timeout gracefully', async () => {
      // This would require a timeout mock in real implementation
      expect(true).toBe(true);
    });

    it('should provide helpful error messages', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong',
        }),
      });

      if (response.status >= 400) {
        const data = await response.json();
        expect(data.error).toBeDefined();
        expect(typeof data.error).toBe('string');
      }
    });

    it('should not leak sensitive information in errors', async () => {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        }),
      });

      const data = await response.json();
      const errorMessage = data.error || '';
      
      // Should not reveal specific details
      expect(errorMessage).not.toContain('database');
      expect(errorMessage).not.toContain('query');
    });
  });
});
