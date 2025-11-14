from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from logger import logger
from database import engine, Base, SessionLocal
from routes import router as templates_router
from sqlalchemy import text

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Template Service", version="1.0.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)
Instrumentator().instrument(app).expose(app)

app.include_router(templates_router, tags=["templates"])


@app.get("/health")
def health_check():
  logger.info("Health check performed")
  db_ok = False
  try:
    db = SessionLocal()
    # run a light query
    db.execute(text("SELECT 1"))
    db_ok = True
  except Exception as e:
    logger.exception("Database health check failed")
    db_ok = False
  finally:
    try:
      db.close()
    except Exception:
      pass

  return {
    "success": True,
    "data": {"status": "ok", "db_connected": db_ok},
    "error": None,
    "message": "Template service running",
    "meta": None,
  }


@app.get("/")
def read_root():
  logger.info("Root endpoint accessed")
  return {
    "success": True,
    "data": {"message": "Welcome to the Template Microservice"},
    "error": None,
    "meta": None,
  }