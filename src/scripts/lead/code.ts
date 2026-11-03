// The email code, shared by the two lead forms (section 5's sign-up and the quiz's offer band). A save answers 202 with
// `verify` once a six-digit code is mailed; the form then asks for the code and checks it here (Sam, 2026-11-03: "the
// emails are veified with an otp, so we actually know thats the right email of that person"). The statuses are
// server/lib/lead.php's.

export const LEAD_VERIFY_ENDPOINT = '/api/verify';
export const CODE_LENGTH = 6;
/** the wait before a new code may be asked for, unless the server names its own */
export const RESEND_GAP_S = 30;

/** what a save's answer means for the form */
export type SaveAnswer =
  | { kind: 'code'; gap: number }   // 202: a code is on its way
  | { kind: 'dup' }                 // 409: verified before
  | { kind: 'invalid' }             // 422: not an email address
  | { kind: 'name' }                // 422 with error "name": no first name, or one that looks like a link
  | { kind: 'wait'; wait: number }  // 429: too soon or too many
  | { kind: 'mail' }                // 502: the code mail failed
  | { kind: 'error'; status: number };

/** what a check's answer means */
export type CheckAnswer =
  | { kind: 'ok' }                  // 200: verified (or verified before)
  | { kind: 'wrong'; left: number } // 422: wrong code
  | { kind: 'format' }              // 422: not six digits
  | { kind: 'expired' }             // 410: no live code: send a new one
  | { kind: 'error'; status: number };

const body = async (res: Response): Promise<Record<string, unknown>> => { try { return (await res.json()) as Record<string, unknown>; } catch { return {}; } };
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.ceil(v) : d);

export async function readSave(res: Response): Promise<SaveAnswer> {
  if (res.status === 409) return { kind: 'dup' };
  if (res.status === 422) return (await body(res)).error === 'name' ? { kind: 'name' } : { kind: 'invalid' };
  if (res.status === 502) return { kind: 'mail' };
  if (res.status === 429) return { kind: 'wait', wait: num((await body(res)).wait, RESEND_GAP_S) };
  if (res.ok) {
    const b = await body(res);
    // a 2xx without `verify` is an endpoint that saves without a code: treated as sent, the check then says expired
    return { kind: 'code', gap: num(b.gap, RESEND_GAP_S) };
  }
  return { kind: 'error', status: res.status };
}

export async function readCheck(res: Response): Promise<CheckAnswer> {
  if (res.ok) return { kind: 'ok' };
  if (res.status === 410) return { kind: 'expired' };
  if (res.status === 422) { const b = await body(res); return b.error === 'format' ? { kind: 'format' } : { kind: 'wrong', left: num(b.left, 0) }; }
  return { kind: 'error', status: res.status };
}

/** a first name the server will take: 1 to 60 characters once trimmed, nothing link-like (server/lib/lead.php's lead_name) */
export const cleanName = (v: string): string => v.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
export const validName = (v: string): boolean => { const n = cleanName(v); return n.length >= 1 && n.length <= 60 && !/[<>@/\\]|https?:|www\.|\.(com|in|net|org|io|co|xyz|ru|link|shop|info|me)\b/i.test(n); };

/** the digits of a typed or pasted code, spaces and dashes dropped, at most six */
export const cleanCode = (v: string): string => v.replace(/\D/g, '').slice(0, CODE_LENGTH);
export const codeComplete = (v: string): boolean => cleanCode(v).length === CODE_LENGTH;

export function checkCode(email: string, source: 'signup' | 'quiz', code: string, signal?: AbortSignal): Promise<Response> {
  return fetch(LEAD_VERIFY_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, source, code: cleanCode(code) }), signal, credentials: 'omit' });
}
