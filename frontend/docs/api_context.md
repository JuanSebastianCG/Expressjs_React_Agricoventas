# Endpoints de la API

## Auth

| Método | Endpoint         | Descripción                             | Body (JSON)                                                                                           | Autenticación |
|--------|------------------|-----------------------------------------|--------------------------------------------------------------------------------------------------------|---------------|
| POST   | `/auth/register` | Registrar nuevo usuario                 | `{ "email": string, "password": string, "username": string, "fullName": string }`                      | No            |
| POST   | `/auth/login`    | Iniciar sesión                          | `{ "username": string, "password": string }`                                                           | No            |
| GET    | `/auth/profile`  | Obtener perfil del usuario actual       | _N/A_                                                                                                  | Sí (Bearer)   |
| PUT    | `/users/profile` | Actualizar perfil del usuario actual    | `{ "fullName": string, "email": string }`                                                              | Sí (Bearer)   |
| POST   | `/auth/refresh`  | Refrescar token                         | _N/A_ (generalmente envías el refresh token en cookies o en el body, depende de tu implementación)     | No\*          |
| POST   | `/auth/logout`   | Cerrar sesión                           | _N/A_                                                                                                  | Sí (Bearer)   |

> \* La ruta `/auth/refresh` puede variar según tu implementación. En algunos casos, requiere el refresh token o un token válido.

---

## Users

| Método | Endpoint          | Descripción                          | Body (JSON)            | Autenticación       |
|--------|-------------------|--------------------------------------|------------------------|---------------------|
| GET    | `/users`          | Obtener todos los usuarios           | _N/A_                  | Sí (Bearer, Admin)  |
| GET    | `/users/{userId}` | Obtener un usuario por ID            | _N/A_                  | Sí (Bearer, Admin)  |
| PUT    | `/users/{userId}/role` | Actualizar rol de usuario       | `{ "role": "ADMIN" }` | Sí (Bearer, Admin)  |
| POST   | `/users/{userId}/disable` | Deshabilitar usuario         | _N/A_                  | Sí (Bearer, Admin)  |

---

## Products

| Método | Endpoint                | Descripción                       | Body (JSON)                                                                                  | Autenticación     |
|--------|-------------------------|-----------------------------------|----------------------------------------------------------------------------------------------|-------------------|
| GET    | `/products`            | Obtener todos los productos       | _N/A_                                                                                        | No                |
| GET    | `/products/{productId}`| Obtener un producto por ID        | _N/A_                                                                                        | No                |
| POST   | `/products`            | Crear un nuevo producto           | `{ "name": string, "description": string, "price": number, "category": string, "stock": number, "unit": string }` | Sí (Bearer)       |
| PUT    | `/products/{productId}`| Actualizar un producto existente  | `{ "name"?: string, "description"?: string, "price"?: number, "stock"?: number }`            | Sí (Bearer)       |
| DELETE | `/products/{productId}`| Eliminar un producto              | _N/A_                                                                                        | Sí (Bearer)       |

---

## Categories

| Método | Endpoint                     | Descripción                           | Body (JSON)                                                   | Autenticación |
|--------|------------------------------|---------------------------------------|---------------------------------------------------------------|---------------|
| GET    | `/categories`               | Obtener todas las categorías          | _N/A_                                                         | No            |
| GET    | `/categories/{categoryId}`   | Obtener una categoría por ID          | _N/A_                                                         | No            |
| POST   | `/categories`               | Crear una nueva categoría             | `{ "name": string, "description": string }`                   | Sí (Bearer)   |
| PUT    | `/categories/{categoryId}`   | Actualizar una categoría existente    | `{ "name"?: string, "description"?: string }`                 | Sí (Bearer)   |
| DELETE | `/categories/{categoryId}`   | Eliminar una categoría                | _N/A_                                                         | Sí (Bearer)   |

---

## Orders

| Método | Endpoint                      | Descripción                               | Body (JSON)                                                                                                    | Autenticación         |
|--------|-------------------------------|-------------------------------------------|----------------------------------------------------------------------------------------------------------------|-----------------------|
| GET    | `/orders`                    | Obtener todas las órdenes del usuario     | _N/A_                                                                                                          | Sí (Bearer)           |
| GET    | `/orders/{orderId}`          | Obtener una orden por ID                 | _N/A_                                                                                                          | Sí (Bearer)           |
| POST   | `/orders`                    | Crear una nueva orden                     | `{ "items": [ { "productId": string, "quantity": number } ], "shippingAddress": { "street", "city", "state", "country", "zipCode" } }` | Sí (Bearer)           |
| PUT    | `/orders/{orderId}/status`   | Actualizar estado de una orden (Admin)    | `{ "status": string }` (por ejemplo `"SHIPPED"`)                                                               | Sí (Bearer, Admin)    |
| POST   | `/orders/{orderId}/cancel`   | Cancelar una orden                        | _N/A_                                                                                                          | Sí (Bearer)           |

---

## Notas finales

- **Autenticación Bearer**: Se asume que se debe enviar un token JWT en el header `Authorization: Bearer <token>`.
- **Parámetros en la ruta**: En los endpoints que incluyen `{productId}`, `{categoryId}`, `{orderId}`, `{userId}`, reemplázalos por los valores reales al momento de hacer la petición.
- **Campos opcionales**: En los endpoints de actualización (PUT), puedes enviar solo los campos que desees actualizar, siempre y cuando tu implementación en backend lo permita.

¡Y listo! Con esta tabla Markdown tienes un resumen de todos los endpoints, sus métodos, descripciones y requisitos de autenticación.
