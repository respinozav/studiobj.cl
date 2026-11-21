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
from app.models import Rol, Usuario, Categoria, Producto
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

    is_postgres = settings.DATABASE_URL.startswith("postgresql")

    if is_postgres and "sqlite" not in str(engine.url):
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
    else:
        print("Creando tablas con SQLAlchemy metadata...")
        Base.metadata.create_all(bind=engine)
        print("✓ Tablas creadas.")

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

        # 2. USUARIO ADMINISTRADOR
        admin_email = settings.ADMIN_EMAIL.lower().strip()
        admin = db.query(Usuario).filter(Usuario.email == admin_email).first()
        if not admin:
            admin = Usuario(
                rol_id=roles_map["Super Admin"].id,
                nombre=settings.ADMIN_NOMBRE,
                email=admin_email,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                activo=True
            )
            db.add(admin)
            db.commit()
            print(f"✓ Usuario Administrador creado: {admin_email} | Password: {settings.ADMIN_PASSWORD}")
        else:
            print(f"✓ Usuario Administrador verificado: {admin_email}")

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

        # 4. PRODUCTOS CRO DE ALTA CONVERSIÓN CON FOTOGRAFÍAS REALISTAS
        productos_seed = [
            {
                "categoria": "Conjuntos",
                "nombre": "Conjunto Sculpt Seamless Eclipse",
                "color": "Negro Onix / Rosa Palo",
                "talla": "XS,S,M,L,XL",
                "precio": 38990,
                "precio_anterior": 46990,
                "etiqueta": "Top Ventas",
                "descripcion": "Tejido seamless de compresión media que abraza la silueta sin transparencias. Top con copas removibles y calza de tiro ultra alto."
            },
            {
                "categoria": "Leggings",
                "nombre": "Leggings High-Rise Contour Velvet",
                "color": "Ciruela Profundo",
                "talla": "XS,S,M,L",
                "precio": 26990,
                "precio_anterior": 32990,
                "etiqueta": "Últimas unidades",
                "descripcion": "Calza moldeadora anti-rozaduras con efecto push-up sutil y pretina reforzada que no se dobla durante entrenamientos intensos."
            },
            {
                "categoria": "Tops",
                "nombre": "Top Deportivo Cross-Back Obsidian",
                "color": "Negro Azabache",
                "talla": "S,M,L",
                "precio": 19990,
                "precio_anterior": 24990,
                "etiqueta": "Nuevo",
                "descripcion": "Diseño en espalda cruzada que maximiza libertad de movimiento y soporte. Banda elástica suave al tacto y acabado sedoso."
            },
            {
                "categoria": "Enteritos",
                "nombre": "Enterito Body Sculpt Luxe",
                "color": "Mora Dark",
                "talla": "XS,S,M,L",
                "precio": 42990,
                "precio_anterior": 49990,
                "etiqueta": "Top Ventas",
                "descripcion": "Mono enterizo estilizador de una sola pieza con tejido de rápida absorción y costuras planas flatlock antiroce."
            },
            {
                "categoria": "Accesorios",
                "nombre": "Bolso Deportivo StudioBJ Duffle",
                "color": "Negro Mate & Oro Rosa",
                "talla": "Única",
                "precio": 24990,
                "precio_anterior": None,
                "etiqueta": "Nuevo",
                "descripcion": "Compartimento impermeable para zapatillas, detalles en herrajes dorados y correa ergonómica acolchada."
            },
            {
                "categoria": "Conjuntos",
                "nombre": "Set Ribbed Touch Amethyst",
                "color": "Púrpura Ahumado",
                "talla": "S,M,L",
                "precio": 39990,
                "precio_anterior": 45990,
                "etiqueta": "Nuevo",
                "descripcion": "Estructura acanalada que estiliza y proporciona ajuste flexible para yoga, pilates o entrenamiento de fuerza."
            }
        ]

        import json
        for p in productos_seed:
            cat = categorias_map.get(p["categoria"])
            if not cat:
                continue
            prod_existente = db.query(Producto).filter(Producto.nombre == p["nombre"]).first()
            if not prod_existente:
                b64_img = get_product_photo_webp(p["nombre"])
                # Variantes base
                vars_list = [
                    {
                        "color": p["color"],
                        "color_hex": None,
                        "imagenes": [b64_img] if b64_img else [],
                        "tallas": p["talla"]
                    }
                ]
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
                print(f"✓ Producto creado: {p['nombre']} (${p['precio']} CLP)")

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
