from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List
from app.database import get_db
from app.models import Categoria, Producto, Color, HeroTemplate
from app.schemas import CategoriaResponse, ProductoResponse, ColorResponse, HeroTemplateResponse
from app.routers.admin_hero import get_or_seed_default_hero

router = APIRouter(prefix="/public", tags=["Catálogo Público"])

@router.get("/hero", response_model=HeroTemplateResponse)
def get_public_hero(db: Session = Depends(get_db)):
    """Retorna la plantilla de portada / hero activa para la tienda pública"""
    return get_or_seed_default_hero(db)

@router.get("/colores", response_model=List[ColorResponse])
def get_public_colores(db: Session = Depends(get_db)):
    """Retorna únicamente colores de la marca activos"""
    return db.query(Color).filter(Color.activo == True).order_by(Color.nombre.asc()).all()

@router.get("/categorias", response_model=List[CategoriaResponse])
def get_public_categorias(db: Session = Depends(get_db)):
    """Retorna únicamente categorías activas ordenadas alfabéticamente"""
    categorias = (
        db.query(Categoria)
        .filter(Categoria.activo == True)
        .order_by(Categoria.nombre.asc())
        .all()
    )
    return categorias

@router.get("/productos", response_model=List[ProductoResponse])
def get_public_productos(
    categoria_id: Optional[UUID] = Query(None, description="Filtrar por ID de categoría"),
    db: Session = Depends(get_db)
):
    """
    Retorna únicamente productos activos cuya categoría también se encuentre activa.
    Soporta filtro opcional por categoria_id.
    """
    query = (
        db.query(Producto)
        .join(Categoria, Producto.categoria_id == Categoria.id)
        .filter(Producto.activo == True, Categoria.activo == True)
    )

    if categoria_id:
        query = query.filter(Producto.categoria_id == categoria_id)

    productos = query.order_by(Producto.created_at.desc()).all()

    def get_etiqueta_priority(etiqueta: Optional[str]) -> int:
        if not etiqueta:
            return 4
        norm = etiqueta.lower().strip()
        norm = norm.replace("ú", "u").replace("é", "e").replace("á", "a").replace("ó", "o").replace("í", "i")
        if "top" in norm:
            return 1
        if "ultima" in norm:
            return 2
        if "nuevo" in norm:
            return 3
        return 4

    # Ordenar según prioridad CRO para cliente: 1. Top Ventas, 2. Últimas unidades, 3. Nuevo, 4. Resto
    productos.sort(
        key=lambda p: (
            get_etiqueta_priority(p.etiqueta),
            -(p.created_at.timestamp() if p.created_at else 0)
        )
    )

    import json
    response = []
    for p in productos:
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

        prod_data = ProductoResponse(
            id=p.id,
            categoria_id=p.categoria_id,
            categoria_nombre=p.categoria.nombre if p.categoria else None,
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
        response.append(prod_data)

    return response
