#!/usr/bin/env python3
"""Generates two small circular avatar PNGs for the memory-lane "added by" badges:
a cute princess-themed one for Charlotte, a plain normal one for Lothar.
Usage: python3 scripts/generate_avatars.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

SIZE = 256
SUPERSAMPLE = 2
CANVAS = SIZE * SUPERSAMPLE

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIRS = [REPO_ROOT / "assets" / "avatars", REPO_ROOT / "server" / "public" / "avatars"]

SKIN = (255, 224, 196)
BLUSH = (255, 158, 176)
EYE = (90, 59, 71)


def circle_mask(size):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    return mask


def draw_face(draw, cx, cy, face_r):
    draw.ellipse([cx - face_r, cy - face_r, cx + face_r, cy + face_r], fill=SKIN)
    # blush
    blush_r = face_r * 0.16
    for dx in (-face_r * 0.52, face_r * 0.52):
        bx, by = cx + dx, cy + face_r * 0.18
        draw.ellipse([bx - blush_r, by - blush_r, bx + blush_r, by + blush_r], fill=BLUSH)
    # eyes
    eye_r = face_r * 0.07
    for dx in (-face_r * 0.32, face_r * 0.32):
        ex, ey = cx + dx, cy - face_r * 0.05
        draw.ellipse([ex - eye_r, ey - eye_r, ex + eye_r, ey + eye_r], fill=EYE)
    # smile
    sw = face_r * 0.5
    draw.arc(
        [cx - sw / 2, cy + face_r * 0.05, cx + sw / 2, cy + face_r * 0.5],
        start=20,
        end=160,
        fill=EYE,
        width=max(2, int(face_r * 0.045)),
    )


def sparkle(draw, cx, cy, r, color):
    draw.polygon(
        [
            (cx, cy - r), (cx + r * 0.22, cy - r * 0.22),
            (cx + r, cy), (cx + r * 0.22, cy + r * 0.22),
            (cx, cy + r), (cx - r * 0.22, cy + r * 0.22),
            (cx - r, cy), (cx - r * 0.22, cy - r * 0.22),
        ],
        fill=color,
    )


def build_princess():
    img = Image.new("RGB", (CANVAS, CANVAS), (255, 214, 232))
    draw = ImageDraw.Draw(img)
    cx, cy = CANVAS // 2, CANVAS // 2 + int(CANVAS * 0.04)
    face_r = CANVAS * 0.30

    # flowing hair behind the face
    hair_color = (120, 74, 56)
    draw.ellipse(
        [cx - face_r * 1.35, cy - face_r * 1.05, cx + face_r * 1.35, cy + face_r * 1.55],
        fill=hair_color,
    )
    draw_face(draw, cx, cy, face_r)
    # hair fringe across the forehead
    draw.pieslice(
        [cx - face_r * 1.05, cy - face_r * 1.25, cx + face_r * 1.05, cy + face_r * 0.35],
        180, 360, fill=hair_color,
    )

    # crown
    crown_w = face_r * 1.35
    crown_h = face_r * 0.62
    top_y = cy - face_r * 1.18
    base_y = top_y + crown_h
    gold = (245, 197, 91)
    gold_dark = (214, 160, 45)
    points = [
        (cx - crown_w / 2, base_y),
        (cx - crown_w / 2, base_y - crown_h * 0.35),
        (cx - crown_w * 0.28, base_y - crown_h * 0.75),
        (cx - crown_w * 0.10, base_y - crown_h * 0.35),
        (cx, base_y - crown_h),
        (cx + crown_w * 0.10, base_y - crown_h * 0.35),
        (cx + crown_w * 0.28, base_y - crown_h * 0.75),
        (cx + crown_w / 2, base_y - crown_h * 0.35),
        (cx + crown_w / 2, base_y),
    ]
    draw.polygon(points, fill=gold, outline=gold_dark)
    draw.rectangle([cx - crown_w / 2, base_y, cx + crown_w / 2, base_y + crown_h * 0.12], fill=gold)
    jewel_r = crown_h * 0.11
    for jx, jy, jc in (
        (cx, base_y - crown_h * 0.78, (232, 84, 128)),
        (cx - crown_w * 0.28, base_y - crown_h * 0.58, (255, 255, 255)),
        (cx + crown_w * 0.28, base_y - crown_h * 0.58, (255, 255, 255)),
    ):
        draw.ellipse([jx - jewel_r, jy - jewel_r, jx + jewel_r, jy + jewel_r], fill=jc)

    sparkle(draw, cx - face_r * 1.55, cy - face_r * 0.6, CANVAS * 0.035, (255, 255, 255))
    sparkle(draw, cx + face_r * 1.5, cy - face_r * 0.1, CANVAS * 0.045, (255, 255, 255))

    img = img.resize((SIZE, SIZE), Image.LANCZOS)
    img.putalpha(circle_mask(SIZE))
    return img


def build_normal():
    img = Image.new("RGB", (CANVAS, CANVAS), (190, 216, 255))
    draw = ImageDraw.Draw(img)
    cx, cy = CANVAS // 2, CANVAS // 2 + int(CANVAS * 0.05)
    face_r = CANVAS * 0.30

    hair_color = (74, 58, 46)
    draw_face(draw, cx, cy, face_r)
    # short simple hair: an arc across the top of the head
    draw.pieslice(
        [cx - face_r * 1.08, cy - face_r * 1.18, cx + face_r * 1.08, cy + face_r * 0.15],
        180, 360, fill=hair_color,
    )
    # a little side part triangle for character
    draw.polygon(
        [
            (cx - face_r * 0.15, cy - face_r * 1.02),
            (cx + face_r * 0.35, cy - face_r * 0.92),
            (cx - face_r * 0.05, cy - face_r * 0.72),
        ],
        fill=hair_color,
    )

    img = img.resize((SIZE, SIZE), Image.LANCZOS)
    img.putalpha(circle_mask(SIZE))
    return img


def main():
    princess = build_princess()
    normal = build_normal()
    for out_dir in OUT_DIRS:
        out_dir.mkdir(parents=True, exist_ok=True)
        princess.save(out_dir / "charlotte.png")
        normal.save(out_dir / "lothar.png")
        print(f"Saved {out_dir / 'charlotte.png'} and {out_dir / 'lothar.png'}")


if __name__ == "__main__":
    main()
