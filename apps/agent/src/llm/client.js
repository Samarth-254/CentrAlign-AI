import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { getGeminiFunctionDeclarations } from '../tools/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

/**
 * Thin wrapper around Google Gemini (@google/genai)
 * Handles structured outputs, native function calling, and schema repair.
 */
export class LlmClient {
  /**
   * @param {Object} [config]
   * @param {string} [config.apiKey]
   * @param {string} [config.model]
   */
  constructor(config = {}) {
    this.apiKey = (config.apiKey || process.env.GEMINI_API_KEY || '').trim();
    this.model = (config.model || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();

    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } else {
      this.ai = null;
    }
  }

  /**
   * Check if Gemini API key is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.ai && !!this.apiKey;
  }

  /**
   * Helper to execute Gemini API calls with backoff on 429 rate limits
   * @param {Function} fn
   * @param {number} [maxRetries=2]
   * @returns {Promise<*>}
   */
  async _withRetry(fn, maxRetries = 6) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const isDailyExhausted =
          err?.message?.includes('GenerateRequestsPerDayPerProjectPerModel') ||
          err?.message?.includes('limit: 500') ||
          err?.message?.includes('86295s') ||
          err?.message?.includes('23h');
        if (isDailyExhausted) {
          const fallbackModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
          const currentIndex = fallbackModels.indexOf(this.model);
          const nextModel = fallbackModels[(currentIndex + 1) % fallbackModels.length];
          if (nextModel && nextModel !== this.model) {
            console.warn(`[Gemini Daily Quota Reached on ${this.model}] Seamlessly switching to ${nextModel}...`);
            this.model = nextModel;
            continue;
          }
        }

        const is503 =
          err?.message?.includes('503') ||
          err?.status === 503 ||
          err?.message?.includes('UNAVAILABLE') ||
          err?.message?.includes('high demand');
        if (is503 && attempt < maxRetries) {
          const fallbackModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
          const currentIndex = fallbackModels.indexOf(this.model);
          const nextModel = fallbackModels[(currentIndex + 1) % fallbackModels.length];
          console.warn(`[Gemini 503 High Demand on ${this.model}] Retrying with fallback model ${nextModel}...`);
          this.model = nextModel;
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        const is429 =
          err?.message?.includes('429') ||
          err?.message?.includes('RESOURCE_EXHAUSTED') ||
          err?.status === 'RESOURCE_EXHAUSTED';
        if (is429 && attempt < maxRetries) {
          let delay = Math.max((attempt + 1) * 15000, 20000);
          const match = err?.message?.match(/Please retry in ([\d.]+)s/);
          if (match && match[1]) {
            delay = Math.ceil(parseFloat(match[1]) * 1000) + 1500;
          }
          console.warn(`[Gemini Rate Limit 429] Waiting ${Math.round(delay / 1000)}s before retry (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * Generate raw content from Gemini
   * @param {Object} params
   * @returns {Promise<string>}
   */
  async generateContent(params) {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }

    const { contents, systemInstruction, temperature = 0.2 } = params;

    const response = await this._withRetry(() =>
      this.ai.models.generateContent({
        model: this.model,
        contents: Array.isArray(contents) ? contents : [contents],
        config: {
          systemInstruction,
          temperature,
        },
      })
    );

    return response.text ? response.text.trim() : '';
  }

  /**
   * Generate structured JSON validated by a Zod schema with 1 automatic repair re-prompt
   * @template T
   * @param {Object} params
   * @param {string} params.systemInstruction
   * @param {string} params.prompt
   * @param {import('zod').ZodSchema<T>} params.schema
   * @param {number} [params.repairAttempts=1]
   * @returns {Promise<T>}
   */
  async generateStructured(params) {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }

    const { systemInstruction, prompt, schema, repairAttempts = 1 } = params;

    let currentPrompt = prompt;
    let attemptsLeft = repairAttempts;

    while (attemptsLeft >= 0) {
      const response = await this._withRetry(() =>
        this.ai.models.generateContent({
          model: this.model,
          contents: [currentPrompt],
          config: {
            systemInstruction: `${systemInstruction}\nYou MUST output strictly valid JSON with no markdown formatting or commentary.`,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        })
      );

      const rawText = response.text ? response.text.trim() : '{}';
      let parsedJson;

      try {
        parsedJson = JSON.parse(rawText);
      } catch (jsonErr) {
        if (attemptsLeft > 0) {
          attemptsLeft--;
          currentPrompt = `${prompt}\n\nYour previous response was not valid JSON (${jsonErr.message}). Output strictly valid JSON only:`;
          continue;
        }
        throw new Error(`Failed to parse LLM response as JSON: ${rawText}`);
      }

      const parseResult = schema.safeParse(parsedJson);
      if (parseResult.success) {
        return parseResult.data;
      }

      // Schema validation failed: trigger automatic repair re-prompt
      if (attemptsLeft > 0) {
        attemptsLeft--;
        const errorDetails = parseResult.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        currentPrompt = `${prompt}\n\nYour previous JSON failed schema validation with errors: [${errorDetails}]. Please fix all errors and return valid JSON matching the schema:`;
        continue;
      }

      throw new Error(`Zod schema validation failed after repair attempts: ${parseResult.error.message}`);
    }
  }

  /**
   * Decide next tool call using native Gemini function declarations
   * @param {Object} params
   * @param {string} params.systemInstruction
   * @param {string} params.prompt
   * @returns {Promise<{name: string, args: Record<string, *>, rationale: string}>}
   */
  async decideNextAction(params) {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }

    const { systemInstruction, prompt } = params;
    const functionDeclarations = getGeminiFunctionDeclarations();

    const response = await this._withRetry(() =>
      this.ai.models.generateContent({
        model: this.model,
        contents: [prompt],
        config: {
          systemInstruction,
          temperature: 0.1,
          tools: [{ functionDeclarations }],
        },
      })
    );

    // Check if the model called a function
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const args = { ...(call.args || {}) };
      const rationale = (args.rationale || (response.text ? response.text.trim() : '')).trim();
      delete args.rationale; // Keep args clean for tool handler execution

      return {
        name: call.name,
        args,
        rationale,
      };
    }

    // Fallback: If model returned text instead of function call, attempt to parse JSON tool call
    const text = response.text ? response.text.trim() : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const args = { ...(parsed.args || {}) };
        const rationale = (parsed.rationale || args.rationale || text).trim();
        delete args.rationale;

        if (parsed.name && (parsed.args !== undefined)) {
          return {
            name: parsed.name,
            args,
            rationale,
          };
        }
        if (parsed.tool) {
          return {
            name: parsed.tool,
            args,
            rationale,
          };
        }
      } catch {
        // ignore
      }
    }

    // If finish was implied in text
    if (text.toLowerCase().includes('finish') || text.toLowerCase().includes('completed')) {
      return {
        name: 'finish',
        args: { claimedOutcome: text, summary: text },
        rationale: 'Objective completed.',
      };
    }

    // Default snapshot to see where we are
    return {
      name: 'browser_snapshot',
      args: {},
      rationale: text || 'Inspecting current page state.',
    };
  }

  /**
   * Helper to extract JSON from arbitrary text
   * @param {string} prompt
   * @returns {Promise<any>}
   */
  async extractJson(prompt) {
    const text = await this.generateContent({
      contents: [prompt],
      temperature: 0.1,
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return JSON.parse(text);
  }
}
