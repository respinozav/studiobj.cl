import os
import sys
import uuid
import base64
import io
import urllib.request
from PIL import Image
from sqlalchemy import text
from app.config import settings
from app.database import engine, SessionLocal, Base
from app.models import Rol, Usuario, Categoria, Producto, HeroTemplate, Color
from app.security import hash_password

products_images_local = {
    'Conjunto Sculpt Seamless Eclipse': 'conjunto_sculpt_eclipse.webp',
    'Leggings High-Rise Contour Velvet': 'leggings_contour_black.webp',
    'Top Deportivo Cross-Back Obsidian': 'top_crossback_pink.webp',
    'Enterito Body Sculpt Luxe': 'enterito_sculpt_luxe.webp',
    'Bolso Deportivo StudioBJ Duffle': 'bolso_deportivo_duffle.webp',
    'Set Ribbed Touch Amethyst': 'set_ribbed_amethyst.webp'
}

def get_product_photo_webp(nombre: str) -> str:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    filename = products_images_local.get(nombre)
    if filename:
        local_path = os.path.join(base_dir, 'frontend', 'public', 'products', filename)
        if os.path.exists(local_path):
            with open(local_path, 'rb') as f:
                b64 = base64.b64encode(f.read()).decode('ascii')
                return f"data:image/webp;base64,{b64}"

    # Fallback minimal valid webp
    return (
        "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAAAwBACdASoAAgACAAUAJaQAA3AA/vv2v/t2N/"
        "92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92Nv92NuAAP7qA"
        "AAAAAAAAAAAAAAAAAAAAAAAA"
    )

def run_seed():
    print("==================================================")
    print("STUDIOBJ.CL - INICIALIZACIÓN Y SEED DE BASE DE DATOS")
    print(f"DATABASE URL: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    print("==================================================")

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ddl_path = os.path.join(base_dir, "database", "01_schema_ddl.sql")
    policies_path = os.path.join(base_dir, "database", "02_roles_and_policies.sql")

    is_postgres = "postgresql" in str(engine.url) and "sqlite" not in str(engine.url)

    if is_postgres:
        print("Ejecutando DDL en PostgreSQL...")
        try:
            with engine.connect() as conn:
                with open(ddl_path, "r", encoding="utf-8") as f:
                    conn.execute(text(f.read()))
                conn.commit()
                print("✓ 01_schema_ddl.sql ejecutado.")

                try:
                    with open(policies_path, "r", encoding="utf-8") as f:
                        conn.execute(text(f.read()))
                    conn.commit()
                    print("✓ 02_roles_and_policies.sql ejecutado.")
                except Exception as e:
                    print(f"Nota en políticas: {e}")
        except Exception as e:
            print(f"Aviso al ejecutar DDL directo: {e}")
    
    # Crear todas las tablas con SQLAlchemy metadata para garantizar sincronización total
    print("Sincronizando modelos con SQLAlchemy metadata...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tablas y metadata sincronizadas.")

    db = SessionLocal()
    try:
        # 1. ROLES
        roles_data = [
            ("Super Admin", "Control total sobre la tienda, catálogo, usuarios y roles"),
            ("Editor Catálogo", "Gestión de productos y categorías de la tienda")
        ]
        roles_map = {}
        for r_name, r_desc in roles_data:
            rol = db.query(Rol).filter(Rol.nombre == r_name).first()
            if not rol:
                rol = Rol(nombre=r_name, descripcion=r_desc, activo=True)
                db.add(rol)
                db.commit()
                db.refresh(rol)
                print(f"✓ Rol creado: {r_name}")
            roles_map[r_name] = rol

        # 2. USUARIOS ADMINISTRADORES (Roderick Espinoza y Administrador del Sistema)
        admin_users_to_ensure = [
            {
                "email": "roderick.espinoza@gmail.com",
                "nombre": "Roderick Espinoza",
                "password": "12345678",
                "rol": "Super Admin"
            },
            {
                "email": settings.ADMIN_EMAIL.lower().strip(),
                "nombre": settings.ADMIN_NOMBRE,
                "password": settings.ADMIN_PASSWORD,
                "rol": "Super Admin"
            }
        ]

        for u_data in admin_users_to_ensure:
            u_email = u_data["email"].lower().strip()
            user_obj = db.query(Usuario).filter(Usuario.email == u_email).first()
            if not user_obj:
                user_obj = Usuario(
                    rol_id=roles_map[u_data["rol"]].id,
                    nombre=u_data["nombre"],
                    email=u_email,
                    password_hash=hash_password(u_data["password"]),
                    activo=True
                )
                db.add(user_obj)
                db.commit()
                print(f"✓ Usuario Administrador creado: {u_email}")
            else:
                user_obj.password_hash = hash_password(u_data["password"])
                user_obj.rol_id = roles_map[u_data["rol"]].id
                user_obj.activo = True
                user_obj.nombre = u_data["nombre"]
                db.commit()
                print(f"✓ Usuario Administrador actualizado con contraseña activa: {u_email}")

        # 3. CATEGORÍAS BASE
        categorias_base = [
            ("Conjuntos", "Sets deportivos de compresión seamless y diseño de lujo"),
            ("Leggings", "Calzas modeladoras con tiro alto y textura transpirable"),
            ("Tops", "Sujetadores deportivos y crop tops con soporte óptimo"),
            ("Enteritos", "Monos de compresión completa y silueta estilizadora"),
            ("Accesorios", "Bandas de resistencia, botellas térmicas y bolsos deportivos")
        ]
        categorias_map = {}
        for cat_nombre, cat_desc in categorias_base:
            cat = db.query(Categoria).filter(Categoria.nombre == cat_nombre).first()
            if not cat:
                cat = Categoria(nombre=cat_nombre, descripcion=cat_desc, activo=True)
                db.add(cat)
                db.commit()
                db.refresh(cat)
                print(f"✓ Categoría creada: {cat_nombre}")
            categorias_map[cat_nombre] = cat

        # 3.5. COLORES ESTÁNDAR DE LA MARCA (PALETA DARK LUXURY)
        colores_seed_data = [
            ("Negro Onix", "#18181b", "Negro azabache mate de compresión"),
            ("Rosa Palo", "#D9A6B8", "Tono suave distintivo de la marca"),
            ("Ciruela Profundo", "#581c43", "Tono oscuro sofisticado"),
            ("Mora Dark", "#311B2B", "Fondo emblemático StudioBJ"),
            ("Vino Tinto", "#722F37", "Burgundy oscuro de compresión seamless"),
            ("Púrpura Amatista", "#4A2040", "Púrpura ahumado para conjuntos acanalados"),
            ("Azul Noche", "#1e293b", "Navy de alta densidad"),
            ("Verde Esmeralda", "#1e3a2f", "Verde bosque deportivo"),
            ("Blanco Marfil", "#f8fafc", "Blanco puro sedoso sin transparencias"),
            ("Gris Carbón", "#374151", "Gris mineral neutro"),
            ("Oro Rosa", "#B76E79", "Detalles y herrajes metálicos"),
        ]
        colores_map = {}
        for c_nom, c_hex, c_desc in colores_seed_data:
            col_obj = db.query(Color).filter(Color.nombre == c_nom).first()
            if not col_obj:
                col_obj = Color(
                    nombre=c_nom,
                    hex=c_hex,
                    descripcion=c_desc,
                    activo=True
                )
                db.add(col_obj)
                db.commit()
                db.refresh(col_obj)
                print(f"✓ Color creado: {c_nom} ({c_hex})")
            else:
                col_obj.hex = c_hex
                col_obj.descripcion = c_desc
                col_obj.activo = True
                db.commit()
            colores_map[c_nom] = col_obj

        # 4. PRODUCTOS CRO DE ALTA CONVERSIÓN CON FOTOGRAFÍAS REALISTAS Y MÚLTIPLES VARIANTES DE COLOR
        productos_seed = [
            {
                "categoria": "Conjuntos",
                "nombre": "Conjunto Sculpt Seamless Eclipse",
                "color": "Negro Onix / Rosa Palo",
                "talla": "XS,S,M,L,XL",
                "precio": 38990,
                "precio_anterior": 46990,
                "etiqueta": "Top Ventas",
                "descripcion": "Tejido seamless de compresión media que abraza la silueta sin transparencias. Top con copas removibles y calza de tiro ultra alto.",
                "variantes_def": [
                    {"color": "Vino Tinto", "color_hex": "#722F37", "tallas": "XS,S,M,L,XL"},
                    {"color": "Negro Onix", "color_hex": "#18181b", "tallas": "S,M,L,XL"},
                    {"color": "Rosa Palo", "color_hex": "#D9A6B8", "tallas": "XS,S,M"}
                ]
            },
            {
                "categoria": "Leggings",
                "nombre": "Leggings High-Rise Contour Velvet",
                "color": "Ciruela Profundo",
                "talla": "XS,S,M,L",
                "precio": 26990,
                "precio_anterior": 32990,
                "etiqueta": "Últimas unidades",
                "descripcion": "Calza moldeadora anti-rozaduras con efecto push-up sutil y pretina reforzada que no se dobla durante entrenamientos intensos.",
                "variantes_def": [
                    {"color": "Negro Onix", "color_hex": "#18181b", "tallas": "XS,S,M,L"},
                    {"color": "Ciruela Profundo", "color_hex": "#581c43", "tallas": "S,M,L"},
                    {"color": "Vino Tinto", "color_hex": "#722F37", "tallas": "XS,S,M,L"}
                ]
            },
            {
                "categoria": "Tops",
                "nombre": "Top Deportivo Cross-Back Obsidian",
                "color": "Negro Azabache",
                "talla": "S,M,L",
                "precio": 19990,
                "precio_anterior": 24990,
                "etiqueta": "Nuevo",
                "descripcion": "Diseño en espalda cruzada que maximiza libertad de movimiento y soporte. Banda elástica suave al tacto y acabado sedoso.",
                "variantes_def": [
                    {"color": "Negro Azabache", "color_hex": "#18181b", "tallas": "S,M,L"},
                    {"color": "Rosa Palo", "color_hex": "#D9A6B8", "tallas": "XS,S,M,L"},
                    {"color": "Púrpura Amatista", "color_hex": "#4A2040", "tallas": "S,M"}
                ]
            },
            {
                "categoria": "Enteritos",
                "nombre": "Enterito Body Sculpt Luxe",
                "color": "Mora Dark",
                "talla": "XS,S,M,L",
                "precio": 42990,
                "precio_anterior": 49990,
                "etiqueta": "Top Ventas",
                "descripcion": "Mono enterizo estilizador de una sola pieza con tejido de rápida absorción y costuras planas flatlock antiroce.",
                "variantes_def": [
                    {"color": "Negro Onix", "color_hex": "#18181b", "tallas": "XS,S,M,L"},
                    {"color": "Mora Dark", "color_hex": "#311B2B", "tallas": "XS,S,M,L"},
                    {"color": "Vino Tinto", "color_hex": "#722F37", "tallas": "S,M,L"}
                ]
            },
            {
                "categoria": "Accesorios",
                "nombre": "Bolso Deportivo StudioBJ Duffle",
                "color": "Negro Mate & Oro Rosa",
                "talla": "Única",
                "precio": 24990,
                "precio_anterior": None,
                "etiqueta": "Nuevo",
                "descripcion": "Compartimento impermeable para zapatillas, detalles en herrajes dorados y correa ergonómica acolchada.",
                "variantes_def": [
                    {"color": "Negro Mate & Oro Rosa", "color_hex": "#2B2B2B", "tallas": "Única"},
                    {"color": "Negro Onix", "color_hex": "#18181b", "tallas": "Única"}
                ]
            },
            {
                "categoria": "Conjuntos",
                "nombre": "Set Ribbed Touch Amethyst",
                "color": "Púrpura Ahumado",
                "talla": "S,M,L",
                "precio": 39990,
                "precio_anterior": 45990,
                "etiqueta": "Nuevo",
                "descripcion": "Estructura acanalada que estiliza y proporciona ajuste flexible para yoga, pilates o entrenamiento de fuerza.",
                "variantes_def": [
                    {"color": "Púrpura Amatista", "color_hex": "#4A2040", "tallas": "S,M,L"},
                    {"color": "Negro Onix", "color_hex": "#18181b", "tallas": "XS,S,M,L"}
                ]
            }
        ]

        import json
        for p in productos_seed:
            cat = categorias_map.get(p["categoria"])
            if not cat:
                continue

            b64_img = get_product_photo_webp(p["nombre"])
            # Construir variantes completas
            vars_list = []
            for v_def in p.get("variantes_def", []):
                vars_list.append({
                    "color": v_def["color"],
                    "color_hex": v_def.get("color_hex") or (colores_map.get(v_def["color"]).hex if v_def["color"] in colores_map else "#18181b"),
                    "imagenes": [b64_img] if b64_img else [],
                    "tallas": v_def["tallas"]
                })
            
            if not vars_list:
                vars_list = [{
                    "color": p["color"],
                    "color_hex": "#18181b",
                    "imagenes": [b64_img] if b64_img else [],
                    "tallas": p["talla"]
                }]

            prod_existente = db.query(Producto).filter(Producto.nombre == p["nombre"]).first()
            if not prod_existente:
                nuevo_prod = Producto(
                    categoria_id=cat.id,
                    nombre=p["nombre"],
                    color=p["color"],
                    talla=p["talla"],
                    imagen_base64=b64_img,
                    precio=p["precio"],
                    precio_anterior=p["precio_anterior"],
                    etiqueta=p["etiqueta"],
                    descripcion=p["descripcion"],
                    variantes=json.dumps(vars_list),
                    activo=True
                )
                db.add(nuevo_prod)
                print(f"✓ Producto creado con {len(vars_list)} colores: {p['nombre']}")
            else:
                # Actualizar variantes completas en la base de datos
                prod_existente.variantes = json.dumps(vars_list)
                if not prod_existente.imagen_base64 or len(prod_existente.imagen_base64) < 100:
                    prod_existente.imagen_base64 = b64_img
                db.commit()
                print(f"✓ Producto actualizado con {len(vars_list)} colores: {p['nombre']}")

        # 4. PLANTILLA HERO PRINCIPAL
        hero = db.query(HeroTemplate).first()
        if not hero:
            hero = HeroTemplate(
                nombre="Edición Dark Luxury Oficial",
                tag="Fitness & Fashion",
                titulo_linea_1="Esculpe Tu Fuerza Con",
                titulo_linea_2="Elegancia Exclusiva",
                subtitulo="Prendas deportivas de compresión premium, tejidos transpirables y diseño sofisticado pensado para la mujer moderna en Chile.",
                boton_texto="Ver Colección",
                es_predeterminada=True
            )
            db.add(hero)
            print("✓ Plantilla Hero predeterminada creada.")

        db.commit()
        print("\n==================================================")
        print("SEED COMPLETADO CON ÉXITO")
        print("Usuario Admin: admin@studiobj.cl")
        print("Password:     AdminStudioBJ2026!")
        print("==================================================")
    except Exception as e:
        db.rollback()
        print(f"Error en seed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
