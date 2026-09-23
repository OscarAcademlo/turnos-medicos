<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

try {
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    // Probar el query exacto de get_mis_turnos.php
    $q_test = "
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
        LIMIT 5
    ";
    
    $query_error = null;
    try {
        $db->query($q_test);
        $query_ok = true;
    } catch(Throwable $qe) {
        $query_ok = false;
        $query_error = $qe->getMessage();
    }

    echo json_encode([
        "tables" => $tables,
        "query_ok" => $query_ok,
        "query_error" => $query_error
    ], JSON_PRETTY_PRINT);
} catch(Throwable $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
