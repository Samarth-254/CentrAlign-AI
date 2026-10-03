import { describe, it, expect } from 'vitest';
import { detectActionLoop } from '../src/policy/loopDetection.js';

describe('Loop Detection', () => {
  it('detects 3 identical consecutive tool calls', () => {
    const history = [
      { action: { name: 'browser_goto', args: { url: 'http://localhost:3000' } } },
      { action: { name: 'browser_click', args: { ref: 'e2' } } },
      { action: { name: 'browser_click', args: { ref: 'e2' } } },
      { action: { name: 'browser_click', args: { ref: 'e2' } } },
    ];

    const result = detectActionLoop(history, 3);
    expect(result.isLoop).toBe(true);
    expect(result.count).toBe(3);
    expect(result.toolName).toBe('browser_click');
  });

  it('does not flag loop when arguments differ', () => {
    const history = [
      { action: { name: 'browser_click', args: { ref: 'e1' } } },
      { action: { name: 'browser_click', args: { ref: 'e2' } } },
      { action: { name: 'browser_click', args: { ref: 'e3' } } },
    ];

    const result = detectActionLoop(history, 3);
    expect(result.isLoop).toBe(false);
  });

  it('does not flag loop when tool calls are fewer than threshold', () => {
    const history = [
      { action: { name: 'browser_click', args: { ref: 'e2' } } },
      { action: { name: 'browser_click', args: { ref: 'e2' } } },
    ];

    const result = detectActionLoop(history, 3);
    expect(result.isLoop).toBe(false);
  });

  it('detects 2-cycle alternating oscillation (A -> B -> A -> B)', () => {
    const history = [
      { action: { name: 'browser_click', args: { ref: 'e9' } } },
      { action: { name: 'browser_click', args: { ref: 'e7' } } },
      { action: { name: 'browser_click', args: { ref: 'e9' } } },
      { action: { name: 'browser_click', args: { ref: 'e7' } } },
    ];

    const result = detectActionLoop(history, 3);
    expect(result.isLoop).toBe(true);
    expect(result.toolName).toBe('browser_click');
  });
});
