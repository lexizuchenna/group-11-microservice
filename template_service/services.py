from schemas import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateVariableCreate,
    TemplateVariableResponse,
    TemplateVersionResponse,
)
from models import template_model, template_variable_model, template_version_model
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from logger import logger
from jinja2 import Template as JinjaTemplate
import re
from typing import Optional, List, Dict, Any


class TemplateService:
    pass
    

class ServiceException(Exception):
    """Custom exception to allow services to specify HTTP error metadata.

    Attributes:
        status_code: HTTP status code to return
        error: short error name (e.g., 'NotFound')
        message: human-readable error message
    """

    def __init__(self, status_code: int, error: str, message: str):
        self.status_code = status_code
        self.error = error
        self.message = message
        super().__init__(f"{status_code} {error}: {message}")


class TemplateService:
    @staticmethod
    def create_template(db: Session, payload: TemplateCreate, created_by: Optional[str] = None) -> TemplateResponse:
        # check unique name+language at DB level; check first for friendly error
        existing = db.query(template_model).filter(
            template_model.name == payload.name,
            template_model.language == payload.language,
            template_model.is_active == True,
        ).first()
        if existing:
            # validation error triggered in service layer
            raise ServiceException(400, "Validation failed", "Template name already exists for this language")

        tpl = template_model(
            name=payload.name,
            type=payload.type,
            subject=payload.subject,
            content=payload.content,
            language=payload.language,
            version=1,
        )
        db.add(tpl)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            # unique constraint or other integrity problem on insert
            raise ServiceException(400, "Validation failed", "Template name already exists for this language")

        # variables
        variables_objs: List[template_variable_model] = []
        if payload.variables:
            for v in payload.variables:
                vv = template_variable_model(
                    template_id=tpl.id,
                    name=v.name,
                    link=v.link,
                    description=v.description,
                    is_required=v.is_required,
                )
                db.add(vv)
                variables_objs.append(vv)

        # create initial version row
        ver = template_version_model(
            template_id=tpl.id,
            version=1,
            name=tpl.name,
            type=tpl.type,
            subject=tpl.subject,
            content=tpl.content,
            language=tpl.language,
            changed_by=created_by,
        )
        db.add(ver)
        try:
            db.commit()
        except IntegrityError:
            # likely a unique constraint violation on (name, language)
            db.rollback()
            raise ServiceException(400, "Validation failed", "Template name already exists for this language")
        db.refresh(tpl)

        vars_resp = [TemplateVariableResponse.model_validate(v) for v in variables_objs] if variables_objs else None

        resp = TemplateResponse.model_validate({**tpl.__dict__, "variables": vars_resp})
        logger.info(f"Template created: {tpl.name} (id={tpl.id})")
        return resp

    @staticmethod
    def list_templates(db: Session, page: int = 1, limit: int = 10, search: Optional[str] = None) -> tuple[List[TemplateResponse], Dict[str, Any]]:
        if limit > 100:
            limit = 100
        skip = (page - 1) * limit
        q = db.query(template_model).filter(template_model.is_active == True)
        if search:
            q = q.filter(template_model.name.ilike(f"%{search}%"))
        total = q.count()
        items = q.order_by(template_model.created_at.desc()).offset(skip).limit(limit).all()
        resp_items = []
        for t in items:
            vars_q = db.query(template_variable_model).filter(template_variable_model.template_id == t.id).all()
            vars_resp = [TemplateVariableResponse.model_validate(v) for v in vars_q] if vars_q else None
            resp_items.append(TemplateResponse.model_validate({**t.__dict__, "variables": vars_resp}))

        total_pages = (total + limit - 1) // limit if total else 1
        meta = {
            "total": total,
            "limit": limit,
            "page": page,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }
        return resp_items, meta

    @staticmethod
    def get_template_by_name(db: Session, name: str, language: Optional[str] = "en") -> Optional[TemplateResponse]:
        t = db.query(template_model).filter(
            template_model.name == name,
            template_model.language == language,
            template_model.is_active == True,
        ).first()
        if not t:
            raise ServiceException(404, "NotFound", "Template not found")
        vars_q = db.query(template_variable_model).filter(template_variable_model.template_id == t.id).all()
        vars_resp = [TemplateVariableResponse.model_validate(v) for v in vars_q] if vars_q else None
        return TemplateResponse.model_validate({**t.__dict__, "variables": vars_resp})

    @staticmethod
    def get_template_by_id(db: Session, template_id: int) -> Optional[TemplateResponse]:
        """Retrieve a template by its numeric ID. Raises ServiceException(404) if not found."""
        t = db.query(template_model).filter(
            template_model.id == template_id,
            template_model.is_active == True,
        ).first()
        if not t:
            raise ServiceException(404, "NotFound", "Template not found")
        vars_q = db.query(template_variable_model).filter(template_variable_model.template_id == t.id).all()
        vars_resp = [TemplateVariableResponse.model_validate(v) for v in vars_q] if vars_q else None
        return TemplateResponse.model_validate({**t.__dict__, "variables": vars_resp})

    @staticmethod
    def update_template_by_id(db: Session, template_id: int, payload: TemplateUpdate, changed_by: Optional[str] = None) -> Optional[TemplateResponse]:
        t = db.query(template_model).filter(template_model.id == template_id, template_model.is_active == True).first()
        if not t:
            raise ServiceException(404, "NotFound", "Template not found")

        # store current as version
        ver = template_version_model(
            template_id=t.id,
            version=t.version,
            name=t.name,
            type=t.type,
            subject=t.subject,
            content=t.content,
            language=t.language,
            changed_by=changed_by,
        )
        db.add(ver)

        # apply updates
        updatable = ["name", "type", "subject", "content", "language"]
        for field in updatable:
            if getattr(payload, field, None) is not None:
                setattr(t, field, getattr(payload, field))

        # increment version
        t.version = t.version + 1

        # variables: replace if provided
        if getattr(payload, "variables", None) is not None:
            # remove existing
            db.query(template_variable_model).filter(template_variable_model.template_id == t.id).delete()
            for v in payload.variables:
                vv = template_variable_model(
                    template_id=t.id,
                    name=v.name,
                    description=v.description,
                    is_required=v.is_required,
                )
                db.add(vv)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ServiceException(400, "Validation failed", "Template name already exists for this language")
        db.refresh(t)

        # create new version entry for updated state
        new_ver = template_version_model(
            template_id=t.id,
            version=t.version,
            name=t.name,
            type=t.type,
            subject=t.subject,
            content=t.content,
            language=t.language,
            changed_by=changed_by,
        )
        db.add(new_ver)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ServiceException(400, "Validation failed", "Template update conflicts with existing template name/language")

        vars_q = db.query(template_variable_model).filter(template_variable_model.template_id == t.id).all()
        vars_resp = [TemplateVariableResponse.model_validate(v) for v in vars_q] if vars_q else None
        return TemplateResponse.model_validate({**t.__dict__, "variables": vars_resp})

    @staticmethod
    def delete_template_by_id(db: Session, template_id: int) -> bool:
        t = db.query(template_model).filter(template_model.id == template_id).first()
        if not t:
            raise ServiceException(404, "NotFound", "Template not found")
        db.delete(t)
        db.commit()
        return True

    @staticmethod
    def update_template(db: Session, name: str, payload: TemplateUpdate, changed_by: Optional[str] = None) -> Optional[TemplateResponse]:
        t = db.query(template_model).filter(template_model.name == name, template_model.is_active == True).first()
        if not t:
            raise ServiceException(404, "NotFound", "Template not found")

        # store current as version
        ver = template_version_model(
            template_id=t.id,
            version=t.version,
            name=t.name,
            type=t.type,
            subject=t.subject,
            content=t.content,
            language=t.language,
            changed_by=changed_by,
        )
        db.add(ver)

        # apply updates
        updatable = ["name", "type", "subject", "content", "language"]
        for field in updatable:
            if getattr(payload, field, None) is not None:
                setattr(t, field, getattr(payload, field))

        # increment version
        t.version = t.version + 1

        # variables: replace if provided
        if payload.variables is not None:
            # remove existing
            db.query(template_variable_model).filter(template_variable_model.template_id == t.id).delete()
            for v in payload.variables:
                vv = template_variable_model(
                    template_id=t.id,
                    variable_name=v.variable_name,
                    description=v.description,
                    is_required=v.is_required,
                )
                db.add(vv)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ServiceException(400, "Validation failed", "Template name already exists for this language")
        db.refresh(t)

        # create new version entry for updated state
        new_ver = template_version_model(
            template_id=t.id,
            version=t.version,
            name=t.name,
            type=t.type,
            subject=t.subject,
            content=t.content,
            language=t.language,
            changed_by=changed_by,
        )
        db.add(new_ver)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ServiceException(400, "Validation failed", "Template update conflicts with existing template name/language")

        vars_q = db.query(template_variable_model).filter(template_variable_model.template_id == t.id).all()
        vars_resp = [TemplateVariableResponse.model_validate(v) for v in vars_q] if vars_q else None
        return TemplateResponse.model_validate({**t.__dict__, "variables": vars_resp})

    @staticmethod
    def delete_template(db: Session, name: str) -> bool:
        t = db.query(template_model).filter(template_model.name == name).first()
        if not t:
            raise ServiceException(404, "NotFound", "Template not found")
        db.delete(t)
        db.commit()
        return True

    @staticmethod
    def get_versions(db: Session, name: str, page: int = 1, limit: int = 10):
        tpl = db.query(template_model).filter(template_model.name == name).first()
        if not tpl:
            raise ServiceException(404, "NotFound", "Template not found")
        q = db.query(template_version_model).filter(template_version_model.template_id == tpl.id)
        total = q.count()
        skip = (page - 1) * limit
        items = q.order_by(template_version_model.changed_at.desc()).offset(skip).limit(limit).all()
        resp = [TemplateVersionResponse.model_validate(i) for i in items]
        total_pages = (total + limit - 1) // limit if total else 1
        meta = {"total": total, "limit": limit, "page": page, "total_pages": total_pages, "has_next": page < total_pages, "has_previous": page > 1}
        return resp, meta

    @staticmethod
    def render_template(db: Session, name: str, version: Optional[int], data: Dict[str, Any], language: Optional[str] = "en") -> Dict[str, Any]:
        """Render a template by name. If `version` is provided, render using that historical version.
        """
        t = db.query(template_model).filter(template_model.name == name, template_model.language == language, template_model.is_active == True).first()
        if not t:
            raise ServiceException(404, "NotFound", "Template not found")
        template_version = db.query(template_model).filter(
            template_model.version == version,
        ).first()
        if not template_version and version is not None:
            raise ServiceException(404, "NotFound", "Template version not found")
        # load template variables (for validation)
        vars_q = db.query(template_variable_model).filter(template_variable_model.template_id == t.id).all()
        required = [v.name for v in vars_q if v.is_required]
        missing = [r for r in required if r not in data]
        if missing:
            raise ServiceException(400, "Validation failed", f"Missing required variables: {', '.join(missing)}")

        # if a specific version is requested, fetch it from template_versions
        used_version = t.version
        subject_template = t.subject
        content_template = t.content
        used_type = t.type
        if version is not None:
            ver_row = db.query(template_version_model).filter(
                template_version_model.template_id == t.id,
                template_version_model.version == version,
            ).first()
            if not ver_row:
                raise ServiceException(404, "NotFound", "Template version not found")
            used_version = ver_row.version
            subject_template = ver_row.subject
            content_template = ver_row.content
            used_type = ver_row.type

        # render subject and content with jinja2
        rendered_subject = None
        if subject_template:
            rendered_subject = JinjaTemplate(subject_template).render(**data)
        rendered_content = JinjaTemplate(content_template).render(**data)

        # If the template type is 'push', ensure plain text (strip HTML tags).
        if used_type == "push":
            def strip_html(s: Optional[str]) -> Optional[str]:
                if s is None:
                    return None
                # simple tag stripper
                txt = re.sub(r'<[^>]+>', '', s)
                # collapse whitespace
                txt = re.sub(r'\s+', ' ', txt).strip()
                return txt

            rendered_subject = strip_html(rendered_subject)
            rendered_content = strip_html(rendered_content)

        # wrap it in a minimal HTML structure and convert URLs/newlines to clickable links/line breaks.
        if used_type == "email":
            has_html = bool(re.search(r'<[^>]+>', rendered_content or ""))
            if not has_html and rendered_content:
                def linkify(text: str) -> str:
                    # simple URL -> anchor conversion
                    return re.sub(r"(https?://[^\s]+)", r"<a href=\"\1\">\1</a>", text)

                content_html = linkify(rendered_content)
                content_html = content_html.replace('\n', '<br>')
                rendered_content = f"<!DOCTYPE html> <meta charset=\"UTF-8\"><title>{t.name}</title><body>{content_html}</body></html>"

        return {"subject": rendered_subject, "content": rendered_content, "version": used_version, "type": used_type}