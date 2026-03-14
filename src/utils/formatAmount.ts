export const formatAmount = (amount: number): string => {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return amount.toString();
};
