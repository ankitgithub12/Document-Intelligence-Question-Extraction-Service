"""Image service — preprocessing for OCR (grayscale, denoise, threshold, deskew)."""

import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from app.core.logging import get_logger

logger = get_logger(__name__)


class ImageService:
    """Service for image preprocessing to improve OCR accuracy."""

    def preprocess_for_ocr(self, image_path: str, output_path: str = None) -> str:
        """Apply preprocessing pipeline and save result. Returns the output path."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Fast denoise (Gaussian blur is ~400x faster than fastNlMeans on full-page images)
        denoised = cv2.GaussianBlur(gray, (3, 3), 0)

        # Adaptive thresholding for better text contrast
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

        # Deskew
        deskewed = self._deskew(thresh)

        out = output_path or image_path
        cv2.imwrite(out, deskewed)
        logger.info("image_preprocessed", path=out)
        return out

    def _deskew(self, image: np.ndarray) -> np.ndarray:
        """Correct skew in a binary image."""
        try:
            coords = np.column_stack(np.where(image < 128))
            if len(coords) < 100:
                return image
            angle = cv2.minAreaRect(coords)[-1]

            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle

            if abs(angle) < 0.5:
                return image

            (h, w) = image.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(
                image, M, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE,
            )
            logger.info("image_deskewed", angle=round(angle, 2))
            return rotated
        except Exception:
            return image

    def detect_rotation(self, image_path: str) -> float:
        """Detect the rotation angle of the image (best-effort)."""
        try:
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                return 0.0
            coords = np.column_stack(np.where(img < 128))
            if len(coords) < 100:
                return 0.0
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            return round(angle, 2)
        except Exception:
            return 0.0

    def resize_if_needed(self, image_path: str, max_dim: int = 4000) -> str:
        """Resize image if it exceeds max dimension, preserving aspect ratio."""
        img = Image.open(image_path)
        w, h = img.size
        if max(w, h) <= max_dim:
            return image_path
        scale = max_dim / max(w, h)
        new_size = (int(w * scale), int(h * scale))
        img = img.resize(new_size, Image.LANCZOS)
        img.save(image_path)
        logger.info("image_resized", original=(w, h), new=new_size)
        return image_path
