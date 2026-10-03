import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { resolveSafePath } from '../src/security/sandbox.js';

describe('Path Sandbox Security', () => {
  const workspaceDir = path.resolve('/tmp/test-workspace');

  it('allows safe relative paths inside workspace', () => {
    const resolved = resolveSafePath(workspaceDir, 'invoice.pdf');
    expect(resolved).toBe(path.join(workspaceDir, 'invoice.pdf'));
  });

  it('allows safe nested subpaths inside workspace', () => {
    const resolved = resolveSafePath(workspaceDir, 'subfolder/data.json');
    expect(resolved).toBe(path.join(workspaceDir, 'subfolder', 'data.json'));
  });

  it('blocks path traversal via ../', () => {
    expect(() => {
      resolveSafePath(workspaceDir, '../secret-file.env');
    }).toThrow(/Security Violation/);
  });

  it('blocks absolute paths outside workspace', () => {
    expect(() => {
      resolveSafePath(workspaceDir, 'C:\\Windows\\System32\\cmd.exe');
    }).toThrow(/Security Violation/);
  });
});
