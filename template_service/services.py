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
            body=payload.body,
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
                    variable_name=v.variable_name,
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
            body=tpl.body,
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
            body=t.body,
            language=t.language,
            changed_by=changed_by,
        )
        db.add(ver)

        # apply updates
        updatable = ["name", "type", "subject", "body", "language"]
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
            body=t.body,
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
        t = db.query(template_model).filter(template_model.name == name, template_model.is_active == True).first()
        if not t:
            raise ServiceException(404, "NotFound", "Template not found")
        # soft delete
        t.is_active = False
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
    def render_template(db: Session, name: str, data: Dict[str, Any], language: Optional[str] = "en") -> Dict[str, Any]:
        t = db.query(template_model).filter(template_model.name == name, template_model.language == language, template_model.is_active == True).first()
        if not t:
            raise ServiceException(404, "NotFound", "Template not found")

        vars_q = db.query(template_variable_model).filter(template_variable_model.template_id == t.id).all()
        required = [v.variable_name for v in vars_q if v.is_required]
        missing = [r for r in required if r not in data]
        if missing:
            raise ServiceException(400, "Validation failed", f"Missing required variables: {', '.join(missing)}")

        # render subject and body with jinja2
        rendered_subject = None
        if t.subject:
            rendered_subject = JinjaTemplate(t.subject).render(**data)
        rendered_body = JinjaTemplate(t.body).render(**data)
        return {"subject": rendered_subject, "body": rendered_body}