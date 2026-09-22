-- Script de actualización para implementar Docturno Clone

-- 1. Modificar tabla usuarios para incluir nuevos datos de perfil
ALTER TABLE usuarios 
    ADD COLUMN apellido VARCHAR(100) NULL AFTER nombre,
    ADD COLUMN dni VARCHAR(20) NULL UNIQUE AFTER apellido,
    ADD COLUMN fecha_nacimiento DATE NULL AFTER dni;

-- 2. Asegurar que la tabla obras_sociales exista
CREATE TABLE IF NOT EXISTS obras_sociales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE
);

-- 3. Modificar la tabla de turnos para vincular la obra social
ALTER TABLE turnos 
    ADD COLUMN obra_social_id INT NULL AFTER especialidad_id,
    ADD FOREIGN KEY (obra_social_id) REFERENCES obras_sociales(id) ON DELETE SET NULL;

-- 4. Modificar la tabla turnos para aguantar nuevos estados si es necesario
ALTER TABLE turnos 
    MODIFY COLUMN estado ENUM('libre', 'pendiente', 'confirmado', 'asistio', 'ausente', 'cancelado') DEFAULT 'libre';

-- 5. Hacer que paciente_id sea NULL para permitir slots libres
ALTER TABLE turnos MODIFY paciente_id INT NULL;
