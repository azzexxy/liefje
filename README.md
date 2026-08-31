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
4. **The memory lane** — a timeline of real events in chronological order:
   Daknam (22/05), Zele (05/06), Gent (28/06), Knokke (03/07), Mundaka
   (13/07), Sopela Beach (14/07), Guggenheim Bilbao (17/07), Biarritz & La
   Rochelle (18/07), and Monet's Garden in Giverny (20/07). Every event —
   these included — lives entirely in `assets/data/memories.json`, not in
   `index.html`; `js/script.js` fetches it, builds the timeline, sorts every
   entry by date, and recomputes left/right alternation automatically, so
   an event slots into the right spot regardless of where it's added from.
   Each entry looks like:
   ```json
   {
     "id": "gent",
     "title": "de surprise cinemadate was zo gezellig met jou & ...",
     "place": "Gent",
     "date": "28/06",
     "photos": ["assets/photos/surprise/gent-1.jpg", "assets/photos/surprise/gent-2.jpg"],
     "photoAlts": ["IJsje in Gent", "Openluchtbioscoop in Gent"]
   }
   ```
   `photos` with more than one entry automatically stack together on one
   side; `photoAlts` is optional (falls back to using the title as alt text
   for every photo); a `photos` entry can be a short video instead of an
   image (any video uploaded through the live tools is automatically cut
   down to its first 3 seconds before it's saved — see `server/src/video.js`).
   Add/edit/remove events either through the ⚙️ tools on the live site (see
   below), or by editing this JSON file directly and pushing.
5. **Childhood photos** — 3 childhood photos sit in a row of small
   "POV: me when ..." stickers between the candles and the memory lane,
   each already using a real photo (`assets/photos/surprise/baby1.jpg`–
   `baby3.jpg`). Search for `.mini-throwback-row` to find and edit them.
6. **Every other bit of text** — headings, the personal note, the mini
   throwback captions, the footer, the "21" cake topper, the candle-blow
   button's label, and the two wish-completion messages — has a small ✏️
   (edit) and 🗑️ (delete) that appear on hover (always visible on touch
   devices). Edits are saved to `assets/data/site-text.json` (sparse —
   only ever stores what's actually been changed; anything not in there
   just uses the text already written into `index.html`). Deleting a piece
   of text removes it from the page entirely — same idea as deleting a
   memory — and is stored there as an explicit `null`, so it stays gone
   rather than falling back to the original wording.

There's no PIN/passcode on the site — anyone with the link can open it.

7. **Adding memories live** — a small ⚙️ at the top of the memory lane
   section opens a login popup (accounts are set up in the backend, see
   [`server/README.md`](server/README.md)); once logged in, a permanent
   "add a memory" card at the end of the timeline lets either of you fill
   in a photo, place, date and description and have it committed straight
   to this repo, landing in its correct chronological spot immediately.
8. **Enlarging photos** — clicking any memory photo opens it full-size in a
   lightbox; if that memory has more than one photo (or a video), prev/next
   arrows, the arrow keys, or a swipe let you step through them one by one.

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
