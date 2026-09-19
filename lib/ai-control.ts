// lib/ai-control.ts
// In-memory AI control panel used by the Government portal.
// The Government can swap providers, change the model, or disable AI
// entirely. The chat route reads these settings at request time.
//
// In a production deployment, persist to Supabase and load on boot.

export interface AIProviderPreset {
  id: string;
  name: string;
  badge?: string;
  isKeralaLocal?: boolean;
  baseUrl: string;
  defaultModel: string;
  description: string;
}

export const AI_PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'kerala-sovereign',
    name: '🌟 Kerala Local Sovereign Indic LLM (Edge / C-DAC / DUK)',
    badge: 'Kerala Sovereign',
    isKeralaLocal: true,
    baseUrl: process.env.KERALA_LLM_URL ?? 'http://localhost:11434/v1',
    defaultModel: 'kerala-indic-llama-3',
    description: 'On-premise sovereign deployment for Kerala State IT Mission. Complete citizen data privacy, zero external API costs, native Malayalam fluency.',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter Unified Gateway (Claude, Llama 3, DeepSeek, GPT-4o)',
    badge: 'Universal Router',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    description: 'Access 200+ models with one API key. Seamless failover between Claude 3.5, Llama 3, and DeepSeek.',
  },
  {
    id: 'xai',
    name: 'xAI Grok-2 (api.x.ai)',
    badge: 'Advanced Reasoning',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-latest',
    description: 'Deep reasoning, mathematical audits, and state-wide reconciliation analysis.',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4o / GPT-4o-mini)',
    badge: 'Enterprise Standard',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    description: 'Frontier model with high-precision structured data and robust function calling.',
  },
  {
    id: 'anthropic-openrouter',
    name: 'Anthropic Claude 3.5 Sonnet (via OpenRouter)',
    badge: 'Agentic Leader',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    description: 'Superior agentic planning, multi-step tool execution, and code synthesis.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI (DeepSeek V3 / R1)',
    badge: 'Cost Efficient',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    description: 'Ultra cost-efficient open reasoning engine for high-volume government citizen queries.',
  },
  {
    id: 'groq',
    name: 'Groq Cloud (Sub-200ms LPU Inference)',
    badge: 'Ultra Fast',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    description: 'Ultra low-latency LPU chips for instantaneous citizen SMS and voice queries.',
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini (Gemini 1.5 Pro / Flash)',
    badge: 'Multimodal',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-1.5-pro',
    description: 'Massive context window with rich Indic multilingual language understanding.',
  },
  {
    id: 'together',
    name: 'Together AI (Serverless Open Weights)',
    badge: 'Open Weights',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    description: 'Serverless execution for open source research and state deployments.',
  },
  {
    id: 'ollama-local',
    name: 'Ollama Node (Local District Office Machine)',
    badge: 'Offline Local',
    baseUrl: 'http://127.0.0.1:11434/v1',
    defaultModel: 'llama3.2:3b',
    description: 'Runs completely offline on standard desktop hardware without internet connection.',
  },
  {
    id: 'custom-state',
    name: 'Custom State NIC / SDC Sovereign Cloud Endpoint',
    badge: 'State Cloud',
    baseUrl: 'https://ai.kerala.gov.in/v1',
    defaultModel: 'custom-model',
    description: 'Direct integration with Kerala State Data Centre (SDC) sovereign servers.',
  },
];

export interface AISettings {
  enabled: boolean;
  provider: string;
  presetId?: string;
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
