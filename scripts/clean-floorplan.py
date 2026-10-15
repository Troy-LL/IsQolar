#!/usr/bin/env python3
"""Clean one floor-plan photo into a straight JPEG that pins can sit on.

Requires Python 3 with Pillow and OpenCV. Install them locally if needed:

    pip install pillow opencv-python-headless

Those packages are not Node dependencies. Do not add them to package.json.

Usage:

    python3 scripts/clean-floorplan.py SRC DEST x,y x,y x,y x,y

The four corners are the outer border of the plan, in order top-left,
top-right, bottom-right, bottom-left. Coordinates are pixels of the photo
after EXIF orientation is applied.

Steps: apply EXIF orientation, perspective-warp those four corners onto a
rectangle (that rectangle is the crop to the plan border), CLAHE on the
lightness channel, a light unsharp mask, resize so the long side is 2000
pixels, and save JPEG. Quality starts at 85. If that file is over about
600 KB, quality steps down until it fits.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

LONG_SIDE = 2000
JPEG_QUALITY = 85
MAX_BYTES = 600 * 1024


def parse_corner(text: str) -> tuple[float, float]:
    parts = text.split(",")
    if len(parts) != 2:
        raise argparse.ArgumentTypeError(f"corner must be x,y, got {text!r}")
    try:
        return float(parts[0]), float(parts[1])
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"corner must be x,y, got {text!r}") from exc


def quad_size(corners: np.ndarray) -> tuple[int, int]:
    tl, tr, br, bl = corners
    width = max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl))
    height = max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr))
    return max(1, int(round(width))), max(1, int(round(height)))


def warp_to_border(rgb: np.ndarray, corners: np.ndarray) -> np.ndarray:
    width, height = quad_size(corners)
    destination = np.array(
        [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]],
        dtype=np.float32,
    )
    matrix = cv2.getPerspectiveTransform(corners.astype(np.float32), destination)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    warped = cv2.warpPerspective(
        bgr,
        matrix,
        (width, height),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REPLICATE,
    )
    return warped


def clahe_lightness(bgr: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    lightness, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lightness = clahe.apply(lightness)
    return cv2.cvtColor(cv2.merge((lightness, a, b)), cv2.COLOR_LAB2BGR)


def sharpen_lightly(bgr: np.ndarray) -> np.ndarray:
    blurred = cv2.GaussianBlur(bgr, (0, 0), 1.0)
    sharp = cv2.addWeighted(bgr, 1.2, blurred, -0.2, 0)
    return np.clip(sharp, 0, 255).astype(np.uint8)


def resize_long_side(bgr: np.ndarray, long_side: int) -> np.ndarray:
    height, width = bgr.shape[:2]
    if max(height, width) == long_side:
        return bgr
    if width >= height:
        new_size = (long_side, max(1, int(round(height * long_side / width))))
    else:
        new_size = (max(1, int(round(width * long_side / height))), long_side)
    return cv2.resize(bgr, new_size, interpolation=cv2.INTER_AREA)


def save_jpeg(rgb: np.ndarray, dest: Path) -> int:
    image = Image.fromarray(rgb)
    quality = JPEG_QUALITY
    dest.parent.mkdir(parents=True, exist_ok=True)
    while True:
        image.save(dest, format="JPEG", quality=quality, optimize=True)
        size = dest.stat().st_size
        if size <= MAX_BYTES or quality <= 60:
            return quality
        quality -= 5


def clean(src: Path, dest: Path, corners: np.ndarray) -> None:
    rgb = np.array(ImageOps.exif_transpose(Image.open(src)).convert("RGB"))
    height, width = rgb.shape[:2]
    for x, y in corners:
        if not (0 <= x < width and 0 <= y < height):
            print(f"corner {x:.1f},{y:.1f} is outside the oriented image {width}x{height}", file=sys.stderr)
            sys.exit(1)
    warped = warp_to_border(rgb, corners)
    corrected = sharpen_lightly(clahe_lightness(warped))
    resized = resize_long_side(corrected, LONG_SIDE)
    out_rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    quality = save_jpeg(out_rgb, dest)
    out_h, out_w = resized.shape[:2]
    size = dest.stat().st_size
    print(f"{dest} {out_w}x{out_h} {size} bytes quality {quality}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean a floor-plan photo.")
    parser.add_argument("src", type=Path)
    parser.add_argument("dest", type=Path)
    parser.add_argument(
        "corners",
        nargs=4,
        type=parse_corner,
        metavar="x,y",
        help="top-left, top-right, bottom-right, bottom-left after EXIF orientation",
    )
    args = parser.parse_args()
    clean(args.src, args.dest, np.array(args.corners, dtype=np.float32))


if __name__ == "__main__":
    main()
