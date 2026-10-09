# GLSL whitespace squeeze for template literals in the module (build time only). Runs on jsstrip's output: in every template
# literal whose text reads as GLSL, whitespace next to punctuation goes and other runs become one space; preprocessor lines keep
# their own line. Two operator characters are never joined (a - -b), and text next to a ${} interpolation keeps one space.
import re
GL = re.compile(r'gl_FragColor|gl_Position|void main|#include|uniform |varying |\bfloat [a-zA-Z_]|\bvec[234]\(')
PUN = set('=+-*/<>!&|^%,;:?(){}[].')
OPS = set('+-*/<>=!&|^%')

def squeeze_chunk(txt, lead_keep, trail_keep):
    out_lines = []
    for raw in txt.split('\n'):
        out_lines.append(raw)
    res = []
    cur = []
    def flush():
        if cur: res.append(('c', ' '.join(cur)))
        cur.clear()
    for l in out_lines:
        s = l.strip()
        if s.startswith('#'): flush(); res.append(('p', s))
        elif s: cur.append(s)
    flush()
    def sq(s):
        s = re.sub(r'\s+', ' ', s)
        o = []
        for i, ch in enumerate(s):
            if ch == ' ':
                a = o[-1] if o else ''
                b = s[i + 1] if i + 1 < len(s) else ''
                if (a in PUN or b in PUN) and not (a in OPS and b in OPS): continue
            o.append(ch)
        return ''.join(o)
    parts = []
    for k, (kind, s) in enumerate(res):
        if kind == 'p': parts.append('\n' + s + '\n')
        else: parts.append(sq(s))
    body = ''.join(parts).replace('\n\n', '\n')
    # edges: keep a newline (or one space) where the original had whitespace, so nothing merges with the interpolation
    lead, trail = txt[:len(txt) - len(txt.lstrip())], txt[len(txt.rstrip()):]
    body = body.strip('\n')
    if lead_keep and lead: body = ('\n' if '\n' in lead else ' ') + body
    if trail and (trail_keep or body.split('\n')[-1].startswith('#')): body += '\n' if '\n' in trail else ' '
    return body

def squeeze(src):
    # walk the source (already comment-stripped JS) and rewrite template text runs of GLSL-looking literals
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in '\'"':
            j = i + 1
            while j < n and src[j] != c: j += 2 if src[j] == '\\' else 1
            out.append(src[i:j + 1]); i = j + 1; continue
        if c == '/' and i + 1 < n and src[i + 1] in '/*':
            pass
        if c == '`':
            # find the literal's chunks (no nested templates inside our GLSL interpolations except simple ones)
            j = i + 1; chunks = []; start = j; depth = 0; interps = []
            while True:
                d = src[j]
                if d == '\\': j += 2; continue
                if d == '`': chunks.append(src[start:j]); break
                if d == '$' and src[j + 1] == '{':
                    chunks.append(src[start:j]); k = j + 2; dep = 1
                    while dep:
                        e = src[k]
                        if e in '\'"':
                            q = e; k += 1
                            while src[k] != q: k += 2 if src[k] == '\\' else 1
                        elif e == '`':
                            k += 1
                            while src[k] != '`': k += 2 if src[k] == '\\' else 1
                        elif e == '{': dep += 1
                        elif e == '}': dep -= 1
                        k += 1
                    interps.append(src[j:k]); j = k; start = k; continue
                j += 1
            lit = ''.join(chunks)
            if GL.search(lit) and '\\' not in lit:
                chunks = [squeeze_chunk(ch, k > 0, k < len(chunks) - 1) for k, ch in enumerate(chunks)]
            s = '`' + chunks[0]
            for a, b in zip(interps, chunks[1:]): s += a + b
            out.append(s + '`'); i = j + 1; continue
        out.append(c); i += 1
    return ''.join(out)
