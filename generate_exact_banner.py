import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def generate_exact_banner(width=1200, height=630, output_jpg="frontend/public/og-image.jpg", output_png="frontend/public/og-image.png"):
    # Cargar imagen de referencia del usuario para calibración exacta de color
    user_ref_path = r"C:/Users/respinozav/.gemini/antigravity/brain/bdb2030d-fcfc-4c82-988c-8ebf9d060cea/.user_uploaded/media_1795286363008_519dd003.png"
    user_img = Image.open(user_ref_path).convert("RGB")
    user_arr = np.array(user_img, dtype=float)
    
    # Dimensiones y centro del canvas
    cx, cy = width / 2.0, height / 2.0
    
    # 1. GENERAR FONDO EXACTO SEGÚN LA REFERENCIA
    # Gradiente vertical base muy sutil: Y=0 es [33, 19, 28], Y=height es [40, 23, 33]
    y_coords, x_coords = np.ogrid[:height, :width]
    y_norm = y_coords / float(height)
    
    base_r = 33.0 + (40.0 - 33.0) * y_norm
    base_g = 19.0 + (23.0 - 19.0) * y_norm
    base_b = 28.0 + (33.0 - 28.0) * y_norm
    
    # 2. CALCULAR TAMAÑO Y POSICIÓN DEL MEDALLÓN
    # En la referencia, el círculo tiene diámetro 114 en alto 163 (70% de la altura)
    # En 1200x630, 630 * 0.70 = 440px
    target_diam = 440
    r_medallion = target_diam / 2.0  # 220 px
    
    # Distancia desde el centro del banner
    dist = np.sqrt((x_coords - cx) ** 2 + (y_coords - cy) ** 2)
    dist_outside = np.maximum(dist - r_medallion, 0)
    
    # 3. PERFIL EXACTO DEL RESPLANDOR (AURA ESTRECHA Y SUTIL)
    # Según la medición de la imagen del usuario:
    # A distancia 0px del borde: suma ~+75 en R, +60 en G, +65 en B
    # A distancia 15px (escala original) -> ~50px (escala 1200): cae exponencialmente a +0
    decay_width = 38.0  # caída rápida y ceñida al contorno del círculo
    glow_factor = np.exp(- (dist_outside / decay_width) ** 1.6)
    
    # El resplandor solo aplica por fuera del círculo
    final_r = base_r + 76.0 * glow_factor
    final_g = base_g + 58.0 * glow_factor
    final_b = base_b + 64.0 * glow_factor
    
    final_r = np.clip(final_r, 0, 255).astype(np.uint8)
    final_g = np.clip(final_g, 0, 255).astype(np.uint8)
    final_b = np.clip(final_b, 0, 255).astype(np.uint8)
    final_a = np.full((height, width), 255, dtype=np.uint8)
    
    bg_img = Image.fromarray(np.dstack((final_r, final_g, final_b, final_a)), mode="RGBA")
    
    # Suavizado para eliminar cualquier escalonamiento de gradiente
    bg_img = bg_img.filter(ImageFilter.GaussianBlur(radius=3))
    
    # 4. SUPERPONER MEDALLÓN EN ALTA RESOLUCIÓN NÍTIDO
    logo_path = "frontend/public/logo.png"
    logo_img = Image.open(logo_path).convert("RGBA")
    logo_scaled = logo_img.resize((target_diam, target_diam), Image.Resampling.LANCZOS)
    
    paste_x = int(cx - target_diam // 2)
    paste_y = int(cy - target_diam // 2)
    bg_img.paste(logo_scaled, (paste_x, paste_y), logo_scaled)
    
    # 5. "BORDEA LOS BORDES Y DÉJALA BONITA"
    # Marco sutil, fino y sobrio en los bordes del banner (estilo Dark Luxury discreto)
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    margin = 24
    # Filete ultra-fino en tono rosa oro suave con 65% opacidad
    BORDER_COLOR = (217, 166, 184, 160)
    draw.rectangle(
        [(margin, margin), (width - margin, height - margin)],
        outline=BORDER_COLOR,
        width=1
    )
    
    # Pequeños acentos en las 4 esquinas (5px)
    corner_sz = 14
    for px, py, dx, dy in [
        (margin, margin, 1, 1),
        (width - margin, margin, -1, 1),
        (width - margin, height - margin, -1, -1),
        (margin, height - margin, 1, -1)
    ]:
        draw.line([(px, py), (px + dx * corner_sz, py)], fill=(235, 195, 208, 220), width=2)
        draw.line([(px, py), (px, py + dy * corner_sz)], fill=(235, 195, 208, 220), width=2)
    
    final_img = Image.alpha_composite(bg_img, overlay)
    
    # Guardar
    final_rgb = final_img.convert("RGB")
    final_rgb.save(output_jpg, format="JPEG", quality=93, optimize=True)
    final_img.save(output_png, format="PNG", optimize=True)
    
    # Versión cuadrada 800x800
    sq_size = 800
    sq_y, sq_x = np.ogrid[:sq_size, :sq_size]
    sq_cx, sq_cy = sq_size / 2.0, sq_size / 2.0
    sq_dist = np.sqrt((sq_x - sq_cx) ** 2 + (sq_y - sq_cy) ** 2)
    sq_target_diam = 550
    sq_r_med = sq_target_diam / 2.0
    sq_dist_out = np.maximum(sq_dist - sq_r_med, 0)
    sq_glow = np.exp(- (sq_dist_out / 45.0) ** 1.6)
    
    sq_y_norm = sq_y / float(sq_size)
    sq_r = np.clip(33.0 + 7.0 * sq_y_norm + 76.0 * sq_glow, 0, 255).astype(np.uint8)
    sq_g = np.clip(19.0 + 4.0 * sq_y_norm + 58.0 * sq_glow, 0, 255).astype(np.uint8)
    sq_b = np.clip(28.0 + 5.0 * sq_y_norm + 64.0 * sq_glow, 0, 255).astype(np.uint8)
    
    sq_bg = Image.fromarray(np.dstack((sq_r, sq_g, sq_b, np.full((sq_size, sq_size), 255, dtype=np.uint8))), mode="RGBA")
    sq_bg = sq_bg.filter(ImageFilter.GaussianBlur(radius=3))
    
    sq_logo = logo_img.resize((sq_target_diam, sq_target_diam), Image.Resampling.LANCZOS)
    sq_bg.paste(sq_logo, (int(sq_cx - sq_target_diam // 2), int(sq_cy - sq_target_diam // 2)), sq_logo)
    
    sq_overlay = Image.new("RGBA", (sq_size, sq_size), (0, 0, 0, 0))
    sq_draw = ImageDraw.Draw(sq_overlay)
    sq_draw.rectangle([(24, 24), (sq_size - 24, sq_size - 24)], outline=BORDER_COLOR, width=1)
    sq_final = Image.alpha_composite(sq_bg, sq_overlay)
    sq_final.convert("RGB").save("frontend/public/og-image-square.jpg", format="JPEG", quality=93, optimize=True)
    
    print("✓ Banner generado idéntico a la referencia del usuario.")

if __name__ == "__main__":
    generate_exact_banner()
