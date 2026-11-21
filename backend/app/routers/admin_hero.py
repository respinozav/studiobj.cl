from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database import get_db
from app.models import HeroTemplate
from app.schemas import (
    HeroTemplateCreate,
    HeroTemplateUpdate,
    HeroTemplateResponse,
)
from app.dependencies import require_role

router = APIRouter(prefix="/admin/hero", tags=["Admin Hero Plantillas"])

admin_required = require_role(["Admin"])

def get_or_seed_default_hero(db: Session) -> HeroTemplate:
    hero = db.query(HeroTemplate).filter(HeroTemplate.es_predeterminada == True).first()
    if not hero:
        # Si no hay ninguna predeterminada, verificar si hay alguna
        hero = db.query(HeroTemplate).order_by(HeroTemplate.created_at.desc()).first()
        if hero:
            hero.es_predeterminada = True
            db.commit()
            db.refresh(hero)
        else:
            # Crear la plantilla inicial por defecto
            hero = HeroTemplate(
                nombre="Edición Dark Luxury Oficial",
                tag="Edición Dark Luxury 2026",
                titulo_linea_1="Esculpe Tu Fuerza Con",
                titulo_linea_2="Elegancia Exclusiva",
                subtitulo="Prendas deportivas de compresión premium, tejidos transpirables y diseño sofisticado pensado para la mujer moderna en Chile.",
                boton_texto="Ver Colección",
                es_predeterminada=True
            )
            db.add(hero)
            db.commit()
            db.refresh(hero)
    return hero

@router.get("/plantillas", response_model=List[HeroTemplateResponse])
def list_hero_templates(db: Session = Depends(get_db), _=Depends(admin_required)):
    """Lista todas las plantillas de portada guardadas"""
    # Asegurar que al menos existe la predeterminada
    get_or_seed_default_hero(db)
    return db.query(HeroTemplate).order_by(HeroTemplate.es_predeterminada.desc(), HeroTemplate.updated_at.desc()).all()

@router.post("/plantillas", response_model=HeroTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_hero_template(data: HeroTemplateCreate, db: Session = Depends(get_db), _=Depends(admin_required)):
    """Crea una nueva plantilla de portada"""
    count = db.query(HeroTemplate).count()
    should_be_default = data.es_predeterminada or count == 0

    if should_be_default:
        # Desmarcar todas las demás
        db.query(HeroTemplate).update({HeroTemplate.es_predeterminada: False})

    plantilla = HeroTemplate(
        nombre=data.nombre.strip(),
        tag=data.tag.strip(),
        titulo_linea_1=data.titulo_linea_1.strip(),
        titulo_linea_2=data.titulo_linea_2.strip(),
        subtitulo=data.subtitulo.strip(),
        boton_texto=data.boton_texto.strip() if data.boton_texto else "Ver Colección",
        es_predeterminada=should_be_default
    )
    db.add(plantilla)
    db.commit()
    db.refresh(plantilla)
    return plantilla

@router.put("/plantillas/{id}", response_model=HeroTemplateResponse)
def update_hero_template(id: UUID, data: HeroTemplateUpdate, db: Session = Depends(get_db), _=Depends(admin_required)):
    """Actualiza una plantilla de portada existente"""
    plantilla = db.query(HeroTemplate).filter(HeroTemplate.id == id).first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    if data.es_predeterminada is True and not plantilla.es_predeterminada:
        db.query(HeroTemplate).filter(HeroTemplate.id != id).update({HeroTemplate.es_predeterminada: False})
        plantilla.es_predeterminada = True

    if data.nombre is not None:
        plantilla.nombre = data.nombre.strip()
    if data.tag is not None:
        plantilla.tag = data.tag.strip()
    if data.titulo_linea_1 is not None:
        plantilla.titulo_linea_1 = data.titulo_linea_1.strip()
    if data.titulo_linea_2 is not None:
        plantilla.titulo_linea_2 = data.titulo_linea_2.strip()
    if data.subtitulo is not None:
        plantilla.subtitulo = data.subtitulo.strip()
    if data.boton_texto is not None:
        plantilla.boton_texto = data.boton_texto.strip()

    db.commit()
    db.refresh(plantilla)
    return plantilla

@router.delete("/plantillas/{id}")
def delete_hero_template(id: UUID, db: Session = Depends(get_db), _=Depends(admin_required)):
    """Elimina una plantilla (no se permite si es la predeterminada activa)"""
    plantilla = db.query(HeroTemplate).filter(HeroTemplate.id == id).first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    if plantilla.es_predeterminada:
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminar la plantilla activa en la web. Establece otra plantilla como predeterminada primero."
        )
    db.delete(plantilla)
    db.commit()
    return {"message": "Plantilla eliminada exitosamente"}

@router.patch("/plantillas/{id}/activar", response_model=HeroTemplateResponse)
def activate_hero_template(id: UUID, db: Session = Depends(get_db), _=Depends(admin_required)):
    """Activa una plantilla como la predeterminada visible en la web"""
    plantilla = db.query(HeroTemplate).filter(HeroTemplate.id == id).first()
    if not plantilla:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    db.query(HeroTemplate).filter(HeroTemplate.id != id).update({HeroTemplate.es_predeterminada: False})
    plantilla.es_predeterminada = True
    db.commit()
    db.refresh(plantilla)
    return plantilla
