// The unsubscribe page's one press (docs/specs/legal-pages.md D6): the address and token from the query, the question,
// then a POST to /api/unsubscribe. A link without both, or a token the server refuses (403), is a broken link; a network
// or server failure can be tried again. The copy comes from the form's data attributes (src/config/legal.ts UNSUB_COPY).

/** the address and token in a page query, or null when either is missing or the address is not one */
export function readUnsubQuery(search: string): { email: string; token: string } | null {
  const q = new URLSearchParams(search);
  const email = (q.get('e') ?? '').trim().toLowerCase(), token = (q.get('t') ?? '').trim();
  if (!email || !/^[0-9a-f]{32}$/.test(token) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { email, token };
}

/** what the page does with the server's answer */
export function readUnsubStatus(status: number): 'done' | 'broken' | 'error' {
  return status === 200 ? 'done' : status === 403 || status === 400 ? 'broken' : 'error';
}

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

export function unsubscribe(): void {
  const form = document.getElementById('unsub') as HTMLFormElement | null;
  const text = document.getElementById('unsubText'), btn = document.getElementById('unsubBtn') as HTMLButtonElement | null, msg = document.getElementById('unsubMsg');
  if (!form || !text || !btn || !msg) return;
  const d = form.dataset as Record<string, string>;
  const q = readUnsubQuery(location.search);
  form.hidden = false;
  // the broken link: the words and a way out, no button
  const broken = () => {
    btn.hidden = true;
    msg.textContent = '';
    const [a, b] = d.broken.split('{contact}');
    const link = Object.assign(document.createElement('a'), { href: `mailto:${d.contact}?subject=Unsubscribe`, textContent: d.contact });
    text.replaceChildren(a, link, b ?? '');
  };
  if (!q) { broken(); return; }
  text.textContent = fill(d.ask, { email: q.email });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    btn.disabled = true; btn.textContent = d.working; msg.textContent = '';
    let kind: 'done' | 'broken' | 'error' = 'error';
    try {
      const res = await fetch('/api/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q), signal: AbortSignal.timeout(15000) });
      kind = readUnsubStatus(res.status);
    } catch { kind = 'error'; }
    if (kind === 'done') { btn.hidden = true; text.textContent = fill(d.done, { email: q.email }); text.setAttribute('tabindex', '-1'); text.focus(); return; }
    if (kind === 'broken') { broken(); return; }
    btn.disabled = false; btn.textContent = d.button; msg.textContent = d.error;
  });
}
