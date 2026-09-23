-- Script de actualización para implementar Docturno Clone

-- 1. Modificar tabla usuarios para incluir nuevos datos de perfil (YA EJECUTADO)
-- ALTER TABLE usuarios 
--    ADD COLUMN apellido VARCHAR(100) NULL AFTER nombre,
--    ADD COLUMN dni VARCHAR(20) NULL UNIQUE AFTER apellido,
--    ADD COLUMN fecha_nacimiento DATE NULL AFTER dni,
--    ADD COLUMN contrasena VARCHAR(255) NULL AFTER firebase_uid;

-- 2. Asegurar que la tabla obras_sociales exista (YA EJECUTADO)
-- CREATE TABLE IF NOT EXISTS obras_sociales (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     nombre VARCHAR(255) NOT NULL UNIQUE
-- );

-- 3. Modificar la tabla de turnos para vincular la obra social (YA EJECUTADO)
-- ALTER TABLE turnos 
--     ADD COLUMN obra_social_id INT NULL AFTER especialidad_id,
--     ADD FOREIGN KEY (obra_social_id) REFERENCES obras_sociales(id) ON DELETE SET NULL;

-- 4. Crear tabla de planes_obras_sociales
CREATE TABLE IF NOT EXISTS planes_obras_sociales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    obra_social_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    FOREIGN KEY (obra_social_id) REFERENCES obras_sociales(id) ON DELETE CASCADE
);

-- 5. Agregar plan a turnos
ALTER TABLE turnos 
    ADD COLUMN plan_id INT NULL AFTER obra_social_id,
    ADD FOREIGN KEY (plan_id) REFERENCES planes_obras_sociales(id) ON DELETE SET NULL;

-- 6. Modificar la tabla turnos para aguantar nuevos estados si es necesario
ALTER TABLE turnos 
    MODIFY COLUMN estado ENUM('libre', 'pendiente', 'confirmado', 'asistio', 'ausente', 'cancelado') DEFAULT 'libre';

-- 7. Hacer que paciente_id sea NULL para permitir slots libres
ALTER TABLE turnos MODIFY paciente_id INT NULL;
