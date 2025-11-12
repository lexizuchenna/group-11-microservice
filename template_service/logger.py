import logging
import os

log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, log_level, logging.INFO),
format="%(levelname)s - %(filename)s - %(asctime)s - %(name)s- %(message)s",
handlers=[logging.StreamHandler()])

logger = logging.getLogger(__name__)

def get_logger(filename: str) -> logging.Logger:
    return logging.getLogger(filename)