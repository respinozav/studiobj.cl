-- ========================================================
-- STUDIOBJ.CL - 01_schema_ddl.sql
-- PostgreSQL AWS RDS - Esquema Relacional 100% UUID
-- ========================================================

-- Habilitar extensiones para UUID y criptografía
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear esquema dedicado
CREATE SCHEMA IF NOT EXISTS bdstudiobj;

-- 1. Tabla de Roles
CREATE TABLE IF NOT EXISTS bdstudiobj.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(80) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS bdstudiobj.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_id UUID NOT NULL REFERENCES bdstudiobj.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Categorías
CREATE TABLE IF NOT EXISTS bdstudiobj.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla de Productos
CREATE TABLE IF NOT EXISTS bdstudiobj.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL REFERENCES bdstudiobj.categorias(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    nombre VARCHAR(180) NOT NULL,
    color VARCHAR(80) NOT NULL,
    talla VARCHAR(60) NOT NULL, -- Ej: 'XS,S,M,L,XL'
    imagen_base64 TEXT NOT NULL, -- Almacena data:image/webp;base64,...
    precio INTEGER NOT NULL CHECK (precio > 0),
    precio_anterior INTEGER CHECK (precio_anterior IS NULL OR precio_anterior >= precio),
    etiqueta VARCHAR(40), -- 'Top Ventas', 'Últimas unidades', 'Nuevo'
    descripcion TEXT,
    variantes TEXT, -- Array JSON con variantes por color, imágenes y tallas
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla de Colores Estándar
CREATE TABLE IF NOT EXISTS bdstudiobj.colores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(80) NOT NULL UNIQUE,
    hex VARCHAR(10) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabla de Plantillas de Portada (Hero)
CREATE TABLE IF NOT EXISTS bdstudiobj.hero_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(120) NOT NULL,
    tag VARCHAR(100) NOT NULL DEFAULT 'Edición Dark Luxury 2026',
    titulo_linea_1 VARCHAR(150) NOT NULL DEFAULT 'Esculpe Tu Fuerza Con',
    titulo_linea_2 VARCHAR(150) NOT NULL DEFAULT 'Elegancia Exclusiva',
    subtitulo TEXT NOT NULL DEFAULT 'Prendas deportivas de compresión premium, tejidos transpirables y diseño sofisticado pensado para la mujer moderna en Chile.',
    boton_texto VARCHAR(60) NOT NULL DEFAULT 'Ver Colección',
    es_predeterminada BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_categoria_activo ON bdstudiobj.productos (categoria_id, activo);
CREATE INDEX IF NOT EXISTS idx_productos_activo_created ON bdstudiobj.productos (activo, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON bdstudiobj.usuarios (rol_id);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON bdstudiobj.categorias (activo);
CREATE INDEX IF NOT EXISTS idx_colores_activo ON bdstudiobj.colores (activo);
CREATE INDEX IF NOT EXISTS idx_hero_templates_predeterminada ON bdstudiobj.hero_templates (es_predeterminada);
