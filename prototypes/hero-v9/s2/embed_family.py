# Embeds the family-pages prototype into a built hero page as a non-executed base64 block (read by FAMILY in the module).
import sys, base64
page, fam = sys.argv[1], sys.argv[2]
s = open(page, encoding='utf-8').read()
assert 'id="familyDoc"' not in s
i = s.rfind('</html>'); assert i > 0
b = base64.b64encode(open(fam, 'rb').read()).decode()
s = s[:i] + '<script type="application/octet-stream" id="familyDoc">' + b + '</script>\n' + s[i:]
open(page, 'w', encoding='utf-8').write(s)
print('embedded', len(b), 'B of base64;', len(s), 'B page')
