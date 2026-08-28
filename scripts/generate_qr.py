#!/usr/bin/env python3
"""Generate a pastel-pink, heart-framed QR code pointing at the birthday site.

Usage:
    python3 scripts/generate_qr.py [URL]

If URL is omitted, defaults to the GitHub Pages URL for this repo.
Output is written to assets/qr-code.png.
"""
import math
import sys
from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont

DEFAULT_URL = "https://azzexxy.github.io/liefje/"

# Deep-enough pink for reliable scanning, kept inside the pastel palette.
QR_FILL = (198, 40, 105)      # raspberry pink modules
QR_BACK = (255, 245, 248)     # near-white blush background
CARD_TOP = (255, 214, 231)    # pastel pink gradient top
CARD_BOTTOM = (247, 131, 172) # pastel pink gradient bottom
WHITE = (255, 255, 255)

CANVAS = 1400
SUPERSAMPLE = 2


def heart_path_points(cx, cy, size, steps=400):
    """Parametric heart curve, returns list of (x, y) points."""
    points = []
    for i in range(steps):
        t = (i / steps) * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        points.append((cx + x * size, cy - y * size))
    return points


def make_heart_card(canvas_size):
    img = Image.new("RGB", (canvas_size, canvas_size), WHITE)
    draw = ImageDraw.Draw(img)

    cx, cy = canvas_size / 2, canvas_size / 2 - canvas_size * 0.03
    scale = canvas_size / 34
    pts = heart_path_points(cx, cy, scale)

    # Gradient fill for the heart using a temporary mask.
    mask = Image.new("L", (canvas_size, canvas_size), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.polygon(pts, fill=255)

    gradient = Image.new("RGB", (canvas_size, canvas_size), CARD_BOTTOM)
    gdraw = ImageDraw.Draw(gradient)
    for y in range(canvas_size):
        t = y / canvas_size
        r = int(CARD_TOP[0] * (1 - t) + CARD_BOTTOM[0] * t)
        g = int(CARD_TOP[1] * (1 - t) + CARD_BOTTOM[1] * t)
        b = int(CARD_TOP[2] * (1 - t) + CARD_BOTTOM[2] * t)
        gdraw.line([(0, y), (canvas_size, y)], fill=(r, g, b))

    img.paste(gradient, (0, 0), mask)

    # soft outline
    outline_pts = heart_path_points(cx, cy, scale)
    draw.line(outline_pts + [outline_pts[0]], fill=(214, 51, 108, 180), width=max(2, canvas_size // 350), joint="curve")

    return img, mask, cx, cy


def make_qr(url, box_scale):
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_scale,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color=QR_FILL, back_color=QR_BACK).convert("RGB")


def add_decorative_hearts(img, cx, cy, heart_scale):
    draw = ImageDraw.Draw(img, "RGBA")
    small_hearts = [
        (cx - heart_scale * 13, cy - heart_scale * 11, 1.6, (255, 255, 255, 210)),
        (cx + heart_scale * 12, cy - heart_scale * 12, 1.2, (255, 255, 255, 190)),
        (cx - heart_scale * 10, cy + heart_scale * 15, 1.0, (255, 255, 255, 170)),
        (cx + heart_scale * 11, cy + heart_scale * 14, 1.3, (255, 255, 255, 170)),
    ]
    for hx, hy, s, color in small_hearts:
        pts = heart_path_points(hx, hy, s)
        draw.polygon(pts, fill=color)


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    canvas_size = CANVAS * SUPERSAMPLE

    card, mask, cx, cy = make_heart_card(canvas_size)
    add_decorative_hearts(card, cx, cy, canvas_size / 34)

    qr_target_size = int(canvas_size * 0.40)
    box_scale = max(4, qr_target_size // 45)
    qr_img = make_qr(url, box_scale)
    qr_img = qr_img.resize((qr_target_size, qr_target_size), Image.NEAREST)

    pad = int(qr_target_size * 0.09)
    plate_size = qr_target_size + pad * 2
    plate = Image.new("RGB", (plate_size, plate_size), WHITE)
    plate_draw = ImageDraw.Draw(plate)
    radius = int(plate_size * 0.08)
    plate_draw.rounded_rectangle([0, 0, plate_size - 1, plate_size - 1], radius=radius, fill=WHITE)
    plate.paste(qr_img, (pad, pad))

    plate_mask = Image.new("L", (plate_size, plate_size), 0)
    pmdraw = ImageDraw.Draw(plate_mask)
    pmdraw.rounded_rectangle([0, 0, plate_size - 1, plate_size - 1], radius=radius, fill=255)

    plate_x = int(cx - plate_size / 2)
    plate_y = int(cy - plate_size / 2 - canvas_size * 0.01)
    card.paste(plate, (plate_x, plate_y), plate_mask)

    # "Scan me" ribbon text near the bottom point of the heart
    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            int(canvas_size * 0.035),
        )
    except OSError:
        font = ImageFont.load_default()

    draw = ImageDraw.Draw(card)
    label = "SCAN ME"
    bbox = draw.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw / 2, plate_y + plate_size + canvas_size * 0.015), label,
               font=font, fill=(214, 51, 108, 255))

    final = card.resize((CANVAS, CANVAS), Image.LANCZOS)

    out_path = Path(__file__).resolve().parent.parent / "assets" / "qr-code.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.save(out_path)
    print(f"Saved {out_path} encoding: {url}")


if __name__ == "__main__":
    main()
