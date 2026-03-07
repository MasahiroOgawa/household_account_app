import { configLoader } from '../config/configLoader';
import { CategoryMapping } from '../../types/Category';

const normalizeWhitespace = (str: string) => str.replace(/\s+/g, ' ').trim();

const resolveMappingValue = (
  value: string | { income: string; expense: string },
  transactionType?: 'income' | 'expense'
): string => {
  if (typeof value === 'string') return value;
  return transactionType === 'income' ? value.income : value.expense;
};

type SplitSubcategories = { income: Record<string, string>; expense: Record<string, string> };

const getSubcategoryMap = (
  subcategories: CategoryMapping['subcategories'],
  transactionType?: 'income' | 'expense'
): Record<string, string> => {
  if (!subcategories) return {};
  if ('income' in subcategories && 'expense' in subcategories) {
    const split = subcategories as SplitSubcategories;
    return transactionType === 'income' ? split.income : split.expense;
  }
  return subcategories as Record<string, string>;
};

export const detectCategory = (description: string, transactionType?: 'income' | 'expense'): string => {
  const mapping = configLoader.getCategoryMapping();
  const normalizedDescription = normalizeWhitespace(description);
  const subcatMap = getSubcategoryMap(mapping.subcategories, transactionType);

  // Exact match
  if (mapping.mappings[description]) {
    const rawCategory = resolveMappingValue(mapping.mappings[description], transactionType);
    if (subcatMap[rawCategory]) {
      return subcatMap[rawCategory];
    }
    return rawCategory;
  }

  // Prefix match (handles cases like "三菱ＮＦＪ銀行 三島支店 普通預金...")
  for (const [keyword, value] of Object.entries(mapping.mappings)) {
    const normalizedKeyword = normalizeWhitespace(keyword);
    if (normalizedDescription.startsWith(normalizedKeyword)) {
      const category = resolveMappingValue(value, transactionType);
      if (subcatMap[category]) {
        return subcatMap[category];
      }
      return category;
    }
  }

  // Partial match (contains)
  const lowerDescription = normalizedDescription.toLowerCase();
  for (const [keyword, value] of Object.entries(mapping.mappings)) {
    const normalizedKeyword = normalizeWhitespace(keyword).toLowerCase();
    if (lowerDescription.includes(normalizedKeyword)) {
      const category = resolveMappingValue(value, transactionType);
      if (subcatMap[category]) {
        return subcatMap[category];
      }
      return category;
    }
  }

  // Income pattern detection
  if (transactionType === 'income') {
    if (lowerDescription.includes('atm') || lowerDescription.includes('ａｔｍ') ||
        lowerDescription.includes('出金') || lowerDescription.includes('引出') ||
        lowerDescription.includes('引き出') || lowerDescription.includes('現金')) {
      return 'withdraw';
    }
    if (lowerDescription.includes('給与') || lowerDescription.includes('給料') ||
        lowerDescription.includes('賞与') || lowerDescription.includes('salary') ||
        lowerDescription.includes('ボーナス')) {
      return 'salary';
    }
    if (lowerDescription.includes('還付') || lowerDescription.includes('税') ||
        lowerDescription.includes('refund')) {
      return 'country_refund';
    }
    if (lowerDescription.includes('返金') || lowerDescription.includes('払戻')) {
      return 'company_refund';
    }
    if (lowerDescription.includes('振込') || lowerDescription.includes('振替')) {
      return 'withdraw';
    }
  }

  // Default category
  if (mapping.defaultCategory) {
    if (typeof mapping.defaultCategory === 'object') {
      return transactionType === 'income'
        ? mapping.defaultCategory.income
        : mapping.defaultCategory.expense;
    }
    return mapping.defaultCategory;
  }

  return transactionType === 'income' ? 'other_income' : 'other_expense';
};

export const isInternalTransfer = (description: string): boolean => {
  const mapping = configLoader.getColumnMapping();
  const lowerDescription = description.toLowerCase();
  return mapping.internalTransferPatterns.some(pattern =>
    lowerDescription.includes(pattern.toLowerCase())
  );
};

export const isFee = (description: string): boolean => {
  const mapping = configLoader.getColumnMapping();
  const lowerDescription = description.toLowerCase();
  return mapping.feePatterns.some(pattern =>
    lowerDescription.includes(pattern.toLowerCase())
  );
};
