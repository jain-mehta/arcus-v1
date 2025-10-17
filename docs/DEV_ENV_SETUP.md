# Developer environment setup

This guide lists the manual steps you must perform locally or in your project settings to run and develop the migrated Supabase + TypeORM + policy-engine stack.

Do NOT commit secrets. Use `git` branches for changes and GitHub Secrets or your chosen vault for real credentials. The repository contains a `.env.example` with placeholders — copy it to `.env` and fill in real values.

## Required environment variables

- CONTROL_DATABASE_URL - connection string for control-plane Postgres (postgres://user:pass@host:5432/control_db)
- SUPABASE_JWKS - URL for Supabase JWKS (e.g. https://<project>.supabase.co/auth/v1/.well-known/jwks.json)
- POLICY_ENGINE - either `permify` or `ory`
- PERMIFY_URL - Permify check endpoint (when using Permify)
- PERMIFY_API_KEY - API key / token for Permify
- NODE_ENV - `development` or `production`
- PORT - local dev port (default 3000)
- TENANT_DB_TEMPLATE - optional template for tenant DB connection strings

## Quick local setup steps (manual)

1. Copy the `.env.example` to `.env` in the repo root:

```powershell
copy .env.example .env
```

2. Fill in the placeholder values in `.env` with real credentials. Minimum fields to run local checks:
- `CONTROL_DATABASE_URL`
- `SUPABASE_JWKS`
- `POLICY_ENGINE`

3. If you use Permify for policy checks, add `PERMIFY_URL` and `PERMIFY_API_KEY` to your `.env` or to GitHub Secrets for CI.

4. Add secrets to GitHub Secrets (Settings → Secrets → Actions) for CI, for example:
- CONTROL_DATABASE_URL
- PERMIFY_API_KEY
- (Optional) any other cloud provider keys

5. Rotate any secrets that were previously committed in the repo before continuing. If secrets were exposed publicly, rotate them immediately (create new tokens in the provider console) and update `.env` and GitHub Secrets accordingly.

6. Run the env check to confirm required env vars are present:

```powershell
npm run env:check
```

7. Run typecheck to confirm the codebase compiles:

```powershell
npm run typecheck
```

8. To exercise control-plane placeholders (safe local run):

```powershell
npm run start-control
npm run migrate-control
```

## Migration & runtime checklist (manual tasks you must do)

- [ ] Create the control-plane Postgres instance (managed or local) and set `CONTROL_DATABASE_URL`.
- [ ] Create tenant Postgres instances or a template and set `TENANT_DB_TEMPLATE`.
- [ ] Set up Permify or Ory instance and set `PERMIFY_URL` / `PERMIFY_API_KEY`.
- [ ] Make a plan to migrate users, roles, permissions, and audit logs from Firebase to Postgres. (This repo contains migration scaffolds under `migrations/` — implement the migration scripts; see `todo` item.)
- [ ] Add CI secrets in GitHub repository settings (Control DB, Permify keys).
- [ ] Add pre-commit hooks or GitHub Actions to reject accidental commits of `.env` files.
- [ ] Rotate any previously committed service-account keys.

## Manual action checklist — exact steps you should perform (PowerShell)

Follow these steps in order. Copy/paste the commands in PowerShell where indicated. Replace placeholder values in angle brackets before running.

1) Create control-plane Postgres (example using Docker for local testing)

```powershell
# Start a local Postgres container (local only)
docker run --name bf-control-db -e POSTGRES_USER=control_user -e POSTGRES_PASSWORD=control_pass -e POSTGRES_DB=control_db -p 5432:5432 -d postgres:15

# After container starts, set CONTROL_DATABASE_URL in your .env (or GitHub Secrets)
# Example connection string:
# postgres://control_user:control_pass@localhost:5432/control_db
```

2) Create tenant DB template (if using per-tenant DBs)

```powershell
# Example tenant DB template (adjust host, user, and password)
# TENANT_DB_TEMPLATE=postgres://tenant_user:tenant_pass@localhost:5433/tenant_db_{tenantId}
```

3) Rotate previously exposed credentials (manual provider steps)

- For any cloud keys or service accounts that were in the repo: go to the provider's console and revoke/rotate keys.
- Update `.env` and GitHub Secrets with the new values.

4) Add GitHub Actions secrets (manual)

- Go to `https://github.com/<owner>/<repo>/settings/secrets/actions`
- Add the following secrets (names must match env var names you use in CI):
	- CONTROL_DATABASE_URL
	- PERMIFY_API_KEY (if using Permify)
	- Any cloud provider keys (optional)

5) Populate `.env` from `.env.example` and fill in values

```powershell
copy .env.example .env

# Edit the .env file using Notepad or VS Code and set:
# CONTROL_DATABASE_URL, SUPABASE_JWKS, POLICY_ENGINE
# and if using Permify: PERMIFY_URL and PERMIFY_API_KEY
code .env
```

6) Validate required env vars locally

```powershell
npm run env:check
```

Expected output (if env set):

```
All required env vars are set.
```

If any are missing the script will list them.

7) Run typecheck and tests

```powershell
npm run typecheck
npm test:e2e    # runs Playwright tests (requires test accounts and credentials)
```

Note: Playwright tests will need test credentials (do not commit them). Use GitHub Secrets for CI.

8) Run the migration placeholders (safe local dry-run)

```powershell
npm run migrate-control
```

This will print a dry-run message. Implement real migration runner before using on production.

9) Verify middleware behavior locally (example request)

If you have the app running locally (Next dev or a backend server), you can test that a request with no Authorization header is rejected.

```powershell
curl -i http://localhost:3000/api/some-protected-route

# Expected: 401 Unauthorized (middleware should intercept)
```

10) Verify Permify calls (manual / smoke test)

- If you provided `PERMIFY_URL` and `PERMIFY_API_KEY`, you can run a small Node one-off script to test a policy check. Create a file `scripts/check-permify.js` and run `node scripts/check-permify.js` (I can add this script if you want).

11) Before committing changes or opening PRs

- Ensure `.env` is not staged:

```powershell
git status --porcelain
git reset .env
```

- Run lint and typecheck in CI and locally.

12) Optional: Run a local audit for secrets

Install a local secret scanner (truffleHog or git-secrets) and scan the repo. For example, run GitHub's `gitleaks` locally.

```
# Install gitleaks (see https://github.com/zricethezav/gitleaks)
gitleaks detect --source .
```

If `gitleaks` finds secrets, rotate them immediately.

---

If you'd like, I can add the optional helper scripts mentioned above (`scripts/check-permify.js`, `scripts/run-migrations.js`) and implement the tenant migration runner next. Tell me which helper scripts you want me to create and I'll add them and update the todo list accordingly.

## Things you may have missed (scan & verify)

- Check `secrets/` and `service-account.json` are removed from the main tree and archived. If any remain, remove and rotate.
- Ensure `.gitignore` includes `.env`, `.env.*`, and `archive/` (this repo already updated it).
- Confirm Playwright secrets/test accounts are kept out of the repo.
- Confirm `package.json` scripts for `start-control` and `migrate-control` are placeholders; replace with real implementations when ready.
- Confirm whether Next.js middleware should run in Edge or Node. The PoC uses node-based JWKS/client code which may be unsuitable for Edge runtime. If you plan to use Next Edge, implement verification using a lightweight JWKS validator compatible with the Edge environment.

## Commands reference

- Install deps:

```powershell
npm install
```

- Typecheck:

```powershell
npm run typecheck
```

- Run env check:

```powershell
npm run env:check
```

- Run placeholders:

```powershell
npm run start-control
npm run migrate-control
```

## Next steps you can ask me to do (I can implement these for you)

- Implement Permify adapter and schema-sync tooling (requires PERMIFY_URL and PERMIFY_API_KEY). I can implement a tested adapter and caching/invalidation.
- Implement tenant DataSource manager and an idempotent migration runner for tenant DBs (dry-run mode included).
- Wire middleware into Next.js runtime safely (Edge vs Node decision) and add automated tests for session revocation and policy checks.
- Add CI jobs to run typecheck and tests and add a Terraform module for control-plane infra.

---

If you'd like, tell me which of the next steps above to implement first and I'll pick up and continue (I'll update the tracked todo list as I go).
