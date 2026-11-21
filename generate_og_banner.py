import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def create_banner(width=1200, height=630, is_square=False):
    cx, cy = width / 2.0, height / 2.0
    
    # 1. Crear canvas base
    # Fondo luxury oscuro con leve gradiente
    y, x = np.ogrid[:height, :width]
    dist_from_center = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    
    # 2. Recrear el resplandor radial idéntico a la imagen de referencia del usuario
    # El medallón ocupa aproximadamente el 66% de la altura
    target_diam = int(height * 0.66)
    medallion_radius = target_diam / 2.0
    
    # Halo brillante inmediatamente fuera del medallón
    dist_from_rim = dist_from_center - medallion_radius
    
    # Aura suave expandiéndose hacia el fondo
    aura_intensity = np.exp(-((np.maximum(dist_from_rim, 0)) / 110.0) ** 1.7)
    # Luz ambiental difusa
    ambient = np.exp(-(dist_from_center / (width * 0.45)) ** 2)
    
    # Colores de la referencia:
    # Resplandor cercano: Rosa Palo / Mora Cálido (#8C4468 -> 140, 68, 104)
    # Fondo medio: Ciruela Dark (#3A172B -> 58, 23, 43)
    # Fondo esquinas: Dark Luxury (#1A0D17 -> 26, 13, 23)
    
    bg_r = 26 + 32 * ambient + 82 * aura_intensity
    bg_g = 13 + 12 * ambient + 44 * aura_intensity
    bg_b = 23 + 20 * ambient + 65 * aura_intensity
    
    bg_r = np.clip(bg_r, 0, 255).astype(np.uint8)
    bg_g = np.clip(bg_g, 0, 255).astype(np.uint8)
    bg_b = np.clip(bg_b, 0, 255).astype(np.uint8)
    bg_a = np.full((height, width), 255, dtype=np.uint8)
    
    bg_arr = np.dstack((bg_r, bg_g, bg_b, bg_a))
    bg_img = Image.fromarray(bg_arr, mode="RGBA")
    bg_img = bg_img.filter(ImageFilter.GaussianBlur(radius=6))
    
    # 3. Superponer resplandor extra suave justo detrás del borde del medallón
    glow_size = target_diam + 160
    glow = Image.new("RGBA", (glow_size, glow_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    gcx, gcy = glow_size // 2, glow_size // 2
    for r in range(glow_size // 2, int(medallion_radius * 0.8), -2):
        rel = (r - medallion_radius * 0.8) / (glow_size / 2.0 - medallion_radius * 0.8)
        alpha = int(55 * math.sin(rel * math.pi))
        glow_draw.ellipse(
            (gcx - r, gcy - r, gcx + r, gcy + r),
            fill=(217, 166, 184, alpha)
        )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=18))
    bg_img.paste(glow, (int(cx - glow_size // 2), int(cy - glow_size // 2)), glow)
    
    # 4. Medallón en alta resolución
    logo_path = "frontend/public/logo.png"
    logo_img = Image.open(logo_path).convert("RGBA")
    logo_scaled = logo_img.resize((target_diam, target_diam), Image.Resampling.LANCZOS)
    
    paste_x = int(cx - target_diam // 2)
    paste_y = int(cy - target_diam // 2)
    bg_img.paste(logo_scaled, (paste_x, paste_y), logo_scaled)
    
    # 5. Marco Luxury refinado en los bordes ("bordea los bordes y dejala bonita")
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Parámetros del marco
    m_outer = 26 if not is_square else 28
    m_inner = 36 if not is_square else 38
    
    COLOR_PRIMARY = (217, 166, 184, 220)   # #D9A6B8 Rosa Oro Luxury
    COLOR_HAIRLINE = (217, 166, 184, 90)   # #D9A6B8 Filete suave
    COLOR_ACCENT = (245, 215, 224, 255)    # Punto de luz marfil/oro
    
    # Marco exterior: línea sólida continua elegante
    draw.rectangle(
        [(m_outer, m_outer), (width - m_outer, height - m_outer)],
        outline=COLOR_PRIMARY,
        width=2
    )
    
    # Marco interior: filete fino sutil
    draw.rectangle(
        [(m_inner, m_inner), (width - m_inner, height - m_inner)],
        outline=COLOR_HAIRLINE,
        width=1
    )
    
    # Ornamentos en las 4 esquinas: L-brackets y diamantes luxury
    bracket_len = 26
    corners_inner = [
        (m_inner, m_inner, 1, 1),
        (width - m_inner, m_inner, -1, 1),
        (width - m_inner, height - m_inner, -1, -1),
        (m_inner, height - m_inner, 1, -1)
    ]
    for px, py, dx, dy in corners_inner:
        # Filete en L reforzado en esquinas
        draw.line([(px, py), (px + dx * bracket_len, py)], fill=COLOR_PRIMARY, width=2)
        draw.line([(px, py), (px, py + dy * bracket_len)], fill=COLOR_PRIMARY, width=2)
    
    # Diamantes (rombos) en las 4 esquinas exteriores
    def draw_diamond(center_x, center_y, size=5):
        pts = [
            (center_x, center_y - size),
            (center_x + size, center_y),
            (center_x, center_y + size),
            (center_x - size, center_y)
        ]
        draw.polygon(pts, fill=COLOR_ACCENT)
        
    corners_outer = [
        (m_outer, m_outer),
        (width - m_outer, m_outer),
        (width - m_outer, height - m_outer),
        (m_outer, height - m_outer)
    ]
    for px, py in corners_outer:
        draw_diamond(px, py, size=6)
        
    # Pequeños diamantes en el punto medio de cada borde para acabado alta joyería
    draw_diamond(width // 2, m_outer, size=4)
    draw_diamond(width // 2, height - m_outer, size=4)
    draw_diamond(m_outer, height // 2, size=4)
    draw_diamond(width - m_outer, height // 2, size=4)
    
    # Combinar todo
    final = Image.alpha_composite(bg_img, overlay)
    return final

def main():
    print("Generando imagen de vista previa Open Graph (WhatsApp, RRSS)...")
    
    # 1. Banner oficial 1200x630 (proporción 1.91:1)
    banner_wide = create_banner(1200, 630, is_square=False)
    
    # Guardar JPEG y PNG
    jpg_path = "frontend/public/og-image.jpg"
    png_path = "frontend/public/og-image.png"
    banner_wide.convert("RGB").save(jpg_path, format="JPEG", quality=92, optimize=True)
    banner_wide.save(png_path, format="PNG", optimize=True)
    
    print(f"✓ Banner 1200x630 generado:")
    print(f"  - {jpg_path} ({os.path.getsize(jpg_path) // 1024} KB)")
    print(f"  - {png_path} ({os.path.getsize(png_path) // 1024} KB)")
    
    # 2. Versión cuadrada 800x800 para plataformas que recortan a 1:1
    banner_square = create_banner(800, 800, is_square=True)
    square_jpg_path = "frontend/public/og-image-square.jpg"
    banner_square.convert("RGB").save(square_jpg_path, format="JPEG", quality=92, optimize=True)
    print(f"✓ Banner cuadrado 800x800 generado: {square_jpg_path} ({os.path.getsize(square_jpg_path) // 1024} KB)")

if __name__ == "__main__":
    main()
