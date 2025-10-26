# Sprint 1 Quick Reference Card

**Sprint:** Sprint 1 (Oct 27 – Nov 10, 2025)  
**Goal:** Foundation — Control-plane DB, middleware PoC, Docker dev environment  
**Team:** Backend Lead, Backend Engineer, DevOps, QA  

---

## At-a-Glance

| What | When | Who | Effort |
|------|------|-----|--------|
| 📋 Gap Analysis + Planning | Oct 26–27 | All | — |
| 🗄️ Control-plane entities + migrations | Oct 28–31 | Backend Lead | 18h |
| 🔧 Tenant provisioning CLI | Oct 31–Nov 4 | DevOps | 10h |
| 🐳 Docker + Compose setup | Nov 4–5 | DevOps | 12h |
| 🔐 JWT middleware PoC | Nov 5–7 | Backend Lead | 10h |
| ✅ Tests + seeding | Nov 7–9 | QA + Backend | 14h |
| 📚 Docs + demo prep | Nov 9–10 | Tech Writer + All | 4h |

---

## Key Deliverables

### Entities (TypeORM)
```
✅ Session (jti, user_id, tenant_id, expires_at)
✅ UserMapping (tenant_id, user_id, role)
✅ TenantMetadata (tenant_name, db_connection_string)
✅ PolicySyncLog (schema version, changes, sync_date)
```

### Infrastructure
```
✅ Dockerfile (multi-stage Next.js build)
✅ docker-compose.dev.yml (Postgres, Redis, MinIO, app)
✅ provision-tenant-db.mjs (Supabase Admin API script)
✅ scripts/seed/ (admin user, roles, sample tenant)
```

### Auth & Middleware
```
✅ src/lib/auth/jwks-cache.ts (RS256 verification)
✅ src/lib/auth/session-check.ts (revocation lookup)
✅ src/middleware.ts (JWT + session + policy check)
✅ src/__tests__/middleware.test.ts (unit tests)
```

### Documentation
```
✅ .env.template (all required keys)
✅ docs/DOCKER_SETUP.md (local dev guide)
✅ docs/DEVELOPERS_GUIDE.md (patterns + examples)
✅ docs/SPRINT_1_EXECUTION_PLAN.md (detailed task breakdown)
```

---

## Daily Standup Template

**Time:** 9:00 AM  
**Duration:** 15 min  
**Format:**

```
1. Yesterday: [What did I complete?]
2. Today: [What will I finish?]
3. Blockers: [What's stopping progress?]
4. Help needed: [Who can I ask?]
```

---

## Success Checklist (End of Sprint 1)

- [ ] Docker Compose starts without errors (all healthchecks pass)
- [ ] Control-plane DB has all 4 tables + indices
- [ ] Middleware JWT verification works (happy + error paths tested)
- [ ] Session revocation check working (revoked JWT → 401)
- [ ] Tenant provisioning script creates DB + returns connection string
- [ ] Control-plane seeded: admin user + default roles + sample tenant
- [ ] All tests pass (> 80% coverage)
- [ ] `.env.template` + docs complete and clear
- [ ] Team can spin up local env end-to-end in < 5 min
- [ ] Demo video or live demo prepared (3–5 min)

---

## Common Commands (Copy-Paste)

### Local Setup
```bash
# 1. Copy env template
cp .env.template .env.local

# 2. Start Docker services
docker-compose -f docker-compose.dev.yml up

# 3. Run migrations (once DB is healthy)
pnpm typeorm migration:run

# 4. Seed control-plane
pnpm tsx scripts/seed/seed-control-plane.ts

# 5. Run app
pnpm dev

# 6. Run tests
pnpm test

# 7. Cleanup
docker-compose -f docker-compose.dev.yml down -v
```

### Provisioning New Tenant
```bash
# 1. Run provisioning script
pnpm tsx scripts/provision-tenant-db.mjs --name="New Corp" --project-id=<supabase-id>

# 2. Returns connection string — add to env or tenant registry
```

### Middleware Testing
```bash
# 1. Create JWT + session
curl -X POST http://localhost:3000/api/auth/session \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user","tenant_id":"test-tenant"}'

# 2. Use token to hit protected endpoint
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/vendors

# 3. Revoke session
curl -X POST http://localhost:3000/api/auth/revoke \
  -H "Content-Type: application/json" \
  -d '{"jti":"<jti-from-token>"}'

# 4. Verify 401 on revoked session
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/vendors  # → 401
```

---

## LLM Model Recommendations

### Use **Sonnet 4.5** For:
- TypeORM entity code generation (relationships, decorators)
- SQL migration files
- Middleware JWT verification logic
- Multi-file refactors
- CLI script for provisioning (Supabase API calls)
- Docker Compose + Dockerfile

### Use **Haiku** For:
- `.env.template` generation
- Documentation (DOCKER_SETUP.md, quick ref)
- Commit messages
- PR descriptions
- Code review comments

---

## Escalation Contacts

| Issue | Contact | How |
|-------|---------|-----|
| Supabase Admin API questions | DevOps Lead | Slack #devops |
| TypeORM + entity design | Backend Lead | Slack #backend |
| Docker issues | DevOps Lead | Slack #devops |
| Middleware + auth questions | Backend Lead | Slack #backend |
| Test failures | QA | Slack #qa |
| Timeline/scope questions | Project Manager | Email or Slack |

---

## Links & Resources

- 📄 **Full Gap Analysis:** `docs/GAP_ANALYSIS_DETAILED.md`
- 📋 **Sprint Execution Plan:** `docs/SPRINT_1_EXECUTION_PLAN.md`
- 📊 **Executive Summary:** `docs/EXECUTIVE_SUMMARY.md`
- 🐳 **Docker Setup:** `docs/DOCKER_SETUP.md` (to be created)
- 🔑 **Supabase Docs:** https://supabase.com/docs
- 🔐 **TypeORM Docs:** https://typeorm.io/
- 🛡️ **JWT Best Practices:** https://tools.ietf.org/html/rfc7519

---

## Important Reminders

⚠️ **Secrets:**
- Never commit `.env.local` or private keys to GitHub
- Use GitHub Actions secrets for CI/CD
- Store Supabase service key in 1Password or secure vault

⚠️ **Database:**
- Use local Docker Postgres for dev (not production Supabase)
- Migrations are idempotent — can be re-run safely
- Always test migrations locally first

⚠️ **Testing:**
- Run `pnpm test` before pushing
- Aim for > 80% code coverage
- Test edge cases (revoked sessions, expired JWTs, invalid tokens)

⚠️ **Communication:**
- Daily 9 AM standup — mandatory
- Blocker? Report in standup or Slack immediately
- Don't wait until EOD to ask for help

---

## FAQ

**Q: How do I connect to the local Postgres?**  
A: `psql postgresql://devuser:devpass@localhost:5432/control_db`

**Q: Docker compose is stuck / not starting?**  
A: Run `docker-compose -f docker-compose.dev.yml logs` to see errors. Common issue: port 5432 already in use. Kill the process or change port.

**Q: How do I test middleware locally?**  
A: See "Middleware Testing" commands above. Or use Postman/Insomnia to make requests with Bearer token.

**Q: I don't understand TypeORM relationships?**  
A: Ask Backend Lead in Slack or read https://typeorm.io/relations

**Q: When do I run migrations?**  
A: After `docker-compose up` when DB is healthy. Run `pnpm typeorm migration:run` once.

**Q: Can I modify migrations after they're run?**  
A: No — rollback with `pnpm typeorm migration:revert`, then modify + re-run.

---

## Definition of Done (Per Task)

- [ ] Code written + compiles
- [ ] Unit tests pass (> 80% coverage)
- [ ] Code reviewed + approved (2+ approvals)
- [ ] Merged to main
- [ ] Deployment docs updated (if applicable)
- [ ] Marked complete in sprint board

---

**Version:** 1.0  
**Created:** October 26, 2025  
**For questions:** Ask Backend Lead or DevOps on Slack

Good luck! Let's ship this migration. 🚀
