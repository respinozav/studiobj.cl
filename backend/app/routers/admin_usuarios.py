from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database import get_db
from app.models import Usuario, Rol
from app.schemas import UsuarioCreate, UsuarioUpdate, UsuarioResponse, EstadoUpdate
from app.security import hash_password
from app.dependencies import require_module_or_superadmin

router = APIRouter(prefix="/admin/usuarios", tags=["Admin Usuarios (Super Admin)"])

super_admin_required = require_module_or_superadmin("usuarios")

@router.get("", response_model=List[UsuarioResponse])
def list_usuarios(db: Session = Depends(get_db), _=Depends(super_admin_required)):
    usuarios = db.query(Usuario).order_by(Usuario.created_at.desc()).all()
    res = []
    for u in usuarios:
        res.append(UsuarioResponse(
            id=u.id,
            rol_id=u.rol_id,
            rol_nombre=u.rol.nombre if u.rol else None,
            nombre=u.nombre,
            email=u.email,
            activo=u.activo,
            created_at=u.created_at,
            updated_at=u.updated_at
        ))
    return res

@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_usuario(data: UsuarioCreate, db: Session = Depends(get_db), _=Depends(super_admin_required)):
    email_clean = data.email.lower().strip()
    existe = db.query(Usuario).filter(Usuario.email == email_clean).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con este email")

    rol = db.query(Rol).filter(Rol.id == data.rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="El rol especificado no existe")

    hashed = hash_password(data.password)
    usuario = Usuario(
        rol_id=data.rol_id,
        nombre=data.nombre.strip(),
        email=email_clean,
        password_hash=hashed,
        activo=data.activo
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return UsuarioResponse(
        id=usuario.id,
        rol_id=usuario.rol_id,
        rol_nombre=rol.nombre,
        nombre=usuario.nombre,
        email=usuario.email,
        activo=usuario.activo,
        created_at=usuario.created_at,
        updated_at=usuario.updated_at
    )

@router.put("/{id}", response_model=UsuarioResponse)
def update_usuario(id: UUID, data: UsuarioUpdate, db: Session = Depends(get_db), _=Depends(super_admin_required)):
    usuario = db.query(Usuario).filter(Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.rol_id is not None:
        rol = db.query(Rol).filter(Rol.id == data.rol_id).first()
        if not rol:
            raise HTTPException(status_code=404, detail="Rol no encontrado")
        usuario.rol_id = data.rol_id

    if data.email is not None:
        email_clean = data.email.lower().strip()
        existe = db.query(Usuario).filter(Usuario.email == email_clean, Usuario.id != id).first()
        if existe:
            raise HTTPException(status_code=400, detail="Ya existe otro usuario con este email")
        usuario.email = email_clean

    if data.nombre is not None:
        usuario.nombre = data.nombre.strip()

    if data.password:
        usuario.password_hash = hash_password(data.password)

    if data.activo is not None:
        usuario.activo = data.activo

    db.commit()
    db.refresh(usuario)

    return UsuarioResponse(
        id=usuario.id,
        rol_id=usuario.rol_id,
        rol_nombre=usuario.rol.nombre if usuario.rol else None,
        nombre=usuario.nombre,
        email=usuario.email,
        activo=usuario.activo,
        created_at=usuario.created_at,
        updated_at=usuario.updated_at
    )

@router.patch("/{id}/estado", response_model=UsuarioResponse)
def patch_estado_usuario(id: UUID, data: EstadoUpdate, db: Session = Depends(get_db), _=Depends(super_admin_required)):
    usuario = db.query(Usuario).filter(Usuario.id == id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.activo = data.activo
    db.commit()
    db.refresh(usuario)

    return UsuarioResponse(
        id=usuario.id,
        rol_id=usuario.rol_id,
        rol_nombre=usuario.rol.nombre if usuario.rol else None,
        nombre=usuario.nombre,
        email=usuario.email,
        activo=usuario.activo,
        created_at=usuario.created_at,
        updated_at=usuario.updated_at
    )
