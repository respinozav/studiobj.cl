import sys
from starlette.testclient import TestClient
from app.main import app

def test_full_api():
    client = TestClient(app)

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ GET /health: 200 OK")

    # 2. Public categories (activo = true)
    res = client.get("/api/v1/public/categorias")
    assert res.status_code == 200
    categorias = res.json()
    assert len(categorias) >= 5, f"Expected at least 5 categories, got {len(categorias)}"
    for c in categorias:
        assert c["activo"] is True
    print(f"✓ GET /api/v1/public/categorias: 200 OK ({len(categorias)} categorías activas)")

    # 3. Public products (activo = true)
    res = client.get("/api/v1/public/productos")
    assert res.status_code == 200
    productos = res.json()
    assert len(productos) >= 6, f"Expected at least 6 products, got {len(productos)}"
    for p in productos:
        assert p["activo"] is True
        assert p["imagen_base64"].startswith("data:image/webp;base64,")
        assert p["precio"] > 0
    print(f"✓ GET /api/v1/public/productos: 200 OK ({len(productos)} productos activos)")

    # 4. Auth login with admin
    login_payload = {
        "email": "admin@studiobj.cl",
        "password": "AdminStudioBJ2026!"
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_data = res.json()
    token = token_data["access_token"]
    assert token, "Token missing in response"
    print("✓ POST /api/v1/auth/login: 200 OK (JWT recibido)")

    headers = {"Authorization": f"Bearer {token}"}

    # 5. Auth /me
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    user_me = res.json()
    assert user_me["email"] == "admin@studiobj.cl"
    assert user_me["rol"] == "Super Admin"
    print(f"✓ GET /api/v1/auth/me: 200 OK (Rol: {user_me['rol']})")

    # 6. Admin list products
    res = client.get("/api/v1/admin/productos", headers=headers)
    assert res.status_code == 200
    admin_prods = res.json()
    print(f"✓ GET /api/v1/admin/productos: 200 OK ({len(admin_prods)} productos)")

    # 7. Soft delete test (deshabilitar producto y verificar que se oculta del catálogo público)
    test_prod_id = admin_prods[0]["id"]
    test_prod_name = admin_prods[0]["nombre"]

    # Deshabilitar
    res = client.patch(f"/api/v1/admin/productos/{test_prod_id}/estado", json={"activo": False}, headers=headers)
    assert res.status_code == 200
    assert res.json()["activo"] is False
    print(f"✓ PATCH /api/v1/admin/productos/{test_prod_id}/estado (activo=False): 200 OK")

    # Verificar que ya NO aparece en catálogo público
    res = client.get("/api/v1/public/productos")
    public_prods_after = res.json()
    assert not any(p["id"] == test_prod_id for p in public_prods_after), "El producto deshabilitado sigue visible en el catálogo público"
    print("✓ Verificado: Producto deshabilitado se ocultó de inmediato del catálogo público.")

    # Reactivar
    res = client.patch(f"/api/v1/admin/productos/{test_prod_id}/estado", json={"activo": True}, headers=headers)
    assert res.status_code == 200
    assert res.json()["activo"] is True
    print("✓ Verificado: Reactivación del producto (activo=True).")

    # 8. Test de creación de producto con validación de imagen base64
    new_prod_payload = {
        "categoria_id": categorias[0]["id"],
        "nombre": "Top Seamless Performance Test",
        "color": "Vino Tinto",
        "talla": "S,M",
        "imagen_base64": productos[0]["imagen_base64"],
        "precio": 21990,
        "precio_anterior": 27990,
        "etiqueta": "Nuevo",
        "descripcion": "Top de prueba para validación automática",
        "activo": True
    }
    res = client.post("/api/v1/admin/productos", json=new_prod_payload, headers=headers)
    assert res.status_code == 201, f"Error al crear producto: {res.text}"
    created_prod = res.json()
    print(f"✓ POST /api/v1/admin/productos: 201 Created (ID: {created_prod['id']})")

    # Validar rechazo de imagen inválida
    invalid_payload = new_prod_payload.copy()
    invalid_payload["imagen_base64"] = "http://invalido.com/foto.jpg"
    res = client.post("/api/v1/admin/productos", json=invalid_payload, headers=headers)
    assert res.status_code == 422, "El backend debió rechazar una imagen que no comience con data:image/"
    print("✓ Verificado: Validación de formato data:image/webp;base64,... en backend (422 Unprocessable Entity en formato inválido).")

    # Limpiar producto de prueba
    from app.database import SessionLocal
    from app.models import Producto, Color, Rol
    db_clean = SessionLocal()
    db_clean.query(Producto).filter(Producto.id == created_prod['id']).delete()
    db_clean.commit()
    db_clean.close()
    print("✓ Limpieza de producto de prueba completada.")

    # 9. Test Colores: Public and Admin
    res = client.get("/api/v1/public/colores")
    assert res.status_code == 200
    colores_pub = res.json()
    assert len(colores_pub) >= 10, f"Se esperaban al menos 10 colores estándar, se obtuvieron {len(colores_pub)}"
    print(f"✓ GET /api/v1/public/colores: 200 OK ({len(colores_pub)} colores activos)")

    res = client.get("/api/v1/admin/colores", headers=headers)
    assert res.status_code == 200
    colores_adm = res.json()
    assert len(colores_adm) >= 10
    print(f"✓ GET /api/v1/admin/colores: 200 OK ({len(colores_adm)} colores)")

    # Test crear color y toggle
    color_payload = {
        "nombre": "Test Dorado Champagne",
        "hex": "#F7E7CE",
        "descripcion": "Color de prueba",
        "activo": True
    }
    res = client.post("/api/v1/admin/colores", json=color_payload, headers=headers)
    assert res.status_code == 201
    created_col = res.json()
    assert created_col["nombre"] == color_payload["nombre"]
    print(f"✓ POST /api/v1/admin/colores: 201 Created ({created_col['nombre']})")

    # Toggle estado
    res = client.patch(f"/api/v1/admin/colores/{created_col['id']}/estado", json={"activo": False}, headers=headers)
    assert res.status_code == 200
    assert res.json()["activo"] is False
    print("✓ PATCH /api/v1/admin/colores/{id}/estado (activo=False): 200 OK")

    # Cleanup test color
    db_clean = SessionLocal()
    db_clean.query(Color).filter(Color.id == created_col['id']).delete()
    db_clean.commit()
    db_clean.close()
    print("✓ Limpieza de color de prueba completada.")

    # 10. Test Roles con asignación de módulos
    db_clean = SessionLocal()
    db_clean.query(Rol).filter(Rol.nombre == "Editor Especial").delete()
    db_clean.commit()
    db_clean.close()

    role_payload = {
        "nombre": "Editor Especial",
        "descripcion": "Rol con acceso limitado a productos y colores",
        "modulos": "productos,colores",
        "activo": True
    }
    res = client.post("/api/v1/admin/roles", json=role_payload, headers=headers)
    assert res.status_code == 201, f"Error creando rol: {res.text}"
    created_role = res.json()
    assert created_role["modulos"] == "productos,colores"
    print(f"✓ POST /api/v1/admin/roles con módulos asignados: 201 Created (módulos: {created_role['modulos']})")

    # Cleanup test role
    db_clean = SessionLocal()
    db_clean.query(Rol).filter(Rol.id == created_role['id']).delete()
    db_clean.commit()
    db_clean.close()
    print("✓ Limpieza de rol de prueba completada.")

    print("\n==================================================")
    print("TODAS LAS PRUEBAS DE ENDPOINTS FASTAPI PASARON EXITOSAMENTE (100%)")
    print("==================================================")

if __name__ == "__main__":
    test_full_api()
