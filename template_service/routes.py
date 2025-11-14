from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from database import get_db
from sqlalchemy.orm import Session
from services import TemplateService
from services import ServiceException
from schemas import (
	RenderResponse,
	TemplateCreate,
	TemplateUpdate,
	APIResponse,
	APIErrorResponse,
	PaginationMeta,
	RenderRequest,
)
from logger import logger
from fastapi.responses import JSONResponse

router = APIRouter()


@router.post("/api/v1/templates", status_code=status.HTTP_201_CREATED)
def create_template(payload: TemplateCreate, db: Session = Depends(get_db)):
	try:
		tpl = TemplateService.create_template(db, payload)
		# return data object with id inside payload (id as string to match API contract)
		tpl_dict = tpl.model_dump() if hasattr(tpl, 'model_dump') else dict(tpl)
		if 'id' in tpl_dict:
			tpl_dict['id'] = str(tpl_dict['id'])
		return APIResponse(success=True, data=tpl_dict, error=None, message="Template created successfully", meta=None)
	except ServiceException as se:
		err = APIErrorResponse.model_validate({"success": False, "error": se.error, "message": se.message, "meta": {}})
		return JSONResponse(status_code=se.status_code, content=err.model_dump())
	except Exception as e:
		logger.exception("Error creating template")
		err = APIErrorResponse.model_validate({"success": False, "error": "InternalServerError", "message": "Internal server error", "meta": {}})
		return JSONResponse(status_code=500, content=err.model_dump())


@router.get("/api/v1/templates")
def list_templates(page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100), search: Optional[str] = None, db: Session = Depends(get_db)):
	try:
		items, meta = TemplateService.list_templates(db, page=page, limit=limit, search=search)
		# Normalize items to list of plain dicts and ensure id is string
		out_items = []
		for it in items:
			it_dict = it.model_dump() if hasattr(it, 'model_dump') else dict(it)
			if 'id' in it_dict:
				it_dict['id'] = str(it_dict['id'])
			# include only the public fields expected by clients
			public = {k: it_dict.get(k) for k in ('id', 'name', 'type', 'subject', 'content','version')}
			out_items.append(public)
		return APIResponse(success=True, data=out_items, error=None, message="Templates fetched successfully", meta=PaginationMeta.model_validate(meta))
	except ServiceException as se:
		err = APIErrorResponse.model_validate({"success": False, "error": se.error, "message": se.message, "meta": {}})
		return JSONResponse(status_code=se.status_code, content=err.model_dump())


@router.get("/api/v1/templates/{name}")
def get_template(name: str, db: Session = Depends(get_db)):
	try:
		tpl = TemplateService.get_template_by_name(db, name)
		if not tpl:
			raise HTTPException(status_code=404, detail="Template not found")
		tpl_dict = tpl.model_dump() if hasattr(tpl, 'model_dump') else dict(tpl)
		if 'id' in tpl_dict:
			tpl_dict['id'] = str(tpl_dict['id'])
		public = {k: tpl_dict.get(k) for k in ('id', 'name', 'type', 'subject', 'body')}
		return APIResponse(success=True, data=public, error=None, message="Template retrieved successfully", meta=None)
	except ServiceException as se:
		err = APIErrorResponse.model_validate({"success": False, "error": se.error, "message": se.message, "meta": {}})
		return JSONResponse(status_code=se.status_code, content=err.model_dump())
	except Exception as e:
		logger.exception("Error retrieving template")
		err = APIErrorResponse.model_validate({"success": False, "error": "InternalServerError", "message": "Internal server error", "meta": {}})
		return JSONResponse(status_code=500, content=err.model_dump())


@router.put("/api/v1/templates/{name}")
def update_template(name: str, payload: TemplateUpdate, db: Session = Depends(get_db)):
	try:
		tpl = TemplateService.update_template(db, name, payload)
		tpl_dict = tpl.model_dump() if hasattr(tpl, 'model_dump') else dict(tpl)
		if 'id' in tpl_dict:
			tpl_dict['id'] = str(tpl_dict['id'])
		public = {k: tpl_dict.get(k) for k in ('id', 'name', 'type', 'subject', 'body')}
		return APIResponse(success=True, data=public, error=None, message="Template updated successfully", meta=None)
	except ServiceException as se:
		err = APIErrorResponse.model_validate({"success": False, "error": se.error, "message": se.message, "meta": {}})
		return JSONResponse(status_code=se.status_code, content=err.model_dump())
	except Exception as e:
		logger.exception("Error updating template")
		err = APIErrorResponse.model_validate({"success": False, "error": "InternalServerError", "message": "Internal server error", "meta": {}})
		return JSONResponse(status_code=500, content=err.model_dump())


@router.delete("/api/v1/templates/{name}")
def delete_template(name: str, db: Session = Depends(get_db)):
	try:
		ok = TemplateService.delete_template(db, name)
		return APIResponse(success=True, data=None, error=None, message="Template deleted successfully", meta=None)
	except ServiceException as se:
		err = APIErrorResponse.model_validate({"success": False, "error": se.error, "message": se.message, "meta": {}})
		return JSONResponse(status_code=se.status_code, content=err.model_dump())
	except Exception as e:
		logger.exception("Error deleting template")
		err = APIErrorResponse.model_validate({"success": False, "error": "InternalServerError", "message": "Internal server error", "meta": {}})
		return JSONResponse(status_code=500, content=err.model_dump())


@router.get("/api/v1/templates/id/{template_id}")
def get_template_by_id(template_id: int, db: Session = Depends(get_db)):
	try:
		tpl = TemplateService.get_template_by_id(db, template_id)
		tpl_dict = tpl.model_dump() if hasattr(tpl, 'model_dump') else dict(tpl)
		if 'id' in tpl_dict:
			tpl_dict['id'] = str(tpl_dict['id'])
		public = {k: tpl_dict.get(k) for k in ('id', 'name', 'type', 'subject', 'body')}
		return APIResponse(success=True, data=public, error=None, message="Template retrieved successfully", meta=None)
	except ServiceException as se:
		err = APIErrorResponse.model_validate({"success": False, "error": se.error, "message": se.message, "meta": {}})
		return JSONResponse(status_code=se.status_code, content=err.model_dump())
	except Exception as e:
		logger.exception("Error retrieving template by id")
		err = APIErrorResponse.model_validate({"success": False, "error": "InternalServerError", "message": "Internal server error", "meta": {}})
		return JSONResponse(status_code=500, content=err.model_dump())


@router.put("/api/v1/templates/id/{template_id}")
def update_template_by_id(template_id: int, payload: TemplateUpdate, db: Session = Depends(get_db)):
	try:
		tpl = TemplateService.update_template_by_id(db, template_id, payload)
		tpl_dict = tpl.model_dump() if hasattr(tpl, 'model_dump') else dict(tpl)
		if 'id' in tpl_dict:
			tpl_dict['id'] = str(tpl_dict['id'])
		public = {k: tpl_dict.get(k) for k in ('id', 'name', 'type', 'subject', 'body')}
		return APIResponse(success=True, data=public, error=None, message="Template updated successfully", meta=None)
	except ServiceException as se:
		err = APIErrorResponse.model_validate({"success": False, "error": se.error, "message": se.message, "meta": {}})
		return JSONResponse(status_code=se.status_code, content=err.model_dump())
	except Exception as e:
		logger.exception("Error updating template by id")
		err = APIErrorResponse.model_validate({"success": False, "error": "InternalServerError", "message": "Internal server error", "meta": {}})
		return JSONResponse(status_code=500, content=err.model_dump())


@router.delete("/api/v1/templates/id/{template_id}")
def delete_template_by_id(template_id: int, db: Session = Depends(get_db)):
	try:
		ok = TemplateService.delete_template_by_id(db, template_id)
		return APIResponse(success=True, data=None, error=None, message="Template deleted successfully", meta=None)
	except ServiceException as se:
		err = APIErrorResponse.model_validate({"success": False, "error": se.error, "message": se.message, "meta": {}})
		return JSONResponse(status_code=se.status_code, content=err.model_dump())
	except Exception as e:
		logger.exception("Error deleting template by id")
		err = APIErrorResponse.model_validate({"success": False, "error": "InternalServerError", "message": "Internal server error", "meta": {}})
		return JSONResponse(status_code=500, content=err.model_dump())


@router.post("/api/v1/templates/render")
def render_template_by_name(payload: RenderRequest, db: Session = Depends(get_db)):
	"""Render a template by name.
	Request example:
	  { "name": "welcome_email", "version": 2, "variables": { ... } }
	"""
	try:
		rendered = TemplateService.render_template(db, payload.name, getattr(payload, "version", None), getattr(payload, "variables", {}))
		return APIResponse(success=True, data=rendered, error=None, message="Template rendered successfully", meta=None)
	except ServiceException as se:
		# if template or version missing
		if se.status_code == 404:
			msg = se.message or "Template not found"
			if "version" in msg.lower():
				return JSONResponse(status_code=404, content={"success": False, "error": f"Template '{payload.name}' version '{getattr(payload, 'version', None)}' not found."})
			return JSONResponse(status_code=404, content={"success": False, "error": f"Template '{payload.name}' not found."})
		err = APIErrorResponse.model_validate({"success": False, "error": se.error, "message": se.message, "meta": {}})
		return JSONResponse(status_code=se.status_code, content=err.model_dump())
	except Exception:
		logger.exception("Error rendering template by name")
		err = APIErrorResponse.model_validate({"success": False, "error": "InternalServerError", "message": "Internal server error", "meta": {}})
		return JSONResponse(status_code=500, content=err.model_dump())


@router.get("/api/v1/templates/{name}/versions")
def template_versions(name: str, page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
	try:
		versions, meta = TemplateService.get_versions(db, name, page=page, limit=limit)
		return APIResponse(success=True, data=versions, error=None, message="Template versions fetched", meta=PaginationMeta.model_validate(meta))
	except ServiceException as se:
		err = APIErrorResponse.model_validate({"success": False, "error": se.error, "message": se.message, "meta": {}})
		return JSONResponse(status_code=se.status_code, content=err.model_dump())
	except Exception:
		logger.exception("Error fetching template versions")
		err = APIErrorResponse.model_validate({"success": False, "error": "InternalServerError", "message": "Internal server error", "meta": {}})
		return JSONResponse(status_code=500, content=err.model_dump())

