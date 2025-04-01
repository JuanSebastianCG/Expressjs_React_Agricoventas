# Frontend de Agricoventas

Este proyecto es la interfaz de usuario para la aplicación Agricoventas, desarrollada con React, TypeScript y Tailwind CSS.

## Tecnologías utilizadas

- **React**: Biblioteca de JavaScript para construir interfaces de usuario
- **TypeScript**: Superset de JavaScript con tipado estático
- **Vite**: Herramienta de compilación rápida para desarrollo web moderno
- **Tailwind CSS**: Framework CSS de utilidad para desarrollo rápido
- **React Router**: Enrutador para aplicaciones React
- **Zustand**: Gestión de estado minimalista
- **Axios**: Cliente HTTP para realizar peticiones a la API
- **React Hook Form**: Manejo de formularios
- **Zod**: Validación de formularios y esquemas

## Requisitos previos

- Node.js 18.x o superior
- npm 9.x o superior

## Instalación

1. Clona el repositorio
2. Navega al directorio del proyecto: `cd frontend`
3. Instala las dependencias: `npm install`

## Scripts disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la aplicación construida
- `npm run lint`: Ejecuta el linter
- `npm run lint:fix`: Corrige errores de linting

## Estructura del proyecto

```
src/
├── assets/        # Imágenes, iconos y otros recursos estáticos
├── components/    # Componentes reutilizables
│   ├── common/    # Componentes comunes específicos de la aplicación
│   ├── layout/    # Componentes de diseño y estructura
│   └── ui/        # Componentes de interfaz de usuario básicos
├── context/       # Estado global de la aplicación (Zustand)
├── features/      # Componentes específicos de características
├── hooks/         # Hooks personalizados
├── lib/           # Configuraciones de bibliotecas
├── pages/         # Componentes de páginas
├── services/      # Servicios para comunicación con API
├── types/         # Definiciones de tipos TypeScript
└── utils/         # Funciones de utilidad
```

## Mejores prácticas

- Utiliza componentes funcionales con hooks
- Mantén los componentes pequeños y centrados en una tarea
- Separa la lógica de negocio de los componentes de interfaz de usuario
- Utiliza tipos para definir interfaces y props
- Sigue un enfoque de "mobile-first" para el diseño
- Utiliza las utilidades de Tailwind para estilos coherentes
