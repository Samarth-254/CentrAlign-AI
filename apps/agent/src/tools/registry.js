import { ToolArgSchemas } from '@centralign/shared';
import { browserTools } from './browser.js';
import { fileTools } from './files.js';
import { memoryTools } from './memory.js';
import { humanTools } from './human.js';
import { controlTools } from './control.js';

/**
 * Metadata definition for every tool in the system
 */
export const TOOL_DEFINITIONS = {
  // Browser tools
  browser_goto: {
    description: 'Navigate to an allowed URL.',
    category: 'navigate',
    risk: 'low',
    isWrite: false,
    schema: ToolArgSchemas.browser_goto,
    handler: browserTools.browser_goto,
  },
  browser_snapshot: {
    description: 'Capture a fresh page accessibility snapshot with interactive element refs (e.g. e1, e2).',
    category: 'read',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.browser_snapshot,
    handler: browserTools.browser_snapshot,
  },
  browser_click: {
    description: 'Click an element on the page by its assigned ref (e.g. "e12").',
    category: 'write',
    risk: 'low',
    isWrite: true, // Could submit forms or navigate
    schema: ToolArgSchemas.browser_click,
    handler: browserTools.browser_click,
  },
  browser_type: {
    description: 'Type text into an input or textarea element by its assigned ref (e.g. "e5"). Accepts {{secret:KEY}}.',
    category: 'write',
    risk: 'low',
    isWrite: true,
    schema: ToolArgSchemas.browser_type,
    handler: browserTools.browser_type,
  },
  browser_select: {
    description: 'Select an option in a dropdown select element by its assigned ref and option label or value.',
    category: 'write',
    risk: 'low',
    isWrite: true,
    schema: ToolArgSchemas.browser_select,
    handler: browserTools.browser_select,
  },
  browser_press_key: {
    description: 'Press a keyboard key (e.g. "Enter", "Tab", "Escape").',
    category: 'write',
    risk: 'low',
    isWrite: true,
    schema: ToolArgSchemas.browser_press_key,
    handler: browserTools.browser_press_key,
  },
  browser_wait_for: {
    description: 'Wait for specific text or a CSS selector to appear in the DOM.',
    category: 'read',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.browser_wait_for,
    handler: browserTools.browser_wait_for,
  },
  browser_download: {
    description: 'Click a download link by its ref and save the downloaded file to the run workspace.',
    category: 'read',
    risk: 'low',
    isWrite: false,
    schema: ToolArgSchemas.browser_download,
    handler: browserTools.browser_download,
  },
  browser_screenshot: {
    description: 'Capture a full page screenshot saved as an evidence artifact.',
    category: 'read',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.browser_screenshot,
    handler: browserTools.browser_screenshot,
  },
  browser_get_text: {
    description: 'Get visible text content of a specific element ref or the entire body.',
    category: 'read',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.browser_get_text,
    handler: browserTools.browser_get_text,
  },
  browser_go_back: {
    description: 'Navigate back to the previous page in browser history.',
    category: 'navigate',
    risk: 'low',
    isWrite: false,
    schema: ToolArgSchemas.browser_go_back,
    handler: browserTools.browser_go_back,
  },

  // File tools
  file_list: {
    description: 'List files and directories inside the sandboxed run workspace.',
    category: 'read',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.file_list,
    handler: fileTools.file_list,
  },
  file_read_text: {
    description: 'Read contents of a text file inside the sandboxed run workspace.',
    category: 'read',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.file_read_text,
    handler: fileTools.file_read_text,
  },
  pdf_extract_text: {
    description: 'Extract all plain text content from a PDF document in workspace.',
    category: 'read',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.pdf_extract_text,
    handler: fileTools.pdf_extract_text,
  },
  pdf_extract_fields: {
    description: 'Extract structured fields from a PDF with quoted evidence and confidence scores.',
    category: 'read',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.pdf_extract_fields,
    handler: fileTools.pdf_extract_fields,
  },

  // Memory tools
  memory_set: {
    description: 'Save a discovered fact into persistent run memory with provenance evidence.',
    category: 'memory',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.memory_set,
    handler: memoryTools.memory_set,
  },
  memory_get: {
    description: 'Retrieve a stored fact from run memory by key.',
    category: 'memory',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.memory_get,
    handler: memoryTools.memory_get,
  },
  memory_list: {
    description: 'List all facts currently stored in agent run memory.',
    category: 'memory',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.memory_list,
    handler: memoryTools.memory_list,
  },

  // Human interaction
  ask_human: {
    description: 'Ask the human user a clarifying question when requirements are ambiguous or missing.',
    category: 'human',
    risk: 'low',
    isWrite: false,
    schema: ToolArgSchemas.ask_human,
    handler: humanTools.ask_human,
  },
  request_approval: {
    description: 'Explicitly request human confirmation before executing an irreversible mutation.',
    category: 'human',
    risk: 'low',
    isWrite: false,
    schema: ToolArgSchemas.request_approval,
    handler: humanTools.request_approval,
  },

  // Control
  finish: {
    description: 'Submit claimed completion of the objective. Forwards to independent verification.',
    category: 'control',
    risk: 'none',
    isWrite: false,
    schema: ToolArgSchemas.finish,
    handler: controlTools.finish,
  },
};

/**
 * Execute a tool safely with zod validation and structured error handling.
 * Never throws; returns { ok: boolean, result?, error?, durationMs: number }.
 *
 * @param {string} toolName
 * @param {Record<string, *>} rawArgs
 * @param {Object} ctx
 * @returns {Promise<import('@centralign/shared').ToolResult>}
 */
export async function executeTool(toolName, rawArgs = {}, ctx = {}) {
  const startTime = Date.now();
  const def = TOOL_DEFINITIONS[toolName];

  if (!def) {
    return {
      ok: false,
      error: `Unknown tool: "${toolName}". Available tools: ${Object.keys(TOOL_DEFINITIONS).join(', ')}`,
      durationMs: Date.now() - startTime,
    };
  }

  // 1. Validate arguments with Zod
  const parseResult = def.schema.safeParse(rawArgs);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return {
      ok: false,
      error: `Invalid arguments for tool "${toolName}": ${errorDetails}`,
      durationMs: Date.now() - startTime,
    };
  }

  // 2. Run handler with execution boundary
  try {
    const result = await def.handler(parseResult.data, ctx);
    return {
      ok: true,
      result,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || String(err),
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Format tools as function declarations for Google Gemini native tool calling
 * @returns {Array<Object>}
 */
export function getGeminiFunctionDeclarations() {
  const declarations = [];

  function unwrapZodType(schema) {
    let current = schema;
    let isOptional = false;
    while (
      current?._def?.typeName === 'ZodOptional' ||
      current?._def?.typeName === 'ZodNullable' ||
      current?._def?.typeName === 'ZodDefault'
    ) {
      isOptional = true;
      current = current._def.innerType || current._def.schema;
    }
    return { inner: current, isOptional };
  }

  for (const [name, def] of Object.entries(TOOL_DEFINITIONS)) {
    const properties = {};
    const required = [];

    const shape = def.schema._def?.shape?.() || def.schema._def?.schema?._def?.shape?.() || {};
    for (const [propName, rawPropSchema] of Object.entries(shape)) {
      const { inner: propSchema, isOptional } = unwrapZodType(rawPropSchema);
      let type = 'STRING';
      let items = undefined;
      const typeName = propSchema?._def?.typeName;

      if (typeName === 'ZodNumber') {
        type = 'NUMBER';
      } else if (typeName === 'ZodBoolean') {
        type = 'BOOLEAN';
      } else if (typeName === 'ZodArray') {
        type = 'ARRAY';
        const innerItem = unwrapZodType(propSchema._def.type).inner;
        let itemGeminiType = 'STRING';
        if (innerItem?._def?.typeName === 'ZodNumber') itemGeminiType = 'NUMBER';
        else if (innerItem?._def?.typeName === 'ZodBoolean') itemGeminiType = 'BOOLEAN';
        else if (innerItem?._def?.typeName === 'ZodObject') itemGeminiType = 'OBJECT';
        items = { type: itemGeminiType };
      } else if (typeName === 'ZodObject') {
        type = 'OBJECT';
      }

      properties[propName] = {
        type,
        description: rawPropSchema.description || propSchema?.description || `Parameter ${propName}`,
        ...(items ? { items } : {}),
      };

      if (!isOptional && (!rawPropSchema.isOptional || !rawPropSchema.isOptional())) {
        required.push(propName);
      }
    }

    // Every tool call must include a specific rationale parameter
    properties.rationale = {
      type: 'STRING',
      description: 'One specific sentence (8-30 words) explaining why this tool and arguments are chosen, citing concrete observation values or plan steps. Never use generic filler like "proceeding" or "next step".',
    };
    required.push('rationale');

    declarations.push({
      name,
      description: def.description,
      parameters: {
        type: 'OBJECT',
        properties,
        required,
      },
    });
  }

  return declarations;
}
