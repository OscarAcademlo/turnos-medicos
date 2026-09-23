<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

$paciente_id = 1;
$is_admin = true;

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

    $stmt = $db->prepare($query_base . " ORDER BY t.fecha DESC, t.hora_inicio DESC");
    $stmt->execute();
    $turnos_admin = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt2 = $db->prepare($query_base . " WHERE t.paciente_id = :paciente_id ORDER BY t.fecha DESC, t.hora_inicio DESC");
    $stmt2->bindParam(":paciente_id", $paciente_id);
    $stmt2->execute();
    $turnos_paciente = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "admin_count" => count($turnos_admin),
        "paciente_count" => count($turnos_paciente),
        "sample" => $turnos_admin[0] ?? null
    ], JSON_PRETTY_PRINT);
} catch(Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
