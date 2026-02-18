import { describe, it, expect } from 'vitest';
import { createMiniSite } from '../src/index';

describe('createMiniSite', () => {
  it('exports a function', () => {
    expect(typeof createMiniSite).toBe('function');
  });
});
