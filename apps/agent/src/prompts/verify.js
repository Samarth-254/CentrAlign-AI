/**
 * Independent Auditor Prompts for the `verify` node.
 * Evaluates claimed outcomes against ground-truth system of record evidence.
 */

export const VERIFY_SYSTEM_PROMPT = `
You are the Independent Verification Auditor for CentrAlign AI.
YOUR MOTTO: "Do not trust previous claims. Re-open the system of record and confirm each success criterion with direct evidence. Fail the check if you cannot find evidence."

Audit Responsibilities:
1. Strict Falsifiability:
   - For every explicit success criterion defined during Goal Understanding, verify whether direct evidence in the system of record proves it true.
   - If an entered bill does not match the invoice amount, due date, or invoice number from the original source document, FAIL the check.
2. Cross-Check Source vs System of Record:
   - Compare the amount in AcmeBooks against the amount in the PDF.
   - Compare the due date in AcmeBooks against the due date in the PDF.
   - Any discrepancy or missing evidence is a verification failure.
3. Zero Tolerance for Hallucinations:
   - Never accept an unverified claim. You must have captured evidence (exact matching table row or field value).

Output Format:
Respond in JSON:
{
  "overall": true | false,
  "summary": "Auditor conclusion summarizing verified ground truth",
  "checks": [
    {
      "criterion": "...",
      "passed": true | false,
      "evidence": "Quoted matching text or ledger row from system of record",
      "explanation": "Why this criterion passed or failed"
    }
  ]
}
`.trim();

import { getSystemDateInfo } from '../utils/date.js';

/**
 * Build verification prompt for the auditor
 * @param {Object} data
 * @returns {string}
 */
export function buildVerifyPrompt(data) {
  const { successCriteria, claimedOutcome, memory, billsTableObservation, billDetailObservation, sourcePdfExtraction } = data;
  const dateInfo = getSystemDateInfo();

  let prompt = `=== AUDIT OBJECTIVE: VERIFY CLAIMED OUTCOME ===\n`;
  prompt += `Current System Date: ${dateInfo.ddmm} (${dateInfo.readable}, DD/MM/YYYY)\n`;
  prompt += `Claimed Outcome: ${claimedOutcome}\n\n`;


  prompt += `Success Criteria to Verify:\n`;
  for (const c of successCriteria) {
    prompt += `- ${c}\n`;
  }
  prompt += '\n';

  prompt += `=== GROUND TRUTH EVIDENCE FROM SYSTEM OF RECORD ===\n`;
  if (billsTableObservation) {
    prompt += `AcmeBooks Ledger Table Observation:\n${billsTableObservation}\n\n`;
  }
  if (billDetailObservation) {
    prompt += `AcmeBooks Bill Detail Observation:\n${billDetailObservation}\n\n`;
  }
  if (sourcePdfExtraction) {
    prompt += `Independent Source PDF Re-Extraction:\n${JSON.stringify(sourcePdfExtraction, null, 2)}\n\n`;
  }
  if (memory) {
    prompt += `Agent Discovered Facts in Memory:\n${JSON.stringify(memory, null, 2)}\n\n`;
  }

  prompt += `Perform the independent audit. Provide pass/fail for each criterion and your overall verdict in JSON format.`;
  return prompt;
}
