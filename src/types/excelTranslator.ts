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
  | 'productAttribute'
  | 'productName'
  | 'weightG'
  | 'dimensions'
  | 'mainImage'
  | 'extraImage'
  | 'description';

export interface SourceColumnDefinition {
  key: SourceColumnKey;
  label: string;
  aliases: string[];
}

export interface SourceRow {
  sellerSku: string;
  erpId: string;
  productAttribute: string;
  productName: string;
  weightG: string;
  dimensions: string;
  mainImage: string;
  extraImage: string;
  description: string;
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
