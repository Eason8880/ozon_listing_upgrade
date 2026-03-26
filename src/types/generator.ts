export type AspectRatioOption = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export type TaskStatus = 'idle' | 'running' | 'success' | 'error';

export interface ModelOption {
  id: string;
  label: string;
  priceHint: string;
}

export interface GeneratorConfig {
  apiKey: string;
  model: string;
  aspectRatio: AspectRatioOption;
  prompt: string;
}

export interface UrlAsset {
  id: string;
  kind: 'url';
  value: string;
  previewUrl: string;
  name: string;
}

export interface UploadAsset {
  id: string;
  kind: 'upload';
  file: File;
  previewUrl: string;
  name: string;
}

export type InputAsset = UrlAsset | UploadAsset;

export interface GenerationResult {
  imageUrl: string;
  revisedPrompt?: string;
  imageBlob?: Blob;
}

export interface GenerationTask {
  id: string;
  source: InputAsset;
  status: TaskStatus;
  errorMessage?: string;
  result?: GenerationResult;
}

export interface BatchSummary {
  total: number;
  running: number;
  success: number;
  error: number;
}

export interface GenerateImageParams {
  apiKey: string;
  model: string;
  aspectRatio: AspectRatioOption;
  prompt: string;
  source: InputAsset;
}
