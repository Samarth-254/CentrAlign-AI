import path from 'node:path';
import fs from 'node:fs';

/**
 * Resolves and validates a safe file path inside the given run workspace.
 * Throws an error if path traversal or escape is attempted.
 *
 * @param {string} workspaceDir - Absolute path to run workspace
 * @param {string} inputPath - User or tool supplied path
 * @returns {string} Fully resolved safe absolute path
 */
export function resolveSafePath(workspaceDir, inputPath = '.') {
  const cleanPath = (typeof inputPath === 'string' && inputPath.trim() !== '') ? inputPath : '.';

  // Normalize workspace path
  const normalizedWorkspace = path.resolve(workspaceDir);

  // If input is absolute, ensure it starts with workspaceDir
  let targetPath;
  if (path.isAbsolute(cleanPath)) {
    targetPath = path.resolve(cleanPath);
  } else {
    targetPath = path.resolve(normalizedWorkspace, cleanPath);
  }

  // Security check: Must reside strictly inside workspaceDir
  const relative = path.relative(normalizedWorkspace, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Security Violation: Path traversal blocked. "${inputPath}" escapes workspace directory.`);
  }

  return targetPath;
}

/**
 * Ensure workspace directory exists
 * @param {string} workspaceDir
 */
export function ensureWorkspace(workspaceDir) {
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }
}
