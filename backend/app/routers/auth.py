from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
from app.schemas import LoginRequest, TokenResponse, UserProfile
from app.security import verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == request.email.lower()).first()
    if not usuario or not verify_password(request.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta se encuentra inactiva. Contacte al administrador."
        )

    access_token = create_access_token(data={"sub": str(usuario.id), "rol": usuario.rol.nombre})
    
    rol_name = usuario.rol.nombre if usuario.rol else "Sin Rol"
    profile = UserProfile(
        id=usuario.id,
        nombre=usuario.nombre,
        email=usuario.email,
        rol=rol_name,
        rol_nombre=rol_name,
        modulos=usuario.rol.modulos if usuario.rol else None,
        activo=usuario.activo
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=profile
    )

@router.get("/me", response_model=UserProfile)
def get_me(current_user: Usuario = Depends(get_current_user)):
    rol_name = current_user.rol.nombre if current_user.rol else "Sin Rol"
    return UserProfile(
        id=current_user.id,
        nombre=current_user.nombre,
        email=current_user.email,
        rol=rol_name,
        rol_nombre=rol_name,
        modulos=current_user.rol.modulos if current_user.rol else None,
        activo=current_user.activo
    )
