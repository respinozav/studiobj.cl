from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
import json

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: UUID
    nombre: str
    email: str
    rol: str
    rol_nombre: Optional[str] = None
    modulos: Optional[str] = None
    activo: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

# --- Roles Schemas ---
class RolBase(BaseModel):
    nombre: str = Field(..., max_length=80)
    descripcion: Optional[str] = None
    modulos: Optional[str] = "productos,categorias,colores"
    activo: bool = True

class RolCreate(RolBase):
    pass

class RolUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=80)
    descripcion: Optional[str] = None
    modulos: Optional[str] = None
    activo: Optional[bool] = None

class RolResponse(RolBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Usuarios Schemas ---
class UsuarioBase(BaseModel):
    rol_id: UUID
    nombre: str = Field(..., max_length=120)
    email: EmailStr
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6)

class UsuarioUpdate(BaseModel):
    rol_id: Optional[UUID] = None
    nombre: Optional[str] = Field(None, max_length=120)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    activo: Optional[bool] = None

class UsuarioResponse(BaseModel):
    id: UUID
    rol_id: UUID
    rol_nombre: Optional[str] = None
    nombre: str
    email: str
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Categorias Schemas ---
class CategoriaBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    descripcion: Optional[str] = None
    activo: bool = True

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

class CategoriaResponse(CategoriaBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Colores Schemas ---
class ColorBase(BaseModel):
    nombre: str = Field(..., max_length=80)
    hex: str = Field(..., max_length=10)
    descripcion: Optional[str] = None
    activo: bool = True

class ColorCreate(ColorBase):
    pass

class ColorUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=80)
    hex: Optional[str] = Field(None, max_length=10)
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

class ColorResponse(ColorBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Productos Schemas ---
class ProductoVarianteSchema(BaseModel):
    color: str = Field(..., max_length=80)
    color_hex: Optional[str] = None
    imagenes: List[str] = Field(default_factory=list)
    tallas: str = Field(..., max_length=60) # Ej: 'XS,S,M,L,XL'
    activo: Optional[bool] = True

class ProductoBase(BaseModel):
    categoria_id: UUID
    nombre: str = Field(..., max_length=180)
    color: str = Field(..., max_length=80)
    talla: str = Field(..., max_length=60)
    imagen_base64: str
    precio: int = Field(..., gt=0)
    precio_anterior: Optional[int] = None
    etiqueta: Optional[str] = Field(None, max_length=40)
    descripcion: Optional[str] = None
    variantes: Optional[List[ProductoVarianteSchema]] = None
    activo: bool = True

    @field_validator("imagen_base64")
    @classmethod
    def validate_image_base64(cls, v: str) -> str:
        valid_prefixes = (
            "data:image/webp;base64,",
            "data:image/jpeg;base64,",
            "data:image/png;base64,"
        )
        if not any(v.startswith(prefix) for prefix in valid_prefixes):
            raise ValueError("imagen_base64 debe iniciar con data:image/webp;base64,, data:image/jpeg;base64, o data:image/png;base64,")
        if len(v) > 650_000:
            raise ValueError("imagen_base64 excede el límite máximo permitido de 650,000 caracteres (~500 KB)")
        return v

    @field_validator("precio_anterior")
    @classmethod
    def validate_precio_anterior(cls, v: Optional[int], values) -> Optional[int]:
        if v is not None and "precio" in values.data and v < values.data["precio"]:
            raise ValueError("precio_anterior no puede ser menor al precio actual")
        return v

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    categoria_id: Optional[UUID] = None
    nombre: Optional[str] = Field(None, max_length=180)
    color: Optional[str] = Field(None, max_length=80)
    talla: Optional[str] = Field(None, max_length=60)
    imagen_base64: Optional[str] = None
    precio: Optional[int] = Field(None, gt=0)
    precio_anterior: Optional[int] = None
    etiqueta: Optional[str] = Field(None, max_length=40)
    descripcion: Optional[str] = None
    variantes: Optional[List[ProductoVarianteSchema]] = None
    activo: Optional[bool] = None

    @field_validator("imagen_base64")
    @classmethod
    def validate_image_base64(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_prefixes = (
            "data:image/webp;base64,",
            "data:image/jpeg;base64,",
            "data:image/png;base64,"
        )
        if not any(v.startswith(prefix) for prefix in valid_prefixes):
            raise ValueError("imagen_base64 debe iniciar con data:image/webp;base64,, data:image/jpeg;base64, o data:image/png;base64,")
        if len(v) > 650_000:
            raise ValueError("imagen_base64 excede el límite máximo de 650,000 caracteres (~500 KB)")
        return v

class ProductoResponse(BaseModel):
    id: UUID
    categoria_id: UUID
    categoria_nombre: Optional[str] = None
    nombre: str
    color: str
    talla: str
    imagen_base64: str
    precio: int
    precio_anterior: Optional[int] = None
    etiqueta: Optional[str] = None
    descripcion: Optional[str] = None
    variantes: Optional[List[ProductoVarianteSchema]] = None
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Patch Estado Schema ---
class EstadoUpdate(BaseModel):
    activo: bool

# --- Hero Templates Schemas ---
class HeroTemplateBase(BaseModel):
    nombre: str = Field(..., max_length=120)
    tag: str = Field(..., max_length=100)
    titulo_linea_1: str = Field(..., max_length=150)
    titulo_linea_2: str = Field(..., max_length=150)
    subtitulo: str
    boton_texto: str = Field(default="Ver Colección", max_length=60)
    es_predeterminada: bool = False
    imagenes_fondo: Optional[List[str]] = Field(default_factory=list)

class HeroTemplateCreate(HeroTemplateBase):
    pass

class HeroTemplateUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=120)
    tag: Optional[str] = Field(None, max_length=100)
    titulo_linea_1: Optional[str] = Field(None, max_length=150)
    titulo_linea_2: Optional[str] = Field(None, max_length=150)
    subtitulo: Optional[str] = None
    boton_texto: Optional[str] = Field(None, max_length=60)
    es_predeterminada: Optional[bool] = None
    imagenes_fondo: Optional[List[str]] = None

class HeroTemplateResponse(HeroTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    @field_validator("imagenes_fondo", mode="before")
    @classmethod
    def parse_imagenes_fondo(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return []
        if isinstance(v, list):
            return v
        return []

    class Config:
        from_attributes = True
