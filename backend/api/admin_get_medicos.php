<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

if (!isset($_SESSION['user_id']) || !in_array($_SESSION['rol'], ['superadmin', 'admin', 'recepcionista'])) {
    http_response_code(403);
    echo json_encode(array("message" => "Acceso denegado."));
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Auto-healing: crear tabla si no existe (evita errores de JOIN)
try {
    $db->exec("CREATE TABLE IF NOT EXISTS unidades_atencion (
        id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(150) NOT NULL,
        calle VARCHAR(150) NULL, numero VARCHAR(20) NULL, localidad VARCHAR(100) NULL,
        activa TINYINT(1) DEFAULT 1, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $cols = $db->query("SHOW COLUMNS FROM horarios_medicos LIKE 'unidad_id'")->fetchAll();
    if(empty($cols)) {
        $db->exec("ALTER TABLE horarios_medicos ADD COLUMN unidad_id INT NULL");
    }
} catch(Exception $e) { /* silencioso */ }

// Traer todos los usuarios que son médicos + su especialidad
$query = "
    SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil, u.biografia, u.direccion, u.matricula,
           e.id as especialidad_id, e.nombre as especialidad_nombre
    FROM usuarios u
    LEFT JOIN medicos_especialidades me ON u.id = me.usuario_id
    LEFT JOIN especialidades e ON me.especialidad_id = e.id
    WHERE u.rol = 'medico'
    ORDER BY u.nombre ASC
";
$stmt = $db->prepare($query);
$stmt->execute();
$medicos = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Para cada médico, traer sus planes y horarios
foreach($medicos as &$medico) {
    // Planes aceptados
    $q_planes = "SELECT plan_id FROM medicos_planes WHERE usuario_id = :id";
    $s_planes = $db->prepare($q_planes);
    $s_planes->bindParam(":id", $medico['id']);
    $s_planes->execute();
    $medico['planes'] = $s_planes->fetchAll(PDO::FETCH_COLUMN);

    // Horarios
    $q_h = "
        SELECT h.id, h.dia_semana, h.hora_inicio, h.hora_fin, h.duracion_turno_minutos, h.unidad_id, ua.nombre as unidad_nombre
        FROM horarios_medicos h
        LEFT JOIN unidades_atencion ua ON h.unidad_id = ua.id
        WHERE h.medico_id = :id
        ORDER BY FIELD(h.dia_semana,'Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo')
    ";
    $s_h = $db->prepare($q_h);
    $s_h->bindParam(":id", $medico['id']);
    $s_h->execute();
    $medico['horarios'] = $s_h->fetchAll(PDO::FETCH_ASSOC);
}

echo json_encode($medicos);
?>
