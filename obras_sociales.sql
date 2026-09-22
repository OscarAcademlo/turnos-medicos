-- Tabla de Obras Sociales
CREATE TABLE IF NOT EXISTS obras_sociales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE
);

-- Insertar algunas de ejemplo
INSERT IGNORE INTO obras_sociales (nombre) VALUES 
('OSDE'),
('Swiss Medical'),
('Galeno'),
('IOMA'),
('PAMI'),
('Particular (Sin Obra Social)');

-- Añadir columna obra_social_id a turnos si no existe
-- ALTER TABLE turnos ADD COLUMN obra_social_id INT NULL AFTER paciente_id;
-- ALTER TABLE turnos ADD FOREIGN KEY (obra_social_id) REFERENCES obras_sociales(id) ON DELETE SET NULL;
