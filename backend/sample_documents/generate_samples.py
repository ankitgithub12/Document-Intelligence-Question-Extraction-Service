"""Generate sample PDF and image documents for testing and demonstration."""

from fpdf import FPDF
from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def create_clean_digital_pdf():
    """Create a clean digital PDF with selectable text — MCQ questions."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Page 1
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Computer Science Examination", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, "Time: 2 Hours | Total Marks: 50", ln=True, align="C")
    pdf.ln(10)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Section A: Multiple Choice Questions", ln=True)
    pdf.ln(5)

    questions_p1 = [
        ("1", "What is the time complexity of binary search?",
         ["O(1)", "O(log n)", "O(n)", "O(n log n)"]),
        ("2", "Which data structure uses LIFO principle?",
         ["Queue", "Stack", "Array", "Linked List"]),
        ("3", "What does SQL stand for?",
         ["Structured Query Language", "Simple Query Language",
          "Standard Query Language", "Sequential Query Language"]),
    ]

    pdf.set_font("Helvetica", "", 11)
    for num, text, options in questions_p1:
        pdf.cell(0, 7, f"{num}. {text}", ln=True)
        for i, opt in enumerate(options):
            key = chr(65 + i)
            pdf.cell(0, 6, f"   ({key}) {opt}", ln=True)
        pdf.ln(3)

    # Page 2
    pdf.add_page()
    questions_p2 = [
        ("4", "Which of the following is NOT an operating system?",
         ["Windows", "Linux", "Oracle", "macOS"]),
        ("5", "What is the primary function of an operating system?",
         ["Run applications", "Manage hardware resources",
          "Browse the internet", "Create documents"]),
    ]

    for num, text, options in questions_p2:
        pdf.cell(0, 7, f"{num}. {text}", ln=True)
        for i, opt in enumerate(options):
            key = chr(65 + i)
            pdf.cell(0, 6, f"   ({key}) {opt}", ln=True)
        pdf.ln(3)

    # Page 3 — Question that spans to page 4
    pdf.ln(100)  # Push to near bottom of page
    pdf.cell(0, 7, "6. Which of the following statements is", ln=True)

    # Page 4 — Continuation
    pdf.add_page()
    pdf.cell(0, 7, "correct regarding operating systems?", ln=True)
    options_6 = [
        "All operating systems are open source",
        "An OS manages both hardware and software resources",
        "Operating systems cannot handle multiple processes",
        "Device drivers are not part of the OS"
    ]
    for i, opt in enumerate(options_6):
        key = chr(65 + i)
        pdf.cell(0, 6, f"   ({key}) {opt}", ln=True)

    pdf.ln(5)
    pdf.cell(0, 7, "7. True or False: TCP is a connectionless protocol.", ln=True)

    # Page 5 — Answer Key
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "Answer Key", ln=True, align="C")
    pdf.ln(5)
    pdf.set_font("Helvetica", "", 11)
    answers = ["1-B", "2-B", "3-A", "4-C", "5-B", "6-B", "7-A"]
    for ans in answers:
        pdf.cell(0, 7, ans, ln=True)

    path = os.path.join(OUTPUT_DIR, "clean_digital_exam.pdf")
    pdf.output(path)
    print(f"Created: {path}")


def create_answer_key_pdf():
    """Create a separate answer key PDF."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "Answer Key - Computer Science Examination", ln=True, align="C")
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 11)
    answers = [
        "Q1 -> B", "Q2 -> B", "Q3 -> A", "Q4 -> C",
        "Q5 -> B", "Q6 -> B", "Q7 -> A"
    ]
    for ans in answers:
        pdf.cell(0, 7, ans, ln=True)

    path = os.path.join(OUTPUT_DIR, "separate_answer_key.pdf")
    pdf.output(path)
    print(f"Created: {path}")


def create_question_image_jpg():
    """Create a JPG image with questions."""
    img = Image.new("RGB", (800, 600), "white")
    draw = ImageDraw.Draw(img)

    lines = [
        "Science Quiz — Section B",
        "",
        "1. What is the chemical symbol for water?",
        "   (A) H2O",
        "   (B) CO2",
        "   (C) NaCl",
        "   (D) O2",
        "",
        "2. What planet is known as the Red Planet?",
        "   (A) Jupiter",
        "   (B) Mars",
        "   (C) Venus",
        "   (D) Saturn",
        "",
        "3. What is the speed of light approximately?",
        "   (A) 300,000 km/s",
        "   (B) 150,000 km/s",
        "   (C) 100,000 km/s",
        "   (D) 500,000 km/s",
    ]

    y = 20
    for line in lines:
        draw.text((30, y), line, fill="black")
        y += 28

    path = os.path.join(OUTPUT_DIR, "question_image.jpg")
    img.save(path, "JPEG", quality=85)
    print(f"Created: {path}")


def create_question_image_png():
    """Create a PNG image with questions."""
    img = Image.new("RGB", (800, 500), "white")
    draw = ImageDraw.Draw(img)

    lines = [
        "Mathematics Quiz",
        "",
        "Q.1 What is 15 x 12?",
        "  A. 170",
        "  B. 180",
        "  C. 190",
        "  D. 160",
        "",
        "Q.2 Define the Pythagorean theorem.",
        "",
        "Q.3 Fill in the blank: The area of a circle is ___ x r^2.",
    ]

    y = 20
    for line in lines:
        draw.text((30, y), line, fill="black")
        y += 32

    path = os.path.join(OUTPUT_DIR, "question_image.png")
    img.save(path, "PNG")
    print(f"Created: {path}")


def create_low_quality_image():
    """Create a low-quality/blurry image to test OCR robustness."""
    img = Image.new("RGB", (600, 400), (240, 240, 240))
    draw = ImageDraw.Draw(img)

    lines = [
        "1. Wh4t ls the c@pital of Ind1a?",
        "  a) Mumbai",
        "  b) New Delhi",
        "  c) Kolkata",
        "  d) Chennai",
    ]

    y = 30
    for line in lines:
        draw.text((20, y), line, fill=(80, 80, 80))
        y += 40

    # Make it low quality by resizing down and up
    img = img.resize((200, 133), Image.NEAREST)
    img = img.resize((600, 400), Image.NEAREST)

    path = os.path.join(OUTPUT_DIR, "low_quality_scan.png")
    img.save(path, "PNG")
    print(f"Created: {path}")


def create_invalid_document():
    """Create an invalid file pretending to be a PDF."""
    path = os.path.join(OUTPUT_DIR, "invalid_document.txt")
    with open(path, "w") as f:
        f.write("This is not a valid PDF or image file.\nIt should be rejected by the system.")
    print(f"Created: {path}")


if __name__ == "__main__":
    create_clean_digital_pdf()
    create_answer_key_pdf()
    create_question_image_jpg()
    create_question_image_png()
    create_low_quality_image()
    create_invalid_document()
    print("\nAll sample documents generated!")
