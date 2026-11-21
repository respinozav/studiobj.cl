-- ========================================================
-- STUDIOBJ.CL - 03_seed_initial.sql
-- Datos iniciales: Roles, Admin, Categorías y Productos Base
-- ========================================================

-- 1. Roles Obligatorios
INSERT INTO bdstudiobj.roles (id, nombre, descripcion, activo)
VALUES 
    (gen_random_uuid(), 'Super Admin', 'Control total sobre la tienda, catálogo, usuarios y roles', TRUE),
    (gen_random_uuid(), 'Editor Catálogo', 'Gestión de productos y categorías de la tienda', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- 2. Usuario Administrador Inicial (admin@studiobj.cl / AdminStudioBJ2026!)
-- Hash bcrypt generado para 'AdminStudioBJ2026!'
INSERT INTO bdstudiobj.usuarios (id, rol_id, nombre, email, password_hash, activo)
SELECT 
    gen_random_uuid(),
    r.id,
    'Administrador StudioBJ',
    'admin@studiobj.cl',
    '$2b$12$N7x/X8cR/E6z8U7.yB6p8.sR7B8Z1gR.aR.q9K7t3X.z2F5P1a.6W', -- AdminStudioBJ2026!
    TRUE
FROM bdstudiobj.roles r
WHERE r.nombre = 'Super Admin'
ON CONFLICT (email) DO NOTHING;

-- 3. Categorías Base Obligatorias
INSERT INTO bdstudiobj.categorias (id, nombre, descripcion, activo)
VALUES
    (gen_random_uuid(), 'Conjuntos', 'Sets deportivos de compresión seamless y diseño de lujo', TRUE),
    (gen_random_uuid(), 'Leggings', 'Calzas modeladoras con tiro alto y textura transpirable', TRUE),
    (gen_random_uuid(), 'Tops', 'Sujetadores deportivos y crop tops con soporte óptimo', TRUE),
    (gen_random_uuid(), 'Enteritos', 'Monos de compresión completa y silueta estilizadora', TRUE),
    (gen_random_uuid(), 'Accesorios', 'Bandas de resistencia, botellas térmicas y bolsos deportivos', TRUE)
ON CONFLICT (nombre) DO NOTHING;
