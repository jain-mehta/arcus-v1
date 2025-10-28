# Quick Command Reference

## Development

### Start Development Server
```bash
npm run dev
# Server: http://localhost:3000
```

### Build for Production
```bash
npm run build
# Output: .next/
```

### Run Production Build
```bash
npm start
```

### Run Linting
```bash
npm run lint
```

### Run Tests
```bash
npm test
```

## Environment Setup

### Required Environment Variables
Ensure `.env.local` or `.env` contains:
```
SUPABASE_JWKS_URL=https://asuxcwlbzspsifvigmov.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Check Environment
```bash
npm run env:check
```

## Troubleshooting

### Clear Cache & Rebuild
```bash
rm -r .next
npm run build
```

### Fresh Install
```bash
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Port Already in Use
```bash
# Change port in next.config.mjs or use:
npm run dev -- -p 3001
```

## Database Operations

### Migrations (Control DB)
```bash
npm run migrate:control
```

### Check Supabase Connection
```bash
node scripts/check-supabase-connection.mjs
```

## Deployment

### Build & Deploy
```bash
npm run build
# Deploy .next/ folder to hosting
```

### Docker Build
```bash
docker build -t bobs-firebase .
docker run -p 3000:3000 bobs-firebase
```

## Key Files to Know

- **Config:** next.config.mjs, tsconfig.json, tailwind.config.ts
- **Auth:** src/lib/supabase/*, src/components/AuthProvider.tsx
- **API:** src/app/api/
- **Database:** src/lib/controlDataSource.ts, tenantDataSource.ts
- **Env:** .env, .env.local

## Useful Links

- **Supabase:** https://asuxcwlbzspsifvigmov.supabase.co
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs

## Common Issues & Solutions

### Issue: "Invalid supabaseUrl"
**Solution:** Ensure `SUPABASE_JWKS_URL` is set to the correct Supabase URL

### Issue: "Cannot find module 'firebase-admin'"
**Solution:** Firebase has been removed. Use Supabase client instead.

### Issue: Build fails with type errors
**Solution:** Run `npm run build` to see full error details, then fix reported types.

### Issue: Dev server won't start
**Solution:** Kill process on port 3000, clear .next, then restart.

---
Generated: October 27, 2025
