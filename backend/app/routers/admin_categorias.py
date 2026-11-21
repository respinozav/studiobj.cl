from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database import get_db
from app.models import Categoria
from app.schemas import CategoriaCreate, CategoriaUpdate, CategoriaResponse, EstadoUpdate
from app.dependencies import require_role

router = APIRouter(prefix="/admin/categorias", tags=["Admin Categorías"])

admin_required = require_role(["Admin"])

@router.get("", response_model=List[CategoriaResponse])
def list_categorias(db: Session = Depends(get_db), _=Depends(admin_required)):
    """Lista todas las categorías (activas e inactivas)"""
    return db.query(Categoria).order_by(Categoria.nombre.asc()).all()

@router.post("", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def create_categoria(data: CategoriaCreate, db: Session = Depends(get_db), _=Depends(admin_required)):
    existe = db.query(Categoria).filter(Categoria.nombre.ilike(data.nombre.strip())).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe una categoría con este nombre")
    categoria = Categoria(
        nombre=data.nombre.strip(),
        descripcion=data.descripcion,
        activo=data.activo
    )
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria

@router.put("/{id}", response_model=CategoriaResponse)
def update_categoria(id: UUID, data: CategoriaUpdate, db: Session = Depends(get_db), _=Depends(admin_required)):
    categoria = db.query(Categoria).filter(Categoria.id == id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    if data.nombre is not None:
        nombre_clean = data.nombre.strip()
        existe = db.query(Categoria).filter(Categoria.nombre.ilike(nombre_clean), Categoria.id != id).first()
        if existe:
            raise HTTPException(status_code=400, detail="Ya existe otra categoría con este nombre")
        categoria.nombre = nombre_clean
    if data.descripcion is not None:
        categoria.descripcion = data.descripcion
    if data.activo is not None:
        categoria.activo = data.activo

    db.commit()
    db.refresh(categoria)
    return categoria

@router.patch("/{id}/estado", response_model=CategoriaResponse)
def patch_estado_categoria(id: UUID, data: EstadoUpdate, db: Session = Depends(get_db), _=Depends(admin_required)):
    """Soft-delete / reactivación (NUNCA DELETE físico)"""
    categoria = db.query(Categoria).filter(Categoria.id == id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    categoria.activo = data.activo
    db.commit()
    db.refresh(categoria)
    return categoria
