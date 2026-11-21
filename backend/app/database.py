import logging
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("studiobj.database")
Base = declarative_base()

# Repo root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOCAL_DB_PATH = os.path.join(BASE_DIR, "studiobj_local.db").replace("\\", "/")

def create_configured_engine():
    is_pg = settings.DATABASE_URL.startswith("postgresql")
    connect_args = {}
    if is_pg:
        connect_args["options"] = f"-csearch_path={settings.DB_SCHEMA},public"
    else:
        connect_args["check_same_thread"] = False

    try:
        eng = create_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_pre_ping=True,
            connect_args=connect_args
        )
        with eng.connect() as conn:
            pass
        logger.info(f"Conexión exitosa a base de datos PostgreSQL: {settings.DB_HOST}")
        return eng
    except Exception as e:
        logger.warning(
            f"Aviso de conexión: No se pudo conectar a AWS RDS con las credenciales actuales ({e}).\n"
            f"Iniciando base de datos local SQLite ({LOCAL_DB_PATH}) para permitir pruebas inmediatas sin interrupción."
        )
        fallback_eng = create_engine(
            f"sqlite:///{LOCAL_DB_PATH}",
            echo=False,
            connect_args={"check_same_thread": False},
            execution_options={"schema_translate_map": {"bdstudiobj": None}}
        )
        return fallback_eng

engine = create_configured_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
