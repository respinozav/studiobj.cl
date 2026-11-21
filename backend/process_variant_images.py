import os
import glob
import io
import json
import base64
from PIL import Image
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Producto

BRAIN_DIR = r"C:\Users\respinozav\.gemini\antigravity\brain\830bd6d5-22c4-4dc8-8e11-1a0e108f8651"
PUBLIC_PRODUCTS_DIR = r"C:\Proyectos\Repos\studiobj.cl\frontend\public\products"
os.makedirs(PUBLIC_PRODUCTS_DIR, exist_ok=True)

IMAGE_PATTERNS = {
    "conjunto_sculpt_eclipse": "conjunto_sculpt_eclipse.webp",
    "conjunto_sculpt_eclipse_detail": "conjunto_sculpt_eclipse_detail.webp",
    "leggings_contour_black": "leggings_contour_black.webp",
    "leggings_contour_black_detail": "leggings_contour_black_detail.webp",
    "top_crossback_pink": "top_crossback_pink.webp",
    "top_crossback_pink_detail": "top_crossback_pink_detail.webp",
    "enterito_sculpt_luxe": "enterito_sculpt_luxe.webp",
    "set_ribbed_amethyst": "set_ribbed_amethyst.webp",
    "bolso_deportivo_duffle": "bolso_deportivo_duffle.webp"
}

def convert_and_get_b64(pattern: str, target_filename: str) -> str:
    dest_path = os.path.join(PUBLIC_PRODUCTS_DIR, target_filename)
    # Check if destination exists
    matches = glob.glob(os.path.join(BRAIN_DIR, f"*{pattern}*.jpg"))
    if matches:
        matches.sort(key=os.path.getmtime, reverse=True)
        src_path = matches[0]
        img = Image.open(src_path).convert("RGB")
        w, h = img.size
        expected_ratio = 4.0 / 3.0
        current_ratio = h / w
        if abs(current_ratio - expected_ratio) > 0.05:
            if current_ratio > expected_ratio:
                new_h = int(w * expected_ratio)
                top = (h - new_h) // 2
                img = img.crop((0, top, w, top + new_h))
            else:
                new_w = int(h / expected_ratio)
                left = (w - new_w) // 2
                img = img.crop((left, 0, left + new_w, h))
        img = img.resize((600, 800), Image.Resampling.LANCZOS)
        img.save(dest_path, format="WEBP", quality=85)

    if os.path.exists(dest_path):
        with open(dest_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("ascii")
            return f"data:image/webp;base64,{b64_data}"
    return ""

def process_all():
    print("Convirtiendo fotografías a WebP Base64...")
    images_b64 = {}
    for pat, filename in IMAGE_PATTERNS.items():
        b64 = convert_and_get_b64(pat, filename)
        images_b64[filename] = b64
        print(f"✓ Procesado: {filename} ({len(b64)} chars)")

    # Definir estructura de variantes por producto
    PRODUCTOS_VARIANTES = {
        "Conjunto Sculpt Seamless Eclipse": [
            {
                "color": "Vino Tinto",
                "color_hex": "#722F37",
                "imagenes": [images_b64.get("conjunto_sculpt_eclipse.webp", ""), images_b64.get("conjunto_sculpt_eclipse_detail.webp", "")],
                "tallas": "XS,S,M,L,XL"
            },
            {
                "color": "Negro Onix",
                "color_hex": "#18181b",
                "imagenes": [images_b64.get("leggings_contour_black.webp", ""), images_b64.get("leggings_contour_black_detail.webp", "")],
                "tallas": "S,M,L,XL"
            },
            {
                "color": "Rosa Palo",
                "color_hex": "#D9A6B8",
                "imagenes": [images_b64.get("top_crossback_pink.webp", ""), images_b64.get("top_crossback_pink_detail.webp", "")],
                "tallas": "XS,S,M"
            }
        ],
        "Leggings High-Rise Contour Velvet": [
            {
                "color": "Negro Onix",
                "color_hex": "#18181b",
                "imagenes": [images_b64.get("leggings_contour_black.webp", ""), images_b64.get("leggings_contour_black_detail.webp", "")],
                "tallas": "XS,S,M,L"
            },
            {
                "color": "Ciruela Profundo",
                "color_hex": "#581c43",
                "imagenes": [images_b64.get("set_ribbed_amethyst.webp", "")],
                "tallas": "S,M,L"
            },
            {
                "color": "Vino Tinto",
                "color_hex": "#722F37",
                "imagenes": [images_b64.get("conjunto_sculpt_eclipse.webp", ""), images_b64.get("conjunto_sculpt_eclipse_detail.webp", "")],
                "tallas": "XS,S,M,L"
            }
        ],
        "Top Deportivo Cross-Back Obsidian": [
            {
                "color": "Rosa Palo",
                "color_hex": "#D9A6B8",
                "imagenes": [images_b64.get("top_crossback_pink.webp", ""), images_b64.get("top_crossback_pink_detail.webp", "")],
                "tallas": "XS,S,M,L"
            },
            {
                "color": "Negro Onix",
                "color_hex": "#18181b",
                "imagenes": [images_b64.get("leggings_contour_black.webp", ""), images_b64.get("leggings_contour_black_detail.webp", "")],
                "tallas": "S,M,L"
            },
            {
                "color": "Púrpura Amatista",
                "color_hex": "#4A2040",
                "imagenes": [images_b64.get("set_ribbed_amethyst.webp", "")],
                "tallas": "S,M"
            }
        ],
        "Enterito Body Sculpt Luxe": [
            {
                "color": "Negro Onix",
                "color_hex": "#18181b",
                "imagenes": [images_b64.get("enterito_sculpt_luxe.webp", ""), images_b64.get("leggings_contour_black_detail.webp", "")],
                "tallas": "XS,S,M,L"
            },
            {
                "color": "Vino Tinto",
                "color_hex": "#722F37",
                "imagenes": [images_b64.get("conjunto_sculpt_eclipse.webp", "")],
                "tallas": "S,M,L"
            }
        ],
        "Set Ribbed Touch Amethyst": [
            {
                "color": "Púrpura Amatista",
                "color_hex": "#4A2040",
                "imagenes": [images_b64.get("set_ribbed_amethyst.webp", "")],
                "tallas": "S,M,L"
            },
            {
                "color": "Negro Onix",
                "color_hex": "#18181b",
                "imagenes": [images_b64.get("leggings_contour_black.webp", ""), images_b64.get("leggings_contour_black_detail.webp", "")],
                "tallas": "XS,S,M,L"
            },
            {
                "color": "Rosa Palo",
                "color_hex": "#D9A6B8",
                "imagenes": [images_b64.get("top_crossback_pink.webp", ""), images_b64.get("top_crossback_pink_detail.webp", "")],
                "tallas": "S,M"
            }
        ],
        "Bolso Deportivo StudioBJ Duffle": [
            {
                "color": "Negro Mate & Oro Rosa",
                "color_hex": "#18181b",
                "imagenes": [images_b64.get("bolso_deportivo_duffle.webp", "")],
                "tallas": "Única"
            }
        ]
    }

    # Limpiar strings vacíos de imágenes en variantes
    for prod_name, vars_list in PRODUCTOS_VARIANTES.items():
        for v in vars_list:
            v["imagenes"] = [img for img in v["imagenes"] if img]

    db: Session = SessionLocal()
    try:
        for prod_name, vars_list in PRODUCTOS_VARIANTES.items():
            prod = db.query(Producto).filter(Producto.nombre == prod_name).first()
            if prod:
                prod.variantes = json.dumps(vars_list)
                # Primary attributes from first variant
                first_var = vars_list[0]
                prod.color = first_var["color"]
                prod.talla = first_var["tallas"]
                if first_var["imagenes"]:
                    prod.imagen_base64 = first_var["imagenes"][0]
                print(f"✓ Actualizado con variantes: '{prod_name}' -> {len(vars_list)} variantes")
            else:
                print(f"⚠️ No encontrado en BD: {prod_name}")
        db.commit()
        print("✓ Base de datos actualizada con éxito con variantes por color e imágenes.")
    except Exception as e:
        db.rollback()
        print(f"Error actualizando DB: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    process_all()
