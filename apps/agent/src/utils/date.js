/**
 * Date helper utilities for agent prompts, state normalization, and heuristic fallbacks
 */

export function getTodayDDMMYYYY(offsetDays = 0, baseDate = new Date()) {
  const d = new Date(baseDate);
  if (offsetDays) {
    d.setDate(d.getDate() + Number(offsetDays));
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getSystemDateInfo() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const ddmm = `${day}/${month}/${year}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[now.getMonth()];
  const readable = `${day} ${monthName} ${year}`;
  return { date: now, ddmm, readable, day, month, year, monthName };
}

export function parseOffsetDaysFromGoal(goal = '') {
  if (!goal) return null;
  const match = goal.match(/(\d+)\s*days?\s*from\s*(?:now|today)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}
