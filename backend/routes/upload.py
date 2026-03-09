"""
Arc AI - File Upload Route
POST /upload  — accepts a file, extracts text, returns it for use as context.
Supported: .txt .md .json .csv .pdf .docx and code files
"""

import io
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from auth import get_current_user

router = APIRouter()

# Max file size: 10 MB
MAX_BYTES = 10 * 1024 * 1024

# Supported extensions → how to parse them
TEXT_EXTENSIONS = {
    '.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml',
    # Code files
    '.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css',
    '.java', '.c', '.cpp', '.cs', '.go', '.rs', '.php',
    '.rb', '.swift', '.kt', '.sh', '.bash', '.sql',
}

def extract_text_from_pdf(data: bytes) -> str:
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(data))
        pages = [page.extract_text() or '' for page in reader.pages]
        return '\n\n'.join(pages).strip()
    except Exception as e:
        raise HTTPException(400, f"Could not read PDF: {str(e)}")

def extract_text_from_docx(data: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(data))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return '\n\n'.join(paragraphs).strip()
    except Exception as e:
        raise HTTPException(400, f"Could not read DOCX: {str(e)}")

def extract_text(filename: str, data: bytes) -> str:
    ext = os.path.splitext(filename.lower())[1]

    if ext == '.pdf':
        return extract_text_from_pdf(data)
    elif ext == '.docx':
        return extract_text_from_docx(data)
    elif ext in TEXT_EXTENSIONS:
        for enc in ('utf-8', 'latin-1', 'cp1252'):
            try:
                return data.decode(enc)
            except UnicodeDecodeError:
                continue
        raise HTTPException(400, "Could not decode file — unsupported encoding.")
    else:
        raise HTTPException(400, f"Unsupported file type: '{ext}'")


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Extract text from uploaded file and return it as context."""
    # Check size
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "File too large. Maximum size is 10 MB.")

    if not file.filename:
        raise HTTPException(400, "No filename provided.")

    text = extract_text(file.filename, data)

    if not text.strip():
        raise HTTPException(400, "File appears to be empty or has no readable text.")

    # Truncate very long files to avoid token limits (~100k chars ≈ ~25k tokens)
    truncated = False
    if len(text) > 100_000:
        text = text[:100_000]
        truncated = True

    return {
        "filename": file.filename,
        "size_bytes": len(data),
        "char_count": len(text),
        "truncated": truncated,
        "content": text,
    }