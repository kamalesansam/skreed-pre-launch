# Comment and indentation stripper for the page's inline scripts (build time only; the template stays readable).
# JS: removes // and /* */ comments outside strings, template text and regex literals; keeps /*NAME*/ build placeholders.
# Template text (our GLSL): removes // comments to the end of the line. Every line keeps its newline (no ASI hazard);
# leading indentation, trailing blanks and empty lines go.
import re

def strip_js(src):
    out, i, n = [], 0, len(src)
    stack = []            # template nesting: each entry is the brace depth inside a ${ } expression
    prev = ''             # last significant code char, for regex detection
    def emit(s):
        out.append(s)
    while i < n:
        c = src[i]
        in_tpl_text = stack and stack[-1] is None
        if in_tpl_text:
            if c == '\\': emit(src[i:i + 2]); i += 2; continue
            if c == '`': emit(c); stack.pop(); i += 1; prev = '`'; continue
            if c == '$' and src[i + 1:i + 2] == '{': emit('${'); stack[-1] = 'x'; stack.append(0); i += 2; prev = '{'; continue
            if c == '/' and src[i + 1:i + 2] == '/':
                j = src.find('\n', i); j = n if j < 0 else j
                i = j; continue
            emit(c); i += 1; continue
        # code
        if c in '\'"':
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == '\\' else 1
            emit(src[i:j + 1]); i = j + 1; prev = c; continue
        if c == '`':
            emit(c); stack.append(None); i += 1; continue
        if c == '/' and src[i + 1:i + 2] == '/':
            j = src.find('\n', i); j = n if j < 0 else j
            i = j; continue
        if c == '/' and src[i + 1:i + 2] == '*':
            j = src.index('*/', i + 2) + 2
            body = src[i:j]
            if re.fullmatch(r'/\*[A-Z0-9]+\*/', body): emit(body)
            i = j; continue
        if c == '/' and (prev == '' or prev in '(,=:[!&|?{};+-*%<>~^'):
            j = i + 1; cls = False
            while j < n:
                d = src[j]
                if d == '\\': j += 2; continue
                if d == '[': cls = True
                elif d == ']': cls = False
                elif d == '/' and not cls: break
                j += 1
            j += 1
            while j < n and src[j].isalpha(): j += 1
            emit(src[i:j]); i = j; prev = '/'; continue
        if c == '{' and stack: stack[-1] += 1
        if c == '}' and stack:
            if stack[-1] == 0:
                stack.pop(); stack[-1] = None; emit(c); i += 1; continue
            stack[-1] -= 1
        if not c.isspace(): prev = c
        emit(c); i += 1
    lines = [l.strip() for l in ''.join(out).split('\n')]
    return '\n'.join(l for l in lines if l)

def strip_css(src):
    # CSS comments, keeping the /*LOADER-CSS*/ markers the budget check needs
    return re.sub(r'/\*(?!LOADER-CSS)[\s\S]*?\*/', '', src)

def strip_page(t):
    # module script and the inline loader script, plus the page's style block
    a = t.index('<script type="module">') + len('<script type="module">'); b = t.index('</script>', a)
    t = t[:a] + '\n' + strip_js(t[a:b]) + '\n' + t[b:]
    a = t.index('<script>', t.index('<div class="intro"')) + len('<script>'); b = t.index('</script><!--LOADER-END-->', a)
    t = t[:a] + strip_js(t[a:b]) + t[b:]
    a = t.index('<style>') + len('<style>'); b = t.index('</style>', a)
    css = '\n'.join(l.rstrip() for l in strip_css(t[a:b]).split('\n') if l.strip())
    return t[:a] + '\n' + css + '\n' + t[b:]
