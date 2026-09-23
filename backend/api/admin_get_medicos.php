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

// Traer todos los usuarios que son médicos
$query = "
    SELECT id, nombre, apellido, email, telefono, foto_perfil, biografia, direccion, matricula 
    FROM usuarios 
    WHERE rol = 'medico'
    ORDER BY nombre ASC
";
$stmt = $db->prepare($query);
$stmt->execute();
$medicos = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Para cada médico, traer sus planes
foreach($medicos as &$medico) {
    $q_planes = "SELECT plan_id FROM medicos_planes WHERE usuario_id = :id";
    $s_planes = $db->prepare($q_planes);
    $s_planes->bindParam(":id", $medico['id']);
    $s_planes->execute();
    $planes = $s_planes->fetchAll(PDO::FETCH_COLUMN);
    $medico['planes'] = $planes; // Array de IDs de planes que acepta
}

echo json_encode($medicos);
?>
