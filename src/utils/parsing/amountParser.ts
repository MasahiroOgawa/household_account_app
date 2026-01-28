export const parseAmount = (amountString: string): number => {
  if (!amountString) return 0;

  let cleaned = amountString
    .replace(/[¥\\$€£]/g, '')
    .replace(/[\s"']/g, '')
    .replace(/,/g, '');

  // Handle parentheses for negative numbers
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }

  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
};

export const parseAbsoluteAmount = (amountString: string): number => {
  return Math.abs(parseAmount(amountString));
};

export const isNegativeAmount = (amountString: string): boolean => {
  if (!amountString) return false;
  const cleaned = amountString.toString().trim();
  return cleaned.startsWith('-') || (cleaned.startsWith('(') && cleaned.endsWith(')'));
};
