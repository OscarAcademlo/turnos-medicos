-- Base de Datos: oscarsoft_turnos

CREATE DATABASE IF NOT EXISTS oscarsoft_turnos;
USE oscarsoft_turnos;

-- Tabla de Usuarios
-- roles: superadmin, admin, recepcionista, medico, paciente
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol ENUM('superadmin', 'admin', 'recepcionista', 'medico', 'paciente') DEFAULT 'paciente',
    telefono VARCHAR(20) NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Especialidades (Fonoaudiólogo, Kinesiólogo, etc.)
CREATE TABLE IF NOT EXISTS especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NULL
);

-- Tabla Relacional: Médicos y sus Especialidades
CREATE TABLE IF NOT EXISTS medicos_especialidades (
    usuario_id INT NOT NULL,
    especialidad_id INT NOT NULL,
    PRIMARY KEY (usuario_id, especialidad_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (especialidad_id) REFERENCES especialidades(id) ON DELETE CASCADE
);

-- Tabla de Horarios/Disponibilidad de los Médicos (Simplificada)
CREATE TABLE IF NOT EXISTS horarios_medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medico_id INT NOT NULL,
    dia_semana ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_turno_minutos INT DEFAULT 30,
    FOREIGN KEY (medico_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de Turnos (Citas)
CREATE TABLE IF NOT EXISTS turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medico_id INT NOT NULL,
    paciente_id INT NOT NULL,
    especialidad_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado ENUM('pendiente', 'confirmado', 'asistio', 'ausente', 'cancelado') DEFAULT 'pendiente',
    notas TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medico_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (especialidad_id) REFERENCES especialidades(id) ON DELETE RESTRICT,
    -- Evitar que un médico tenga dos turnos a la misma hora exacta
    UNIQUE KEY uq_medico_fecha_hora (medico_id, fecha, hora_inicio)
);

-- Insertar algunas especialidades de prueba
INSERT IGNORE INTO especialidades (nombre) VALUES 
('Fonoaudiología'), 
('Kinesiología'), 
('Psicología'), 
('Medicina General');

-- NOTA: El primer usuario (Tú) deberá ser registrado desde la app, 
-- y luego deberás cambiar manualmente su rol a 'superadmin' en esta base de datos 
-- ejecutando: UPDATE usuarios SET rol = 'superadmin' WHERE email = 'tu_email@gmail.com';
