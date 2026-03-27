import { OPENROUTER_BASE_URL, OPENROUTER_PROXY_PATH } from '../constants/excelTranslator';
import type {
  TranslateBatchParams,
  TranslateBatchResultItem,
} from '../types/excelTranslator';

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

interface ParsedTranslationPayload {
  items?: Array<{
    name?: string;
    description?: string;
  }>;
}

interface OpenRouterPayload {
  model: string;
  temperature: number;
  response_format: {
    type: 'json_object';
  };
  messages: Array<{
    role: 'system' | 'user';
    content: string;
  }>;
}

export async function translateBatch(
  params: TranslateBatchParams,
): Promise<TranslateBatchResultItem[]> {
  if (params.items.length === 0) {
    return [];
  }

  const payload = buildPayload(params);
  let json: OpenRouterResponse | null;

  try {
    json = await requestOpenRouterDirect(params.apiKey, payload);
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error;
    }

    json = await requestOpenRouterProxy(params.apiKey, payload);
  }

  const rawContent = json?.choices?.[0]?.message?.content?.trim();
  if (!rawContent) {
    throw new Error('OpenRouter 未返回可解析内容，请重试。');
  }

  const parsed = safeParsePayload(rawContent);
  const translatedItems = parsed.items;
  if (!Array.isArray(translatedItems) || translatedItems.length !== params.items.length) {
    throw new Error('模型返回格式不符合预期，请重试或切换模型。');
  }

  return translatedItems.map((item, index) => ({
    nameRu: typeof item?.name === 'string' ? item.name.trim() : params.items[index].nameText,
    descriptionRu:
      typeof item?.description === 'string'
        ? item.description.trim()
        : params.items[index].descriptionText,
  }));
}

function buildPayload(params: TranslateBatchParams): OpenRouterPayload {
  return {
    model: params.model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          '你是电商文案翻译助手。请把输入转换成俄语，保持自然、准确，不要新增营销夸张词。',
      },
      {
        role: 'user',
        content: [
          '请将下面数组逐条翻译为俄语，仅返回 JSON 对象。',
          '格式必须是：{"items":[{"name":"...","description":"..."}]}',
          `数组长度必须为 ${params.items.length}，顺序必须与输入一致。`,
          `输入：${JSON.stringify(params.items)}`,
        ].join('\n'),
      },
    ],
  };
}

async function requestOpenRouterDirect(apiKey: string, payload: OpenRouterPayload) {
  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'ozon-listing-upgrade',
    },
    body: JSON.stringify(payload),
  });

  return parseOpenRouterResponse(response);
}

async function requestOpenRouterProxy(apiKey: string, payload: OpenRouterPayload) {
  const response = await fetch(OPENROUTER_PROXY_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      payload,
    }),
  });

  if (response.status === 404) {
    throw new Error('请求失败：当前环境未启用 OpenRouter 代理接口。');
  }

  return parseOpenRouterResponse(response);
}

async function parseOpenRouterResponse(response: Response) {
  const json = (await response.json().catch(() => null)) as OpenRouterResponse | null;
  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'OpenRouter 请求失败，请检查 API Key 或稍后重试。');
  }
  return json;
}

function isNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed')
  );
}

function safeParsePayload(content: string): ParsedTranslationPayload {
  try {
    return JSON.parse(content) as ParsedTranslationPayload;
  } catch {
    const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (!fencedMatch?.[1]) {
      throw new Error('模型返回内容不是 JSON，请重试。');
    }

    try {
      return JSON.parse(fencedMatch[1]) as ParsedTranslationPayload;
    } catch {
      throw new Error('模型返回 JSON 解析失败，请重试。');
    }
  }
}
