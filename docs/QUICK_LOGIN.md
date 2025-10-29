# 🎯 QUICK LOGIN GUIDE - Non-Admin Users

## Simplest Answer: How to Login as Non-Admin

### Option 1: Use the Pre-Created Test User
```
📧 Email:    john.doe@example.com
🔐 Password: UserPassword123!
👤 Role:     Sales Manager (Limited Access)
```

**Steps to Login:**
1. Go to `http://localhost:3000`
2. Click "Sign In"
3. Paste the email: `john.doe@example.com`
4. Paste the password: `UserPassword123!`
5. Click "Sign In"
6. Done! ✅

---

### Option 2: Create a New Test User
```
📧 Email:    test.user+20251029032918@example.com  (or any timestamp)
🔐 Password: UserPassword123!
👤 Role:     Sales Manager (Limited Access)
```

**How to Create:**
1. Login as Admin first: `admin@arcus.local` / `Admin@123456`
2. Go to Dashboard → Users
3. Click "Create New User"
4. Enter email and name
5. Click "Generate Password" (password auto-generated)
6. Choose role: "sales_manager"
7. Click "Create"
8. Share password with user
9. User logs in with new email + auto-generated password

---

### Option 3: Run Test Script (Creates Test User Automatically)
```powershell
cd "c:\Users\saksh\OneDrive\Desktop\Bobs_Firebase"
powershell.exe -ExecutionPolicy Bypass -File "test-api-clean.ps1"
```

**What Gets Created:**
```
📧 Test User Email: test.user+[timestamp]@example.com
🔐 Password:        UserPassword123!
👤 Role:            sales_manager
```

Then login with those credentials.

---

## What Can Non-Admin Users Do?

### ✅ CAN DO:
- 📊 View sales leads
- ➕ Create new sales leads
- 📈 View sales opportunities
- 👤 View own profile
- 🔑 Change own password

### ❌ CANNOT DO:
- 👥 Create or delete users
- 🎭 Create or manage roles
- 🔐 Change other users' passwords
- ⚙️ Access system settings
- 🛡️ Manage permissions

---

## Available Test Accounts Right Now

| Type | Email | Password |
|------|-------|----------|
| **Admin** | admin@arcus.local | Admin@123456 |
| **Regular User** | john.doe@example.com | UserPassword123! |

---

## Password Format for New Users

When you create a new user, the password is automatically generated:
- **16 characters**
- **Mix of:** UPPERCASE + lowercase + Numbers + Special chars
- **Example:** `K7mP$9xQrL2nW@5y`

---

## Still Not Working?

✅ **Check these:**
1. Is dev server running? `npm run dev`
2. Browser at `http://localhost:3000`
3. Email copied correctly (no extra spaces)
4. Password copied correctly (no extra spaces)
5. Try admin first to verify system works

✅ **Still stuck?** Check the database:
```sql
SELECT email, name FROM users LIMIT 5;
```

---

**TL;DR:** 
1. Go to `http://localhost:3000`
2. Email: `john.doe@example.com`
3. Password: `UserPassword123!`
4. Click Sign In ✅
