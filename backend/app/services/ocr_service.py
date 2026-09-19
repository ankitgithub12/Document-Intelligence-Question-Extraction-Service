"""OCR service — abstract provider + Tesseract implementation."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class OCRResult:
    """Result from OCR processing."""
    text: str
    confidence: float  # 0.0 - 1.0
    orientation: float = 0.0


class OCRProvider(ABC):
    """Abstract OCR provider interface."""

    @abstractmethod
    def extract_text(self, image_path: str) -> OCRResult:
        """Extract text from an image."""
        ...

    @abstractmethod
    def detect_orientation(self, image_path: str) -> float:
        """Detect image orientation in degrees."""
        ...

    @abstractmethod
    def get_confidence(self, image_path: str) -> float:
        """Get overall OCR confidence for the image."""
        ...


class TesseractOCRProvider(OCRProvider):
    """Tesseract OCR implementation."""

    def extract_text(self, image_path: str) -> OCRResult:
        try:
            import pytesseract
            from PIL import Image

            img = Image.open(image_path)
            text = pytesseract.image_to_string(img, lang="eng")
            confidence = self._get_confidence_from_data(image_path)

            logger.info("ocr_completed", path=image_path, confidence=confidence, chars=len(text))
            return OCRResult(text=text.strip(), confidence=confidence)
        except Exception as e:
            logger.error("ocr_failed", path=image_path, error=str(e))
            return OCRResult(text="", confidence=0.0)

    def detect_orientation(self, image_path: str) -> float:
        try:
            import pytesseract
            from PIL import Image

            img = Image.open(image_path)
            osd = pytesseract.image_to_osd(img)
            for line in osd.split("\n"):
                if "Rotate:" in line:
                    return float(line.split(":")[-1].strip())
            return 0.0
        except Exception:
            return 0.0

    def get_confidence(self, image_path: str) -> float:
        return self._get_confidence_from_data(image_path)

    def _get_confidence_from_data(self, image_path: str) -> float:
        """Extract average confidence from Tesseract data output."""
        try:
            import pytesseract
            from PIL import Image

            img = Image.open(image_path)
            data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            confidences = [
                int(c) for c in data.get("conf", []) if str(c).isdigit() and int(c) > 0
            ]
            if not confidences:
                return 0.0
            return round(sum(confidences) / len(confidences) / 100.0, 3)
        except Exception:
            return 0.5  # Default mid-range confidence


def get_ocr_provider() -> OCRProvider:
    """Factory to get the configured OCR provider."""
    if settings.OCR_PROVIDER == "tesseract":
        return TesseractOCRProvider()
    # Future: add Google Vision, AWS Textract providers
    return TesseractOCRProvider()
