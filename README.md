# liefje 💕

A cute, pastel-pink birthday website in casual Flemish, all on one page
(`index.html`): a picture puzzle (the first thing she sees) → 21 birthday
candles to blow out → a personal note leading into a "memory lane" timeline
of real dates together, with a few childhood-photo stickers scattered
throughout.

## Personalize it

1. **The puzzle** — the very first thing on the page: a picture puzzle she
   has to solve before the rest unlocks, click any two tiles to swap them.
   The image is `assets/photos/puzzle.jpg` (already set). Swap it for a
   different photo any time — if the file is ever missing, it falls back to
   a numbered puzzle (still fully playable) so nothing looks broken.
2. **The 21 candles** — solving the puzzle reveals a cake with 21 lit
   candles (one per year). It takes 4 clicks on "Blaas de 21 kaarsjes uit"
   to blow them all out (the button text escalates each time — "Blaas nog
   eens", "Blaas harder", "Bijna..."), then it reveals the memory lane
   below.
3. **The personal note** — leads into the memory lane (appears together
   with it, once the candles are out). Edit the message in the `note-text`
   card to whatever you want it to say.
4. **The memory lane** — a timeline of real events in chronological order
   (place + date + photo(s) + title): Daknam (22/05), Zele (05/06), Gent
   (28/06), Knokke (03/07), Mundaka (13/07), Sopela Beach (14/07),
   Guggenheim Bilbao (17/07), Biarritz & La Rochelle (18/07), and Monet's
   Garden in Giverny (20/07). An event with more than one photo wraps its
   `<figure>`s in a `.timeline-photo-group` so they stack together on one
   side. To add a new event, copy a whole `.timeline-item` block (see the
   HTML comment right above the timeline for the exact steps: alternate
   `side-left`/`side-right`, drop the photo(s) in `assets/photos/surprise/`,
   and update the place/date spans in `.timeline-date`).
5. **Scattered childhood photos** — 3 childhood photos are tucked in as
   small "POV: me when ..." stickers at different points down the page,
   each already using a real photo (`assets/photos/surprise/baby1.jpg`–
   `baby3.jpg`). Search for `.mini-throwback` to find and edit them.

There's no PIN/passcode on the site — anyone with the link can open it.

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
