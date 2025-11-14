from flask_sqlalchemy import SQLAlchemy
# from redis import Redis
from flasgger import Swagger

db = SQLAlchemy()
redis_client = None  # will initialize in create_app
swagger = Swagger()
