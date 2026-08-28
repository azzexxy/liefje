# liefje 💕

A cute, pastel-pink birthday website in casual Flemish — with a QR code
styled as a polaroid photo (complete with a clothespin, doodle hearts, and a
peeking teddy bear) so she can scan it and open the page straight from her
phone.

## Personalize it

1. **Her name & message** — open `index.html` and edit the sections marked
   `<!-- EDIT ME -->` (the hero title and the love note).
2. **Reasons you love her** — edit the cards in the "Een paar redenen waarom
   ik je graag zie" section.
3. **Photos** — drop images into `assets/photos/` named `photo1.jpg`,
   `photo2.jpg`, `photo3.jpg` (or update the `src` attributes in `index.html`
   to match your filenames). Until you add photos, those spots show a cute
   placeholder.

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
"scan voor een leuke surprise :)". It's already embedded at the bottom of the
page under "Deel de liefde", so you can screenshot it, print it, or share it
directly.

If you host the site somewhere other than the default GitHub Pages URL,
regenerate the QR code with the real URL:

```bash
pip install qrcode pillow
python3 scripts/generate_qr.py https://your-real-url-here/
```

This overwrites `assets/qr-code.png` with a fresh polaroid-style QR card
pointing at the new address.
