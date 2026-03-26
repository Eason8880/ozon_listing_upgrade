import type { AspectRatioOption, GeneratorConfig, ModelOption } from '../types/generator';

export const STORAGE_KEYS = {
  apiKey: 'apiKey',
  selectedModel: 'selectedModel',
  selectedAspectRatio: 'selectedAspectRatio',
  lastPrompt: 'lastPrompt',
} as const;

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash-image-preview',
    label: 'Gemini 2.5 Flash',
    priceHint: '0.04元/次',
  },
  {
    id: 'nano-banana',
    label: 'Nano Banana',
    priceHint: '推荐图生图',
  },
  {
    id: 'doubao-seededit-3-0-i2i-250628',
    label: '即梦 3 图生图',
    priceHint: '细节编辑',
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

export const ASPECT_RATIO_TO_SIZE: Record<AspectRatioOption, string> = {
  '1:1': '1024x1024',
  '3:4': '768x1024',
  '4:3': '1024x768',
  '9:16': '720x1280',
  '16:9': '1280x720',
};
