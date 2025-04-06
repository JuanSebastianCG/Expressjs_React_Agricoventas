# 🌾 Agricoventas

Una aplicación full-stack para la gestión y seguimiento de ventas agrícolas, diseñada para conectar agricultores con compradores de manera eficiente.

## 📋 Características Principales

- 🔐 **Sistema de Autenticación Robusto**
  - Registro y login de usuarios
  - Tokens JWT con refresh tokens
  - Protección de rutas por roles
  - Blacklisting de tokens para logout seguro

- 👥 **Gestión de Usuarios**
  - Perfiles de usuario personalizables
  - Roles diferenciados (admin, vendedor, comprador)
  - Validación de datos en tiempo real
  - Gestión de contraseñas segura con bcrypt

- 🛠️ **Características Técnicas**
  - API RESTful con Express
  - Base de datos MongoDB con Prisma ORM
  - Frontend moderno con React y Vite
  - TypeScript end-to-end
  - Documentación de API con Swagger

## 🚀 Tecnologías Utilizadas

### Backend
- Node.js con Express
- TypeScript
- Prisma ORM
- MongoDB
- JWT para autenticación
- Swagger para documentación
- Zod para validación
- Morgan y Pino para logging

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS
- React Router DOM
- React Hook Form
- Zustand para estado global
- Axios para peticiones HTTP

## 💻 Requisitos Previos

- Node.js (v18 o superior)
- MongoDB (local o remota)
- npm o yarn
- Git

## ⚙️ Configuración del Proyecto

### 1. Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd Expressjs_React_Agricoventas
```

### 2. Configuración del Backend

1. Instalar dependencias:
```bash
cd backend
npm install
```

2. Configurar variables de entorno:
   - Copiar `.env.example` a `.env`
   - Configurar las siguientes variables:
     ```env
     NODE_ENV=development
     PORT=3000
     DATABASE_URL=<tu-url-de-mongodb>
     JWT_SECRET=<tu-secret-key>
     JWT_EXPIRES_IN=1d
     REFRESH_TOKEN_SECRET=<tu-refresh-secret>
     REFRESH_TOKEN_EXPIRES_IN=7d
     ```

3. Configurar Prisma:
```bash
npx prisma generate
npx prisma db push
```

4. Ejecutar Seeds (Datos Iniciales):
```bash
npx prisma db seed
```

Esto creará los siguientes usuarios por defecto:
- **Admin User**
  - Username: `admin`
  - Password: `admin123`
  - Email: `admin@agricoventas.com`
  - Rol: `admin`

- **Regular User**
  - Username: `user`
  - Password: `user123`
  - Email: `user@agricoventas.com`
  - Rol: `user`

- **Test User**
  - Username: `juanperez`
  - Password: `Password123!`
  - Email: `juan@agricoventas.com`
  - Rol: `user`

### 3. Configuración del Frontend

1. Instalar dependencias:
```bash
cd frontend
npm install
```

2. Configurar variables de entorno:
   - Copiar `.env.example` a `.env`
   - Configurar:
     ```env
     VITE_API_URL=http://localhost:3000/api
     ```

## 🚀 Ejecutar el Proyecto

### Desarrollo

1. Backend:
```bash
cd backend
npm run dev
```

2. Frontend:
```bash
cd frontend
npm run dev
```

### Producción

1. Backend:
```bash
cd backend
npm run build
npm start
```

2. Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## 📚 Documentación de la API

La documentación de la API está disponible en:
- Desarrollo: `http://localhost:3000/api-docs`
- Producción: `https://tu-dominio.com/api-docs`

### Endpoints Principales

#### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login de usuarios
- `POST /api/auth/logout` - Logout de usuarios
- `POST /api/auth/refresh` - Refrescar token de acceso
- `GET /api/auth/profile` - Obtener perfil de usuario

## 🧪 Testing

```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

## 📦 Estructura del Proyecto

```
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/
│   └── tests/
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── pages/
    │   ├── services/
    │   ├── store/
    │   └── utils/
    └── public/
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- Juan Sebastian Giraldo - Desarrollador Principal

## 📞 Soporte

Si tienes alguna pregunta o problema:
1. Revisa la [documentación](link-a-la-documentación)
2. Abre un [issue](link-a-los-issues)
3. Contacta al equipo de desarrollo 