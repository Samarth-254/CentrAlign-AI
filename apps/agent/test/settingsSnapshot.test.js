import { describe, it, expect } from 'vitest';

export function computeSettingsSnapshot(options = {}, realChaosMode = false) {
  const effectiveApproval =
    options.requireApprovalForWrites !== undefined
      ? options.requireApprovalForWrites
      : options.autoApprove !== undefined
        ? !options.autoApprove
        : true;

  return {
    requireApprovalForWrites: effectiveApproval,
    chaosMode: options.chaosMode !== undefined ? options.chaosMode : realChaosMode,
    askOnAmbiguity: options.askOnAmbiguity !== undefined ? options.askOnAmbiguity : true,
    headless: options.headless !== undefined ? options.headless : true,
    startedAt: new Date().toISOString(),
  };
}

describe('Run Settings Snapshot Logic', () => {
  it('defaults to requireApproval: true when not specified', () => {
    const snapshot = computeSettingsSnapshot({});
    expect(snapshot.requireApprovalForWrites).toBe(true);
    expect(snapshot.askOnAmbiguity).toBe(true);
    expect(snapshot.headless).toBe(true);
    expect(snapshot.chaosMode).toBe(false);
    expect(snapshot.startedAt).toBeTruthy();
  });

  it('correctly maps autoApprove: true to requireApproval: false', () => {
    const snapshot = computeSettingsSnapshot({ autoApprove: true });
    expect(snapshot.requireApprovalForWrites).toBe(false);
  });

  it('correctly maps autoApprove: false to requireApproval: true', () => {
    const snapshot = computeSettingsSnapshot({ autoApprove: false });
    expect(snapshot.requireApprovalForWrites).toBe(true);
  });

  it('reads real chaos state from sandbox when not overridden in options', () => {
    const snapshotChaosTrue = computeSettingsSnapshot({}, true);
    expect(snapshotChaosTrue.chaosMode).toBe(true);

    const snapshotChaosFalse = computeSettingsSnapshot({}, false);
    expect(snapshotChaosFalse.chaosMode).toBe(false);
  });

  it('prefers explicit chaosMode option over sandbox state when provided', () => {
    const snapshot = computeSettingsSnapshot({ chaosMode: false }, true);
    expect(snapshot.chaosMode).toBe(false);
  });
});
