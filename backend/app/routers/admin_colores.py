from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database import get_db
from app.models import Color
from app.schemas import ColorCreate, ColorUpdate, ColorResponse, EstadoUpdate
from app.dependencies import require_role

router = APIRouter(prefix="/admin/colores", tags=["Admin Colores"])

admin_required = require_role(["Admin"])

@router.get("", response_model=List[ColorResponse])
def list_colores(db: Session = Depends(get_db), _=Depends(admin_required)):
    """Lista todos los colores de la marca (activos e inactivos)"""
    return db.query(Color).order_by(Color.nombre.asc()).all()

@router.post("", response_model=ColorResponse, status_code=status.HTTP_201_CREATED)
def create_color(data: ColorCreate, db: Session = Depends(get_db), _=Depends(admin_required)):
    nombre_clean = data.nombre.strip()
    existe = db.query(Color).filter(Color.nombre.ilike(nombre_clean)).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un color con este nombre")

    color = Color(
        nombre=nombre_clean,
        hex=data.hex.strip(),
        descripcion=data.descripcion.strip() if data.descripcion else None,
        activo=data.activo
    )
    db.add(color)
    db.commit()
    db.refresh(color)
    return color

@router.put("/{id}", response_model=ColorResponse)
def update_color(id: UUID, data: ColorUpdate, db: Session = Depends(get_db), _=Depends(admin_required)):
    color = db.query(Color).filter(Color.id == id).first()
    if not color:
        raise HTTPException(status_code=404, detail="Color no encontrado")

    if data.nombre is not None:
        nombre_clean = data.nombre.strip()
        existe = db.query(Color).filter(Color.nombre.ilike(nombre_clean), Color.id != id).first()
        if existe:
            raise HTTPException(status_code=400, detail="Ya existe otro color con este nombre")
        color.nombre = nombre_clean

    if data.hex is not None:
        color.hex = data.hex.strip()

    if data.descripcion is not None:
        color.descripcion = data.descripcion.strip() if data.descripcion else None

    if data.activo is not None:
        color.activo = data.activo

    db.commit()
    db.refresh(color)
    return color

@router.patch("/{id}/estado", response_model=ColorResponse)
def patch_estado_color(id: UUID, data: EstadoUpdate, db: Session = Depends(get_db), _=Depends(admin_required)):
    """Soft-delete / reactivación (NUNCA DELETE físico)"""
    color = db.query(Color).filter(Color.id == id).first()
    if not color:
        raise HTTPException(status_code=404, detail="Color no encontrado")
    color.activo = data.activo
    db.commit()
    db.refresh(color)
    return color
