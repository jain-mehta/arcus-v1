# 🔐 Password Management Guide

## New Password Generation System

We've implemented a **secure password generator** that ensures all generated passwords meet Supabase authentication requirements.

---

## 📋 Password Requirements

✅ **Minimum 8 characters** (we generate 16 by default for extra security)
✅ **At least one uppercase letter** (A-Z)
✅ **At least one lowercase letter** (a-z)  
✅ **At least one number** (0-9)
✅ **At least one special character** (!@#$%^&*-_=+)

### Examples of Valid Passwords:
- ✅ `K7mP$9xQrL2nW@5y` (Generated)
- ✅ `Admin@123456` (Manual)
- ✅ `UserPassword123!` (Manual)
- ✅ `SecurePass@2025` (Manual)

### Examples of Invalid Passwords:
- ❌ `password` (no uppercase, numbers, or special chars)
- ❌ `Pass123` (no special characters)
- ❌ `Pass!` (less than 8 characters)
- ❌ `ONLYUPPERCASE123!` (no lowercase)

---

## 🛠️ How to Generate Passwords

### Option 1: Auto-Generated Password (Recommended)

When creating a new user via the dashboard, click **"Generate"** button:

```
┌─────────────────────────────────┐
│ Password                     [👁️] │
│ [___________________]  [Generate] │
│                                 │
│ A secure random password has    │
│ been generated.                 │
└─────────────────────────────────┘
```

**Result**: A 16-character strong password is generated automatically.

### Option 2: Manual Password

Enter your own password (must meet requirements):

```
Requirements:
✅ Minimum 8 characters
✅ Uppercase letter (A-Z)
✅ Lowercase letter (a-z)
✅ Number (0-9)
✅ Special character (!@#$%^&*-_=+)
```

### Option 3: API Password Creation

When using `POST /api/admin/users`, provide a password:

```json
{
  "email": "user@example.com",
  "password": "YourSecurePassword123!",
  "fullName": "John Doe",
  "roleIds": ["role-id"]
}
```

---

## 🔄 Password Flow

### Creating a User

```
1. Admin clicks "Create User"
   ↓
2. Enter Name, Email, Role
   ↓
3. Choose: [Generate Password] OR [Manual Password]
   ↓
4. Click "Create User"
   ↓
5. Password is sent to API
   ↓
6. Supabase Auth validates & hashes password
   ↓
7. User can now login with: email + password
```

### User Login

```
1. User enters email & password
   ↓
2. POST /api/auth/login
   ↓
3. Supabase verifies hashed password
   ↓
4. Session token issued
   ↓
5. User logged in ✅
```

---

## 📊 Current Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@arcus.local` | `Admin@123456` |

**To test with generated users**:
```powershell
# Run test script
powershell -ExecutionPolicy Bypass -File test-api-clean.ps1

# Creates user with auto-generated password like:
# test.user+20251029030714@example.com | UserPassword123!
```

---

## 🛡️ Security Best Practices

### For Admins Creating Users:
1. ✅ Always use "Generate" to create strong passwords
2. ✅ Share new user password **securely** (encrypted email, 1:1)
3. ✅ Never send passwords in plain text chat
4. ✅ Require users to change password on first login

### For New Users:
1. ✅ Save your password securely (password manager recommended)
2. ✅ Never share password with anyone
3. ✅ Change password immediately if compromised
4. ✅ Use unique passwords for different systems

### Password Reset:
If a user forgets their password:
```
1. Click "Forgot Password" on login page
2. Enter email address
3. Check email for reset link
4. Create new password
5. Login with new password
```

---

## 🔍 Verify Password in Database

```sql
-- Check that user exists in auth system
SELECT id, email, created_at FROM auth.users WHERE email = 'user@example.com';

-- Check user profile exists
SELECT id, email, name FROM public.users WHERE email = 'user@example.com';

-- Note: Passwords are NEVER stored in the database readable form
-- They are hashed by Supabase Auth using bcrypt
```

---

## 📝 API Reference

### Create User with Password

**Endpoint**: `POST /api/admin/users`

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass@2025",
  "fullName": "Jane Smith",
  "phone": "+1234567890",
  "roleIds": ["role-uuid"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "newuser@example.com",
    "name": "Jane Smith"
  },
  "message": "User created successfully"
}
```

### Login with Password

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass@2025"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "newuser@example.com"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "refresh_token...",
  "message": "Logged in successfully"
}
```

---

## 🚨 Troubleshooting

### Error: "Invalid password format"
**Cause**: Password doesn't meet requirements
**Fix**: Ensure password has uppercase, lowercase, number, AND special character

### Error: "Invalid login credentials"
**Cause**: Password is correct in database but login fails
**Fix**: 
1. Check that password was sent correctly (no spaces/encoding issues)
2. Verify email is correct
3. Ensure user account is active

### Error: "User already exists"
**Cause**: Email is already registered
**Fix**: Use a different email or reset password if user forgot it

---

## 📞 Support

For password-related issues:
1. Check requirements above
2. Use "Generate" button for automatic strong passwords
3. Verify passwords match on both creation and login
4. Contact admin if account is locked

**Generated passwords are always strong and secure!** ✅

---

## 📚 Related Files

- 🔑 Password generator: `src/lib/password-generator.ts`
- 👥 User creation: `src/app/dashboard/users/actions.ts`
- 🎨 UI component: `src/app/dashboard/users/improved-users-client.tsx`
- 🔐 Auth API: `src/app/api/auth/login/route.ts`
