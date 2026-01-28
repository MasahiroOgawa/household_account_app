import { describe, it, expect } from 'vitest';
import { generateUniqueId } from '../idGenerator';

describe('generateUniqueId', () => {
  it('returns a string containing the prefix', () => {
    const id = generateUniqueId('test');
    expect(id).toContain('test_');
  });

  it('generates unique IDs on successive calls', () => {
    const id1 = generateUniqueId('a');
    const id2 = generateUniqueId('a');
    expect(id1).not.toBe(id2);
  });

  it('includes timestamp component', () => {
    const id = generateUniqueId('pfx');
    const parts = id.split('_');
    expect(parts.length).toBeGreaterThanOrEqual(3);
    const timestamp = parseInt(parts[1]);
    expect(timestamp).toBeGreaterThan(0);
  });
});
