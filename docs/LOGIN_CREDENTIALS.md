# Login Credentials - How to Access the System

## 🔐 Available Test Accounts

### Admin Account (Full Access)
```
Email:    admin@arcus.local
Password: Admin@123456
Role:     Admin (Full System Access)
```

**Features:**
- Can create users, roles, and manage everything
- Can view all users and their permissions
- Can edit any user profile
- Can access settings and configuration
- Full RBAC admin capabilities

---

### Regular User Account (Limited Access)
```
Email:    john.doe@example.com
Password: UserPassword123!
Role:     sales_manager
```

**Features:**
- Can view sales leads
- Can create sales leads
- Can view sales opportunities
- **Cannot:** Manage users or roles
- **Cannot:** Access system settings
- **Cannot:** View other users' data

---

## 🌐 How to Login

### Via Web Application

1. **Navigate to the application:**
   ```
   http://localhost:3000
   ```

2. **Click "Sign In" button** (usually top right)

3. **Enter credentials:**
   - Email: `admin@arcus.local` (or `john.doe@example.com`)
   - Password: `Admin@123456` (or `UserPassword123!`)

4. **Click "Sign In"**

5. **You'll be redirected to the dashboard**

### Via API (Curl/Postman)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@arcus.local",
    "password": "Admin@123456"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "admin@arcus.local",
    "name": "Admin User"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsImtpZCI6Im...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsImtpZCI6Im..."
}
```

---

## 📝 Create New Test Users

Every time you run the test script, a **new test user** is created with a **unique email**:

```
Email:    test.user+[TIMESTAMP]@example.com
Password: UserPassword123!
Example:  test.user+20251029032918@example.com
```

The timestamp is automatically generated so each test run creates a unique user.

---

## 🔑 Password Format

### How Passwords Are Generated

All newly created user passwords follow this format:
- **Length:** 16 characters
- **Contains:**
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&*)

### Example Generated Passwords
```
K7mP$9xQrL2nW@5y
B2qX@7mKp$9wL5r
H8vF!2nGx$4cQ9j
```

---

## 📋 What Each User Can Do

### Admin User (`admin@arcus.local`)

✅ **Can Do:**
- Create new users
- Create new roles
- Assign roles to users
- Edit user profiles
- Delete users
- View all users and roles
- Access all dashboard features
- Manage system settings
- Configure permissions

### Sales Manager User (`john.doe@example.com`)

✅ **Can Do:**
- View sales leads
- Create new sales leads
- View sales opportunities
- View their own profile
- Change their own password

❌ **Cannot Do:**
- Create or manage users
- Create or manage roles
- View other users' data
- Access system settings
- Manage permissions

---

## 🧪 Test Flow

### Running the Complete Test

```powershell
cd "c:\Users\saksh\OneDrive\Desktop\Bobs_Firebase"
powershell.exe -ExecutionPolicy Bypass -File "test-api-clean.ps1"
```

This will:

1. ✅ Login as `admin@arcus.local` / `Admin@123456`
2. ✅ Create a new `sales_manager` role
3. ✅ Create a new test user with `test.user+[timestamp]@example.com`
4. ✅ Assign the `sales_manager` role to the test user
5. ✅ Login as the new test user
6. ✅ Verify permissions

---

## 🔄 Getting New Credentials

### After Test Run

After running `test-api-clean.ps1`, you get new credentials:

1. **New Test User Email** (appears in console output):
   ```
   test.user+20251029032918@example.com
   ```

2. **Password** (always the same):
   ```
   UserPassword123!
   ```

3. **Admin Still Works**:
   ```
   admin@arcus.local / Admin@123456
   ```

### Manual User Creation

To create a new user manually:

1. Login as admin: `admin@arcus.local`
2. Go to **Dashboard → Users**
3. Click **"Create New User"**
4. Enter email and name
5. Click **"Generate Password"**
6. System generates a secure 16-char password
7. Select a role
8. Click **"Create"**
9. Share the generated password with the user

---

## 🛡️ Security Notes

### Admin Account
- **Never share** with anyone unless needed
- Only for system administrators
- Has access to everything

### User Accounts
- Each user should have their own account
- Passwords are auto-generated and sent once
- Users should change password on first login (if you implement this)
- Permissions are role-based and enforced on backend

### Password Rules
- Minimum 8 characters (we generate 16 for extra security)
- Must include: uppercase, lowercase, numbers, special chars
- Never reuse weak passwords
- Generated passwords are cryptographically secure random

---

## 🐛 Troubleshooting

### Can't Login?

**Check:**
1. Is the development server running? 
   ```
   npm run dev
   ```

2. Are you using the correct credentials?
   - Admin: `admin@arcus.local` / `Admin@123456`
   - Test User: `john.doe@example.com` / `UserPassword123!`

3. Did you copy the password correctly (check for extra spaces)?

4. Did the user get created? Check database:
   ```sql
   SELECT * FROM users WHERE email = 'john.doe@example.com';
   ```

### Can't Create Users?

**Check:**
1. Are you logged in as admin?
2. Do you have the "Create Users" permission?
3. Is the database connection working?

### Password Not Generating?

**Solution:**
1. Make sure `src/lib/password-generator.ts` exists
2. Clear browser cache and reload
3. Check browser console for errors

---

## 📚 Related Documentation

- **Password Management:** `docs/PASSWORD_MANAGEMENT.md`
- **Roles & Permissions:** `docs/PERMISSION_SYSTEM_DOCUMENTATION.md`
- **System Architecture:** `docs/ARCHITECTURE.md`
- **Setup Guide:** `docs/DEV_ENV_SETUP.md`

---

## Summary Table

| Account | Email | Password | Role | Access Level |
|---------|-------|----------|------|--------------|
| Admin | `admin@arcus.local` | `Admin@123456` | Admin | 🔓 Full |
| Test User | `john.doe@example.com` | `UserPassword123!` | Sales Manager | 🔒 Limited |
| Dynamic Test | `test.user+[ts]@example.com` | `UserPassword123!` | Sales Manager | 🔒 Limited |

---

## 🚀 Next Steps

1. ✅ Start dev server: `npm run dev`
2. ✅ Go to `http://localhost:3000`
3. ✅ Login with admin credentials
4. ✅ Navigate to Users → Create User
5. ✅ Share password with new user
6. ✅ New user logs in with their credentials

**Ready to login?** Use any of the credentials above! 🎉
