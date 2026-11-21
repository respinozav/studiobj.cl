from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database import get_db
from app.models import Rol
from app.schemas import RolCreate, RolUpdate, RolResponse, EstadoUpdate
from app.dependencies import require_module_or_superadmin

router = APIRouter(prefix="/admin/roles", tags=["Admin Roles (Super Admin)"])

super_admin_required = require_module_or_superadmin("roles")

@router.get("", response_model=List[RolResponse])
def list_roles(db: Session = Depends(get_db), _=Depends(super_admin_required)):
    return db.query(Rol).order_by(Rol.nombre.asc()).all()

@router.post("", response_model=RolResponse, status_code=status.HTTP_201_CREATED)
def create_rol(data: RolCreate, db: Session = Depends(get_db), _=Depends(super_admin_required)):
    nombre_clean = data.nombre.strip()
    existe = db.query(Rol).filter(Rol.nombre.ilike(nombre_clean)).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un rol con este nombre")

    rol = Rol(
        nombre=nombre_clean,
        descripcion=data.descripcion.strip() if data.descripcion else None,
        modulos=data.modulos.strip() if data.modulos else "productos,categorias,colores",
        activo=data.activo
    )
    db.add(rol)
    db.commit()
    db.refresh(rol)
    return rol

@router.put("/{id}", response_model=RolResponse)
def update_rol(id: UUID, data: RolUpdate, db: Session = Depends(get_db), _=Depends(super_admin_required)):
    rol = db.query(Rol).filter(Rol.id == id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    if data.nombre is not None:
        nombre_clean = data.nombre.strip()
        existe = db.query(Rol).filter(Rol.nombre.ilike(nombre_clean), Rol.id != id).first()
        if existe:
            raise HTTPException(status_code=400, detail="Ya existe otro rol con este nombre")
        rol.nombre = nombre_clean

    if data.descripcion is not None:
        rol.descripcion = data.descripcion.strip() if data.descripcion else None

    if data.modulos is not None:
        rol.modulos = data.modulos.strip()

    if data.activo is not None:
        rol.activo = data.activo

    db.commit()
    db.refresh(rol)
    return rol

@router.patch("/{id}/estado", response_model=RolResponse)
def patch_estado_rol(id: UUID, data: EstadoUpdate, db: Session = Depends(get_db), _=Depends(super_admin_required)):
    rol = db.query(Rol).filter(Rol.id == id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    rol.activo = data.activo
    db.commit()
    db.refresh(rol)
    return rol
