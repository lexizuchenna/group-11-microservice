from flask_sqlalchemy import SQLAlchemy
# from redis import Redis
from flasgger import Swagger

db = SQLAlchemy()
# TODO: Initializing the redis_client in the create_app
redis_client = None  # will initialize in create_app
swagger = Swagger()
