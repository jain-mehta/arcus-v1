const required = [
  'CONTROL_DATABASE_URL',
  'SUPABASE_JWKS',
  'POLICY_ENGINE',
];
const missing = required.filter(k => !process.env[k]);
if (missing.length === 0) {
  console.log('All required env vars are set.');
  process.exit(0);
}
console.log('Missing environment variables:');
missing.forEach(k => console.log(' -', k));
process.exit(1);
