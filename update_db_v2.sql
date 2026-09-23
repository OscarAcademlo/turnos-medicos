-- v2: Unidades de Atención + Horarios con Unidad + fix especialidad_id nullable en turnos
-- Ejecutar en la base de datos oscarsoft_turnos

-- 1. Tabla de Unidades de Atención (Consultorios/Sedes)
CREATE TABLE IF NOT EXISTS unidades_atencion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    calle VARCHAR(150) NULL,
    numero VARCHAR(20) NULL,
    localidad VARCHAR(100) NULL,
    activa TINYINT(1) DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Agregar unidad_id a la tabla horarios_medicos (si no existe)
ALTER TABLE horarios_medicos 
    ADD COLUMN IF NOT EXISTS unidad_id INT NULL;

ALTER TABLE horarios_medicos
    ADD CONSTRAINT fk_horarios_unidad
    FOREIGN KEY (unidad_id) REFERENCES unidades_atencion(id) ON DELETE SET NULL;

-- 3. Hacer especialidad_id nullable en turnos (algunos médicos pueden no tener especialidad)
ALTER TABLE turnos 
    MODIFY COLUMN especialidad_id INT NULL;
