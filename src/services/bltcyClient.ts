import {
  ASPECT_RATIO_TO_SIZE,
  BLTCY_BASE_URL,
  DEFAULT_PROMPT,
} from '../constants/generator';
import { fileToDataUrl } from '../utils/file';
import type { GenerateImageParams } from '../types/generator';

interface BltcyImageItem {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
}

interface BltcyImageResponse {
  data?: BltcyImageItem[];
  error?: {
    message?: string;
  };
  message?: string;
}

export async function generateImage(params: GenerateImageParams) {
  const payload = {
    model: params.model,
    prompt: params.prompt.trim() || DEFAULT_PROMPT,
    image: [await resolveSourceValue(params)],
    aspect_ratio: params.aspectRatio,
    size: ASPECT_RATIO_TO_SIZE[params.aspectRatio],
    n: 1,
    response_format: 'url',
  };

  const response = await fetch(`${BLTCY_BASE_URL}/v1/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = (await response.json().catch(() => null)) as BltcyImageResponse | null;

  if (!response.ok) {
    throw new Error(
      json?.error?.message ?? json?.message ?? '生图请求失败，请检查 Key 或稍后重试。',
    );
  }

  const item = json?.data?.[0];
  if (!item) {
    throw new Error('未收到结果图，请稍后重试。');
  }

  if (item.url) {
    return {
      imageUrl: item.url,
      revisedPrompt: item.revised_prompt,
    };
  }

  if (item.b64_json) {
    return {
      imageUrl: `data:image/png;base64,${item.b64_json}`,
      revisedPrompt: item.revised_prompt,
    };
  }

  throw new Error('返回结果格式不支持，请切换模型后再试。');
}

async function resolveSourceValue(params: GenerateImageParams) {
  if (params.source.kind === 'url') {
    return params.source.value;
  }

  return fileToDataUrl(params.source.file);
}
