export type OpenRouterModelId = 'google/gemini-2.5-flash' | 'openai/gpt-4o-mini';

export interface OpenRouterModelOption {
  id: OpenRouterModelId;
  label: string;
}

export interface ExcelTranslatorConfig {
  apiKey: string;
  model: OpenRouterModelId;
}

export type SourceColumnKey =
  | 'sellerSku'
  | 'erpId'
  | 'productName'
  | 'weightGram'
  | 'widthCm'
  | 'heightCm'
  | 'lengthCm'
  | 'specImage'
  | 'allImagesLink1'
  | 'descriptionNoImage';

export interface SourceColumnDefinition {
  key: SourceColumnKey;
  label: string;
  aliases: string[];
}

export interface SourceRow {
  sellerSku: string;
  erpId: string;
  productName: string;
  weightGram: string;
  widthCm: string;
  heightCm: string;
  lengthCm: string;
  specImage: string;
  allImagesLink1: string;
  descriptionNoImage: string;
}

export interface OzonResultRow {
  '货号*': string;
  商品名称: string;
  '价格，USD*': string;
  '折扣前价格，USD': string;
  '毛重，克*': string;
  '包装宽度，毫米*': string;
  '包装高度，毫米*': string;
  '包装长度，毫米*': string;
  '主图链接*': string;
  附加图片链接: string;
  '品牌*': string;
  '型号名称*': string;
  颜色样本: string;
  简介: string;
}

export interface TranslateBatchItem {
  nameText: string;
  descriptionText: string;
}

export interface TranslateBatchParams {
  apiKey: string;
  model: OpenRouterModelId;
  items: TranslateBatchItem[];
}

export interface TranslateBatchResultItem {
  nameRu: string;
  descriptionRu: string;
}
