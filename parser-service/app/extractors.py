import io
import re

import pdfplumber
from docx import Document

from app.models import ParsedResume

SKILL_VOCABULARY = {
    "python", "typescript", "javascript", "react", "next.js", "node.js", "fastapi",
    "sql", "postgresql", "supabase", "aws", "docker", "kubernetes", "git", "java",
    "c#", "c++", "go", "rust", "figma", "product strategy", "agile", "scrum",
    "machine learning", "data analysis", "pandas", "tableau", "power bi", "tensorflow",
}


def extract_pdf(content: bytes) -> str:
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages).strip()


def extract_docx(content: bytes) -> str:
    document = Document(io.BytesIO(content))
    return "\n".join(paragraph.text for paragraph in document.paragraphs).strip()


def _first_non_empty_line(text: str) -> str | None:
    for line in text.splitlines()[:8]:
        cleaned = re.sub(r"\s+", " ", line).strip()
        if 2 <= len(cleaned) <= 80 and "@" not in cleaned and not re.search(r"\d{3}[-.) ]?\d{3}", cleaned):
            return cleaned
    return None


def _section_items(text: str, heading: str) -> list[dict[str, str]]:
    pattern = rf"(?is){heading}\s*[:\n](.*?)(?=\n(?:education|experience|skills|projects|certifications)\b|\Z)"
    match = re.search(pattern, text)
    if not match:
        return []
    lines = [re.sub(r"^[\s•\-*]+", "", line).strip() for line in match.group(1).splitlines()]
    return [{"detail": line} for line in lines if len(line) > 2][:12]


def parse_resume(text: str) -> ParsedResume:
    lowered = text.lower()
    email = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", text)
    phone = re.search(r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}", text)
    skills = sorted(skill for skill in SKILL_VOCABULARY if re.search(rf"(?<!\w){re.escape(skill)}(?!\w)", lowered))
    return ParsedResume(
        name=_first_non_empty_line(text),
        email=email.group(0) if email else None,
        phone=phone.group(0) if phone else None,
        skills=skills,
        education=_section_items(text, "education"),
        experience=_section_items(text, "(?:experience|employment|work history)"),
        raw_text=text,
    )
