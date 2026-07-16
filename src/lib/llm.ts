export type LLMProvider = "anthropic" | "google" | "openai" | "mistral";

export type LLMMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GenerateTextInput = {
  messages: LLMMessage[];
  system?: string;
  maxTokens?: number;
  provider?: string;
  model?: string;
};

export type GenerateTextResult = {
  text: string;
  provider: LLMProvider;
  model: string;
};

export class LLMError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "LLMError";
    this.status = status;
  }
}

const PROVIDERS: LLMProvider[] = ["anthropic", "google", "openai", "mistral"];

function normalizeProvider(value?: string): LLMProvider | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "claude") return "anthropic";
  if (normalized === "gemini") return "google";
  if (PROVIDERS.includes(normalized as LLMProvider)) return normalized as LLMProvider;
  throw new LLMError("不支援的 LLM 供應商", 400);
}

function providerKey(provider: LLMProvider): string | undefined {
  if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY;
  if (provider === "google") return process.env.GOOGLE_API_KEY;
  if (provider === "openai") return process.env.OPENAI_API_KEY;
  return process.env.MISTRAL_API_KEY;
}

function defaultModel(provider: LLMProvider): string {
  if (provider === "anthropic") {
    return process.env.ANTHROPIC_MODEL ?? process.env.LLM_MODEL ?? "claude-sonnet-4-6";
  }
  if (provider === "google") return process.env.GOOGLE_MODEL ?? "gemini-2.5-flash";
  if (provider === "openai") return process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  return process.env.MISTRAL_MODEL ?? "mistral-large-latest";
}

function selectProvider(requested?: string): LLMProvider {
  const explicit = normalizeProvider(requested);
  if (explicit) {
    if (!providerKey(explicit)) throw new LLMError(`伺服器未設定 ${keyName(explicit)}`, 501);
    return explicit;
  }

  const configured = normalizeProvider(process.env.LLM_PROVIDER);
  if (configured) {
    if (!providerKey(configured)) throw new LLMError(`伺服器未設定 ${keyName(configured)}`, 501);
    return configured;
  }

  const available = PROVIDERS.find((provider) => providerKey(provider));
  if (!available) {
    throw new LLMError(
      "伺服器尚未設定 AI 金鑰；請設定 ANTHROPIC_API_KEY、GOOGLE_API_KEY、OPENAI_API_KEY 或 MISTRAL_API_KEY",
      501,
    );
  }
  return available;
}

function keyName(provider: LLMProvider): string {
  if (provider === "anthropic") return "ANTHROPIC_API_KEY";
  if (provider === "google") return "GOOGLE_API_KEY";
  if (provider === "openai") return "OPENAI_API_KEY";
  return "MISTRAL_API_KEY";
}

function clampMaxTokens(value?: number): number {
  if (!Number.isFinite(value)) return 1200;
  return Math.max(1, Math.min(4096, Math.floor(value as number)));
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function upstreamFailure(provider: LLMProvider, response: Response): never {
  throw new LLMError(`${provider} AI 服務暫時無法完成請求（HTTP ${response.status}）`, 502);
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  system: string | undefined,
  maxTokens: number,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages,
      ...(system ? { system } : {}),
    }),
  });
  const data = (await readJson(response)) as
    | { content?: Array<{ type?: string; text?: string }> }
    | null;
  if (!response.ok) upstreamFailure("anthropic", response);
  return (data?.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("\n")
    .trim();
}

async function callGoogle(
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  system: string | undefined,
  maxTokens: number,
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  const data = (await readJson(response)) as
    | { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    | null;
  if (!response.ok) upstreamFailure("google", response);
  return (data?.candidates ?? [])
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function callOpenAI(
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  system: string | undefined,
  maxTokens: number,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: messages.map((message) => ({ role: message.role, content: message.content })),
      ...(system ? { instructions: system } : {}),
      max_output_tokens: maxTokens,
    }),
  });
  const data = (await readJson(response)) as
    | {
        output_text?: string;
        output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
      }
    | null;
  if (!response.ok) upstreamFailure("openai", response);
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  return (data?.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n")
    .trim();
}

async function callMistral(
  apiKey: string,
  model: string,
  messages: LLMMessage[],
  system: string | undefined,
  maxTokens: number,
): Promise<string> {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        ...messages,
      ],
      max_tokens: maxTokens,
    }),
  });
  const data = (await readJson(response)) as
    | {
        choices?: Array<{
          message?: { content?: string | Array<{ type?: string; text?: string }> };
        }>;
      }
    | null;
  if (!response.ok) upstreamFailure("mistral", response);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  return (content ?? [])
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n")
    .trim();
}

export function configuredProviders(): LLMProvider[] {
  return PROVIDERS.filter((provider) => Boolean(providerKey(provider)));
}

export async function generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
  if (!Array.isArray(input.messages) || input.messages.length === 0) {
    throw new LLMError("messages 必須包含至少一則訊息", 400);
  }
  if (
    input.messages.some(
      (message) =>
        !message ||
        (message.role !== "user" && message.role !== "assistant") ||
        typeof message.content !== "string" ||
        !message.content.trim(),
    )
  ) {
    throw new LLMError("messages 格式不正確", 400);
  }

  const provider = selectProvider(input.provider);
  const apiKey = providerKey(provider) as string;
  const model = input.model?.trim() || defaultModel(provider);
  const maxTokens = clampMaxTokens(input.maxTokens);
  const system = input.system?.trim() || undefined;

  let text = "";
  if (provider === "anthropic") {
    text = await callAnthropic(apiKey, model, input.messages, system, maxTokens);
  } else if (provider === "google") {
    text = await callGoogle(apiKey, model, input.messages, system, maxTokens);
  } else if (provider === "openai") {
    text = await callOpenAI(apiKey, model, input.messages, system, maxTokens);
  } else {
    text = await callMistral(apiKey, model, input.messages, system, maxTokens);
  }

  if (!text) throw new LLMError(`${provider} 未回傳可用文字`, 502);
  return { text, provider, model };
}
