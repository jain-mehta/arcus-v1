#!/bin/bash

# Setup script to create test users in Supabase

SUPABASE_URL="https://asuxcwlbzspsifvigmov.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdXhjd2xienNwc2lmdmlnbW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MzQxOSwiZXhwIjoyMDc2MTY5NDE5fQ.CEWxpRUu-uvKnbwvvoc6TjJ12Ga9GHYtl5I3xLN8A48"

echo "Creating test user: admin@arcus.local"

# Create admin user using Supabase API
curl -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@arcus.local",
    "password": "Admin@123456",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Admin User",
      "role": "admin"
    }
  }'

echo "Test user created successfully!"

