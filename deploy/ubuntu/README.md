# Configuración de Producción en Ubuntu - StudioBJ.cl

Este directorio contiene los ejemplos de configuración y automatización para el servidor Ubuntu (AWS EC2):

1. **Systemd (`studiobj-api.service.example`)**:
   Servicio para uvicorn y FastAPI en `/var/www/studiobj.cl/backend`.
   El script `deploy/deploy.sh` detecta automáticamente si el puerto 8000, 8001, 8002, 8003... está en uso y asigna el siguiente puerto libre disponible en el sistema.

2. **Nginx (`nginx-studiobj.cl.conf.example`)**:
   Configuración de host virtual para `studiobj.cl` y `www.studiobj.cl`.
   Enruta las peticiones estáticas hacia `/var/www/studiobj.cl/frontend/dist` y reenvía `/api` hacia el puerto asignado a FastAPI.
   Si ya existe SSL mediante Certbot, el script de despliegue actualiza el puerto sin sobreescribir la configuración SSL.

3. **Deploy Automatizado (`deploy/deploy.sh`)**:
   Script invocado automáticamente por GitHub Actions vía SSH (`.github/workflows/deploy.yml`).
