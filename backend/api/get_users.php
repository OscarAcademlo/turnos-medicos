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

try {
    $query = "SELECT id, nombre, email, rol, telefono, creado_en FROM usuarios ORDER BY creado_en DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["usuarios" => $usuarios]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener usuarios."]);
}
?>
