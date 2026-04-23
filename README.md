# SafeTag NFC - NFC Tag Tracking System

## Requisitos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd nfc-tag-system

# 2. Instalar dependencias
cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install

# 3. Configurar variables de entorno
cd backend
cp .env.example .env
# Editar .env con tus credenciales

# 4. Crear base de datos PostgreSQL
createdb safetag

# 5. Ejecutar migraciones (opcional - el servidor lo hace automáticamente)
npm run migrate

# 6. Iniciar el servidor
npm run dev
```

## Configuración de Variables de Entorno

```env
# Backend (.env)
JWT_SECRET=tu_clave_secreta_minimo_32_caracteres
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=tu_password
PG_DB=safetag

# Frontend (opcional)
ALLOWED_ORIGINS=http://localhost:3000,https://tudominio.com
PORT=3000

# Logging
LOG_LEVEL=INFO
NODE_ENV=development
```

## Scripts Disponibles

```bash
# Backend
npm run dev          # Iniciar en modo desarrollo
npm run migrate      # Ejecutar migraciones de BD
npm run migrate:down # Revertir última migración
npm run test         # Ejecutar tests

# Frontend
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción

# Mobile
npm run start        # Iniciar Expo
npm run android      # Construir para Android
npm run ios          # Construir para iOS
```

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/auth/me | Obtener perfil |
| POST | /api/auth/forgot-password | Solicitar recuperación |
| POST | /api/auth/reset-password | Restablecer contraseña |
| GET | /api/tags | Listar tags (paginación) |
| POST | /api/tags | Crear tag |
| PUT | /api/tags/:id | Actualizar tag |
| DELETE | /api/tags/:id | Eliminar tag |
| GET | /api/tags/:id/scans | Ver escaneos |
| GET | /api/tag/:id | Info pública de tag |

## Seguridad

- JWT con secreto mínimo 32 caracteres
- Tokens de reseteo hasheados con SHA-256
- CORS configurado con orígenes específicos
- Rate limiting en autenticación y escaneos
- Validación de inputs con Zod
- Sanitización de todos los inputs