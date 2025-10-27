let cachedAi: any = null;

// Runtime guard: only initialize genkit if GENKIT_ENABLED is truthy.
// This allows builds/environments without a Gemini key to avoid pulling
// server-only dependencies into build analysis.
export async function getAi() {
	if (cachedAi) return cachedAi;
	const enabled = process.env.GENKIT_ENABLED === '1' || process.env.GENKIT_ENABLED === 'true';
	if (!enabled) {
		// Return a stub that throws a clear error when used.
		return {
			definePrompt() {
				throw new Error('Genkit is disabled. Set GENKIT_ENABLED=true and provide credentials to enable AI features.');
			},
			// allow call site to await without crashing at import time
			__stub: true,
		} as any;
	}

	// Dynamic import at runtime (server-only)
	const genkitModule = await import('genkit');
	const googleAiModule = await import('@genkit-ai/googleai');
	const genkit = genkitModule?.genkit ?? genkitModule?.default ?? genkitModule;
	const googleAI = googleAiModule?.googleAI ?? googleAiModule?.default ?? googleAiModule;
	cachedAi = genkit({ plugins: [googleAI()] });
	return cachedAi;
}

