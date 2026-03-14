import { configLoader } from '../config/configLoader';

export const detectFileType = (headers: string[], fileName: string): string | null => {
  const mapping = configLoader.getColumnMapping();

  // Check filename patterns in source configs (skip generic fallback)
  for (const [sourceType, config] of Object.entries(mapping.sources)) {
    if (sourceType === 'generic') continue;
    if (config.filename) {
      for (const pattern of config.filename) {
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)');
        const regex = new RegExp(regexPattern, 'i');
        if (regex.test(fileName)) {
          return sourceType;
        }
      }
    }
  }

  // Check detection rules in priority order:
  // 1. Header pattern match (most reliable — file content over filename)
  // 2. Filename pattern match (fallback when headers don't match any source)
  let fileNameMatch: string | null = null;

  for (const [sourceType, rules] of Object.entries(mapping.detectionRules)) {
    if (headers.length > 0 && rules.headerPatterns.length > 0) {
      const headerMatch = rules.headerPatterns.every(pattern =>
        headers.some(header => header && header.includes(pattern))
      );
      if (headerMatch) {
        return sourceType;
      }
    }

    if (!fileNameMatch && rules.fileNamePattern) {
      const regex = new RegExp(rules.fileNamePattern, 'i');
      if (regex.test(fileName)) {
        fileNameMatch = sourceType;
      }
    }
  }

  if (fileNameMatch) {
    return fileNameMatch;
  }

  // Fallback to generic if available
  if (mapping.sources['generic']) {
    return 'generic';
  }

  return null;
};
