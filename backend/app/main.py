from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, public, admin_categorias, admin_productos, admin_colores, admin_usuarios, admin_roles, admin_hero

app = FastAPI(
    title="StudioBJ E-Commerce API",
    description="API de Producción para E-Commerce Dark Luxury StudioBJ (studiobj.cl)",
    version="1.0.0"
)

# Configuración CORS estricta y de producción
origins = [
    "https://studiobj.cl",
    "https://www.studiobj.cl",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "*"  # Para compatibilidad con túneles y visores de vista previa
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de Routers con prefijo /api/v1
app.include_router(auth.router, prefix="/api/v1")
app.include_router(public.router, prefix="/api/v1")
app.include_router(admin_categorias.router, prefix="/api/v1")
app.include_router(admin_colores.router, prefix="/api/v1")
app.include_router(admin_productos.router, prefix="/api/v1")
app.include_router(admin_usuarios.router, prefix="/api/v1")
app.include_router(admin_roles.router, prefix="/api/v1")
app.include_router(admin_hero.router, prefix="/api/v1")

@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "app": "StudioBJ API", "environment": "production"}
