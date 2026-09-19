# Demonstration Guide

## Prerequisites

```bash
docker compose up --build
```

Wait for all services to be healthy. Frontend: http://localhost:5173, Backend: http://localhost:8000

## Scenario 1: Upload a Clean Digital PDF

1. Open http://localhost:5173
2. Register a new account
3. On the Dashboard, drag and drop `backend/sample_documents/clean_digital_exam.pdf`
4. The document will show status **QUEUED** → **PROCESSING** → **COMPLETED** (or **REVIEW_REQUIRED**)
5. Click the document to view extracted questions with options, answers, confidence scores

**Expected**: 7 questions extracted, answer key detected on page 5, answers matched.

## Scenario 2: Upload a JPG Image

1. Upload `backend/sample_documents/question_image.jpg`
2. Wait for processing to complete
3. View extracted questions

**Expected**: 3 MCQ questions extracted from the image via OCR.

## Scenario 3: Upload a PNG Image

1. Upload `backend/sample_documents/question_image.png`
2. View results — should include MCQ and Short Answer types

**Expected**: Mix of MCQ, SHORT_ANSWER, and potentially UNKNOWN question types.

## Scenario 4: Process a Low-Quality Scan

1. Upload `backend/sample_documents/low_quality_scan.png`
2. Check processing results
3. View Review Items — should have low confidence warnings

**Expected**: OCR may produce errors. Review items created for uncertain extractions.

## Scenario 5: Cross-Page Question

The `clean_digital_exam.pdf` contains Question 6 split across pages 3-4:
- Page 3: "Which of the following statements is"
- Page 4: "correct regarding operating systems?"

**Expected**: Merged into one question with `source_pages: [3, 4]` and a CROSS_PAGE_MERGE review item.

## Scenario 6: Answer Key Detection & Matching

The `clean_digital_exam.pdf` has an answer key on page 5 (1-B, 2-B, 3-A, etc.).

**Expected**: Answer keys detected, matched to questions, answer_status = "MATCHED".

## Scenario 7: Separate Answer Key Document

1. Upload `clean_digital_exam.pdf` (question paper)
2. Upload `separate_answer_key.pdf` (answer key)
3. Create a relationship: POST to `/api/v1/documents/{question_paper_id}/relationships`
   with body `{"related_document_id": "<answer_key_id>", "relationship_type": "ANSWER_KEY"}`

**Expected**: Relationship created, both documents linked.

## Scenario 8: Reject Invalid Document

1. Try uploading `backend/sample_documents/invalid_document.txt`
2. The system should reject it with an error

**Expected**: 400 error — "Only PDF, JPG, JPEG and PNG files are supported"

## Scenario 9: Retrieve Structured JSON

```bash
# Get full question data
curl http://localhost:8000/api/v1/documents/<id>/questions \
  -H "Authorization: Bearer <token>" | python -m json.tool
```

**Expected**: Structured JSON matching the schema in `backend/sample_outputs/`.

## Scenario 10: Swagger API Documentation

Visit http://localhost:8000/docs — all endpoints documented with schemas and examples.
