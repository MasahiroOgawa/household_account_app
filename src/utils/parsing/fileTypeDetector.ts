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

  // Check detection rules (filename patterns and header patterns)
  for (const [sourceType, rules] of Object.entries(mapping.detectionRules)) {
    if (rules.fileNamePattern) {
      const regex = new RegExp(rules.fileNamePattern, 'i');
      if (regex.test(fileName)) {
        return sourceType;
      }
    }

    if (headers.length > 0 && rules.headerPatterns.length > 0) {
      const headerMatch = rules.headerPatterns.every(pattern =>
        headers.some(header => header && header.includes(pattern))
      );
      if (headerMatch) {
        return sourceType;
      }
    }
  }

  // Fallback to generic if available
  if (mapping.sources['generic']) {
    return 'generic';
  }

  return null;
};
