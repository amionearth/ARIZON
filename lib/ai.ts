// lib/ai.ts — Vendor-neutral AI provider wrapper.
//
// Reads the runtime settings from `lib/ai-control.ts` (managed by the
// Government AI Control panel) so an admin can swap providers, rotate
// keys, or disable AI at runtime. Env vars act as the boot fallback so
// a fresh deployment works without ever opening the Gov portal.

import { createOpenAI } from '@ai-sdk/openai';
import { aiControl } from './ai-control';

export function getActiveAI() {
  const s = aiControl.getSettings();
  const provider = createOpenAI({
    apiKey: s.apiKey,
    baseURL: s.baseUrl,
    headers: {
      'HTTP-Referer': 'https://arizon.kerala.gov.in',
      'X-Title': 'AriZon Smart PDS Kerala',
    },
  });
  return {
    provider,
    model: s.model,
    enabled: s.enabled && !!s.apiKey,
    fallback: s.fallbackMode,
  };
}

/**
 * Convenience used by the chat route: detect if any AI is currently active.
 */
export const isAIConfigured = () => getActiveAI().enabled;
