declare module 'encoding-japanese' {
  type EncodingType = 'UNICODE' | 'SJIS' | 'EUCJP' | 'JIS' | 'UTF8' | 'ASCII' | 'AUTO';

  interface ConvertOptions {
    to: EncodingType;
    from?: EncodingType;
    type?: 'string' | 'arraybuffer' | 'array';
  }

  export function detect(data: Uint8Array | number[] | string): EncodingType | false;
  export function convert(data: Uint8Array | number[] | string, options: ConvertOptions): number[];
  export function codeToString(data: number[]): string;
  export function stringToCode(str: string): number[];
}
