import * as XLSX from 'xlsx';

import { SOURCE_COLUMN_DEFINITIONS } from '../constants/excelTranslator';
import type { SourceColumnKey, SourceRow } from '../types/excelTranslator';

interface SourceColumnMatchResult {
  matchedIndices: Record<SourceColumnKey, number>;
  missingLabels: string[];
}

export async function parseSourceRowsFromExcel(file: File): Promise<SourceRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel 没有可读取的工作表。');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });
  if (rows.length === 0) {
    throw new Error('Excel 为空，请检查文件内容。');
  }

  const headerRow = rows[0].map((cell) => String(cell ?? '').trim());
  const matched = matchSourceColumns(headerRow);
  if (matched.missingLabels.length > 0) {
    throw new Error(`缺少必需列：${matched.missingLabels.join('、')}`);
  }

  const dataRows = rows.slice(1).map((row) => {
    return {
      sellerSku: getCellValue(row, matched.matchedIndices.sellerSku),
      erpId: getCellValue(row, matched.matchedIndices.erpId),
      productAttribute: getCellValue(row, matched.matchedIndices.productAttribute),
      productName: getCellValue(row, matched.matchedIndices.productName),
      weightG: getCellValue(row, matched.matchedIndices.weightG),
      dimensions: getCellValue(row, matched.matchedIndices.dimensions),
      mainImage: getCellValue(row, matched.matchedIndices.mainImage),
      extraImage: getCellValue(row, matched.matchedIndices.extraImage),
      description: getCellValue(row, matched.matchedIndices.description),
    };
  });

  const nonEmptyRows = dataRows.filter((row) => Object.values(row).some((value) => Boolean(value)));
  if (nonEmptyRows.length === 0) {
    throw new Error('Excel 中没有可处理的数据行。');
  }

  return nonEmptyRows;
}

export function normalizeHeader(input: string) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[（）()【】\[\]{}]/g, '')
    .replace(/[\/_－—-]/g, '')
    .replace(/\s+/g, '');
}

export function removeLastChars(input: string, count = 8) {
  const value = String(input ?? '').trim();
  if (!value) {
    return '';
  }
  if (value.length <= count) {
    return value;
  }
  return value.slice(0, value.length - count).trim();
}

export function multiplyDimensionsByTen(input: string) {
  const value = String(input ?? '').trim();
  if (!value) {
    return '';
  }

  return value.replace(/-?\d+(?:\.\d+)?/g, (numberText) => {
    const numeric = Number(numberText);
    if (Number.isNaN(numeric)) {
      return numberText;
    }
    const multiplied = numeric * 10;
    return Number.isInteger(multiplied) ? String(multiplied) : multiplied.toFixed(2);
  });
}

export function shuffleByWhitespace(input: string) {
  const tokens = String(input ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  for (let index = tokens.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [tokens[index], tokens[randomIndex]] = [tokens[randomIndex], tokens[index]];
  }

  return tokens.join(' ');
}

export function buildResultWorkbookBuffer(rows: Array<Record<string, string>>) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['货号*', '型号名称*', '商品颜色', '商品名称', '毛重', '宽/高/长', '主图链接*', '附加图片', '品牌*', '简介'],
    ...rows.map((row) => [
      row['货号*'] ?? '',
      row['型号名称*'] ?? '',
      row['商品颜色'] ?? '',
      row['商品名称'] ?? '',
      row['毛重'] ?? '',
      row['宽/高/长'] ?? '',
      row['主图链接*'] ?? '',
      row['附加图片'] ?? '',
      row['品牌*'] ?? '',
      row['简介'] ?? '',
    ]),
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'result');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

export function fileNameToResultName(sourceName: string) {
  const cleanedName = sourceName.replace(/\.(xlsx|xls)$/i, '');
  return `${cleanedName || 'translated'}-result.xlsx`;
}

function matchSourceColumns(headers: string[]): SourceColumnMatchResult {
  const normalizedHeaderMap = new Map<string, number>();
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (normalized && !normalizedHeaderMap.has(normalized)) {
      normalizedHeaderMap.set(normalized, index);
    }
  });

  const matchedIndices: Partial<Record<SourceColumnKey, number>> = {};
  const missingLabels: string[] = [];

  SOURCE_COLUMN_DEFINITIONS.forEach((definition) => {
    const candidates = [definition.label, ...definition.aliases].map(normalizeHeader);
    const matchedCandidate = candidates.find((candidate) => normalizedHeaderMap.has(candidate));
    if (!matchedCandidate) {
      missingLabels.push(definition.label);
      return;
    }
    matchedIndices[definition.key] = normalizedHeaderMap.get(matchedCandidate)!;
  });

  return {
    matchedIndices: matchedIndices as Record<SourceColumnKey, number>,
    missingLabels,
  };
}

function getCellValue(row: Array<string | number | null>, index: number) {
  return String(row[index] ?? '').trim();
}
