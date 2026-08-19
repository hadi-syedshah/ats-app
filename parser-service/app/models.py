from typing import Any

from pydantic import BaseModel, HttpUrl


class ParseRequest(BaseModel):
    cv_id: str
    signed_url: HttpUrl


class ParsedResume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: list[str] = []
    education: list[dict[str, Any]] = []
    experience: list[dict[str, Any]] = []
    raw_text: str


class ParseResponse(BaseModel):
    cv_id: str
    status: str
    extracted_skills: int
