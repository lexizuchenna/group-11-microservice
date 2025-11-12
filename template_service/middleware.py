import time
import uuid
from fastapi import FastAPI, Request, HTTPException
from template_service.logger import get_logger

app = FastAPI()
logger = get_logger(__name__)

@app.middleware("http")
async def add_request_id_and_process_time(request: Request, call_next):
    # Generate unique request ID
    request_id = str(uuid.uuid4()).replace('-', '')[:10]
    
    # Add request ID to request state for access in route handlers
    request.state.request_id = request_id
    
    # Log incoming request with ID
    logger.info(
        f"Request {request_id}: {request.method} {request.url.path} "
        f"from {request.client.host if request.client else 'unknown'}"
    )
    
    # Track processing time
    start_time = time.perf_counter()
    
    try:
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        
        # Add headers to response
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log successful response
        logger.info(
            f"Request {request_id}: Completed {response.status_code} "
            f"in {process_time:.4f}s"
        )
        
        return response
        
    except Exception as e:
        process_time = time.perf_counter() - start_time
        
        # Log error with request ID
        logger.error(
            f"Request {request_id}: Error after {process_time:.4f}s - {str(e)}"
        )
        
        # Re-raise the exception to let FastAPI handle it
        raise