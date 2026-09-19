// lib/ai-control.ts
// In-memory AI control panel used by the Government portal.
// The Government can swap providers, change the model, or disable AI
// entirely. The chat route reads these settings at request time.
//
// In a production deployment, persist to Supabase and load on boot.

export interface AISettings {
  enabled: boolean;
  provider: 'openai-compatible' | 'anthropic' | 'google' | 'ollama' | 'custom';
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  fallbackMode: 'local-rule' | 'reject';
  updatedBy: string;
  updatedAt: string;
}

export interface AIRequestLog {
  id: number;
  at: string;
  role: 'customer' | 'seller' | 'supplier' | 'gov';
  query: string;
  provider: string;
  model: string;
  status: 'success' | 'fallback' | 'error';
  latency_ms: number;
  note?: string;
}

const defaultSettings: AISettings = {
  enabled: true,
  provider: 'openai-compatible',
  label: 'Primary (vendor-neutral)',
  baseUrl: process.env.AI_BASE_URL ?? 'https://api.x.ai/v1',
  apiKey: process.env.AI_API_KEY ?? process.env.GROK_API_KEY ?? '',
  model: process.env.AI_MODEL ?? 'grok-2-latest',
  fallbackMode: 'local-rule',
  updatedBy: 'system',
  updatedAt: new Date().toISOString(),
};

class AIControl {
  private settings: AISettings = { ...defaultSettings };
  private logs: AIRequestLog[] = [];
  private nextId = 1;

  getSettings(): AISettings {
    // Always merge in env overrides so deployments can still force a default.
    return {
      ...this.settings,
      apiKey: this.settings.apiKey || defaultSettings.apiKey,
    };
  }

  updateSettings(patch: Partial<AISettings>, actor: string): AISettings {
    this.settings = {
      ...this.settings,
      ...patch,
      updatedBy: actor,
      updatedAt: new Date().toISOString(),
    };
    return this.settings;
  }

  resetSettings(actor: string): AISettings {
    this.settings = {
      ...defaultSettings,
      updatedBy: actor,
      updatedAt: new Date().toISOString(),
    };
    return this.settings;
  }

  maskKey(key: string): string {
    if (!key) return '';
    if (key.length <= 8) return '••••';
    return `${key.slice(0, 4)}••••${key.slice(-4)}`;
  }

  log(entry: Omit<AIRequestLog, 'id'>): AIRequestLog {
    const row: AIRequestLog = { id: this.nextId++, ...entry };
    this.logs.unshift(row);
    // Keep the last 200 entries
    if (this.logs.length > 200) this.logs.length = 200;
    return row;
  }

  getLogs(limit = 25): AIRequestLog[] {
    return this.logs.slice(0, limit);
  }
}

const g = globalThis as typeof globalThis & { __aiControl?: AIControl };
if (!g.__aiControl) g.__aiControl = new AIControl();
export const aiControl = g.__aiControl;
