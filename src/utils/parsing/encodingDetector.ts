// @ts-ignore
import * as EncodingLib from 'encoding-japanese';

const Encoding = (EncodingLib as any).default || EncodingLib;

export const detectEncoding = (uint8Array: Uint8Array): string => {
  try {
    if (!Encoding || !Encoding.detect) {
      return 'UTF8';
    }
    return Encoding.detect(uint8Array) || 'UTF8';
  } catch {
    return 'UTF8';
  }
};

export const convertToUnicode = (uint8Array: Uint8Array, fromEncoding: string): string => {
  if (fromEncoding === 'SJIS' || fromEncoding.toLowerCase().includes('shift')) {
    const unicodeArray = Encoding.convert(uint8Array, { to: 'UNICODE', from: 'SJIS' });
    return Encoding.codeToString(unicodeArray);
  }

  if (fromEncoding === 'EUCJP') {
    const unicodeArray = Encoding.convert(uint8Array, { to: 'UNICODE', from: 'EUCJP' });
    return Encoding.codeToString(unicodeArray);
  }

  if (fromEncoding === 'UTF8' || fromEncoding === 'ASCII') {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(uint8Array);
  }

  // Auto-detect fallback
  const unicodeArray = Encoding.convert(uint8Array, { to: 'UNICODE', from: 'AUTO' });
  return Encoding.codeToString(unicodeArray);
};
