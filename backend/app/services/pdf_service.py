"""PDF service — extract pages, text, and render pages to images."""

import fitz  # PyMuPDF
from pathlib import Path
from typing import Optional
from app.core.logging import get_logger

logger = get_logger(__name__)


class PDFService:
    """Service for PDF text extraction and page rendering."""

    def get_page_count(self, pdf_path: str) -> int:
        """Return the number of pages in a PDF."""
        doc = fitz.open(pdf_path)
        count = len(doc)
        doc.close()
        return count

    def extract_text_from_page(self, pdf_path: str, page_number: int) -> str:
        """Extract selectable text from a specific page (0-indexed)."""
        doc = fitz.open(pdf_path)
        page = doc[page_number]
        text = page.get_text("text")
        doc.close()
        return text.strip()

    def extract_all_text(self, pdf_path: str) -> list[dict]:
        """Extract text from all pages. Returns list of {page_number, text}."""
        doc = fitz.open(pdf_path)
        pages = []
        for i in range(len(doc)):
            page = doc[i]
            text = page.get_text("text").strip()
            pages.append({
                "page_number": i + 1,  # 1-indexed for user display
                "text": text,
                "has_text": len(text) > 20,  # Threshold: meaningful text present
            })
        doc.close()
        return pages

    def render_page_to_image(
        self, pdf_path: str, page_number: int, output_path: str, dpi: int = 200
    ) -> str:
        """Render a PDF page to a PNG image. Returns the output path."""
        doc = fitz.open(pdf_path)
        page = doc[page_number]
        # Scale matrix for higher DPI
        zoom = dpi / 72
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        pix.save(output_path)
        doc.close()
        logger.info("page_rendered", page=page_number + 1, path=output_path)
        return output_path

    def is_valid_pdf(self, pdf_path: str) -> bool:
        """Check if the file is a valid, readable PDF."""
        try:
            doc = fitz.open(pdf_path)
            _ = len(doc)
            doc.close()
            return True
        except Exception:
            return False

    def needs_ocr(self, text: str) -> bool:
        """Determine if a page needs OCR based on extracted text quality."""
        if not text:
            return True
        # Very short text likely means scanned page
        if len(text.strip()) < 20:
            return True
        # Mostly non-printable or garbage characters
        printable_ratio = sum(1 for c in text if c.isprintable() or c.isspace()) / max(len(text), 1)
        return printable_ratio < 0.7
