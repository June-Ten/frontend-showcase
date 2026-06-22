"""Remove bottom-right AI watermark from banner image."""
from pathlib import Path

import cv2
import numpy as np

SRC = Path(
    r"C:\Users\admin\.cursor\projects\e-Dev-Demo-frontend-showcase\assets"
    r"\c__Users_admin_AppData_Roaming_Cursor_User_workspaceStorage_15e9faa883ec51840810f9a71d2e161b_images_______banner___-69be05aa-8f18-46be-843d-b2feb3a5b75a.png"
)
DST = Path(r"e:\Dev\Demo\frontend-showcase\src\assets\img\official_website_cover_bg.png")


def build_mask(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)

    # Watermark zone (bottom-right)
    y0, x0 = int(h * 0.86), int(w * 0.70)
    mask[y0:, x0:] = 255

    roi = img[y0:, x0:]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, bright = cv2.threshold(gray, 185, 255, cv2.THRESH_BINARY)
    mask[y0:, x0:] = np.maximum(mask[y0:, x0:], bright)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    return cv2.dilate(mask, kernel, iterations=2)


def main() -> None:
    img = cv2.imread(str(SRC))
    if img is None:
        raise SystemExit(f"Cannot read {SRC}")

    mask = build_mask(img)
    result = cv2.inpaint(img, mask, 8, cv2.INPAINT_TELEA)
    result = cv2.inpaint(result, mask, 5, cv2.INPAINT_NS)

    cv2.imwrite(str(DST), result, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    print(f"Saved: {DST} ({img.shape[1]}x{img.shape[0]})")


if __name__ == "__main__":
    main()
