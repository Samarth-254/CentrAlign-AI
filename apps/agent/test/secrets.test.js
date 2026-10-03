import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { substituteSecrets, maskSecrets, maskSecretsDeep } from '../src/security/secrets.js';

describe('Secrets Manager', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.PORTAL_PASSWORD = 'supersecretportal';
    process.env.ERP_PASSWORD = 'supersecreterp';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('substitutes {{secret:KEY}} with environment variable', () => {
    const input = 'Logging in with {{secret:ERP_PASSWORD}}';
    const output = substituteSecrets(input);
    expect(output).toBe('Logging in with supersecreterp');
  });

  it('leaves unknown templates intact', () => {
    const input = 'Unknown {{secret:NON_EXISTENT_KEY_XYZ}}';
    const output = substituteSecrets(input);
    expect(output).toBe('Unknown {{secret:NON_EXISTENT_KEY_XYZ}}');
  });

  it('masks secret values from output text', () => {
    const input = 'Entered password supersecreterp into password field';
    const output = maskSecrets(input);
    expect(output).toBe('Entered password ****** into password field');
    expect(output).not.toContain('supersecreterp');
  });

  it('masks sensitive fields deep in objects', () => {
    const data = {
      user: 'finance@acme.test',
      password: 'supersecreterp',
      nested: {
        token: 'xyz',
        info: 'supersecretportal here',
      },
    };
    const masked = maskSecretsDeep(data);
    expect(masked.password).toBe('******');
    expect(masked.nested.token).toBe('******');
    expect(masked.nested.info).toBe('****** here');
  });
});
