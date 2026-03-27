import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from 'react';

import { SectionCard } from '../../components/SectionCard';
import {
  DEFAULT_OPENROUTER_MODEL,
  EXCEL_TRANSLATOR_STORAGE_KEYS,
  OPENROUTER_BATCH_SIZE,
  OPENROUTER_MODEL_OPTIONS,
} from '../../constants/excelTranslator';
import { translateBatch } from '../../services/openRouterClient';
import type { OpenRouterModelId, TranslateBatchResultItem } from '../../types/excelTranslator';
import { downloadBlob } from '../../utils/download';
import { sanitizeFileName } from '../../utils/file';
import {
  buildResultWorkbookBuffer,
  fileNameToResultName,
  multiplyCentimeterToMillimeter,
  normalizeDescriptionLineBreaks,
  normalizeExtraImageLinks,
  parseSourceRowsFromExcel,
  removeLastChars,
} from '../../utils/excelTranslator';
import { readStoredValue, writeStoredValue } from '../../utils/storage';

type Notice = {
  type: 'success' | 'error';
  message: string;
} | null;

const ACCEPT_EXTENSIONS = ['.xls', '.xlsx'];

interface SpuTranslationInput {
  spuKey: string;
  nameText: string;
  descriptionText: string;
}

export function ExcelTranslatorPage() {
  const storedModel = readStoredValue(EXCEL_TRANSLATOR_STORAGE_KEYS.selectedModel) as OpenRouterModelId;
  const initialModel = OPENROUTER_MODEL_OPTIONS.some((option) => option.id === storedModel)
    ? storedModel
    : DEFAULT_OPENROUTER_MODEL;

  const [apiKey, setApiKey] = useState(readStoredValue(EXCEL_TRANSLATOR_STORAGE_KEYS.apiKey));
  const [model, setModel] = useState<OpenRouterModelId>(initialModel);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    writeStoredValue(EXCEL_TRANSLATOR_STORAGE_KEYS.apiKey, apiKey);
  }, [apiKey]);

  useEffect(() => {
    writeStoredValue(EXCEL_TRANSLATOR_STORAGE_KEYS.selectedModel, model);
  }, [model]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const canProcess = useMemo(() => {
    return Boolean(selectedFile && apiKey.trim() && !isProcessing);
  }, [selectedFile, apiKey, isProcessing]);

  async function handleProcessAndDownload() {
    if (!selectedFile) {
      setErrorText('请先上传 Excel 文件。');
      return;
    }
    if (!apiKey.trim()) {
      setErrorText('请先填写 OpenRouter API Key。');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorText('');
      setNotice(null);

      setStatusText('正在读取 Excel...');
      const sourceRows = await parseSourceRowsFromExcel(selectedFile);

      const { translationInputs, rowSpuKeys } = buildSpuTranslationInputs(sourceRows);

      const translated = await translateInBatches(translationInputs);
      const translatedBySpu = new Map<string, TranslateBatchResultItem>();
      translationInputs.forEach((item, index) => {
        translatedBySpu.set(item.spuKey, translated[index]);
      });

      setStatusText('正在生成结果文件...');
      const resultRows = sourceRows.map((row, index) => {
        const translatedItem = translatedBySpu.get(rowSpuKeys[index]);
        if (!translatedItem) {
          throw new Error('翻译结果回填失败，请重试。');
        }

        return {
          '货号*': row.sellerSku,
          商品名称: translatedItem.nameRu,
          '价格，USD*': '',
          '折扣前价格，USD': '',
          '毛重，克*': row.weightGram,
          '包装宽度，毫米*': multiplyCentimeterToMillimeter(row.widthCm),
          '包装高度，毫米*': multiplyCentimeterToMillimeter(row.heightCm),
          '包装长度，毫米*': multiplyCentimeterToMillimeter(row.lengthCm),
          '主图链接*': row.specImage,
          附加图片链接: normalizeExtraImageLinks(row.allImagesLink1),
          '品牌*': 'Нет бренда',
          '型号名称*': row.erpId,
          颜色样本: row.specImage,
          简介: translatedItem.descriptionRu,
        };
      });

      const buffer = buildResultWorkbookBuffer(resultRows);
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const downloadName = sanitizeFileName(fileNameToResultName(selectedFile.name));
      downloadBlob(blob, downloadName);
      setNotice({ type: 'success', message: '处理完成，结果文件已开始下载。' });
      setStatusText('处理完成');
    } catch (error) {
      setErrorText(getErrorMessage(error));
      setStatusText('');
    } finally {
      setIsProcessing(false);
    }
  }

  async function translateInBatches(items: SpuTranslationInput[]) {
    const allResults: TranslateBatchResultItem[] = [];
    const totalBatchCount = Math.max(1, Math.ceil(items.length / OPENROUTER_BATCH_SIZE));

    for (let offset = 0; offset < items.length; offset += OPENROUTER_BATCH_SIZE) {
      const batchIndex = Math.floor(offset / OPENROUTER_BATCH_SIZE) + 1;
      setStatusText(`正在翻译 SPU 第 ${batchIndex}/${totalBatchCount} 批...`);
      const batchItems = items.slice(offset, offset + OPENROUTER_BATCH_SIZE);
      const batchResult = await translateBatch({
        apiKey: apiKey.trim(),
        model,
        items: batchItems.map((item) => ({
          nameText: item.nameText,
          descriptionText: item.descriptionText,
        })),
      });
      allResults.push(...batchResult);
    }

    return allResults;
  }

  function handleInputFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    applySelectedFile(file);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    applySelectedFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function applySelectedFile(file: File) {
    const name = file.name.toLowerCase();
    if (!ACCEPT_EXTENSIONS.some((extension) => name.endsWith(extension))) {
      setErrorText('仅支持 .xls / .xlsx 文件。');
      return;
    }
    if (file.size === 0) {
      setErrorText('文件内容为空，请重新上传。');
      return;
    }

    setSelectedFile(file);
    setErrorText('');
  }

  return (
    <>
      <section className="hero hero--compact">
        <div className="hero__icon">📄</div>
        <div>
          <h1>数据翻译</h1>
          <p>上传 Excel，按字段规则处理并生成新的俄语结果文件。</p>
        </div>
      </section>

      {notice ? <div className={`notice notice--${notice.type}`}>{notice.message}</div> : null}

      <SectionCard title="OpenRouter API 设置">
        <div className="config-grid config-grid--two">
          <label className="field">
            <span className="field__label">
              API Key <em>（必填）</em>
            </span>
            <input
              className="field__control"
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">翻译模型</span>
            <select
              className="field__control"
              value={model}
              onChange={(event) => setModel(event.target.value as OpenRouterModelId)}
            >
              {OPENROUTER_MODEL_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SectionCard>

      <SectionCard title="字段映射说明">
        <div className="mapping-grid">
          <p>货号* ← Seller SKU</p>
          <p>商品名称 ← 去后8位 + 俄语翻译</p>
          <p>价格，USD* ← 留空</p>
          <p>折扣前价格，USD ← 留空</p>
          <p>毛重，克* ← 商品重量(g)</p>
          <p>包装宽度，毫米* ← 商品宽度(cm)×10</p>
          <p>包装高度，毫米* ← 商品高度(cm)×10</p>
          <p>包装长度，毫米* ← 商品长度(cm)×10</p>
          <p>主图链接* ← 规格1图片</p>
          <p>附加图片链接 ← 所有图片链接1（逗号→空格）</p>
          <p>品牌* ← Нет бренда</p>
          <p>型号名称* ← ERP ID</p>
          <p>颜色样本 ← 规格1图片</p>
          <p>简介 ← 描述（不包括图片）俄语翻译</p>
          <p>同 SPU（ERP ID）只翻译首个 SKU，其他复用</p>
        </div>
      </SectionCard>

      <SectionCard title="上传并处理">
        <label
          className={`file-dropzone ${isDragging ? 'file-dropzone--dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            className="sr-only"
            type="file"
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleInputFileChange}
          />
          <div className="file-dropzone__icon">⇪</div>
          <strong>点击或拖拽上传 Excel</strong>
          <span>支持 .xls / .xlsx</span>
          {selectedFile ? <em>已选择：{selectedFile.name}</em> : null}
        </label>

        <button
          className="primary-button"
          type="button"
          disabled={!canProcess}
          onClick={handleProcessAndDownload}
        >
          {isProcessing ? '处理中...' : '处理并下载'}
        </button>

        {statusText ? <p className="status-line">{statusText}</p> : null}
        {errorText ? <div className="form-error">{errorText}</div> : null}
      </SectionCard>
    </>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '处理失败，请稍后重试。';
}

function buildSpuTranslationInputs(sourceRows: Array<{
  erpId: string;
  productName: string;
  descriptionNoImage: string;
}>) {
  const translationInputs: SpuTranslationInput[] = [];
  const rowSpuKeys: string[] = [];
  const seenSpuKeys = new Set<string>();

  sourceRows.forEach((row, index) => {
    const normalizedSpu = row.erpId.trim();
    const spuKey = normalizedSpu || `__row_${index}`;
    rowSpuKeys.push(spuKey);

    if (normalizedSpu && seenSpuKeys.has(spuKey)) {
      return;
    }

    seenSpuKeys.add(spuKey);
    translationInputs.push({
      spuKey,
      nameText: removeLastChars(row.productName, 8),
      descriptionText: normalizeDescriptionLineBreaks(row.descriptionNoImage),
    });
  });

  return { translationInputs, rowSpuKeys };
}
