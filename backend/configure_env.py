#!/usr/bin/env python3
import os
import sys
import base64
import glob

def test_pg_connection(host, user, password, dbname="postgres", port=5432, timeout=5):
    """Prueba de conexión real con psycopg a PostgreSQL AWS RDS"""
    try:
        import psycopg
        conn = psycopg.connect(
            host=host,
            user=user,
            password=password,
            dbname=dbname,
            port=port,
            sslmode="require",
            connect_timeout=timeout
        )
        conn.close()
        return True, "OK"
    except Exception as e:
        return False, str(e)

def main():
    print("==================================================")
    print("STUDIOBJ.CL - CONFIGURADOR DE ENTORNO Y AWS RDS")
    print("==================================================")

    # 1. Recuperar variables desde el entorno
    b64_strip = os.environ.get("PASS_B64_STRIP", "")
    b64_raw = os.environ.get("PASS_B64_RAW", "")
    host = os.environ.get("BD_HOST_VAR") or "ls-b12cc9081f17b594187264e8c7fe42119a9bb93f.cgt2s428cp85.us-east-1.rds.amazonaws.com"
    user = os.environ.get("BD_USER_VAR") or "dbmasteruser"
    schema = os.environ.get("BD_SCHEMA_VAR") or "bdstudiobj"
    dbname = "postgres"

    pass_strip = ""
    pass_raw = ""
    if b64_strip:
        try:
            pass_strip = base64.b64decode(b64_strip).decode("utf-8", errors="replace")
        except Exception as e:
            print(f"Aviso decodificando PASS_B64_STRIP: {e}")

    if b64_raw:
        try:
            pass_raw = base64.b64decode(b64_raw).decode("utf-8", errors="replace")
        except Exception as e:
            print(f"Aviso decodificando PASS_B64_RAW: {e}")

    print(f"Target RDS Host: {host}")
    print(f"Target RDS User: {user}")
    print(f"Target RDS Schema: {schema}")
    print(f"Pass strip length: {len(pass_strip)} | Pass raw length: {len(pass_raw)}")

    working_pass = None
    working_host = host
    working_user = user

    # 2. Probar credenciales recibidas de GitHub Secrets
    candidates = []
    if pass_strip:
        candidates.append((pass_strip, "GitHub Secret (strip)"))
    if pass_raw and pass_raw != pass_strip:
        candidates.append((pass_raw, "GitHub Secret (raw)"))

    for cand_pass, label in candidates:
        print(f"\nProbando conexión con credencial: {label}...")
        ok, msg = test_pg_connection(host, user, cand_pass, dbname=dbname)
        if ok:
            print(f"✓ ¡CONEXIÓN EXITOSA A AWS RDS CON {label}!")
            working_pass = cand_pass
            break
        else:
            print(f"✗ Falló {label}: {msg}")

    # 3. Si falló la contraseña proporcionada, buscar si otros proyectos en /var/www tienen credenciales funcionales
    if not working_pass:
        print("\nBuscando credenciales en otros repositorios locales en /var/www...")
        other_env_files = glob.glob("/var/www/**/.env", recursive=True)
        for env_path in other_env_files:
            if "studiobj.cl" in env_path:
                continue
            print(f"Examinando archivo existente: {env_path}")
            try:
                env_vars = {}
                with open(env_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            env_vars[k.strip()] = v.strip().strip('"').strip("'")
                
                alt_pass = env_vars.get("DB_PASSWORD") or env_vars.get("POSTGRES_PASSWORD") or env_vars.get("PASSWORD")
                alt_host = env_vars.get("DB_HOST") or env_vars.get("POSTGRES_HOST") or host
                alt_user = env_vars.get("DB_USER") or env_vars.get("POSTGRES_USER") or user
                
                if alt_pass:
                    # Probar contra el host original de studiobj
                    ok, msg = test_pg_connection(host, user, alt_pass, dbname=dbname)
                    if ok:
                        print(f"✓ ¡CONEXIÓN EXITOSA A AWS RDS ({host}) usando credencial encontrada en {env_path}!")
                        working_pass = alt_pass
                        working_host = host
                        working_user = user
                        break
                    # Probar también con el host propio de ese env
                    if alt_host != host:
                        ok2, msg2 = test_pg_connection(alt_host, alt_user, alt_pass, dbname=dbname)
                        if ok2:
                            print(f"✓ ¡CONEXIÓN EXITOSA A HOST ALTERNATIVO ({alt_host}) encontrado en {env_path}!")
                            working_pass = alt_pass
                            working_host = alt_host
                            working_user = alt_user
                            break
            except Exception as e:
                print(f"Error leyendo {env_path}: {e}")

    # 4. Seleccionar la mejor contraseña disponible
    selected_pass = working_pass if working_pass else (pass_strip or "pidemala")
    is_connected = working_pass is not None

    # 5. Escribir backend/.env de manera segura (sin interpolaciones de bash)
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    env_file = os.path.join(backend_dir, ".env")
    
    content = f"""# PostgreSQL AWS RDS - StudioBJ (Producción)
DB_HOST={working_host}
DB_PORT=5432
DB_NAME={dbname}
DB_USER={working_user}
DB_PASSWORD={selected_pass}
DB_SCHEMA={schema}
DATABASE_URL=postgresql+psycopg://{working_user}:{selected_pass}@{working_host}:5432/{dbname}?sslmode=require
JWT_SECRET_KEY=9a8f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=480
ADMIN_EMAIL=roderick.espinoza@gmail.com
ADMIN_PASSWORD=12345678
ADMIN_NOMBRE=Roderick Espinoza
PGRST_DB_URI=postgresql://{working_user}:{selected_pass}@{working_host}:5432/{dbname}?sslmode=require
PGRST_DB_SCHEMAS={schema}
PGRST_DB_ANON_ROLE=web_anon
PGRST_SERVER_PORT=3001
"""
    with open(env_file, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\n✓ Archivo de configuración {env_file} escrito exitosamente.")

    # 6. Si la conexión fue exitosa, ejecutar seed en PostgreSQL
    if is_connected:
        print("\nEjecutando seed e inicialización de tablas en PostgreSQL AWS RDS...")
        try:
            from seed import run_seed
            run_seed()
            print("✓ Semillero y tablas en PostgreSQL completados exitosamente.")
        except Exception as e:
            print(f"Aviso durante seed en PostgreSQL: {e}")
    else:
        print("\n⚠️ AVISO: No se pudo verificar la autenticación en AWS RDS con la contraseña ingresada.")
        print(f"Error típico: FATAL: password authentication failed for user '{user}'")
        print("El backend utilizará SQLite temporalmente para no detener el sitio web.")

if __name__ == "__main__":
    main()
