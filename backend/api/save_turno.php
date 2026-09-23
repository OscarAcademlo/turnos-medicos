<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

// 1. Auto-autenticar por firebase_uid o email si la sesión PHP expiró o no se sincronizó
if (!isset($_SESSION['user_id'])) {
    if (!empty($data->firebase_uid) || !empty($data->email)) {
        try {
            $stmt_u = $db->prepare("SELECT id, rol, nombre FROM usuarios WHERE (firebase_uid = :fuid AND :fuid != '') OR (email = :email AND :email != '') LIMIT 1");
            $stmt_u->execute([
                ':fuid' => $data->firebase_uid ?? '',
                ':email' => $data->email ?? ''
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
    echo json_encode(array("message" => "Debe iniciar sesión para guardar un turno."));
    exit();
}

if(
    !empty($data->medico_id) &&
    !empty($data->fecha) &&
    !empty($data->hora)
) {
    try {
        $paciente_id = $_SESSION['user_id'];
        
        // Determinar especialidad_id (puede ser null si el médico no tiene especialidad)
        $especialidad_id = (isset($data->especialidad_id) && is_numeric($data->especialidad_id)) ? intval($data->especialidad_id) : null;
        if ($especialidad_id === null) {
            // Buscar la primera especialidad del médico
            $stmt_esp = $db->prepare("SELECT especialidad_id FROM medicos_especialidades WHERE usuario_id = :med_id LIMIT 1");
            $stmt_esp->execute([':med_id' => $data->medico_id]);
            $esp_row = $stmt_esp->fetch(PDO::FETCH_ASSOC);
            if ($esp_row) {
                $especialidad_id = intval($esp_row['especialidad_id']);
            } else {
                // Fallback a especialidad 1
                $especialidad_id = 1;
            }
        }
        
        // Determinar cobertura_id y plan_id
        $cobertura_id = (isset($data->cobertura_id) && is_numeric($data->cobertura_id)) ? intval($data->cobertura_id) : null;
        $plan_id = (isset($data->plan_id) && is_numeric($data->plan_id)) ? intval($data->plan_id) : null;
        
        // Auto-healing: agregar columna unidad_id si no existe
        try {
            $cols = $db->query("SHOW COLUMNS FROM turnos LIKE 'unidad_id'")->fetchAll();
            if(empty($cols)) {
                $db->exec("ALTER TABLE turnos ADD COLUMN unidad_id INT NULL");
            }
        } catch(Throwable $e) {}

        // Determinar unidad_id (sede)
        $unidad_id = (isset($data->unidad_id) && is_numeric($data->unidad_id)) ? intval($data->unidad_id) : null;
        if ($unidad_id === null) {
            // Buscar la unidad_id asociada al médico en ese día o en general
            $stmt_un = $db->prepare("SELECT unidad_id FROM horarios_medicos WHERE medico_id = :med_id AND unidad_id IS NOT NULL LIMIT 1");
            $stmt_un->execute([':med_id' => $data->medico_id]);
            $un_row = $stmt_un->fetch(PDO::FETCH_ASSOC);
            if ($un_row) {
                $unidad_id = intval($un_row['unidad_id']);
            }
        }

        // Calcular hora_fin acorde a la duración del turno
        $hora_inicio = $data->hora;
        $duracion = 30;
        try {
            $stmt_dur = $db->prepare("SELECT duracion_turno_minutos FROM horarios_medicos WHERE medico_id = :med_id LIMIT 1");
            $stmt_dur->execute([':med_id' => $data->medico_id]);
            $dur_row = $stmt_dur->fetch(PDO::FETCH_ASSOC);
            if ($dur_row && !empty($dur_row['duracion_turno_minutos'])) {
                $duracion = intval($dur_row['duracion_turno_minutos']);
            }
        } catch(Throwable $e) {}

        $time = strtotime($hora_inicio);
        $hora_fin = date("H:i:s", strtotime("+{$duracion} minutes", $time));

        $query = "INSERT INTO turnos (
                    medico_id, paciente_id, especialidad_id, obra_social_id, plan_id, unidad_id,
                    fecha, hora_inicio, hora_fin, estado
                  ) VALUES (
                    :medico_id, :paciente_id, :especialidad_id, :obra_social_id, :plan_id, :unidad_id,
                    :fecha, :hora_inicio, :hora_fin, 'confirmado'
                  )";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":medico_id", $data->medico_id, PDO::PARAM_INT);
        $stmt->bindParam(":paciente_id", $paciente_id, PDO::PARAM_INT);
        $stmt->bindParam(":especialidad_id", $especialidad_id, PDO::PARAM_INT);
        
        $stmt->bindParam(":obra_social_id", $cobertura_id, PDO::PARAM_INT);
        $stmt->bindParam(":plan_id", $plan_id, PDO::PARAM_INT);
        $stmt->bindParam(":unidad_id", $unidad_id, PDO::PARAM_INT);
        
        $stmt->bindParam(":fecha", $data->fecha);
        $stmt->bindParam(":hora_inicio", $hora_inicio);
        $stmt->bindParam(":hora_fin", $hora_fin);

        if($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array(
                "status" => "success",
                "message" => "Turno guardado exitosamente.",
                "turno_id" => $db->lastInsertId()
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("status" => "error", "message" => "No se pudo guardar el turno en la base de datos."));
        }
    } catch(PDOException $e) {
        http_response_code(400);
        echo json_encode(array(
            "status" => "error",
            "message" => "Error al guardar el turno. Es posible que el horario ya esté reservado.",
            "error" => $e->getMessage()
        ));
    } catch(Throwable $e) {
        http_response_code(500);
        echo json_encode(array(
            "status" => "error",
            "message" => "Error interno en el servidor: " . $e->getMessage()
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array("status" => "error", "message" => "Datos incompletos para reservar el turno."));
}
