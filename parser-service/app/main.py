import os
from typing import Annotated

import httpx
from fastapi import FastAPI, Header, HTTPException, status
from supabase import Client, create_client

from app.extractors import extract_docx, extract_pdf, parse_resume
from app.models import ParseRequest, ParseResponse

app = FastAPI(title="ATS CV Parser", version="1.0.0")


def env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is not configured")
    return value


def supabase_url() -> str:
    return env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/").removesuffix("/rest/v1")


def supabase_admin() -> Client:
    return create_client(supabase_url(), env("SUPABASE_SERVICE_ROLE_KEY"))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/parse", response_model=ParseResponse)
async def parse_cv(
    payload: ParseRequest,
    x_internal_secret: Annotated[str | None, Header()] = None,
) -> ParseResponse:
    if not x_internal_secret or x_internal_secret != env("INTERNAL_SERVICE_SECRET"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal service secret")

    client = supabase_admin()
    try:
        async with httpx.AsyncClient(timeout=45.0, follow_redirects=True) as http_client:
            response = await http_client.get(str(payload.signed_url))
            response.raise_for_status()
        content = response.content
        content_type = response.headers.get("content-type", "")
        if "pdf" in content_type or content.startswith(b"%PDF"):
            text = extract_pdf(content)
        elif "wordprocessingml" in content_type or content.startswith(b"PK"):
            text = extract_docx(content)
        else:
            raise ValueError("The signed file is neither a PDF nor a DOCX document")
        if not text:
            raise ValueError("No readable text could be extracted from the CV")

        parsed = parse_resume(text)
        client.table("parsed_data").upsert(
            {
                "cv_id": payload.cv_id,
                "name": parsed.name,
                "email": parsed.email,
                "phone": parsed.phone,
                "skills": parsed.skills,
                "education": parsed.education,
                "experience": parsed.experience,
                "raw_text": parsed.raw_text,
            }
        ).execute()
        client.table("cvs").update({"status": "parsed", "parsed_text": parsed.raw_text}).eq("id", payload.cv_id).execute()
        return ParseResponse(cv_id=payload.cv_id, status="parsed", extracted_skills=len(parsed.skills))
    except Exception as error:
        client.table("cvs").update({"status": "failed"}).eq("id", payload.cv_id).execute()
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="CV parsing failed") from error
