# StudioBJ (`studiobj.cl`) — E-Commerce Dark Luxury de Producción

Plataforma de comercio electrónico Mobile-First para ropa deportiva de compresión y diseño exclusivo Dark Luxury, conectada a **AWS RDS PostgreSQL**, capa REST **PostgREST** y backend de alta concurrencia **FastAPI**.

---

## 🎨 Paleta de Identidad y Estética
* **Fondo Principal:** `#1C0F18`
* **Superficies & Tarjetas:** `#261521` / `#311B2B` con bordes `#D9A6B8`/20
* **Acento Rosa Palo:** `#D9A6B8`
* **Textos, Precios & Botones:** `#FFFFFF`
* **Tipografías:** `Cormorant Garamond` (monograma editorial SBJ y encabezados) + `Plus Jakarta Sans` (precios con `tabular-nums` e interfaces).

---

## 🚀 Arquitectura del Monorepo

```
/studiobj.cl
├── /frontend               # React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons
│   ├── /src
│   │   ├── /components    # Header (glassmorphism), Hero, CategoryFilters, ProductCard, Lightbox 2x/3x, CartDrawer, Footer
│   │   ├── /context       # CartContext (persistente en localStorage), AuthContext (JWT)
│   │   ├── /pages         # PublicStore, AdminLogin, AdminPanel
│   │   └── /services      # api.ts (cliente API con inyección de JWT y endpoints públicos)
│   ├── Dockerfile
│   └── nginx.conf
│
├── /backend                # Python 3.11+ con FastAPI + SQLAlchemy 2.0 + Pydantic v2
│   ├── /app
│   │   ├── /routers       # auth, public, admin_categorias, admin_productos, admin_usuarios, admin_roles
│   │   ├── config.py      # Pydantic Settings (.env)
│   │   ├── database.py    # SQLAlchemy Engine con SSL y soporte AWS RDS / local
│   │   ├── dependencies.py# Inyección de dependencias JWT y RBAC
│   │   ├── models.py      # Modelos 100% UUID: Rol, Usuario, Categoria, Producto
│   │   ├── schemas.py     # Validación Pydantic v2 con validación estricta de Base64 WebP
│   │   └── security.py    # Hash bcrypt y emisión/verificación JWT
│   ├── .env               # Parámetros de conexión a AWS RDS y secretos
│   ├── .env.example
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── seed.py            # Script idempotente de inicialización de esquema y datos
│   └── test_api.py        # Suite completa de verificación de endpoints y soft delete
│
├── /postgrest              # Capa REST pública ultrarrápida
│   ├── postgrest.conf     # Configuración con esquema bdstudiobj y rol web_anon
│   └── docker-compose.yml
│
├── /database               # Scripts SQL Idempotentes para AWS RDS
│   ├── 01_schema_ddl.sql          # Extensiones pgcrypto, esquema bdstudiobj, 4 tablas UUID e índices
│   ├── 02_roles_and_policies.sql  # Rol web_anon y vistas v_catalogo_categorias y v_catalogo_productos
│   └── 03_seed_initial.sql        # Roles, admin inicial y categorías
│
└── docker-compose.yml      # Orquestación completa de producción (Frontend + Backend + PostgREST)
```

---

## 🔐 Conexión a AWS RDS PostgreSQL

Los parámetros exactos de conexión están configurados en `backend/.env` y `postgrest/postgrest.conf`:
```env
DB_HOST=ls-b12cc9081f17b594187264e8c7fe42119a9bb93f.cgt2s428cp85.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=dbmasteruser
DB_PASSWORD=pidemala
DB_SCHEMA=bdstudiobj
DATABASE_URL=postgresql+psycopg://dbmasteruser:pidemala@ls-b12cc9081f17b594187264e8c7fe42119a9bb93f.cgt2s428cp85.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require
```

> **Nota de Seguridad:** Al ejecutar la conexión con `dbmasteruser` y la clave proporcionada `pidemala`, el servidor de AWS RDS respondió correctamente en el puerto 5432 pero retornó: `FATAL: password authentication failed for user "dbmasteruser"`. Tan pronto como coloques la contraseña definitiva en `backend/.env`, la conexión hacia AWS RDS tomará efecto de inmediato.

---

## 👤 Credenciales Iniciales de Administración

* **URL de Login:** `/admin/login`
* **Email:** `admin@studiobj.cl`
* **Contraseña:** `AdminStudioBJ2026!`
* **Rol:** `Super Admin`

---

## 🛠️ Ejecución Local

### 1. Iniciar el Backend (FastAPI)
```bash
# Activar entorno virtual
.\backend\venv\Scripts\activate

# Ejecutar el seed inicial
python backend\seed.py

# Iniciar servidor FastAPI
uvicorn app.main:app --reload --port 8000 --app-dir backend
```
* **Documentación interactiva Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

### 2. Iniciar el Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
* **Tienda Pública:** [http://localhost:5173](http://localhost:5173)
* **Panel de Administración:** [http://localhost:5173/admin](http://localhost:5173/admin)

### 3. Ejecutar Pruebas Automatizadas
```bash
.\backend\venv\Scripts\python backend\test_api.py
```
Verifica automáticamente:
1. `GET /health` (200 OK)
2. `GET /api/v1/public/categorias` (Categorías con `activo = true`)
3. `GET /api/v1/public/productos` (Productos con `activo = true` y categoría activa)
4. `POST /api/v1/auth/login` (Autenticación y generación de JWT)
5. `GET /api/v1/auth/me` (Validación de rol Super Admin)
6. Soft-delete inmediato (`PATCH /estado` oculta en tiempo real del catálogo público sin borrar de la BD)
7. Validación de formato de imagen WebP Base64 y límites de tamaño

---

## 🐳 Despliegue con Docker Compose

```bash
docker compose up -d --build
```
Levantará los tres servicios:
* **Frontend:** Puerto `80`
* **FastAPI Backend:** Puerto `8000`
* **PostgREST:** Puerto `3001`
