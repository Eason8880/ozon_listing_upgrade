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
  '型号名称*',
  '商品颜色',
  '商品名称',
  '毛重',
  '宽/高/长',
  '主图链接*',
  '附加图片',
  '品牌*',
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
    key: 'productAttribute',
    label: '产品属性',
    aliases: ['产品属性', '商品属性', '颜色属性'],
  },
  {
    key: 'productName',
    label: '商品名称',
    aliases: ['商品名称', '产品名称', 'name'],
  },
  {
    key: 'weightG',
    label: 'g',
    aliases: ['g', '重量g', '重量', '毛重', 'weight', 'weightg'],
  },
  {
    key: 'dimensions',
    label: '宽/高/长',
    aliases: ['宽/高/长', '宽高长', '长宽高', '尺寸', '尺寸cm'],
  },
  {
    key: 'mainImage',
    label: '规格图片',
    aliases: ['规格图片', '主图链接', '主图', '规格图'],
  },
  {
    key: 'extraImage',
    label: '附加图片',
    aliases: ['附加图片', '附图', '副图'],
  },
  {
    key: 'description',
    label: '简介',
    aliases: ['简介', '商品简介', '描述', '商品描述'],
  },
];

export const REQUIRED_SOURCE_COLUMN_KEYS = SOURCE_COLUMN_DEFINITIONS.map(
  (definition) => definition.key,
) as SourceColumnKey[];

export const OPENROUTER_BATCH_SIZE = 20;
