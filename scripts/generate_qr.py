#!/usr/bin/env python3
"""Generate a cute, pastel-pink, heart-framed QR code pointing at the birthday site.

Usage:
    python3 scripts/generate_qr.py [URL]

If URL is omitted, defaults to the GitHub Pages URL for this repo.
Output is written to assets/qr-code.png.
"""
import math
import random
import sys
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFilter, ImageFont

DEFAULT_URL = "https://azzexxy.github.io/liefje/"
CAPTION = "scan voor een leuke surprise :)"

# Deep-enough pink for reliable scanning, kept inside the pastel palette.
QR_FILL = (198, 40, 105)      # raspberry pink modules
QR_BACK = (255, 245, 248)     # near-white blush background
CARD_TOP = (255, 223, 235)    # pastel pink gradient top
CARD_MID = (255, 173, 206)    # bubblegum pink gradient middle
CARD_BOTTOM = (240, 110, 160) # deeper pink gradient bottom
OUTLINE = (216, 60, 116)
WHITE = (255, 255, 255)
PAGE_BG = (255, 248, 251)     # soft blush white behind the whole card

HEART_CANVAS = 1400   # square area the heart itself occupies
CAPTION_STRIP = 230   # extra height below the heart for the caption
SUPERSAMPLE = 2

FONT_DIR = Path(__file__).resolve().parent / "fonts"
SCRIPT_FONT = FONT_DIR / "DancingScript-Bold.ttf"

random.seed(7)  # stable, repeatable sparkle placement


def heart_points(cx, cy, size, steps=400):
    """Parametric heart curve. `size` is a small unit (~1-20 typical) — NOT a pixel size."""
    points = []
    for i in range(steps):
        t = (i / steps) * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        points.append((cx + x * size, cy - y * size))
    return points


def star_points(cx, cy, r_outer, r_inner=None, points=5, rotation=0):
    r_inner = r_inner or r_outer * 0.42
    pts = []
    step = math.pi / points
    for i in range(points * 2):
        r = r_outer if i % 2 == 0 else r_inner
        a = i * step - math.pi / 2 + rotation
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))


def make_heart_card(canvas_size):
    """Returns (RGBA heart image, cx, cy, scale) where `scale` converts the
    heart curve's natural units (~±16 across) into pixels for this canvas."""
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))

    cx, cy = canvas_size / 2, canvas_size / 2 - canvas_size * 0.03
    scale = canvas_size / 34
    pts = heart_points(cx, cy, scale)

    # --- soft drop shadow behind the heart ---
    shadow = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    shadow_pts = heart_points(cx, cy + canvas_size * 0.018, scale * 1.01)
    sdraw.polygon(shadow_pts, fill=(214, 51, 108, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(canvas_size * 0.02))
    img.alpha_composite(shadow)

    # --- gradient fill (3-stop, top->bottom), with a soft gloss blended in ---
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.polygon(pts, fill=255)

    gradient = Image.new("RGB", (canvas_size, canvas_size), CARD_BOTTOM)
    gdraw = ImageDraw.Draw(gradient)
    for y in range(canvas_size):
        t = y / canvas_size
        if t < 0.5:
            color = lerp_color(CARD_TOP, CARD_MID, t / 0.5)
        else:
            color = lerp_color(CARD_MID, CARD_BOTTOM, (t - 0.5) / 0.5)
        gdraw.line([(0, y), (canvas_size, y)], fill=color)

    gloss_mask = Image.new("L", (canvas_size, canvas_size), 0)
    gmdraw = ImageDraw.Draw(gloss_mask)
    gloss_cx, gloss_cy = cx - scale * 5.5, cy - scale * 8
    gmdraw.ellipse(
        [gloss_cx - scale * 5.5, gloss_cy - scale * 3.2, gloss_cx + scale * 5.5, gloss_cy + scale * 3.2],
        fill=110,
    )
    gloss_mask = gloss_mask.filter(ImageFilter.GaussianBlur(canvas_size * 0.02))
    white_layer = Image.new("RGB", (canvas_size, canvas_size), WHITE)
    gradient.paste(white_layer, (0, 0), gloss_mask)

    heart_layer = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    heart_layer.paste(gradient, (0, 0), mask)
    img.alpha_composite(heart_layer)

    draw = ImageDraw.Draw(img)

    # --- dotted "stitched plush toy" border, just inside the heart edge ---
    dot_r = canvas_size * 0.0055
    inset_pts = heart_points(cx, cy, scale * 0.965)
    for i in range(0, len(inset_pts), 7):
        x, y = inset_pts[i]
        draw.ellipse([x - dot_r, y - dot_r, x + dot_r, y + dot_r], fill=(255, 255, 255, 130))

    # --- solid outline ---
    draw.line(pts + [pts[0]], fill=OUTLINE, width=max(3, canvas_size // 300), joint="curve")

    return img, cx, cy, scale


def add_bow(img, cx, cy, scale):
    """Little ribbon bow sitting just above the heart's top cleft."""
    draw = ImageDraw.Draw(img, "RGBA")
    bow_cy = cy - scale * 11.6
    knot_r = scale * 0.7
    ribbon = CARD_MID + (255,)
    outline = OUTLINE + (255,)

    # left loop
    left = [
        (cx - knot_r * 0.3, bow_cy),
        (cx - scale * 2.6, bow_cy - scale * 1.3),
        (cx - scale * 2.8, bow_cy + scale * 0.9),
    ]
    draw.polygon(left, fill=ribbon, outline=outline)
    # right loop
    right = [
        (cx + knot_r * 0.3, bow_cy),
        (cx + scale * 2.6, bow_cy - scale * 1.3),
        (cx + scale * 2.8, bow_cy + scale * 0.9),
    ]
    draw.polygon(right, fill=ribbon, outline=outline)
    # tails
    draw.polygon(
        [(cx - knot_r * 0.15, bow_cy + scale * 0.25),
         (cx - scale * 1.15, bow_cy + scale * 2.0),
         (cx - scale * 0.45, bow_cy + scale * 1.75)],
        fill=ribbon, outline=outline,
    )
    draw.polygon(
        [(cx + knot_r * 0.15, bow_cy + scale * 0.25),
         (cx + scale * 1.15, bow_cy + scale * 2.0),
         (cx + scale * 0.45, bow_cy + scale * 1.75)],
        fill=ribbon, outline=outline,
    )
    # knot
    draw.ellipse(
        [cx - knot_r, bow_cy - knot_r * 0.75, cx + knot_r, bow_cy + knot_r * 0.75],
        fill=ribbon, outline=outline,
    )
    # tiny shine dot for a glossy touch
    draw.ellipse(
        [cx - knot_r * 0.4, bow_cy - knot_r * 0.45, cx, bow_cy - knot_r * 0.05],
        fill=(255, 255, 255, 200),
    )


def add_decorations(img, cx, cy, scale, canvas_size):
    draw = ImageDraw.Draw(img, "RGBA")

    small_hearts = [
        (cx - scale * 13.5, cy - scale * 10.5, 1.7, (255, 255, 255, 220)),
        (cx + scale * 13, cy - scale * 11.5, 1.3, (255, 255, 255, 200)),
        (cx - scale * 11.5, cy + scale * 15.5, 1.1, (255, 255, 255, 190)),
        (cx + scale * 12, cy + scale * 14.5, 1.4, (255, 255, 255, 190)),
        (cx - scale * 6, cy - scale * 15, 0.8, (255, 255, 255, 170)),
        (cx + scale * 6.5, cy - scale * 14.5, 0.6, (255, 255, 255, 160)),
    ]
    for hx, hy, s, color in small_hearts:
        pts = heart_points(hx, hy, s)
        draw.polygon(pts, fill=color)

    # twinkly little 4-point sparkles scattered around
    sparkle_spots = [
        (cx - scale * 9, cy - scale * 4, 0.55),
        (cx + scale * 10, cy - scale * 1, 0.45),
        (cx - scale * 12, cy + scale * 6, 0.4),
        (cx + scale * 11.5, cy + scale * 7, 0.5),
        (cx - scale * 3, cy + scale * 19, 0.35),
        (cx + scale * 3.5, cy + scale * 18.5, 0.3),
    ]
    for sx, sy, s in sparkle_spots:
        r = scale * s
        draw.polygon(star_points(sx, sy, r, r * 0.28, points=4), fill=(255, 255, 255, 235))

    # tiny orbiting dots for extra sparkle dust
    for _ in range(14):
        angle = random.uniform(0, 2 * math.pi)
        dist = random.uniform(scale * 13.5, scale * 16.5)
        dx, dy = cx + math.cos(angle) * dist, cy + math.sin(angle) * dist * 0.9
        if dy > cy + scale * 17.5:
            continue
        r = random.uniform(canvas_size * 0.0025, canvas_size * 0.006)
        draw.ellipse([dx - r, dy - r, dx + r, dy + r], fill=(255, 255, 255, random.randint(120, 210)))


def make_qr(url, box_scale):
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_scale,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color=QR_FILL, back_color=QR_BACK).convert("RGB")


def add_plate_corner_hearts(img, plate_x, plate_y, plate_size):
    """Tiny heart accents at the corners of the white QR plate.

    `heart_points`'s size unit is small (a value of ~3 gives a heart roughly
    plate_size * 0.07 wide) — do not scale this by canvas_size or it balloons.
    """
    draw = ImageDraw.Draw(img, "RGBA")
    corner_offset = plate_size * 0.06
    corner_heart_size = 2.2
    corners = [
        (plate_x - corner_offset, plate_y - corner_offset),
        (plate_x + plate_size + corner_offset, plate_y - corner_offset),
        (plate_x - corner_offset, plate_y + plate_size + corner_offset),
        (plate_x + plate_size + corner_offset, plate_y + plate_size + corner_offset),
    ]
    for hx, hy in corners:
        pts = heart_points(hx, hy, corner_heart_size, steps=60)
        draw.polygon(pts, fill=(214, 51, 108, 255))


def build_card(canvas_size, url):
    card, cx, cy, scale = make_heart_card(canvas_size)
    add_decorations(card, cx, cy, scale, canvas_size)
    add_bow(card, cx, cy, scale)

    qr_target_size = int(canvas_size * 0.38)
    box_scale = max(4, qr_target_size // 45)
    qr_img = make_qr(url, box_scale)
    qr_img = qr_img.resize((qr_target_size, qr_target_size), Image.NEAREST)

    pad = int(qr_target_size * 0.09)
    plate_size = qr_target_size + pad * 2
    plate = Image.new("RGB", (plate_size, plate_size), WHITE)
    plate_draw = ImageDraw.Draw(plate)
    radius = int(plate_size * 0.1)
    plate_draw.rounded_rectangle([0, 0, plate_size - 1, plate_size - 1], radius=radius, fill=WHITE)
    plate.paste(qr_img, (pad, pad))

    plate_mask = Image.new("L", (plate_size, plate_size), 0)
    pmdraw = ImageDraw.Draw(plate_mask)
    pmdraw.rounded_rectangle([0, 0, plate_size - 1, plate_size - 1], radius=radius, fill=255)

    plate_x = int(cx - plate_size / 2)
    plate_y = int(cy - plate_size / 2 - canvas_size * 0.03)

    add_plate_corner_hearts(card, plate_x, plate_y, plate_size)

    # dotted pink border around the white plate
    border_draw = ImageDraw.Draw(card, "RGBA")
    rect = [plate_x - 6, plate_y - 6, plate_x + plate_size + 6, plate_y + plate_size + 6]
    border_draw.rounded_rectangle(rect, radius=radius, outline=OUTLINE + (255,), width=max(3, plate_size // 220))

    card.paste(plate, (plate_x, plate_y), plate_mask)

    return card, cx, plate_y + plate_size


def fit_caption_font(draw, text, max_width, start_size, min_size):
    font_size = start_size
    font = None
    while font_size > min_size:
        font = ImageFont.truetype(str(SCRIPT_FONT), font_size)
        font.set_variation_by_axes([700])
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= max_width:
            return font, bbox
        font_size = int(font_size * 0.93)
    return font, draw.textbbox((0, 0), text, font=font)


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    heart_size = HEART_CANVAS * SUPERSAMPLE
    strip_h = CAPTION_STRIP * SUPERSAMPLE
    final_w, final_h = heart_size, heart_size + strip_h

    card, cx, plate_bottom_y = build_card(heart_size, url)

    page = Image.new("RGB", (final_w, final_h), PAGE_BG)
    page.paste(card, (0, 0), card)

    draw = ImageDraw.Draw(page)
    max_text_width = final_w * 0.86
    font, bbox = fit_caption_font(
        draw, CAPTION, max_text_width,
        start_size=int(strip_h * 0.34), min_size=int(strip_h * 0.12),
    )
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    text_y = heart_size + (strip_h - th) / 2 - bbox[1] - strip_h * 0.08
    draw.text((cx - tw / 2 - bbox[0], text_y), CAPTION, font=font, fill=OUTLINE)

    flank_size = 1.6
    heart_y = text_y + bbox[1] + th * 0.5
    draw.polygon(heart_points(cx - tw / 2 - final_w * 0.05, heart_y, flank_size), fill=OUTLINE)
    draw.polygon(heart_points(cx + tw / 2 + final_w * 0.05, heart_y, flank_size), fill=OUTLINE)

    final = page.resize((HEART_CANVAS, HEART_CANVAS + CAPTION_STRIP), Image.LANCZOS)

    out_path = Path(__file__).resolve().parent.parent / "assets" / "qr-code.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path)
    print(f"Saved {out_path} encoding: {url}")


if __name__ == "__main__":
    main()
