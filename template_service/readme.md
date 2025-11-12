# Template Service

This service manages notification templates (email and push), supports variable metadata, version history, rendering, and provides RESTful endpoints.

Features
- CRUD operations for templates
- Variable definitions and required-variable validation
- Template rendering (Jinja2)
- Version history tracking
- Pagination for listings
- Health check with database connectivity

Running locally (Docker Compose)

1. Copy `.env.example` to `.env` and update `DATABASE_URL` 
2. Build and start services:

```powershell
docker-compose up --build
```

3. Service will be available at http://localhost:8000

API Endpoints
- POST /api/v1/templates
- GET /api/v1/templates
- GET /api/v1/templates/{name}
- PUT /api/v1/templates/{name}
- DELETE /api/v1/templates/{name}
- POST /api/v1/templates/{name}/render
- GET /api/v1/templates/{name}/versions

Environment
- Configure `DATABASE_URL` via environment variable.

Development
- Install requirements: `pip install -r requirements.txt`
- Run with uvicorn: `uvicorn main:app --reload`

Notes
- This service uses SQLAlchemy and a simple SQL schema.
- Ensure the database is reachable and migrations (if any) are applied.
