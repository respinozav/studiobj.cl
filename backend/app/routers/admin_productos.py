from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database import get_db
from app.models import Producto, Categoria
from app.schemas import ProductoCreate, ProductoUpdate, ProductoResponse, EstadoUpdate
from app.dependencies import require_role

router = APIRouter(prefix="/admin/productos", tags=["Admin Productos"])

admin_required = require_role(["Admin"])

def format_producto_response(p: Producto, cat_nombre: str = None) -> ProductoResponse:
    import json
    variantes_list = None
    if p.variantes:
        try:
            variantes_list = json.loads(p.variantes)
        except Exception:
            variantes_list = None
    if not variantes_list:
        variantes_list = [
            {
                "color": p.color,
                "color_hex": None,
                "imagenes": [p.imagen_base64] if p.imagen_base64 else [],
                "tallas": p.talla
            }
        ]

    return ProductoResponse(
        id=p.id,
        categoria_id=p.categoria_id,
        categoria_nombre=cat_nombre or (p.categoria.nombre if p.categoria else None),
        nombre=p.nombre,
        color=p.color,
        talla=p.talla,
        imagen_base64=p.imagen_base64,
        precio=p.precio,
        precio_anterior=p.precio_anterior,
        etiqueta=p.etiqueta,
        descripcion=p.descripcion,
        variantes=variantes_list,
        activo=p.activo,
        created_at=p.created_at,
        updated_at=p.updated_at
    )

@router.get("", response_model=List[ProductoResponse])
def list_productos(db: Session = Depends(get_db), _=Depends(admin_required)):
    """Lista todos los productos (activos e inactivos)"""
    productos = db.query(Producto).order_by(Producto.created_at.desc()).all()
    return [format_producto_response(p) for p in productos]

@router.post("", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def create_producto(data: ProductoCreate, db: Session = Depends(get_db), _=Depends(admin_required)):
    import json
    # Validar que exista la categoría
    categoria = db.query(Categoria).filter(Categoria.id == data.categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="La categoría especificada no existe")

    variantes_json = None
    if data.variantes:
        variantes_json = json.dumps([v.model_dump() for v in data.variantes])

    producto = Producto(
        categoria_id=data.categoria_id,
        nombre=data.nombre.strip(),
        color=data.color.strip(),
        talla=data.talla.strip(),
        imagen_base64=data.imagen_base64,
        precio=data.precio,
        precio_anterior=data.precio_anterior,
        etiqueta=data.etiqueta.strip() if data.etiqueta else None,
        descripcion=data.descripcion.strip() if data.descripcion else None,
        variantes=variantes_json,
        activo=data.activo
    )
    db.add(producto)
    db.commit()
    db.refresh(producto)

    return format_producto_response(producto, categoria.nombre)

@router.put("/{id}", response_model=ProductoResponse)
def update_producto(id: UUID, data: ProductoUpdate, db: Session = Depends(get_db), _=Depends(admin_required)):
    import json
    producto = db.query(Producto).filter(Producto.id == id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if data.categoria_id is not None:
        cat = db.query(Categoria).filter(Categoria.id == data.categoria_id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        producto.categoria_id = data.categoria_id

    if data.nombre is not None:
        producto.nombre = data.nombre.strip()
    if data.color is not None:
        producto.color = data.color.strip()
    if data.talla is not None:
        producto.talla = data.talla.strip()
    if data.imagen_base64 is not None:
        producto.imagen_base64 = data.imagen_base64
    if data.precio is not None:
        producto.precio = data.precio
    if data.precio_anterior is not None:
        producto.precio_anterior = data.precio_anterior
    if data.etiqueta is not None:
        producto.etiqueta = data.etiqueta.strip() if data.etiqueta else None
    if data.descripcion is not None:
        producto.descripcion = data.descripcion.strip() if data.descripcion else None
    if data.variantes is not None:
        producto.variantes = json.dumps([v.model_dump() for v in data.variantes])
    if data.activo is not None:
        producto.activo = data.activo

    db.commit()
    db.refresh(producto)

    return format_producto_response(producto)

@router.patch("/{id}/estado", response_model=ProductoResponse)
def patch_estado_producto(id: UUID, data: EstadoUpdate, db: Session = Depends(get_db), _=Depends(admin_required)):
    """Soft-delete / reactivación (NUNCA DELETE físico)"""
    producto = db.query(Producto).filter(Producto.id == id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    producto.activo = data.activo
    db.commit()
    db.refresh(producto)

    return format_producto_response(producto)
