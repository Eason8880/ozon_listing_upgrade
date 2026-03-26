import type { AspectRatioOption, GeneratorConfig, ModelOption } from '../types/generator';

export const STORAGE_KEYS = {
  apiKey: 'apiKey',
  selectedModel: 'selectedModel',
  selectedAspectRatio: 'selectedAspectRatio',
  lastPrompt: 'lastPrompt',
} as const;

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'nano-banana',
    label: 'Nano Banana',
    priceHint: '推荐图生图',
  },
  {
    id: 'gpt-4o-image',
    label: 'GPT-4o Image',
    priceHint: '稳定出图',
  },
  {
    id: 'gemini-3.1-flash-image-preview-4k',
    label: 'Gemini 3.1 Flash Image Preview 4K',
    priceHint: '4K 预览',
  },
  {
    id: 'nano-banana-2-4k',
    label: 'Nano Banana 2 4K',
    priceHint: '高清图生图',
  },
];

export const ASPECT_RATIO_OPTIONS: Array<{
  value: AspectRatioOption;
  label: string;
  sizeHint: string;
}> = [
  { value: '3:4', label: '3:4 · 默认', sizeHint: '768x1024' },
  { value: '1:1', label: '1:1 · 方图', sizeHint: '1024x1024' },
  { value: '4:3', label: '4:3 · 横图', sizeHint: '1024x768' },
  { value: '9:16', label: '9:16 · 竖屏', sizeHint: '720x1280' },
  { value: '16:9', label: '16:9 · 宽屏', sizeHint: '1280x720' },
];

export const DEFAULT_PROMPT =
  '基于商品原图，生成一张适合电商详情页展示的高质量商品图，保留主体特征，提升画面质感。';

export const DEFAULT_CONFIG: GeneratorConfig = {
  apiKey: '',
  model: MODEL_OPTIONS[0].id,
  aspectRatio: '3:4',
  prompt: '',
};

export const BLTCY_BASE_URL = 'https://api.bltcy.ai';

export function getModelOptionById(modelId: string) {
  return MODEL_OPTIONS.find((option) => option.id === modelId) ?? MODEL_OPTIONS[0];
}

export const ASPECT_RATIO_TO_SIZE: Record<AspectRatioOption, string> = {
  '1:1': '1024x1024',
  '3:4': '768x1024',
  '4:3': '1024x768',
  '9:16': '720x1280',
  '16:9': '1280x720',
};
