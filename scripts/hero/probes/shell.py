"""Split template.html into the parts the real build would ship and size each raw / gzip -9 / brotli q11.
Writes shell.html (first-view document: no module, no Tune, no importmap, no Google Fonts link) into the out dir.
Usage: python3 -I shell.py <template.html> <out dir>"""
import gzip, re, sys, os, brotli
t = open(sys.argv[1], encoding='utf-8').read(); out = sys.argv[2]
def sz(s):
    b = s.encode() if isinstance(s, str) else s
    return len(b), len(gzip.compress(b, 9)), len(brotli.compress(b, quality=11))
def cut(a, b, s=None):
    s = t if s is None else s; i = s.index(a); j = s.index(b, i) + len(b); return s[i:j]
parts = {}
style = cut('<style>', '</style>')
loader_css = cut('/*LOADER-CSS*/', '/*LOADER-CSS-END*/')
tune_css = '\n'.join(l for l in style.split('\n') if l.startswith('.tune') or l.startswith('.seg'))
parts['<style> block (all CSS, incl. loader CSS and Tune CSS)'] = style
parts['  of which loader CSS'] = loader_css
parts['  of which Tune panel CSS (prototype only)'] = tune_css
parts['sprite <svg> (wordmark path, shared by loader and corner logo)'] = cut('<svg class="sprite"', '</svg>')
parts['loader markup + inline script (intro div .. LOADER-END)'] = cut('<div class="intro"', '<!--LOADER-END-->')
parts['hero DOM (corner logo, labels, track, countdown, cue)'] = cut('<a class="site-logo"', '<div class="cue"')
parts['countdown + cue inline script'] = cut('<script>/* countdown', '</script>')
parts['section 2 placeholder copy'] = cut('<section class="copy wallcopy"', '</section>')
parts['Tune panel markup (prototype only)'] = cut('<details class="tune"', '</details>')
parts['no-hero fallback script + fallback <p>'] = cut('<script>/* if the 3D module', '</p>', t[t.index('<script>/* if the 3D module'):]) if False else cut('<script>/* if the 3D module', 'would stay.</p>')
parts['importmap (CDN, replaced by bundling)'] = cut('<script type="importmap">', '</script>')
mod = cut('<script type="module">', '</script>')
parts['scene module source (unminified, placeholders empty)'] = mod
parts['Google Fonts <link> (replaced by self-hosted @font-face)'] = cut('<link rel="preconnect"', 'display=swap">')

shell = t
for k in ('Tune panel markup (prototype only)', 'importmap (CDN, replaced by bundling)', 'scene module source (unminified, placeholders empty)', 'Google Fonts <link> (replaced by self-hosted @font-face)', 'section 2 placeholder copy'):
    shell = shell.replace(parts[k], '')
shell = shell.replace(tune_css, '')
open(os.path.join(out, 'shell.html'), 'w').write(shell)
parts['= first-view shell.html (template minus module, Tune, importmap, fonts link, s2 placeholder)'] = shell
parts['template.html as a whole (placeholders empty)'] = t
print('| part | raw B | gzip -9 B | brotli q11 B |\n|---|---:|---:|---:|')
for k, v in parts.items(): print('| %s | %d | %d | %d |' % ((k,) + sz(v)))
