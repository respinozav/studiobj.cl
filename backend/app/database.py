import logging
import os
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("studiobj.database")
Base = declarative_base()

# Repo root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOCAL_DB_PATH = os.path.join(BASE_DIR, "studiobj_local.db").replace("\\", "/")

def create_configured_engine():
    connect_args = {}
    is_pg = False

    # Construcción segura de URL con encoding automático de contraseña para caracteres especiales
    if settings.DB_HOST and settings.DB_PASSWORD:
        db_url = URL.create(
            drivername="postgresql+psycopg",
            username=settings.DB_USER,
            password=settings.DB_PASSWORD,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            database=settings.DB_NAME,
            query={"sslmode": "require"}
        )
        connect_args["options"] = f"-csearch_path={settings.DB_SCHEMA},public"
        is_pg = True
    elif settings.DATABASE_URL.startswith("postgresql"):
        db_url = settings.DATABASE_URL
        connect_args["options"] = f"-csearch_path={settings.DB_SCHEMA},public"
        is_pg = True
    else:
        db_url = settings.DATABASE_URL
        connect_args["check_same_thread"] = False

    try:
        eng = create_engine(
            db_url,
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
