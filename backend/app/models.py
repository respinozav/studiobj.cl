import os
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from app.config import settings
from app.database import Base

is_postgres = settings.DATABASE_URL.startswith("postgresql")

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type natively on AWS RDS, otherwise CHAR(36).
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(str(value))
        return value

schema_args = {"schema": "bdstudiobj"} if is_postgres else {}

class Rol(Base):
    __tablename__ = "roles"
    __table_args__ = schema_args

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(80), nullable=False, unique=True)
    descripcion = Column(Text, nullable=True)
    modulos = Column(Text, nullable=True, default="productos,categorias,colores")
    activo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    usuarios = relationship("Usuario", back_populates="rol")

class Color(Base):
    __tablename__ = "colores"
    __table_args__ = schema_args

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(80), nullable=False, unique=True)
    hex = Column(String(10), nullable=False)
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = schema_args

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    rol_id = Column(
        GUID(),
        ForeignKey("bdstudiobj.roles.id" if is_postgres else "roles.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False
    )
    nombre = Column(String(120), nullable=False)
    email = Column(String(160), nullable=False, unique=True, index=True)
    password_hash = Column(Text, nullable=False)
    activo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    rol = relationship("Rol", back_populates="usuarios")

class Categoria(Base):
    __tablename__ = "categorias"
    __table_args__ = schema_args

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    productos = relationship("Producto", back_populates="categoria")

class Producto(Base):
    __tablename__ = "productos"
    __table_args__ = schema_args

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    categoria_id = Column(
        GUID(),
        ForeignKey("bdstudiobj.categorias.id" if is_postgres else "categorias.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    nombre = Column(String(180), nullable=False)
    color = Column(String(80), nullable=False)
    talla = Column(String(60), nullable=False)  # Ej: 'XS,S,M,L,XL'
    imagen_base64 = Column(Text, nullable=False)
    precio = Column(Integer, nullable=False)
    precio_anterior = Column(Integer, nullable=True)
    etiqueta = Column(String(40), nullable=True)  # 'Top Ventas', 'Últimas unidades', 'Nuevo'
    descripcion = Column(Text, nullable=True)
    variantes = Column(Text, nullable=True)  # JSON serializado con variantes por color, imágenes y tallas
    activo = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    categoria = relationship("Categoria", back_populates="productos")

class HeroTemplate(Base):
    __tablename__ = "hero_templates"
    __table_args__ = schema_args

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(120), nullable=False)
    tag = Column(String(100), nullable=False, default="Edición Dark Luxury 2026")
    titulo_linea_1 = Column(String(150), nullable=False, default="Esculpe Tu Fuerza Con")
    titulo_linea_2 = Column(String(150), nullable=False, default="Elegancia Exclusiva")
    subtitulo = Column(Text, nullable=False, default="Prendas deportivas de compresión premium, tejidos transpirables y diseño sofisticado pensado para la mujer moderna en Chile.")
    boton_texto = Column(String(60), nullable=False, default="Ver Colección")
    es_predeterminada = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
