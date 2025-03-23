# Backend de Agricoventas

API RESTful para el sistema Agricoventas, construido con Express, TypeScript y Prisma ORM con MongoDB.

## Estructura del Proyecto

```
src/
├── prisma/            # Cliente Prisma centralizado
├── models/            # Modelos de datos (capa de abstracción sobre Prisma)
├── controllers/       # Controladores para manejar las peticiones HTTP
├── middlewares/       # Middlewares para autenticación y autorización
├── routes/            # Rutas de la API
├── config/            # Configuraciones (base de datos, variables de entorno)
└── server.ts          # Punto de entrada de la aplicación
```

## Arquitectura

El proyecto sigue una arquitectura limpia y escalable:

1. **Prisma Schema**: Define el esquema de la base de datos MongoDB
2. **Modelos**: Abstraen las operaciones con la base de datos
3. **Controladores**: Manejan la lógica de negocio y la comunicación con los modelos
4. **Middlewares**: Procesan las peticiones antes de llegar a los controladores
5. **Rutas**: Definen los endpoints de la API

## Características principales

- **Autenticación JWT**: Sistema seguro de autenticación y autorización
- **Roles de usuario**: Funcionalidad para usuarios normales y administradores
- **Validación de datos**: Validación completa de entradas usando express-validator
- **Manejo de errores**: Sistema centralizado de manejo de errores
- **Conexión segura a MongoDB**: Usando Prisma ORM para operaciones seguras

## Beneficios de la estructura

- **Escalabilidad**: Fácil de expandir con nuevos modelos y funcionalidades
- **Mantenibilidad**: Separación clara de responsabilidades
- **Testabilidad**: Estructura que facilita las pruebas unitarias e integración
- **Seguridad**: Implementación de mejores prácticas de seguridad

## Cómo añadir nuevas funcionalidades

1. Define el modelo en el schema de Prisma
2. Ejecuta `npx prisma generate` para actualizar el cliente Prisma
3. Crea un nuevo modelo en `src/models/` para abstraer operaciones de base de datos
4. Implementa los controladores en `src/controllers/`
5. Define las rutas en `src/routes/`
6. Actualiza `src/server.ts` para incluir las nuevas rutas

## Comandos útiles

- `npm run dev`: Inicia el servidor en modo desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm start`: Inicia la aplicación en modo producción
- `npx prisma generate`: Genera el cliente Prisma basado en el schema
- `npx prisma db push`: Actualiza la base de datos con el schema actual 