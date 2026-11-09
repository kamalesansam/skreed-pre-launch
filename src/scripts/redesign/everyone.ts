// THERE’S SOMETHING FOR EVERYONE, section "everyone": its motion (docs/specs/redesign.md section 6, the "everyone"
// row, D16 and E-RD-motion; Sam, 2026-11-09: "add a lot of animations for the main head text ... it shouldnt look
// dead" and "have that parallax effect or any other scroll effect forthe images").
//   1. The headline, once, as it comes up the screen: its four words rise from behind their lines one after another,
//      each straightening as it lands, and SOMETHING, black at first, takes its blue from left to right (a blue copy
//      of the word over the black one, shown as far as the sweep has gone; the copy is this module's and leaves when
//      the sweep is done).
//   2. Each tile, once, as it comes up: it opens from its vertical centre line outward (the clip in rd-everyone.css,
//      whose one value is animated), the tiles of a row a beat apart by column; its chip slides up last.
//   3. Each tile's picture, scrubbed by the page's own scroll: its box is a little taller than the frame and it
//      travels that spare height as the tile's middle crosses the screen, so the picture rides a little slower than
//      the page: through the middle of the screen at about 0.9 of its pace where the PDF's crop leaves the picture
//      height to spare, about 0.92 and 0.95 for the two it does not (rd-everyone.css, --rd-ev-spare). At the middle
//      of the screen the crop is the PDF's for the first three, and as near it as the other two allow.
// Entrances leave alone whatever is already on screen when the kit arrives. Nothing is hidden in the CSS: without this
// module the section stands complete. No scroll is captured: wheel, touch and keys stay the browser's.
import { onMotion, enter, mask, words, seen } from './motion.ts';

/** seconds between the words of the headline, and when SOMETHING's sweep starts and how long it runs */
const WORD_GAP = 0.09;
const SWEEP_AT = 0.5;
const SWEEP_FOR = 0.9;
/** seconds between the columns of a row of tiles, and how long after its tile's start a chip waits */
const COLUMN_GAP = 0.12;
const CHIP_AFTER = 0.6;
/** where a tile's top stands on the screen as it starts to open: soon after it shows, so a page at rest never holds
 * a row of closed tiles above its foot */
const TILE_AT = 'top 92%';
/** the share of a picture's spare height its parallax uses: the rest keeps the box's edge a pixel outside the frame */
const REACH = 0.94;

// One build at a time. The loader can hand a setup to two matchMedia lists in the same breath (its start() runs twice
// before the kit has arrived), and a second set of entrances would take the first set's hidden start for its end.
let built = false;

onMotion((kit) => {
  const sec = document.getElementById('everyone');
  if (!sec || built) return;
  built = true;
  const { gsap } = kit;
  const undo: (() => void)[] = [() => { built = false; }];

  // 1. the headline
  const head = sec.querySelector<HTMLElement>('.rd-everyone-h');
  if (head && !seen(head, innerHeight * 0.18)) {
    mask(head);
    const tl = gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 82%', once: true } });
    tl.from(words(head), { yPercent: 120, rotate: 4, transformOrigin: '0% 100%', duration: 1, ease: 'power4.out', stagger: WORD_GAP }, 0);
    const word = head.querySelector<HTMLElement>('.rd-acc--blue');
    if (word) {
      const tint = document.createElement('span');
      tint.className = 'rd-everyone-tint';
      tint.textContent = word.textContent;
      word.classList.add('is-inked');
      word.append(tint);
      const settle = () => { tint.remove(); word.classList.remove('is-inked'); };
      tl.fromTo(tint, { '--rd-ev-sweep': '100%' }, { '--rd-ev-sweep': '-5%', duration: SWEEP_FOR, ease: 'power2.inOut', onComplete: settle }, SWEEP_AT);
      undo.push(settle);
    }
  }

  // 2 and 3. the tiles
  const tiles = [...sec.querySelectorAll<HTMLElement>('.rd-everyone-tile')];
  const lefts = [...new Set(tiles.map((t) => Math.round(t.offsetLeft)))].sort((p, q) => p - q);
  for (const tile of tiles) {
    const wait = lefts.indexOf(Math.round(tile.offsetLeft)) * COLUMN_GAP;
    enter(kit, tile, tile, { '--rd-ev-clip': '50%', duration: 1.05, ease: 'power2.inOut', delay: wait }, TILE_AT);
    const chip = tile.querySelector<HTMLElement>('.rd-everyone-chip');
    // opacity alone, never visibility: the caption stays in the accessibility tree while it waits
    if (chip) enter(kit, tile, chip, { yPercent: 70, opacity: 0, duration: 0.7, ease: 'power3.out', delay: wait + CHIP_AFTER }, TILE_AT);

    const pic = tile.querySelector<HTMLElement>('.rd-everyone-pic');
    if (pic) {
      // the spare height above (and below) the frame, in per cent of the picture's box: its travel, less a hair
      const spare = () => { const box = pic.offsetHeight; return box > 0 ? ((box - tile.clientHeight) / 2 / box) * 100 * REACH : 0; };
      // eased, so the picture is slowest against the page at the middle of the screen and joins the page's own
      // pace towards its top and its foot
      gsap.fromTo(pic, { yPercent: () => -spare() }, { yPercent: () => spare(), ease: 'sine.inOut',
        scrollTrigger: { trigger: tile, start: 'center 90%', end: 'center 10%', scrub: true, invalidateOnRefresh: true } });
    }
  }

  return () => { for (const u of undo) u(); };
});
