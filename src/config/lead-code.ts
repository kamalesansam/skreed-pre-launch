/** The email code's words and the first name's, shared by section 5's form and the quiz's offer band
 * (src/scripts/lead/code.ts; Sam, 2026-11-03: the code, and "add a mandatory first name field"). Proposed lines, for
 * Sam's review; the buttons are in each form's own copy, in its own case. */
export const LEAD_CODE_COPY = Object.freeze({
  /** the first name's accessible name and placeholder, and its error */
  name: 'Your first name',
  errName: 'Add your first name.',
  /** the code field's accessible name and placeholder */
  code: 'Your 6-digit code',
  sent: 'We sent a code to {email}.',
  resent: 'New code sent to {email}.',
  errCode: 'Enter the 6 digits from the email.',
  wrong: 'That code isn’t right. {left} tries left.',
  wrongOne: 'That code isn’t right. 1 try left.',
  expired: 'That code has expired. Send a new one.',
  mail: 'We couldn’t send the code. Try again.',
  wait: 'Try again in {s} seconds.',
  waitLong: 'Too many codes for now. Try again in {m} minutes.',
  resend: 'Send a new code',
  resendIn: 'Send a new code in {s}',
  other: 'Use another email',
});

/** a line with its {name} slots filled */
export const codeLine = (t: string, v: Record<string, string | number>): string => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

/** the line for a wrong code or a wait, by the numbers the server gave */
export const wrongLine = (left: number): string => (left === 1 ? LEAD_CODE_COPY.wrongOne : codeLine(LEAD_CODE_COPY.wrong, { left }));
export const waitLine = (s: number): string => (s > 90 ? codeLine(LEAD_CODE_COPY.waitLong, { m: Math.ceil(s / 60) }) : codeLine(LEAD_CODE_COPY.wait, { s }));
