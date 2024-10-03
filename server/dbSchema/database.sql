CREATE DATABASE Juno;

-- Tabla Usuario
CREATE TABLE Usuario (
    correo_electronico VARCHAR(255) PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    contraseña VARCHAR(100) NOT NULL,
    sexo VARCHAR(10),
    hora_alerta TIME
);

-- Tabla Amistad
CREATE TABLE Amistad (
    id_amistad SERIAL PRIMARY KEY,
    estado VARCHAR(50),
    fecha_creacion DATE,
    correo_usuario_envia VARCHAR(255), 
    correo_usuario_recibe VARCHAR(255), 
    FOREIGN KEY (correo_usuario_envia) REFERENCES Usuario(correo_electronico),
    FOREIGN KEY (correo_usuario_recibe) REFERENCES Usuario(correo_electronico)
);

-- Tabla Evento
CREATE TABLE Evento (
    id_evento SERIAL PRIMARY KEY,
    nombre_evento VARCHAR(255) NOT NULL,
    fecha_evento DATE,
    emocion_asociada VARCHAR(50),
    correo_usuario VARCHAR(255),
    FOREIGN KEY (correo_usuario) REFERENCES Usuario(correo_electronico)
);

-- Tabla Publicación
CREATE TABLE Publicacion (
    id_publicacion SERIAL PRIMARY KEY,
    contenido TEXT NOT NULL,
    emocion_asociada VARCHAR(50),
    fecha_evento DATE,
    correo_usuario VARCHAR(255),
    FOREIGN KEY (correo_usuario) REFERENCES Usuario(correo_electronico)
);

-- Tabla Frases
CREATE TABLE Frases (
    id_frase SERIAL PRIMARY KEY,
    texto_frase TEXT NOT NULL,
    emocion_asociada VARCHAR(50)
);

-- Tabla intermedia UsuarioFrases 
CREATE TABLE UsuarioFrases (
    correo_usuario VARCHAR(255),
    id_frase INT,
    PRIMARY KEY (correo_usuario, id_frase),
    FOREIGN KEY (correo_usuario) REFERENCES Usuario(correo_electronico),
    FOREIGN KEY (id_frase) REFERENCES Frases(id_frase)
);
