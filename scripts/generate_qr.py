#!/usr/bin/env python3
"""Generate a cute pastel-pink "polaroid" QR code card pointing at the birthday site.

Style: soft pink background with hand-drawn heart doodles, a white polaroid
photo pinned with a little clothespin, a peeking teddy bear, and the QR code
with a handwritten caption underneath.

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
TAGLINE = "hier is een toffe verrassing voor jou!!"

# Deep-enough pink for reliable scanning, kept inside the pastel palette.
QR_FILL = (198, 40, 105)      # raspberry pink modules
QR_BACK = (255, 245, 248)     # near-white blush background

BG_TOP = (255, 220, 234)
BG_BOTTOM = (255, 197, 218)
DOODLE = (224, 120, 152, 150)
OUTLINE = (216, 60, 116)
WHITE = (255, 255, 255)
SHADOW = (214, 51, 108, 70)

BEAR_FUR = (233, 196, 163)
BEAR_FUR_DARK = (210, 165, 128)
BEAR_BLUSH = (255, 170, 190, 140)
PIN_WOOD = (240, 205, 170)
PIN_WOOD_DARK = (205, 160, 120)

CANVAS_W = 1180
CANVAS_H = 2000
SUPERSAMPLE = 2

FONT_DIR = Path(__file__).resolve().parent / "fonts"
SCRIPT_FONT = FONT_DIR / "DancingScript-Bold.ttf"

random.seed(11)


def heart_points(cx, cy, size, steps=200, jitter=0.0, seed_offset=0):
    """Parametric heart curve. `size` is a small unit (~1-20) — NOT a pixel size."""
    points = []
    rnd = random.Random(seed_offset)
    for i in range(steps):
        t = (i / steps) * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        if jitter:
            x += rnd.uniform(-jitter, jitter)
            y += rnd.uniform(-jitter, jitter)
        points.append((cx + x * size, cy - y * size))
    return points


def rotate_points(points, cx, cy, degrees):
    a = math.radians(degrees)
    ca, sa = math.cos(a), math.sin(a)
    out = []
    for x, y in points:
        dx, dy = x - cx, y - cy
        out.append((cx + dx * ca - dy * sa, cy + dx * sa + dy * ca))
    return out


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))


def draw_background(canvas_size_w, canvas_size_h):
    img = Image.new("RGB", (canvas_size_w, canvas_size_h), BG_BOTTOM)
    draw = ImageDraw.Draw(img)
    for y in range(canvas_size_h):
        t = y / canvas_size_h
        draw.line([(0, y), (canvas_size_w, y)], fill=lerp_color(BG_TOP, BG_BOTTOM, t))
    return img


def add_doodle_hearts(img, canvas_w, canvas_h):
    # heart_points' size unit gives a half-width of size*16 px, so divide the
    # desired pixel half-width by 16 to get the size argument.
    overlay = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    rnd = random.Random(42)
    n = 16
    for i in range(n):
        cx = rnd.uniform(canvas_w * 0.05, canvas_w * 0.95)
        cy = rnd.uniform(canvas_h * 0.04, canvas_h * 0.96)
        half_width_px = rnd.uniform(canvas_w * 0.03, canvas_w * 0.075)
        size = half_width_px / 16
        angle = rnd.uniform(-25, 25)
        pts = heart_points(0, 0, size, steps=200)
        pts = rotate_points(pts, 0, 0, angle)
        pts = [(cx + x, cy + y) for x, y in pts]
        width = max(2, int(canvas_w * 0.0035))
        draw.line(pts + [pts[0]], fill=DOODLE, width=width, joint="curve")
    img.paste(overlay, (0, 0), overlay)


def draw_bear(draw, cx, cy, r):
    """Simple flat teddy-bear head, peeking, drawn with (cx, cy) as head center."""
    ear_r = r * 0.42
    ear_off_x = r * 0.72
    ear_off_y = r * 0.68
    for sign in (-1, 1):
        ex, ey = cx + sign * ear_off_x, cy - ear_off_y
        draw.ellipse([ex - ear_r, ey - ear_r, ex + ear_r, ey + ear_r], fill=BEAR_FUR)
        inner_r = ear_r * 0.55
        draw.ellipse([ex - inner_r, ey - inner_r, ex + inner_r, ey + inner_r], fill=BEAR_FUR_DARK)

    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BEAR_FUR)

    # muzzle
    muzzle_w, muzzle_h = r * 0.62, r * 0.46
    draw.ellipse([cx - muzzle_w / 2, cy + r * 0.08, cx + muzzle_w / 2, cy + r * 0.08 + muzzle_h],
                 fill=(250, 240, 230))

    # eyes
    eye_r = r * 0.06
    eye_y = cy - r * 0.02
    for sign in (-1, 1):
        ex = cx + sign * r * 0.28
        draw.ellipse([ex - eye_r, eye_y - eye_r, ex + eye_r, eye_y + eye_r], fill=(80, 55, 45))

    # blush cheeks, just outside the muzzle at eye level
    blush_r = r * 0.15
    blush_y = eye_y + r * 0.12
    draw.ellipse([cx - r * 0.55 - blush_r, blush_y - blush_r,
                  cx - r * 0.55 + blush_r, blush_y + blush_r], fill=BEAR_BLUSH)
    draw.ellipse([cx + r * 0.55 - blush_r, blush_y - blush_r,
                  cx + r * 0.55 + blush_r, blush_y + blush_r], fill=BEAR_BLUSH)

    # nose
    nose_r = r * 0.09
    nose_y = cy + r * 0.22
    draw.ellipse([cx - nose_r, nose_y - nose_r * 0.8, cx + nose_r, nose_y + nose_r * 0.8],
                 fill=(120, 80, 65))


def draw_clothespin(draw, cx, top_y, width, height):
    """A little wooden clothespin straddling the top edge of the polaroid."""
    x0, x1 = cx - width / 2, cx + width / 2
    y0, y1 = top_y, top_y + height
    radius = width * 0.28
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=PIN_WOOD, outline=PIN_WOOD_DARK,
                            width=max(2, int(width * 0.05)))
    # metal spring band
    band_y = top_y + height * 0.42
    draw.rectangle([x0 + width * 0.08, band_y, x1 - width * 0.08, band_y + height * 0.09],
                    fill=PIN_WOOD_DARK)
    # gap between the two legs
    draw.line([(cx, band_y + height * 0.09), (cx, y1 - height * 0.05)],
               fill=PIN_WOOD_DARK, width=max(2, int(width * 0.06)))


def fit_font(draw, text, max_width, start_size, min_size):
    font_size = start_size
    font = None
    while font_size > min_size:
        font = ImageFont.truetype(str(SCRIPT_FONT), font_size)
        font.set_variation_by_axes([700])
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= max_width:
            return font, bbox
        font_size = int(font_size * 0.94)
    return font, draw.textbbox((0, 0), text, font=font)


def make_qr(url, box_scale):
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_scale,
        border=3,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color=QR_FILL, back_color=QR_BACK).convert("RGB")


def build_polaroid_layer(url, canvas_w):
    polaroid_w = canvas_w * 0.72
    side_margin = polaroid_w * 0.045
    top_margin = side_margin
    photo_size = polaroid_w - 2 * side_margin
    bottom_margin = polaroid_w * 0.34
    polaroid_h = top_margin + photo_size + bottom_margin

    pad_left = polaroid_w * 0.06
    pad_right_bear = polaroid_w * 0.30
    pad_top_pin = polaroid_w * 0.16
    pad_bottom = polaroid_w * 0.05

    layer_w = int(polaroid_w + pad_left + pad_right_bear)
    layer_h = int(polaroid_h + pad_top_pin + pad_bottom)
    layer = Image.new("RGBA", (layer_w, layer_h), (0, 0, 0, 0))

    polaroid_x = pad_left
    polaroid_y = pad_top_pin

    # --- bear peeking from behind the top-right corner ---
    bear_r = photo_size * 0.20
    bear_cx = polaroid_x + polaroid_w - photo_size * 0.02
    bear_cy = polaroid_y + photo_size * 0.06
    draw = ImageDraw.Draw(layer)
    draw_bear(draw, bear_cx, bear_cy, bear_r)

    # --- drop shadow for the polaroid ---
    shadow_layer = Image.new("RGBA", (layer_w, layer_h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow_layer)
    off = polaroid_w * 0.015
    sdraw.rectangle([polaroid_x + off, polaroid_y + off * 1.6,
                      polaroid_x + polaroid_w + off, polaroid_y + polaroid_h + off * 1.6],
                     fill=SHADOW)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(polaroid_w * 0.018))
    layer.alpha_composite(shadow_layer)

    # --- white polaroid card ---
    draw.rectangle([polaroid_x, polaroid_y, polaroid_x + polaroid_w, polaroid_y + polaroid_h],
                    fill=WHITE)

    # --- QR code inside the photo area ---
    qr_target = int(photo_size * 0.86)
    box_scale = max(4, qr_target // 45)
    qr_img = make_qr(url, box_scale).resize((qr_target, qr_target), Image.NEAREST)
    qr_x = int(polaroid_x + (polaroid_w - qr_target) / 2)
    qr_y = int(polaroid_y + top_margin + (photo_size - qr_target) / 2)
    layer.paste(qr_img, (qr_x, qr_y))
    draw.rectangle([qr_x, qr_y, qr_x + qr_target, qr_y + qr_target], outline=(230, 200, 212), width=2)

    # --- caption in the polaroid's bottom margin ---
    caption_cx = polaroid_x + polaroid_w / 2
    caption_area_top = polaroid_y + top_margin + photo_size
    font, bbox = fit_font(draw, CAPTION, polaroid_w * 0.86,
                           start_size=int(bottom_margin * 0.34), min_size=int(bottom_margin * 0.14))
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    text_y = caption_area_top + (bottom_margin - th) / 2 - bbox[1]
    draw.text((caption_cx - tw / 2 - bbox[0], text_y), CAPTION, font=font, fill=OUTLINE)

    # small heart accents flanking the caption (heart_points size unit: half-width = size*16px)
    flank_size = (polaroid_w * 0.022) / 16
    heart_y = text_y + bbox[1] + th * 0.5
    draw.polygon(heart_points(caption_cx - tw / 2 - polaroid_w * 0.05, heart_y, flank_size), fill=OUTLINE)
    draw.polygon(heart_points(caption_cx + tw / 2 + polaroid_w * 0.05, heart_y, flank_size), fill=OUTLINE)

    # --- clothespin straddling the top edge ---
    pin_w = polaroid_w * 0.13
    pin_h = pad_top_pin * 0.82
    draw_clothespin(draw, polaroid_x + polaroid_w / 2, polaroid_y - pin_h * 0.62, pin_w, pin_h)

    return layer


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    cw = CANVAS_W * SUPERSAMPLE
    ch = CANVAS_H * SUPERSAMPLE

    bg = draw_background(cw, ch)
    add_doodle_hearts(bg, cw, ch)

    polaroid_layer = build_polaroid_layer(url, cw)
    polaroid_layer = polaroid_layer.rotate(-3, resample=Image.BICUBIC, expand=True)

    px = int((cw - polaroid_layer.width) / 2)
    py = int(ch * 0.06)
    bg.paste(polaroid_layer, (px, py), polaroid_layer)

    draw = ImageDraw.Draw(bg)
    tagline_y_center = py + polaroid_layer.height + (ch - (py + polaroid_layer.height)) * 0.42
    font, bbox = fit_font(draw, TAGLINE, cw * 0.86, start_size=int(cw * 0.052), min_size=int(cw * 0.02))
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cw / 2 - tw / 2 - bbox[0], tagline_y_center - th / 2 - bbox[1]), TAGLINE, font=font, fill=OUTLINE)

    final = bg.resize((CANVAS_W, CANVAS_H), Image.LANCZOS)

    out_path = Path(__file__).resolve().parent.parent / "assets" / "qr-code.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path)
    print(f"Saved {out_path} encoding: {url}")


if __name__ == "__main__":
    main()
