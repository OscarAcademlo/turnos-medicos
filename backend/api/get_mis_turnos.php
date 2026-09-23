<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// 1. Auto-autenticar por firebase_uid o email si la sesión PHP expiró
if (!isset($_SESSION['user_id'])) {
    $fuid = isset($_GET['firebase_uid']) ? trim($_GET['firebase_uid']) : '';
    $email = isset($_GET['email']) ? trim($_GET['email']) : '';
    
    if (!empty($fuid) || !empty($email)) {
        try {
            $stmt_u = $db->prepare("SELECT id, rol, nombre FROM usuarios WHERE (firebase_uid = :fuid AND :fuid != '') OR (email = :email AND :email != '') LIMIT 1");
            $stmt_u->execute([
                ':fuid' => $fuid,
                ':email' => $email
            ]);
            $u_row = $stmt_u->fetch(PDO::FETCH_ASSOC);
            if ($u_row) {
                $_SESSION['user_id'] = $u_row['id'];
                $_SESSION['rol'] = $u_row['rol'];
                $_SESSION['nombre'] = $u_row['nombre'];
            }
        } catch(Throwable $e) {}
    }
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array("error" => "unauthorized", "message" => "Debe iniciar sesión para ver sus turnos."));
    exit();
}

$paciente_id = $_SESSION['user_id'];
$is_admin = in_array($_SESSION['rol'] ?? '', ['superadmin', 'admin', 'recepcionista']);

// 2. Auto-healing silencioso
try {
    $db->exec("CREATE TABLE IF NOT EXISTS unidades_atencion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        calle VARCHAR(150) NULL,
        numero VARCHAR(20) NULL,
        localidad VARCHAR(100) NULL,
        activa TINYINT(1) DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $cols = $db->query("SHOW COLUMNS FROM turnos LIKE 'unidad_id'")->fetchAll();
    if(empty($cols)) {
        $db->exec("ALTER TABLE turnos ADD COLUMN unidad_id INT NULL");
    }
} catch(Throwable $e) { /* silencioso */ }

try {
    $query_base = "
        SELECT 
            t.id, t.fecha, t.hora_inicio, t.estado,
            u.nombre as medico_nombre,
            u.apellido as medico_apellido,
            COALESCE(e.nombre, 'Consulta General') as especialidad_nombre,
            o.nombre as obra_social_nombre,
            p.nombre as plan_nombre,
            pac.nombre as paciente_nombre,
            pac.apellido as paciente_apellido,
            uat.nombre as sede_nombre,
            uat.calle as sede_calle,
            uat.numero as sede_numero
        FROM turnos t
        LEFT JOIN usuarios u ON t.medico_id = u.id
        LEFT JOIN especialidades e ON t.especialidad_id = e.id
        LEFT JOIN obras_sociales o ON t.obra_social_id = o.id
        LEFT JOIN planes_obras_sociales p ON t.plan_id = p.id
        LEFT JOIN usuarios pac ON t.paciente_id = pac.id
        LEFT JOIN unidades_atencion uat ON t.unidad_id = uat.id
    ";

    if ($is_admin) {
        $query = $query_base . " ORDER BY t.fecha DESC, t.hora_inicio DESC";
        $stmt = $db->prepare($query);
    } else {
        $query = $query_base . " WHERE t.paciente_id = :paciente_id ORDER BY t.fecha DESC, t.hora_inicio DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":paciente_id", $paciente_id, PDO::PARAM_INT);
    }

    $stmt->execute();
    $turnos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($turnos ?: []);
} catch(Throwable $e) {
    // Fallback de contingencia si fallara cualquier JOIN
    try {
        $fallback_query = "
            SELECT 
                t.id, t.fecha, t.hora_inicio, t.estado,
                u.nombre as medico_nombre,
                u.apellido as medico_apellido,
                COALESCE(e.nombre, 'Consulta General') as especialidad_nombre,
                o.nombre as obra_social_nombre,
                p.nombre as plan_nombre,
                pac.nombre as paciente_nombre,
                pac.apellido as paciente_apellido
            FROM turnos t
            LEFT JOIN usuarios u ON t.medico_id = u.id
            LEFT JOIN especialidades e ON t.especialidad_id = e.id
            LEFT JOIN obras_sociales o ON t.obra_social_id = o.id
            LEFT JOIN planes_obras_sociales p ON t.plan_id = p.id
            LEFT JOIN usuarios pac ON t.paciente_id = pac.id
        ";
        if ($is_admin) {
            $stmt = $db->prepare($fallback_query . " ORDER BY t.fecha DESC, t.hora_inicio DESC");
        } else {
            $stmt = $db->prepare($fallback_query . " WHERE t.paciente_id = :paciente_id ORDER BY t.fecha DESC, t.hora_inicio DESC");
            $stmt->bindParam(":paciente_id", $paciente_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        $turnos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($turnos ?: []);
    } catch(Throwable $ex) {
        echo json_encode([]);
    }
}
