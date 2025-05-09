# Scripts Administrativos para Agricoventas

Este directorio contiene scripts útiles para la administración del sistema Agricoventas.

## Creación de Usuario Administrador

Existen dos scripts para crear usuarios administradores:

### 1. Creación Interactiva

Este script te guiará paso a paso para crear un usuario administrador mediante preguntas interactivas.

```bash
# Desde la raíz del proyecto backend
npm run create-admin
```

O directamente con:

```bash
npx ts-node src/scripts/createAdminUser.ts
```

### 2. Creación por Línea de Comandos (CLI)

Este script permite crear un usuario administrador directamente desde la línea de comandos, ideal para automatización.

```bash
# Desde la raíz del proyecto backend
npm run create-admin-cli -- -u admin2 -n "Admin Principal" -e admin2@example.com -p Contraseña123!
```

O directamente con:

```bash
npx ts-node src/scripts/createAdminCLI.ts -u admin2 -n "Admin Principal" -e admin2@example.com -p Contraseña123!
```

### Opciones disponibles (CLI)

| Opción corta | Opción larga | Descripción        |
|--------------|--------------|---------------------|
| -u           | --username   | Nombre de usuario   |
| -n           | --fullname   | Nombre completo     |
| -e           | --email      | Correo electrónico  |
| -p           | --password   | Contraseña          |

## Requisitos de Contraseña

La contraseña debe cumplir los siguientes requisitos:
- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos una letra minúscula
- Al menos un número
- Al menos un carácter especial

## Notas

- Estos scripts validan que el usuario no exista previamente
- Se conectan directamente a la base de datos MongoDB configurada en las variables de entorno
- Requieren que Prisma ORM esté correctamente configurado
- Las contraseñas se almacenan encriptadas usando bcrypt 