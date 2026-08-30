#!/usr/bin/env python3
"""Generate a few alternative pastel-pink QR card styles, all matching the
site's current look (dashed pink borders, Dancing Script headings, the
21-candle cake, the memory-lane dashed timeline with its heart marker).

Usage:
    python3 scripts/generate_qr_options.py [URL] [output_dir]

If URL is omitted, defaults to the GitHub Pages URL for this repo.
If output_dir is omitted, writes into assets/ as qr-option-a/-b/-c.png.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_qr as base  # reuses heart_points, fit_font, make_qr, the bear/pin, etc.

from PIL import Image, ImageDraw, ImageFilter

PINK_100 = (255, 228, 238)
PINK_200 = (255, 209, 227)
PINK_300 = (255, 182, 213)
PINK_400 = (255, 157, 197)
PINK_500 = (247, 131, 172)
PINK_600 = (227, 93, 153)
PINK_DEEP = (214, 51, 108)
TEXT_DARK = (107, 58, 77)
WHITE = (255, 255, 255)


def draw_dashed_vline(draw, x, y0, y1, color, width, dash=14, gap=10):
    y = y0
    while y < y1:
        y_end = min(y + dash, y1)
        draw.line([(x, y), (x, y_end)], fill=color, width=width)
        y += dash + gap


def draw_card_base(w, h, radius):
    """White rounded card with a soft shadow and a dashed pink border, like .card/.note-card."""
    pad = int(w * 0.06)
    total_w, total_h = w + pad * 2, h + pad * 2
    canvas = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))

    shadow = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    off = int(w * 0.02)
    sd.rounded_rectangle([pad + off, pad + off * 1.6, pad + w + off, pad + h + off * 1.6],
                          radius=radius, fill=(214, 51, 108, 60))
    shadow = shadow.filter(ImageFilter.GaussianBlur(w * 0.015))
    canvas.alpha_composite(shadow)

    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([pad, pad, pad + w, pad + h], radius=radius, fill=WHITE)

    dash_r = max(2, int(w * 0.004))
    pts = []
    n = 200
    # sample the rounded-rect outline coarsely via straight edges (good enough at this radius)
    edges = [
        ((pad + radius, pad), (pad + w - radius, pad)),
        ((pad + w, pad + radius), (pad + w, pad + h - radius)),
        ((pad + w - radius, pad + h), (pad + radius, pad + h)),
        ((pad, pad + h - radius), (pad, pad + radius)),
    ]
    for (x0, y0), (x1, y1) in edges:
        steps = 40
        for i in range(steps):
            t = i / steps
            pts.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    for i in range(0, len(pts), 6):
        x, y = pts[i]
        d.ellipse([x - dash_r, y - dash_r, x + dash_r, y + dash_r], fill=PINK_200)

    return canvas, pad, d


def draw_mini_cake_with_candles(draw, cx, top_y, cake_w, n_candles=7):
    """A small decorative cake with a few lit candles, echoing the 21-candle section."""
    candle_h = cake_w * 0.09
    candle_w = cake_w * 0.018
    gap = cake_w * 0.02
    total_candles_w = n_candles * candle_w + (n_candles - 1) * gap
    start_x = cx - total_candles_w / 2
    for i in range(n_candles):
        x = start_x + i * (candle_w + gap)
        draw.rounded_rectangle([x, top_y, x + candle_w, top_y + candle_h], radius=candle_w * 0.3,
                                fill=PINK_DEEP)
        flame_w, flame_h = candle_w * 1.7, candle_w * 2.6
        fx, fy = x + candle_w / 2, top_y - flame_h * 0.6
        draw.ellipse([fx - flame_w / 2, fy - flame_h / 2, fx + flame_w / 2, fy + flame_h / 2],
                     fill=(255, 200, 90))

    layer2_top = top_y + candle_h
    layer2_h = cake_w * 0.14
    layer2_w = cake_w * 0.62
    draw.rounded_rectangle([cx - layer2_w / 2, layer2_top, cx + layer2_w / 2, layer2_top + layer2_h],
                            radius=cake_w * 0.03, fill=PINK_300)

    layer1_top = layer2_top + layer2_h - cake_w * 0.01
    layer1_h = cake_w * 0.17
    draw.rounded_rectangle([cx - cake_w / 2, layer1_top, cx + cake_w / 2, layer1_top + layer1_h],
                            radius=cake_w * 0.03, fill=PINK_400)
    return layer1_top + layer1_h


def build_option_a_polaroid(url, out_path):
    """Option A: the existing polaroid + clothespin + doodle hearts + peeking bear."""
    cw = base.CANVAS_W * base.SUPERSAMPLE
    ch = base.CANVAS_H * base.SUPERSAMPLE
    bg = base.draw_background(cw, ch)
    base.add_doodle_hearts(bg, cw, ch)

    layer = base.build_polaroid_layer(url, cw)
    layer = layer.rotate(-3, resample=Image.BICUBIC, expand=True)
    px = int((cw - layer.width) / 2)
    py = int(ch * 0.06)
    bg.paste(layer, (px, py), layer)

    draw = ImageDraw.Draw(bg)
    tagline = "hier is een toffe verrassing voor jou!!"
    tagline_y = py + layer.height + (ch - (py + layer.height)) * 0.42
    font, bbox = base.fit_font(draw, tagline, cw * 0.86, start_size=int(cw * 0.052), min_size=int(cw * 0.02))
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cw / 2 - tw / 2 - bbox[0], tagline_y - th / 2 - bbox[1]), tagline, font=font, fill=base.OUTLINE)

    final = bg.resize((base.CANVAS_W, base.CANVAS_H), Image.LANCZOS)
    final.save(out_path)
    print(f"Saved {out_path}")


def build_option_b_cake(url, out_path):
    """Option B: birthday cake + candles, matching the site's 21-candle section."""
    W = 1100
    SS = 2
    cw = W * SS

    card_w = int(cw * 0.82)
    header_h = int(cw * 0.30)
    qr_target = int(card_w * 0.62)
    plate_pad = int(qr_target * 0.09)
    plate_size = qr_target + plate_pad * 2
    caption_h = int(cw * 0.16)
    card_h = header_h + plate_size + caption_h + int(cw * 0.06)

    bg_h = int(card_h * 1.28)
    bg = Image.new("RGB", (cw, bg_h), PINK_100)
    bd = ImageDraw.Draw(bg)
    for y in range(bg_h):
        t = y / bg_h
        bd.line([(0, y), (cw, y)], fill=base.lerp_color(PINK_100, (255, 205, 224), t))

    # sparkle doodles
    import random as _r
    rnd = _r.Random(7)
    for _ in range(14):
        sx = rnd.uniform(cw * 0.03, cw * 0.97)
        sy = rnd.uniform(bg_h * 0.03, bg_h * 0.97)
        r = rnd.uniform(cw * 0.006, cw * 0.014)
        pts = [
            (sx, sy - r), (sx + r * 0.28, sy - r * 0.28), (sx + r, sy),
            (sx + r * 0.28, sy + r * 0.28), (sx, sy + r), (sx - r * 0.28, sy + r * 0.28),
            (sx - r, sy), (sx - r * 0.28, sy - r * 0.28),
        ]
        bd.polygon(pts, fill=(255, 255, 255, 220))

    card, pad, cdraw = draw_card_base(card_w, card_h, radius=int(cw * 0.045))
    card_x = (cw - card.width) // 2
    card_y = int(bg_h * 0.06)
    bg.paste(card, (card_x, card_y), card)
    draw = ImageDraw.Draw(bg)

    cake_cx = card_x + pad + card_w / 2
    cake_top_y = card_y + pad + int(header_h * 0.36)
    draw_mini_cake_with_candles(draw, cake_cx, cake_top_y, card_w * 0.5)

    heading = "maak een wensje..."
    font, bbox = base.fit_font(draw, heading, card_w * 0.86, start_size=int(cw * 0.05), min_size=int(cw * 0.025))
    tw = bbox[2] - bbox[0]
    heading_y = card_y + pad + int(header_h * 0.02)
    draw.text((cake_cx - tw / 2 - bbox[0], heading_y), heading, font=font, fill=PINK_DEEP)

    qr_img = base.make_qr(url, max(4, qr_target // 45)).resize((qr_target, qr_target), Image.NEAREST)
    plate_x = int(cake_cx - plate_size / 2)
    plate_y = card_y + pad + header_h
    plate = Image.new("RGB", (plate_size, plate_size), WHITE)
    pdraw = ImageDraw.Draw(plate)
    pr = int(plate_size * 0.08)
    pdraw.rounded_rectangle([0, 0, plate_size - 1, plate_size - 1], radius=pr, fill=WHITE)
    plate.paste(qr_img, (plate_pad, plate_pad))
    pmask = Image.new("L", (plate_size, plate_size), 0)
    ImageDraw.Draw(pmask).rounded_rectangle([0, 0, plate_size - 1, plate_size - 1], radius=pr, fill=255)
    bg.paste(plate, (plate_x, plate_y), pmask)
    draw.rounded_rectangle([plate_x, plate_y, plate_x + plate_size, plate_y + plate_size],
                            radius=pr, outline=PINK_DEEP, width=max(3, plate_size // 200))

    caption = "scan en blaas de kaarsjes uit :)"
    cfont, cbbox = base.fit_font(draw, caption, card_w * 0.86, start_size=int(cw * 0.04), min_size=int(cw * 0.02))
    ctw, cth = cbbox[2] - cbbox[0], cbbox[3] - cbbox[1]
    caption_y = plate_y + plate_size + int(cw * 0.025)
    draw.text((cake_cx - ctw / 2 - cbbox[0], caption_y), caption, font=cfont, fill=PINK_600)

    final = bg.resize((W, int(bg_h / SS)), Image.LANCZOS)
    final.save(out_path)
    print(f"Saved {out_path}")


def build_option_c_timeline(url, out_path):
    """Option C: the memory-lane dashed pink line ending in a heart, like the site's timeline."""
    W = 1100
    SS = 2
    cw = W * SS

    card_w = int(cw * 0.82)
    qr_target = int(card_w * 0.62)
    plate_pad = int(qr_target * 0.09)
    plate_size = qr_target + plate_pad * 2
    header_h = int(cw * 0.30)
    line_h = int(cw * 0.10)
    caption_h = int(cw * 0.14)
    card_h = header_h + line_h + plate_size + caption_h + int(cw * 0.04)

    bg_h = int(card_h * 1.26)
    bg = Image.new("RGB", (cw, bg_h), PINK_100)
    bd = ImageDraw.Draw(bg)
    for y in range(bg_h):
        t = y / bg_h
        bd.line([(0, y), (cw, y)], fill=base.lerp_color(PINK_100, (255, 205, 224), t))

    import random as _r
    rnd = _r.Random(21)
    for _ in range(12):
        sx = rnd.uniform(cw * 0.04, cw * 0.96)
        sy = rnd.uniform(bg_h * 0.03, bg_h * 0.97)
        sz = rnd.uniform(1.0, 2.2)
        pts = base.heart_points(sx, sy, sz, steps=60)
        bd.polygon(pts, fill=(255, 255, 255, 210))

    card, pad, cdraw = draw_card_base(card_w, card_h, radius=int(cw * 0.045))
    card_x = (cw - card.width) // 2
    card_y = int(bg_h * 0.06)
    bg.paste(card, (card_x, card_y), card)
    draw = ImageDraw.Draw(bg)

    center_x = card_x + pad + card_w / 2

    line1 = "Let's take a trip"
    line2 = "door onze herinneringen"
    f1, b1 = base.fit_font(draw, line1, card_w * 0.9, start_size=int(cw * 0.06), min_size=int(cw * 0.03))
    tw1 = b1[2] - b1[0]
    y1 = card_y + pad + int(header_h * 0.05)
    draw.text((center_x - tw1 / 2 - b1[0], y1), line1, font=f1, fill=PINK_DEEP)

    f2, b2 = base.fit_font(draw, line2, card_w * 0.9, start_size=int(cw * 0.036), min_size=int(cw * 0.02))
    tw2, th2 = b2[2] - b2[0], b2[3] - b2[1]
    y2 = y1 + (b1[3] - b1[1]) + int(cw * 0.01)
    draw.text((center_x - tw2 / 2 - b2[0], y2), line2, font=f2, fill=PINK_600)

    line_top = y2 + th2 + int(cw * 0.02)
    line_bottom = line_top + line_h
    draw_dashed_vline(draw, center_x, line_top, line_bottom, PINK_300, width=max(3, int(cw * 0.006)),
                       dash=int(cw * 0.012), gap=int(cw * 0.008))

    node_r = int(cw * 0.014)
    draw.ellipse([center_x - node_r, line_bottom - node_r, center_x + node_r, line_bottom + node_r],
                 fill=WHITE, outline=PINK_DEEP, width=max(3, int(cw * 0.005)))

    plate_x = int(center_x - plate_size / 2)
    plate_y = line_bottom + node_r
    qr_img = base.make_qr(url, max(4, qr_target // 45)).resize((qr_target, qr_target), Image.NEAREST)
    plate = Image.new("RGB", (plate_size, plate_size), WHITE)
    pr = int(plate_size * 0.08)
    ImageDraw.Draw(plate).rounded_rectangle([0, 0, plate_size - 1, plate_size - 1], radius=pr, fill=WHITE)
    plate.paste(qr_img, (plate_pad, plate_pad))
    pmask = Image.new("L", (plate_size, plate_size), 0)
    ImageDraw.Draw(pmask).rounded_rectangle([0, 0, plate_size - 1, plate_size - 1], radius=pr, fill=255)
    bg.paste(plate, (plate_x, plate_y), pmask)
    draw.rounded_rectangle([plate_x, plate_y, plate_x + plate_size, plate_y + plate_size],
                            radius=pr, outline=PINK_DEEP, width=max(3, plate_size // 200))

    heart_size = cw * 0.0022
    heart_cx, heart_cy = center_x, plate_y + plate_size + int(cw * 0.006)
    draw.polygon(base.heart_points(heart_cx, heart_cy, heart_size, steps=120), fill=PINK_DEEP)

    caption = "scan voor onze herinneringen :)"
    cfont, cbbox = base.fit_font(draw, caption, card_w * 0.86, start_size=int(cw * 0.04), min_size=int(cw * 0.02))
    ctw = cbbox[2] - cbbox[0]
    caption_y = heart_cy + int(cw * 0.03)
    draw.text((center_x - ctw / 2 - cbbox[0], caption_y), caption, font=cfont, fill=PINK_600)

    final = bg.resize((W, int(bg_h / SS)), Image.LANCZOS)
    final.save(out_path)
    print(f"Saved {out_path}")


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else base.DEFAULT_URL
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "assets"
    out_dir.mkdir(parents=True, exist_ok=True)

    build_option_a_polaroid(url, out_dir / "qr-option-a-polaroid.png")
    build_option_b_cake(url, out_dir / "qr-option-b-cake.png")
    build_option_c_timeline(url, out_dir / "qr-option-c-timeline.png")


if __name__ == "__main__":
    main()
