# Section 3: Find your shade (the quiz)

Slug `quiz`. Planned 2026-10-16 from Sam's brief of the same day, on the real build (Sam: "from now on, we will directly build on the real build itself"); built 2026-10-16 on the real build and rebuilt the same day on Sam's quiz content (quoted below); amended 2026-10-17 for the config's exact use of Sam's wording and the deck's fixes (one deck height for all ten questions, Back's 44 px width and its busy guard, the compatible row's narrower columns); this version describes the section as built. Spine row 3 of `docs/00-IDEATION.md` ("Find your shade"); the quiz tab only, the photo and camera tabs are out of scope (section 8). Review log: `docs/specs/quiz.review.md`. Every number and string below is read from the code (`src/components/quiz/Quiz.astro`, `src/styles/quiz.css`, `src/scripts/quiz/deck.ts`, `src/scripts/quiz/track.ts`, `src/config/quiz.ts`, `src/config/shades.gen.ts`, `src/scripts/hero/section3/ground.ts`, `src/scripts/hero/loop.ts`, `src/scripts/hero/hero.ts`, `src/config/hero.ts`); where the code and an earlier plan disagree, the code is what this document describes.

Sam's words (2026-10-16), verbatim:

> we have to move forward to the 3rd section which is a quiz section, we will have the same backround as the 2nd section, and we will have the transition, from section 2 to section 3 similar to section 1 to section 2, and after the transition, the next will section will scroll up, which has the basic idea like this :
>
> (After the shade section) SPOILT FOR CHOICE? LET'S FIND YOUR SIGNATURE SHADE. or, OVERWHELMED BY 240 SHADES? LET'S FIX THAT. (Subtext) Grab a coffee, sit back and get comfortable, answer a few questions, and we'll match you to your perfect Skreed shade. (Clear CTA: Swipe to Begin) (End the quiz with the result visible right then and there, then add the email signup as a little extra reward for completing the quiz.) [Result: their shade] Found the perfect shade? Make it yours! or, And here's a little something extra... Leave your email and we'll send you a surprise gift inspired by your shade right away, plus an exclusive discount code to shop your signature shade when we launch.

Sam's content (2026-10-16, later the same day), verbatim:

> ```text
> The Quiz (takes 5 minutes to complete) 
> Every shade has a personality. 
> 
> 4. Pick your ideal Sunday. VISUAL 
> Front row at a concert, lights blazing → The Main Character 
> A rainy day, a good playlist, total silence → The Quiet Curator 
> A rooftop party that starts at noon → The Spark 
> A beach bonfire with your whole friend group → The Warm Optimist 
> A spontaneous road trip, no destination → The Romantic Rebel 
> Getting lost in a bookstore for hours → The Dreamer 
> A quiet morning, coffee, and a plan → The Calm Strategist 
>  
>  
> 5. What’s your comfort drink? 
> Espresso, straight up → The Main Character
> Oat milk latte, no sugar → The Quiet Curator
> Fresh lemonade → The Spark
>  
> Masala chai, extra ginger → The Warm Optimist
> Strawberry milkshake → The Romantic Rebel
> Butterfly pea tea → The Dreamer
> Filter coffee, no sugar → The Calm Strategist
> 
> 7. Pick your dream trip. VISUAL 
> Vegas, lights on all night → The Main Character
> A vineyard in Tuscany → The Quiet Curator
> Rio during Carnival → The Spark
> A hammock in Bali, no plans → The Warm Optimist
> Paris → The Romantic Rebel
> Santorini at sunset → The Dreamer
> A quiet lake in Switzerland → The Calm Strategist
>  
>  
> 8. Your friends would call you the one who... 
> Makes every plan actually happen → The Main Character
> Has impeccable, effortless taste → The Quiet Curator
> Is always up for anything, any time → The Spark
> Checks in on everyone, always → The Warm Optimist
> Feels everything, loudly and honestly → The Romantic Rebel
> Is always three ideas ahead of everyone else → The Dreamer
> Has a plan for the backup plan → The Calm Strategist
> 
>  
> 9. Pick your ideal desk setup. VISUAL 
> A bold statement piece, front and centre → The Main Character
> Wood, linen, clean surface, one plant → The Quiet Curator
> String lights and stickers, everywhere → The Spark
> Photos of everyone you love → The Warm Optimist 
> Pink everything, no exceptions → The Romantic Rebel
> Fairy lights and half-finished sketches → The Dreamer
> Colour-coded planner, zero clutter → The Calm Strategist
>  
> 10. Pick a movie night. 
> Big blockbuster, opening night → The Main Character
> An indie film nobody’s heard of yet → The Quiet Curator
> A rom-com with your loudest friends → The Spark
> A feel-good favourite you’ve seen ten times → The Warm Optimist 
> Anything that makes you cry, honestly → The Romantic Rebel
> Something surreal you’ll be thinking about for days → The Dreamer
> A tightly plotted thriller → The Calm Strategist
> 
> 13. You walk into a party. Where do you find yourself? 
> Under the spotlight, surrounded by people → The Main Character  
> A quiet corner with a beautiful view → The Quiet Curator  
> Dancing in the middle of the crowd → The Spark  
> Outside with a small group, drinks in hand → The Warm Optimist  
> Somewhere unexpected, laughing with new people → The Romantic Rebel  
> On a balcony, watching everything unfold → The Dreamer  
> At a table with a drink, taking it all in → The Calm Strategist 
>  
> 14. Pick the room you’d want to wake up in. VISUAL 
> Dramatic four-poster bed, velvet curtains, sunlight pouring in → The Main Character 
> Linen sheets, warm wood, one perfect vase of flowers → The Quiet Curator 
> Colourful room, funky lamp, records playing → The Spark 
> Sunlit room opening onto a garden → The Warm Optimist 
> Pink sheets, scattered love notes, flowers everywhere → The Romantic Rebel 
> Moody room, books, art, plants, and a window overlooking the city → The Dreamer 
> Minimal room, crisp sheets, coffee already waiting → The Calm Strategist 
>  
> 15. Pick the outfit you’d wear without overthinking it. VISUAL 
> A sharp red dress with statement shoes → The Main Character  
> A perfectly tailored neutral set → The Quiet Curator  
> Bright top, fun accessories, unexpected shoes → The Spark  
> Breezy dress, sandals, woven bag → The Warm Optimist  
> Pink mini dress, playful bag, lots of jewellery → The Romantic Rebel  
> Dark layered outfit with an unusual vintage piece → The Dreamer  
> Crisp shirt, tailored trousers, minimalist watch → The Calm Strategist 
>  
> 16. If you could read everyone’s mind for one day, what would you look for? 
>  
> What everyone really thinks of me → The Main Character  
> Whether people are being genuine → The Quiet Curator  
> The funniest thing someone has ever thought → The Spark  
> What would make everyone around me happier → The Warm Optimist  
> What someone secretly feels about me → The Romantic Rebel  
> The weirdest, most unexpected thought in the room → The Dreamer  
> What people are planning before they do it → The Calm Strategist
> 
> Response groups:
> 
> 1. The Quiet Curator 
> Personality Profile:
> You curate your life the way you’d curate a gallery – nothing stays unless it earns its place. 
> You’re thoughtful, observant, and quietly confident. You have a calming presence and an eye 
> for the understated. You choose with intention, gravitating towards things that feel balanced, 
> timeless, and effortlessly distinctive rather than simply trendy. 
> Colour Profile:
> Soft, warm neutrals with quiet depth. Your palette doesn’t shout. 
> Recommended Shade: Porcelain
> Recommended Finish: Matte
> Confidence Score: 96%
> Rarity: Top 8% 
> Also Compatible With:
> Stone Blue • Almond • Sage Green • Pale Grey • Powder Blue • Linen 
>  
> 2. The Spark 
> Personality Profile:
> You’re the reason the group chat is active at 11 p.m. Rooms feel different when you walk in – 
> brighter, faster, more fun. 
> Colour Profile:
> High-energy brights with just enough warmth to keep them from feeling harsh. 
> Recommended Shade: Sunflower 
> Recommended Finish: Glossy
> Confidence Score: 91%
> Rarity: Top 9% 
> Also Compatible With: Bubblegum Pink • Tangerine • Fuchsia • Amethyst • Mimosa 
> 3. The Warm Optimist 
> Personality Profile:
> You’re the friend people call with good news first. Warm without trying, welcoming without 
> performing it, you make people feel like they’ve known you longer than they have. 
> Colour Profile:
> Warm tones with a soft edge. 
> Recommended Shade: Autumn
> Recommended Finish: Glossy
> Confidence Score: 93%
> Rarity: Top 13% 
> Also Compatible With: Bumblebee • Clementine • Honey • Rosy Brown • Daffodil • 
> Marmalade 
>  
> 4. The Main Character 
> Personality Profile:
> You don’t chase attention, you command it. Bold decisions, strong opinions, zero interest in 
> blending in. Every story you tell somehow becomes the best one in the room. 
> Colour Profile:
> Rich, saturated, and attention-grabbing tones. 
> Recommended Shade: Ruby 
> Recommended Finish: Glossy
> Confidence Score: 97%
> Rarity: Top 6% 
> Also Compatible With: Burgundy • Claret • Wine • Midnight Blue • Crimson • Paprika 
>  
> 5. The Romantic Rebel 
> Personality Profile:
> Soft on the outside, stubborn underneath. You lead with feeling, not logic, and you’ve never 
> once regretted it. Sentimental about the little things, allergic to anything that feels forced. 
> Colour Profile:
> Playful, expressive brights with a soft edge. 
> Recommended Shade: Ballerina Pink 
> Recommended Finish: Glossy
> Confidence Score: 89%
> Rarity: Top 14% 
> Also Compatible With: Rose • Mauve • Blush • Strawberry • Lilac • Raspberry 
> 6. The Dreamer 
> Personality Profile:
> Half in this world, half somewhere more interesting. You notice things other people miss, and 
> you’re always a little bit mid-thought. Deeply creative, gently mysterious. 
> Colour Profile:
> Deep, moody tones with a touch of whimsy. 
> Recommended Shade: Wildberry 
> Recommended Finish: Glossy
> Confidence Score: 92%
> Rarity: Top 10% 
> Also Compatible With:
> Sapphire • Chestnut • Teal Blue • Fig • Emerald • Pine Green 
>  
> 7. The Calm Strategist 
> Personality Profile:
> You’re the one everyone looks at when things go sideways, because you don’t. Composed 
> under pressure, three steps ahead, quietly running the show without needing credit for it. 
> Colour Profile:
> Nuanced neutrals with depth and a hint of color. 
> Recommended Shade: Navy Blue
> Recommended Finish: Matte
> Confidence Score: 95%
> Rarity: Top 5% 
> Also Compatible With:
> Prussian • Jade Green • Thyme • Pale Violet • Sand • Chestnut 
>  
> Note: Make the recommended shade randomised within each result group. For example, if 
> three people take the quiz and get (maximum answers corresponding to) ‘The Quiet Curator,  
> −person A gets Porcelain as the recommended shade, and Stone Blue, Almond, Sage 
> Green, Pale Grey, Powder Blue, Linen as other compatible shades. 
> −person B gets Stone Blue as the recommended shade, and Porcelain, Almond, Sage 
> Green, Pale Grey, Powder Blue, Linen as other compatible shades. 
> −person C gets Sage as the recommended shade, and Stone Blue, Porcelain, Almond, 
> Pale Grey, Powder Blue, Linen as other compatible shades. 
>  
> Similarly for the other result groups.
> 
> this is the basic idea for the content for the quiz
> ```

## 1. Goal

After the ten gems, the visitor answers ten questions of seven answers each and takes the personality they picked most often, one of Sam's seven, with a shade drawn on the spot from its group of catalog shades (Sam: "Make the recommended shade randomised within each result group"), shown with the rest of the group as compatible shades and the way to see it on the case, then leaves an email for the gift. Brand goals: 1 (a brand people connect with) and 3 (lead capture); the concept catalog's highest-converting mechanic (#8).

## 2. Phone-first wireframe in words

### 390 x 844, 3D path

**The flow model.** Section 3 is `section#find.quiz` inside `main#main`, in normal flow directly after the 1720svh track, over the hero's fixed canvas: `position: relative; z-index: 3; overflow-x: clip` (above the hero's fixed riders, the labels at 1, the cue at 2 and `#s2labels` at 3 earlier in the DOM; below the logotype at 4), no sticky, no fog plates, no still image, no background of its own. Its first child is `.qz-stage`: `min-height: 100svh`, a grid with `align-content: end` and `justify-items: center`, padded `--inset` plus `env(safe-area-inset-top)` above, `--inset` (16 px at 390) at the sides and `--inset` plus `env(safe-area-inset-bottom)` below. The stage holds the intro, the deck and the seven results, and exactly one of them is shown (`hidden` on the others). Once `data-state="result"` is set the stage's `min-height` drops to 0, so the gift block follows the result at one gap. The gift block (`div.qz-gift#qzGift`, rendered only when `PUBLIC_LEADS` is on, section 5) comes after the stage and is `hidden` until a result exists. Every panel (`.qz-panel`: the intro, each card, each result, the gift) is Pearl Whisper with Urban Slate text (9.9:1), square (`--radius-none`), no border, no shadow; `box-sizing: border-box` on everything in the section, so the full-width panels, the answer rows and the input fit the gutters at 390, and `overflow-anchor: none` on everything inside it, so scroll anchoring keeps to the section itself, whose top never moves: the result replaces the deck without the browser scrolling the page to hold a card (or the section below) still. Scroll ranges by phase: during the intro and the deck section 3 is one screen (a landscape phone excepted, where the deck is taller than the screen; Scroll, below); at the result it grows to the result panel plus the gift; "Not quite? Try again" re-hides both and scrolls the section's top back into view. In the working tree section 4 (`section#room`, `docs/specs/section-4.md`) follows section 3 in the same after-track slot, so the page goes on below the quiz in every phase.

**The hand-off from section 2 (hero scroll 15.2 to 16.2 screens, `S2T.W2` to `W2 + WIPE`).** The second wipe is the v11 composite (`post/composite.ts`, the fragment pinned to the v11.4 fixture by `tests/unit/glsl-v11.test.ts`). Its near side `tA` is section 2's frame, now held still (the composite's near-side parallax, `uParA`, is 0 for this wipe), as the hero is held still in the first wipe. Its far side `tB` is `fogGround.out`: section 2's background shader rendered alone into its own render target (`section3/ground.ts`: the drifting noise ramp, the jittered dots, the six wireframe sprites; no gems, no labels, no plates, `uLabN` 0, `uPre` 0), on a second `createBackground()` instance fed the same clock (`uTime = t`, 7 under reduced motion) and section 2's scroll formula (`uScroll = 2.15 + 0.3 * (S - S2T.W1END)`), writing sRGB directly (its last shader line swapped from section 2's encode line; the island throws at start if that line is not found). The far side still slides by `0.4 * cubicIn(1 - tp2)` screens with the composite's chromatic aberration, as the v11 shader does on any far side (only `uParA` changed), so at mid-wipe the far side is offset by about a twentieth of a screen (0.4 x cubicIn(0.5), plus up to 0.025 of displacement), more in the first frames of the cut, and the sprites double briefly across the cut; by 16.2 the fog alone fills the frame. The island renders the ground in every frame from the moment the second wipe begins (and, during the first wipe, while section 2 is still being built, as that wipe's fallback far side; section 4's code in the working tree skips it once section 4's own frame covers the screen and needs no fog) and, after the cut, draws two full-screen passes per frame: the ground into its target and the composite (`uProgress` 1, one fetch). The track is 1720svh (`TRACK_SVH` in `src/config/hero.ts`, `.track` in `src/styles/shell.css`; `tests/unit/hero-math.test.ts` keeps them equal), so with the scroll followers settled `#find`'s top reaches the viewport's bottom edge at 16.2 screens, exactly as the cut completes, and the stage fills the screen at 17.2. On a moving scroll the followers lag (0.075 then 0.15 per frame), so the intro's panel rises over the lower, already-opened part of the cut.

**The intro (at rest, 17.2 screens).** One Pearl panel (`.qz-intro`, `width: 100%; max-width: 480px`, so 358 px at 390), at the bottom of the stage, centred (it spans the gutters at 390), padding `var(--s4) var(--s3)` (24 px 16 px), rows at `gap: var(--s3)`:
- `h2.qz-h` "Spoilt for choice? Let’s find your signature shade." in Poppins 700 at `--fs-h2` (32 px at 390), `--lh-h2`, `--ls-h2`, `max-width: var(--measure-h2)` (18ch), `text-wrap: balance`: three lines at 360 and 390;
- `p.qz-sub` in Open Sans 400 at `--fs-standfirst` (19 px at 390), `--lh-standfirst`, `max-width: var(--measure-prose)`: "Grab a coffee, sit back and get comfortable. Answer a few questions and we’ll match you to your perfect Skreed shade." (type-system principle 9: the quiz is Poppins and Open Sans, no serif);
- `button.btn#qzBegin` "Swipe to begin": Ember Luxe fill, the literal Urban Slate hex `#383F43`, Open Sans 600 16 px, 48 px tall, square, padding `0 var(--s4)`, `data-loading="Loading..."`;
- without JavaScript, a `<noscript>` line under the button (`p.qz-noscript`, `--fs-small`): "The quiz needs JavaScript. Browse the ten families instead.", with "ten families" a link to `/#families`; `nav#families` is rendered only while `FAMILY_PAGES` is on (`src/components/family/FamilyLinks.astro`: dev, test and staging builds, or `PUBLIC_FAMILY_PAGES=on`), so on today's production build (`npm run build`) the anchor has no target (section 10, 5). The button itself stays in the markup and does nothing without JavaScript.
The fog drifts behind the panel. There is no swipe-up gesture on the intro: the page pans as usual (the stage sets no `touch-action`), and the button alone begins, by tap, click, Enter or Space. The quiz chunk (`deck.ts` and `config/quiz.ts`, a separate lazy Vite chunk, with `scripts/quiz/track.ts` in a small chunk of its own that section 4's walk shares) is imported by the component's module script when the section comes within one screen (an IntersectionObserver on `#find` with `rootMargin: '100% 0px'`), or at once where IntersectionObserver is missing. The button's own listener keys on the chunk having mounted, not on the import having started: any press before `mountQuiz` has run (whether the import is still in flight or not yet asked for) sets `aria-disabled="true"`, `aria-busy="true"`, the label "Loading..." and `data-pending="1"`, starts the import if nothing has, and keeps focus; `mountQuiz` restores the button and replays the pending press, so the quiz begins by itself when the chunk arrives (D18; the e2e drives it with the chunk held by a route). An import that rejects (a chunk gone after a redeploy, a dropped connection) gives the button back with its label, so the next press tries again, and the loader retries by itself on the `online` event. `mountQuiz` throws if any of the section's own elements is missing (a broken build) and returns before the form code when the gift block is absent.

**Begin.** `beginQuiz()`: the intro fades out (opacity 1 to 0, 200 ms `DUR_OUT`, `EASE_STANDARD`, `fill: 'forwards'`, then cancelled and the intro `hidden`); the deck is shown and `data-state="quiz"` set; the deck rises (translateY 24 px to 0 with opacity 0 to 1, 400 ms, `EASE_STANDARD`; skipped under reduced motion); card 1 is shown without the enter animation, takes `tabIndex 0` and focus (`preventScroll`), and the live region announces "Question 1 of 10: Pick your ideal Sunday.". `quiz_start` is tracked.

**The deck (the same screen).** `.qz-deck` (a grid, `gap: var(--s4)`, full width, items centred) holds `div.qz-cards#qzCards`, a grid of `width: 100%; max-width: 480px` (358 px at 390). The ten `div.qz-card.qz-panel[data-i][role="group"][aria-label="Question n of 10"][tabindex="-1"]` share its one grid cell (`grid-area: 1 / 1`, `position: relative`), so no height is set and nothing is positioned absolutely. A `hidden` card keeps its place in the cell (`.qz-card[hidden] { display: grid; visibility: hidden; }`), so all ten size the cell and the deck holds the tallest card's height from the first question to the last, with no height change between questions; a shorter card stretches to the cell, its answers at the top under the question and its footer at the bottom (the `1fr` row takes the extra height and `.qz-opts` keeps `align-content: start`). The deck, the tallest card's height, is 661 px at 390 x 844 and 679 px at 360 x 780 (measured on the `dist-s3` build of 2026-10-17, from the current source). The five visual cards (1, 3, 5, 8 and 9) carry `data-visual` and look exactly like the other five (section 3). The markup ships cards 1 and 2 unhidden and 3 to 10 `hidden`, inside the hidden deck. `showCard(i, enter)` gives card i `.is-top` (z-index 1, `tabIndex 0`, focus) and card i + 1 `.is-next` (z-index 0, `transform: scale(0.96)`, also set inline), makes every card but the top one `inert` (the card behind shows but takes no focus and no clicks), hides the rest (invisible and inert, still holding the cell) and clears any `aria-pressed` left on an answer. Each card is a grid of three rows (`auto 1fr auto`, `gap: var(--s3)`, `align-content: start`, padding `var(--s4) var(--s3)`, 24 px 16 px; `user-select: none`, `transform-origin: 50% 100%`, `will-change: transform`; no `touch-action` and no `grab` cursor):
- `h3.qz-q`, the question in Poppins 700 at `--fs-clause` (24 px at 390, 28 px at 1280), `--lh-quiz`, `--ls-quiz`, `text-wrap: balance`, left-aligned: "Pick your ideal Sunday." (D15);
- `.qz-opts`, the seven answers in one column (a grid, `gap: var(--s1)`, 8 px between rows, `align-content: start`), in the card's fixed order (section 3, D23): each a `button.qz-opt[data-persona]` holding the answer's text and nothing else (no swatch, no picture, no `aria-label`: the text is its accessible name), a full-width row in Open Sans 400 at `--fs-legal` (16 px at 390, 17 px at 1280), `--lh-ui`, left-aligned, Pearl Whisper fill, a 1 px Urban Slate hairline, square, `min-height: 44px`, padding `var(--s1) var(--s3)` (8 px 16 px); a one-line answer is 44 px tall and a two-line answer 63 px at 390;
- `.qz-foot`, the last row, a grid `1fr auto 1fr` (`align-items: center`): `button.txtbtn.qz-back` "Back" at the left on cards 2 to 10, at least 44 x 44 px (the text button's 44 px height and `min-width: 44px` on `.qz-foot .qz-back`; an empty `<span>` holds the cell on card 1), and `ol.qz-step` (`aria-hidden`) in the centre: ten `li.qz-dot`, 10 px circles with a 1 px Urban Slate ring, `gap: var(--s1)` (172 px in all); the dots of the cards already answered carry `data-done` and fill solid Urban Slate (card n shows n - 1 filled dots; the attribute is server-rendered per card, so the fill arrives with the next card). No shade-filled dots and no "3 of 10" text.

**An answer (tap, click, Enter, Space).** A click on an answer of the top card, from a finger, a mouse, or Enter or Space on the focused button, commits it (`commit(opt)`): the personality is stored as that card's answer, `quiz_answer { q, persona }` is tracked, and the button takes `aria-pressed="true"`, which fills it Urban Slate with Pearl Whisper text (the marked answer, 9.9:1). The mark holds for 120 ms (`DUR_MARK`; 0 under reduced motion), then the card flies off to the left, whichever answer it was: from `none` to translated left by 1.3 times the card's width and rotated -14 degrees (`translateX(${-w * 1.3}px) rotate(-14deg)` in `deck.ts`, `w` the card's `offsetWidth`, 320 if it reads 0), 300 ms `DUR_CARD`, `EASE_IN`, `fill: 'forwards'`, opaque all the way (it covers the next card until it has left), then cancelled, the card `hidden`, `top` advanced. The next card comes forward from `scale(0.96)` to `none` in 300 ms `EASE_STANDARD` (no opacity ramp), is announced ("Question 2 of 10: What’s your comfort drink?") and focused. From the press to the end of the fly-off (`busy`) a second press and Back do nothing. `overflow-x: clip` on the section keeps the translated, rotated card out of the scrollable overflow, so the page never gains a horizontal scroll range.

**Back.** On cards 2 to 10, "Back" (`back()`) drops the last answer, tracks `quiz_back { q }` (the card it was pressed on) and shows the previous card again: it comes back in from the left, from translated left by 1.3 times its width and rotated -14 degrees (`translateX(${-(c.offsetWidth || 320) * 1.3}px) rotate(-14deg)` in `deck.ts`) to `none` in 300 ms `EASE_STANDARD` (a 150 ms fade under reduced motion), over the card that was on top, which goes back behind it at 0.96 and inert. The live region announces it and it takes focus. From the press until the return has finished (`busy` for 300 ms, 150 ms under reduced motion) no answer is taken and a second Back does nothing. Its earlier answer is not shown as marked (every `showCard` clears `aria-pressed`), so the visitor picks again and the new answer replaces the old.

**Keyboard.** With the top card focused (`role="group"`, `tabindex="0"`; the answers and Back inside it are in the tab order and their keydown bubbles to the card), ArrowDown and ArrowUp (`preventDefault`) move focus among the seven answers: from the card itself, or from Back, Down goes to the first answer and Up to the last; from an answer, Down goes to the next and Up to the previous, stopping at either end. Enter or Space on a focused answer commits it, as on any button. Tab reaches the seven answers, then Back. ArrowLeft and ArrowRight do nothing. The tab order through the page on the 3D path: the corner logotype, the ten family links (`nav#families`, fixed over the viewport and in the tab order by the family-page contract; focusing one snaps the scroll back to the gems; present only in builds with `FAMILY_PAGES` on, section 10, 5), then section 3's controls.

**No drag.** Nothing on the cards responds to a pointer drag: `deck.ts` has no Pointer Events handlers (the dead zone, the capture, the lean, the flick, the swallowed click and the spring-back went with the swipe), and the cards set no `touch-action`, so a finger moving over a card pans the page as over any panel, and a horizontal drag moves nothing and commits nothing (D20).

**The result (replaces the deck, same stage).** After the tenth commit `finish()` scores the answers and draws the shade (section 5): `scoreQuiz(answers)` gives the personality and `pickShade(p)` one shade of its group, the others in group order. It hides the deck and shows the one of the seven server-rendered `article.qz-result.qz-panel[data-persona][data-finish]` whose personality matches (the other six stay `hidden`). Into that panel it writes the drawn shade, read from the shade's own `li.qz-mini`, whose data attributes carry what `Quiz.astro` resolved at build (D25): the large swatch's `data-shade`, its background (`var(--shade-<id>)` through the CSSOM) and its `data-ring`; the heading ("Sage."); the family line ("Go Green, shade 9 of 24"); the href of "See it on the case" (`/shades/go-green/?shade=201`); and it hides that `li.qz-mini`, so the compatible row shows the rest of the group. It then shows the results and the gift block, sets `data-state="result"` (the stage's `min-height` becomes 0), tracks `quiz_complete { persona, shade, others }`, animates the panel in (`scale(0.96)` and opacity 0 to `none` and 1, 400 ms, `EASE_STANDARD`; skipped under reduced motion), announces "Your shade: Sage. The Quiet Curator." through `p.sr-only#qzLive[aria-live="polite"]`, focuses `h3.qz-shade` (`tabindex="-1"`; its own `outline-offset: 2px` in `quiz.css` is overridden by `.quiz :focus-visible`, the more specific rule, so the ring sits at 4 px like every other control's), and writes the shade id, family id, finish and personality id into the form's dataset. Before any draw the markup carries each group's first shade, Sam's recommendation, in those places. The panel (`.qz-results` at `max-width: 480px`, the article padded `var(--s4) var(--s3)`, rows at `gap: var(--s3)`, items and text centred) holds, in order:
- `span.qz-big[data-shade]` (`aria-hidden`), a 160 px circle in the drawn shade, with a 1 px Urban Slate hairline when the shade is under 1.5:1 on Pearl Whisper (`data-ring`; nine of the 47 shades, section 3);
- `.qz-rtext` (`gap: var(--s2)`, no per-line margins): `p.qz-eyebrow` "Your shade" (Open Sans 600, `--fs-eyebrow`, line height 1.2); `h3.qz-shade` "Sage." (Poppins 700, `--fs-tile-name`, `--lh-tile`, `--ls-tile`); `p.qz-fam` "Go Green, shade 9 of 24" (`--fs-family`, tabular numerals); `p.qz-finish` "Best in matte." or "Best in gloss." (`--fs-family`, the personality's finish); `p.qz-persona` "The Quiet Curator" (the name alone, no tagline; Open Sans 600, `--fs-legal`); `p.qz-text`, the profile, and `p.qz-palette`, the colour profile (both Open Sans 400, `--fs-legal`, `--lh-ui`, `max-width: var(--measure-prose)`); `p.qz-also-h` "Also compatible with" (Open Sans 600, `--fs-label`); `ul.qz-also`, one `li.qz-mini[data-shade][data-family][data-name][data-fam][data-href]` (with `data-ring` where the shade needs the hairline) per shade of the group, the drawn one `hidden`, in a grid of equal columns at least 46 px wide (`grid-template-columns: repeat(auto-fit, minmax(46px, 1fr))`, `gap: var(--s1)`, 8 px): each item a 32 px circle (`span.qz-mini-sw`, `aria-hidden`, painted and ringed as the large swatch) over the name (`span.qz-mini-name`, `--fs-tile-caption`, 13 px, centred), `gap: var(--s1)` between them, a long name wrapping under its swatch ("Pale Violet" takes two lines); six columns need 316 px (6 x 46 + 5 x 8), so the 326 px text column at 390 holds a group's six on one row (47.7 px each) and The Spark's five likewise, while the 296 px column at 360 takes five and puts the sixth shade of a seven-shade group on a second row; the names are read and the swatches are not, and the items are not links; `p.qz-own` "Found the perfect shade? Make it yours!" (Poppins 700, `--fs-clause`, `--lh-h2`, `--ls-h2`); `.qz-actions` (`gap: var(--s2)`, centred): `a.btn.qz-see` "See it on the case" to the drawn shade's family page and `button.txtbtn.qz-retry` "Not quite? Try again" (Open Sans 600 16 px, 44 px tall, underlined on hover and on `:focus-visible`).
At 390 the panel measures 793 px (The Spark) to 946 px (The Quiet Curator) with each group's first shade (`dist-s3`, 2026-10-17): The Quiet Curator's and The Calm Strategist's (856 px) are taller than the 844 px screen and scroll with the page, and the other five fit. `retry()` tracks `quiz_retake`, hides the result and the gift, unhides all ten cards and clears their classes, empties the answers, shows card 1 coming forward from 0.96 (no dot filled), and scrolls the section's top into view (`root.scrollIntoView({ block: 'start' })`, smooth, or instant under reduced motion); the next `finish()` draws again (D2).

**The gift (the next block, under the result; `PUBLIC_LEADS` on).** `div.qz-gift#qzGift` (padding `0 var(--inset) calc(var(--inset) + env(safe-area-inset-bottom))`) holds one Pearl panel `.qz-gift-in` (`max-width: 480px; margin: 0 auto`, padding `var(--s4) var(--s3)`, rows at `gap: var(--s3)`): `h3.qz-gift-h` "And here’s a little something extra." (Poppins 700, `--fs-clause`, `--lh-h2`, `--ls-h2`); `p.qz-gift-sub` (Open Sans, `--fs-legal`): "Leave your email and we’ll send you a surprise gift inspired by your shade right away, plus first dibs on your shade when we launch."; `form#qzForm[novalidate]` with `.qz-fields` (`gap: var(--s2)`; the form, the fields and the done block are grids with `justify-items: start`, so the buttons sit at the left under the text they answer): `label.qz-label[for="qzEmail"]` "Email" (`--fs-label`, 600); `input.qz-input#qzEmail` (`type="email" inputmode="email" autocomplete="email" spellcheck="false" required aria-describedby="qzErrEmail"`; full width, 48 px, a 1 px Urban Slate hairline that becomes 2 px when `aria-invalid="true"` and on `:focus-visible`, Pearl fill, Open Sans 400 at `--fs-input`, 16 px so iOS never zooms); `p.qz-err#qzErrEmail` (one line always reserved under the field, so a message appearing or clearing never moves the controls below it; `--fs-label`, 400); `label.qz-check` with `input#qzConsent[type="checkbox"][required][aria-describedby="qzErrConsent"]` (20 px, `accent-color: var(--urban-slate)`) and "I’m happy to hear from Skreed by email." in a 44 px row at `--fs-label`; `p.qz-err#qzErrConsent`; `button.btn#qzSend[type="submit"]` "Send my gift"; `p.qz-msg#qzMsg[role="status"]` (hidden until it has text; `--fs-label`, 400); `p.qz-fine` "One email about your shade, one when we launch. Unsubscribe any time." (`--fs-small`, `--lh-small`). Beside the fields, `.qz-done#qzDone[hidden]`: `p.qz-done-text[tabindex="-1"]` (600) and `button.txtbtn.qz-notyou` "Not you? Use another email.". The states are in section 5.

**Scroll.** Intro and deck: section 3 is one screen (`min-height: 100svh`) wherever the deck fits, as it does at 390 x 844 and 360 x 780 (the deck, the tallest card's height, 661 and 679 px); on a landscape phone (844 x 390) the deck is 578 px tall, the stage grows past the screen with it and the page scrolls through the deck. Result: the stage shrinks to its content, the gift follows at one gap and the page scrolls through both. Below section 3 the working tree's section 4 (`section#room`) goes on, in every phase. The hero island keeps running under all of it: the stage observer watches `#track`, `#find` and `#room` and the loop runs while any of them intersects (section 5), so the fog keeps drifting and scrolling under the panels.

### 390 x 844, poster path (no WebGL2, software GL, no DecompressionStream, Save-Data, 2g, deviceMemory 2 or less, reduced motion by default, failed boot) and no JavaScript

The island never loads and the track collapses to 100svh, so the page is one screen of the poster, the family links block (in builds with `FAMILY_PAGES` on), then section 3 on the page's `--night` background (#050506) with its Pearl panels. No still image of the fog exists and none is planned: the fog is the island's alone. The intro, deck, result and gift are the same DOM and the same chunk, which does not depend on the island, so the quiz works end to end. Under `prefers-reduced-motion` the chunk reads `reducedMQ` live at every animation: a 150 ms intro fade, 150 ms fades instead of the fly-off, the next card's scale and Back's return, no rise, the answer marked for 0 ms, no result scale-in, an instant scroll on retry (section 4). On the `still3d` tier (the test override only) the island runs with `uTime` pinned at 7, so the fog stands still under the section. Without JavaScript the intro shows with the `<noscript>` line, "The quiz needs JavaScript. Browse the ten families instead.", "ten families" linking to `/#families` (a target only in builds with `FAMILY_PAGES` on); the button is present but inert.

### 1280 x 800

The laptop rules apply at 900 px wide and 600 px tall or more (`@media (min-width: 900px) and (min-height: 600px)`; a 1280 x 599 window keeps the phone layout). The stage centres its content (`align-content: center`). The intro panel is centred (the stage's `justify-items: center`), 640 px wide, padding `var(--s5)` (32 px); the h2 at 56 px holds three lines within 18ch. The deck is centred and 640 px wide (`.qz-cards`, as the intro and the results; D26), its card keeping the phone padding (`var(--s4) var(--s3)`); at 640 px every answer holds one line (the longest, 65 characters, sets 526 px wide at 17 px in a row with 574 px for its text; the `quiz.css` comment's "most answers" understates it), and the questions of cards 7, 9 and 10 take two; the deck, the tallest card's height, is 542 px at 1280 x 800 and at 1366 x 657, so it fits a 657 px tall laptop screen with the stage's padding. Nothing drags; the mouse clicks an answer and the keyboard works as above. The result panel is 640 px, centred, two columns (`grid-template-columns: 160px 1fr`, `align-items: center`): the swatch left, the text left-aligned, the compatible row across the text column (a group's six on one line), the two actions side by side (`grid-auto-flow: column`); padding 32 px (`var(--s5)`); the seven panels measure 607 to 726 px at 1280 x 800 (`dist-s3`, 2026-10-17). The gift panel is 640 px, centred. Hover (`hover: hover` only): the primary buttons and the answers lift 1 px (`translateY(-1px)`, `--dur-press`, `--ease-standard`; not while `aria-disabled`), the text buttons underline; press scales to 0.98; nothing else moves (rule 48). Focus: every control takes the two-tone ring: the Ember Luxe outline at a 2 px offset on `:focus-visible`, plus the Urban Slate inner ring drawn by `::before` at `inset: -2px` on the primary buttons, the answers and the text buttons; the email input, a replaced element with no `::before`, thickens its own hairline to 2 px as the inner ring; the checkbox row (`.qz-check:has(input:focus-visible)`) carries both rings round the box and its label while the box's own outline is removed; the focused top card takes the same two-tone ring (over the fog, Ember alone is under 3:1), as do the result heading and the done line when the script focuses them.

## 3. Content

**Every string, by its id in `QUIZ_COPY` (`src/config/quiz.ts`).** The strings are copied character for character: the apostrophes are U+2019 (’) and the ellipses are three full stops. Sentence case throughout (rule 4; Sam's capitals are his emphasis, not the setting). No em or en dash, no emoji, none of rule 17's words; `tests/unit/quiz.test.ts` checks every string of `QUIZ_COPY`, the questions, the answers, the personality names, the profiles and the colour profiles.

| Id | String | Where |
|---|---|---|
| `aria` | Find your shade | `section#find`'s `aria-label` |
| `h` | Spoilt for choice? Let’s find your signature shade. | `h2.qz-h` (Sam's first option) |
| `hAlt` | Overwhelmed by 240 shades? Let’s fix that. | in `QUIZ_COPY` for Sam, not rendered anywhere (it carries a digit, so it could never be an h2; section 10, 8) |
| `sub` | Grab a coffee, sit back and get comfortable. Answer a few questions and we’ll match you to your perfect Skreed shade. | `p.qz-sub` (Sam's words, split into two sentences) |
| `begin` | Swipe to begin | `button#qzBegin` |
| `loading` | Loading... | `button#qzBegin` after a press made before the observer has started the import (`data-loading`; any press before the chunk has mounted, replayed at mount; section 2) |
| `noscriptLead` | The quiz needs JavaScript. Browse the  | the start of the no-JS line (it ends in a space) |
| `noscriptLink` | ten families | the link in the no-JS line, to `/#families` |
| `noscriptTail` |  instead. | the end of the no-JS line (it starts with a space) |
| `cardAria(n)` | Question n of 10 | each card's `aria-label`; the live region reads "Question n of 10: " and the question |
| `back` | Back | `button.txtbtn.qz-back` in the footer of cards 2 to 10 (an empty `<span>` holds its cell on card 1) |
| `eyebrow` | Your shade | `p.qz-eyebrow`; the live region reads "Your shade: " then the drawn shade's name, a full stop, the personality's name and a full stop |
| `fam(family, index)` | Family, shade index of 24 | `p.qz-fam`, for example "Frosty White, shade 10 of 24" (tabular numerals); resolved at build for every shade of a group (`data-fam` on its `li.qz-mini`) and copied to `p.qz-fam` for the drawn one |
| `finish(f)` | Best in gloss. / Best in matte. | `p.qz-finish` |
| `also` | Also compatible with | `p.qz-also-h`, over the rest of the group |
| `own` | Found the perfect shade? Make it yours! | `p.qz-own` (Sam's exclamation mark kept; section 10, 7) |
| `see` | See it on the case | `a.btn.qz-see` on the result, to the drawn shade's family page |
| `retry` | Not quite? Try again | `button.qz-retry` |
| `gift` | And here’s a little something extra. | `h3.qz-gift-h` (Sam's second closing line; each of his two appears once) |
| `giftSub` | Leave your email and we’ll send you a surprise gift inspired by your shade right away, plus first dibs on your shade when we launch. | `p.qz-gift-sub` ("first dibs on your shade" in place of Sam's "an exclusive discount code": CLAUDE.md "Never discount language"; section 10, 2) |
| `email` | Email | the input's label |
| `consent` | I’m happy to hear from Skreed by email. | the checkbox label |
| `send` | Send my gift | `button#qzSend` |
| `sending` | Sending... | `button#qzSend` while the request runs |
| `trying` | Still trying... | `button#qzSend` from 8 s into a request |
| `fine` | One email about your shade, one when we launch. Unsubscribe any time. | `p.qz-fine` |
| `errEmail` | That doesn’t look like an email address. | `p#qzErrEmail` (validation, and a 422 from the endpoint) |
| `errConsent` | Tick the box so we can email you. | `p#qzErrConsent` |
| `errSend` | That didn’t go through. Try again. | `p#qzMsg` after a failed request while online |
| `dup` | You’re already on the list. Check your inbox. | `p.qz-done-text` on a 409 |
| `offline` | You’re offline. We’ll send it when you’re back. | `p.qz-done-text` while the lead is queued |
| `done(email)` | Done. Your gift is on its way to email. | `p.qz-done-text` on a 200, with the address typed |
| `notYou` | Not you? Use another email. | `button.qz-notyou` |

Other rendered strings come from the data: each question in `h3.qz-q` and each answer as its button's text (`QUIZ_QUESTIONS`); the drawn shade's name with a full stop in `h3.qz-shade` ("Sage."); the personality's name alone in `p.qz-persona` ("The Quiet Curator"), its profile in `p.qz-text` and its colour profile in `p.qz-palette` (`QUIZ_PERSONAS`); and the compatible shades' names in `span.qz-mini-name`, as the catalog prints them.

**Sam's content and how the code writes it.** The questions, the answers, the personality names, profiles, colour profiles and finishes and the shade groups are Sam's message of 2026-10-16 (quoted above). His answers the same day: build with these ten questions (his numbers 4, 5, 7, 8, 9, 10, 13, 14, 15 and 16); the five he marked VISUAL have no pictures yet ("idk yet, we have to get creative and think about it"), so they are words only, with `visual: true` in the config as the slot (D28); his confidence scores and rarity figures stay out (below); "The Quiz (takes 5 minutes to complete)" and "Every shade has a personality." are working notes, not copy, and the intro stays as it was. The config carries his questions, answers, profiles and colour profiles exactly as he wrote them, with no article added and no serial comma dropped ("A quiet morning, coffee, and a plan", "Big blockbuster, opening night", "a window overlooking the city", "for one day"), and with three changes only: his two dashes written as full stops (rule 16: "a gallery. Nothing stays", "walk in. Brighter, faster, more fun."); "11 p.m." with a no-break space (U+00A0) between "11" and "p.m.", so the time never breaks across two lines; and his "color" spelt "colour" (The Calm Strategist's colour profile, "a hint of colour", as the site spells it; section 10, 14). Apart from his copy, his shade names are written as the catalog prints them (CLAUDE.md "never invented shade names"; the personalities table below).

**The ten questions (`QUIZ_QUESTIONS`).** Each card shows Sam's question and his seven answers, one per personality, as text-only buttons in a fixed order of its own (`SHOWN` in `src/config/quiz.ts`, D23), so the position of an answer never gives its personality away: no card shows Sam's listing order, every personality comes first on at least one card and none on more than two. "Shown" is the position on the card, top to bottom. The five visual cards (1, 3, 5, 8 and 9; Sam's 4, 7, 9, 14 and 15) carry `data-visual` and show words only (D28).

| Card | Question | Shown | Answer | Personality |
|---|---|---|---|---|
| 1 (Sam's 4), **visual** | Pick your ideal Sunday. | 1 | A rooftop party that starts at noon | The Spark |
| | | 2 | Getting lost in a bookstore for hours | The Dreamer |
| | | 3 | Front row at a concert, lights blazing | The Main Character |
| | | 4 | A quiet morning, coffee, and a plan | The Calm Strategist |
| | | 5 | A beach bonfire with your whole friend group | The Warm Optimist |
| | | 6 | A rainy day, a good playlist, total silence | The Quiet Curator |
| | | 7 | A spontaneous road trip, no destination | The Romantic Rebel |
| 2 (Sam's 5) | What’s your comfort drink? | 1 | Filter coffee, no sugar | The Calm Strategist |
| | | 2 | Masala chai, extra ginger | The Warm Optimist |
| | | 3 | Oat milk latte, no sugar | The Quiet Curator |
| | | 4 | Strawberry milkshake | The Romantic Rebel |
| | | 5 | Espresso, straight up | The Main Character |
| | | 6 | Butterfly pea tea | The Dreamer |
| | | 7 | Fresh lemonade | The Spark |
| 3 (Sam's 7), **visual** | Pick your dream trip. | 1 | Paris | The Romantic Rebel |
| | | 2 | A vineyard in Tuscany | The Quiet Curator |
| | | 3 | A quiet lake in Switzerland | The Calm Strategist |
| | | 4 | Rio during Carnival | The Spark |
| | | 5 | Santorini at sunset | The Dreamer |
| | | 6 | Vegas, lights on all night | The Main Character |
| | | 7 | A hammock in Bali, no plans | The Warm Optimist |
| 4 (Sam's 8) | Your friends would call you the one who... | 1 | Has impeccable, effortless taste | The Quiet Curator |
| | | 2 | Has a plan for the backup plan | The Calm Strategist |
| | | 3 | Checks in on everyone, always | The Warm Optimist |
| | | 4 | Makes every plan actually happen | The Main Character |
| | | 5 | Feels everything, loudly and honestly | The Romantic Rebel |
| | | 6 | Is always up for anything, any time | The Spark |
| | | 7 | Is always three ideas ahead of everyone else | The Dreamer |
| 5 (Sam's 9), **visual** | Pick your ideal desk setup. | 1 | Fairy lights and half-finished sketches | The Dreamer |
| | | 2 | A bold statement piece, front and centre | The Main Character |
| | | 3 | Pink everything, no exceptions | The Romantic Rebel |
| | | 4 | Wood, linen, clean surface, one plant | The Quiet Curator |
| | | 5 | String lights and stickers, everywhere | The Spark |
| | | 6 | Colour-coded planner, zero clutter | The Calm Strategist |
| | | 7 | Photos of everyone you love | The Warm Optimist |
| 6 (Sam's 10) | Pick a movie night. | 1 | A feel-good favourite you’ve seen ten times | The Warm Optimist |
| | | 2 | A rom-com with your loudest friends | The Spark |
| | | 3 | Something surreal you’ll be thinking about for days | The Dreamer |
| | | 4 | Big blockbuster, opening night | The Main Character |
| | | 5 | A tightly plotted thriller | The Calm Strategist |
| | | 6 | Anything that makes you cry, honestly | The Romantic Rebel |
| | | 7 | An indie film nobody’s heard of yet | The Quiet Curator |
| 7 (Sam's 13) | You walk into a party. Where do you find yourself? | 1 | Under the spotlight, surrounded by people | The Main Character |
| | | 2 | Somewhere unexpected, laughing with new people | The Romantic Rebel |
| | | 3 | Dancing in the middle of the crowd | The Spark |
| | | 4 | On a balcony, watching everything unfold | The Dreamer |
| | | 5 | A quiet corner with a beautiful view | The Quiet Curator |
| | | 6 | Outside with a small group, drinks in hand | The Warm Optimist |
| | | 7 | At a table with a drink, taking it all in | The Calm Strategist |
| 8 (Sam's 14), **visual** | Pick the room you’d want to wake up in. | 1 | Minimal room, crisp sheets, coffee already waiting | The Calm Strategist |
| | | 2 | Linen sheets, warm wood, one perfect vase of flowers | The Quiet Curator |
| | | 3 | Sunlit room opening onto a garden | The Warm Optimist |
| | | 4 | Moody room, books, art, plants, and a window overlooking the city | The Dreamer |
| | | 5 | Colourful room, funky lamp, records playing | The Spark |
| | | 6 | Dramatic four-poster bed, velvet curtains, sunlight pouring in | The Main Character |
| | | 7 | Pink sheets, scattered love notes, flowers everywhere | The Romantic Rebel |
| 9 (Sam's 15), **visual** | Pick the outfit you’d wear without overthinking it. | 1 | Bright top, fun accessories, unexpected shoes | The Spark |
| | | 2 | Pink mini dress, playful bag, lots of jewellery | The Romantic Rebel |
| | | 3 | A sharp red dress with statement shoes | The Main Character |
| | | 4 | Breezy dress, sandals, woven bag | The Warm Optimist |
| | | 5 | Crisp shirt, tailored trousers, minimalist watch | The Calm Strategist |
| | | 6 | A perfectly tailored neutral set | The Quiet Curator |
| | | 7 | Dark layered outfit with an unusual vintage piece | The Dreamer |
| 10 (Sam's 16) | If you could read everyone’s mind for one day, what would you look for? | 1 | The weirdest, most unexpected thought in the room | The Dreamer |
| | | 2 | What would make everyone around me happier | The Warm Optimist |
| | | 3 | What people are planning before they do it | The Calm Strategist |
| | | 4 | Whether people are being genuine | The Quiet Curator |
| | | 5 | What everyone really thinks of me | The Main Character |
| | | 6 | The funniest thing someone has ever thought | The Spark |
| | | 7 | What someone secretly feels about me | The Romantic Rebel |

**The seven personalities (`QUIZ_PERSONAS`, in the order Sam lists them under each question).** Each has Sam's name, profile, colour profile and finish (his "Glossy" and "Matte" as `gloss` and `matte`, shown as "Best in gloss." and "Best in matte."), and a group of shades by catalog id: the first is the one he recommends, the rest are his "Also Compatible With" in his order. The result draws one shade of the group at random and shows the others as compatible (section 5), so the recommended shade is no likelier than the rest. `tests/unit/quiz.test.ts` checks every id against `shades.gen.ts` and the first of each group against his recommendation by the catalog's name.

| Personality | Finish | Sam's recommended shade | Also compatible, in Sam's order | Sam's names, as the catalog prints them |
|---|---|---|---|---|
| The Main Character (`main`) | gloss | Ruby `roaring-red-11` | Burgundy `roaring-red-21`, Claret `roaring-red-15`, Wine `roaring-red-23`, Midnight `blissful-blue-24`, Crimson `roaring-red-07`, Paprika `roaring-red-02` | "Midnight Blue" is Midnight, the Blissful Blue one (`vivid-violet-20` is the other Midnight); "Wine" is the Roaring Red Wine, not `vivid-violet-23` (D27; section 10, 13) |
| The Quiet Curator (`curator`) | matte | Porcelain `frosty-white-10` | Stone `blissful-blue-20`, Almond `basic-brown-01`, Sage `go-green-09`, Pale Grey `stormy-grey-01`, Powder `blissful-blue-03`, Linen `frosty-white-20` | "Stone Blue" is Stone, the Blissful Blue one (`stormy-grey-20` is the other Stone); "Sage Green" is Sage; "Powder Blue" is Powder |
| The Spark (`spark`) | gloss | Sunflower `mellow-yellow-11` | Bubblegum `playful-pink-09`, Tangerine `blushing-coral-12`, Fuchsia `playful-pink-24`, Amethyst `vivid-violet-07`, Mimosa `mellow-yellow-15` (five: Sam lists five, so the group is six) | "Bubblegum Pink" is Bubblegum |
| The Warm Optimist (`optimist`) | gloss | Autumn `blushing-coral-19` | Bumblebee `mellow-yellow-20`, Clementine `blushing-coral-09`, Honey `blushing-coral-14`, Rosy `basic-brown-05`, Daffodil `mellow-yellow-10`, Marmalade `blushing-coral-17` | "Rosy Brown" is Rosy |
| The Romantic Rebel (`rebel`) | gloss | Ballerina `playful-pink-06` | Rose `roaring-red-10`, Mauve `vivid-violet-03`, Blush `playful-pink-03`, Strawberry `roaring-red-03`, Lilac `vivid-violet-05`, Raspberry `roaring-red-08` | "Ballerina Pink" is Ballerina |
| The Dreamer (`dreamer`) | gloss | Wildberry `vivid-violet-13` | Sapphire `blissful-blue-15`, Chestnut `basic-brown-20`, Teal `blissful-blue-18`, Fig `vivid-violet-16`, Emerald `go-green-20`, Pine `go-green-21` | "Teal Blue" is Teal, the Blissful Blue one (`go-green-19` is the other Teal); "Pine Green" is Pine; Chestnut is also The Calm Strategist's |
| The Calm Strategist (`strategist`) | matte | Navy `blissful-blue-22` | Prussian `blissful-blue-21`, Jade `go-green-08`, Thyme `go-green-16`, Pale Violet `vivid-violet-02`, Sand `basic-brown-02`, Chestnut `basic-brown-20` | "Navy Blue" is Navy; "Jade Green" is Jade; Chestnut is also The Dreamer's |

The other names are the catalog's as Sam wrote them. Chestnut (`basic-brown-20`) sits in two groups, as Sam lists it, so the seven groups hold 47 distinct shades in 48 places (section 10, 13).

**Every shade of the groups, from the catalog (`shades.gen.ts`).** Contrast is against Pearl Whisper (#F7F6F3, WCAG relative luminance); the hairline is `needsRing`; the link is `shadeHref(family, n)`: `/shades/<family>/?shade=<n>` with the catalog number zero-padded to three digits (the family-page contract, `family-page.md` 2.2).

| Personality | Shade | Id | Hex | n of 240 | Family, index of 24 | On Pearl | Hairline | Link |
|---|---|---|---|---|---|---|---|---|
| The Main Character | Ruby (recommended) | `roaring-red-11` | #b31f2d | 227 | Roaring Red, 11 | 6.17:1 | no | `/shades/roaring-red/?shade=227` |
|  | Burgundy | `roaring-red-21` | #82001e | 237 | Roaring Red, 21 | 9.87:1 | no | `/shades/roaring-red/?shade=237` |
|  | Claret | `roaring-red-15` | #9b021c | 231 | Roaring Red, 15 | 8.03:1 | no | `/shades/roaring-red/?shade=231` |
|  | Wine | `roaring-red-23` | #4b0923 | 239 | Roaring Red, 23 | 14.26:1 | no | `/shades/roaring-red/?shade=239` |
|  | Midnight | `blissful-blue-24` | #0e1442 | 48 | Blissful Blue, 24 | 16.23:1 | no | `/shades/blissful-blue/?shade=048` |
|  | Crimson | `roaring-red-07` | #d20000 | 223 | Roaring Red, 7 | 5.20:1 | no | `/shades/roaring-red/?shade=223` |
|  | Paprika | `roaring-red-02` | #f3342e | 218 | Roaring Red, 2 | 3.64:1 | no | `/shades/roaring-red/?shade=218` |
| The Quiet Curator | Porcelain (recommended) | `frosty-white-10` | #eff1f0 | 10 | Frosty White, 10 | 1.05:1 | yes | `/shades/frosty-white/?shade=010` |
|  | Stone | `blissful-blue-20` | #608592 | 44 | Blissful Blue, 20 | 3.69:1 | no | `/shades/blissful-blue/?shade=044` |
|  | Almond | `basic-brown-01` | #e8d2bd | 121 | Basic Brown, 1 | 1.35:1 | yes | `/shades/basic-brown/?shade=121` |
|  | Sage | `go-green-09` | #96a880 | 201 | Go Green, 9 | 2.37:1 | no | `/shades/go-green/?shade=201` |
|  | Pale Grey | `stormy-grey-01` | #bbbab8 | 169 | Stormy Grey, 1 | 1.79:1 | no | `/shades/stormy-grey/?shade=169` |
|  | Powder | `blissful-blue-03` | #9adeee | 27 | Blissful Blue, 3 | 1.38:1 | yes | `/shades/blissful-blue/?shade=027` |
|  | Linen | `frosty-white-20` | #efe6d5 | 20 | Frosty White, 20 | 1.15:1 | yes | `/shades/frosty-white/?shade=020` |
| The Spark | Sunflower (recommended) | `mellow-yellow-11` | #f4d41d | 107 | Mellow Yellow, 11 | 1.36:1 | yes | `/shades/mellow-yellow/?shade=107` |
|  | Bubblegum | `playful-pink-09` | #f086c6 | 57 | Playful Pink, 9 | 2.18:1 | no | `/shades/playful-pink/?shade=057` |
|  | Tangerine | `blushing-coral-12` | #ea821a | 156 | Blushing Coral, 12 | 2.52:1 | no | `/shades/blushing-coral/?shade=156` |
|  | Fuchsia | `playful-pink-24` | #e0028d | 72 | Playful Pink, 24 | 4.26:1 | no | `/shades/playful-pink/?shade=072` |
|  | Amethyst | `vivid-violet-07` | #8554d1 | 79 | Vivid Violet, 7 | 4.64:1 | no | `/shades/vivid-violet/?shade=079` |
|  | Mimosa | `mellow-yellow-15` | #f2d031 | 111 | Mellow Yellow, 15 | 1.40:1 | yes | `/shades/mellow-yellow/?shade=111` |
| The Warm Optimist | Autumn (recommended) | `blushing-coral-19` | #e56228 | 163 | Blushing Coral, 19 | 3.18:1 | no | `/shades/blushing-coral/?shade=163` |
|  | Bumblebee | `mellow-yellow-20` | #ffc239 | 116 | Mellow Yellow, 20 | 1.49:1 | yes | `/shades/mellow-yellow/?shade=116` |
|  | Clementine | `blushing-coral-09` | #f78628 | 153 | Blushing Coral, 9 | 2.31:1 | no | `/shades/blushing-coral/?shade=153` |
|  | Honey | `blushing-coral-14` | #e5811f | 158 | Blushing Coral, 14 | 2.59:1 | no | `/shades/blushing-coral/?shade=158` |
|  | Rosy | `basic-brown-05` | #c29995 | 125 | Basic Brown, 5 | 2.35:1 | no | `/shades/basic-brown/?shade=125` |
|  | Daffodil | `mellow-yellow-10` | #f5d914 | 106 | Mellow Yellow, 10 | 1.31:1 | yes | `/shades/mellow-yellow/?shade=106` |
|  | Marmalade | `blushing-coral-17` | #e85728 | 161 | Blushing Coral, 17 | 3.34:1 | no | `/shades/blushing-coral/?shade=161` |
| The Romantic Rebel | Ballerina (recommended) | `playful-pink-06` | #efa3af | 54 | Playful Pink, 6 | 1.85:1 | no | `/shades/playful-pink/?shade=054` |
|  | Rose | `roaring-red-10` | #c70451 | 226 | Roaring Red, 10 | 5.45:1 | no | `/shades/roaring-red/?shade=226` |
|  | Mauve | `vivid-violet-03` | #dfa4f8 | 75 | Vivid Violet, 3 | 1.80:1 | no | `/shades/vivid-violet/?shade=075` |
|  | Blush | `playful-pink-03` | #f4b6bb | 51 | Playful Pink, 3 | 1.59:1 | no | `/shades/playful-pink/?shade=051` |
|  | Strawberry | `roaring-red-03` | #f4315c | 219 | Roaring Red, 3 | 3.57:1 | no | `/shades/roaring-red/?shade=219` |
|  | Lilac | `vivid-violet-05` | #c988c8 | 77 | Vivid Violet, 5 | 2.48:1 | no | `/shades/vivid-violet/?shade=077` |
|  | Raspberry | `roaring-red-08` | #cd2550 | 224 | Roaring Red, 8 | 4.89:1 | no | `/shades/roaring-red/?shade=224` |
| The Dreamer | Wildberry (recommended) | `vivid-violet-13` | #a04d95 | 85 | Vivid Violet, 13 | 4.87:1 | no | `/shades/vivid-violet/?shade=085` |
|  | Sapphire | `blissful-blue-15` | #002c84 | 39 | Blissful Blue, 15 | 11.47:1 | no | `/shades/blissful-blue/?shade=039` |
|  | Chestnut | `basic-brown-20` | #5d2b24 | 140 | Basic Brown, 20 | 10.58:1 | no | `/shades/basic-brown/?shade=140` |
|  | Teal | `blissful-blue-18` | #00818e | 42 | Blissful Blue, 18 | 4.29:1 | no | `/shades/blissful-blue/?shade=042` |
|  | Fig | `vivid-violet-16` | #671e67 | 88 | Vivid Violet, 16 | 9.92:1 | no | `/shades/vivid-violet/?shade=088` |
|  | Emerald | `go-green-20` | #006d48 | 212 | Go Green, 20 | 5.92:1 | no | `/shades/go-green/?shade=212` |
|  | Pine | `go-green-21` | #004c16 | 213 | Go Green, 21 | 9.50:1 | no | `/shades/go-green/?shade=213` |
| The Calm Strategist | Navy (recommended) | `blissful-blue-22` | #0e305b | 46 | Blissful Blue, 22 | 12.20:1 | no | `/shades/blissful-blue/?shade=046` |
|  | Prussian | `blissful-blue-21` | #2f3f5c | 45 | Blissful Blue, 21 | 9.78:1 | no | `/shades/blissful-blue/?shade=045` |
|  | Jade | `go-green-08` | #8ab269 | 200 | Go Green, 8 | 2.25:1 | no | `/shades/go-green/?shade=200` |
|  | Thyme | `go-green-16` | #717d67 | 208 | Go Green, 16 | 4.02:1 | no | `/shades/go-green/?shade=208` |
|  | Pale Violet | `vivid-violet-02` | #ecd0f9 | 74 | Vivid Violet, 2 | 1.30:1 | yes | `/shades/vivid-violet/?shade=074` |
|  | Sand | `basic-brown-02` | #e1c39f | 122 | Basic Brown, 2 | 1.55:1 | no | `/shades/basic-brown/?shade=122` |
|  | Chestnut | `basic-brown-20` | #5d2b24 | 140 | Basic Brown, 20 | 10.58:1 | no | `/shades/basic-brown/?shade=140` |

**The seven profiles and colour profiles, verbatim (`profile` and `palette` in `QUIZ_PERSONAS`; `p.qz-text` and `p.qz-palette`).**

1. The Main Character (`main`)
   - Profile: You don’t chase attention, you command it. Bold decisions, strong opinions, zero interest in blending in. Every story you tell somehow becomes the best one in the room.
   - Colour profile: Rich, saturated, and attention-grabbing tones.
2. The Quiet Curator (`curator`)
   - Profile: You curate your life the way you’d curate a gallery. Nothing stays unless it earns its place. You’re thoughtful, observant, and quietly confident. You have a calming presence and an eye for the understated. You choose with intention, gravitating towards things that feel balanced, timeless, and effortlessly distinctive rather than simply trendy.
   - Colour profile: Soft, warm neutrals with quiet depth. Your palette doesn’t shout.
3. The Spark (`spark`)
   - Profile: You’re the reason the group chat is active at 11 p.m. Rooms feel different when you walk in. Brighter, faster, more fun.
   - Colour profile: High-energy brights with just enough warmth to keep them from feeling harsh.
4. The Warm Optimist (`optimist`)
   - Profile: You’re the friend people call with good news first. Warm without trying, welcoming without performing it, you make people feel like they’ve known you longer than they have.
   - Colour profile: Warm tones with a soft edge.
5. The Romantic Rebel (`rebel`)
   - Profile: Soft on the outside, stubborn underneath. You lead with feeling, not logic, and you’ve never once regretted it. Sentimental about the little things, allergic to anything that feels forced.
   - Colour profile: Playful, expressive brights with a soft edge.
6. The Dreamer (`dreamer`)
   - Profile: Half in this world, half somewhere more interesting. You notice things other people miss, and you’re always a little bit mid-thought. Deeply creative, gently mysterious.
   - Colour profile: Deep, moody tones with a touch of whimsy.
7. The Calm Strategist (`strategist`)
   - Profile: You’re the one everyone looks at when things go sideways, because you don’t. Composed under pressure, three steps ahead, quietly running the show without needing credit for it.
   - Colour profile: Nuanced neutrals with depth and a hint of colour.

**Swatch contrast on Pearl Whisper and the hairline.** A swatch whose shade measures under 1.5:1 against Pearl Whisper carries a 1 px Urban Slate hairline (the family page's `--swr` precedent in `src/styles/family.css`). `needsRing(hex)` in `src/config/quiz.ts` decides it at build; `Quiz.astro` writes `data-ring` on the shade's `li.qz-mini`, its small swatch and, for the group's first shade, the large swatch; `finish()` copies the drawn shade's flag to the large swatch; `quiz.css` has one rule for both sizes (`.qz-big[data-ring], .qz-mini-sw[data-ring]`), and the per-shade CSS rules are gone. Computed from the catalog hexes, nine of the 47 shades take it: Porcelain 1.05:1, Linen 1.15, Pale Violet 1.30, Daffodil 1.31, Almond 1.35, Sunflower 1.36, Powder 1.38, Mimosa 1.40 and Bumblebee 1.49. The palest without it are Sand at 1.55 and Blush at 1.59. `tests/unit/quiz.test.ts` asserts the full list of nine (exactly these shades of the 47 are ringed) and that `quiz.css` carries the rule.

**Confidence and rarity.** Sam's message gives each personality a "Confidence Score" (89 to 97 percent) and a "Rarity" ("Top 5%" to "Top 14%"). They are left out by his choice the same day: no answers exist yet to count, and a figure with nothing behind it is a fake count (CLAUDE.md "Real content only ... never fake counts"). `tests/unit/quiz.test.ts` fails a profile or colour profile that carries "%" or "Top" and a number.

**Renders and images.** None. The real product is the shades, as swatches (A5); the family page link shows the case in the drawn shade. The five visual questions carry no pictures yet (section 8; section 10, 1). No still image on any tier.

## 4. Motion plan

**Libraries.** None new, no GSAP. The hand-off is the hero island's second wipe (the v11 composite) with its far side changed to the fog ground. The DOM motion is the Web Animations API on transform and opacity and CSS transitions on transform, driven by clicks and keys: there are no Pointer Events handlers and nothing follows a pointer. Reduced motion comes from `src/scripts/motion.ts` (`reducedMQ`, read live before every animation) and from the `prefers-reduced-motion` block in `quiz.css`. The constants in `deck.ts` twin DESIGN.md's tokens: `DUR_OUT` 200 ms (`--dur-out`), `DUR_CARD` 300 ms (`--dur-card`), `DUR_REDUCED` 150 ms, `DUR_MARK` 120 ms (the hold on the marked answer, a delay, not an animation), `EASE_STANDARD` `cubic-bezier(0.2, 0, 0, 1)` (`--ease-standard`), `EASE_IN` `cubic-bezier(.55, .085, .68, .53)` (`--ease-in`); `EASE_REBOUND` went with the spring-back. The rise and the result's entrance are 400 ms literals; the hover and press transitions use `--dur-press` (150 ms); the text buttons' underline colours in at once, with no transition.

| Trigger | What moves | Timing and easing |
|---|---|---|
| Scroll 15.2 to 16.2 screens (`S2T.W2`, `WIPE`) | the second wipe: section 2's frame (`tA`, held still, `uParA` 0) is cut away by the ice-shard mask to the fog ground (`tB`, sliding 0.4 x cubicIn(1 - tp2) screens, with the composite's aberration) | scroll-driven through the two followers (0.075, 0.15) |
| Scroll 16.2 to 17.2 | section 3's stage rises from the bottom edge over the fog with native scroll; the fog drifts (`uTime`) and scrolls (`uScroll`) | native scroll; the island renders the ground and the composite |
| While `#find` intersects the viewport | the fog keeps drifting under the panels (two full-screen passes per frame) | the island's loop; pending E-S3-bg (section 10, 3) |
| Press "Swipe to begin" (click, tap, Enter, Space, once the chunk has mounted; a press made before the chunk has mounted shows "Loading..." and is replayed at mount, section 2) | the intro fades out, the deck rises 24 px into place, card 1 appears | opacity 1 to 0 in 200 ms `EASE_STANDARD`; translateY 24 px and opacity 0 to 1 in 400 ms `EASE_STANDARD`; card 1 without an enter animation |
| A tap, click, Enter or Space on an answer of the top card | the answer fills Urban Slate with Pearl Whisper text (`aria-pressed="true"`) and holds; then the card flies off to the left whichever answer it was (translated left by 1.3 times its width and rotated -14 degrees, opaque) and is hidden; the next card comes forward from scale 0.96; its stepper shows one more filled dot | the mark held 120 ms (`DUR_MARK`); 300 ms `EASE_IN`, fill forwards then cancelled; 300 ms `EASE_STANDARD` |
| "Back" on cards 2 to 10 | the previous card comes back in from the left (from translated left by 1.3 times its width and rotated -14 degrees, to rest) over the card that was on top, which goes back behind it at 0.96; its stepper shows one fewer filled dot | 300 ms `EASE_STANDARD`; no answer is taken until it ends |
| ArrowDown and ArrowUp on the top card | focus moves among the seven answers; nothing moves on the card | none |
| The tenth commit | the deck is hidden; the result panel enters with the drawn shade; the gift block appears below; the stage shrinks to its content | scale 0.96 and opacity 0 to rest in 400 ms `EASE_STANDARD` |
| "Not quite? Try again" | the result and the gift are hidden; card 1 comes forward from 0.96; the page scrolls to the section's top | 300 ms `EASE_STANDARD`; `scrollIntoView` smooth |
| Hover and press on the primary buttons and the answers (`hover: hover`) | lift 1 px; press 0.98 | `--dur-press` `--ease-standard` |
| Hover and `:focus-visible` on the text buttons | the underline colours in | at once, no transition |

**Reduced motion, exactly as `deck.ts` and `quiz.css` do it.** `reduced()` is `reducedMQ.matches`, read at each call. The intro fades out in 150 ms (`DUR_REDUCED`, `EASE_STANDARD`) and the deck does not rise. A commit holds the mark for 0 ms, so the fill shows while the card fades out (opacity 1 to 0, 150 ms, `fill: 'forwards'`, the default easing) instead of flying off; the next card fades in (opacity 0 to 1, 150 ms, `EASE_STANDARD`) instead of scaling. Back fades the previous card in (150 ms, with no answer taken until it ends) instead of bringing it from the left. The result panel appears with no animation; `retry()` scrolls with `behavior: 'instant'`. The CSS sets `transition: none` on the primary buttons and the answers and `transform: none` on the answer's hover and press and the primary button's hover and press, so no control moves at all; the fill alone marks the answer taken. On the poster tier (reduced motion's default) there is no island, so no fog; on `still3d` the fog is frozen at `uTime` 7 and the composite's `uCalm` 1 removes the wipe's parallax and aberration.

**WCAG 2.2.2.** Nothing in the section's DOM moves on its own. The fog under the section is the island's and drifts for as long as the section is in view, which is longer than 5 s with no pause control; that is part of the pending exception E-S3-bg (section 10, 3), as the hero's own drift is part of the pending E-2.2.2.

## 5. Data and states

**Inputs.** Clicks on the answers (a tap, a click, or Enter or Space on a focused answer, natively), on the Back buttons, the begin button, and the retry and "Not you?" text buttons; `keydown` (ArrowDown, ArrowUp) on the cards; the form's `blur`, `change` and `submit`; `navigator.onLine` and the `online` event; `sessionStorage` (an enhancement, wrapped in try/catch); `reducedMQ`; `Math.random` for the shade draw; an IntersectionObserver on `#find` for the chunk. No Pointer Events: nothing on the cards responds to a drag.

**Outputs.**
- The result: a personality id and a shade id (with its family id), kept in memory and on the form's dataset only (`shade`, `family`, `finish`, `persona`; no storage of answers or results, B3). "See it on the case" goes to the drawn shade's family page, `/shades/<family>/?shade=<n>` with the catalog number zero-padded to three digits (`shadeHref`, resolved at build into each `li.qz-mini`'s `data-href`; every link is in section 3's shade table, from `?shade=010` for Porcelain to `?shade=239` for Wine).
- `POST /api/quiz-lead` (`QUIZ_LEAD_ENDPOINT`) with `content-type: application/json` and the body `{ email, shadeId, familyId, finish, persona, answers, source }`: `email` the trimmed address, `shadeId` the drawn shade such as `"frosty-white-10"`, `familyId` its family such as `"frosty-white"`, `finish` the personality's, `"gloss"` or `"matte"`, `persona` such as `"curator"`, `answers` the ten personality ids in card order joined by commas, such as `"main,curator,main,curator,main,curator,spark,optimist,rebel,dreamer"`, `source` `"quiz"`. Responses the chunk handles: 200 (any 2xx) success; 409 duplicate; 422 invalid email; any other status, a network failure or the 20 s abort is an error. The Worker, its Supabase table and Turnstile do not exist yet (section 8), so on a build with `PUBLIC_LEADS` on every real submit reaches the error state; the dev server has no endpoint either.
- Analytics events through `track(name, props)` in `src/scripts/quiz/track.ts`, which pushes `{ name, props, t: Date.now() }` onto `window.__skreedEvents` and sends nothing anywhere (PostHog arrives with G18 and drains the queue): `quiz_start`; `quiz_answer { q: 1..10, persona }`; `quiz_back { q: 2..10 }` (the card Back was pressed on); `quiz_complete { persona, shade, others }` (`others` the rest of the group's ids in group order, joined by commas); `quiz_retake`; `lead_submit`; `lead_success`; `lead_error { kind: 'duplicate' | 'invalid' | 'timeout' | 'network' }`. Section 4's walk imports the same `track()`.

**Scoring (`scoreQuiz` in `src/config/quiz.ts`, pure, unit tested).** The ten answers are ten personality ids, card 1 first. The personality picked most often wins (Sam: "maximum answers corresponding to"). On a tie at the top, the tied personality the visitor picked most recently wins: the loop walks the answers from card 10 back to card 1 and returns the first whose personality has the top count (D24). Any ten answers give exactly one personality, so "no results" cannot happen; any other number of answers throws. Every personality is reachable (ten of its own answers give it). If every answer were equally likely, 93,710,442 of the 282,475,249 possible answer sets (7 to the power 10), 33.2 percent, would tie at the top, so the tie rule decides often. The worked cases of `tests/unit/quiz.test.ts`: four answers for The Spark against three for The Main Character, two for The Quiet Curator and one for The Dreamer give The Spark; main, curator, main, curator, main, curator, spark, optimist, rebel, dreamer ties The Main Character and The Quiet Curator at three, and The Quiet Curator was picked last of the two (card 6): The Quiet Curator; main, curator, spark, optimist, rebel, dreamer, strategist, main, curator, spark ties The Main Character, The Quiet Curator and The Spark at two, and The Spark was picked last (card 10): The Spark.

**The shade draw (`pickShade` in `src/config/quiz.ts`).** `finish()` calls `pickShade(p)` once per completed quiz: the index is the random number times the group's size, rounded down and capped at the last shade (`Math.min(p.shades.length - 1, Math.floor(rand() * p.shades.length))`, `rand` defaulting to `Math.random`), so each shade of a seven-shade group comes up one time in seven and each of The Spark's six one time in six; the recommended (first) shade is not favoured. The drawn shade takes the large swatch, the heading, the family line and the link; the others, in group order, are the compatible row. "Not quite? Try again" and the next `finish()` draw again, so the same answers can give another shade of the same group (D2). The draw is neither stored nor seeded: a reload and the same answers draw afresh. `rand` is injectable for the unit test, which proves every shade of every group reachable and the others always the rest of the group in order.

**The hero island (3D path), as built.**
- `src/scripts/hero/section3/ground.ts` (new) replaces `src/scripts/hero/world/wall.ts` (deleted): `createFogGround(renderer, reduced)` builds a second `createBackground()` from `section2/background.ts`, rewrites its last fragment line to write sRGB with alpha 1, sets `uPre` 0 and `uLabN` 0, and renders into its own `WebGLRenderTarget` at device pixels; `update(S, t)` sets `uScroll = 2.15 + 0.3 * (S - S2T.W1END)` and `uTime = reduced ? 7 : t`; `resize(w, h)` recreates the target.
- `src/scripts/hero/loop.ts` (changed again by section 4's working tree, so described here by behaviour): the ground takes the hero's scroll and clock every frame. It is rendered from the moment the second wipe begins, and during the first wipe while section 2 is still being built (that wipe's fallback far side); section 4's code skips it once section 4's own frame covers the screen and needs no fog. During the second wipe the composite cuts from section 2's frame (the near side, held still: its parallax is 0) to the ground (the far side), at the second wipe's progress; before it the far side is section 2's frame while section 2 is ready, else the ground. After the cut the frame is the ground pass and the composite pass; section 2's own update (poses, frost, labels, link boxes) runs on for half a second after the cut completes (its labels fade out and the hover is dropped), then rests until the scroll goes back above the cut.
- `src/scripts/hero/hero.ts`: `createFogGround` at start-up step 13, disposed with `life`; the stage IntersectionObserver watches `#track` and `#find`, and in the working tree section 4's `#room` too, with a map of the last entry per target; `inView` is true while any target intersects; when `inView` becomes false the loop stops and `canvas#stage` is hidden, and it restarts when any returns. In the working tree the three run to the end of the page, so the loop does not stop while the visitor is on the quiz or below it.
- `src/scripts/hero/stage/resize.ts`: `fogGround.resize(renderer.domElement.width, renderer.domElement.height)`. `src/scripts/hero/types.ts`: `fogGround: GroundScene` in `HeroContext`. `src/scripts/hero/warmup.ts`: after the hero composer (c9) the ground is resized to 8 x 8 and rendered once, so its program links during the warm-up, and the two composite draws take `C.tB = fogGround.out`; the 27 milestones are unchanged.
- The cost under section 3: one full-screen fragment pass (two noise taps, the dots, six sprite tests, the grain) plus a one-fetch composite, per frame, at the capped pixel ratio (1.25 touch, 1.5 fine), for as long as the section is on screen. This is Sam's brief ("the same backround [sic] as the 2nd section") and it contradicts CLAUDE.md's Always-do line "No WebGL from section 3 (the Wall) on" and CHECKLIST C3: recorded as the pending exception E-S3-bg (section 10, 3), not approved. The rule-compliant fallback if Sam says no: the observer on `#track` only (the loop stops at the track as before), section 3 on the page's `--night` ground with its Pearl panels, no `ground.ts`, the second wipe's far side a still frame or the night.

**The gift block's flag.** `Quiz.astro` computes `LEADS = PUBLIC_LEADS === 'on' || (PUBLIC_LEADS !== 'off' && (DEV || PUBLIC_STAGING === '1' || PUBLIC_HERO_HOOKS === '1'))` at build time (`PUBLIC_LEADS` is typed in `src/env.d.ts`): on in dev, test (`npm run build:test`) and staging builds, off in production (`npm run build`) until `PUBLIC_LEADS=on`. Without it the gift markup is absent, `deck.ts` returns before the form code, and the page ends after the result.

**States (CHECKLIST D3 and the H table, column 3).**

| State | Section 3, as built |
|---|---|
| Empty | A card with nothing picked waits for a tap: the question is the prompt and there is no next button to disable, so the H table's "Pick one to continue" has no element to attach to; a card leaves only when an answer is taken, and the form cannot be submitted without a result (the gift block is hidden until `finish()`). |
| Loading | The intro is static HTML, visible at first paint; no skeleton, because nothing waits for data. The chunk loads when the section is within one screen; a press of "Swipe to begin" before the chunk has mounted shows "Loading..." on the button (`aria-disabled="true"`, `aria-busy="true"`, never the `disabled` attribute, focus kept) and the quiz begins by itself at mount, with no second press (section 2, D18); an import that fails gives the button back and retries on `online`. The gift form: "Sending..." with `aria-disabled="true"` while the request runs; the fields keep their values; focus stays on the button. |
| Error | A request that fails while online (any status outside 2xx, 409 and 422; a network error; the 20 s abort): "That didn’t go through. Try again." in `p#qzMsg[role="status"]` under the button, the fields and their values shown, the button reading "Send my gift" again with `aria-disabled="false"`; `lead_error` with kind `timeout` (an `AbortError`) or `network`. 422: the fields shown and "That doesn’t look like an email address." under the email field with `aria-invalid="true"`; kind `invalid`. |
| No internet | The quiz itself works offline (static logic in the chunk). Offline is detected as a failed fetch with `navigator.onLine` false (a pre-check lies on captive portals): the lead is queued in memory and, where it works, in `sessionStorage` under `skreed-quiz-lead`; the done block replaces the fields and reads "You’re offline. We’ll send it when you’re back." with "Not you? Use another email." under it; the queued lead is re-sent on the `online` event, and on the next page load the chunk re-sends a saved lead at mount if online (else re-queues it). A re-send that succeeds shows the success state; one that fails while online shows the error state with the fields back; "Not you?" clears the queue. The storage key is cleared on a 200 and by "Not you?"; a 409 on a re-sent lead leaves it in storage. |
| Slow network | As loading; the request never times out silently: at 8 s the button reads "Still trying...", at 20 s the request is aborted and the error state shows. |
| No results | Cannot happen: any ten answers give one personality (the most picked, a tie to the most recent pick), and every group has six or seven shades to draw from (`tests/unit/quiz.test.ts`). The H table's row for section 3 reads "Quiz always resolves (deterministic mapping to a family + shade)"; Sam's note ("Make the recommended shade randomised within each result group") replaces its "deterministic" for the shade: the personality is deterministic, and the shade, and with it the family, is drawn from the group (D2). |
| Permission denied | n/a: nothing asks for a permission (no photo, no camera, no clipboard). |
| Session expired | n/a: no session; a reload starts the quiz again (a queued lead survives a reload through `sessionStorage` only). |
| Form validation | On blur the email is checked only once it has a value (never per keystroke, H4); the checkbox clears its error on `change` when ticked; both are checked on submit. The form is `novalidate`, so the browser's bubble never replaces the messages. Messages under the field in plain words, `aria-invalid` set, the field keeps its value, the hairline doubles to 2 px; the first invalid field is focused. The address must match `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` after trimming. |
| Success | The result panel with the drawn shade (its swatch, name, family line, finish and link), the personality's name, profile and colour profile, the rest of the group under "Also compatible with", "See it on the case" and "Not quite? Try again". The gift: "Done. Your gift is on its way to <email>." replaces the fields (not a 2 s state: it is the end of the form), with the address shown so a typo is visible, focus on the line, and "Not you? Use another email." reopening an empty form with focus in the email field; `lead_success`. |
| Duplicate | 409: the done block shows "You’re already on the list. Check your inbox." with "Not you? Use another email."; `lead_error { kind: 'duplicate' }`. |

## 6. Budget

Read from `dist-s3` on 2026-10-16 (a test build of the current source; `node scripts/hero/budget.mjs dist-s3`); the numbers are re-measured by `node scripts/hero/budget.mjs dist` after `npm run build:test` before the review. The script walks static imports only into "critical js", notes the dynamic ones, and prints the deck chunk (or any dynamic chunk that imports `config/quiz`) under its own group, "quiz js (lazy)", with its own static imports not already counted, a "quiz JS" line in the summary and the lazy chunk counted in the total.

| Item | As built | Allowance | Measured |
|---|---|---|---|
| Critical JS added to `/` | the component's module script (the observer, the pending press, the retry through a fresh URL); Vite's 0.8 KB preload helper is shared with the hero's own dynamic import of the island chunk and was already counted in round 3 | at most 1 KB gz | 0.6 KB gz (1.1 KB raw) |
| The quiz chunk, lazy, imported within a screen of the section or on the first press | `deck.<hash>.js` carrying `deck.ts` and `config/quiz.ts` (shade ids only: the names, numbers, hexes, family lines and links are in the HTML, D25), and `track.<hash>.js`, `scripts/quiz/track.ts` in a chunk of its own because section 4's walk imports it too (the 0.1 KB `track.<hash>.js` under "critical js" is `scripts/family/track.ts`, the family pages' events) | at most 8 KB gz for the deck and the track together | 6.6 KB gz (15.3 KB raw) for the deck and 0.1 KB for the track; the summary's "quiz JS" line reads 6.7 KB |
| HTML | the ten cards (70 answers) and the seven results (48 compatible items with their data attributes) are server-rendered; no style attributes | no line: HTML is neither JS nor image weight | `index.html` 24.0 KB gz (103.2 KB raw, with the inline CSS and scripts) |
| The island chunk | `section3/ground.ts` and the observer, loop, warm-up and resize edits of the first build; the content rebuild adds nothing to it | at most 2 KB gz over round 3's island chunk for the ground and its wiring | 177.9 KB gz on `dist-s3`, which also carries the working tree's other island edits (section 4's), not measured apart |
| CSS | `quiz.css` is inlined into the page's `<style>` (no separate stylesheet); one hairline rule for every ringed swatch, no per-shade rules | no line: CSS is neither JS nor image weight | 12.6 KB raw, 3.8 KB gz as a file before Astro's minification (12,951 B and 3,870 B with `gzip -9` on the working tree, 2026-10-16) |
| Fonts | Poppins 700 now loads on `/`: the quiz headline is the first visible Poppins on the page and the file is requested at first layout on every tier; no preload (the page's one preload stays Open Sans); Source Serif 4 is not used by the section | Poppins 700 only, no new file beyond it | `poppins-700-latin.woff2` 8,000 B |
| Images | none; no still, no render; the five visual questions carry no pictures yet | 0 | 0 |
| Frame cost after the track, 3D path | one full-screen fragment pass (the ground) plus a one-fetch composite per frame while `#find` intersects, plus section 2's update on the CPU for half a second after the cut | none set; E-C4 applies | not yet measured; E-C4's convention (a real-phone trace on staging) applies |
| Total page JS | under the 250 KB gz budget: critical 13.5 KB, island 177.9 KB and the quiz's 6.7 KB | the page's 250 KB gz, with critical JS at most 60 KB gz (C1) | 198.1 KB gz |

## 7. Acceptance criteria

Each is PASS or FAIL with evidence, graded against this document. Frames at 390 x 844 and 1280 x 800 on the test build (`npm run build:test`, `?tier=hero3d`, the followers settled with `__skreedSnap(screens)` and `__skreedFreeze` for the hand-off frames): the hand-off at 15.7, 16.2, 16.7 and 17.2 screens; the intro; card 1; card 4; a card brought back by Back; an answer marked; a result with a ringed shade (Porcelain) and one without; the gift form with its validation, error, offline, success and duplicate states (a build with `PUBLIC_LEADS` on).

1. **Copy and type (A1, A3, A4).** Every visible string equals section 3 character for character (U+2019 apostrophes, three-dot ellipses, the no-break space in "11 p.m."), in sentence case; no digit inside any `h2` or `h3` ("Question n of 10" lives in an `aria-label` only, and no question carries one); no em or en dash and no emoji anywhere in the section (Sam's dashes survive only in his quotation in this document); no percentage and no "Top" figure on any result; Poppins 700 only on `.qz-h`, `.qz-q`, `.qz-shade`, `.qz-own` and `.qz-gift-h`, Open Sans 400 to 600 for everything else, no serif (type-system principle 9), nothing under 12 px; `node --test tests/unit/quiz.test.ts` passes (6 tests).
2. **The hand-off frames and the track (B1, D1; the parity suite).** At both sizes: 15.7 shows the gems mid-cut over the fog; 16.2 shows the fog alone (no gem or label pixel; the labels are hidden from `tp2` 0.25); 16.7 shows the intro panel rising from the bottom edge; 17.2 shows the intro panel over the fog. The 5.5, 6.0 and 15.0 frames of the v11-frames parity test are unchanged; `S2T.W2` is 15.2; `TRACK_SVH` is 1720 and equals the `.track` height in `shell.css` (`tests/unit/hero-math.test.ts`); the unit and e2e suites pass.
3. **The rise after the cut (C3 and E3, pending E-S3-bg).** The loop keeps WebGL running under the section (C3) and the fog drifts with no pause control (WCAG 2.2.2, E3); both wait on Sam (section 10, 3). With the followers settled, at 16.2 screens the top of `#find` is within 1 px of the viewport's bottom edge; at 17.2 the stage fills the viewport; under the section two canvas frames 2 s apart differ (the fog drifts) and `__skreedFrame` keeps increasing while `#find` intersects; `#stage` stays visible. The observer watches `#track`, `#find` and, in the working tree, section 4's `#room`, which run to the end of the page, so the loop cannot stop below the track; its stop is re-tested once the page has content below them.
4. **Phone layout and no horizontal scroll (B2, B4, G10).** At 360, 390, 430, 768, 1024 and 1280 wide, and one 844 x 390 landscape frame: `document.documentElement.scrollWidth` equals the viewport width at rest, during a fly-off and during Back's return from the left (`overflow-x: clip`); gutters at least 16 px (`--inset`); the begin button 48 px, each answer at least 44 px (63 px for two lines at 390), Back at least 44 x 44 px, the other text buttons 44 px tall, the input 48 px, the checkbox row 44 px, the form button 48 px; the deck one height from the first question to the last, the tallest card's: 661 px at 390 x 844, 679 px at 360 x 780, 542 px at 1280 x 800 and at 1366 x 657, and 578 px at 844 x 390, where the page scrolls through the deck; the stage uses `svh` only and nothing is animated in `dvh`; the panels never overlap each other. The fixed logotype over the panels (the result's top corner at rest at 390, the panels' text while the page scrolls) is graded **FAIL pending section 10, 12**, never PASS until Sam decides; the default ships it as it is.
5. **The deck's inputs, Back, the keyboard and retry (D1, D4, F1).** Visible at rest: the intro is static HTML and nothing waits at opacity 0. A press on "Swipe to begin" after the chunk has mounted begins. The loading path (D18: a press before the chunk has mounted shows "Loading..." with `aria-disabled` and `aria-busy`, keeps focus, and begins by itself when the chunk arrives, no second press) is graded with the chunk held back by a delayed route, and an aborted chunk gives the button back so the next press works. A tap, a click, or Enter or Space on a focused answer commits once (exactly one `quiz_answer`, with that answer's personality, in `window.__skreedEvents`); the answer shows the Urban Slate fill (`aria-pressed="true"`) before the card leaves; the card always leaves to the left; a second press during the commit does nothing, and an answer pressed during Back's return is not taken. Back on cards 2 to 10 drops the last answer (`quiz_back`, the answers one shorter) and brings the previous card in from the left with no answer marked, and a new answer there replaces the old; card 1 has no Back. On the focused card ArrowDown goes to the first answer and ArrowUp to the last, and from an answer to the next or the previous, stopping at the ends; ArrowLeft and ArrowRight do nothing; a horizontal pointer drag across a card moves nothing and commits nothing. The card behind the top one is inert (no focus, no clicks). Focus moves to each new card, to `h3.qz-shade` at the result and to card 1 on retry; the live region announces each card ("Question n of 10: " and the question) and the result ("Your shade: " the shade's name, a full stop, the personality's name); "Not quite? Try again" returns to card 1 with no dot filled, the gift hidden and the section's top in view. Hover and press states exist only on the primary buttons, the answers and the text buttons.
6. **Scoring and the draw (H "No results", F1).** The quiz always resolves: the personality deterministic, the shade and its family drawn from the group (D2 replaces the H row's "deterministic mapping to a family + shade" for the shade). `tests/unit/quiz.test.ts` proves: seven personalities in Sam's order, each with a finish and six or seven catalog shades led by his recommendation; ten questions of seven answers, each personality once per question, none in Sam's listing order, at least five different personalities shown first, the visual flags on cards 1, 3, 5, 8 and 9; the most-picked rule and the most-recent tie rule (the three worked cases of section 5), ten answers required, the result deterministic over 500 seeded answer sets; every shade of every group reachable by the draw, the others always the rest of the group in order. Through the UI, with `Math.random` pinned: ten answers for one personality give its result; a tie path gives the tied personality picked last; a pinned value shows the group's shade at that index with its heading, family line, link and hairline from section 3, the personality's finish, name, profile and colour profile, and the rest of the group in the compatible row with the drawn shade absent from it; a retry draws again from the same group.
7. **Contrast on the Pearl panels and the hairline (E3, A2, A5).** Urban Slate on Pearl Whisper measures 9.9:1 on every panel, and Pearl Whisper on Urban Slate in the marked answer; the answers' hairline is Urban Slate; the button text is the literal `#383F43` on Ember Luxe (5.0:1); every other colour in `quiz.css` resolves to `--pearl-whisper`, `--urban-slate`, `--ember-luxe` or a `--shade-<id>` token, the swatches painted through the CSSOM (no invented grey, no alpha, no style attribute in the markup); the nine shades of section 3 under 1.5:1 carry the 1 px Urban Slate hairline on the large swatch when drawn and on their small swatch in the compatible row, and no other swatch has a border (frames of a ringed and an unringed result); the swatches are the real product; every control shows the two-tone focus ring on `:focus-visible` (the email field by its 2 px hairline, the checkbox by its row's rings).
8. **States (D3, H2 to H4).** On a build with `PUBLIC_LEADS` on, each row of section 5's table is shown or argued: the Loading row as section 5 states it ("Loading..." for any press before the chunk has mounted, replayed at mount; an aborted chunk restores the button, AC5); validation on blur with a value and on submit, never per keystroke, the value kept, focus to the first invalid field; a mocked 200 whose request carries the drawn shade, its family, the finish, the personality and the ten answers (section 5), showing "Done. Your gift is on its way to <email>." and "Not you? Use another email." reopening an empty form; a mocked 409 showing the duplicate line; a mocked 422 showing the email error; a mocked 500 showing "That didn’t go through. Try again." with the values kept and the button live; offline (Playwright `context.setOffline(true)`) queuing the lead under `skreed-quiz-lead`, showing the offline line, and re-sending on `online`; a delayed route showing "Still trying..." at 8 s and the error at 20 s.
9. **Tiers (D2, C3).** Poster tier: no island request, section 3 on `--night` with its Pearl panels, the quiz end to end, no still image requested. Reduced motion: no transform animation runs (every running `Animation` on the section is opacity only: the card's fade out and in and Back's fade, no rise, no result scale-in), the answer is marked for 0 ms, the quiz works end to end. C3 is graded **FAIL pending E-S3-bg** (the fog under the section is WebGL), never PASS until Sam decides; exactly one WebGL context exists (`canvas#stage`; the section creates no canvas) and the section's own animations are transform and opacity only.
10. **Budget and hygiene (C1, F2, G21).** `node scripts/hero/budget.mjs dist` after `npm run build:test`: each measured figure within its allowance in section 6 (the section's critical JS at most 1 KB gz, the deck and track chunks at most 8 KB gz together, the island chunk at most 2 KB gz over round 3's for the ground and its wiring, measured on a build without section 4's island edits or graded FAIL as unmeasured, Poppins 700 the only new font file, no image); critical JS under 60 KB gz (the deck chunk printed under "quiz js (lazy)", outside the critical sum), total JS under 250 KB gz; no TODO, placeholder or commented-out code in the section's files; "See it on the case" links to the family page with the three-digit number (sampled: Sunflower `?shade=107`, Porcelain `?shade=010`) and the no-JS line links to `/#families`, which exists on the test build (`FAMILY_PAGES` on); on a production build both that anchor and "See it on the case" point at nothing until `PUBLIC_FAMILY_PAGES=on` (section 10, 5), so G21 is graded per build and the production case is Sam's call.

## 8. Out of scope

- The "From a photo" and camera tabs of spine row 3 (a later pass, if at all).
- The pictures for the five visual questions (cards 1, 3, 5, 8 and 9; Sam: "idk yet, we have to get creative and think about it"): words only until they exist, with `visual: true` and `data-visual` as the slot (D28; section 10, 1).
- Sam's confidence scores and rarity figures ("Confidence Score: 96%", "Rarity: Top 8%" and the rest): left out by his choice; until real answers exist to count, they would be invented counts (CLAUDE.md "never fake counts").
- A still image of the fog: none exists on any tier; the poster tier shows the section on `--night`.
- The Worker endpoint, the Supabase table, Turnstile and the email that sends the gift (section 4's infrastructure; this section ships the form against the contract in section 5, behind `PUBLIC_LEADS`).
- Analytics wiring (the events are queued on `window.__skreedEvents`; PostHog with G18).
- A share card for the result (section 5).
- The Wall and Reserve (later sections). In the working tree section 4 (the entrance and the Skreed universe, `docs/specs/section-4.md`) follows the gift, or the result in production.
- Changing the second wipe's look beyond its far side: the composite shader stays pinned to the v11.4 fixture, so the far side still slides and the gems, the labels and everything before 15.2 screens are untouched.
- The 3D case on the result (the family page shows it; one WebGL island, E-C3) and the spine's tilt card (no gyroscope permission on the teaser; "Best in gloss." or "Best in matte." is the finish line).
- The Turnstile widget in the gift block, its `turnstileToken` in the POST body and the route's rate limit: they arrive with the Worker, which must verify the token and rate-limit `/api/quiz-lead` (`docs/research/08-prelaunch-security-checklist.md` rows 7 and 10). Until then the form sends no token and the route does not exist.

## 9. Decisions taken

| # | Decision | Reason |
|---|---|---|
| D1 | Sam's format: his ten questions (his numbers 4, 5, 7, 8, 9, 10, 13, 14, 15 and 16), each with seven answers, one per personality, and his seven personalities with their profiles, colour profiles, finishes and shade groups. (This replaces the six binary swipe cards over the ten personalities of his Shade Diagnosis quiz.) | Sam sent the content on 2026-10-16 and answered the same day: build with these ten questions. Everything on the cards and the results is his, so nothing is invented. |
| D2 | The quiz decides the personality; the shade is drawn at random from that personality's group once per `finish()`, and the rest of the group is shown as compatible. A retry draws again; the draw is neither stored nor seeded. (This replaces one fixed shade per personality.) | Sam's note: "Make the recommended shade randomised within each result group" (person A gets Porcelain, person B Stone Blue, person C Sage). A draw per finish is the plain reading; a draw seeded by the answers would give the same shade again on "Try again" with the same answers, which his note does not ask for. His note replaces the CHECKLIST H table's "deterministic mapping to a family + shade" (the No results row, section 3's column): the personality is deterministic, and the shade and its family are drawn from the group (The Quiet Curator's spans five families). |
| D3 | "plus first dibs on your shade when we launch" in place of "plus an exclusive discount code to shop your signature shade when we launch". | The mechanic is the problem, not the word: a code offered as the reward for an email is discount language whatever it is called (CLAUDE.md brand facts, "Never discount language"; `docs/00-IDEATION.md` fixed the launch reward as priority access, no discount language). Sam decides (section 10, 2). |
| D4 | Sam's first headline is rendered; his alternative stays in `QUIZ_COPY.hAlt`, unrendered. Both of his closing lines are used, each once ("Found the perfect shade? Make it yours!" on the result, "And here’s a little something extra." on the gift). | They read as two spots, not two alternatives. The alternative carries a digit ("240"), so it could never be an h2 (A3); it is kept only so Sam can see it (section 10, 8). |
| D5 | No GSAP in this section. | 42.9 KB gz for a 6.6 KB deck; the hero set the pattern (E-GSAP). Later sections bring GSAP when ScrollTrigger earns it. |
| D6 | The intro, each card, the result and the gift stand on Pearl Whisper panels in Urban Slate; no darkened plates under text, no tint. | Urban Slate on Pearl is 9.9:1 and needs no exception. Section 2 tested backing plates under its labels and switched them off (`section2/labels.ts`, `PLATES` false; `section-2.md`), so a plate under the intro would re-enable a rejected look and be a non-token colour (A2) and a blurred dark shape (rules 25, 42). Square corners (rule 39), no border, no shadow. |
| D7 | The form ships behind `PUBLIC_LEADS`: on in dev, test and staging builds, off in production until the Worker exists. | The lead infrastructure (Worker, Supabase, Turnstile, email) is one piece of work for both forms; shipping the UI now means Sam can review the whole section, while production never shows a form whose every submit fails (H2). The same pattern as `PUBLIC_FAMILY_PAGES`. |
| D8 | The track shortens from 1820svh to 1720svh (`TRACK_SVH`, `shell.css`; a unit test keeps them equal). | Sam: "after the transition, the next ... will scroll up". Section 3's top reaches the bottom edge exactly as the cut completes (16.2 screens) and fills the screen at 17.2; the one screen that held the drifting swatch wall goes. The section 2 timings and both wipes do not move. |
| D9 | No still image of the fog. The poster tier shows section 3 on the page's `--night` ground with its Pearl panels. | A still would be a 40 to 60 KB image per class, a lazy-load and test-regex problem (the file name would match the island-bytes regexes), and a second rendering of a background whose only reason is Sam's brief for the 3D path; the panels carry the section's contrast on any ground. If Sam declines E-S3-bg, every tier shows the night ground (D16). |
| D10 | The result's primary action is the family page with the drawn shade in front, by the three-digit catalog number. | It is the only place the case renders in that shade; Reserve does not exist yet. With `PUBLIC_FAMILY_PAGES` off the link would 404, so production needs the family pages on (section 10, 5). |
| D11 | No storage of answers or results. | B3: nothing relies on storage; `sessionStorage` carries only a queued lead across a reload, with an in-memory fallback. |
| D12 | Section 3 is in normal flow with a 100svh stage, not a sticky section: the intro, the deck and the result take the stage in turn, the gift is hidden until a result exists, and `data-state="result"` drops the stage's `min-height` to 0. | A sticky section inside a wrapper of its own height has no scroll range to stick in, and a taller wrapper leaves dead scroll under an unanswered deck with the email form arriving before a shade exists. In flow, the page simply ends at the deck and grows at the result; "nothing scrolls" is literally true. (Written before section 4: in the working tree section 4 follows, so the page goes on below the stage; section 2.) |
| D13 | The stepper sits in the card's last row, centred, with Back at its left: ten 1 px Urban Slate rings that fill solid Urban Slate when answered. No shade-filled dots, no "3 of 10" text. | A dot coloured by a shade is UI chrome coloured by a shade (rule 24), and a ring at 35 percent Urban Slate would be an invented grey (A2); outside the card, on the fog, no single colour reads (WCAG 1.4.11). Inside the Pearl card the full-strength ring and fill read at 9.9:1. |
| D14 | No swipe-up gesture on the intro; the button alone begins (tap, click, Enter, Space). The label stays Sam's "Swipe to begin", although since the content rebuild nothing in the quiz is swiped (D20). | The intro is a pannable page surface: a swipe-up read with Pointer Events is cancelled by the browser's pan, and `touch-action: none` to make it reliable would stop the page scrolling past the quiz by touch. Sam decides the label (section 10, 6). |
| D15 | Open Sans for the sub-line, the answers, the profile and the colour profile; Poppins and Open Sans only in the section. | Type-system principle 9: "Wall, quiz and reserve form: Poppins plus Open Sans, no serif"; the three faces meet on one screen only in the hero. Departures from the roles table recorded here: the h2 is eight words (type-system note 3 says two to five; Sam's words, kept whole with `text-wrap: balance` and the 18ch measure; section 10, 8); the question (`.qz-q`) is Poppins 700 at `--fs-clause` (24 px at 390, 28 px at 1280) with role 13's line height and tracking (`--lh-quiz` 1.1, `--ls-quiz` -0.01em), not role 13's 28 to 40 px (`--fs-quiz`), because role 13 is set for a two-word question ("Beige or Rouge?") and Sam's are sentences of up to fourteen words (card 10), set left over a left-aligned list; the answers are Open Sans 400 at `--fs-legal` (16 to 17 px) in full-width rows, where note 13 set two 14 px labels under two swatches; the compatible names are 13 px (`--fs-tile-caption`); the validation and status lines follow note 10 at 400 and 14 px, without a 600 lead word (these sentences have none). |
| D16 | The stage observer watches `#track` and `#find`; the loop runs while either intersects, so the fog ground keeps drifting under the whole quiz; the ground is a second `createBackground()` instance fed section 2's `uTime` and `uScroll` values. (In the working tree section 4's `#room` is watched too, and the loop runs while any of the three intersects; Scroll in this document's section 2, and section 5.) | Sam's brief: "the same backround [sic] as the 2nd section". It breaks CLAUDE.md's one-island line and CHECKLIST C3, so it ships as the pending exception E-S3-bg with the fallback named (section 5, section 10, 3). A second instance is needed because section 2's `labels.update` writes `uLabN` and `uLabFeather` on its own instance every frame. |
| D17 | `C.uParA` is 0 on the second wipe, so section 2's frame holds still under the cut; the far side keeps the v11 shader's slide. | With the same fog on both sides, a sliding near side would read as a tear in the fog; holding it still makes the cut read as the gems being wiped off. The far side's slide stays because the composite fragment is pinned byte for byte to the v11.4 fixture and a `uParB` would change it; the sprites double briefly across the cut (this document's section 2; `docs/specs/section-2.md` carries no note of it). |
| D18 | The quiz chunk is lazy (imported within one screen of the section, or at once without IntersectionObserver), and a press before it arrives is meant to be remembered (`data-pending`, "Loading...") and replayed at mount. The loader keys on the chunk having mounted (a `mounted` flag set after `mountQuiz`), not on the import having started, so a press while the chunk is in flight is remembered too; a rejected import resets the loader and restores the button, and the `online` event retries the import. (An earlier build dropped the in-flight press and left the button dead after a rejected import; fixed 2026-10-16.) | The intro is static HTML and must not wait on the deck; a visitor who presses first should see "Loading..." on the button, the thing that is waiting, and never need a second press. |
| D19 | `aria-disabled="true"` (with `aria-busy` while loading) instead of the `disabled` attribute on the begin and send buttons. | `disabled` drops keyboard focus to the body when the state changes; `aria-disabled` keeps it, and the CSS removes the hover lift and the pointer cursor. |
| D20 | The answers are a column of seven full-width text buttons, and a tap, click, Enter or Space takes one: the button is marked (filled Urban Slate) for 120 ms and the card flies off to the left, whichever answer it was; Back on cards 2 to 10 undoes the last answer; ArrowDown and ArrowUp move between the answers. No drag and no swipe on the cards: the pointer code is gone, and with it the dead zone, the capture, the swallowed click and the spring-back. (This replaces the tap and drag arbitration of the six two-sided cards.) | Seven answers have no left and right to swipe to; a column of rows is the plain control for one choice of seven, each row at least 44 px and each answer readable in full without a picture. The mark shows which answer was taken before the card leaves, and one exit direction for every answer says nothing about which was picked. Back lets a visitor correct a mis-tap without restarting ten questions. With no drag there is no tap and drag arbitration to get wrong, and the page pans over a card as over any panel. |
| D21 | On the result the stage's `min-height` drops to 0 (`data-state="result"`), so the gift follows the result at one gap on every screen. | A 100svh stage with a short result (a laptop, or a short paragraph) would leave empty space before the gift; the result and the gift are one flow once a shade exists. |
| D22 | Reduced motion keeps the state cues: the answer is still marked (for 0 ms, so the fill shows while the card fades), every fade is 150 ms, and Back still works (a fade in place of the return from the left). | Reduced motion removes animation, not state (CHECKLIST D2). The fill is a colour change, not a movement. |
| D23 | The answers are shown in a fixed order per question (`SHOWN` in `src/config/quiz.ts`): a shuffle written once, the same for every visitor, different on each card and never Sam's listing order. | In Sam's order The Main Character would always come first and The Calm Strategist last, so a visitor could learn the positions and the quiz would score positions, not answers. A fixed order keeps the build deterministic and testable (the unit test checks that every card holds each personality once, none in Sam's order, and that at least five different personalities come first); a shuffle per visit would add randomness the tests and frames could not pin. |
| D24 | A tie at the top goes to the tied personality the visitor picked most recently. | Sam's rule is "maximum answers corresponding to"; it does not say what a tie gives, and with seven personalities over ten answers a tie is common (a third of all answer sets if every answer were equally likely; section 5). The most recent pick is deterministic, needs no fixed ranking of the personalities (which would favour one of them) and gives the visitor the last word. |
| D25 | Shade names, catalog numbers, hexes, family lines, links and the hairline flag are resolved at build: `Quiz.astro` reads `src/config/shades.gen.ts` and writes them into the HTML (`data-name`, `data-fam`, `data-href` and `data-ring` on each `li.qz-mini`); the lazy chunk carries shade ids only; `deck.ts` paints every swatch through the CSSOM (`style.background = var(--shade-<id>)`). An id that is not a catalog shade fails the build. | The 240-shade catalog stays out of the lazy chunk (6.6 KB gz). The CSP has no `style-src-attr`, so no style attribute can carry a colour; a CSSOM write is allowed, and it replaces the per-shade CSS rules that 47 shades would otherwise need. |
| D26 | On laptops (900 x 600 and up) the deck is 640 px wide, as the intro and the results are; on phones it stays at most 480 px. | `quiz.css`: "the wider deck keeps most answers to one line" (it keeps every one; section 2, 1280 x 800). At 640 px the tallest card is 542 px, so the deck fits a 657 px tall laptop screen with the stage's padding. |
| D27 | Sam's shade names are written as the catalog prints them: "Stone Blue" is Stone, "Sage Green" Sage, "Powder Blue" Powder, "Bubblegum Pink" Bubblegum, "Rosy Brown" Rosy, "Midnight Blue" Midnight, "Ballerina Pink" Ballerina, "Teal Blue" Teal, "Pine Green" Pine, "Navy Blue" Navy and "Jade Green" Jade. His "Wine" is the Roaring Red Wine (`roaring-red-23`, #4b0923), not the Vivid Violet one (`vivid-violet-23`, #572048). Chestnut (`basic-brown-20`) stays in both groups he lists it in. | CLAUDE.md "never invented shade names": the page shows the names the family pages show. Where the catalog has two shades of one name, his colour word picks one (Stone, Midnight and Teal are the Blissful Blue ones). "Wine" has no colour word, and The Main Character's group is otherwise five Roaring Red shades (Ruby, Burgundy, Claret, Crimson, Paprika) and one blue, so the red Wine. Sam decides (section 10, 13). |
| D28 | The five questions Sam marked VISUAL (cards 1, 3, 5, 8 and 9: the Sunday, the dream trip, the desk, the room and the outfit) are words only, laid out as the other five; `visual: true` in `QUIZ_QUESTIONS` and `data-visual` on the card are the slot for their pictures. | Sam: "idk yet, we have to get creative and think about it". No stock photography and no invented imagery stand in meanwhile (section 10, 1). |

### 9.1 Documents amended by this build

What this section's build changed outside its own files, as the working tree stands at the time of writing (2026-10-16, after the content rebuild). The code is the truth; the passages listed as still carrying old text are pending edits for the reviewer to read as such.

- `docs/specs/hero-architecture.md`: amended. `world/wall.ts` gives way to `section3/ground.ts` in the file map, the module table, start-up step 13, per-frame step F12, the render notes and the round-3 list; 7.5 "Stopping the island" now describes the observer on `#track` and `section#find` together, the loop running under section 3 (pending E-S3-bg) and the fallback; 11.3 is "Section 3, the quiz (the Wall moves to a later section)"; the `AfterTrackFiller` is recorded as deleted and the quiz as the content below the track in every build; `e2e/stopping.spec.ts` (AC2.4) is re-described. The file map (line 71) now reads `TRACK_SVH 1720 (460 in stage 1, 1820 in round 3)`. The content rebuild changes nothing here.
- `docs/specs/hero.md`: amended. (Section 0's intro-lines paragraph, 1.50 from Sam's Tune screenshot of 2026-10-16, is in the committed file ahead of this section's build and is not this tree's change; what this tree adds for it is the `export` on `INTRO_LINES` in `src/scripts/hero/intro/igloo.ts` and the assertion in `tests/unit/params.test.ts` against the prose line of `docs/specs/evidence/LOCKED_VALUES.md`.) 94 (the canvas keeps drawing the fog ground under section 3, pending E-S3-bg, and stops only once neither the track nor section 3 is in view); 322 (the quiz below the track in every build, the filler gone); AC2.4 at 342 (`__skreedFrame` keeps increasing while `section#find` is in view); 451 (section 3 and the Wall out of scope, the slot holding the quiz); 12.1 item 5 and 12.2 (the second wipe into section 3's fog ground, section 2 held still under the cut, `TRACK_SVH` 1720). Section 11's pending list carries E-S3-bg as row P8 (the default, where it lives, the alternative), and CLAUDE.md's "Still pending Sam" line names it.
- `docs/specs/section-2.md`: amended: 26 ("Wipe 2 into section 3's fog ground"), a new line 78 ("Background reused by section 3") and 127 (out of scope: wipe 2's far side is section 3's fog ground).
- `DESIGN.md`: amended by the first build: the spacing steps `--s4: 24px` and `--s5: 32px` with their use (section 5), the motion tokens `--dur-out: 200ms` and `--dur-card: 300ms` (section 10), the quiz components in section 4 and the quiz line under Responsive behaviour; its hero-layout lines carry the 1720svh track and the quiz in `<main>`, and the focus-ring default (2 px) is the offset the quiz uses. Amended again by the content rebuild: Quiz panel (the deck 640 px on laptops with the intro and the results), Quiz card (ten cards in one grid cell with the measured heights, the visual questions, the question at `--fs-clause` as D15 records, the footer with Back and the stepper, no drag, the 120 ms mark, the fly-off to the left, Back's return, reduced motion), Quiz answer in place of Quiz option, Quiz stepper (ten dots in the footer), Result swatch and the compatible row (the draw, the CSSOM paint, the hairline by `needsRing` and its nine shades), Text button (Back among its uses). Amended again on 2026-10-17 with this document: the deck holding the tallest card's height from the first question to the last, Back at least 44 x 44 px and its busy guard, the compatible row's 46 px columns and its `--s1` gap under each swatch, the `.qz-q` element rule (it read `.quiz-q`), the `--s4` and `--dur-card` comments and the Responsive behaviour line (the deck widening, not the option swatches).
- `CLAUDE.md`: amended by the first build with a section 3 line under the brand facts, rewritten for the content rebuild (line 17): Sam's content in `src/config/quiz.ts`, the intro as it was, ten cards of seven answers in a fixed shuffle, the fly-off to the left, Back, Up and Down, no drag; the seven personalities, the most-picked rule with the most-recent tie, the shade drawn within the group; no confidence or rarity figures; the visual questions words only; his wording exactly, with three changes (his dashes as full stops, the no-break space in "11 p.m.", "colour" for his "color"; amended 2026-10-17), and his shade names as the catalog prints them (his "Wine" is `roaring-red-23`); the gift behind `PUBLIC_LEADS` and "first dibs"; the list for Sam. The Always-do line "No WebGL from section 3 (the Wall) on" is unchanged on purpose until Sam decides E-S3-bg; the "Still pending Sam" line (98) names E-S3-bg.
- `docs/specs/evidence/LOCKED_VALUES.md`: amended: the intro lines (1.50) as a prose line after the table, read by `tests/unit/params.test.ts`.
- `src/config/hero.ts` and `src/styles/shell.css`: amended: `TRACK_SVH = 1720` and `.track{height:1720svh}`; `tests/unit/hero-math.test.ts` compares the two (unchanged, already in place).
- `src/styles/tokens.css`: amended: `--s4`, `--dur-out`, `--dur-card`. `src/env.d.ts`: amended: `PUBLIC_LEADS` in `ImportMetaEnv`, `__skreedIntro` typed.
- `src/pages/index.astro`: amended: renders `<Quiz slot="after-track" />`; the dev-only `AfterTrackFiller` is removed and `src/components/dev/AfterTrackFiller.astro` deleted.
- `scripts/hero/budget.mjs`: amended: static imports walk into "critical js", dynamic ones are noted, and the deck chunk (or any dynamic chunk that imports `config/quiz`) is printed under "quiz js (lazy)" with its own summary line and counted in the total. Its other change in the working tree, the room group and the section 4 lines, is section 4's.
- Tests: `tests/unit/quiz.test.ts` rewritten for the content, six tests: the seven personalities and their groups against the catalog and Sam's recommendations; the ten questions, seven answers each, each personality once, a mixed order, the visual flags; the most-picked rule and the most-recent tie; the shade draw reaching every shade of every group; the three-digit link and the hairline (exactly the nine ringed shades, the CSS rule); the copy rules, no digit in a question, no "%" or "Top" figure on a result. `node --test tests/unit/quiz.test.ts` passes 6 of 6. `tests/e2e/quiz.spec.ts` rewritten to the new deck, 18 tests (`npx playwright test tests/e2e/quiz.spec.ts --list`): AC5 and AC6 with `Math.random` pinned (ten answers for The Quiet Curator to Porcelain at 0.01; a three-way tie, The Warm Optimist, The Romantic Rebel and The Dreamer three each, to the Rebel, picked last among them, with the group's fourth shade, Blush, at 0.5), Back, the keyboard and the Tab order, retry with a second draw, the pending press and the aborted chunk; AC8 the gift form with the personality and the ten answers in the payload, offline and the slow route; AC9 reduced motion; AC4 at 390 x 844 and at six more sizes, 844 x 390 among them. Run against `dist-s3` on 2026-10-16 (`SKREED_DIST=dist-s3 BASE_URL=http://127.0.0.1:8799/`): 18 of 18 passed, on the build before the 2026-10-17 changes; not re-run for this amendment. From the first build: `tests/unit/params.test.ts` gains the intro-lines assertion; `tests/e2e/cue-logotype.spec.ts` re-describes the content below the fold as the quiz (it still removes `#main` to emulate nothing below, as `tests/e2e/tiers.spec.ts` 115 does, whose comment still calls that state "production"). Not yet covered: the 15.7 to 17.2 hand-off frames; a pointer drag across a card (AC5); `tests/e2e/tiers.spec.ts` 7 and 56 keep `ground` in the island-bytes regexes (harmless: no still exists and `section3/ground.ts` lives inside the island chunk).
- Not amended, and still describing the six-card build: `docs/specs/quiz.review.md`, the review log of the first build (a record of that review, not a description of the code).

## 10. For Sam

Each open item is a yes or no. The build ships the default named until he answers. The numbers of the questions still open are unchanged, so references elsewhere hold (`docs/specs/hero.md` P8 cites item 3); items 1, 9, 13 and 14 are new: the earlier 1 (the six-card format) and 13 (the ten signatures) were answered by Sam's content of 2026-10-16, and 9 was unused and now records a question he has already answered.

1. **The pictures for the five visual questions.** You marked five questions VISUAL (card 1, the Sunday; card 3, the dream trip; card 5, the desk; card 8, the room; card 9, the outfit) and said "idk yet, we have to get creative and think about it". They ship as words only, with `visual: true` and `data-visual` as the slot (D28). Three directions that need no stock photography and no invented imagery: (a) a still life of each answer in catalog shades, a pair of real swatches from the personality's group beside the answer's words, so every picture is the product; (b) each answer as its colour story, the personality's whole group as a band of swatches (The Main Character's six reds and a blue), so a visual card becomes a choice between seven palettes with the words under them; (c) your own photography of the scenes (a desk, a room, an outfit), shot for Skreed. Should one of them be made, yes or no, and which? With (a) or (b) the picture points to its personality, which a colour quiz may want. Rule touched: CLAUDE.md "Real content only"; rule 24 if a shade colours anything but a swatch; the budget (section 6) for (c). Default: words only.
2. **The reward wording.** "plus first dibs on your shade when we launch" in place of "an exclusive discount code to shop your signature shade when we launch" (D3), yes or no? Rule touched: CLAUDE.md brand facts, "Never discount language", and `docs/00-IDEATION.md`'s launch reward (priority access, no discount language). Default: "first dibs"; "right away" also stays until the gift is named (4).
3. **E-S3-bg: WebGL and the drifting fog under section 3.** The hero island keeps rendering section 2's fog under the whole quiz, as your brief asks ("the same backround [sic] as the 2nd section"), yes or no? Rules touched: CLAUDE.md's Always-do line "No WebGL from section 3 (the Wall) on"; CHECKLIST C3 (no WebGL in a spine section; E-C3 is hero only); rules 20 and 21 (a noise ramp over a colour ramp as a section background), 42 and 43 (the sprites and the dots), A2 (the fog's colours are render parameters, E-A2b is hero only); WCAG 2.2.2 (the fog drifts for the whole visit with no pause control, as E-2.2.2 for the hero). Default: the fog ships and the reviewer grades C3 "FAIL pending E-S3-bg". If no: the observer on `#track` only (the loop stops at the track as before), section 3 on the page's `--night` ground with its Pearl panels, no `ground.ts`.
4. **The gift email.** Who sends it and what it is: the `/api/quiz-lead` Worker, its Supabase table, Turnstile and the email do not exist, so nothing sends and the form stays off in production (`PUBLIC_LEADS`). Is the gift a thing we can name now, yes or no? Rule touched: CLAUDE.md "Real content only" (the copy promises "a surprise gift inspired by your shade right away"). Default: the form is on in dev, test and staging only.
5. **`PUBLIC_FAMILY_PAGES` on in production**, so "See it on the case" opens the family page with the shade in front and the no-JS line's `/#families` has its `nav#families` target, yes or no? Rule touched: CHECKLIST G21 (no dead ends). Default: off, as the round 3 report left it, so on a production build today the link would 404 and the no-JS anchor points at nothing.
6. **"Swipe to begin" now names a gesture the quiz no longer has anywhere.** It is a button and nothing on the intro is swiped, and since the content rebuild nothing in the deck is swiped either (D20): every visitor, on a phone or a laptop, reads a gesture they cannot make. Keep your label, yes or no? If no, "Begin" everywhere. Rule touched: CHECKLIST E3 (the accessible name equals the visible label either way) and A4 (the copy says what the control does). Default: "Swipe to begin" everywhere.
7. **The exclamation mark** in "Found the perfect shade? Make it yours!" The brand voice has none elsewhere on the site (confident, minimal, no hype). Keep it, yes or no? If no, "Found the perfect shade? Make it yours." Rule touched: CHECKLIST A4 (the Skreed voice). Default: your punctuation, kept.
8. **The headline's length at 390.** "Spoilt for choice? Let’s find your signature shade." is eight words and three lines of `--fs-h2` on a phone; type-system note 3 sets section headlines at two to five words. Keep it whole, yes or no? If no, "Spoilt for choice?" as the h2 with "Let’s find your signature shade." opening the sub-line. Your alternative, "Overwhelmed by 240 shades? Let’s fix that.", sits in `QUIZ_COPY.hAlt` unrendered; it cannot be an h2 as it stands because headings carry no digits (A3). Rule touched: CHECKLIST A3. Default: kept whole, balanced, within 18ch.
9. **Answered: "The Quiz (takes 5 minutes to complete)" is a working note** (Sam, 2026-10-16: working notes only), so no time line is on the page and nothing is asked here. Recorded for later: ten questions of one tap each take about two minutes, so a time line, if one is ever wanted, would read "Takes about two minutes", in words (no digit beside the headline, A3; CHECKLIST A4, no invented facts).
10. **The validation and status sentences.** Type-system note 10 names one shared pattern for error, offline and slow-network lines ("Could not reach the server. Try again."; "You are offline. Try again when you are back.") at Open Sans 400 with a 600 lead word; the quiz writes its own sentences ("That didn’t go through. Try again.", "You’re offline. We’ll send it when you’re back.", "Still trying...") at 400 with no lead word. Keep the quiz's sentences, yes or no? Rule touched: CHECKLIST A3 and A4 (type-system note 10 and role 6). Default: the quiz's sentences at 400.
11. **The fine print under the form**, "One email about your shade, one when we launch. Unsubscribe any time.", is the builder's count and promise, not from your brief. Keep it, yes or no? If no, "We’ll email you about your shade. Unsubscribe any time." Rule touched: CHECKLIST A4 (no invented facts). Default: kept, gated with the gift form behind `PUBLIC_LEADS`.
12. **The fixed logotype over the panels on phones.** The corner wordmark sits over the result panel's top corner at rest at 390 and over the panels' text while the page scrolls under it (the site's pattern on the family pages too). Leave it, yes or no? If no, the logotype hides while the result and the gift are on screen under 900 px wide. Rule touched: CHECKLIST E3 and G10. Default: left as it is.
13. **The two shade names that needed a choice.** (a) Your "Wine" in The Main Character's group: the catalog has two Wines, Roaring Red's (`roaring-red-23`, #4b0923) and Vivid Violet's (`vivid-violet-23`, #572048); the build uses the Roaring Red one, beside the group's other reds (D27). (b) Chestnut (`basic-brown-20`) is in both The Dreamer's group and The Calm Strategist's, as you listed it, so a Dreamer and a Strategist can both draw it. Keep both as built, yes or no? If no: the Vivid Violet Wine, and another shade of your choosing in place of one of the two Chestnuts. Your other names map one to one (section 3). Rule touched: CLAUDE.md "never invented shade names" (both are catalog shades either way). Default: as built.
14. **"Colour" for your "color".** The config now carries your questions, answers, profiles and colour profiles exactly as you wrote them, with your two dashes written as full stops (rule 16) and a no-break space in "11 p.m."; the one other change is The Calm Strategist's colour profile, "a hint of colour" for your "a hint of color", the spelling the rest of the site uses ("colour is personal."). Keep "colour", yes or no? If no, "color" in that line only. Rule touched: none in CLAUDE.md; the site's own spelling. Default: "colour".
