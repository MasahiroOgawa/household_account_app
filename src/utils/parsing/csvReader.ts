import { detectEncoding, convertToUnicode } from './encodingDetector';

export const readFileAsString = async (file: File): Promise<string> => {
  try {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const detectedEncoding = detectEncoding(uint8Array);
    return convertToUnicode(uint8Array, detectedEncoding);
  } catch {
    // Fallback to default text reading
    return await file.text();
  }
};
