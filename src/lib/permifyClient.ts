import axios from 'axios';

export type PermifyCheckRequest = {
  principal: string;
  action: string;
  resource: string;
  context?: Record<string, any>;
};

export async function checkPermify(req: PermifyCheckRequest): Promise<boolean> {
  const url = process.env.PERMIFY_URL;
  const apiKey = process.env.PERMIFY_API_KEY;
  if (!url || !apiKey) throw new Error('Permify not configured');

  try {
    const resp = await axios.post(url, req, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    return !!resp.data?.allow;
  } catch (err: any) {
    // wrap error for caller
    throw new Error(`Permify call failed: ${err?.message || String(err)}`);
  }
}

export async function schemaSync(): Promise<void> {
  // TODO: implement schema sync with Permify management API
  console.log('permify: schemaSync stub (no-op)');
}
