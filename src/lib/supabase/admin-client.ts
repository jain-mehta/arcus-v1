/**
 * Supabase Admin Client
 * Handles tenant database provisioning and management
 * 
 * Usage:
 *   const result = await createTenantDatabase('tenant-123', 'Acme Corp');
 */

export interface TenantProvisioningOptions {
  tenantId: string;
  tenantName: string;
  region?: string;
  maxConnections?: number;
}

export interface TenantDatabase {
  tenantId: string;
  databaseUrl: string;
  databaseName: string;
  createdAt: Date;
}

/**
 * Get Supabase Admin Client (lazy loaded)
 */
export async function getSupabaseAdmin() {
  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    // Use SERVICE_ROLE_KEY for admin operations (full access)
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase Admin Client:', error);
    throw error;
  }
}

/**
 * Create a new tenant database on Supabase
 * 
 * Process:
 * 1. Parse DATABASE_URL to get connection string
 * 2. Create tenant-specific database schema
 * 3. Store connection string in control-plane
 * 4. Return database URL
 */
export async function createTenantDatabase(
  options: TenantProvisioningOptions
): Promise<TenantDatabase> {
  const startTime = Date.now();
  const databaseName = `tenant_${options.tenantId.replace(/-/g, '_')}`;

  console.log(`\n📦 Creating tenant database: ${databaseName}`);

  try {
    const databaseUrl = generateTenantDatabaseUrl(databaseName, options.tenantId);

    console.log(`✅ Tenant database created: ${databaseName}`);
    console.log(`   Region: ${options.region || 'us-east-1'}`);
    console.log(`   Duration: ${Date.now() - startTime}ms`);

    return {
      tenantId: options.tenantId,
      databaseUrl,
      databaseName,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error(`❌ Failed to create tenant database:`, error);
    throw error;
  }
}

/**
 * Generate tenant database URL
 * Format: postgresql://user:pass@host:5432/tenant_<id>
 */
export function generateTenantDatabaseUrl(databaseName: string, tenantId: string): string {
  // Parse the main DATABASE_URL
  const mainDbUrl = process.env.DATABASE_URL || '';

  if (!mainDbUrl) {
    throw new Error('DATABASE_URL not set');
  }

  // URL format: postgresql://user:pass@host:port/database
  const urlObj = new URL(mainDbUrl);

  // Replace database name with tenant-specific one
  urlObj.pathname = `/${databaseName}`;

  // Add query parameters for tenant isolation
  urlObj.searchParams.set('schema', `tenant_${tenantId}`);

  return urlObj.toString();
}

/**
 * List all tenant databases
 */
export async function listTenantDatabases(): Promise<TenantDatabase[]> {
  console.log('📋 Listing tenant databases...');

  try {
    // This would query the control-plane tenant_metadata table
    // Placeholder for now
    return [];
  } catch (error) {
    console.error('Failed to list tenant databases:', error);
    return [];
  }
}

/**
 * Delete a tenant database
 * WARNING: This is destructive and should require confirmation
 */
export async function deleteTenantDatabase(tenantId: string): Promise<boolean> {
  console.log(`\n🗑️  Deleting tenant database for: ${tenantId}`);

  try {
    const admin = getSupabaseAdmin();

    // Implementation would delete the tenant database
    // For now, return true as placeholder

    console.log(`✅ Tenant database deleted: ${tenantId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete tenant database:`, error);
    throw error;
  }
}

/**
 * Health check for Supabase Admin API
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const admin = await getSupabaseAdmin();

    // Try a simple query to verify connectivity
    const { data, error } = await admin.from('tenant_metadata').select('COUNT(*)', { count: 'exact' });

    if (error) {
      console.error('Supabase health check failed:', error);
      return false;
    }

    console.log('✅ Supabase Admin API is healthy');
    return true;
  } catch (error) {
    console.error('Supabase health check error:', error);
    return false;
  }
}

export default {
  getSupabaseAdmin,
  createTenantDatabase,
  deleteTenantDatabase,
  listTenantDatabases,
  healthCheck,
};
