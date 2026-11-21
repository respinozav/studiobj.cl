import urllib.request
import base64
import io
from PIL import Image
from app.database import SessionLocal
from app.models import Producto

products_images = {
    'Conjunto Sculpt Seamless Eclipse': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&h=800&q=82',
    'Leggings High-Rise Contour Velvet': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&h=800&q=82',
    'Top Deportivo Cross-Back Obsidian': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&h=800&q=82',
    'Enterito Body Sculpt Luxe': 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=600&h=800&q=82',
    'Bolso Deportivo StudioBJ Duffle': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&h=800&q=82',
    'Set Ribbed Touch Amethyst': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&h=800&q=82'
}

def update():
    db = SessionLocal()
    try:
        for name, url in products_images.items():
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw = resp.read()
                img = Image.open(io.BytesIO(raw)).convert('RGB')
                buf = io.BytesIO()
                img.save(buf, format='WEBP', quality=84)
                webp_bytes = buf.getvalue()
                b64_data = base64.b64encode(webp_bytes).decode('ascii')
                b64_str = f"data:image/webp;base64,{b64_data}"

                p = db.query(Producto).filter(Producto.nombre == name).first()
                if p:
                    p.imagen_base64 = b64_str
                    print(f"✓ {name}: {len(webp_bytes) // 1024} KB WebP")
                else:
                    print(f"✗ Producto {name} no encontrado")

        # También actualizar cualquier producto de prueba existente
        for p in db.query(Producto).all():
            if p.nombre not in products_images:
                # Si es un test de top o similar, asignarle una foto adecuada
                if "top" in p.nombre.lower():
                    sample_url = products_images['Top Deportivo Cross-Back Obsidian']
                elif "calza" in p.nombre.lower() or "legging" in p.nombre.lower():
                    sample_url = products_images['Leggings High-Rise Contour Velvet']
                else:
                    sample_url = products_images['Conjunto Sculpt Seamless Eclipse']
                req = urllib.request.Request(sample_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    raw = resp.read()
                    img = Image.open(io.BytesIO(raw)).convert('RGB')
                    buf = io.BytesIO()
                    img.save(buf, format='WEBP', quality=84)
                    b64_str = f"data:image/webp;base64,{base64.b64encode(buf.getvalue()).decode('ascii')}"
                    p.imagen_base64 = b64_str
                    print(f"✓ {p.nombre} (adicional): actualizado")

        db.commit()
        print("\n¡Todos los productos fueron actualizados con fotografías realistas de alta definición!")
    except Exception as e:
        db.rollback()
        print("Error actualizando imágenes:", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    update()
