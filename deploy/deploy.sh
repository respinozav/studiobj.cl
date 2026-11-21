#!/bin/bash

##############################################################################
# DEPLOY UNIVERSAL - STUDIOBJ.CL (Dark Luxury E-Commerce)
# React (Vite) + FastAPI (Python) + Nginx + HTTPS (Certbot)
#
# Soporta:
#   - Detección automática del proyecto y entorno
#   - Instalación y compilación de React Frontend en /frontend
#   - Virtualenv, dependencias y backend FastAPI en /backend
#   - Detección dinámica de puerto libre (si 8000/8001/etc están ocupados,
#     asigna el siguiente puerto disponible sin colisionar con otras apps)
#   - Configuración y recarga de Systemd (studiobj-api.service)
#   - Configuración y recarga de Nginx (/etc/nginx/sites-available/studiobj.cl)
#   - Configuración automática de HTTPS con Certbot (Let's Encrypt)
##############################################################################

set -e
set -o pipefail

START_TIME=$(date +%s)

############################################
# COLORES
############################################

RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
NC="\033[0m"

############################################
# RUTAS DEL PROYECTO
############################################

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME=$(basename "$PROJECT_DIR")

BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

DEPLOY_DIR="$PROJECT_DIR/deploy"
LOG_DIR="$PROJECT_DIR/logs"
BACKUP_DIR="$PROJECT_DIR/backup"

mkdir -p "$DEPLOY_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$LOG_DIR/deploy-$DATE.log"

exec > >(tee -a "$LOG_FILE") 2>&1

############################################
# CABECERA
############################################

echo ""
echo -e "${CYAN}====================================================${NC}"
echo -e "${GREEN}          DEPLOY $PROJECT_NAME (Dark Luxury)${NC}"
echo -e "${CYAN}====================================================${NC}"
echo ""

############################################
# INFORMACIÓN GIT
############################################

echo -e "${BLUE}Repositorio:${NC} $PROJECT_DIR"
echo -e "${BLUE}Usuario:${NC} $(whoami)"
echo -e "${BLUE}Fecha:${NC} $(date)"

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "initial")

echo -e "${BLUE}Branch:${NC} $CURRENT_BRANCH"
echo -e "${BLUE}Commit:${NC} $CURRENT_COMMIT"

SERVICE_NAME="studiobj-api"
NGINX_ROOT="$PROJECT_DIR/frontend/dist"
NGINX_FALLBACK_ROOT="/var/www/html/$PROJECT_NAME"

############################################
# GIT PULL
############################################

echo ""
echo -e "${YELLOW}>> Actualizando repositorio...${NC}"

git checkout main 2>/dev/null || true
git fetch origin main || true
git reset --hard origin/main || true
git clean -fd deploy/ 2>/dev/null || true

NEW_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "$CURRENT_COMMIT")
echo "Commit desplegado: $NEW_COMMIT"

############################################
# DETECCIÓN DE COMPONENTES
############################################

IS_BACKEND=false
IS_FRONTEND=false

if [ -d "$BACKEND_DIR" ]; then
    IS_BACKEND=true
fi

if [ -d "$FRONTEND_DIR" ]; then
    IS_FRONTEND=true
fi

echo ""
echo -e "${CYAN}>> Componentes detectados:${NC} Backend=$IS_BACKEND, Frontend=$IS_FRONTEND"

############################################
# 1. GESTIÓN DE PUERTO LIBRE PARA EL BACKEND
############################################

TARGET_PORT=""

check_port_free() {
    local p=$1
    # 1. Comprobar socket escuchando con ss
    if sudo ss -tulpn 2>/dev/null | grep -E "(:| )$p\b" >/dev/null 2>&1; then
        return 1
    fi
    # 2. Comprobar con lsof si existe
    if command -v lsof >/dev/null 2>&1 && sudo lsof -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
        return 1
    fi
    # 3. Comprobar conectividad curl
    if curl -s -m 1 "http://127.0.0.1:$p" >/dev/null 2>&1; then
        return 1
    fi
    return 0
}

if [ "$IS_BACKEND" = true ]; then

    echo ""
    echo -e "${YELLOW}>> Determinando puerto libre para $SERVICE_NAME...${NC}"

    # Detener temporalmente el servicio studiobj si estuviera corriendo para liberar su propio socket
    sudo systemctl stop "$SERVICE_NAME" 2>/dev/null || true
    sleep 1

    # Iniciar búsqueda secuencial a partir del puerto 8000
    CHECK_PORT=8000
    while true; do
        if check_port_free "$CHECK_PORT"; then
            TARGET_PORT=$CHECK_PORT
            echo -e "${GREEN}>>> Puerto libre asignado para StudioBJ Backend: $TARGET_PORT <<<${NC}"
            break
        else
            echo -e "${YELLOW}Puerto $CHECK_PORT ocupado por otra aplicación en el servidor. Probando siguiente puerto...${NC}"
            CHECK_PORT=$((CHECK_PORT + 1))
        fi
    done

fi

############################################
# 2. BACKEND (FASTAPI / PYTHON)
############################################

if [ "$IS_BACKEND" = true ]; then

    echo ""
    echo -e "${YELLOW}>> Configurando Backend FastAPI${NC}"

    cd "$BACKEND_DIR"

    # Asegurar archivo .env con credenciales reales de AWS RDS y usuario admin actualizado
    if [ ! -f "$BACKEND_DIR/.env" ] || ! grep -q "roderick.espinoza" "$BACKEND_DIR/.env"; then
        echo "Actualizando .env con credenciales reales a partir de .env.example..."
        cp -f "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    fi

    ACTIVE_VENV="$BACKEND_DIR/venv"
    if ! "$ACTIVE_VENV/bin/python" -c "import sys; sys.exit(0)" 2>/dev/null || [ ! -x "$ACTIVE_VENV/bin/uvicorn" ]; then
        echo "Recreando entorno virtual $ACTIVE_VENV..."
        rm -rf "$ACTIVE_VENV" "$BACKEND_DIR/.venv" 2>/dev/null || true
        python3 -m venv "$ACTIVE_VENV"
    fi

    # Enlace simbólico .venv -> venv
    rm -rf "$BACKEND_DIR/.venv" 2>/dev/null || true
    ln -sfn "$ACTIVE_VENV" "$BACKEND_DIR/.venv" || true

    # Activar venv e instalar dependencias
    source "$ACTIVE_VENV/bin/activate"

    echo "Actualizando pip e instalando dependencias..."
    pip install --upgrade pip
    pip install --force-reinstall "sniffio>=1.3.1" "anyio>=4.4.0" || true
    pip install -r requirements.txt
    pip install "uvicorn[standard]"

    echo "Verificando binario uvicorn:"
    "$ACTIVE_VENV/bin/uvicorn" --version || echo "Aviso uvicorn version"

    echo "Validando importación de FastAPI app.main..."
    PYTHONPATH="$BACKEND_DIR" "$ACTIVE_VENV/bin/python" -c "import app.main; print('app.main importado exitosamente')"

    echo "Ejecutando seed e inicialización de esquema/tablas en base de datos..."
    PYTHONPATH="$BACKEND_DIR" "$ACTIVE_VENV/bin/python" seed.py || echo "Aviso en seed.py"

    deactivate

    # Permisos completos y robustos para ejecución bajo www-data
    echo "Asegurando permisos en el directorio del proyecto y base de datos..."
    sudo touch "$PROJECT_DIR/studiobj_local.db" 2>/dev/null || true
    sudo chmod -R a+rX "$ACTIVE_VENV" 2>/dev/null || true
    sudo chmod +x "$ACTIVE_VENV/bin/"* 2>/dev/null || true
    sudo chown -R www-data:www-data "$BACKEND_DIR" "$PROJECT_DIR/studiobj_local.db" 2>/dev/null || true
    sudo chmod -R 775 "$BACKEND_DIR" 2>/dev/null || true

    ########################################
    # CONFIGURACIÓN DEL SERVICIO SYSTEMD
    ########################################

    echo ""
    echo -e "${YELLOW}>> Configurando Systemd para $SERVICE_NAME en puerto $TARGET_PORT...${NC}"

    SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

    sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=StudioBJ FastAPI Backend API
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$BACKEND_DIR
Environment="PYTHONPATH=$BACKEND_DIR"
EnvironmentFile=-$BACKEND_DIR/.env
ExecStart=$ACTIVE_VENV/bin/uvicorn app.main:app --host 127.0.0.1 --port $TARGET_PORT --proxy-headers
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    echo "Recargando daemon de systemd y reiniciando $SERVICE_NAME..."
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME" || true
    sudo systemctl restart "$SERVICE_NAME"

    echo "Esperando 4 segundos a que uvicorn inicie en el puerto $TARGET_PORT..."
    sleep 4

    # Verificación de salud y productos del backend
    HEALTH_OK=false
    for attempt in {1..10}; do
        HTTP_CODE=$(curl -s -o /tmp/resp_studiobj.json -w "%{http_code}" "http://127.0.0.1:$TARGET_PORT/health" 2>/dev/null || echo "000")
        PROD_CODE=$(curl -s -o /tmp/resp_prod.json -w "%{http_code}" "http://127.0.0.1:$TARGET_PORT/api/v1/public/productos" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] && [ "$PROD_CODE" = "200" ]; then
            echo -e "${GREEN}¡Backend StudioBJ respondiendo 200 OK en puerto $TARGET_PORT (/health y /api/v1/public/productos)! (Intento $attempt)${NC}"
            HEALTH_OK=true
            break
        elif [ "$HTTP_CODE" = "200" ]; then
            echo -e "${YELLOW}Backend activo pero /api/v1/public/productos devolvió HTTP $PROD_CODE. Reintentando...${NC}"
        fi
        sleep 1
    done

    echo "=== Estado del servicio $SERVICE_NAME ==="
    sudo systemctl --no-pager --full status "$SERVICE_NAME" || true

    if [ "$HEALTH_OK" = false ]; then
        echo -e "${RED}ADVERTENCIA: El backend no devolvió 200 en http://127.0.0.1:$TARGET_PORT/health${NC}"
        echo "=== Últimos logs de journalctl para $SERVICE_NAME ==="
        sudo journalctl -u "$SERVICE_NAME" -n 50 --no-pager || true
    fi

fi

############################################
# 3. FRONTEND (REACT / VITE)
############################################

if [ "$IS_FRONTEND" = true ]; then

    echo ""
    echo -e "${YELLOW}>> Frontend React ($FRONTEND_DIR)${NC}"

    cd "$FRONTEND_DIR"

    # Inyectar VITE_API_BASE en producción
    echo "VITE_API_BASE=/api/v1" > .env.production

    echo "Instalando dependencias npm..."
    npm install

    echo "Compilando frontend para producción..."
    npm run build

    # Backup del frontend previo
    mkdir -p "$BACKUP_DIR/$DATE"
    if [ -d "$NGINX_ROOT" ]; then
        sudo cp -R "$NGINX_ROOT"/. "$BACKUP_DIR/$DATE/" 2>/dev/null || true
    fi

    # Copiar también al directorio HTML estándar
    sudo mkdir -p "$NGINX_FALLBACK_ROOT"
    sudo cp -R dist/* "$NGINX_FALLBACK_ROOT"/ 2>/dev/null || true
    sudo chown -R www-data:www-data "$NGINX_FALLBACK_ROOT" 2>/dev/null || true

    # Permisos de lectura en dist del repo
    sudo chown -R www-data:www-data "$FRONTEND_DIR/dist" 2>/dev/null || true
    sudo chmod -R 755 "$FRONTEND_DIR/dist" 2>/dev/null || true

fi

############################################
# 4. CONFIGURACIÓN Y ACTUALIZACIÓN DE NGINX
############################################

echo ""
echo -e "${YELLOW}>> Configurando Nginx para studiobj.cl...${NC}"

NGINX_CONF="/etc/nginx/sites-available/studiobj.cl"
NGINX_LINK="/etc/nginx/sites-enabled/studiobj.cl"

if [ -f "$NGINX_CONF" ]; then
    echo "Actualizando proxy_pass con puerto $TARGET_PORT en configuración existente de Nginx..."
    sudo sed -i -E "s|proxy_pass http://127.0.0.1:[0-9]+|proxy_pass http://127.0.0.1:$TARGET_PORT|g" "$NGINX_CONF"
else
    echo "Creando configuración inicial de Nginx para studiobj.cl..."
    sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name studiobj.cl www.studiobj.cl;

    root $PROJECT_DIR/frontend/dist;
    index index.html;

    # Compresión gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Proxy hacia FastAPI Backend
    location /api {
        proxy_pass http://127.0.0.1:$TARGET_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check directo
    location /health {
        proxy_pass http://127.0.0.1:$TARGET_PORT/health;
        proxy_set_header Host \$host;
    }

    # Soporte para React Router (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Caché para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
EOF
fi

# Habilitar sitio en Nginx
sudo ln -sfn "$NGINX_CONF" "$NGINX_LINK"

echo "Verificando sintaxis de Nginx..."
sudo nginx -t

echo "Recargando Nginx..."
sudo systemctl reload nginx

############################################
# 5. CONFIGURACIÓN DE HTTPS (CERTBOT / SSL)
############################################

echo ""
echo -e "${YELLOW}>> Verificando / Configurando HTTPS (Certbot SSL)...${NC}"

# Instalar certbot si no está presente
if ! command -v certbot >/dev/null 2>&1; then
    echo "Instalando certbot y módulo nginx..."
    sudo apt-get update -y || true
    sudo apt-get install -y certbot python3-certbot-nginx || true
fi

# Solicitar o renovar certificados SSL para studiobj.cl y www.studiobj.cl
if command -v certbot >/dev/null 2>&1; then
    echo "Ejecutando certbot para studiobj.cl y www.studiobj.cl..."
    sudo certbot --nginx -d studiobj.cl -d www.studiobj.cl --non-interactive --agree-tos --redirect -m admin@studiobj.cl --keep-until-expiring 2>/dev/null || \
    sudo certbot --nginx -d studiobj.cl --non-interactive --agree-tos --redirect -m admin@studiobj.cl --keep-until-expiring 2>/dev/null || \
    sudo certbot --nginx -d studiobj.cl -d www.studiobj.cl --non-interactive --agree-tos --redirect --register-unsafely-without-email --keep-until-expiring 2>/dev/null || \
    echo -e "${YELLOW}Aviso Certbot: No se pudo emitir certificado automáticamente en este momento. Verifique que los registros DNS A de studiobj.cl y www.studiobj.cl apunten a la IP pública de este servidor.${NC}"

    # Recargar Nginx tras posible actualización de certificados
    sudo nginx -t && sudo systemctl reload nginx || true
fi

############################################
# TIEMPO Y RESUMEN
############################################

END_TIME=$(date +%s)
SECONDS_TOTAL=$((END_TIME-START_TIME))

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}DEPLOY FINALIZADO CORRECTAMENTE${NC}"
echo -e "${GREEN}====================================================${NC}"
echo "Proyecto       : $PROJECT_NAME"
echo "Servicio API   : $SERVICE_NAME"
echo "Puerto Backend : $TARGET_PORT"
echo "Frontend Root  : $NGINX_ROOT"
echo "Branch         : $CURRENT_BRANCH"
echo "Commit         : $NEW_COMMIT"
echo "Usuario        : $(whoami)"
echo "Duración       : ${SECONDS_TOTAL} segundos"
echo "Log            : $LOG_FILE"
echo -e "${GREEN}====================================================${NC}"
echo ""
