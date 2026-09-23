<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array("message" => "Debe iniciar sesión para guardar un turno."));
    exit();
}

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->medico_id) &&
    !empty($data->fecha) &&
    !empty($data->hora)
) {
    try {
        $paciente_id = $_SESSION['user_id'];
        
        // Determinar especialidad_id (puede ser null si el médico no tiene especialidad)
        $especialidad_id = (isset($data->especialidad_id) && is_numeric($data->especialidad_id)) ? $data->especialidad_id : null;
        
        // Determinar cobertura_id y plan_id
        $cobertura_id = (isset($data->cobertura_id) && is_numeric($data->cobertura_id)) ? $data->cobertura_id : null;
        $plan_id = (isset($data->plan_id) && is_numeric($data->plan_id)) ? $data->plan_id : null;
        
        // Calcular hora_fin (asumimos 30 minutos por defecto si no hay info)
        $hora_inicio = $data->hora;
        $time = strtotime($hora_inicio);
        $hora_fin = date("H:i", strtotime('+30 minutes', $time));

        $query = "INSERT INTO turnos (
                    medico_id, paciente_id, especialidad_id, obra_social_id, plan_id, 
                    fecha, hora_inicio, hora_fin, estado
                  ) VALUES (
                    :medico_id, :paciente_id, :especialidad_id, :obra_social_id, :plan_id, 
                    :fecha, :hora_inicio, :hora_fin, 'confirmado'
                  )";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":medico_id", $data->medico_id);
        $stmt->bindParam(":paciente_id", $paciente_id);
        $stmt->bindParam(":especialidad_id", $especialidad_id, PDO::PARAM_INT);
        
        $stmt->bindParam(":obra_social_id", $cobertura_id, PDO::PARAM_INT);
        $stmt->bindParam(":plan_id", $plan_id, PDO::PARAM_INT);
        
        $stmt->bindParam(":fecha", $data->fecha);
        $stmt->bindParam(":hora_inicio", $hora_inicio);
        $stmt->bindParam(":hora_fin", $hora_fin);

        if($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "Turno guardado exitosamente."));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo guardar el turno."));
        }
    } catch(PDOException $e) {
        // En caso de duplicado (uq_medico_fecha_hora) u otro error
        http_response_code(400);
        echo json_encode(array("message" => "Error al guardar el turno. Es posible que el horario ya no esté disponible.", "error" => $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Datos incompletos."));
}
?>
