import * as XLSX from 'xlsx';

import { SOURCE_COLUMN_DEFINITIONS, TARGET_COLUMNS } from '../constants/excelTranslator';
import type { OzonResultRow, SourceColumnKey, SourceRow } from '../types/excelTranslator';

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
      productName: getCellValue(row, matched.matchedIndices.productName),
      weightGram: getCellValue(row, matched.matchedIndices.weightGram),
      widthCm: getCellValue(row, matched.matchedIndices.widthCm),
      heightCm: getCellValue(row, matched.matchedIndices.heightCm),
      lengthCm: getCellValue(row, matched.matchedIndices.lengthCm),
      specImage: getCellValue(row, matched.matchedIndices.specImage),
      allImagesLink1: getCellValue(row, matched.matchedIndices.allImagesLink1),
      descriptionNoImage: getCellValue(row, matched.matchedIndices.descriptionNoImage),
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

export function multiplyCentimeterToMillimeter(input: string) {
  const value = String(input ?? '').trim();
  if (!value) {
    return '';
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }

  const multiplied = numeric * 10;
  return Number.isInteger(multiplied) ? String(multiplied) : multiplied.toFixed(2);
}

export function normalizeExtraImageLinks(input: string) {
  return String(input ?? '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeDescriptionLineBreaks(input: string) {
  return String(input ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\r\n/g, '\n')
    .trim();
}

export function buildResultWorkbookBuffer(rows: OzonResultRow[]) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [...TARGET_COLUMNS],
    ...rows.map((row) => [
      row['货号*'] ?? '',
      row['商品名称'] ?? '',
      row['价格，USD*'] ?? '',
      row['折扣前价格，USD'] ?? '',
      row['毛重，克*'] ?? '',
      row['包装宽度，毫米*'] ?? '',
      row['包装高度，毫米*'] ?? '',
      row['包装长度，毫米*'] ?? '',
      row['主图链接*'] ?? '',
      row['附加图片链接'] ?? '',
      row['品牌*'] ?? '',
      row['型号名称*'] ?? '',
      row['颜色样本'] ?? '',
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
