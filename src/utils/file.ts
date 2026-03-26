export function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('文件读取失败，请重新上传。'));
    };

    reader.onerror = () => reject(new Error('文件读取失败，请重新上传。'));
    reader.readAsDataURL(file);
  });
}

export async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('图片数据解析失败。');
  }
  return response.blob();
}

export function sanitizeFileName(input: string) {
  return input.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, '-');
}
