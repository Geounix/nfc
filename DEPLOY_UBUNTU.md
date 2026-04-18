# 🚀 Guía Definitiva de Despliegue para SafeTag (Ubuntu Server)

Esta guía paso a paso te llevará desde un servidor Ubuntu recién instalado hasta tener **SafeTag** funcionando completamente en producción con tu dominio `geunix.com` usando PostgreSQL, Node.js, Nginx y Cloudflare Tunnels (sin exponer puertos directamente a internet).

---

## 1️⃣ Preparando el Servidor (Requisitos)

Conéctate a tu servidor Ubuntu mediante SSH y ejecuta estas instalaciones básicas:

```bash
# 1. Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js (versión 20 recomendada)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar Nginx (Servidor Web)
sudo apt install -y nginx

# 4. Instalar PostgreSQL (Base de Datos)
sudo apt install -y postgresql postgresql-contrib

# 5. Instalar PM2 (Manejador del Backend que lo mantiene vivo 24/7)
sudo npm install -g pm2
```

---

## 2️⃣ Configurar la Base de Datos PostgreSQL

Vamos a crear la base de datos y un usuario para que la aplicación se pueda conectar.

```bash
# 1. Entrar a la consola de Postgres como usuario administrador (postgres)
sudo -u postgres psql

# 2. Una vez dentro (verás postgres=#), ejecuta estos comandos uno por uno:
CREATE DATABASE safetag;
CREATE USER safeuser WITH ENCRYPTED PASSWORD 'TuPasswordSeguro123';
GRANT ALL PRIVILEGES ON DATABASE safetag TO safeuser;
\q
```
*(Asegúrate de recordar o cambiar `TuPasswordSeguro123`).*

---

## 3️⃣ Subiendo el Proyecto y Configurando `.env`

Sube o clona tu proyecto (`nfc-tag-system`) al servidor, idealmente en la ruta `/var/www/nfc-tag-system`.

```bash
# Movernos a la carpeta del backend e instalar dependencias
cd /var/www/nfc-tag-system/backend
npm install
```

Crea el archivo `.env` en la carpeta `backend`:
```bash
nano .env
```
Y pon este contenido (reemplaza los valores de la DB si los cambiaste):
```ini
PORT=3000
JWT_SECRET=UnSecretoSuperFuerteParaTokensXD1234
PG_HOST=localhost
PG_PORT=5432
PG_USER=safeuser
PG_PASSWORD=TuPasswordSeguro123
PG_DB=safetag
```
*Guarda con `Ctrl+O`, `Enter`, y sal con `Ctrl+X`.*

---

## 4️⃣ Inicializando el Backend

Ahora encendemos el backend y usamos PM2 para que vigile que nunca se apague:

```bash
# Asegúrate de seguir en la carpeta backend/
pm2 start src/index.js --name "safetag-api"

# Hacer que PM2 inicie automáticamente si el servidor se reinicia
pm2 startup
# (¡Importante! Tienes que ejecutar el comando que PM2 te genere en pantalla)
pm2 save
```

Verifica que funciona: `pm2 status`. ¡El backend ya está vivo!

---

## 5️⃣ Compilando la Aplicación Móvil (React Native Web)

Para que el túnel `cell.geunix.com` funcione para la app móvil en tu navegador de pruebas, necesitamos compilar el proyecto de Expo para web:

```bash
# Ir a la carpeta móvil
cd /var/www/nfc-tag-system/mobile

# Instalar dependencias
npm install

# Compilar para entorno Web (esto genera una carpeta /dist)
npx expo export -p web
```
La carpeta generada `/var/www/nfc-tag-system/mobile/dist` será la que Nginx sirva públicamente en `cell`.

---

## 6️⃣ Configuración de Nginx

Necesitamos configurar Nginx para manejar `web.geunix.com` (Frontend + API) y `cell.geunix.com` (App Móvil mode Web).

### Block de Configuración (web.geunix.com y cell.geunix.com)
```bash
sudo nano /etc/nginx/sites-available/safetag
```

Pega este bloque de texto exactamente como está:

```nginx
# 🌐 web.geunix.com (Website + Backend API)
server {
    listen 80;
    server_name web.geunix.com;

    # Frontend y Dashboard estáticos servidos por Node.js o directo
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}

# 📱 cell.geunix.com (PWA / Mobile Expo Web)
server {
    listen 80;
    server_name cell.geunix.com;

    root /var/www/nfc-tag-system/mobile/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Activamos la configuración y reiniciamos Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/safetag /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

*(Nota: SSL / HTTPS se configurará y forzará automáticamente gracias a Cloudflare Tunnel en el paso 7).*

---

## 7️⃣ Cloudflare Tunnels (Zero Trust) 🚇

Ahora vamos a exponer tus Nginx locales a Internet usando la magia de Cloudflare (sin abrir puertos en tu router ni lidiar con IPs dinámicas).

### Pasos en la Web de Cloudflare (Zero Trust)
1. Ve al panel de [Cloudflare Zero Trust](https://one.dash.cloudflare.com/).
2. En la izquierda, ve a **Networks > Tunnels**.
3. Clica en **Create a tunnel**.
4. Selecciona **Cloudflared** y ponle un nombre (ej: "safetag-tunnel").
5. Elige tu sistema (Debian/Ubuntu 64-bit) y Cloudflare te dará un comando largo de instalación parecido a `sudo cloudflared service install eyJh...`.

### Ejecuta ese comando en tu servidor Ubuntu.

6. De vuelta en el panel de Cloudflare (paso "Route tunnel"), vas a crear **dos Rutas Públicas (Public Hostnames)**:

   🔴 Ruta 1 (Web Principal):
   * **Subdomain**: `web`
   * **Domain**: `geunix.com`
   * **Service Type**: `HTTP`
   * **URL**: `localhost:80` (esto apuntará a Nginx que interceptará "web.geunix.com")
   * *(Opcional, HTTP Host Header)*: `web.geunix.com`

   🔴 Ruta 2 (App Móvil Web):
   * **Subdomain**: `cell`
   * **Domain**: `geunix.com`
   * **Service Type**: `HTTP`
   * **URL**: `localhost:80` (Nginx lo interceptará porque el Server Name será "cell.geunix.com")
   * *(Opcional, HTTP Host Header)*: `cell.geunix.com`

Guarda el túnel. En segundos, tus dominios `https://web.geunix.com` y `https://cell.geunix.com` estarán 100% en línea, asegurados con Certificados SSL automáticos, pasando directo hacia tu base de datos de Postgres local.

---
### 🎉 ¡Felicidades! 
SafeTag está en producción robusta con PostgreSQL. Las lecturas de NFC mandarán la ubicación y dispositivo de quien escaneó sin problemas.
