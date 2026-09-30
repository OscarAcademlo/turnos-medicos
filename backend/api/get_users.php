<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

include_once '../config/database.php';

// Validar que sea admin, superadmin o recepcionista
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['rol'], ['superadmin', 'admin', 'recepcionista'])) {
    http_response_code(403);
    echo json_encode(["message" => "Acceso denegado. No tienes permisos para ver usuarios."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Auto-healing para asegurar columnas necesarias en tabla usuarios
try {
    $colsDni = $db->query("SHOW COLUMNS FROM usuarios LIKE 'dni'")->fetchAll();
    if(empty($colsDni)) {
        $db->exec("ALTER TABLE usuarios ADD COLUMN dni VARCHAR(20) NULL");
    }
    $colsFn = $db->query("SHOW COLUMNS FROM usuarios LIKE 'fecha_nacimiento'")->fetchAll();
    if(empty($colsFn)) {
        $db->exec("ALTER TABLE usuarios ADD COLUMN fecha_nacimiento DATE NULL");
    }
    $colsOs = $db->query("SHOW COLUMNS FROM usuarios LIKE 'obra_social_id'")->fetchAll();
    if(empty($colsOs)) {
        $db->exec("ALTER TABLE usuarios ADD COLUMN obra_social_id INT NULL");
    }
    $colsPl = $db->query("SHOW COLUMNS FROM usuarios LIKE 'plan_id'")->fetchAll();
    if(empty($colsPl)) {
        $db->exec("ALTER TABLE usuarios ADD COLUMN plan_id INT NULL");
    }
} catch(Throwable $e) {}

try {
    $filtroRol = isset($_GET['rol']) ? trim($_GET['rol']) : 'paciente';
    
    // Por defecto y para separar médicos de usuarios, traemos únicamente los pacientes (usuarios que sacan turnos)
    $whereRol = "WHERE u.rol = 'paciente'";
    if ($filtroRol === 'todos') {
        $whereRol = "WHERE u.rol != 'medico'"; // Médicos tienen su propia sección ('Gestión de Médicos')
    } elseif ($filtroRol !== '' && $filtroRol !== 'paciente') {
        $whereRol = "WHERE u.rol = :rol";
    }

    $query = "
        SELECT u.id, u.nombre, u.apellido, u.dni, u.fecha_nacimiento, u.email, u.telefono, u.rol, u.creado_en,
               u.obra_social_id, os.nombre as obra_social_nombre,
               u.plan_id, p.nombre as plan_nombre
        FROM usuarios u
        LEFT JOIN obras_sociales os ON u.obra_social_id = os.id
        LEFT JOIN planes_obras_sociales p ON u.plan_id = p.id
        {$whereRol}
        ORDER BY u.creado_en DESC, u.id DESC
    ";
    $stmt = $db->prepare($query);
    if ($filtroRol !== 'todos' && $filtroRol !== '' && $filtroRol !== 'paciente') {
        $stmt->bindParam(":rol", $filtroRol);
    }
    $stmt->execute();
    
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["usuarios" => $usuarios]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener usuarios: " . $e->getMessage()]);
}
?>
