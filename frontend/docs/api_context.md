| **Nombre**                    | **Método** | **Endpoint**                      | **Headers**                                                          | **Body (ejemplo)**                                                                                                                   | **Descripción**                          |
|-------------------------------|------------|-----------------------------------|-----------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| **Registro de usuario**       | `POST`     | `{{baseUrl}}/auth/register`       | `Content-Type: application/json`                                      | ```json
{
  "email": "{{email}}",
  "password": "{{password}}",
  "username": "{{username}}",
  "fullName": "{{fullName}}"
}
```                                                                                                                         | Registra un nuevo usuario.                      |
| **Login**                     | `POST`     | `{{baseUrl}}/auth/login`          | `Content-Type: application/json`                                      | ```json
{
  "username": "{{username}}",
  "password": "{{password}}"
}
```                                                                                                                         | Inicia sesión y obtiene el token de acceso.     |
| **Obtener perfil del usuario**| `GET`      | `{{baseUrl}}/auth/profile`        | `Authorization: Bearer {{authToken}}`<br>`Content-Type: application/json` | *N/A*                                                                                                                             | Retorna el perfil del usuario actual.     |
| **Actualizar perfil**         | `PUT`      | `{{baseUrl}}/users/profile`       | `Authorization: Bearer {{authToken}}`<br>`Content-Type: application/json` | ```json
{
  "fullName": "Updated Test User",
  "email": "updated@example.com"
}
```                                                                                                                         | Actualiza los datos del perfil del usuario.     |
| **Refrescar token**           | `POST`     | `{{baseUrl}}/auth/refresh`        | `Content-Type: application/json`                                      | *N/A*                                                                                                                             | Solicita un nuevo token de acceso.        |
| **Logout**                    | `POST`     | `{{baseUrl}}/auth/logout`         | `Authorization: Bearer {{authToken}}`<br>`Content-Type: application/json` | *N/A*                                                                                                                             | Cierra la sesión e invalida el token.     |
