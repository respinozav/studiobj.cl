import os
import glob
import io
import base64
from PIL import Image
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Producto

BRAIN_DIR = r"C:\Users\respinozav\.gemini\antigravity\brain\830bd6d5-22c4-4dc8-8e11-1a0e108f8651"
PUBLIC_PRODUCTS_DIR = r"C:\Proyectos\Repos\studiobj.cl\frontend\public\products"
os.makedirs(PUBLIC_PRODUCTS_DIR, exist_ok=True)

# Product mapping by pattern
MAPPINGS = [
    {
        "pattern": "conjunto_sculpt_eclipse",
        "product_name": "Conjunto Sculpt Seamless Eclipse",
        "target_filename": "conjunto_sculpt_eclipse.webp"
    },
    {
        "pattern": "leggings_contour_black",
        "product_name": "Leggings High-Rise Contour Velvet",
        "target_filename": "leggings_contour_black.webp"
    },
    {
        "pattern": "top_crossback_pink",
        "product_name": "Top Deportivo Cross-Back Obsidian",
        "target_filename": "top_crossback_pink.webp"
    },
    {
        "pattern": "enterito_sculpt_luxe",
        "product_name": "Enterito Body Sculpt Luxe",
        "target_filename": "enterito_sculpt_luxe.webp"
    },
    {
        "pattern": "set_ribbed_amethyst",
        "product_name": "Set Ribbed Touch Amethyst",
        "target_filename": "set_ribbed_amethyst.webp"
    },
    {
        "pattern": "bolso_deportivo_duffle",
        "product_name": "Bolso Deportivo StudioBJ Duffle",
        "target_filename": "bolso_deportivo_duffle.webp"
    }
]

def process():
    db: Session = SessionLocal()
    try:
        for item in MAPPINGS:
            # find latest file in BRAIN_DIR matching pattern
            matches = glob.glob(os.path.join(BRAIN_DIR, f"*{item['pattern']}*.jpg"))
            if not matches:
                print(f"⚠️ No matches found for pattern {item['pattern']}")
                continue
            
            # Sort by mtime descending
            matches.sort(key=os.path.getmtime, reverse=True)
            src_path = matches[0]
            dest_path = os.path.join(PUBLIC_PRODUCTS_DIR, item["target_filename"])
            
            img = Image.open(src_path).convert("RGB")
            # Resize preserving 3:4 aspect ratio if needed, e.g. 600x800 or 750x1000
            w, h = img.size
            target_w = 600
            target_h = int(target_w * (4 / 3))
            
            # Crop to 3:4 if needed, then resize
            current_ratio = h / w
            expected_ratio = 4.0 / 3.0
            if abs(current_ratio - expected_ratio) > 0.05:
                # Center crop to 3:4
                if current_ratio > expected_ratio:
                    new_h = int(w * expected_ratio)
                    top = (h - new_h) // 2
                    img = img.crop((0, top, w, top + new_h))
                else:
                    new_w = int(h / expected_ratio)
                    left = (w - new_w) // 2
                    img = img.crop((left, 0, left + new_w, h))
            
            img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            # Save to frontend/public/products
            img.save(dest_path, format="WEBP", quality=85)
            
            # Convert to WebP base64
            buf = io.BytesIO()
            img.save(buf, format="WEBP", quality=85)
            b64_str = f"data:image/webp;base64,{base64.b64encode(buf.getvalue()).decode('ascii')}"
            
            # Update product in DB
            prod = db.query(Producto).filter(Producto.nombre == item["product_name"]).first()
            if prod:
                prod.imagen_base64 = b64_str
                print(f"✓ Actualizado en DB: '{item['product_name']}' -> {len(b64_str)} chars WebP (Guardado en {dest_path})")
            else:
                print(f"⚠️ Producto '{item['product_name']}' no encontrado en BD")
                
        db.commit()
        print("✓ Todos los productos actualizados con éxito en la base de datos.")
    except Exception as e:
        db.rollback()
        print(f"Error procesando imágenes: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    process()
