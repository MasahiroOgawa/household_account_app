import { configLoader } from '../config/configLoader';

const normalizeWhitespace = (str: string) => str.replace(/\s+/g, ' ').trim();

const resolveMappingValue = (
  value: string | { income: string; expense: string },
  transactionType?: 'income' | 'expense'
): string => {
  if (typeof value === 'string') return value;
  return transactionType === 'income' ? value.income : value.expense;
};

export const detectCategory = (description: string, transactionType?: 'income' | 'expense'): string => {
  const mapping = configLoader.getCategoryMapping();
  const normalizedDescription = normalizeWhitespace(description);

  // Exact match — return raw subcategory key directly (e.g. "旅費交通費", "private-grocery")
  if (mapping.mappings[description]) {
    return resolveMappingValue(mapping.mappings[description], transactionType);
  }
  // Also try normalized description (fullwidth spaces → ASCII)
  if (mapping.mappings[normalizedDescription]) {
    return resolveMappingValue(mapping.mappings[normalizedDescription], transactionType);
  }

  // Prefix match (strip trailing "..." from truncated shopName keys)
  for (const [keyword, value] of Object.entries(mapping.mappings)) {
    const normalizedKeyword = normalizeWhitespace(keyword).replace(/\.{3}$/, '');
    if (normalizedKeyword && normalizedDescription.startsWith(normalizedKeyword)) {
      return resolveMappingValue(value, transactionType);
    }
  }

  // Partial match (contains)
  const lowerDescription = normalizedDescription.toLowerCase();
  for (const [keyword, value] of Object.entries(mapping.mappings)) {
    const normalizedKeyword = normalizeWhitespace(keyword).replace(/\.{3}$/, '').toLowerCase();
    if (normalizedKeyword && lowerDescription.includes(normalizedKeyword)) {
      return resolveMappingValue(value, transactionType);
    }
  }

  // Income pattern detection — return private-* versions
  if (transactionType === 'income') {
    if (lowerDescription.includes('atm') || lowerDescription.includes('ａｔｍ') ||
        lowerDescription.includes('出金') || lowerDescription.includes('引出') ||
        lowerDescription.includes('引き出') || lowerDescription.includes('現金')) {
      return 'private-withdraw';
    }
    if (lowerDescription.includes('給与') || lowerDescription.includes('給料') ||
        lowerDescription.includes('賞与') || lowerDescription.includes('salary') ||
        lowerDescription.includes('ボーナス')) {
      return 'private-salary';
    }
    if (lowerDescription.includes('還付') || lowerDescription.includes('税') ||
        lowerDescription.includes('refund')) {
      return 'private-tax_refund';
    }
    if (lowerDescription.includes('返金') || lowerDescription.includes('払戻')) {
      return 'private-company_refund';
    }
    if (lowerDescription.includes('振込') || lowerDescription.includes('振替')) {
      return 'private-other_income';
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

  return transactionType === 'income' ? 'private-other_income' : 'private-other_expense';
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
