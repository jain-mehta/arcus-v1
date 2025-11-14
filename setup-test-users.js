/**
 * Setup script: Create test users in Supabase
 * Run this before running tests
 */

const SUPABASE_URL = 'https://asuxcwlbzspsifvigmov.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdXhjd2xienNwc2lmdmlnbW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MzQxOSwiZXhwIjoyMDc2MTY5NDE5fQ.CEWxpRUu-uvKnbwvvoc6TjJ12Ga9GHYtl5I3xLN8A48';

const TEST_USERS = [
  {
    email: 'admin@arcus.local',
    password: 'Admin@123456',
    user_metadata: {
      full_name: 'Admin User',
      role: 'admin'
    }
  },
  {
    email: 'user@example.com',
    password: 'User@123456',
    user_metadata: {
      full_name: 'Test User',
      role: 'user'
    }
  }
];

async function createTestUser(user) {
  try {
    console.log(`Creating user: ${user.email}`);
    
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.user_metadata
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ User created: ${user.email} (ID: ${data.id})`);
      return data;
    } else if (response.status === 422) {
      console.log(`ℹ️  User already exists: ${user.email}`);
      return { email: user.email, exists: true };
    } else {
      const error = await response.json();
      console.error(`❌ Error creating user: ${error.message || JSON.stringify(error)}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Exception: ${error.message}`);
    return null;
  }
}

async function setupTestUsers() {
  console.log('🚀 Starting test user setup...');
  
  for (const user of TEST_USERS) {
    await createTestUser(user);
  }
  
  console.log('✅ Setup complete!');
  console.log('Test credentials:');
  TEST_USERS.forEach(user => {
    console.log(`  - Email: ${user.email}`);
    console.log(`    Password: ${user.password}`);
  });
}

setupTestUsers().catch(console.error);
