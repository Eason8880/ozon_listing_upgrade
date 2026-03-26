import JSZip from 'jszip';

import { sanitizeFileName } from './file';
import type { GenerationTask } from '../types/generator';

export async function fetchImageBlob(imageUrl: string) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error('结果图抓取失败，暂时无法下载。');
  }

  return response.blob();
}

export function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadTasksAsZip(tasks: GenerationTask[]) {
  const zip = new JSZip();

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    if (!task.result?.imageBlob) {
      continue;
    }

    const extension = guessExtension(task.result.imageBlob.type);
    const fileName = `${String(index + 1).padStart(2, '0')}-${sanitizeFileName(task.source.name)}.${extension}`;
    zip.file(fileName, task.result.imageBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `generated-images-${Date.now()}.zip`);
}

function guessExtension(mimeType: string) {
  if (mimeType.includes('png')) {
    return 'png';
  }
  if (mimeType.includes('webp')) {
    return 'webp';
  }
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return 'jpg';
  }

  return 'png';
}
