import { GenkitError } from 'genkit';
import { getAi } from './genkit';

// Initialize the AI
getAi().then(ai => {
  console.log('Genkit AI initialized for development');
}).catch(error => {
  if (error instanceof GenkitError && error.status === 'FAILED_PRECONDITION') {
    console.warn('Genkit AI not initialized: API key missing. This is expected in local development without Google AI API key.');
    console.warn('AI features will be disabled.');
  } else {
    console.error('Failed to initialize Genkit AI:', error);
  }
});
