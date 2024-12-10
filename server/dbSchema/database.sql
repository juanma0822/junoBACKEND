-- CREATE DATABASE Juno;

CREATE TABLE FotoPerfil (
    id_foto SERIAL PRIMARY KEY,           -- Identificador único para cada foto
    nombre_foto VARCHAR(255) UNIQUE NOT NULL,  -- Nombre único de la foto (ej. avatar1, avatar2)
    referencia_foto VARCHAR(500) NOT NULL     -- Ruta o string de la foto
);
INSERT INTO FotoPerfil (nombre_foto, referencia_foto) 
VALUES
    ('zorro', '/ava1.png'),
    ('juno', '/logos.png'),
    ('gatoFeliz', '/gatoFeliz.png'),
    ('perroFeliz', '/perroFeliz.png'),
    ('conejoFeliz', '/conejoFeliz.png'),
    ('vacaFeliz', '/vacaFeliz.png');

-- Tabla Usuario
CREATE TABLE Usuario (
    correo_electronico VARCHAR(255) PRIMARY KEY,
    nombre_usuario VARCHAR(255) UNIQUE NOT NULL,
    nombre_real VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    contraseña VARCHAR(100) NOT NULL,
    sexo VARCHAR(10),
    hora_alerta TIME,
    racha_max INT DEFAULT 0,
    id_foto INT, 
    FOREIGN KEY (id_foto) REFERENCES FotoPerfil(id_foto) -- Clave foránea
);



-- Tabla Amistad
CREATE TABLE Amistad (
    id_amistad SERIAL PRIMARY KEY,
    estado VARCHAR(50) DEFAULT 'pendiente',  -- Valor por defecto 'pendiente'
    fecha_creacion DATE DEFAULT CURRENT_DATE, -- Fecha actual por defecto
    correo_usuario_envia VARCHAR(255), 
    correo_usuario_recibe VARCHAR(255), 
    FOREIGN KEY (correo_usuario_envia) REFERENCES Usuario(correo_electronico),
    FOREIGN KEY (correo_usuario_recibe) REFERENCES Usuario(correo_electronico)
);

-- Tabla Evento
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    descripcion TEXT,
    emocion VARCHAR(50),
    fechaini TIMESTAMP WITH TIME ZONE NOT NULL,
    fechafin TIMESTAMP WITH TIME ZONE NOT NULL,
    correo_usuario VARCHAR(255),
    FOREIGN KEY (correo_usuario) REFERENCES Usuario(correo_electronico)
);

-- Tabla Publicacion
CREATE TABLE Publicacion (
    id_publicacion SERIAL PRIMARY KEY,
    contenido TEXT NOT NULL,
    emocion_asociada VARCHAR(50),
    fecha_evento DATE,
    correo_usuario VARCHAR(255),
    username VARCHAR(255),
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
