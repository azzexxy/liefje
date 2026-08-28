# liefje 💕

A cute, pastel-pink birthday website in casual Flemish. The main page
(`index.html`) builds up to a button that, after a few escalating clicks,
takes her to a second page (`surprise.html`) with a personal message and a
photo gallery.

## Personalize it

1. **The security question (do this first!)** — `index.html` opens behind a
   lock screen only she should be able to pass. Open `index.html`, find
   `<!-- EDIT ME -->` near the top, and replace the placeholder question
   `..., next question.` with a real question only she'd know the answer
   to. Then open `js/script.js`, find `CORRECT_ANSWER` near the top (also
   marked `<!-- EDIT ME -->`/`EDIT ME`), and set it to the real answer
   (matching is case-insensitive). Once someone answers correctly, their
   browser remembers it (via `localStorage`) so they won't be asked again.
2. **Her name & message** — open `index.html` and edit the sections marked
   `<!-- EDIT ME -->` (the hero title and the love note).
3. **Reasons you love her** — edit the cards in the "Een paar redenen waarom
   ik je graag zie" section.
4. **Photos on the main page** — drop images into `assets/photos/` named
   `photo1.jpg`, `photo2.jpg`, `photo3.jpg` (or update the `src` attributes in
   `index.html` to match your filenames). Until you add photos, those spots
   show a cute placeholder.
5. **The puzzle** — right after the personal note on surprise.html is a
   picture puzzle she has to solve before the sections below unlock: click
   any two tiles to swap them. The image is `assets/photos/puzzle.jpg`
   (already set). Swap it for a different photo any time — if the file is
   ever missing, it falls back to a numbered puzzle (still fully playable)
   so nothing looks broken.
6. **The surprise page / memory lane** — open `surprise.html` and edit the
   message marked `<!-- EDIT ME -->`. Below the puzzle is a timeline of real
   events in chronological order (place + date + photo(s), with a
   placeholder title and memory text for you to fill in): Daknam (22/05),
   Zele (05/06), Gent (28/06), Knokke (03/07), Mundaka (13/07), Sopela Beach
   (14/07), Guggenheim Bilbao (17/07), Biarritz & La Rochelle (18/07), and
   Monet's Garden in Giverny (20/07). Search `surprise.html` for
   `<!-- EDIT ME -->` and write in the real title (`<h3>`) and text (`<p>`)
   for each one. An event with more than one photo wraps its `<figure>`s in
   a `.timeline-photo-group` so they stack together on one side. To add a
   new event, copy a whole `.timeline-item` block (see the HTML comment
   right above the timeline for the exact steps: alternate `side-left`/
   `side-right`, drop the photo(s) in `assets/photos/surprise/`, and update
   the place/date spans in `.timeline-date`).
7. **Scattered childhood photos** — instead of a dedicated section, 3
   childhood photos are tucked in as small "POV: me when ..." stickers at
   different spots on the site (bottom of `index.html`, and two spots on
   `surprise.html`), each already using a real photo
   (`assets/photos/surprise/baby1.jpg`–`baby3.jpg`). Search for
   `.mini-throwback` in both files and finish each meme's punchline in the
   `<p class="mini-throwback-text">`.

## Publish it with GitHub Pages

1. Push this branch, then merge it into `main` (or set Pages to build from
   this branch).
2. In the repo settings, go to **Settings → Pages** and set the source to
   deploy from the branch containing this site (root folder).
3. The site will be live at `https://azzexxy.github.io/liefje/`.

## The QR code

`assets/qr-code.png` is a scannable QR code (verified to decode correctly)
styled as a polaroid pinned with a little clothespin, on a pastel pink
background with hand-drawn heart doodles and a peeking teddy bear, captioned
"scan voor een leuke surprise :)". It's no longer embedded on the site itself
(kept out of the page since you're sharing the image directly), but the file
still lives in `assets/` and the generator script still works.

If you host the site somewhere other than the default GitHub Pages URL,
regenerate the QR code with the real URL:

```bash
pip install qrcode pillow
python3 scripts/generate_qr.py https://your-real-url-here/
```

This overwrites `assets/qr-code.png` with a fresh polaroid-style QR card
pointing at the new address.
