-- database/init.sql

-- 1. Tipos ENUM para roles y estados de ficha
CREATE TYPE rol_usuario AS ENUM ('ADMINISTRADOR', 'MEDICO', 'ESTUDIANTE');
CREATE TYPE estado_ficha AS ENUM ('PENDIENTE', 'ATENDIDO', 'CANCELADO');

-- 2. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    codigo_sis VARCHAR(20) UNIQUE,
    ci VARCHAR(20) NOT NULL UNIQUE,
    celular VARCHAR(20),
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'ESTUDIANTE',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de médico
CREATE TABLE IF NOT EXISTS medicos (
    id_medico    INT PRIMARY KEY,
    especialidad VARCHAR(80) NOT NULL,
    consultorio  VARCHAR(30),
    matricula    VARCHAR(30) UNIQUE,
    CONSTRAINT fk_medico_usuario FOREIGN KEY (id_medico)
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 3. Tabla de Fechas Disponibles
CREATE TABLE IF NOT EXISTS fechas_disponibles (
    id_fecha SERIAL PRIMARY KEY,
    id_medico INT NOT NULL,
    fecha DATE NOT NULL,
    CONSTRAINT fk_fecha_medico FOREIGN KEY (id_medico) 
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT uq_medico_fecha UNIQUE (id_medico, fecha)
);

-- 4. Tabla de Horarios
CREATE TABLE IF NOT EXISTS horarios (
    id_horario SERIAL PRIMARY KEY,
    id_fecha INT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CONSTRAINT fk_horario_fecha FOREIGN KEY (id_fecha) 
        REFERENCES fechas_disponibles(id_fecha) ON DELETE CASCADE,
    CONSTRAINT chk_rango_horas CHECK (hora_fin > hora_inicio)
);

-- 5. Tabla de Fichas Médicas
CREATE TABLE IF NOT EXISTS fichas (
    id_ficha SERIAL PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_medico INT NOT NULL,
    id_fecha INT NOT NULL,
    id_horario INT NOT NULL UNIQUE,
    estado estado_ficha NOT NULL DEFAULT 'PENDIENTE',
    sintomas_paciente TEXT,
    diagnostico TEXT,
    receta TEXT,
    examenes_laboratorio TEXT,
    resultados_examenes_laboratorio TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ficha_estudiante FOREIGN KEY (id_estudiante) 
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_ficha_medico FOREIGN KEY (id_medico) 
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_ficha_fecha FOREIGN KEY (id_fecha) 
        REFERENCES fechas_disponibles(id_fecha) ON DELETE CASCADE,
    CONSTRAINT fk_ficha_horario FOREIGN KEY (id_horario) 
        REFERENCES horarios(id_horario) ON DELETE CASCADE
);

-- Insertar usuario Administrador por defecto (Contraseña en hash bcrypt provisional)
-- NOTA: El hash a continuación corresponde a la contraseña "admin123"
INSERT INTO usuarios (ci, nombres, apellido_paterno, correo, contrasena, rol)
VALUES ('1234567', 'Admin', 'SSU', 'admin@ssu.edu.bo', '$2a$10$E8zU344/BglXp9f/C39Wuu5MBy8qQ4Z./w4SjH0qfB0uE2Jz6b5eK', 'ADMINISTRADOR');