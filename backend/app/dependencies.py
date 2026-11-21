from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models import Usuario
from app.security import decode_access_token

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identificador de usuario no encontrado en el token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_uuid = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ID de usuario inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(Usuario).filter(Usuario.id == user_uuid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    if not user.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")
    
    return user

def require_role(allowed_roles: list[str]):
    def role_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if not current_user.rol:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permiso denegado. Usuario sin rol asignado."
            )
        if current_user.rol.nombre in allowed_roles or current_user.rol.nombre in ["Admin", "Super Admin"]:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permiso denegado. Se requiere uno de los roles: {', '.join(allowed_roles)}"
        )
    return role_checker

def require_module_or_superadmin(modulo_name: str):
    def module_checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if not current_user.rol:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permiso denegado. Usuario sin rol asignado."
            )
        # Super Admin y Admin tienen acceso a todos los módulos
        if current_user.rol.nombre in ["Super Admin", "Admin"]:
            return current_user
        
        modulos = [m.strip().lower() for m in (current_user.rol.modulos or "").split(",") if m.strip()]
        if modulo_name.lower() in modulos:
            return current_user
            
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permiso denegado. No tienes acceso al módulo '{modulo_name}'."
        )
    return module_checker
