# User Credentials & How to Use Them

## 📋 Summary - Copy & Paste Ready

### For Non-Admin Users (Regular Access)

#### Test User #1 (Pre-Made)
```
Email:    john.doe@example.com
Password: UserPassword123!
Role:     Sales Manager
Status:   Ready to use now!
```

#### Test User #2 (From Latest Test Run)
```
Email:    test.user+20251029032918@example.com
Password: UserPassword123!
Role:     Sales Manager
Status:   Ready to use now!
```

#### For Admin Access
```
Email:    admin@arcus.local
Password: Admin@123456
Role:     Admin (Full Access)
Status:   Ready to use now!
```

---

## Step-by-Step Login Instructions

### For Admin User

1. **Open browser:**
   ```
   http://localhost:3000
   ```

2. **Click "Sign In" button**

3. **Enter these exact credentials:**
   ```
   Email:    admin@arcus.local
   Password: Admin@123456
   ```

4. **Click "Sign In" button**

5. **You should see the admin dashboard** ✅

### For Regular User (Non-Admin)

1. **Open browser:**
   ```
   http://localhost:3000
   ```

2. **Click "Sign In" button**

3. **Enter these exact credentials:**
   ```
   Email:    john.doe@example.com
   Password: UserPassword123!
   ```

4. **Click "Sign In" button**

5. **You should see the user dashboard with limited access** ✅

---

## 🔄 How to Create More Non-Admin Users

### Method 1: Via Admin Dashboard (Easiest)

1. **Login as admin**
   - Email: `admin@arcus.local`
   - Password: `Admin@123456`

2. **Navigate to:** Dashboard → Users → "Create New User"

3. **Fill in form:**
   - Email: Enter any valid email (e.g., `user@example.com`)
   - Full Name: Enter user's name
   - Role: Select a role from dropdown (e.g., "sales_manager")

4. **Generate Password:**
   - Click "Generate Password" button
   - A random 16-character password will be created
   - It shows like: `K7mP$9xQrL2nW@5y`

5. **Create User:**
   - Click "Create User" button
   - Password is saved and shown (only shown once!)
   - Share password with the user

6. **User can now login with:**
   - Email: The email you entered
   - Password: The generated password

### Method 2: Via API/Automation

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "password": "GeneratedPassword123!",
    "fullName": "New User",
    "roleIds": ["role-uuid-here"]
  }'
```

### Method 3: Via Test Script (Auto-Creates)

```powershell
powershell.exe -ExecutionPolicy Bypass -File "test-api-clean.ps1"
```

This creates a new test user every time with:
- Email: `test.user+[timestamp]@example.com` (unique each time)
- Password: `UserPassword123!` (same for all test users)
- Role: `sales_manager`

---

## What Password Should I Give Users?

### For Password Generation:

When you click "Generate Password" in the UI, system creates a **secure random 16-character password** with:
- ✅ Uppercase letters (A-Z)
- ✅ Lowercase letters (a-z)
- ✅ Numbers (0-9)
- ✅ Special characters (!@#$%^&*)

**Examples of valid generated passwords:**
```
K7mP$9xQrL2nW@5y
B2qX@7mKp$9wL5r
H8vF!2nGx$4cQ9j
D5sP#8tR!3mN@7y
```

### For Test Users Created by Script:

Test script always uses:
```
UserPassword123!
```

This is hard-coded for testing purposes.

---

## 🔐 Security Information

### Each User Gets:
- ✅ Unique email address
- ✅ Unique user ID
- ✅ Secure random password (16 chars)
- ✅ Assigned role(s) with specific permissions
- ✅ Can only do what their role allows

### Admin User:
- ✅ Full system access
- ✅ Can create/edit/delete users
- ✅ Can manage roles and permissions
- ✅ Can access all features

### Regular Users:
- ✅ Can only do what their role allows
- ✅ Cannot access admin features
- ✅ Cannot see other users' data (unless permitted by role)
- ✅ Can change own password

---

## 🎯 Real-World Example

### Scenario: Create Sales Manager User

**Admin does:**
1. Login: `admin@arcus.local` / `Admin@123456`
2. Go to Users → Create New User
3. Email: `sales@company.com`
4. Name: `Sales Manager`
5. Role: `sales_manager`
6. Click Generate Password → Gets `P8r@2nJq5kL$3xM`
7. Click Create
8. Tell sales person: "Use email `sales@company.com` and password `P8r@2nJq5kL$3xM`"

**Sales Manager does:**
1. Go to `http://localhost:3000`
2. Login: `sales@company.com` / `P8r@2nJq5kL$3xM`
3. Can now:
   - View sales leads
   - Create new leads
   - View opportunities
   - Update their profile

---

## 📊 Comparing User Types

| Feature | Admin | Regular User | Visitor |
|---------|-------|--------------|---------|
| Login | ✅ Yes | ✅ Yes | ❌ No |
| View Own Profile | ✅ Yes | ✅ Yes | N/A |
| Create Users | ✅ Yes | ❌ No | N/A |
| Manage Roles | ✅ Yes | ❌ No | N/A |
| View Sales Leads | ✅ Yes | ✅ Yes | N/A |
| Create Sales Leads | ✅ Yes | ✅ Yes | N/A |
| Access Settings | ✅ Yes | ❌ No | N/A |
| Manage Permissions | ✅ Yes | ❌ No | N/A |

---

## ❓ FAQ

**Q: Can a regular user create other users?**
A: No. Only admins can create users.

**Q: Can a regular user change another user's password?**
A: No. Only admins can. Users can only change their own.

**Q: What if user forgets password?**
A: Admin goes to Users, finds the user, can reset their password.

**Q: Can I use the same password for multiple users?**
A: Technically yes, but not recommended. Each user should have unique password.

**Q: How long is the generated password valid?**
A: Forever, until changed by user or admin.

**Q: Can regular user become admin?**
A: No. Only admin can promote/demote users.

**Q: Can I delete a user?**
A: Yes, admin can. Regular users cannot.

**Q: What roles are available?**
A: Check dashboard or ask admin. Examples: `sales_manager`, `team_lead`, etc.

---

## ✅ Quick Checklist

For non-admin access:
- [ ] Development server running (`npm run dev`)
- [ ] Can access `http://localhost:3000`
- [ ] Have credentials: email & password
- [ ] Database has user record
- [ ] User has a role assigned

For admin access:
- [ ] Development server running
- [ ] Can access `http://localhost:3000`
- [ ] Have credentials: `admin@arcus.local` / `Admin@123456`
- [ ] Can see admin dashboard after login

---

## 🚀 Next: Share These Credentials

### Give Regular Users:
```
Email:    john.doe@example.com
Password: UserPassword123!
Site:     http://localhost:3000
```

### Give Other Admins:
```
Email:    admin@arcus.local
Password: Admin@123456
Site:     http://localhost:3000
```

---

**All set! Users can now login and start using the system.** 🎉
