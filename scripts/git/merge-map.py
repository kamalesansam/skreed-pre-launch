#!/usr/bin/env python3
"""The merge map: which in-flight branches collide, where, before anything lands.

Snapshots every session worktree (its branch tip plus its uncommitted work) as an unreferenced commit, then measures
with `git merge-tree`: each branch against the default, the true session-to-session conflicts (each side first merged
onto the default, so only the two sessions' own changes collide), the files two or more sessions change, and the exact
hunks that overlap or abut on the default's lines (git merges edits to adjacent lines as one conflicting hunk; one
unchanged line between them is enough to merge clean).

Read-only for every worktree and ref: it writes loose objects only (snapshot commits no ref points to; `git gc` drops
them) and its index files and the JSON under --out (a temporary folder by default).

    python3 -I scripts/git/merge-map.py                      the whole map
    python3 -I scripts/git/merge-map.py --mine <branch>      one branch: its conflicts with the default and with each other
    python3 -I scripts/git/merge-map.py --default origin/main --out /tmp/map

Which worktrees count: every worktree listed by `git worktree list` except the main checkout, whose branch starts with
claude/ and is either ahead of the default or dirty (so a session that has not committed yet is in the map too);
--exclude leaves named branches out. The default is origin/main when it
exists, else the branch origin/HEAD points at. Run `git fetch origin` first.
"""
import argparse, itertools, json, os, re, subprocess, sys, tempfile

# Tool state some plugins drop into a checkout untracked; never part of the site, so never part of a snapshot.
NOISE = ('.claude-flow', '.claude/proven-config.json', '.claude/.proven-config-version')
BINARY = ('.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.bin', '.glb', '.gltf', '.ktx2', '.woff2', '.woff', '.mp4', '.mov', '.pdf', '.zip')
HEADING = re.compile(r'^(#{1,6} |describe\(|test\(|it\(|export |function |const |class |\[)|^[^\s{}/*].*\{\s*$')
HUNK = re.compile(r'^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@')


def git(*args, cwd=None, env=None, check=True):
    r = subprocess.run(['git', *args], cwd=cwd, env=env, capture_output=True, text=True, errors='replace')
    if check and r.returncode not in (0, 1):
        sys.exit(f'git {" ".join(args)} failed ({r.returncode}): {r.stderr.strip()}')
    return r.stdout, r.returncode


def default_ref(explicit):
    if explicit:
        return explicit
    out, rc = git('rev-parse', '--verify', '--quiet', 'origin/main', check=False)
    if rc == 0:
        return 'origin/main'
    out, rc = git('symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD', check=False)
    if rc == 0:
        return out.strip().replace('refs/remotes/', '', 1)
    sys.exit('no origin/main and no origin/HEAD: pass --default <ref>')


def worktrees(default, exclude=()):
    out, _ = git('worktree', 'list', '--porcelain')
    found, cur = [], {}
    for line in out.splitlines() + ['']:
        if not line:
            if cur:
                found.append(cur)
            cur = {}
            continue
        k, _, v = line.partition(' ')
        cur[k] = v
    rows = []
    for i, wt in enumerate(found):
        path, branch = wt.get('worktree'), wt.get('branch', '')
        if i == 0:  # the main checkout, where landings happen: never a session's branch
            continue
        if not branch.startswith('refs/heads/claude/') or not os.path.isdir(path) or 'prunable' in wt:
            continue
        if branch.replace('refs/heads/', '', 1) in exclude:
            continue
        head, _ = git('rev-parse', 'HEAD', cwd=path)
        ahead, _ = git('rev-list', '--count', f'{default}..HEAD', cwd=path)
        status, _ = git('status', '--porcelain', cwd=path)
        if int(ahead.strip() or 0) == 0 and not status.strip():
            continue
        rows.append({'path': path, 'branch': branch.replace('refs/heads/', '', 1), 'head': head.strip(), 'ahead': int(ahead.strip() or 0), 'dirty': bool(status.strip())})
    return rows


def snapshot(row, out):
    """The branch tip plus the worktree's uncommitted work (tracked edits, new files, deletions; .gitignore honoured)."""
    idx = os.path.join(out, 'index-' + row['branch'].replace('/', '__'))
    env = dict(os.environ, GIT_INDEX_FILE=idx)
    if os.path.exists(idx):
        os.remove(idx)
    git('read-tree', 'HEAD', cwd=row['path'], env=env)
    git('add', '-A', '.', cwd=row['path'], env=env)
    git('rm', '--cached', '-q', '-r', '--ignore-unmatch', '--', *NOISE, cwd=row['path'], env=env, check=False)
    tree, _ = git('write-tree', cwd=row['path'], env=env)
    sha, _ = git('commit-tree', tree.strip(), '-p', row['head'], '-m', f'merge-map snapshot of {row["branch"]} (uncommitted work included)')
    return sha.strip()


def conflicts(a, b):
    out, _ = git('merge-tree', '--write-tree', '--name-only', '--no-messages', a, b)
    lines = out.splitlines()
    return lines[0] if lines else '', [l for l in lines[1:] if l]


def hunks(default, commit, path):
    out, _ = git('diff', '-U0', default, commit, '--', path)
    res = []
    for line in out.splitlines():
        m = HUNK.match(line)
        if not m:
            continue
        a, b = int(m.group(1)), 1 if m.group(2) is None else int(m.group(2))
        res.append((a, a, True) if b == 0 else (a, a + b - 1, False))
    return res


def heading(src, line):
    for i in range(min(line, len(src)) - 1, -1, -1):
        if HEADING.match(src[i]):
            return f'L{i + 1} ' + src[i].strip()[:90]
    return 'top of file'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--default', help='the ref everything lands on (default: origin/main if it exists, else origin/HEAD)')
    ap.add_argument('--out', help='folder for the index files and merge-map.json (default: a temporary folder)')
    ap.add_argument('--mine', help='report one branch only (its short name is fine)')
    ap.add_argument('--exclude', default='', help='comma-separated branches to leave out')
    args = ap.parse_args()
    default = default_ref(args.default)
    tip, _ = git('rev-parse', default)
    tip = tip.strip()
    out = args.out or tempfile.mkdtemp(prefix='merge-map-')
    os.makedirs(out, exist_ok=True)
    rows = worktrees(default, [b.strip() for b in args.exclude.split(',') if b.strip()])
    if not rows:
        sys.exit(f'no in-flight worktree (a claude/* branch ahead of {default} or dirty)')
    keys = {}
    for r in rows:
        k = r['branch'].replace('claude/', '', 1)
        keys[k] = r
    mine = None
    if args.mine:
        m = args.mine.replace('claude/', '', 1)
        if m not in keys:
            sys.exit(f'--mine {args.mine}: not an in-flight worktree branch; known: {", ".join(keys)}')
        mine = m
    print(f'merge map against {default} at {tip[:7]}, {len(keys)} in-flight worktrees\n')
    print('=== BRANCHES (snapshot = tip + uncommitted work; ahead = commits the default lacks)')
    snaps, merged = {}, {}
    for k, r in keys.items():
        snaps[k] = snapshot(r, out)
        print(f'  {k:40s} {r["head"][:7]} ahead {r["ahead"]:3d} {"dirty" if r["dirty"] else "clean"}  {r["path"]}')
    print()
    print('=== CONFLICTS AGAINST THE DEFAULT (what that session must resolve by merging the default in before it can land)')
    vs_default = {}
    for k in keys:
        if mine and k != mine:
            continue
        tree, files = conflicts(default, snaps[k])
        _, tipfiles = conflicts(default, keys[k]['head'])
        contains, rc = git('merge-base', '--is-ancestor', default, snaps[k], check=False)
        vs_default[k] = {'snapshot': files, 'tip': tipfiles, 'contains_default': rc == 0}
        state = 'contains the default' if rc == 0 else 'behind the default'
        print(f'  {k:40s} {state}; ' + ('CLEAN' if not files else f'CONFLICT {len(files)}: ' + ' '.join(files)))
    print()
    for k in keys:
        tree, _ = conflicts(default, snaps[k])
        sha, _ = git('commit-tree', tree, '-p', tip, '-p', snaps[k], '-m', f'merge-map: {k} onto the default, unresolved markers kept')
        merged[k] = sha.strip()
    print('=== SESSION-TO-SESSION CONFLICTS (each side first merged onto the default, so only the two sessions\' own changes collide)')
    pairs = {}
    for a, b in itertools.combinations(keys, 2):
        if mine and mine not in (a, b):
            continue
        _, files = conflicts(merged[a], merged[b])
        pairs[f'{a} x {b}'] = files
        print(f'  {a:28s} x {b:28s} ' + ('CLEAN' if not files else f'CONFLICT {len(files)}: ' + ' '.join(files)))
    print()
    changed = {}
    for k in keys:
        o, _ = git('diff', '--name-only', tip, merged[k])
        changed[k] = set(l for l in o.splitlines() if l)
    byfile = {}
    for k in keys:
        for f in changed[k]:
            byfile.setdefault(f, []).append(k)
    shared = {f: ks for f, ks in byfile.items() if len(ks) >= 2 and (not mine or mine in ks)}
    print(f'=== FILES CHANGED BY TWO OR MORE SESSIONS ({len(shared)})')
    for f in sorted(shared):
        print(f'  {f}: {" ".join(shared[f])}')
    print()
    print('=== HUNK COLLISIONS (default-side lines two sessions both change, overlapping or adjacent; the section each sits in)')
    collisions = []
    for f in sorted(shared):
        if f.lower().endswith(BINARY):
            collisions.append({'file': f, 'binary': True, 'sessions': shared[f]})
            print(f'  BINARY {f}: {" ".join(shared[f])}')
            continue
        src, _ = git('show', f'{tip}:{f}', check=False)
        src = src.splitlines()
        hk = {k: hunks(tip, merged[k], f) for k in shared[f]}
        for a, b in itertools.combinations(shared[f], 2):
            if mine and mine not in (a, b):
                continue
            for s1, e1, _i in hk[a]:
                for s2, e2, _j in hk[b]:
                    if s1 <= e2 + 1 and s2 <= e1 + 1:
                        sec = heading(src, min(s1, s2))
                        collisions.append({'file': f, 'binary': False, 'pair': [a, b], 'a': [s1, e1], 'b': [s2, e2], 'section': sec})
                        print(f'  {f}  {a} L{s1}-{e1}  vs  {b} L{s2}-{e2}   [{sec}]')
    report = {'default': default, 'tip': tip, 'branches': keys, 'snapshots': snaps, 'merged_onto_default': merged, 'vs_default': vs_default, 'pairs': pairs, 'shared': shared, 'collisions': collisions}
    with open(os.path.join(out, 'merge-map.json'), 'w') as fh:
        json.dump(report, fh, indent=1)
    print(f'\nJSON: {os.path.join(out, "merge-map.json")}')
    if mine:
        sys.exit(1 if vs_default[mine]['snapshot'] or not vs_default[mine]['contains_default'] else 0)


if __name__ == '__main__':
    main()
