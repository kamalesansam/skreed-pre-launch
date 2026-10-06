# The Skreed teaser, in words

The whole site as a person will live it, before a line of it exists. Phone first, because that is how almost everyone will arrive. Laptop differences are called out where they matter. Every shade named here is a real one from the catalog. Decisions already taken (stack, rules, type, palette) are not re-argued; this is the imagination of the thing.

## The idea in one breath

Someone taps a link in an Instagram bio or a WhatsApp forward. In under two seconds they are looking at the phone they own, in the black case everyone owns, and with one thumb they drag it into colour. From there the site does four things in order: it shows all 240 shades at once, it helps them find theirs, it lets them claim it before anyone else, and it makes the claim worth telling a friend about. Then it tells them, in the founders' own words, why a case company cares this much about colour. Every day until November 4 the site wears a different shade, so it is never the same screenshot twice.

The voice is one person talking to another. Short sentences. No hype. "Colour is personal" is the whole argument.

## Arrival

The address is skreed.in. The page paints at once: no loader, no spinner, no splash. The first frame is already the hero, in type, with the renders arriving a beat later into boxes that were already the right size, so nothing jumps.

Across the top on a phone there are three things only. The SKRD mark at the left, 60 px, Urban Slate on Pearl Whisper. In the middle a small line in Open Sans: "Doors open Nov 4" with a live countdown in tabular figures, "29 days 06:12:40", ticking once a second. At the right a speaker icon, crossed out, the only icon in the header, because sound on this site is off until someone asks for it.

The page background is Pearl Whisper, the warm off-white from the brand guide, except for the thin tint band under the header. That band is today's shade. On October 24 it might be Mauve; on Diwali it will be Amethyst. The band is the only place the daily shade lives in the chrome; everything else stays off-white and slate, so the product colours remain the product.

## Section 1. Basic, or beyond basic

The first screen is a single photograph-grade render of a phone, the phone the visitor is most likely holding (we detect iPhone, Pixel or Galaxy from the browser and pick the nearest device render; the default is iPhone 17 Pro). It fills the width between the 16 px gutters and sits on a flat Pearl Whisper ground with a soft two-tone gradient behind it, the only gradient on the site, so subtle it reads as light rather than colour.

The phone wears a plain black case. A thin vertical line with a round handle sits at about 30 percent from the left. To the right of the line, the same phone wears today's shade. The visitor drags the handle. The black case gives way to colour under their thumb, and the headline above the render changes with it.

At rest the headline reads, in Poppins 700, sentence case: "Basic." As the handle passes the middle it resolves, once, into "Beyond basic." and stays there. If the visitor never drags, the handle nudges itself 20 px to the right and back after three seconds, once, as an invitation. On a reduced-motion phone the handle starts at 60 percent, the headline reads "Beyond basic." from the first frame, and nothing moves on its own.

Under the headline, in Source Serif 4 at 17 px, the sub-line: "240 shades. One of them is yours." Under that, the one Ember Luxe button on the screen: "Reserve my shade". It scrolls the visitor to section 4 with the shade from the hero pre-selected.

Three small dots sit on the coloured half of the render: one on the camera bump, one on the flat of the case, one beside the shade name that hangs under the phone in Open Sans 600 ("Mauve, Vivid Violets"). Tap the camera dot and the finish toggle appears: Matte or Gloss, and the render crossfades between the two, the gloss version carrying a specular highlight that slides as the phone's gyroscope tilts. Tap the flat of the case and the quiz opens. Tap the shade name and the Wall scrolls into view with that family open. These are HTML buttons placed over a WebP, which is why the hero weighs under 120 KB and still feels like an interactive 3D object.

On a laptop the render is larger and sits to the right, the headline and sub-line to the left, and the handle follows the mouse while it is pressed. The gradient behind the phone shifts slightly with the cursor, the one cursor-driven movement on the site, kept to a few pixels.

Below the hero, a sticky bar appears on phones once the hero has scrolled out: "Reserve my shade" in Ember Luxe, full width, above the home indicator, with the shade name beside it updating as the visitor chooses. It disappears when the reserve form is on screen.

## Section 2. The Wall

The headline is "All 240. Pick one." The eyebrow above it, in Open Sans, small, full-strength slate, reads "02 / 08".

Then the ring. Ten arcs make one circle, each arc filled with a conic gradient of its family's 24 shades, in catalog order, so the ring is a colour wheel made of the actual product. Frosty Whites at the top, running clockwise through Blissful Blues, Playful Pinks, Vivid Violets, Mellow Yellows, Earthy Browns, Blushing Corals, Stormy Greys, Go Green, Roaring Reds. The family name of the arc at the top sits in the centre of the ring in Open Sans 600. On a phone the ring rotates under the thumb; the arc that comes to the top is the family that opens below. On a laptop the arc under the pointer lifts a few pixels and the name changes on hover; a click opens it. No library draws this; it is one element with a conic gradient and a rotation.

Below the ring, the grid. On a phone it is the open family only: 24 tiles, six across and four down, each a 53 px square of flat colour with square corners and no label, because 79 of the 240 names do not fit in 53 px and a wrapped label on a swatch is a tell. The first time the Wall enters the viewport the 24 tiles flip in from the centre outward over 600 ms, a pixel reveal made of the product itself. After that they are still. One caption line under the grid, Open Sans, shows the name of the tile last tapped: "Lavender" then "Amethyst" then "Elderberry".

Tap a tile and it swells to a card that covers the lower two thirds of the screen: the shade name large in Poppins 700 ("Amethyst"), the family under it in Open Sans ("Vivid Violets, 7 of 24"), the phone render re-tinted to that shade, the finish toggle, a line of one sentence about the shade from the copy deck ("The blue end of violet. Reads purple in daylight, blue at night."), the live count once it exists ("38 reserved"), and a Reserve chip. Swipe left or right on the card to move to the next shade in the family without closing it. Swipe down to close. If the sound toggle is on, each tile tap gives a soft tick, one sound file, 12 KB.

Below the open family, a row of ten circle swatches, one per family, the catalog's own 6x4-circle language condensed to a strip, so the visitor can jump families without scrolling back to the ring.

On a laptop the Wall shows all 240 at once in a ten-row grid, 80 px tiles, with a 13 px label appearing on hover. Above the grid a two-word toggle: "grid / spiral". Spiral turns the 240 tiles into a helix that the visitor scrolls through, each family a turn of the screw, the shade name of the tile nearest the viewer showing beside it. It is built from DOM tiles and CSS 3D transforms driven by scroll position, no WebGL, so it degrades to the grid on anything weak and never ships to phones.

The last tile of the last family, Mahogany, has a neighbour: a 241st tile, greyed, with a small lock. Tap it and a card says: "The 241st shade is chosen by you. Follow @skreedofficial and watch for the vote." It is a link to Instagram, nothing more; nothing on the site can check a follow and nothing pretends to.

Counters on the Wall load from one request. Until it returns, each count is a skeleton bar the exact width of "000 reserved", in the one derived neutral, so the swap moves nothing. Counts under ten show as "Be the first" instead of a number.

## Section 3. Find your shade

Headline: "Not sure? Let the case choose you." Three tabs under it in Open Sans: Quiz, From a photo, and a third, Camera, greyed with "soon" beside it until week two.

The quiz is six cards, one question each, swiped like a dating app. Each card shows two real renders side by side with their shade names and a question in Poppins at the top: "Beige or Rouge?" "Matte or gloss?" "Morning or midnight?" "Loud or quiet?" "Warm or cool?" "Sunbeam or Charcoal?" The visitor taps one side or swipes toward it; the card slides off and the next arrives. A six-dot stepper under the cards fills as they go. There is no wrong answer and no empty state: the six answers map deterministically to a family and then to one of its 24 shades, so every path ends on a card.

The result card is the same enlarged-tile card from the Wall, with one extra line: "Your shade is Sunset. Blushing Corals." Under the render, two buttons: "Reserve Sunset" in Ember Luxe and "Not quite? Try again" in plain slate text. The render on this card tilts with the phone. On iPhone the first tilt needs permission, so a small chip over the render says "Tap to enable tilt"; on Android it just works; on a laptop the pointer does it. Gloss shows as a highlight that moves across the case; matte shows as a flat, slightly softened surface. No glass panels, no blur, just the render.

From a photo: a single large target that says "Pick a photo", which opens the native picker. The image is read on the phone, never uploaded. Five dominant colours are pulled from it and shown as five circles; each is matched to the nearest of the 240 by colour distance, and the five matched shades appear as tiles with names. Tap one to get the result card. If the file will not decode, the message is one line: "That photo didn't open. Try another, or take the quiz." If the photo is nearly grey the five circles are still shown; the Stormy Greys family is a real answer.

## Section 4. Reserve your shade

Headline: "Reserve Sunset." The shade name in the headline is live; it follows whatever the visitor last chose anywhere on the page. If they chose nothing, it reads "Reserve your shade" and the first field is the shade.

The form is four fields and one box, in this order. Phone number, with "+91" fixed in the field and ten digits expected, validated when the visitor leaves the field, never on each keystroke. Device, a picker of the 21 devices we have renders for, pre-filled from the browser's guess. Finish, Matte or Gloss, two large chips. Email, optional, labelled "Email, optional, for a receipt". Then one unticked box in Open Sans: "Skreed can message me on WhatsApp about this reservation and the November 4 launch. Withdraw any time by replying STOP." Under the box, a one-line link: "What we do with your number".

The button says "Reserve my shade". While the request runs it reads "Reserving..." and stays disabled; there is no spinner. Turnstile runs invisibly. If the network drops, the form keeps everything typed and says "You're offline. We'll send it the moment you're back", and it does, on reconnection, once. If the server fails, the message is under the button, in words: "Something broke on our side. Your details are still here. Try again."

Above the form, once a shade is chosen, a single line in Open Sans with tabular numerals: "212 people have reserved a Blushing Coral". Only when the count is real and above ten.

Success replaces the form in place, no new page on the first visit. "Sunset is yours." in Poppins 700. Under it, in Source Serif 4: "You are number 213 to reserve a Blushing Coral. The doors open on November 4, and you walk in first. We will message you on WhatsApp the morning of." Then the position number large, "#213", in Poppins, the one static number the headline face is allowed. Then two things that make the moment worth sharing.

First, the Shade Twin. "Sunset has a twin." Beside the Sunset swatch sits its complement from the other side of the ring, Ocean. "Send this link to someone. If they reserve Ocean, you both get first pick on launch morning." The link is skreed.in/r/sunset-k7f2, one tap to copy, one tap to share on WhatsApp. The referral is a cookie-free code; it works from any browser.

Second, the share card, which is section 5 and appears directly under the confirmation.

On a laptop the form sits to the right of the render and the confirmation animates the render upward by 40 px with the position number counting up from 0 to 213 in 800 ms. On a phone the count-up is the same; nothing else moves.

The same confirmation is reachable at skreed.in/thanks with the reservation code, which is where the WhatsApp message and the optional email point.

## Section 5. Tell someone

The share card is drawn on a canvas, 1080 by 1920, and shown at phone width. Pearl Whisper ground, the visitor's shade as a large circle swatch in the upper half with the phone render in it, "My Skreed shade is Sunset." in Poppins 700, "One of 240. Doors open Nov 4." in the serif, the SKRD mark and skreed.in in Open Sans at the bottom. The fonts are loaded through the FontFace API before the first draw, so the card never renders in a fallback face.

One button: "Share to story". On a phone with Web Share it opens the system sheet with the PNG attached; Instagram Stories and WhatsApp are one tap away. Where Web Share is missing, the button becomes "Save image" and a second line says "Then post it and tag @skreedofficial". A third line, under both: "Join the broadcast channel for launch-morning codes", linking to the Instagram broadcast channel, because joining it is the one action that forces a follow.

Under the card, three small tiles show the same card in three other shades, so the visitor sees it is personal, not a template.

## Section 6. Five Diwali lights

This section is charcoal. Urban Slate ground, Pearl Whisper type. It is the only dark band on the page and it is where the lifestyle photographs live.

Headline: "Five days. Five shades." Then five cards, one per day, each a full-width photograph with a shade as its subject. Dhanteras, November 6: Golden, a case beside brass. Naraka Chaturdashi, November 7: Chilli. Diwali, November 8: Amethyst, a case on a sill with a diya. Govardhan Puja, November 9: Sunflower. Bhai Dooj, November 10: Ballerina and Cobalt side by side, two cases, because the day is about a pair. Each card carries the day, the date, the shade name and one sentence in the serif ("The night of lamps asks for a colour that holds light. Amethyst does.").

As the visitor scrolls, the photographs drift at three speeds: the case layer slowest, the background faster, a foreground object fastest, a few pixels each, enough to feel like depth and never enough to be a parallax trick. On phones that is CSS scroll-driven animation; on laptops GSAP where the browser lacks it. Reduced motion: the layers are still.

Under the cards: "Gift a pair." A short form that is the reserve form with one extra field, the recipient's name, and copy that says the second case will be held under their name for launch week. Nothing about price. Nothing about discounts.

## Section 7. Why we care this much

Back to Pearl Whisper. The section opens with three words set as large as the screen allows, one per line, in Poppins 700: "Smart." "Sleek." "Skreed." As each word scrolls into the middle of the screen it fills from slate to its colour. Which colour is a decision Sam has to make, because rule 24 says shades never colour headings: either the words fill with a family colour (Sunbeam, Sky, Rouge), as the plan wanted, or they stay slate and a real circle swatch appears beside each word. Both versions are choreographed once; on reduced motion they are simply there.

Then the founders' note, in Source Serif 4 at 17 px, about 120 words, first person plural, signed by Sam, Prem and Jyotika, with the one real photograph of the three of them, on a neutral backdrop, no filter. The note says what the brand guide says, in their own words: that two people can love blue and mean different shades, that the company exists because nobody else let you choose yours, that November 4 is the day the doors open in India.

Under the note, one input: "Tell us the colour you have never found in a case." A free-text line, 80 characters, no name required, posted to the same endpoint as reservations and tagged as a note. It is the quietest form on the site and probably the one that gets read most carefully.

## Section 8. Footer

Five questions, as native disclosure rows, no icons, in Open Sans: "When does it launch?" "What does reserving mean?" "Is this a payment?" "Which phones?" "How do I take back my number?" Each answer is two sentences.

Then the facts. collab@skreed.in, shown as text with a copy button. Hyderabad, Telangana. "We reply on WhatsApp within one working day." The Instagram handle. Privacy, Terms. And the last line, in Poppins 700, the only headline in the footer: "November 4. Go beyond basic."

## The pages that are not the home page

/thanks: the confirmation, position number and share card for a given reservation code, so the WhatsApp message has somewhere to land. /r/<code>: the Shade Twin landing, which opens the home page with the twin shade pre-selected, a line at the top saying "Sam reserved Sunset. Ocean is its twin, and it is waiting for you.", and the inviter's first name only if they gave one. /privacy and /terms: Poppins titles, Open Sans prose, written for the Digital Personal Data Protection Act, naming what is collected, why, for how long, and how to withdraw. And the 404: Pearl Whisper, "404." in Poppins at the top, then in the serif "That shade doesn't exist. These 240 do.", then the ring, which is a working way back in.

## The ambient layer

The shade of the day. From go-live to November 3 the site wears a different shade each day in the header band, the hero's right half, the sticky bar's swatch and the share card's default. The sequence is chosen, not random: it walks the ring once, 24 days through the families in catalog order, then the last ten days are the ten family heroes leading into Diwali. The shade of the day is also the default answer to "Reserve my shade" if the visitor has chosen nothing, and it is named in the page title, so a tab or a screenshot reads "Skreed. Today: Mimosa."

Sound. Off by default. The header speaker turns on four sounds: a tick on each Wall tile, a soft click on the finish toggle, a short rising note on a successful reservation, and a tick per card in the quiz. All four together weigh under 40 KB and never play unprompted.

Motion. Five choreographed moments: the hero handle and headline, the Wall's one-time flip-in and the enlarge, the quiz swipe, the confirmation count-up, the manifesto fill. The Diwali drift is a sixth and the quietest. Nothing else moves on scroll, nothing fades in, nothing follows the cursor except the hero gradient by a few pixels on a laptop.

The index. "01 / 08" through "08 / 08" as eyebrows, which on a laptop also appear as a thin vertical list at the right edge, the current section's number in Ember Luxe, clickable. On a phone they are just the eyebrows.

## The same site on a laptop

A 1280 px window, a trackpad, a cursor. The laptop version is not a stretched phone; it is the same eight sections with room, and the room goes to the product. Columns appear, the Wall shows everything at once, hover becomes a language, and the spiral exists. Nothing gets a decoration the phone does not have; things get bigger, side by side, and more of them are visible at once.

### Arrival on a laptop

The header is a single row with air in it: the SKRD mark at the left at 72 px, the countdown in the centre ("Doors open Nov 4, 29 days 06:12:40"), and at the right the speaker toggle and, new on laptop, the eight section numbers in a horizontal row, 01 to 08, in Open Sans, the current one in Ember Luxe. They are links. The header is sticky and turns from transparent to Pearl Whisper with a hairline when the hero scrolls under it. The daily tint band is the same thin line under it, edge to edge.

### Section 1 on a laptop

Two columns at a 5:7 split. Left, vertically centred: the eyebrow "01 / 08", the headline "Basic." in Poppins at 88 px on one line, the serif sub-line at 20 px, the Ember Luxe button, and under the button the shade line "Mauve, Vivid Violets" with a small circle swatch. Right: the render at about 560 px tall, the black half and the coloured half divided by the handle line, the whole thing sitting on the soft two-tone light.

The handle follows the cursor while the mouse button is down, and the headline resolves to "Beyond basic." the moment the handle crosses centre, with the thin "Basic." letters snapping heavier into "Beyond basic." in one 300 ms move, no fade. If the visitor only hovers, the handle gives its one 20 px nudge after three seconds. Moving the cursor across the hero shifts the light gradient behind the phone by at most 6 px in the opposite direction; that is the entire budget for cursor-driven movement on the site.

The three hotspots are visible as small slate dots and grow a label on hover ("Finish", "Find my shade", "See the family") before the click. The finish toggle appears beside the render as two words, Matte and Gloss, and the gloss highlight follows the cursor across the case instead of the gyroscope. Keyboard: Tab reaches the handle, left and right arrows move it in 5 percent steps, the hotspots are buttons with focus rings in Ember Luxe.

There is no sticky bottom bar on laptop. The section index at the top right does that work, and the "Reserve my shade" button repeats in the Wall's enlarged card and in the quiz result.

### Section 2 on a laptop

The Wall is the section a laptop was made for. It opens with the headline on the left, "All 240. Pick one.", and the ring on the right at 320 px, the family name in its centre changing on hover, the hovered arc lifting 4 px outward. Click an arc and the grid below scrolls that family's row into view and holds a hairline under it for a second.

Below: all 240 tiles in ten rows of 24, 44 px square at 1280 px, square corners, 6 px gaps, in catalog order from Frosty Whites at the top to Roaring Reds at the bottom, with the family name at the left of each row in Open Sans 600 set vertically. On the first entry into view the 240 tiles flip in, a wave from the centre of the grid outward over 900 ms. Hover a tile and it lifts 4 px, its 13 px name appears beneath it in Open Sans, and a shadow-free lift is all it does. Click and the enlarged card opens as a panel on the right third of the screen, the grid narrowing to make room rather than being covered: shade name in Poppins at 48 px, family and index, the render re-tinted, the finish toggle, the one-sentence story, the live count, the Reserve button. Arrow keys walk the grid while the panel is open; the panel follows.

Above the grid, two words at the right: "grid / spiral". Spiral is the laptop-only piece. The 240 tiles leave the grid and arrange themselves on a helix that comes toward the viewer, ten turns, one family per turn, the nearest tile largest and its name beside it in Poppins. The helix turns with the scroll wheel, one tile per notch, and with a drag. It is DOM tiles on CSS 3D transforms driven by scroll position; it is why there is no WebGL anywhere. "grid" brings everything back to the grid with the same tile animating from its helix position to its grid cell, so nothing teleports. The toggle remembers its state for the session. On any machine that reports a weak GPU, the toggle is simply absent.

Sound, if on, ticks on tile hover at a lower volume than on tap, so running the cursor along a row sounds like a thumb along a paint-chip book.

The 241st tile sits after Mahogany, greyed, locked, with the same card on click.

### Section 3 on a laptop

Three tabs, left aligned, under the headline. The quiz cards are 420 px wide, centred, two renders side by side in each, and they answer to the keyboard: left and right arrow pick a side, the card slides off in that direction. The mouse can drag a card too, with the card rotating a few degrees in the drag direction the way a real card would, and snapping back if released before halfway. The six-dot stepper sits under the cards; each filled dot takes the colour of the shade chosen on that card, which is the only place on the site the shades enter the UI, and they do it as swatches.

The result card opens full width with the render on the left tilting under the cursor, gloss highlight travelling with it, and the text on the right: "Your shade is Sunset." in Poppins at 56 px, "Blushing Corals, 11 of 24", the sentence, the two buttons. A row of three small swatches under the text shows "near misses": the shades on either side in the family and the twin across the ring, each clickable, because on a laptop people browse.

From a photo: the drop target is large and accepts a dragged file as well as a click. The five extracted circles appear in a row with the five matched tiles under them, and hovering a circle draws a thin line to its tile.

### Section 4 on a laptop

Two columns again. Left: the render in the chosen shade, large, with the finish toggle under it. Right: the form, 420 px wide, the same five fields, the same unticked box, the same button. The live count sits above the form in tabular figures and counts up by one, visibly, when the visitor's own reservation lands.

Success: the form fades to the confirmation in place; the render lifts 40 px and settles; "#213" counts from 0 to 213 in 800 ms in Poppins; the Shade Twin appears with both swatches, Sunset and Ocean, side by side; the referral link sits in a field with a copy button and a WhatsApp button, and the share card is already drawn below, so the whole confirmation is one screen with nothing to scroll for.

### Section 5 on a laptop

The share card is shown at 360 px wide, portrait, beside three alternative cards in other shades, all four drawn on canvases from the same template. Web Share is rare on laptops, so the button reads "Download image" and a line under it says "Post it from your phone and tag @skreedofficial". A second button, "Send to my phone", opens WhatsApp Web with the link to this reservation's /thanks page, which is the laptop's bridge to the phone. The broadcast channel link sits under both.

### Section 6 on a laptop

The charcoal band pins. The five Diwali cards become a horizontal strip, each card 640 px wide, and the visitor scrolls the page to move the strip sideways: five photographs pass in order, Golden, Chilli, Amethyst, Sunflower, then Ballerina and Cobalt together, the day and date and shade name in Pearl Whisper at the left of each, the serif sentence under them. The three-layer drift runs inside each card as it passes the centre. The strip is pinned for exactly as much scroll as it needs and releases cleanly into "Gift a pair", which sits in the same two-column layout as the reserve form. Keyboard and reduced motion: the strip becomes a vertical stack of the five cards, no pin.

### Section 7 on a laptop

"Smart." "Sleek." "Skreed." at 128 px, one word per line, left aligned, pinned for three scroll screens: each word fills as it reaches the middle of the viewport, by family colour or by slate with a swatch, whichever Sam decides. Then the founders' note in two columns: the photograph of the three of them on the left at 480 px, the note on the right in the serif at 18 px, 60 characters a line, signed. The free-text line "Tell us the colour you have never found in a case" sits under the note at the full width of the text column, with the 80-character counter in tabular figures at its right end.

### Section 8 on a laptop

The five FAQ rows run in a single column at 640 px on the left; the facts (email with copy button, Hyderabad, the WhatsApp reply promise, the Instagram handle, Privacy, Terms) sit in a column on the right. The last line, "November 4. Go beyond basic.", runs the full width at 56 px in Poppins, and under it the daily tint band closes the page the way it opened it.

### Everything a laptop gets that a phone does not

The section index in the header. The spiral. Hover states on tiles, ring arcs and buttons, each a 4 px lift or a colour change, choreographed once. Keyboard paths through the hero handle, the Wall grid, the quiz and every form. The horizontal Diwali strip. The pinned manifesto. The enlarged-tile side panel instead of a bottom sheet. The three near-miss swatches on the quiz result. "Send to my phone". The 6 px light shift behind the hero.

### Everything a phone gets that a laptop does not

The sticky Reserve bar. Gyroscope tilt and the moving gloss highlight. The bottom-sheet card. Web Share straight into Instagram Stories and WhatsApp. The ring rotating under a thumb. The vertical Diwali stack with the drift. Nothing else differs; the words, the shades, the counts, the forms and the order are identical.

## What it should feel like

Opening it should feel like picking up the catalog: off-white, quiet, confident, with the colour doing all the talking. Dragging the hero should get a small involuntary smile. The Wall should make people scroll back up to look again. The quiz should take under thirty seconds and end on a shade they did not expect and like. Reserving should feel like being handed a numbered ticket, not like signing up for a newsletter. The share card should be good enough to post without cropping. The founders' note should make the brand a group of people. And on November 4 the WhatsApp message should feel like a door opening, because that is exactly what it is.

## What this means for assets (the next conversation)

Renders: one greyscale master per case type for tinting, plus the 21 device heroes for the picker; a 36-frame turntable per case type if the finish crossfade is to become a true rotation. Photographs: five Diwali shots on the shades named above, one for Bhai Dooj with two cases, and the team photograph. Vector: the SKRD mark and SKREED wordmark. Sound: four short files. Copy: the 240 one-line shade stories, ten family blurbs, six quiz questions, the five Diwali sentences, the founders' note, the five FAQ answers, the WhatsApp templates, the privacy and terms text. Data: the daily shade sequence, the Shade Twin pairing table (120 pairs across the ring), the quiz mapping table.
