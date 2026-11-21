-- ========================================================
-- STUDIOBJ.CL - 02_roles_and_policies.sql
-- PostgREST anon role y Vistas de Catálogo Público
-- ========================================================

-- Crear rol web_anon sin permisos de login directo si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
    END IF;
END
$$;

-- Otorga uso del esquema al rol anónimo
GRANT USAGE ON SCHEMA bdstudiobj TO web_anon;

-- 1. Vista pública de Categorías (solo activo = TRUE)
CREATE OR REPLACE VIEW bdstudiobj.v_catalogo_categorias AS
SELECT 
    id, 
    nombre, 
    descripcion
FROM bdstudiobj.categorias
WHERE activo = TRUE
ORDER BY nombre;

-- 2. Vista pública de Productos (solo productos y categorías activas)
CREATE OR REPLACE VIEW bdstudiobj.v_catalogo_productos AS
SELECT 
    p.id,
    p.categoria_id,
    c.nombre AS categoria_nombre,
    p.nombre,
    p.color,
    p.talla,
    p.imagen_base64,
    p.precio,
    p.precio_anterior,
    p.etiqueta,
    p.descripcion,
    p.variantes,
    p.created_at
FROM bdstudiobj.productos p
INNER JOIN bdstudiobj.categorias c ON c.id = p.categoria_id
WHERE p.activo = TRUE AND c.activo = TRUE
ORDER BY p.created_at DESC;

-- 3. Vista pública de Colores
CREATE OR REPLACE VIEW bdstudiobj.v_catalogo_colores AS
SELECT 
    id, 
    nombre, 
    hex,
    descripcion
FROM bdstudiobj.colores
WHERE activo = TRUE
ORDER BY nombre;

-- Otorgar SELECT únicamente sobre las vistas públicas
GRANT SELECT ON bdstudiobj.v_catalogo_categorias TO web_anon;
GRANT SELECT ON bdstudiobj.v_catalogo_productos TO web_anon;
GRANT SELECT ON bdstudiobj.v_catalogo_colores TO web_anon;

-- Prohibir explícitamente lectura o modificación sobre tablas sensibles
REVOKE ALL ON bdstudiobj.usuarios FROM web_anon;
REVOKE ALL ON bdstudiobj.roles FROM web_anon;
REVOKE ALL ON bdstudiobj.productos FROM web_anon;
REVOKE ALL ON bdstudiobj.categorias FROM web_anon;
