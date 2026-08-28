# liefje 💕

A cute, pastel-pink birthday website in casual Flemish. The main page
(`index.html`) builds up to a button that, after a few escalating clicks,
takes her to a second page (`surprise.html`) with a personal message and a
photo gallery.

## Personalize it

1. **Her name & message** — open `index.html` and edit the sections marked
   `<!-- EDIT ME -->` (the hero title and the love note).
2. **Reasons you love her** — edit the cards in the "Een paar redenen waarom
   ik je graag zie" section.
3. **Photos on the main page** — drop images into `assets/photos/` named
   `photo1.jpg`, `photo2.jpg`, `photo3.jpg` (or update the `src` attributes in
   `index.html` to match your filenames). Until you add photos, those spots
   show a cute placeholder.
4. **The puzzle** — right after the personal note on surprise.html is a
   sliding picture puzzle she has to solve before the sections below unlock.
   The image is `assets/photos/puzzle.jpg` (already set). Swap it for a
   different photo any time — if the file is ever missing, it falls back to
   a numbered puzzle (still fully playable) so nothing looks broken.
5. **The surprise page / memory lane** — open `surprise.html` and edit the
   message marked `<!-- EDIT ME -->`. Below the puzzle is a timeline of real
   events (place + date + photo + a short memory), one so far (Zele, 05/06).
   To add the next one, copy a whole `.timeline-item` block (see the HTML
   comment right above the timeline for the exact steps: alternate
   `side-left`/`side-right`, drop the photo in `assets/photos/surprise/`,
   update the `.timeline-date` place/date, and write the title + text).
6. **The throwback section** — a second timeline further down surprise.html
   for childhood photos with "POV: me when ..." captions. Drop photos into
   `assets/photos/surprise/` named `baby1.jpg` through `baby3.jpg`, and
   finish each meme's punchline in the `<p>` marked `<!-- EDIT ME -->`.

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
