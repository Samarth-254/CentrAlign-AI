/**
 * Secret Management & Masking
 * Handles {{secret:KEY}} substitution and masks sensitive values in traces, logs, and screenshots.
 */

// Known environment secret keys
const SECRET_KEYS = [
  'PORTAL_PASSWORD',
  'ERP_PASSWORD',
  'GEMINI_API_KEY',
  'PORTAL_USERNAME',
  'ERP_USERNAME',
];

/**
 * Replace {{secret:KEY}} templates with actual environment variable values
 * @param {string} text
 * @returns {string}
 */
export function substituteSecrets(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/\{\{secret:([A-Za-z0-9_]+)\}\}/g, (match, key) => {
    return process.env[key] || match;
  });
}

/**
 * Recursively substitute secrets in an object or array
 * @param {*} obj
 * @returns {*}
 */
export function substituteSecretsDeep(obj) {
  if (typeof obj === 'string') {
    return substituteSecrets(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => substituteSecretsDeep(item));
  }
  if (obj && typeof obj === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = substituteSecretsDeep(v);
    }
    return res;
  }
  return obj;
}

/**
 * Get list of all actual secret values to mask
 * @returns {string[]}
 */
export function getSecretValuesToMask() {
  const values = [];
  for (const k of SECRET_KEYS) {
    const val = process.env[k];
    if (val && val.length > 2) {
      values.push(val);
    }
  }
  return values;
}

/**
 * Mask any sensitive values found in a string
 * @param {string} text
 * @returns {string}
 */
export function maskSecrets(text) {
  if (typeof text !== 'string') return text;
  let masked = text;
  const secrets = getSecretValuesToMask();
  for (const secret of secrets) {
    const escaped = secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    masked = masked.replace(new RegExp(escaped, 'g'), '******');
  }
  return masked;
}

/**
 * Recursively mask secrets in objects, arrays, and error messages
 * @param {*} data
 * @returns {*}
 */
export function maskSecretsDeep(data) {
  if (typeof data === 'string') {
    return maskSecrets(data);
  }
  if (Array.isArray(data)) {
    return data.map((item) => maskSecretsDeep(item));
  }
  if (data && typeof data === 'object') {
    const masked = {};
    for (const [k, v] of Object.entries(data)) {
      // If the field name itself implies credentials, mask directly
      if (['password', 'apiKey', 'secret', 'token'].some((s) => k.toLowerCase().includes(s))) {
        masked[k] = '******';
      } else {
        masked[k] = maskSecretsDeep(v);
      }
    }
    return masked;
  }
  return data;
}
