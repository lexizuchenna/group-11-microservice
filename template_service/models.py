from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
    ForeignKey,
    func,
    UniqueConstraint,
)
from database import Base


class template_model(Base):
    __tablename__ = "templates"
    __table_args__ = (UniqueConstraint('name', 'language', name='uq_template_name_language'),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    type = Column(String(50), nullable=False, default="email")  
    subject = Column(String(512), nullable=True)
    body = Column(Text, nullable=False)
    language = Column(String(10), nullable=False, default="en")
    version = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class template_variable_model(Base):
    __tablename__ = "template_variables"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="CASCADE"), nullable=False, index=True)
    variable_name = Column(String(128), nullable=False)
    description = Column(String(512), nullable=True)
    is_required = Column(Boolean, nullable=False, default=False)


class template_version_model(Base):
    __tablename__ = "template_versions"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    subject = Column(String(512), nullable=True)
    body = Column(Text, nullable=False)
    language = Column(String(10), nullable=False, default="en")
    changed_by = Column(String(255), nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)