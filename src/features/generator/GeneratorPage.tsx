import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ASPECT_RATIO_OPTIONS,
  DEFAULT_CONFIG,
  getModelOptionById,
  MODEL_OPTIONS,
  STORAGE_KEYS,
} from '../../constants/generator';
import { generateImage } from '../../services/bltcyClient';
import type { BatchSummary, GenerationTask, InputAsset } from '../../types/generator';
import { copyText } from '../../utils/clipboard';
import { dataUrlToBlob, generateId, sanitizeFileName } from '../../utils/file';
import { downloadBlob, downloadTasksAsZip, fetchImageBlob } from '../../utils/download';
import { readStoredValue, writeStoredValue } from '../../utils/storage';

type Notice = {
  type: 'success' | 'error';
  message: string;
} | null;

const URL_PATTERN = /^https?:\/\/.+/i;
const ENABLED_MODEL_ID = 'nano-banana';

export function GeneratorPage() {
  const storedModelId = readStoredValue(STORAGE_KEYS.selectedModel);
  const initialModel = storedModelId === ENABLED_MODEL_ID ? storedModelId : DEFAULT_CONFIG.model;

  const [config, setConfig] = useState(() => ({
    apiKey: readStoredValue(STORAGE_KEYS.apiKey) || DEFAULT_CONFIG.apiKey,
    model: getModelOptionById(initialModel).id,
    aspectRatio:
      (readStoredValue(STORAGE_KEYS.selectedAspectRatio) as typeof DEFAULT_CONFIG.aspectRatio) ||
      DEFAULT_CONFIG.aspectRatio,
    prompt: readStoredValue(STORAGE_KEYS.lastPrompt) || DEFAULT_CONFIG.prompt,
  }));
  const [urlInput, setUrlInput] = useState('');
  const [uploadedAssets, setUploadedAssets] = useState<InputAsset[]>([]);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedAssetsRef = useRef<InputAsset[]>([]);

  useEffect(() => {
    writeStoredValue(STORAGE_KEYS.apiKey, config.apiKey);
  }, [config.apiKey]);

  useEffect(() => {
    writeStoredValue(STORAGE_KEYS.selectedModel, config.model);
  }, [config.model]);

  useEffect(() => {
    writeStoredValue(STORAGE_KEYS.selectedAspectRatio, config.aspectRatio);
  }, [config.aspectRatio]);

  useEffect(() => {
    writeStoredValue(STORAGE_KEYS.lastPrompt, config.prompt);
  }, [config.prompt]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    uploadedAssetsRef.current = uploadedAssets;
  }, [uploadedAssets]);

  useEffect(() => {
    return () => {
      uploadedAssetsRef.current.forEach((asset) => {
        if (asset.kind === 'upload') {
          URL.revokeObjectURL(asset.previewUrl);
        }
      });
    };
  }, []);

  const summary = useMemo<BatchSummary>(() => {
    return tasks.reduce(
      (accumulator, task) => {
        accumulator.total += 1;
        if (task.status === 'running') {
          accumulator.running += 1;
        }
        if (task.status === 'success') {
          accumulator.success += 1;
        }
        if (task.status === 'error') {
          accumulator.error += 1;
        }
        return accumulator;
      },
      { total: 0, running: 0, success: 0, error: 0 },
    );
  }, [tasks]);

  const successfulTasks = useMemo(
    () => tasks.filter((task) => task.status === 'success' && task.result),
    [tasks],
  );

  const failedTasks = useMemo(() => tasks.filter((task) => task.status === 'error'), [tasks]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const assets: InputAsset[] = files.map((file) => ({
      id: generateId(),
      kind: 'upload',
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    }));

    setUploadedAssets((current) => [...current, ...assets]);
    setFormError('');
    event.target.value = '';
  }

  function removeUploadedAsset(assetId: string) {
    setUploadedAssets((current) => current.filter((asset) => asset.id !== assetId));
  }

  function parseUrlAssets() {
    const lines = urlInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const invalidLine = lines.find((line) => !URL_PATTERN.test(line));
    if (invalidLine) {
      throw new Error(`存在无效图片 URL：${invalidLine}`);
    }

    return lines.map<InputAsset>((value, index) => ({
      id: generateId(),
      kind: 'url',
      value,
      previewUrl: value,
      name: `image-url-${index + 1}`,
    }));
  }

  function buildTasks() {
    const urlAssets = parseUrlAssets();
    const allAssets = [...uploadedAssets, ...urlAssets];

    if (!config.apiKey.trim()) {
      throw new Error('请先填写 API Key。');
    }

    if (allAssets.length === 0) {
      throw new Error('请至少上传一张图片或填写一个图片 URL。');
    }

    return allAssets.map<GenerationTask>((source) => ({
      id: generateId(),
      source,
      status: 'idle',
    }));
  }

  async function handleGenerate() {
    try {
      setFormError('');
      const nextTasks = buildTasks();
      setTasks(nextTasks);
      setNotice(null);
      setIsGenerating(true);
      await runTaskQueue(nextTasks);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  }

  async function runTaskQueue(queue: GenerationTask[]) {
    for (const task of queue) {
      await executeTask(task);
    }
  }

  async function executeTask(task: GenerationTask) {
    updateTask(task.id, {
      status: 'running',
      errorMessage: undefined,
      result: undefined,
    });

    try {
      const result = await generateImage({
        apiKey: config.apiKey.trim(),
        model: config.model,
        aspectRatio: config.aspectRatio,
        prompt: config.prompt,
        source: task.source,
      });

      updateTask(task.id, {
        status: 'success',
        result,
      });
    } catch (error) {
      updateTask(task.id, {
        status: 'error',
        errorMessage: getErrorMessage(error),
      });
    }
  }

  function updateTask(taskId: string, patch: Partial<GenerationTask>) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    );
  }

  async function retryTask(taskId: string) {
    const target = tasks.find((task) => task.id === taskId);
    if (!target) {
      return;
    }

    await executeTask(target);
  }

  async function ensureTaskBlob(task: GenerationTask) {
    if (task.result?.imageBlob) {
      return task.result.imageBlob;
    }

    const result = task.result;
    if (!result) {
      throw new Error('该任务还没有可下载结果。');
    }

    const imageUrl = result.imageUrl;
    if (!imageUrl) {
      throw new Error('该任务还没有可下载结果。');
    }

    const imageBlob = imageUrl.startsWith('data:')
      ? await dataUrlToBlob(imageUrl)
      : await fetchImageBlob(imageUrl);

    updateTask(task.id, {
      result: {
        ...result,
        imageBlob,
      },
    });

    return imageBlob;
  }

  async function handleDownload(task: GenerationTask) {
    try {
      const blob = await ensureTaskBlob(task);
      downloadBlob(blob, `${sanitizeFileName(task.source.name)}-result.png`);
      setNotice({ type: 'success', message: '图片已开始下载。' });
    } catch (error) {
      setNotice({ type: 'error', message: getErrorMessage(error) });
    }
  }

  async function handleDownloadZip() {
    if (successfulTasks.length === 0) {
      return;
    }

    try {
      const preparedTasks: GenerationTask[] = [];

      for (const task of successfulTasks) {
        const imageBlob = await ensureTaskBlob(task);
        preparedTasks.push({
          ...task,
          result: {
            ...task.result!,
            imageBlob,
          },
        });
      }

      await downloadTasksAsZip(preparedTasks);
      setNotice({ type: 'success', message: 'ZIP 打包完成，已开始下载。' });
    } catch (error) {
      setNotice({ type: 'error', message: getErrorMessage(error) });
    }
  }

  async function handleCopyOne(task: GenerationTask) {
    const targetUrl = task.result?.imageUrl;
    if (!targetUrl || !isCopyableUrl(targetUrl)) {
      setNotice({ type: 'error', message: '当前模型未返回公网 URL。' });
      return;
    }

    try {
      await copyText(targetUrl);
      setNotice({ type: 'success', message: '图片 URL 已复制。' });
    } catch (error) {
      setNotice({ type: 'error', message: getErrorMessage(error) });
    }
  }

  async function handleCopyAll() {
    if (successfulTasks.length === 0) {
      return;
    }

    try {
      const urls = successfulTasks
        .map((task) => task.result?.imageUrl)
        .filter((value): value is string => Boolean(value && isCopyableUrl(value)));
      if (urls.length === 0) {
        throw new Error('当前没有可复制的公网 URL。');
      }

      await copyText(
        urls.join('\n'),
      );
      setNotice({ type: 'success', message: '全部成功 URL 已复制。' });
    } catch (error) {
      setNotice({ type: 'error', message: getErrorMessage(error) });
    }
  }

  return (
    <main className="page-shell">
      <div className="page-shell__glow page-shell__glow--left" />
      <div className="page-shell__glow page-shell__glow--right" />

      <section className="hero">
        <div className="hero__icon">🪄</div>
        <div>
          <h1>商品图片生成</h1>
          <p>支持上传图片和多行 URL，逐张展示进度、失败原因、下载与复制。</p>
        </div>
      </section>

      {notice ? <div className={`notice notice--${notice.type}`}>{notice.message}</div> : null}

      <SectionCard title="生成配置">
        <div className="config-grid">
          <label className="field">
            <span className="field__label">
              API Key <em>（必填）</em>
            </span>
            <input
              className="field__control"
              type="password"
              placeholder="输入 bltcy.ai API Key"
              value={config.apiKey}
              onChange={(event) =>
                setConfig((current) => ({ ...current, apiKey: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span className="field__label">模型</span>
            <select
              className="field__control"
              value={config.model}
              onChange={(event) =>
                setConfig((current) => ({ ...current, model: event.target.value }))
              }
            >
              {MODEL_OPTIONS.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                  disabled={option.id !== ENABLED_MODEL_ID}
                >
                  {option.label}（{option.priceHint}）
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">图片比例</span>
            <select
              className="field__control"
              value={config.aspectRatio}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  aspectRatio: event.target.value as typeof current.aspectRatio,
                }))
              }
            >
              {ASPECT_RATIO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span className="field__label">图片 URL（支持多个，每行一个）</span>
          <textarea
            className="field__control field__control--textarea"
            placeholder={'https://example.com/image1.png\nhttps://example.com/image2.jpg'}
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">提示词（可选，全局生效）</span>
          <textarea
            className="field__control field__control--textarea"
            placeholder="描述你想要的图片效果，比如：高级棚拍光影、纯净背景、商品特写..."
            value={config.prompt}
            onChange={(event) =>
              setConfig((current) => ({ ...current, prompt: event.target.value }))
            }
          />
        </label>

        <div className="upload-bar">
          <button
            className="secondary-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            上传图片
          </button>
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />

          <button className="primary-button" type="button" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? '生成中...' : '生成图片'}
          </button>
        </div>

        {formError ? <div className="form-error">{formError}</div> : null}

        {uploadedAssets.length > 0 ? (
          <div className="asset-list">
            {uploadedAssets.map((asset) => (
              <div className="asset-chip" key={asset.id}>
                <img src={asset.previewUrl} alt={asset.name} />
                <span>{asset.name}</span>
                <button type="button" onClick={() => removeUploadedAsset(asset.id)}>
                  移除
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>

      <div className="content-grid">
        <SectionCard
          title="任务列表"
          description="逐张执行，互不阻塞。失败项保留原因并支持单张重试。"
          actions={
            <div className="summary-pills">
              <span>总数 {summary.total}</span>
              <span>成功 {summary.success}</span>
              <span>失败 {summary.error}</span>
              <span>进行中 {summary.running}</span>
            </div>
          }
        >
          {tasks.length === 0 ? (
            <div className="empty-state">还没有任务。上传商品图或粘贴 URL 后开始生成。</div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <img className="task-card__preview" src={task.source.previewUrl} alt={task.source.name} />
                  <div className="task-card__body">
                    <div className="task-card__topline">
                      <strong>{task.source.name}</strong>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="task-card__meta">
                      来源：{task.source.kind === 'upload' ? '本地上传' : '图片 URL'}
                    </p>
                    {task.errorMessage ? <p className="task-card__error">{task.errorMessage}</p> : null}
                    <div className="task-card__actions">
                      <button
                        className="text-button"
                        type="button"
                        disabled={task.status === 'running'}
                        onClick={() => retryTask(task.id)}
                      >
                        单张重试
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="生成结果"
          description="支持单张预览、下载、复制 URL，也支持打包 ZIP 和批量复制。"
          actions={
            <div className="result-actions">
              <button
                className="secondary-button secondary-button--compact"
                type="button"
                onClick={handleCopyAll}
                disabled={successfulTasks.length === 0}
              >
                批量复制 URL
              </button>
              <button
                className="primary-button primary-button--compact"
                type="button"
                onClick={handleDownloadZip}
                disabled={successfulTasks.length === 0}
              >
                打包 ZIP 下载
              </button>
            </div>
          }
        >
          {successfulTasks.length === 0 ? (
            <div className="empty-state">
              {failedTasks.length > 0
                ? '当前没有成功结果，可以在左侧重试失败任务。'
                : '生成结果会显示在这里。'}
            </div>
          ) : (
            <div className="result-grid">
              {successfulTasks.map((task) => (
                <article className="result-card" key={task.id}>
                  <button
                    type="button"
                    className="result-card__preview"
                    onClick={() => setPreviewUrl(task.result?.imageUrl ?? null)}
                  >
                    <img src={task.result?.imageUrl} alt={task.source.name} />
                  </button>
                  <div className="result-card__body">
                    <strong>{task.source.name}</strong>
                    <p>{task.result?.revisedPrompt || '结果图已生成，可直接预览和下载。'}</p>
                    <div className="result-card__actions">
                      <button className="text-button" type="button" onClick={() => handleDownload(task)}>
                        下载
                      </button>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => handleCopyOne(task)}
                        disabled={!task.result?.imageUrl || !isCopyableUrl(task.result.imageUrl)}
                      >
                        复制 URL
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {previewUrl ? (
        <div className="preview-modal" role="dialog" aria-modal="true" onClick={() => setPreviewUrl(null)}>
          <div className="preview-modal__content" onClick={(event) => event.stopPropagation()}>
            <button className="preview-modal__close" type="button" onClick={() => setPreviewUrl(null)}>
              ×
            </button>
            <img src={previewUrl} alt="生成结果预览" />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '发生未知错误，请稍后重试。';
}

function isCopyableUrl(value: string) {
  return /^https?:\/\//i.test(value);
}
