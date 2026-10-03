import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import { maskSecretsDeep } from '../security/secrets.js';
import { EVENT_TYPES } from '@centralign/shared';

/**
 * Structured Trace Logger
 * Appends JSONL events for the run, logs via pino, and notifies SSE subscribers.
 */
export class TraceLogger {
  /**
   * @param {string} runId
   * @param {string} runDir
   * @param {Object} [options]
   * @param {boolean} [options.quiet=false]
   */
  constructor(runId, runDir, options = {}) {
    this.runId = runId;
    this.runDir = runDir;
    this.quiet = options.quiet || false;
    this.listeners = new Set();
    this.events = [];

    // Ensure run directory exists
    if (!fs.existsSync(this.runDir)) {
      fs.mkdirSync(this.runDir, { recursive: true });
    }

    this.traceFilePath = path.join(this.runDir, 'trace.jsonl');

    // Initialize pino
    this.pino = pino({
      name: `centralign-agent-${runId}`,
      level: process.env.LOG_LEVEL || 'info',
    });
  }

  /**
   * Subscribe an SSE client or callback to live run events
   * @param {(event: Object) => void} listener
   * @returns {() => void} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit a structured event conforming to packages/shared EVENT_TYPES
   * @param {string} type - Event type constant
   * @param {Record<string, *>} data - Event payload
   */
  emit(type, data = {}) {
    const timestamp = new Date().toISOString();
    const rawEvent = {
      runId: this.runId,
      timestamp,
      type,
      data,
    };

    // Deep mask any sensitive credentials or secrets
    const maskedEvent = maskSecretsDeep(rawEvent);

    // Save in memory
    this.events.push(maskedEvent);

    // Append to JSONL file
    try {
      fs.appendFileSync(this.traceFilePath, JSON.stringify(maskedEvent) + '\n', 'utf8');
    } catch (err) {
      this.pino.error({ err }, 'Failed to write event to trace.jsonl');
    }

    // Pino console log
    if (!this.quiet) {
      this.pino.info({ eventType: type, step: data.stepIndex }, `[${type}] ${data.summary || data.message || ''}`);
    }

    // Notify live subscribers (e.g. SSE)
    for (const listener of this.listeners) {
      try {
        listener(maskedEvent);
      } catch (err) {
        // ignore subscriber errors
      }
    }

    return maskedEvent;
  }

  /**
   * Get all captured events
   * @returns {Array<Object>}
   */
  getEvents() {
    return this.events;
  }
}
