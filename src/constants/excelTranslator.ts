import type {
  OpenRouterModelOption,
  SourceColumnDefinition,
  SourceColumnKey,
} from '../types/excelTranslator';

export const EXCEL_TRANSLATOR_STORAGE_KEYS = {
  apiKey: 'excelTranslator.apiKey',
  selectedModel: 'excelTranslator.model',
} as const;

export const OPENROUTER_MODEL_OPTIONS: OpenRouterModelOption[] = [
  { id: 'google/gemini-2.5-flash', label: 'Google: Gemini 2.5 Flash' },
  { id: 'openai/gpt-4o-mini', label: 'OpenAI: GPT-4o-mini' },
];

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.5-flash';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const TARGET_COLUMNS = [
  '货号*',
  '商品名称',
  '价格，USD*',
  '折扣前价格，USD',
  '毛重，克*',
  '包装宽度，毫米*',
  '包装高度，毫米*',
  '包装长度，毫米*',
  '主图链接*',
  '附加图片链接',
  '品牌*',
  '型号名称*',
  '颜色样本',
  '简介',
] as const;

export const SOURCE_COLUMN_DEFINITIONS: SourceColumnDefinition[] = [
  {
    key: 'sellerSku',
    label: 'Seller SKU',
    aliases: ['seller sku', 'sellersku', 'seller_sku', 'seller-sku'],
  },
  {
    key: 'erpId',
    label: 'ERP ID',
    aliases: ['erp id', 'erpid', 'erp_id', 'erp-id'],
  },
  {
    key: 'productName',
    label: '商品名称',
    aliases: ['商品名称', '产品名称', 'name'],
  },
  {
    key: 'weightGram',
    label: '商品重量(g)',
    aliases: ['商品重量(g)', '商品重量g', '重量(g)', '重量g', 'weight(g)', 'weightg'],
  },
  {
    key: 'widthCm',
    label: '商品宽度(cm)',
    aliases: ['商品宽度(cm)', '商品宽度cm', '宽度(cm)', '宽度cm', 'width(cm)', 'widthcm'],
  },
  {
    key: 'heightCm',
    label: '商品高度(cm)',
    aliases: ['商品高度(cm)', '商品高度cm', '高度(cm)', '高度cm', 'height(cm)', 'heightcm'],
  },
  {
    key: 'lengthCm',
    label: '商品长度(cm)',
    aliases: ['商品长度(cm)', '商品长度cm', '长度(cm)', '长度cm', 'length(cm)', 'lengthcm'],
  },
  {
    key: 'specImage',
    label: '规格1图片',
    aliases: ['规格1图片', '规格图片', '规格图', '主图链接'],
  },
  {
    key: 'allImagesLink1',
    label: '所有图片链接1',
    aliases: ['所有图片链接1', '所有图片链接 1'],
  },
  {
    key: 'descriptionNoImage',
    label: '描述（不包括图片）',
    aliases: ['描述（不包括图片）', '描述(不包括图片)', '描述不包括图片'],
  },
];

export const REQUIRED_SOURCE_COLUMN_KEYS = SOURCE_COLUMN_DEFINITIONS.map(
  (definition) => definition.key,
) as SourceColumnKey[];

export const OPENROUTER_BATCH_SIZE = 20;
