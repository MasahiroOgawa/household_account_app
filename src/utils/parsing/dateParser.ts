import { parse, isValid } from 'date-fns';

export const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;

  dateString = dateString.trim();

  // Japanese date format (e.g., "2024年11月15日")
  if (dateString.includes('年') && dateString.includes('月') && dateString.includes('日')) {
    const japaneseMatch = dateString.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (japaneseMatch) {
      const [, year, month, day] = japaneseMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isValid(date)) return date;
    }
  }

  // YYYYMMDD format
  if (/^\d{8}$/.test(dateString)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    if (isValid(date)) return date;
  }

  // YYYY.MM.DD format
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('.');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValid(date)) return date;
  }

  // Common delimiter formats
  const formats = [
    'yyyy/MM/dd',
    'yyyy/M/d',
    'yyyy-MM-dd',
    'yyyy-M-d',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
  ];

  for (const formatString of formats) {
    try {
      const parsed = parse(dateString, formatString, new Date());
      if (isValid(parsed)) return parsed;
    } catch {
      continue;
    }
  }

  // Native parsing as last resort
  const nativeDate = new Date(dateString);
  if (isValid(nativeDate)) return nativeDate;

  return null;
};
