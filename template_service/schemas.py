from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any, Dict


class PaginationMeta(BaseModel):
    total: int
    limit: int
    page: int
    total_pages: int
    has_next: bool
    has_previous: bool


class TemplateVariableBase(BaseModel):
    name: str = Field(..., min_length=1)
    link: Optional[str] = None
    description: Optional[str] = None
    is_required: bool = False


class TemplateVariableCreate(TemplateVariableBase):
    pass


class TemplateVariableResponse(TemplateVariableBase):
    id: int

    class Config:
        from_attributes = True


class TemplateBase(BaseModel):
    name: str
    type: str = "email"
    subject: Optional[str] = None
    content: str
    language: str = "en"
    variables: Optional[List[TemplateVariableCreate]] = None

    @field_validator('type')
    def type_must_be_email_or_push(cls, v):
        if v not in ("email", "push"):
            raise ValueError("type must be 'email' or 'push'")
        return v


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    subject: Optional[str] = None
    version: Optional[int] = None
    content: Optional[str] = None
    language: Optional[str] = None
    variables: Optional[List[TemplateVariableCreate]] = None


class TemplateResponse(TemplateBase):
    id: int
    version: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    variables: Optional[List[TemplateVariableResponse]] = None

    class Config:
        from_attributes = True


class TemplateVersionResponse(BaseModel):
    id: int
    template_id: int
    version: int
    name: str
    type: str
    subject: Optional[str]
    content: str
    language: str
    changed_by: Optional[str]
    changed_at: datetime
    class Config:
        from_attributes = True


# class RenderRequest(BaseModel):
#     data: Dict[str, Any]


class RenderRequest(BaseModel):
    name: str
    version: Optional[int]= None
    variables: Dict[str, Any]


class RenderResponse(BaseModel):
    subject: Optional[str] = None
    version: Optional[int] = None
    content: str


class APIResponse(BaseModel):
    success: bool
    data: Optional[Any]
    error: Optional[str]
    message: str
    meta: Optional[PaginationMeta] = None

class APIErrorResponse(BaseModel):
    success: bool
    error: str
    message: str
    meta: Dict[str, Any] = {}