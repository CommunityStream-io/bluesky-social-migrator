import { describe, it, expect } from 'vitest';

describe('Basic Test Setup', () => {
  it('should work with Vitest', () => {
    expect(true).toBe(true);
  });

  it('should handle basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle string operations', () => {
    const message = 'Hello, Vitest!';
    expect(message).toContain('Vitest');
  });
});
