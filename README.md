---

# JUNO Backend

Bienvenido al backend de **JUNO**, una aplicación web diseñada para proporcionar apoyo emocional a través de un diario personal, un calendario para gestionar eventos, y funcionalidades para conectar con amigos y rastrear tu bienestar. Este backend está construido utilizando **Node.js**, **Express**, y **PostgreSQL**.

## Tabla de Contenidos
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación](#instalación)
- [Uso](#uso)
- [Rutas API](#rutas-api)
  - [Usuarios](#usuarios)
  - [Publicaciones](#publicaciones)
- [Contribución](#contribución)
- [Licencia](#licencia)

## Descripción del Proyecto

El backend de JUNO proporciona la infraestructura necesaria para manejar usuarios, eventos, publicaciones y frases motivacionales. Permite la gestión de cuentas de usuario, autenticación segura con contraseñas encriptadas, y manipulación de datos relacionados con las emociones y actividades diarias de los usuarios.

## Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución para JavaScript en el servidor.
- **Express**: Framework para construir la API del servidor.
- **PostgreSQL**: Sistema de gestión de bases de datos relacional para almacenar la información.
- **bcrypt**: Biblioteca para la encriptación de contraseñas.

## Instalación

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/tu_usuario/juno-backend.git
   cd juno-backend
   ```

2. **Instala las dependencias:**

   ```bash
   npm install
   ```

3. **Configura tu base de datos:**

   Crea un archivo `.env` en la raíz del proyecto con la configuración de tu base de datos:

   ```env
   DB_USER=postgres
   DB_PASSWORD=1234
   DB_HOST=localhost
   DB_PORT=5432
   DB_DATABASE=juno
   ```

4. **Inicia el servidor:**

   ```bash
   npm run dev
   ```

## Uso

El backend está configurado para escuchar en el puerto `5000` por defecto. Puedes interactuar con las rutas API para gestionar usuarios y publicaciones.

## Rutas API

### Usuarios

- **Crear Usuario**

  - **Método**: `POST`
  - **Ruta**: `/usuarios`
  - **Cuerpo de la Solicitud**:
    ```json
    {
      "correo_electronico": "ejemplo@dominio.com",
      "nombre_completo": "Nombre Apellido",
      "fecha_nacimiento": "1990-01-01",
      "telefono": "123456789",
      "ciudad": "Ciudad",
      "contraseña": "mi_contraseña",
      "sexo": "M/F",
      "hora_alerta": "09:00:00"
    }
    ```

- **Obtener Todos los Usuarios**

  - **Método**: `GET`
  - **Ruta**: `/usuarios`

- **Obtener Usuario por Correo Electrónico**

  - **Método**: `GET`
  - **Ruta**: `/usuarios/:correo_electronico`

- **Actualizar Usuario**

  - **Método**: `PUT`
  - **Ruta**: `/usuarios/:correo_electronico`
  - **Cuerpo de la Solicitud**:
    ```json
    {
      "nombre_completo": "Nombre Actualizado",
      "fecha_nacimiento": "1990-02-01",
      "telefono": "987654321",
      "ciudad": "Nueva Ciudad",
      "contraseña": "nueva_contraseña",
      "sexo": "M/F",
      "hora_alerta": "10:00:00"
    }
    ```

- **Eliminar Usuario**

  - **Método**: `DELETE`
  - **Ruta**: `/usuarios/:correo_electronico`

### Publicaciones

- **Crear Publicación**

  - **Método**: `POST`
  - **Ruta**: `/publicaciones`
  - **Cuerpo de la Solicitud**:
    ```json
    {
      "contenido": "Este es el contenido de la publicación",
      "emocion_asociada": "Feliz",
      "fecha_evento": "2024-09-01",
      "correo_usuario": "ejemplo@dominio.com"
    }
    ```

- **Obtener Todas las Publicaciones**

  - **Método**: `GET`
  - **Ruta**: `/publicaciones`

- **Obtener Publicación por ID**

  - **Método**: `GET`
  - **Ruta**: `/publicaciones/:id`

- **Actualizar Publicación**

  - **Método**: `PUT`
  - **Ruta**: `/publicaciones/:id`
  - **Cuerpo de la Solicitud**:
    ```json
    {
      "contenido": "Contenido actualizado",
      "emocion_asociada": "Triste",
      "fecha_evento": "2024-09-02"
    }
    ```

- **Eliminar Publicación**

  - **Método**: `DELETE`
  - **Ruta**: `/publicaciones/:id`

## Contribución

Las contribuciones son bienvenidas. Por favor, abre un *issue* o envía un *pull request* si tienes mejoras o correcciones.

## Licencia

Distribuido bajo la licencia MIT. Consulta el archivo [LICENSE](./LICENSE) para más detalles.

---
