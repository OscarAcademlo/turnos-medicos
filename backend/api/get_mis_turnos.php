<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Debe iniciar sesión para ver sus turnos."));
    exit();
}

$database = new Database();
$db = $database->getConnection();

$paciente_id = $_SESSION['user_id'];

$query = "
    SELECT 
        t.id, t.fecha, t.hora_inicio, t.estado,
        u.nombre as medico_nombre,
        u.apellido as medico_apellido,
        e.nombre as especialidad_nombre,
        o.nombre as obra_social_nombre,
        p.nombre as plan_nombre
    FROM turnos t
    JOIN usuarios u ON t.medico_id = u.id
    JOIN especialidades e ON t.especialidad_id = e.id
    LEFT JOIN obras_sociales o ON t.obra_social_id = o.id
    LEFT JOIN planes_obras_sociales p ON t.plan_id = p.id
    WHERE t.paciente_id = :paciente_id
    ORDER BY t.fecha DESC, t.hora_inicio DESC
";

$stmt = $db->prepare($query);
$stmt->bindParam(":paciente_id", $paciente_id);
$stmt->execute();

$turnos = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($turnos);
?>
