"""Remove baked-in UI/text from official_website_cover.png, keep background only."""
from pathlib import Path

import cv2
import numpy as np

SRC = Path(r"e:\Dev\Demo\frontend-showcase\src\assets\img\official_website_cover.png")
COPY = Path(r"e:\Dev\Demo\frontend-showcase\src\assets\img\official_website_cover_copy.png")
DST = Path(r"e:\Dev\Demo\frontend-showcase\src\assets\img\official_website_cover_bg.png")


def build_mask(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Top navigation
    mask[0:88, :] = 255

    # Dark blue hero typography
    blue = cv2.inRange(hsv, (90, 35, 25), (132, 255, 150))
    blue[:85, :] = 0
    blue[690:, :] = 0
    blue[:, 900:] = 0
    mask = cv2.bitwise_or(mask, blue)

    # CTA button
    btn = cv2.inRange(hsv, (95, 100, 60), (128, 255, 255))
    btn[:230, :] = 0
    btn[540:, :] = 0
    btn[:, 500:] = 0
    mask = cv2.bitwise_or(mask, btn)
    mask[418:512, 48:330] = 255

    # Headline underline
    mask[246:278, 50:200] = 255

    # Bottom frosted value bar
    mask[748:h, :] = 255
    icons = cv2.inRange(hsv[735:, :], (90, 50, 40), (135, 255, 220))
    mask[735:h, :] = np.maximum(mask[735:h, :], icons)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (6, 6))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
    mask = cv2.dilate(mask, kernel, iterations=2)
    return mask


def heal_top_sky(img: np.ndarray) -> np.ndarray:
    out = img.copy()
    h, w = out.shape[:2]
    ref = out[95:220, int(w * 0.55) : int(w * 0.95)].astype(np.float32)
    mean_color = ref.mean(axis=(0, 1))

    for y in range(88):
        t = y / 87
        row_color = mean_color * (0.85 + 0.15 * t)
        out[y, :] = np.clip(
            out[y, :].astype(np.float32) * 0.15 + row_color * 0.85,
            0,
            255,
        ).astype(np.uint8)
    return out


def main() -> None:
    img = cv2.imread(str(SRC), cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f"Failed to read {SRC}")

    cv2.imwrite(str(COPY), img, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    print(f"Copied: {COPY}")

    mask = build_mask(img)
    healed = cv2.inpaint(img, mask, 10, cv2.INPAINT_TELEA)
    healed = cv2.inpaint(healed, mask, 6, cv2.INPAINT_NS)
    healed = heal_top_sky(healed)

    bottom_mask = np.zeros_like(mask)
    bottom_mask[740:, :] = 255
    healed = cv2.inpaint(healed, bottom_mask, 8, cv2.INPAINT_TELEA)

    cv2.imwrite(str(DST), healed, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    print(f"Saved: {DST}")


if __name__ == "__main__":
    main()
