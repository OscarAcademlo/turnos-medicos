<?php
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

// Verificar el último usuario paciente para probar
$user = $db->query("SELECT id, email, rol FROM usuarios WHERE rol = 'paciente' LIMIT 1")->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    // Si no hay paciente, buscar cualquier usuario
    $user = $db->query("SELECT id, email, rol FROM usuarios LIMIT 1")->fetch(PDO::FETCH_ASSOC);
}

// Simulamos la inserción que hace save_turno.php
$paciente_id = $user['id'];
$medico_id = 1092;
$fecha = "2026-09-28";
$hora_inicio = "08:00";
$hora_fin = "08:40";

try {
    $stmt = $db->prepare("
        INSERT INTO turnos (
            medico_id, paciente_id, especialidad_id, obra_social_id, plan_id, unidad_id,
            fecha, hora_inicio, hora_fin, estado
        ) VALUES (
            :medico_id, :paciente_id, :especialidad_id, :obra_social_id, :plan_id, :unidad_id,
            :fecha, :hora_inicio, :hora_fin, 'confirmado'
        )
    ");
    
    $esp_id = 26;
    $os_id = null;
    $plan_id = null;
    $u_id = 1;

    $stmt->bindParam(":medico_id", $medico_id);
    $stmt->bindParam(":paciente_id", $paciente_id);
    $stmt->bindParam(":especialidad_id", $esp_id, PDO::PARAM_INT);
    $stmt->bindParam(":obra_social_id", $os_id, PDO::PARAM_INT);
    $stmt->bindParam(":plan_id", $plan_id, PDO::PARAM_INT);
    $stmt->bindParam(":unidad_id", $u_id, PDO::PARAM_INT);
    $stmt->bindParam(":fecha", $fecha);
    $stmt->bindParam(":hora_inicio", $hora_inicio);
    $stmt->bindParam(":hora_fin", $hora_fin);

    $ok = $stmt->execute();
    $insert_id = $db->lastInsertId();

    echo json_encode([
        "insert_ok" => $ok,
        "insert_id" => $insert_id,
        "user_tested" => $user
    ], JSON_PRETTY_PRINT);

} catch(Throwable $e) {
    echo json_encode([
        "error" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
